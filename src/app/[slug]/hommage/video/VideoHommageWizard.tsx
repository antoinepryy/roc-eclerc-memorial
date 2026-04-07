"use client";

import Image from "next/image";
import { useState } from "react";

type Photo = { id: string; url: string; caption: string | null };

const TEMPLATES = [
  {
    id: "classique",
    label: "Classique",
    description: "Sobre et élégant, transitions en fondu",
    color: "#16234c",
    features: ["Fondu enchaîné", "Texte en bas", "Gradient sombre"],
  },
  {
    id: "serenite",
    label: "Sérénité",
    description: "Doux et apaisant, effet lumineux",
    color: "#5b8fb9",
    features: ["Fondu blanc", "Texte centré", "Vignette douce"],
  },
  {
    id: "nature",
    label: "Nature",
    description: "Tons chauds, glissement latéral",
    color: "#2d5016",
    features: ["Transition latérale", "Bordure dorée", "Vignette"],
  },
  {
    id: "cinematique",
    label: "Cinématique",
    description: "Style film, barres noires, zoom lent",
    color: "#0a0a0a",
    features: ["Zoom Ken Burns", "Barres cinéma", "Fondu noir"],
  },
  {
    id: "lumiere",
    label: "Lumière",
    description: "Lumineux et chaleureux, tons dorés",
    color: "#8B6914",
    features: ["Fondu blanc", "Texte en haut", "Tons chauds"],
  },
  {
    id: "nuit-etoilee",
    label: "Nuit étoilée",
    description: "Intime et recueilli, fond sombre",
    color: "#0a0a2e",
    features: ["Glissement latéral", "Bordure dorée", "Vignette"],
  },
  {
    id: "poesie",
    label: "Poésie",
    description: "Délicat et raffiné, rythme contemplatif",
    color: "#6b4c7a",
    features: ["Dissolution douce", "Texte centré", "Rythme lent"],
  },
  {
    id: "ocean",
    label: "Océan",
    description: "Calme et profond, comme les vagues",
    color: "#1a4a5e",
    features: ["Glissement vague", "Zoom lent", "Gradient sombre"],
  },
  {
    id: "jardin",
    label: "Jardin secret",
    description: "Paisible et lumineux, douceur florale",
    color: "#4a6741",
    features: ["Ouverture circulaire", "Texte en haut", "Tons floraux"],
  },
  {
    id: "automne",
    label: "Automne",
    description: "Chaleur des souvenirs, tons ambrés",
    color: "#8B4513",
    features: ["Transition balayage", "Bordure dorée", "Vignette chaude"],
  },
];

const MUSIQUES = [
  { id: "piano-doux", label: "Piano doux", duree: "3:20" },
  { id: "cordes-apaisantes", label: "Cordes apaisantes", duree: "4:10" },
  { id: "guitare-acoustique", label: "Guitare acoustique", duree: "3:45" },
  { id: "orchestre-solennel", label: "Orchestre solennel", duree: "4:30" },
  { id: "harpe-celeste", label: "Harpe céleste", duree: "3:55" },
  { id: "ambient-nature", label: "Ambient nature", duree: "5:00" },
];

export default function VideoHommageWizard({
  slug,
  photos,
}: {
  slug: string;
  photos: Photo[];
}) {
  const [step, setStep] = useState(1);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [template, setTemplate] = useState("classique");
  const [musique, setMusique] = useState("piano-doux");
  const [texte, setTexte] = useState("");
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const togglePhoto = (id: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleGenerate = async () => {
    setStatus("generating");
    try {
      const res = await fetch(`/api/memorial/${slug}/video-hommage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          photoIds: selectedPhotos,
          template,
          musique,
          texteOverlay: texte,
        }),
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setVideoUrl(data.videoUrl);
      setStatus("done");
    } catch {
      setStatus("error");
    }
  };

  const selectedTemplate = TEMPLATES.find((t) => t.id === template);

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

      {/* Étape 1 : Photos */}
      {step === 1 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#16234c", marginBottom: 16 }}>
            1. Sélectionnez les photos
          </h2>

          {photos.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#888" }}>
              <p style={{ marginBottom: 12 }}>Aucune photo dans la galerie.</p>
              <a href={`/${slug}/galerie`} style={{ color: "#F8A809", fontWeight: 500 }}>
                Ajouter des photos d&apos;abord
              </a>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-6">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => togglePhoto(photo.id)}
                    style={{
                      position: "relative",
                      aspectRatio: "1",
                      borderRadius: 8,
                      overflow: "hidden",
                      border: selectedPhotos.includes(photo.id)
                        ? "3px solid #F8A809"
                        : "3px solid transparent",
                      cursor: "pointer",
                    }}
                  >
                    <Image src={photo.url} alt="" fill className="object-cover" sizes="200px" />
                    {selectedPhotos.includes(photo.id) && (
                      <div style={{
                        position: "absolute", top: 6, right: 6,
                        width: 24, height: 24, borderRadius: "50%",
                        background: "#F8A809", color: "#fff",
                        display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14,
                      }}>
                        ✓
                      </div>
                    )}
                  </button>
                ))}
              </div>
              <p style={{ color: "#888", fontSize: 13, marginBottom: 16 }}>
                {selectedPhotos.length} photo{selectedPhotos.length !== 1 ? "s" : ""} sélectionnée{selectedPhotos.length !== 1 ? "s" : ""}
              </p>
              <button
                onClick={() => setStep(2)}
                disabled={selectedPhotos.length === 0}
                className="btn-accent"
                style={{ padding: "12px 28px", fontSize: 15, opacity: selectedPhotos.length === 0 ? 0.5 : 1 }}
              >
                Suivant
              </button>
            </>
          )}
        </div>
      )}

      {/* Étape 2 : Template & Musique */}
      {step === 2 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#16234c", marginBottom: 16 }}>
            2. Choisissez le style et la musique
          </h2>

          <h3 style={{ fontSize: 15, fontWeight: 500, color: "#16234c", marginBottom: 10 }}>Style de la vidéo</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
            {TEMPLATES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTemplate(t.id)}
                style={{
                  padding: "16px 14px",
                  borderRadius: 10,
                  border: template === t.id ? "2px solid #F8A809" : "2px solid #eee",
                  background: template === t.id ? "rgba(248,168,9,0.05)" : "#f9f9fb",
                  cursor: "pointer",
                  textAlign: "left",
                }}
              >
                {/* Prévisualisation couleur */}
                <div style={{
                  width: "100%", height: 48, borderRadius: 6,
                  background: `linear-gradient(135deg, ${t.color}, ${t.color}dd)`,
                  marginBottom: 10, position: "relative", overflow: "hidden",
                }}>
                  {/* Petites barres simulant des photos */}
                  <div style={{ position: "absolute", bottom: 4, left: 4, right: 4, display: "flex", gap: 2 }}>
                    {[1, 2, 3].map((i) => (
                      <div key={i} style={{ flex: 1, height: 6, background: "rgba(255,255,255,0.3)", borderRadius: 2 }} />
                    ))}
                  </div>
                  {template === t.id && (
                    <div style={{
                      position: "absolute", top: 4, right: 4,
                      width: 20, height: 20, borderRadius: "50%",
                      background: "#F8A809", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12,
                    }}>
                      ✓
                    </div>
                  )}
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#16234c", marginBottom: 2 }}>{t.label}</p>
                <p style={{ fontSize: 11, color: "#888", lineHeight: 1.4 }}>{t.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {t.features.map((f) => (
                    <span key={f} style={{
                      fontSize: 9, background: template === t.id ? "rgba(248,168,9,0.15)" : "#eee",
                      color: template === t.id ? "#16234c" : "#999",
                      padding: "2px 6px", borderRadius: 4,
                    }}>
                      {f}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>

          <h3 style={{ fontSize: 15, fontWeight: 500, color: "#16234c", marginBottom: 10 }}>Musique de fond</h3>
          <div className="space-y-2 mb-6">
            {MUSIQUES.map((m) => (
              <button
                key={m.id}
                onClick={() => setMusique(m.id)}
                className="w-full flex items-center justify-between"
                style={{
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: musique === m.id ? "2px solid #F8A809" : "2px solid #eee",
                  background: musique === m.id ? "rgba(248,168,9,0.05)" : "#f9f9fb",
                  cursor: "pointer",
                }}
              >
                <div className="flex items-center gap-3">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={musique === m.id ? "#F8A809" : "#ccc"} stroke="none">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                  <span style={{ fontSize: 14, color: "#16234c" }}>{m.label}</span>
                </div>
                <span style={{ fontSize: 12, color: "#aaa" }}>{m.duree}</span>
              </button>
            ))}
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

      {/* Étape 3 : Texte & Génération */}
      {step === 3 && (
        <div>
          <h2 style={{ fontSize: 18, fontWeight: 600, color: "#16234c", marginBottom: 16 }}>
            3. Ajoutez un texte (optionnel)
          </h2>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>
              Texte affiché sur la vidéo
            </label>
            <textarea
              value={texte}
              onChange={(e) => setTexte(e.target.value)}
              rows={4}
              style={{
                width: "100%", padding: "12px 14px", borderRadius: 6,
                border: "1px solid #ddd", fontSize: 15, outline: "none", resize: "vertical",
              }}
              placeholder="Ex: En souvenir de Jean, un homme au grand cœur..."
              maxLength={300}
            />
            <p style={{ fontSize: 12, color: "#aaa", marginTop: 4 }}>{texte.length}/300 caractères</p>
          </div>

          {/* Résumé */}
          <div style={{ background: "#f9f9fb", borderRadius: 8, padding: "16px 20px", marginBottom: 20, border: "1px solid #eee" }}>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: "#16234c", marginBottom: 8 }}>Résumé</h3>
            <div className="flex flex-wrap gap-x-4 gap-y-1" style={{ fontSize: 13, color: "#666" }}>
              <span>{selectedPhotos.length} photos</span>
              <span>Style : <strong>{selectedTemplate?.label}</strong></span>
              <span>Musique : <strong>{MUSIQUES.find((m) => m.id === musique)?.label}</strong></span>
            </div>
            {selectedTemplate && (
              <div className="flex flex-wrap gap-1 mt-2">
                {selectedTemplate.features.map((f) => (
                  <span key={f} style={{ fontSize: 10, background: "rgba(248,168,9,0.15)", color: "#16234c", padding: "2px 8px", borderRadius: 4 }}>
                    {f}
                  </span>
                ))}
              </div>
            )}
          </div>

          {status === "error" && (
            <div style={{ background: "#fef2f2", color: "#991b1b", borderRadius: 6, padding: "12px 16px", marginBottom: 16, fontSize: 14 }}>
              Erreur lors de la génération. Veuillez réessayer.
            </div>
          )}

          {status === "done" && videoUrl ? (
            <div style={{ textAlign: "center" }}>
              <div style={{ background: "#f0fdf4", color: "#166534", borderRadius: 6, padding: "16px 20px", marginBottom: 16 }}>
                Vidéo hommage créée avec succès !
              </div>
              <video src={videoUrl} controls className="w-full" style={{ borderRadius: 10, maxHeight: 400, marginBottom: 16 }} />
              <div className="flex gap-3 justify-center">
                <a href={videoUrl} download className="btn-accent" style={{ padding: "12px 24px", fontSize: 14 }}>
                  Télécharger
                </a>
                <a
                  href={`/${slug}`}
                  style={{ padding: "12px 24px", fontSize: 14, borderRadius: 6, border: "1px solid #ddd", color: "#16234c", textDecoration: "none" }}
                >
                  Retour à l&apos;espace mémoriel
                </a>
              </div>
            </div>
          ) : (
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
                {status === "generating" ? "Génération en cours..." : "Générer la vidéo"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
