"use client";

type Condoleance = {
  id: string;
  auteurNom: string;
  message: string;
  createdAt: string;
};

export default function CondoleancesList({ condoleances }: { condoleances: Condoleance[] }) {
  if (condoleances.length === 0) {
    return (
      <p style={{ textAlign: "center", color: "#888", fontSize: 15 }}>
        Aucune condoléance pour le moment. Soyez le premier à laisser un message.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {condoleances.map((c) => (
        <div
          key={c.id}
          style={{
            background: "#fff",
            borderRadius: 8,
            padding: "20px 24px",
            border: "1px solid #eee",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <p style={{ fontWeight: 600, fontSize: 15, color: "#16234c" }}>{c.auteurNom}</p>
            <p style={{ fontSize: 12, color: "#aaa" }}>
              {new Date(c.createdAt).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
          <p style={{ fontSize: 14, lineHeight: 1.7, color: "#555", whiteSpace: "pre-wrap" }}>
            {c.message}
          </p>
        </div>
      ))}
    </div>
  );
}
