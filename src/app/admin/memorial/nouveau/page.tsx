"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function NouvelleMemorialPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    prenom: "",
    nom: "",
    dateNaissance: "",
    dateDeces: "",
    texteAnnonce: "",
    ceremonieLieu: "",
    ceremonieDate: "",
    ceremonieHeure: "",
    acces: "PUBLIC",
    statut: "BROUILLON",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/memorial", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Erreur");
        return;
      }

      const data = await res.json();
      router.push(`/admin/memorial/${data.id}/edit`);
    } catch {
      setError("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  };

  const update = (field: string, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div>
      <h1 style={{ fontSize: 22, fontWeight: 600, color: "#16234c", marginBottom: 24 }}>
        Nouvelle fiche mémorielle
      </h1>

      <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
        <div style={{ background: "#fff", borderRadius: 10, padding: "28px 24px", border: "1px solid #eee", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#16234c", marginBottom: 16 }}>Identité</h2>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Prénom *</label>
              <input type="text" required value={form.prenom} onChange={(e) => update("prenom", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Nom *</label>
              <input type="text" required value={form.nom} onChange={(e) => update("nom", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }} />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Date de naissance</label>
              <input type="date" value={form.dateNaissance} onChange={(e) => update("dateNaissance", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Date de décès *</label>
              <input type="date" required value={form.dateDeces} onChange={(e) => update("dateDeces", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Texte d&apos;annonce</label>
            <textarea value={form.texteAnnonce} onChange={(e) => update("texteAnnonce", e.target.value)} rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none", resize: "vertical" }}
              placeholder="Un texte pour accompagner l'avis..." />
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 10, padding: "28px 24px", border: "1px solid #eee", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#16234c", marginBottom: 16 }}>Cérémonie</h2>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Lieu</label>
            <input type="text" value={form.ceremonieLieu} onChange={(e) => update("ceremonieLieu", e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }}
              placeholder="Ex: Église Saint-Sébastien, Nancy" />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Date</label>
              <input type="date" value={form.ceremonieDate} onChange={(e) => update("ceremonieDate", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Heure</label>
              <input type="time" value={form.ceremonieHeure} onChange={(e) => update("ceremonieHeure", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }} />
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 10, padding: "28px 24px", border: "1px solid #eee", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#16234c", marginBottom: 16 }}>Publication</h2>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Accès</label>
              <select value={form.acces} onChange={(e) => update("acces", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }}>
                <option value="PUBLIC">Public</option>
                <option value="PRIVE">Privé (lien uniquement)</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Statut</label>
              <select value={form.statut} onChange={(e) => update("statut", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }}>
                <option value="BROUILLON">Brouillon</option>
                <option value="PUBLIE">Publié</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", color: "#991b1b", borderRadius: 6, padding: "12px 16px", marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading} className="btn-accent" style={{ padding: "14px 32px", fontSize: 16, opacity: loading ? 0.7 : 1 }}>
          {loading ? "Création..." : "Créer la fiche"}
        </button>
      </form>
    </div>
  );
}
