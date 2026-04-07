"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";

type Condoleance = {
  id: string;
  auteurNom: string;
  auteurEmail: string | null;
  message: string;
  statut: string;
  createdAt: string;
};

export default function AdminCondoleancesPage() {
  const { id } = useParams<{ id: string }>();
  const [condoleances, setCondoleances] = useState<Condoleance[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"EN_ATTENTE" | "APPROUVE" | "REJETE" | "ALL">("EN_ATTENTE");

  const loadCondoleances = useCallback(async () => {
    const res = await fetch(`/api/admin/memorial/${id}/condoleances`);
    const data = await res.json();
    setCondoleances(data);
    setLoading(false);
  }, [id]);

  useEffect(() => { loadCondoleances(); }, [loadCondoleances]);

  const updateStatut = async (condoleanceId: string, statut: "APPROUVE" | "REJETE") => {
    await fetch(`/api/admin/memorial/${id}/condoleances`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ condoleanceId, statut }),
    });
    setCondoleances((prev) =>
      prev.map((c) => (c.id === condoleanceId ? { ...c, statut } : c))
    );
  };

  const approveAll = async () => {
    const pending = condoleances.filter((c) => c.statut === "EN_ATTENTE");
    for (const c of pending) {
      await updateStatut(c.id, "APPROUVE");
    }
  };

  const filtered = filter === "ALL" ? condoleances : condoleances.filter((c) => c.statut === filter);
  const pendingCount = condoleances.filter((c) => c.statut === "EN_ATTENTE").length;

  if (loading) return <p style={{ color: "#888" }}>Chargement...</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#16234c" }}>
          Modération des condoléances
        </h1>
        {pendingCount > 0 && (
          <button onClick={approveAll} className="btn-accent" style={{ padding: "8px 16px", fontSize: 13 }}>
            Tout approuver ({pendingCount})
          </button>
        )}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        {(["EN_ATTENTE", "APPROUVE", "REJETE", "ALL"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: "8px 14px",
              borderRadius: 6,
              border: filter === f ? "2px solid #F8A809" : "2px solid #eee",
              background: filter === f ? "rgba(248,168,9,0.05)" : "#fff",
              fontSize: 13,
              cursor: "pointer",
              color: "#16234c",
            }}
          >
            {f === "EN_ATTENTE" ? `En attente (${pendingCount})` : f === "APPROUVE" ? "Approuvées" : f === "REJETE" ? "Rejetées" : "Toutes"}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <p style={{ color: "#888", textAlign: "center", padding: "40px 0" }}>
          Aucune condoléance {filter !== "ALL" ? "dans cette catégorie" : ""}
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((c) => (
            <div
              key={c.id}
              style={{
                background: "#fff",
                borderRadius: 8,
                padding: "16px 20px",
                border: c.statut === "EN_ATTENTE" ? "1px solid #F8A809" : "1px solid #eee",
              }}
            >
              <div className="flex items-start justify-between gap-4">
                <div style={{ flex: 1 }}>
                  <div className="flex items-center gap-2 mb-1">
                    <p style={{ fontWeight: 600, fontSize: 14, color: "#16234c" }}>{c.auteurNom}</p>
                    {c.auteurEmail && (
                      <span style={{ fontSize: 12, color: "#aaa" }}>{c.auteurEmail}</span>
                    )}
                    <span style={{ fontSize: 11, color: "#ccc" }}>
                      {new Date(c.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.6, color: "#555", whiteSpace: "pre-wrap" }}>{c.message}</p>
                </div>

                {c.statut === "EN_ATTENTE" && (
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => updateStatut(c.id, "APPROUVE")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 4,
                        background: "#f0fdf4",
                        color: "#166534",
                        border: "1px solid #bbf7d0",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Approuver
                    </button>
                    <button
                      onClick={() => updateStatut(c.id, "REJETE")}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 4,
                        background: "#fef2f2",
                        color: "#991b1b",
                        border: "1px solid #fecaca",
                        fontSize: 12,
                        cursor: "pointer",
                      }}
                    >
                      Rejeter
                    </button>
                  </div>
                )}

                {c.statut !== "EN_ATTENTE" && (
                  <span
                    style={{
                      padding: "4px 10px",
                      borderRadius: 12,
                      fontSize: 11,
                      fontWeight: 500,
                      background: c.statut === "APPROUVE" ? "#f0fdf4" : "#fef2f2",
                      color: c.statut === "APPROUVE" ? "#166534" : "#991b1b",
                    }}
                  >
                    {c.statut === "APPROUVE" ? "Approuvée" : "Rejetée"}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
