import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

type Params = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  const { id } = await params;
  const condoleances = await prisma.condoleance.findMany({
    where: { defuntId: id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(condoleances);
}

export async function PATCH(request: NextRequest, { params }: Params) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

  await params; // consume params
  const { condoleanceId, statut } = await request.json();

  if (!condoleanceId || !["APPROUVE", "REJETE"].includes(statut)) {
    return NextResponse.json({ error: "Données invalides" }, { status: 400 });
  }

  const condoleance = await prisma.condoleance.update({
    where: { id: condoleanceId },
    data: { statut },
  });

  return NextResponse.json(condoleance);
}
