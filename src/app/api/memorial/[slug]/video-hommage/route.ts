import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderVideoHommage, getMusicPath } from "@/lib/video-renderer";
import { writeFile, mkdir } from "fs/promises";
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
  const body = await request.json();
  const { photoIds, template, musique, texteOverlay } = body;

  if (!photoIds?.length || !template || !musique) {
    return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
  }

  if (photoIds.length > 20) {
    return NextResponse.json({ error: "Maximum 20 photos" }, { status: 400 });
  }

  const defunt = await prisma.defunt.findUnique({
    where: { slug, statut: "PUBLIE" },
    select: { id: true, prenom: true, nom: true, dateNaissance: true, dateDeces: true },
  });

  if (!defunt) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  // Récupérer les photos sélectionnées
  const medias: { id: string; url: string }[] = await prisma.media.findMany({
    where: { id: { in: photoIds }, defuntId: defunt.id, type: "PHOTO" },
    select: { id: true, url: true },
    orderBy: { ordre: "asc" },
  });

  if (medias.length === 0) {
    return NextResponse.json({ error: "Aucune photo trouvée" }, { status: 400 });
  }

  // Créer l'entrée vidéo (statut EN_COURS)
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

  const tmpDir = path.join("/tmp", `video-${video.id}`);
  await mkdir(tmpDir, { recursive: true });

  const videoFilename = `video-hommage-${video.id}.mp4`;
  const videoPath = path.join(tmpDir, videoFilename);
  const videoUrl = `/api/memorial/${slug}/video-hommage/${video.id}`;

  // Télécharger les photos depuis S3 vers des fichiers temporaires
  const photoLocalPaths: string[] = [];
  for (let i = 0; i < medias.length; i++) {
    const m = medias[i];
    const localPath = path.join(tmpDir, `photo-${i}.jpg`);

    if (m.url.startsWith("http")) {
      const res = await fetch(m.url);
      const buf = Buffer.from(await res.arrayBuffer());
      await writeFile(localPath, buf);
    } else {
      // Fallback: fichier local
      const fullPath = path.join(process.cwd(), "public", m.url);
      const { copyFile } = await import("fs/promises");
      await copyFile(fullPath, localPath);
    }
    photoLocalPaths.push(localPath);
  }

  const fullName = `${defunt.prenom} ${defunt.nom}`;
  const dates = `${formatDateFr(defunt.dateNaissance)}${defunt.dateNaissance ? " — " : ""}${formatDateFr(defunt.dateDeces)}`;
  const musicPath = getMusicPath(musique);

  // Lancer le rendu vidéo
  try {
    await renderVideoHommage({
      photoUrls: photoLocalPaths,
      templateId: template,
      musique: musicPath,
      texteOverlay,
      outputPath: videoPath,
      defuntNom: fullName,
      defuntDates: dates,
    });

    await prisma.videoHommage.update({
      where: { id: video.id },
      data: { statut: "TERMINE", videoUrl: videoPath },
    });

    return NextResponse.json({
      id: video.id,
      videoUrl,
      message: "Vidéo hommage générée avec succès",
    }, { status: 201 });

  } catch (err) {
    console.error("Erreur rendu vidéo:", err);

    await prisma.videoHommage.update({
      where: { id: video.id },
      data: { statut: "ERREUR" },
    });

    return NextResponse.json({
      error: "Erreur lors de la génération de la vidéo",
      details: err instanceof Error ? err.message : "Erreur inconnue",
    }, { status: 500 });
  }
}
