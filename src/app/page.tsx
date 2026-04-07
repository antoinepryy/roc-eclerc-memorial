import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import MemorialSearch from "./MemorialSearch";

export const metadata: Metadata = {
  title: "Espace Mémoriel — Roc Eclerc Nancy",
  description: "Consultez les espaces mémoriaux et rendez hommage à vos proches. Déposez des condoléances et partagez vos souvenirs.",
};

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default async function MemorialListPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;

  const defunts = await prisma.defunt.findMany({
    where: {
      statut: "PUBLIE",
      acces: "PUBLIC",
      ...(q
        ? {
            OR: [
              { nom: { contains: q } },
              { prenom: { contains: q } },
            ],
          }
        : {}),
    },
    orderBy: { dateDeces: "desc" },
    take: 50,
  });

  return (
    <>
      {/* Hero */}
      <section style={{ background: "#16234c", padding: "50px 0 40px" }}>
        <div className="max-w-[800px] mx-auto px-4 text-center">
          <p style={{ color: "#F8A809", fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 10 }}>
            Roc Eclerc Nancy
          </p>
          <h1 style={{ color: "#fff", fontSize: 28, fontWeight: 600, marginBottom: 12 }} className="md:text-[34px]">
            Espace Mémoriel
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", fontSize: 15, marginBottom: 24 }}>
            Retrouvez les espaces dédiés à la mémoire de nos proches disparus
          </p>
          <MemorialSearch defaultValue={q} />
        </div>
      </section>

      {/* Liste */}
      <section style={{ padding: "50px 0 60px" }}>
        <div className="max-w-[1000px] mx-auto px-4">
          {q && (
            <p style={{ color: "#888", fontSize: 14, marginBottom: 20 }}>
              {defunts.length} résultat{defunts.length !== 1 ? "s" : ""} pour &laquo;&nbsp;{q}&nbsp;&raquo;
            </p>
          )}

          {defunts.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 0" }}>
              <p style={{ color: "#888", fontSize: 16 }}>
                {q ? "Aucun résultat trouvé." : "Aucun espace mémoriel publié pour le moment."}
              </p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 md:grid-cols-3" style={{ gap: 20 }}>
              {defunts.map((d: { id: string; slug: string; prenom: string; nom: string; dateNaissance: Date | null; dateDeces: Date; photoUrl: string | null; texteAnnonce: string | null }) => (
                <Link
                  key={d.id}
                  href={`/${d.slug}`}
                  style={{
                    background: "#fff",
                    borderRadius: 10,
                    border: "1px solid #eee",
                    overflow: "hidden",
                    transition: "all 0.3s ease",
                  }}
                  className="hover:shadow-lg group"
                >
                  <div style={{ position: "relative", aspectRatio: "16/10", background: "#f0f0f0" }}>
                    {d.photoUrl ? (
                      <Image
                        src={d.photoUrl}
                        alt={`${d.prenom} ${d.nom}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                          <circle cx="12" cy="7" r="4" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "16px 20px" }}>
                    <h2 style={{ fontSize: 17, fontWeight: 600, color: "#16234c", marginBottom: 4 }}>
                      {d.prenom} {d.nom}
                    </h2>
                    <p style={{ fontSize: 13, color: "#888" }}>
                      {d.dateNaissance && formatDate(d.dateNaissance)}
                      {d.dateNaissance && " — "}
                      {formatDate(d.dateDeces)}
                    </p>
                    {d.texteAnnonce && (
                      <p style={{ fontSize: 13, color: "#aaa", marginTop: 8, lineHeight: 1.5 }} className="line-clamp-2">
                        {d.texteAnnonce}
                      </p>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
