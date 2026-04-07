import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import TexteHommageForm from "./TexteHommageForm";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const defunt = await prisma.defunt.findUnique({ where: { slug } });
  if (!defunt) return {};
  return { title: `Texte hommage — ${defunt.prenom} ${defunt.nom}` };
}

export default async function TexteHommagePage({ params }: Props) {
  const { slug } = await params;
  const defunt = await prisma.defunt.findUnique({
    where: { slug, statut: "PUBLIE" },
    select: { id: true, slug: true, prenom: true, nom: true },
  });

  if (!defunt) notFound();

  return (
    <>
      <section style={{ background: "#16234c", padding: "40px 0" }}>
        <div className="max-w-[600px] mx-auto px-4 text-center">
          <h1 style={{ color: "#fff", fontSize: 24, fontWeight: 600, marginBottom: 8 }} className="md:text-[28px]">
            Créer un texte hommage
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15 }}>
            Un texte personnalisé en mémoire de {defunt.prenom} {defunt.nom}
          </p>
        </div>
      </section>

      <section style={{ padding: "40px 0 60px" }}>
        <div className="max-w-[600px] mx-auto px-4">
          <TexteHommageForm slug={defunt.slug} prenom={defunt.prenom} />
        </div>
      </section>
    </>
  );
}
