import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import VideoHommageWizard from "./VideoHommageWizard";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const defunt = await prisma.defunt.findUnique({ where: { slug } });
  if (!defunt) return {};
  return { title: `Vidéo hommage — ${defunt.prenom} ${defunt.nom}` };
}

export default async function VideoHommagePage({ params }: Props) {
  const { slug } = await params;
  const defunt = await prisma.defunt.findUnique({
    where: { slug, statut: "PUBLIE" },
  });

  if (!defunt) notFound();

  const medias = await prisma.media.findMany({
    where: { defuntId: defunt.id, type: "PHOTO" },
    orderBy: { ordre: "asc" },
    select: { id: true, url: true, caption: true },
  });

  const musiquesCustom = await prisma.musiqueCustom.findMany({
    where: { defuntId: defunt.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, label: true, url: true },
  });

  return (
    <>
      <section style={{ background: "#16234c", padding: "40px 0" }}>
        <div className="max-w-[800px] mx-auto px-4 text-center">
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 600, marginBottom: 8 }} className="md:text-[28px]">
            Créer une vidéo hommage
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15 }}>
            Pour {defunt.prenom} {defunt.nom}
          </p>
        </div>
      </section>

      <section style={{ padding: "40px 0 60px" }}>
        <div className="max-w-[700px] mx-auto px-4">
          <VideoHommageWizard
            slug={defunt.slug}
            photos={medias}
            musiquesCustom={musiquesCustom}
          />
        </div>
      </section>
    </>
  );
}
