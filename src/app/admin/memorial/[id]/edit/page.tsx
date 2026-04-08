"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

type DefuntData = {
  id: string;
  slug: string;
  prenom: string;
  nom: string;
  genre: string | null;
  dateNaissance: string | null;
  dateDeces: string;
  photoUrl: string | null;
  texteAnnonce: string | null;
  ceremonieLieu: string | null;
  ceremonieDate: string | null;
  ceremonieHeure: string | null;
  acces: string;
  statut: string;
  tokenFamille: string | null;
};

export default function EditMemorialPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [form, setForm] = useState<DefuntData | null>(null);

  useEffect(() => {
    fetch(`/api/admin/memorial/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setForm({
          ...data,
          dateNaissance: data.dateNaissance ? data.dateNaissance.slice(0, 10) : "",
          dateDeces: data.dateDeces.slice(0, 10),
          ceremonieDate: data.ceremonieDate ? data.ceremonieDate.slice(0, 10) : "",
        });
        setLoading(false);
      })
      .catch(() => {
        setError("Erreur de chargement");
        setLoading(false);
      });
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form) return;
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch(`/api/admin/memorial/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setSuccess("Fiche mise à jour");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Supprimer cette fiche mémorielle ? Cette action est irréversible.")) return;
    await fetch(`/api/admin/memorial/${id}`, { method: "DELETE" });
    router.push("/admin/memorial");
  };

  if (loading) return <p style={{ color: "#888" }}>Chargement...</p>;
  if (!form) return <p style={{ color: "#991b1b" }}>Fiche introuvable</p>;

  const update = (field: string, value: string) => setForm((prev) => prev ? { ...prev, [field]: value } : prev);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingPhoto(true);
    try {
      const fd = new FormData();
      fd.append("photo", file);
      const res = await fetch(`/api/admin/memorial/${id}/photo`, { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setForm((prev) => prev ? { ...prev, photoUrl: data.photoUrl } : prev);
      setSuccess("Photo mise à jour");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Erreur lors de l'upload de la photo");
    } finally {
      setUploadingPhoto(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 style={{ fontSize: 22, fontWeight: 600, color: "#16234c" }}>
          Modifier : {form.prenom} {form.nom}
        </h1>
        <div className="flex gap-3">
          <Link
            href={`/admin/memorial/${id}/condoleances`}
            style={{ padding: "8px 16px", fontSize: 13, borderRadius: 6, border: "1px solid #ddd", color: "#16234c", textDecoration: "none" }}
          >
            Condoléances
          </Link>
          {form.statut === "PUBLIE" && (
            <Link
              href={`/${form.slug}`}
              target="_blank"
              style={{ padding: "8px 16px", fontSize: 13, borderRadius: 6, background: "#16234c", color: "#fff", textDecoration: "none" }}
            >
              Voir la page
            </Link>
          )}
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
        {/* Photo de profil */}
        <div style={{ background: "#fff", borderRadius: 10, padding: "28px 24px", border: "1px solid #eee", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#16234c", marginBottom: 16 }}>Photo de profil</h2>
          <div className="flex items-center gap-4">
            {form.photoUrl ? (
              <img src={form.photoUrl} alt="Photo" style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", border: "2px solid #eee" }} />
            ) : (
              <div style={{ width: 80, height: 80, borderRadius: "50%", background: "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: 28 }}>?</div>
            )}
            <label style={{ padding: "10px 16px", borderRadius: 6, background: "#16234c", color: "#fff", fontSize: 13, cursor: "pointer", opacity: uploadingPhoto ? 0.6 : 1 }}>
              {uploadingPhoto ? "Upload..." : form.photoUrl ? "Changer la photo" : "Ajouter une photo"}
              <input type="file" accept="image/*" style={{ display: "none" }} onChange={handlePhotoUpload} disabled={uploadingPhoto} />
            </label>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 10, padding: "28px 24px", border: "1px solid #eee", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#16234c", marginBottom: 16 }}>Identité</h2>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Prénom</label>
              <input type="text" required value={form.prenom} onChange={(e) => update("prenom", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Nom</label>
              <input type="text" required value={form.nom} onChange={(e) => update("nom", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }} />
            </div>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Genre</label>
            <select value={form.genre || ""} onChange={(e) => update("genre", e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }}>
              <option value="">Non renseigné</option>
              <option value="HOMME">Homme</option>
              <option value="FEMME">Femme</option>
            </select>
          </div>

          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Date de naissance</label>
              <input type="date" value={form.dateNaissance || ""} onChange={(e) => update("dateNaissance", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Date de décès</label>
              <input type="date" required value={form.dateDeces} onChange={(e) => update("dateDeces", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }} />
            </div>
          </div>

          <div>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Texte d&apos;annonce</label>
            <textarea value={form.texteAnnonce || ""} onChange={(e) => update("texteAnnonce", e.target.value)} rows={3}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none", resize: "vertical" }} />
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 10, padding: "28px 24px", border: "1px solid #eee", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#16234c", marginBottom: 16 }}>Cérémonie</h2>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Lieu</label>
            <input type="text" value={form.ceremonieLieu || ""} onChange={(e) => update("ceremonieLieu", e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }} />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Date</label>
              <input type="date" value={form.ceremonieDate || ""} onChange={(e) => update("ceremonieDate", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }} />
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Heure</label>
              <input type="time" value={form.ceremonieHeure || ""} onChange={(e) => update("ceremonieHeure", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }} />
            </div>
          </div>
        </div>

        <div style={{ background: "#fff", borderRadius: 10, padding: "28px 24px", border: "1px solid #eee", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#16234c", marginBottom: 16 }}>Publication</h2>
          <div className="grid sm:grid-cols-2 gap-4 mb-4">
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Accès</label>
              <select value={form.acces} onChange={(e) => update("acces", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }}>
                <option value="PUBLIC">Public</option>
                <option value="PRIVE">Privé</option>
              </select>
            </div>
            <div>
              <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>Statut</label>
              <select value={form.statut} onChange={(e) => update("statut", e.target.value)}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }}>
                <option value="BROUILLON">Brouillon</option>
                <option value="PUBLIE">Publié</option>
                <option value="ARCHIVE">Archivé</option>
              </select>
            </div>
          </div>

          {form.tokenFamille && (
            <div style={{ background: "#f9f9fb", borderRadius: 6, padding: "12px 14px", border: "1px solid #eee" }}>
              <p style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>Lien famille :</p>
              <code style={{ fontSize: 12, color: "#16234c", wordBreak: "break-all" }}>
                /{form.slug}?token={form.tokenFamille}
              </code>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <p style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>QR Code :</p>
            <a
              href={`/api/memorial/${form.slug}/qrcode`}
              target="_blank"
              style={{ color: "#F8A809", fontSize: 13, fontWeight: 500 }}
            >
              Télécharger le QR code
            </a>
          </div>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", color: "#991b1b", borderRadius: 6, padding: "12px 16px", marginBottom: 16, fontSize: 14 }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{ background: "#f0fdf4", color: "#166534", borderRadius: 6, padding: "12px 16px", marginBottom: 16, fontSize: 14 }}>
            {success}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button type="submit" disabled={saving} className="btn-accent" style={{ padding: "12px 28px", fontSize: 15, opacity: saving ? 0.7 : 1 }}>
            {saving ? "Sauvegarde..." : "Sauvegarder"}
          </button>
          <button type="button" onClick={handleDelete} style={{ color: "#991b1b", fontSize: 13, background: "none", border: "none", cursor: "pointer" }}>
            Supprimer la fiche
          </button>
        </div>
      </form>
    </div>
  );
}
