import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";
import { v4 as uuid } from "uuid";

function slugify(prenom: string, nom: string, year: number): string {
  const clean = (s: string) =>
    s.toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "");
  return `${clean(prenom)}-${clean(nom)}-${year}`;
}

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await request.json();
  const { prenom, nom, dateNaissance, dateDeces, texteAnnonce, ceremonieLieu, ceremonieDate, ceremonieHeure, acces, statut } = body;

  if (!prenom?.trim() || !nom?.trim() || !dateDeces) {
    return NextResponse.json({ error: "Prénom, nom et date de décès requis" }, { status: 400 });
  }

  const deceYear = new Date(dateDeces).getFullYear();
  let slug = slugify(prenom, nom, deceYear);

  // Vérifier unicité du slug
  const existing = await prisma.defunt.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${uuid().slice(0, 4)}`;
  }

  const defunt = await prisma.defunt.create({
    data: {
      slug,
      prenom: prenom.trim(),
      nom: nom.trim(),
      dateNaissance: dateNaissance ? new Date(dateNaissance) : null,
      dateDeces: new Date(dateDeces),
      texteAnnonce: texteAnnonce?.trim() || null,
      ceremonieLieu: ceremonieLieu?.trim() || null,
      ceremonieDate: ceremonieDate ? new Date(ceremonieDate) : null,
      ceremonieHeure: ceremonieHeure || null,
      acces: acces === "PRIVE" ? "PRIVE" : "PUBLIC",
      statut: statut === "PUBLIE" ? "PUBLIE" : "BROUILLON",
      tokenFamille: uuid(),
    },
  });

  return NextResponse.json({ id: defunt.id, slug: defunt.slug }, { status: 201 });
}

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const defunts = await prisma.defunt.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      _count: {
        select: {
          condoleances: { where: { statut: "EN_ATTENTE" } },
          medias: true,
        },
      },
    },
  });

  return NextResponse.json(defunts);
}
