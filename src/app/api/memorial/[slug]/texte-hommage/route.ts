import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { jsPDF } from "jspdf";
import { readFileSync } from "fs";
import path from "path";

const anthropic = new Anthropic();

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();
  const { surnom, traits, passions, anecdotes, tonalite } = body;

  if (!traits?.length) {
    return NextResponse.json({ error: "Traits de caractère requis" }, { status: 400 });
  }

  const defunt = await prisma.defunt.findUnique({
    where: { slug, statut: "PUBLIE" },
    select: { id: true, prenom: true, nom: true, dateNaissance: true, dateDeces: true },
  });

  if (!defunt) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const fullName = `${defunt.prenom} ${defunt.nom}`;
  const displayName = surnom || defunt.prenom;

  const tonDescriptions: Record<string, string> = {
    solennel: "un ton respectueux, solennel et formel, avec dignité",
    chaleureux: "un ton chaleureux, affectueux et intime, comme si on parlait à un proche",
    poetique: "un ton poétique et lyrique, avec des métaphores et des images",
    leger: "un ton doux et léger, avec des touches de sourire et de tendresse",
  };

  const prompt = `Tu es un auteur spécialisé dans les textes d'hommage funéraire. Écris un texte hommage personnalisé pour ${fullName}${surnom ? ` (surnommé "${surnom}")` : ""}.

Informations sur la personne :
- Prénom utilisé : ${displayName}
- Traits de caractère : ${traits.join(", ")}
${passions ? `- Passions et activités : ${passions}` : ""}
${anecdotes ? `- Anecdotes et souvenirs : ${anecdotes}` : ""}

Consignes :
- Adopte ${tonDescriptions[tonalite] || tonDescriptions.chaleureux}
- Le texte doit faire entre 200 et 350 mots
- Ne commence pas par "Cher(e)" ni par le nom complet
- Utilise le prénom ou le surnom naturellement dans le texte
- Structure le texte en 3-4 paragraphes
- Termine par une phrase d'adieu poignante
- N'invente pas de faits non mentionnés
- Écris en français, avec sensibilité et authenticité`;

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const contenu = message.content[0].type === "text" ? message.content[0].text : "";

  const texteHommage = await prisma.texteHommage.create({
    data: {
      defuntId: defunt.id,
      contenu,
      tonalite,
      donnees: { surnom, traits, passions, anecdotes },
    },
  });

  return NextResponse.json({
    id: texteHommage.id,
    contenu,
  }, { status: 201 });
}

function formatDateFr(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const format = request.nextUrl.searchParams.get("format");

  if (format !== "pdf") {
    return NextResponse.json({ error: "Format non supporté" }, { status: 400 });
  }

  const defunt = await prisma.defunt.findUnique({
    where: { slug },
    select: { prenom: true, nom: true, dateNaissance: true, dateDeces: true },
  });

  if (!defunt) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const texte = await prisma.texteHommage.findFirst({
    where: { defunt: { slug } },
    orderBy: { createdAt: "desc" },
    select: { contenu: true },
  });

  if (!texte) {
    return NextResponse.json({ error: "Aucun texte hommage" }, { status: 404 });
  }

  const fullName = `${defunt.prenom} ${defunt.nom}`;
  const dates = `${formatDateFr(defunt.dateNaissance)}${defunt.dateNaissance ? " — " : ""}${formatDateFr(defunt.dateDeces)}`;

  // Génération du PDF
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 25;
  const contentW = pageW - margin * 2;

  // Logo en haut
  try {
    const logoPath = path.join(process.cwd(), "public", "images", "logo.png");
    const logoData = readFileSync(logoPath);
    const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;
    doc.addImage(logoBase64, "PNG", margin, 15, 45, 12);
  } catch {
    // logo optionnel
  }

  // Ligne dorée sous le logo
  doc.setDrawColor(248, 168, 9);
  doc.setLineWidth(0.8);
  doc.line(margin, 32, pageW - margin, 32);

  // Nom du défunt
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(22, 35, 76); // #16234C
  doc.text(fullName, pageW / 2, 48, { align: "center" });

  // Dates
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(136, 136, 136);
  doc.text(dates, pageW / 2, 56, { align: "center" });

  // Petit séparateur doré
  doc.setDrawColor(248, 168, 9);
  doc.setLineWidth(0.6);
  doc.line(pageW / 2 - 15, 62, pageW / 2 + 15, 62);

  // Sous-titre "Texte hommage"
  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(248, 168, 9);
  doc.text("Texte hommage", pageW / 2, 70, { align: "center" });

  // Corps du texte
  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(51, 51, 51); // #333333

  const paragraphs = texte.contenu.split("\n").filter((p: string) => p.trim());
  let y = 80;

  for (const paragraph of paragraphs) {
    const lines = doc.splitTextToSize(paragraph, contentW);
    for (const line of lines) {
      if (y > 270) {
        doc.addPage();
        y = 25;
      }
      doc.text(line, margin, y);
      y += 6;
    }
    y += 4; // espace entre paragraphes
  }

  // Pied de page
  const footerY = 285;
  doc.setDrawColor(22, 35, 76);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageW - margin, footerY - 5);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(136, 136, 136);
  doc.text("Roc Eclerc Nancy — Là, pour vous", pageW / 2, footerY, { align: "center" });
  doc.text("www.pompes-funebres-roceclerc-nancy.com", pageW / 2, footerY + 4, { align: "center" });

  const pdfBuffer = Buffer.from(doc.output("arraybuffer"));

  return new NextResponse(pdfBuffer, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="hommage-${slug}.pdf"`,
    },
  });
}
