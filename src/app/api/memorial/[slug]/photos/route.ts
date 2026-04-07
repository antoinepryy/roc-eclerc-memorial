import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuid } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads", "memorial");
const MAX_FILES = 20;
const MAX_SIZE = 5 * 1024 * 1024; // 5 Mo

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const defunt = await prisma.defunt.findUnique({
    where: { slug, statut: "PUBLIE" },
    select: { id: true },
  });

  if (!defunt) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  // Vérifier le nombre de photos existantes
  const existingCount = await prisma.media.count({
    where: { defuntId: defunt.id, type: "PHOTO" },
  });

  const formData = await request.formData();
  const files = formData.getAll("photos") as File[];

  if (files.length === 0) {
    return NextResponse.json({ error: "Aucun fichier" }, { status: 400 });
  }

  if (existingCount + files.length > MAX_FILES) {
    return NextResponse.json(
      { error: `Maximum ${MAX_FILES} photos (${existingCount} existantes)` },
      { status: 400 }
    );
  }

  // Créer le dossier d'upload
  const defuntDir = path.join(UPLOAD_DIR, slug);
  await mkdir(defuntDir, { recursive: true });

  const photos = [];

  for (const file of files) {
    if (file.size > MAX_SIZE) continue;
    if (!file.type.startsWith("image/")) continue;

    const ext = file.name.split(".").pop() || "jpg";
    const filename = `${uuid()}.${ext}`;
    const filepath = path.join(defuntDir, filename);
    const buffer = Buffer.from(await file.arrayBuffer());

    await writeFile(filepath, buffer);

    const mediaUrl = `/uploads/memorial/${slug}/${filename}`;
    const created: { id: string; url: string } = await prisma.media.create({
      data: {
        defuntId: defunt.id,
        type: "PHOTO",
        url: mediaUrl,
        ordre: existingCount + photos.length,
      },
    });

    photos.push({ id: created.id, url: created.url, caption: null });
  }

  return NextResponse.json({ photos }, { status: 201 });
}
