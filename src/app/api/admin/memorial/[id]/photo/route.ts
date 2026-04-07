import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { uploadToS3 } from "@/lib/s3";
import { v4 as uuid } from "uuid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;

  const defunt = await prisma.defunt.findUnique({
    where: { id },
    select: { id: true, slug: true },
  });
  if (!defunt) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const formData = await request.formData();
  const file = formData.get("photo") as File | null;

  if (!file || !file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Photo invalide" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Photo trop lourde (max 5 Mo)" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() || "jpg";
  const key = `memorial/${defunt.slug}/profile-${uuid().slice(0, 8)}.${ext}`;
  const buffer = Buffer.from(await file.arrayBuffer());
  const url = await uploadToS3(key, buffer, file.type);

  await prisma.defunt.update({
    where: { id },
    data: { photoUrl: url },
  });

  return NextResponse.json({ photoUrl: url }, { status: 200 });
}
