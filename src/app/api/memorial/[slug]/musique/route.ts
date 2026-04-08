import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadToS3 } from "@/lib/s3";
import { v4 as uuid } from "uuid";

const MAX_SIZE = 10 * 1024 * 1024; // 10 Mo

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

  const formData = await request.formData();
  const file = formData.get("musique") as File | null;
  const label = (formData.get("label") as string) || "Ma musique";
  const source = (formData.get("source") as string) || "visiteur";

  if (!file || !file.type.startsWith("audio/")) {
    return NextResponse.json({ error: "Fichier audio requis (MP3, WAV, etc.)" }, { status: 400 });
  }

  if (file.size > MAX_SIZE) {
    return NextResponse.json({ error: "Fichier trop lourd (max 10 Mo)" }, { status: 400 });
  }

  // Limiter à 5 musiques custom par défunt
  const count = await prisma.musiqueCustom.count({ where: { defuntId: defunt.id } });
  if (count >= 5) {
    return NextResponse.json({ error: "Maximum 5 musiques personnalisées" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "mp3";
  const key = `audio/custom/${slug}/${uuid().slice(0, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadToS3(key, buffer, file.type);

  const musique = await prisma.musiqueCustom.create({
    data: {
      defuntId: defunt.id,
      label: label.slice(0, 100),
      url,
      source: source === "admin" ? "admin" : "visiteur",
    },
  });

  return NextResponse.json({ id: musique.id, label: musique.label, url: musique.url }, { status: 201 });
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const defunt = await prisma.defunt.findUnique({
    where: { slug },
    select: { id: true },
  });

  if (!defunt) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const musiques = await prisma.musiqueCustom.findMany({
    where: { defuntId: defunt.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, url: true, source: true },
  });

  return NextResponse.json(musiques);
}
