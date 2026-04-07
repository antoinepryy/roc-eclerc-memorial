import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();

  const { auteurNom, auteurEmail, message } = body;

  if (!auteurNom?.trim() || !message?.trim()) {
    return NextResponse.json({ error: "Nom et message requis" }, { status: 400 });
  }

  if (auteurNom.length > 100 || message.length > 5000) {
    return NextResponse.json({ error: "Message trop long" }, { status: 400 });
  }

  const defunt = await prisma.defunt.findUnique({
    where: { slug, statut: "PUBLIE" },
    select: { id: true },
  });

  if (!defunt) {
    return NextResponse.json({ error: "Espace mémoriel introuvable" }, { status: 404 });
  }

  const condoleance = await prisma.condoleance.create({
    data: {
      defuntId: defunt.id,
      auteurNom: auteurNom.trim(),
      auteurEmail: auteurEmail?.trim() || null,
      message: message.trim(),
      statut: "EN_ATTENTE",
    },
  });

  return NextResponse.json({ id: condoleance.id, message: "Condoléance enregistrée" }, { status: 201 });
}

export async function GET(
  _request: NextRequest,
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

  const condoleances = await prisma.condoleance.findMany({
    where: { defuntId: defunt.id, statut: "APPROUVE" },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      auteurNom: true,
      message: true,
      createdAt: true,
    },
  });

  return NextResponse.json(condoleances);
}
