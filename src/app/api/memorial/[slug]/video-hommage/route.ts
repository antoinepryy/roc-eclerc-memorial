import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderVideoHommage, downloadToFile, getMusicS3Url } from "@/lib/video-renderer";
import { uploadToS3 } from "@/lib/s3";
import { readFile, mkdir, rm } from "fs/promises";
import path from "path";

function formatDateFr(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON invalide" }, { status: 400 });
  }

  const { photoIds, template, musique, musiqueCustomUrl, texteOverlay } = body;

  if (!photoIds?.length || !template || (!musique && !musiqueCustomUrl)) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }
  if (photoIds.length > 20) {
    return NextResponse.json({ error: "Maximum 20 photos" }, { status: 400 });
  }

  // Vérifier le défunt
  const defunt = await prisma.defunt.findUnique({
    where: { slug, statut: "PUBLIE" },
    select: { id: true, prenom: true, nom: true, dateNaissance: true, dateDeces: true },
  });

  if (!defunt) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  // Récupérer les photos
  const medias: { id: string; url: string }[] = await prisma.media.findMany({
    where: { id: { in: photoIds }, defuntId: defunt.id, type: "PHOTO" },
    select: { id: true, url: true },
    orderBy: { ordre: "asc" },
  });

  if (medias.length === 0) {
    return NextResponse.json({ error: "Aucune photo trouvée" }, { status: 400 });
  }

  // Créer l'entrée vidéo en DB
  const video: { id: string } = await prisma.videoHommage.create({
    data: {
      defuntId: defunt.id,
      theme: template,
      musique,
      texteOverlay: texteOverlay || null,
      photoIds,
      statut: "EN_COURS",
    },
  });

  // Dossier de travail temporaire
  const workDir = path.join("/tmp", `video-${video.id}`);
  await mkdir(workDir, { recursive: true });

  try {
    // 1. Télécharger les photos depuis S3
    console.log(`[video] Downloading ${medias.length} photos...`);
    const photoLocalPaths: string[] = [];
    for (let i = 0; i < medias.length; i++) {
      const localPath = path.join(workDir, `photo-${i}.jpg`);
      if (medias[i].url.startsWith("http")) {
        await downloadToFile(medias[i].url, localPath);
      } else {
        // Fallback local
        const { copyFile } = await import("fs/promises");
        await copyFile(path.join(process.cwd(), "public", medias[i].url), localPath);
      }
      photoLocalPaths.push(localPath);
    }

    // 2. Télécharger la musique (prédéfinie ou custom)
    let musicLocalPath: string | null = null;
    try {
      const musicUrl = musiqueCustomUrl || getMusicS3Url(musique);
      musicLocalPath = path.join(workDir, "music.mp3");
      await downloadToFile(musicUrl, musicLocalPath);
      console.log(`[video] Music downloaded: ${musiqueCustomUrl ? "custom" : musique}`);
    } catch (e) {
      console.warn(`[video] Music not available, rendering without audio:`, e);
      musicLocalPath = null;
    }

    // 3. Rendu FFmpeg
    const outputPath = path.join(workDir, `hommage-${video.id}.mp4`);
    const fullName = `${defunt.prenom} ${defunt.nom}`;
    const dates = `${formatDateFr(defunt.dateNaissance)}${defunt.dateNaissance ? " — " : ""}${formatDateFr(defunt.dateDeces)}`;

    console.log(`[video] Rendering: ${fullName}, ${medias.length} photos, template=${template}`);

    await renderVideoHommage({
      photoLocalPaths,
      templateId: template,
      musicLocalPath,
      texteOverlay: texteOverlay || null,
      outputPath,
      defuntNom: fullName,
      defuntDates: dates,
    });

    // 4. Upload vidéo sur S3
    console.log(`[video] Uploading to S3...`);
    const videoBuffer = await readFile(outputPath);
    const s3Key = `videos/${slug}/hommage-${video.id}.mp4`;
    const videoUrl = await uploadToS3(s3Key, videoBuffer, "video/mp4");

    // 5. Mettre à jour la DB
    await prisma.videoHommage.update({
      where: { id: video.id },
      data: { statut: "TERMINE", videoUrl },
    });

    console.log(`[video] Done! ${videoUrl}`);

    return NextResponse.json({
      id: video.id,
      videoUrl,
      message: "Vidéo hommage générée avec succès",
    }, { status: 201 });

  } catch (err) {
    console.error("[video] Render failed:", err);

    await prisma.videoHommage.update({
      where: { id: video.id },
      data: { statut: "ERREUR" },
    });

    return NextResponse.json({
      error: "Erreur lors de la génération de la vidéo",
      details: err instanceof Error ? err.message : "Erreur inconnue",
    }, { status: 500 });

  } finally {
    // Nettoyage du dossier de travail
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
