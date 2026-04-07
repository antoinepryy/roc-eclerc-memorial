import Link from "next/link";
import { prisma } from "@/lib/prisma";

export default async function AdminDashboard() {
  const [totalDefunts, defuntsPublies, condoleancesEnAttente, totalVideos, totalTextes] =
    await Promise.all([
      prisma.defunt.count(),
      prisma.defunt.count({ where: { statut: "PUBLIE" } }),
      prisma.condoleance.count({ where: { statut: "EN_ATTENTE" } }),
      prisma.videoHommage.count({ where: { statut: "TERMINE" } }),
      prisma.texteHommage.count(),
    ]);

  const stats = [
    { label: "Fiches mémorielles", value: totalDefunts, sub: `${defuntsPublies} publiées`, color: "#16234c" },
    { label: "Condoléances en attente", value: condoleancesEnAttente, sub: "à modérer", color: condoleancesEnAttente > 0 ? "#e08907" : "#16234c" },
    { label: "Vidéos hommage", value: totalVideos, sub: "générées", color: "#16234c" },
    { label: "Textes hommage", value: totalTextes, sub: "créés", color: "#16234c" },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 style={{ fontSize: 24, fontWeight: 600, color: "#16234c" }}>Dashboard</h1>
        <Link href="/admin/memorial/nouveau" className="btn-accent" style={{ padding: "10px 20px", fontSize: 14 }}>
          + Nouvelle fiche
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            style={{
              background: "#fff",
              borderRadius: 10,
              padding: "20px",
              border: "1px solid #eee",
            }}
          >
            <p style={{ fontSize: 13, color: "#888", marginBottom: 4 }}>{stat.label}</p>
            <p style={{ fontSize: 28, fontWeight: 700, color: stat.color }}>{stat.value}</p>
            <p style={{ fontSize: 12, color: "#aaa" }}>{stat.sub}</p>
          </div>
        ))}
      </div>

      {condoleancesEnAttente > 0 && (
        <div style={{
          background: "rgba(248,168,9,0.08)",
          border: "1px solid rgba(248,168,9,0.3)",
          borderRadius: 8,
          padding: "16px 20px",
          marginBottom: 24,
        }} className="flex items-center justify-between">
          <p style={{ color: "#16234c", fontSize: 14 }}>
            <strong>{condoleancesEnAttente}</strong> condoléance{condoleancesEnAttente > 1 ? "s" : ""} en attente de modération
          </p>
          <Link href="/admin/memorial" style={{ color: "#F8A809", fontWeight: 500, fontSize: 14 }}>
            Voir les fiches
          </Link>
        </div>
      )}
    </div>
  );
}
