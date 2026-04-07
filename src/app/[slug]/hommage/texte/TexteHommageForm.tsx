"use client";

import { useState } from "react";

const TRAITS = [
  "Généreux", "Drôle", "Calme", "Courageux", "Attentionné",
  "Travailleur", "Créatif", "Passionné", "Protecteur", "Joyeux",
  "Sage", "Aventurier", "Discret", "Chaleureux", "Patient",
];

const TONS = [
  { id: "solennel", label: "Solennel", desc: "Ton respectueux et formel" },
  { id: "chaleureux", label: "Chaleureux", desc: "Ton affectueux et intime" },
  { id: "poetique", label: "Poétique", desc: "Ton lyrique et métaphorique" },
  { id: "leger", label: "Léger", desc: "Ton doux, avec des touches de sourire" },
];

type FormData = {
  surnom: string;
  traits: string[];
  passions: string;
  anecdotes: string;
  tonalite: string;
};

export default function TexteHommageForm({ slug, prenom }: { slug: string; prenom: string }) {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>({
    surnom: "",
    traits: [],
    passions: "",
    anecdotes: "",
    tonalite: "chaleureux",
  });
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [texte, setTexte] = useState("");

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

  return (
    <div>
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                background: step >= s ? "#F8A809" : "#eee",
                color: step >= s ? "#fff" : "#999",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              {s}
            </div>
            {s < 3 && (
              <div style={{ width: 40, height: 2, background: step > s ? "#F8A809" : "#eee" }} />
            )}
          </div>
        ))}
      </div>

      {/* Étape 1 : Personnalité */}
      {step === 1 && (
        <div style={{ background: "#f9f9fb", borderRadius: 10, padding: "28px 24px", border: "1px solid #eee" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#16234c", marginBottom: 16 }}>
            1. Qui était {prenom} ?
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>
              Surnom ou petit nom (optionnel)
            </label>
            <input
              type="text"
              value={form.surnom}
              onChange={(e) => setForm({ ...form, surnom: e.target.value })}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none" }}
              placeholder="Ex: Papy Jean, Mamie, Tonton..."
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 10 }}>
              Traits de caractère
            </label>
            <div className="flex flex-wrap gap-2">
              {TRAITS.map((trait) => (
                <button
                  key={trait}
                  type="button"
                  onClick={() => toggleTrait(trait)}
                  style={{
                    padding: "8px 14px",
                    borderRadius: 20,
                    border: form.traits.includes(trait) ? "2px solid #F8A809" : "2px solid #ddd",
                    background: form.traits.includes(trait) ? "rgba(248,168,9,0.1)" : "#fff",
                    color: form.traits.includes(trait) ? "#16234c" : "#888",
                    fontSize: 13,
                    cursor: "pointer",
                    fontWeight: form.traits.includes(trait) ? 600 : 400,
                  }}
                >
                  {trait}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => setStep(2)}
            disabled={form.traits.length === 0}
            className="btn-accent"
            style={{ padding: "12px 28px", fontSize: 15, opacity: form.traits.length === 0 ? 0.5 : 1 }}
          >
            Suivant
          </button>
        </div>
      )}

      {/* Étape 2 : Passions & souvenirs */}
      {step === 2 && (
        <div style={{ background: "#f9f9fb", borderRadius: 10, padding: "28px 24px", border: "1px solid #eee" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#16234c", marginBottom: 16 }}>
            2. Passions & souvenirs
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>
              Passions, activités, centres d&apos;intérêt
            </label>
            <textarea
              value={form.passions}
              onChange={(e) => setForm({ ...form, passions: e.target.value })}
              rows={3}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none", resize: "vertical" }}
              placeholder="Ex: la cuisine, le jardinage, la pêche, les voyages..."
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>
              Anecdotes ou souvenirs marquants
            </label>
            <textarea
              value={form.anecdotes}
              onChange={(e) => setForm({ ...form, anecdotes: e.target.value })}
              rows={4}
              style={{ width: "100%", padding: "12px 14px", borderRadius: 6, border: "1px solid #ddd", fontSize: 15, outline: "none", resize: "vertical" }}
              placeholder="Racontez un moment, une habitude, une phrase qu'il/elle disait souvent..."
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => setStep(1)}
              style={{ padding: "12px 28px", fontSize: 15, borderRadius: 6, border: "1px solid #ddd", background: "#fff", color: "#16234c", cursor: "pointer" }}
            >
              Retour
            </button>
            <button onClick={() => setStep(3)} className="btn-accent" style={{ padding: "12px 28px", fontSize: 15 }}>
              Suivant
            </button>
          </div>
        </div>
      )}

      {/* Étape 3 : Ton & génération */}
      {step === 3 && !texte && (
        <div style={{ background: "#f9f9fb", borderRadius: 10, padding: "28px 24px", border: "1px solid #eee" }}>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#16234c", marginBottom: 16 }}>
            3. Choisissez le ton
          </h2>

          <div className="space-y-3 mb-6">
            {TONS.map((ton) => (
              <button
                key={ton.id}
                onClick={() => setForm({ ...form, tonalite: ton.id })}
                className="w-full text-left"
                style={{
                  padding: "14px 16px",
                  borderRadius: 8,
                  border: form.tonalite === ton.id ? "2px solid #F8A809" : "2px solid #eee",
                  background: form.tonalite === ton.id ? "rgba(248,168,9,0.05)" : "#fff",
                  cursor: "pointer",
                }}
              >
                <p style={{ fontSize: 15, fontWeight: 500, color: "#16234c" }}>{ton.label}</p>
                <p style={{ fontSize: 13, color: "#888" }}>{ton.desc}</p>
              </button>
            ))}
          </div>

          {status === "error" && (
            <div style={{ background: "#fef2f2", color: "#991b1b", borderRadius: 6, padding: "12px 16px", marginBottom: 16, fontSize: 14 }}>
              Erreur lors de la génération. Veuillez réessayer.
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setStep(2)}
              style={{ padding: "12px 28px", fontSize: 15, borderRadius: 6, border: "1px solid #ddd", background: "#fff", color: "#16234c", cursor: "pointer" }}
            >
              Retour
            </button>
            <button
              onClick={handleGenerate}
              disabled={status === "generating"}
              className="btn-accent"
              style={{ padding: "12px 28px", fontSize: 15, opacity: status === "generating" ? 0.7 : 1 }}
            >
              {status === "generating" ? "Génération en cours..." : "Générer le texte hommage"}
            </button>
          </div>
        </div>
      )}

      {/* Résultat */}
      {texte && (
        <div>
          <div style={{ background: "#fff", borderRadius: 10, padding: "32px 28px", border: "1px solid #eee", marginBottom: 20 }}>
            <p style={{ color: "#F8A809", fontSize: 13, fontWeight: 600, letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 12 }}>
              Texte hommage
            </p>
            <div style={{ fontSize: 15, lineHeight: 2, color: "#555", whiteSpace: "pre-wrap" }}>
              {texte}
            </div>
          </div>

          <div className="flex flex-wrap gap-3 justify-center">
            <button
              onClick={() => { setTexte(""); setStatus("idle"); }}
              style={{ padding: "12px 24px", fontSize: 14, borderRadius: 6, border: "1px solid #ddd", background: "#fff", color: "#16234c", cursor: "pointer" }}
            >
              Regénérer
            </button>
            <a
              href={`/api/memorial/${slug}/texte-hommage?format=pdf`}
              className="btn-accent"
              style={{ padding: "12px 24px", fontSize: 14, textDecoration: "none" }}
            >
              Télécharger en PDF
            </a>
            <a
              href={`/${slug}`}
              style={{ padding: "12px 24px", fontSize: 14, borderRadius: 6, border: "1px solid #ddd", color: "#16234c", textDecoration: "none" }}
            >
              Retour
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
