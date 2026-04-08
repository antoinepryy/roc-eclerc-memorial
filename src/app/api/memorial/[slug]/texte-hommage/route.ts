import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { jsPDF } from "jspdf";
import { readFileSync } from "fs";
import path from "path";

const anthropic = new Anthropic();

function formatDateFr(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// --- PDF generation helper ---
function generatePdf(fullName: string, dates: string, contenu: string): Buffer {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pageW = doc.internal.pageSize.getWidth();
  const margin = 25;
  const contentW = pageW - margin * 2;

  try {
    const logoPath = path.join(process.cwd(), "public", "images", "logo.png");
    const logoData = readFileSync(logoPath);
    const logoBase64 = `data:image/png;base64,${logoData.toString("base64")}`;
    doc.addImage(logoBase64, "PNG", margin, 15, 45, 12);
  } catch { /* logo optionnel */ }

  doc.setDrawColor(248, 168, 9);
  doc.setLineWidth(0.8);
  doc.line(margin, 32, pageW - margin, 32);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(22, 35, 76);
  doc.text(fullName, pageW / 2, 48, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(136, 136, 136);
  doc.text(dates, pageW / 2, 56, { align: "center" });

  doc.setDrawColor(248, 168, 9);
  doc.setLineWidth(0.6);
  doc.line(pageW / 2 - 15, 62, pageW / 2 + 15, 62);

  doc.setFont("helvetica", "italic");
  doc.setFontSize(10);
  doc.setTextColor(248, 168, 9);
  doc.text("Texte hommage", pageW / 2, 70, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.setTextColor(51, 51, 51);

  const paragraphs = contenu.split("\n").filter((p: string) => p.trim());
  let y = 80;

  for (const paragraph of paragraphs) {
    const lines = doc.splitTextToSize(paragraph, contentW);
    for (const line of lines) {
      if (y > 270) { doc.addPage(); y = 25; }
      doc.text(line, margin, y);
      y += 6;
    }
    y += 4;
  }

  const footerY = 285;
  doc.setDrawColor(22, 35, 76);
  doc.setLineWidth(0.3);
  doc.line(margin, footerY - 5, pageW - margin, footerY - 5);
  doc.setFont("helvetica", "italic");
  doc.setFontSize(8);
  doc.setTextColor(136, 136, 136);
  doc.text("Roc Eclerc Nancy — Avec vous, dans ces moments", pageW / 2, footerY, { align: "center" });
  doc.text("www.pompes-funebres-roceclerc-nancy.com", pageW / 2, footerY + 4, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}

// --- POST: Generate text OR export PDF ---
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const body = await request.json();

  // PDF export with custom content
  if (body.format === "pdf" && body.contenu) {
    const defunt = await prisma.defunt.findUnique({
      where: { slug },
      select: { prenom: true, nom: true, dateNaissance: true, dateDeces: true },
    });
    if (!defunt) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

    const fullName = `${defunt.prenom} ${defunt.nom}`;
    const dates = `${formatDateFr(defunt.dateNaissance)}${defunt.dateNaissance ? " — " : ""}${formatDateFr(defunt.dateDeces)}`;
    const pdfBuffer = generatePdf(fullName, dates, body.contenu);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="hommage-${slug}.pdf"`,
      },
    });
  }

  // Text generation
  const { relation, surnom, traits, passions, anecdotes, messagePersonnel, tonalite, longueur } = body;

  if (!traits?.length) {
    return NextResponse.json({ error: "Traits de caractère requis" }, { status: 400 });
  }

  const defunt = await prisma.defunt.findUnique({
    where: { slug, statut: "PUBLIE" },
    select: { id: true, prenom: true, nom: true, genre: true, dateNaissance: true, dateDeces: true },
  });

  if (!defunt) {
    return NextResponse.json({ error: "Introuvable" }, { status: 404 });
  }

  const fullName = `${defunt.prenom} ${defunt.nom}`;
  const displayName = surnom || defunt.prenom;

  const tonDescriptions: Record<string, string> = {
    solennel: "un ton respectueux, solennel et digne, adapté à une cérémonie funéraire",
    chaleureux: "un ton chaleureux, affectueux et intime, comme si on s'adressait à un proche",
    poetique: "un ton poétique et délicat, avec des images et des métaphores sensibles",
    leger: "un ton doux et léger, avec des touches de sourire et de tendresse dans le souvenir",
  };

  const longueurSpec: Record<string, string> = {
    court: "entre 100 et 150 mots (texte concis pour une carte de cérémonie)",
    moyen: "entre 200 et 300 mots (format standard)",
    long: "entre 350 et 500 mots (texte développé pour un livret mémorial)",
  };

  const pronounInfo = defunt.genre === "HOMME"
    ? "Utilise les pronoms masculins (il, lui, son, ses)."
    : defunt.genre === "FEMME"
    ? "Utilise les pronoms féminins (elle, sa, ses)."
    : "Le genre n'est pas précisé, adapte-toi au prénom ou utilise des formulations neutres.";

  const prompt = `Tu es un auteur sensible spécialisé dans les textes d'hommage funéraire en France.
Écris un texte hommage personnalisé pour ${fullName}${surnom ? ` (surnommé "${surnom}")` : ""}.

Informations sur la personne :
- Prénom usuel : ${displayName}
${defunt.genre ? `- Genre : ${defunt.genre === "HOMME" ? "un homme" : "une femme"}` : ""}
- Traits de caractère : ${traits.join(", ")}
${passions ? `- Passions et activités : ${passions}` : ""}
${anecdotes ? `- Anecdotes et souvenirs : ${anecdotes}` : ""}
${relation ? `- L'auteur de cet hommage est : ${relation} du défunt` : ""}
${messagePersonnel ? `- Message personnel de l'auteur (à intégrer subtilement dans le texte) : "${messagePersonnel}"` : ""}

Consignes :
- Adopte ${tonDescriptions[tonalite] || tonDescriptions.chaleureux}
- Le texte doit faire ${longueurSpec[longueur] || longueurSpec.moyen}
- ${pronounInfo}
${relation ? `- Écris du point de vue d'un(e) ${relation}, en adaptant le registre émotionnel à cette relation` : ""}
- Ne commence pas par "Cher(e)" ni par le nom complet
- Utilise le prénom ou le surnom naturellement
- Structure le texte en 3-4 paragraphes
- Termine par une phrase d'adieu poignante
- N'invente pas de faits non mentionnés
- Écris en français, avec sensibilité et authenticité
- Ne mets pas de titre, de guillemets ni de commentaires autour du texte`;

  const maxTokens: Record<string, number> = { court: 512, moyen: 1024, long: 1536 };

  const message = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: maxTokens[longueur] || 1024,
    messages: [{ role: "user", content: prompt }],
  });

  const contenu = message.content[0].type === "text" ? message.content[0].text : "";

  const texteHommage = await prisma.texteHommage.create({
    data: {
      defuntId: defunt.id,
      contenu,
      tonalite,
      donnees: { relation, surnom, traits, passions, anecdotes, messagePersonnel, longueur },
    },
  });

  return NextResponse.json({ id: texteHommage.id, contenu }, { status: 201 });
}

// --- GET: PDF from database (backward compat) ---
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
  if (!defunt) return NextResponse.json({ error: "Introuvable" }, { status: 404 });

  const texte = await prisma.texteHommage.findFirst({
    where: { defunt: { slug } },
    orderBy: { createdAt: "desc" },
    select: { contenu: true },
  });
  if (!texte) return NextResponse.json({ error: "Aucun texte hommage" }, { status: 404 });

  const fullName = `${defunt.prenom} ${defunt.nom}`;
  const dates = `${formatDateFr(defunt.dateNaissance)}${defunt.dateNaissance ? " — " : ""}${formatDateFr(defunt.dateDeces)}`;
  const pdfBuffer = generatePdf(fullName, dates, texte.contenu);

  return new NextResponse(new Uint8Array(pdfBuffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="hommage-${slug}.pdf"`,
    },
  });
}
