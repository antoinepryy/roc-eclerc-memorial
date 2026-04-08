import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const defunt = await prisma.defunt.findUnique({ where: { id } });
  if (!defunt) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  return NextResponse.json(defunt);
}

export async function PUT(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();

  const defunt = await prisma.defunt.update({
    where: { id },
    data: {
      prenom: body.prenom?.trim(),
      nom: body.nom?.trim(),
      genre: body.genre === "HOMME" || body.genre === "FEMME" ? body.genre : null,
      dateNaissance: body.dateNaissance ? new Date(body.dateNaissance) : null,
      dateDeces: body.dateDeces ? new Date(body.dateDeces) : undefined,
      texteAnnonce: body.texteAnnonce?.trim() || null,
      ceremonieLieu: body.ceremonieLieu?.trim() || null,
      ceremonieDate: body.ceremonieDate ? new Date(body.ceremonieDate) : null,
      ceremonieHeure: body.ceremonieHeure || null,
      acces: body.acces === "PRIVE" ? "PRIVE" : "PUBLIC",
      statut: body.statut || undefined,
    },
  });

  return NextResponse.json(defunt);
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  await prisma.defunt.delete({ where: { id } });

  return NextResponse.json({ success: true });
}
