import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import CondoleancesList from "./CondoleancesList";
import GalerieCarousel from "./GalerieCarousel";
import ShareButtons from "./ShareButtons";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const defunt = await prisma.defunt.findUnique({ where: { slug } });
  if (!defunt) return {};
  const fullName = `${defunt.prenom} ${defunt.nom}`;
  return {
    title: `Hommage à ${fullName}`,
    description: defunt.texteAnnonce || `Espace mémoriel dédié à ${fullName}. Déposez vos condoléances et consultez les hommages.`,
    openGraph: {
      title: `Hommage à ${fullName} — Roc Eclerc Nancy`,
      description: defunt.texteAnnonce || `Espace mémoriel dédié à ${fullName}.`,
      images: defunt.photoUrl ? [{ url: defunt.photoUrl, width: 600, height: 600, alt: fullName }] : [],
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

export default async function MemorialPage({ params }: Props) {
  const { slug } = await params;
  const defunt = await prisma.defunt.findUnique({
    where: { slug, statut: "PUBLIE" },
    include: {
      condoleances: {
        where: { statut: "APPROUVE" },
        orderBy: { createdAt: "desc" },
      },
      medias: {
        where: { type: "PHOTO" },
        orderBy: { ordre: "asc" },
      },
      videosHommage: {
        where: { statut: "TERMINE" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
      textesHommage: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  if (!defunt) notFound();

  const fullName = `${defunt.prenom} ${defunt.nom}`;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://www.pompes-funebres-roceclerc-nancy.com";
  const memorialUrl = `${siteUrl}/${defunt.slug}`;

  return (
    <>
      {/* Hero mémoriel */}
      <section className="relative" style={{ background: "#16234c", padding: "50px 0 40px" }}>
        <div className="max-w-[800px] mx-auto px-4 text-center">
          {defunt.photoUrl && (
            <div className="mx-auto mb-6" style={{ width: 160, height: 160, borderRadius: "50%", overflow: "hidden", border: "3px solid #F8A809" }}>
              <Image
                src={defunt.photoUrl}
                alt={fullName}
                width={160}
                height={160}
                className="object-cover w-full h-full"
                priority
              />
            </div>
          )}
          <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 600, marginBottom: 8 }} className="md:text-[34px]">
            {fullName}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 16, marginBottom: 16 }}>
            {defunt.dateNaissance && formatDate(defunt.dateNaissance)}
            {defunt.dateNaissance && " — "}
            {formatDate(defunt.dateDeces)}
          </p>
          <div style={{ width: 60, height: 3, background: "#F8A809", borderRadius: 2, margin: "0 auto 20px" }} />
          {defunt.texteAnnonce && (
            <p style={{ color: "rgba(255,255,255,0.85)", fontSize: 15, lineHeight: 1.8, maxWidth: 600, margin: "0 auto" }}>
              {defunt.texteAnnonce}
            </p>
          )}
        </div>
      </section>

      {/* Infos cérémonie */}
      {(defunt.ceremonieLieu || defunt.ceremonieDate) && (
        <section style={{ background: "#f8f8f8", borderTop: "3px solid #F8A809", padding: "24px 0" }}>
          <div className="max-w-[800px] mx-auto px-4">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6 text-center sm:text-left">
              <div className="flex items-center gap-3">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F8A809" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" />
                </svg>
                <div>
                  <p style={{ fontSize: 13, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>Date</p>
                  <p style={{ fontSize: 15, fontWeight: 500, color: "#16234c" }}>
                    {formatDate(defunt.ceremonieDate)}
                    {defunt.ceremonieHeure && ` à ${defunt.ceremonieHeure}`}
                  </p>
                </div>
              </div>
              {defunt.ceremonieLieu && (
                <div className="flex items-center gap-3">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#F8A809" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <div>
                    <p style={{ fontSize: 13, color: "#888", textTransform: "uppercase", letterSpacing: 1 }}>Lieu</p>
                    <p style={{ fontSize: 15, fontWeight: 500, color: "#16234c" }}>{defunt.ceremonieLieu}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* Galerie photos */}
      {defunt.medias.length > 0 && (
        <section style={{ padding: "50px 0" }}>
          <div className="max-w-[800px] mx-auto px-4">
            <p style={{ color: "#F8A809", fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>
              Souvenirs
            </p>
            <h2 className="text-[20px] md:text-[24px]" style={{ textAlign: "center", marginBottom: 8 }}>Galerie photos</h2>
            <div className="accent-separator" />
            <GalerieCarousel medias={defunt.medias.map((m: { id: string; url: string; caption: string | null }) => ({ id: m.id, url: m.url, caption: m.caption }))} />
          </div>
        </section>
      )}

      {/* Texte hommage */}
      {defunt.textesHommage.length > 0 && (
        <section style={{ padding: "50px 0", background: "#f8f8f8" }}>
          <div className="max-w-[700px] mx-auto px-4">
            <p style={{ color: "#F8A809", fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>
              Hommage
            </p>
            <h2 className="text-[20px] md:text-[24px]" style={{ textAlign: "center", marginBottom: 8 }}>Texte hommage</h2>
            <div className="accent-separator" />
            <div style={{ background: "#fff", borderRadius: 10, padding: "32px 28px", border: "1px solid #eee", lineHeight: 2, fontSize: 15, color: "#555", whiteSpace: "pre-wrap" }}>
              {defunt.textesHommage[0].contenu}
            </div>
          </div>
        </section>
      )}

      {/* Vidéo hommage */}
      {defunt.videosHommage.length > 0 && defunt.videosHommage[0].videoUrl && (
        <section style={{ padding: "50px 0" }}>
          <div className="max-w-[700px] mx-auto px-4">
            <p style={{ color: "#F8A809", fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>
              Vidéo
            </p>
            <h2 className="text-[20px] md:text-[24px]" style={{ textAlign: "center", marginBottom: 8 }}>Vidéo hommage</h2>
            <div className="accent-separator" />
            <div style={{ borderRadius: 10, overflow: "hidden" }}>
              <video
                src={defunt.videosHommage[0].videoUrl}
                controls
                className="w-full"
                style={{ maxHeight: 450 }}
              />
            </div>
          </div>
        </section>
      )}

      {/* Condoléances */}
      <section style={{ padding: "50px 0", background: defunt.textesHommage.length > 0 ? "#fff" : "#f8f8f8" }}>
        <div className="max-w-[700px] mx-auto px-4">
          <p style={{ color: "#F8A809", fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8, textAlign: "center" }}>
            Témoignages
          </p>
          <h2 className="text-[20px] md:text-[24px]" style={{ textAlign: "center", marginBottom: 8 }}>Condoléances</h2>
          <div className="accent-separator" />

          <div className="text-center mb-8">
            <Link
              href={`/${defunt.slug}/condoleances`}
              className="btn-accent"
              style={{ fontSize: 15, padding: "12px 28px" }}
            >
              Déposer un message
            </Link>
          </div>

          <CondoleancesList condoleances={defunt.condoleances.map((c: { id: string; auteurNom: string; message: string; createdAt: Date }) => ({
            id: c.id,
            auteurNom: c.auteurNom,
            message: c.message,
            createdAt: c.createdAt.toISOString(),
          }))} />
        </div>
      </section>

      {/* Actions : hommage + partage */}
      <section style={{ background: "#16234c", padding: "40px 0" }}>
        <div className="max-w-[800px] mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h2 style={{ color: "#fff", fontSize: 20, fontWeight: 600, marginBottom: 4 }}>
                Rendre hommage à {defunt.prenom}
              </h2>
              <p style={{ color: "rgba(255,255,255,0.65)", fontSize: 14 }}>
                Créez une vidéo ou un texte personnalisé
              </p>
            </div>
            <div className="flex gap-3">
              <Link
                href={`/${defunt.slug}/hommage/video`}
                className="btn-accent"
                style={{ fontSize: 14, padding: "10px 20px" }}
              >
                Vidéo hommage
              </Link>
              <Link
                href={`/${defunt.slug}/hommage/texte`}
                className="btn-primary"
                style={{ fontSize: 14, padding: "10px 20px", background: "#fff", color: "#16234c" }}
              >
                Texte hommage
              </Link>
            </div>
          </div>
          <div style={{ borderTop: "1px solid rgba(255,255,255,0.1)", marginTop: 24, paddingTop: 20 }}>
            <ShareButtons url={memorialUrl} name={fullName} />
          </div>
        </div>
      </section>
    </>
  );
}
