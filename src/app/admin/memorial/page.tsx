import Link from "next/link";
import { prisma } from "@/lib/prisma";

const STATUT_LABELS: Record<string, { label: string; bg: string; color: string }> = {
  BROUILLON: { label: "Brouillon", bg: "#f5f5f5", color: "#888" },
  PUBLIE: { label: "Publié", bg: "#f0fdf4", color: "#166534" },
  ARCHIVE: { label: "Archivé", bg: "#fef2f2", color: "#991b1b" },
};

export default async function AdminMemorialList() {
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

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#16234c" }}>Fiches mémorielles</h1>
        <Link href="/admin/memorial/nouveau" className="btn-accent" style={{ padding: "10px 20px", fontSize: 14 }}>
          + Nouvelle fiche
        </Link>
      </div>

      {defunts.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#888" }}>
          <p style={{ fontSize: 16, marginBottom: 12 }}>Aucune fiche mémorielle</p>
          <Link href="/admin/memorial/nouveau" style={{ color: "#F8A809", fontWeight: 500 }}>
            Créer la première
          </Link>
        </div>
      ) : (
        <div style={{ background: "#fff", borderRadius: 10, border: "1px solid #eee", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#f9f9fb", borderBottom: "1px solid #eee" }}>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 13, color: "#888", fontWeight: 500 }}>Nom</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 13, color: "#888", fontWeight: 500 }}>Date décès</th>
                <th style={{ textAlign: "left", padding: "12px 16px", fontSize: 13, color: "#888", fontWeight: 500 }}>Statut</th>
                <th style={{ textAlign: "center", padding: "12px 16px", fontSize: 13, color: "#888", fontWeight: 500 }}>Condol. en attente</th>
                <th style={{ textAlign: "center", padding: "12px 16px", fontSize: 13, color: "#888", fontWeight: 500 }}>Photos</th>
                <th style={{ textAlign: "right", padding: "12px 16px", fontSize: 13, color: "#888", fontWeight: 500 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {defunts.map((d: { id: string; slug: string; prenom: string; nom: string; dateDeces: Date; statut: string; _count: { condoleances: number; medias: number } }) => {
                const s = STATUT_LABELS[d.statut] || STATUT_LABELS.BROUILLON;
                return (
                  <tr key={d.id} style={{ borderBottom: "1px solid #f0f0f0" }}>
                    <td style={{ padding: "14px 16px" }}>
                      <p style={{ fontSize: 15, fontWeight: 500, color: "#16234c" }}>
                        {d.prenom} {d.nom}
                      </p>
                      <p style={{ fontSize: 12, color: "#aaa" }}>{d.slug}</p>
                    </td>
                    <td style={{ padding: "14px 16px", fontSize: 14, color: "#666" }}>
                      {d.dateDeces.toLocaleDateString("fr-FR")}
                    </td>
                    <td style={{ padding: "14px 16px" }}>
                      <span style={{ background: s.bg, color: s.color, padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500 }}>
                        {s.label}
                      </span>
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center" }}>
                      {d._count.condoleances > 0 ? (
                        <Link
                          href={`/admin/memorial/${d.id}/condoleances`}
                          style={{ background: "#FEF3C7", color: "#92400E", padding: "4px 10px", borderRadius: 12, fontSize: 12, fontWeight: 500 }}
                        >
                          {d._count.condoleances}
                        </Link>
                      ) : (
                        <span style={{ color: "#ccc", fontSize: 13 }}>0</span>
                      )}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "center", fontSize: 13, color: "#888" }}>
                      {d._count.medias}
                    </td>
                    <td style={{ padding: "14px 16px", textAlign: "right" }}>
                      <div className="flex gap-2 justify-end">
                        <Link
                          href={`/admin/memorial/${d.id}/edit`}
                          style={{ color: "#F8A809", fontSize: 13, fontWeight: 500 }}
                        >
                          Modifier
                        </Link>
                        {d.statut === "PUBLIE" && (
                          <Link
                            href={`/${d.slug}`}
                            target="_blank"
                            style={{ color: "#888", fontSize: 13 }}
                          >
                            Voir
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
