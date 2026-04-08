import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CopyButton from "./CopyButton";

type Props = { params: Promise<{ slug: string; videoId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, videoId } = await params;
  const defunt = await prisma.defunt.findUnique({ where: { slug } });
  if (!defunt) return {};
  const fullName = `${defunt.prenom} ${defunt.nom}`;
  const video = await prisma.videoHommage.findUnique({ where: { id: videoId } });
  return {
    title: `Vidéo hommage — ${fullName}`,
    description: `Vidéo hommage dédiée à ${fullName}. Un souvenir en images et en musique.`,
    openGraph: {
      title: `Vidéo hommage — ${fullName}`,
      description: `Vidéo hommage dédiée à ${fullName}.`,
      type: "video.other",
      ...(video?.videoUrl ? { videos: [{ url: video.videoUrl }] } : {}),
      ...(defunt.photoUrl ? { images: [{ url: defunt.photoUrl }] } : {}),
    },
  };
}

function formatDate(date: Date | null | undefined): string {
  if (!date) return "";
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function VideoHommagePage({ params }: Props) {
  const { slug, videoId } = await params;

  const defunt = await prisma.defunt.findUnique({
    where: { slug },
    select: { id: true, slug: true, prenom: true, nom: true, photoUrl: true, dateNaissance: true, dateDeces: true },
  });

  if (!defunt) notFound();

  const video = await prisma.videoHommage.findUnique({
    where: { id: videoId, defuntId: defunt.id, statut: "TERMINE" },
    select: { id: true, videoUrl: true, theme: true, createdAt: true },
  });

  if (!video?.videoUrl) notFound();

  const fullName = `${defunt.prenom} ${defunt.nom}`;
  const dates = `${formatDate(defunt.dateNaissance)}${defunt.dateNaissance ? " — " : ""}${formatDate(defunt.dateDeces)}`;
  const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/${slug}/hommage/video/${videoId}`;

  return (
    <>
      {/* Header sombre */}
      <section style={{ background: "#16234c", padding: "40px 0 30px" }}>
        <div className="max-w-[800px] mx-auto px-4 text-center">
          {defunt.photoUrl && (
            <img
              src={defunt.photoUrl}
              alt={fullName}
              style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", margin: "0 auto 16px", border: "3px solid rgba(248,168,9,0.4)" }}
            />
          )}
          <p style={{ color: "#F8A809", fontSize: 12, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 6 }}>
            Vidéo hommage
          </p>
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 600, marginBottom: 6 }} className="md:text-[28px]">
            {fullName}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: 14 }}>{dates}</p>
        </div>
      </section>

      {/* Player vidéo */}
      <section style={{ padding: "40px 0", background: "#0a0a0a" }}>
        <div className="max-w-[900px] mx-auto px-4">
          <video
            src={video.videoUrl}
            controls
            autoPlay
            className="w-full"
            style={{ borderRadius: 12, maxHeight: 500, background: "#000" }}
          />
        </div>
      </section>

      {/* Actions */}
      <section style={{ padding: "30px 0 50px" }}>
        <div className="max-w-[600px] mx-auto px-4">
          {/* Boutons de partage */}
          <div className="flex flex-wrap gap-3 justify-center mb-6">
            <a
              href={video.videoUrl}
              download
              className="btn-accent"
              style={{ padding: "12px 24px", fontSize: 14, textDecoration: "none" }}
            >
              Télécharger la vidéo
            </a>
            <CopyButton url={pageUrl} />
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`Vidéo hommage pour ${fullName} : ${pageUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: "12px 20px", fontSize: 14, borderRadius: 6, border: "1px solid #25D366", color: "#25D366", textDecoration: "none", fontWeight: 500 }}
            >
              WhatsApp
            </a>
            <a
              href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ padding: "12px 20px", fontSize: 14, borderRadius: 6, border: "1px solid #1877F2", color: "#1877F2", textDecoration: "none", fontWeight: 500 }}
            >
              Facebook
            </a>
            <a
              href={`mailto:?subject=${encodeURIComponent(`Vidéo hommage — ${fullName}`)}&body=${encodeURIComponent(`Voici la vidéo hommage dédiée à ${fullName} :\n${pageUrl}`)}`}
              style={{ padding: "12px 20px", fontSize: 14, borderRadius: 6, border: "1px solid #ddd", color: "#16234c", textDecoration: "none", fontWeight: 500 }}
            >
              Email
            </a>
          </div>

          {/* Lien retour */}
          <div className="text-center">
            <Link
              href={`/${slug}`}
              style={{ color: "#F8A809", fontSize: 14, fontWeight: 500 }}
            >
              Retour à l&apos;espace mémoriel
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

