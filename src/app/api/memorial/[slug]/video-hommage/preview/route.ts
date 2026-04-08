import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { renderVideoHommage, downloadToFile, getMusicS3Url } from "@/lib/video-renderer";
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

  const defunt = await prisma.defunt.findUnique({
    where: { slug, statut: "PUBLIE" },
    select: { id: true, prenom: true, nom: true, dateNaissance: true, dateDeces: true },
  });

  if (!defunt) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  // Max 3 photos pour la preview
  const limitedIds = (photoIds as string[]).slice(0, 3);

  const medias: { id: string; url: string }[] = await prisma.media.findMany({
    where: { id: { in: limitedIds }, defuntId: defunt.id, type: "PHOTO" },
    select: { id: true, url: true },
    orderBy: { ordre: "asc" },
  });

  if (medias.length === 0) {
    return NextResponse.json({ error: "Aucune photo trouvée" }, { status: 400 });
  }

  const workDir = path.join("/tmp", `preview-${Date.now()}`);
  await mkdir(workDir, { recursive: true });

  try {
    // Télécharger les photos
    const photoLocalPaths: string[] = [];
    for (let i = 0; i < medias.length; i++) {
      const localPath = path.join(workDir, `photo-${i}.jpg`);
      await downloadToFile(medias[i].url, localPath);
      photoLocalPaths.push(localPath);
    }

    // Télécharger la musique
    let musicLocalPath: string | null = null;
    try {
      const musicUrl = musiqueCustomUrl || getMusicS3Url(musique);
      musicLocalPath = path.join(workDir, "music.mp3");
      await downloadToFile(musicUrl, musicLocalPath);
    } catch {
      musicLocalPath = null;
    }

    // Rendu preview
    const outputPath = path.join(workDir, "preview.mp4");
    const fullName = `${defunt.prenom} ${defunt.nom}`;
    const dates = `${formatDateFr(defunt.dateNaissance)}${defunt.dateNaissance ? " — " : ""}${formatDateFr(defunt.dateDeces)}`;

    await renderVideoHommage({
      photoLocalPaths,
      templateId: template,
      musicLocalPath,
      texteOverlay: texteOverlay || null,
      outputPath,
      defuntNom: fullName,
      defuntDates: dates,
      preview: true,
    });

    // Retourner la vidéo directement en réponse (pas d'upload S3 pour la preview)
    const videoBuffer = await readFile(outputPath);

    return new NextResponse(videoBuffer, {
      status: 200,
      headers: {
        "Content-Type": "video/mp4",
        "Content-Length": String(videoBuffer.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    console.error("[video-preview] Failed:", err);
    return NextResponse.json({
      error: "Erreur lors de la génération de l'aperçu",
    }, { status: 500 });
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => {});
  }
}
