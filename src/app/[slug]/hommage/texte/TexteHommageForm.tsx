"use client";

import { useState } from "react";

const RELATIONS = [
  { id: "enfant", label: "Son enfant" },
  { id: "conjoint", label: "Son conjoint(e)" },
  { id: "parent", label: "Son parent" },
  { id: "petit-enfant", label: "Son petit-enfant" },
  { id: "ami", label: "Son ami(e)" },
  { id: "collegue", label: "Son collègue" },
  { id: "voisin", label: "Son voisin(e)" },
  { id: "autre", label: "Autre" },
];

const TRAIT_CATEGORIES = [
  {
    label: "Cœur",
    traits: ["Généreux", "Bienveillant", "Tendre", "Chaleureux", "Attentionné", "Dévoué"],
  },
  {
    label: "Force",
    traits: ["Courageux", "Protecteur", "Travailleur", "Fidèle", "Patient", "Humble"],
  },
  {
    label: "Esprit",
    traits: ["Drôle", "Créatif", "Sage", "Passionné", "Aventurier", "Authentique"],
  },
  {
    label: "Présence",
    traits: ["Calme", "Joyeux", "Discret", "Élégant", "Réconfortant"],
  },
];

const TONS = [
  { id: "solennel", label: "Solennel", desc: "Respectueux et digne, pour une cérémonie" },
  { id: "chaleureux", label: "Chaleureux", desc: "Affectueux et intime, comme à un proche" },
  { id: "poetique", label: "Poétique", desc: "Lyrique et délicat, empreint d'images" },
  { id: "leger", label: "Léger", desc: "Doux, avec des touches de sourire et de tendresse" },
];

const LONGUEURS = [
  { id: "court", label: "Court", desc: "100-150 mots — carte de cérémonie" },
  { id: "moyen", label: "Moyen", desc: "200-300 mots — format standard" },
  { id: "long", label: "Long", desc: "350-500 mots — livret mémorial" },
];

type FormData = {
  relation: string;
  surnom: string;
  traits: string[];
  passions: string;
  anecdotes: string;
  messagePersonnel: string;
  tonalite: string;
  longueur: string;
};

export default function TexteHommageForm({ slug, prenom }: { slug: string; prenom: string }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    relation: "",
    surnom: "",
    traits: [],
    passions: "",
    anecdotes: "",
    messagePersonnel: "",
    tonalite: "chaleureux",
    longueur: "moyen",
  });
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [texte, setTexte] = useState("");
  const [copied, setCopied] = useState(false);

  const toggleTrait = (trait: string) => {
    setForm((prev) => ({
      ...prev,
      traits: prev.traits.includes(trait)
        ? prev.traits.filter((t) => t !== trait)
        : [...prev.traits, trait],
    }));
  };

  const handleGenerate = async () => {
    setStatus("generating");
    try {
      const res = await fetch(`/api/memorial/${slug}/texte-hommage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTexte(data.contenu);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(texte);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadPdf = async () => {
    const res = await fetch(`/api/memorial/${slug}/texte-hommage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contenu: texte, format: "pdf" }),
    });
    if (!res.ok) return;
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hommage-${slug}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const canGoStep2 = form.relation !== "" && form.traits.length > 0;

  const inputStyle = { width: "100%", padding: "10px 12px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" } as const;
  const cardStyle = { background: "#f9f9fb", borderRadius: 10, padding: "28px 24px", border: "1px solid #eee" } as const;
  const btnBack = { padding: "12px 28px", fontSize: 15, borderRadius: 6, border: "1px solid #ddd", background: "#fff", color: "#16234c", cursor: "pointer" } as const;

  return (
    <div>
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div style={{
              width: 32, height: 32, borderRadius: "50%",
              background: step >= s ? "#F8A809" : "#eee",
              color: step >= s ? "#fff" : "#999",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 600,
            }}>
              {s}
            </div>
            {s < 3 && <div style={{ width: 40, height: 2, background: step > s ? "#F8A809" : "#eee" }} />}
          </div>
        ))}
      </div>

      {/* Étape 1 : Personnalité */}
      {step === 1 && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#16234c", marginBottom: 20 }}>
            1. Qui était {prenom} ?
          </h2>

          {/* Relation */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 8 }}>
              Quel est votre lien avec {prenom} ?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {RELATIONS.map((r) => (
                <button key={r.id} type="button" onClick={() => setForm({ ...form, relation: r.id })}
                  style={{
                    padding: "10px 8px", borderRadius: 8, fontSize: 13, cursor: "pointer",
                    border: form.relation === r.id ? "2px solid #F8A809" : "2px solid #eee",
                    background: form.relation === r.id ? "rgba(248,168,9,0.1)" : "#fff",
                    color: form.relation === r.id ? "#16234c" : "#888",
                    fontWeight: form.relation === r.id ? 600 : 400,
                  }}>
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Surnom */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>
              Surnom ou petit nom (optionnel)
            </label>
            <input type="text" value={form.surnom}
              onChange={(e) => setForm({ ...form, surnom: e.target.value })}
              style={inputStyle}
              placeholder="Ex: Papy Jean, Mamie, Tonton..."
            />
          </div>

          {/* Traits catégorisés */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 10 }}>
              Traits de caractère
            </label>
            {TRAIT_CATEGORIES.map((cat) => (
              <div key={cat.label} style={{ marginBottom: 12 }}>
                <p style={{ fontSize: 12, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: 1, marginBottom: 6 }}>
                  {cat.label}
                </p>
                <div className="flex flex-wrap gap-2">
                  {cat.traits.map((trait) => (
                    <button key={trait} type="button" onClick={() => toggleTrait(trait)}
                      style={{
                        padding: "7px 14px", borderRadius: 20, fontSize: 13, cursor: "pointer",
                        border: form.traits.includes(trait) ? "2px solid #F8A809" : "2px solid #ddd",
                        background: form.traits.includes(trait) ? "rgba(248,168,9,0.1)" : "#fff",
                        color: form.traits.includes(trait) ? "#16234c" : "#888",
                        fontWeight: form.traits.includes(trait) ? 600 : 400,
                      }}>
                      {trait}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <button onClick={() => setStep(2)} disabled={!canGoStep2}
            className="btn-accent"
            style={{ padding: "12px 28px", fontSize: 15, opacity: canGoStep2 ? 1 : 0.5 }}>
            Suivant
          </button>
        </div>
      )}

      {/* Étape 2 : Passions & souvenirs */}
      {step === 2 && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#16234c", marginBottom: 16 }}>
            2. Passions & souvenirs
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>
              Passions, activités, centres d&apos;intérêt
            </label>
            <textarea value={form.passions}
              onChange={(e) => setForm({ ...form, passions: e.target.value })}
              rows={3} style={{ ...inputStyle, resize: "vertical" as const }}
              placeholder="Ex: la cuisine, le jardinage, la pêche, les voyages..."
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>
              Anecdotes ou souvenirs marquants
            </label>
            <textarea value={form.anecdotes}
              onChange={(e) => setForm({ ...form, anecdotes: e.target.value })}
              rows={4} style={{ ...inputStyle, resize: "vertical" as const }}
              placeholder="Racontez un moment, une habitude, une phrase qu'il/elle disait souvent..."
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>
              Qu&apos;aimeriez-vous lui dire ?
            </label>
            <p style={{ fontSize: 12, color: "#aaa", marginBottom: 8 }}>
              Un message personnel, comme si vous pouviez lui parler une dernière fois
            </p>
            <textarea value={form.messagePersonnel}
              onChange={(e) => setForm({ ...form, messagePersonnel: e.target.value })}
              rows={3} style={{ ...inputStyle, resize: "vertical" as const }}
              placeholder="Ce que vous auriez aimé lui dire..."
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setStep(1)} style={btnBack}>Retour</button>
            <button onClick={() => setStep(3)} className="btn-accent" style={{ padding: "12px 28px", fontSize: 15 }}>
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Étape 3 : Ton & longueur */}
      {step === 3 && !texte && (
        <div style={cardStyle}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#16234c", marginBottom: 16 }}>
            3. Ton et longueur
          </h2>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 10 }}>
              Ton du texte
            </label>
            <div className="space-y-2">
              {TONS.map((ton) => (
                <button key={ton.id} onClick={() => setForm({ ...form, tonalite: ton.id })}
                  className="w-full text-left"
                  style={{
                    padding: "14px 16px", borderRadius: 8, cursor: "pointer",
                    border: form.tonalite === ton.id ? "2px solid #F8A809" : "2px solid #eee",
                    background: form.tonalite === ton.id ? "rgba(248,168,9,0.05)" : "#fff",
                  }}>
                  <p style={{ fontSize: 15, fontWeight: 500, color: "#16234c" }}>{ton.label}</p>
                  <p style={{ fontSize: 13, color: "#888" }}>{ton.desc}</p>
                </button>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 10 }}>
              Longueur du texte
            </label>
            <div className="grid grid-cols-3 gap-2">
              {LONGUEURS.map((l) => (
                <button key={l.id} onClick={() => setForm({ ...form, longueur: l.id })}
                  style={{
                    padding: "12px 10px", borderRadius: 8, cursor: "pointer", textAlign: "center",
                    border: form.longueur === l.id ? "2px solid #F8A809" : "2px solid #eee",
                    background: form.longueur === l.id ? "rgba(248,168,9,0.05)" : "#fff",
                  }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: "#16234c" }}>{l.label}</p>
                  <p style={{ fontSize: 11, color: "#888", marginTop: 2 }}>{l.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {status === "error" && (
            <div style={{ background: "#fef2f2", color: "#991b1b", borderRadius: 6, padding: "12px 16px", marginBottom: 16, fontSize: 14 }}>
              Erreur lors de la génération. Veuillez réessayer.
            </div>
          )}

          <div className="flex gap-3">
            <button onClick={() => setStep(2)} style={btnBack}>Retour</button>
            <button onClick={handleGenerate} disabled={status === "generating"}
              className="btn-accent"
              style={{ padding: "12px 28px", fontSize: 15, opacity: status === "generating" ? 0.7 : 1 }}>
              {status === "generating" ? "Génération en cours..." : "Générer le texte hommage"}
            </button>
          </div>
        </div>
      )}

      {/* Résultat */}
      {texte && (
        <div>
          <div style={{ background: "#fff", borderRadius: 10, padding: "32px 28px", border: "1px solid #eee", marginBottom: 20 }}>
            <p style={{ color: "#F8A809", fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 4 }}>
              Texte hommage
            </p>
            <p style={{ fontSize: 12, color: "#aaa", marginBottom: 16 }}>
              Vous pouvez modifier le texte avant de le télécharger
            </p>
            <textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              rows={12}
              style={{
                width: "100%", padding: "16px", borderRadius: 8,
                border: "1px solid #eee", fontSize: 15, lineHeight: 2,
                color: "#555", outline: "none", resize: "vertical",
                background: "#fafafa",
              }}
            />
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <button onClick={handleCopy}
              style={{ padding: "12px 24px", fontSize: 14, borderRadius: 6, border: "1px solid #ddd", background: "#fff", color: "#16234c", cursor: "pointer" }}>
              {copied ? "Copié !" : "Copier le texte"}
            </button>
            <button onClick={() => { setTexte(""); setStatus("idle"); }}
              style={{ padding: "12px 24px", fontSize: 14, borderRadius: 6, border: "1px solid #ddd", background: "#fff", color: "#16234c", cursor: "pointer" }}>
              Regénérer
            </button>
            <button onClick={handleDownloadPdf}
              className="btn-accent"
              style={{ padding: "12px 24px", fontSize: 14 }}>
              Télécharger en PDF
            </button>
            <a href={`/${slug}`}
              style={{ padding: "12px 24px", fontSize: 14, borderRadius: 6, border: "1px solid #ddd", color: "#16234c", textDecoration: "none" }}>
              Retour
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
