"use client";

import Image from "next/image";
import { useState, useRef, useCallback, useEffect } from "react";

type Photo = { id: string; url: string; caption: string | null };

const S3_BASE = process.env.NEXT_PUBLIC_S3_MUSIC_URL || "";

const TEMPLATES = [
  {
    id: "classique",
    label: "Classique",
    description: "Sobre et digne, transitions en fondu",
    color: "#16234c",
    transition: "Fondu enchaîné",
    features: ["Fondu enchaîné", "Sobre", "Élégant"],
  },
  {
    id: "serenite",
    label: "Sérénité",
    description: "Doux et apaisant, tons clairs",
    color: "#5b8fb9",
    transition: "Fondu lumineux",
    features: ["Fondu lumineux", "Délicat", "Apaisant"],
  },
  {
    id: "nature",
    label: "Mémoire",
    description: "Tons chauds, rythme apaisé",
    color: "#2d5016",
    transition: "Transition douce",
    features: ["Transition douce", "Cadre doré", "Chaleureux"],
  },
  {
    id: "cinematique",
    label: "Solennel",
    description: "Recueilli et majestueux, rythme lent",
    color: "#0a0a0a",
    transition: "Fondu sombre",
    features: ["Rythme lent", "Majestueux", "Recueilli"],
  },
  {
    id: "lumiere",
    label: "Lumière",
    description: "Lumineux et chaleureux, tons dorés",
    color: "#8B6914",
    transition: "Fondu lumineux",
    features: ["Lumineux", "Chaleureux", "Tons dorés"],
  },
  {
    id: "nuit-etoilee",
    label: "Recueillement",
    description: "Intime et respectueux, tons sombres",
    color: "#0a0a2e",
    transition: "Transition douce",
    features: ["Intime", "Cadre doré", "Respectueux"],
  },
  {
    id: "poesie",
    label: "Contemplation",
    description: "Délicat et raffiné, rythme contemplatif",
    color: "#6b4c7a",
    transition: "Fondu doux",
    features: ["Fondu doux", "Délicat", "Contemplatif"],
  },
  {
    id: "ocean",
    label: "Douceur",
    description: "Paisible et serein, transitions fluides",
    color: "#1a4a5e",
    transition: "Transition fluide",
    features: ["Fluide", "Serein", "Paisible"],
  },
  {
    id: "jardin",
    label: "Espérance",
    description: "Lumineux et apaisant, tons clairs",
    color: "#4a6741",
    transition: "Transition douce",
    features: ["Lumineux", "Apaisant", "Tons clairs"],
  },
  {
    id: "automne",
    label: "Souvenir",
    description: "Chaleur des souvenirs, tons ambrés",
    color: "#8B4513",
    transition: "Transition douce",
    features: ["Chaleureux", "Cadre doré", "Tons ambrés"],
  },
];

const MUSIQUES = [
  { id: "piano-doux", label: "Piano — Émotion", description: "Piano doux et émouvant, idéal pour un hommage intime" },
  { id: "cordes-apaisantes", label: "Piano & Cordes", description: "Piano accompagné de cordes, délicat et apaisant" },
  { id: "orchestre-solennel", label: "Orchestre — Solennel", description: "Orchestre solennel et majestueux, pour une cérémonie" },
  { id: "guitare-acoustique", label: "Guitare — Recueillement", description: "Guitare acoustique douce, atmosphère de recueillement" },
  { id: "harpe-celeste", label: "Harpe — Sérénité", description: "Harpe légère et sereine, empreinte de douceur" },
  { id: "ambient-nature", label: "Piano — Méditation", description: "Piano contemplatif et atmosphérique, propice au souvenir" },
];

function getMusicUrl(id: string) {
  if (S3_BASE) return `${S3_BASE}/audio/${id}.mp3`;
  return `/audio/${id}.mp3`;
}

// --- Audio Preview Hook ---
function useAudioPreview() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const toggle = useCallback((id: string, customUrl?: string) => {
    if (playingId === id) {
      audioRef.current?.pause();
      setPlayingId(null);
      return;
    }
    if (audioRef.current) {
      audioRef.current.pause();
    }
    const audio = new Audio(customUrl || getMusicUrl(id));
    audio.volume = 0.4;
    audio.onended = () => setPlayingId(null);
    audio.play().catch(() => {});
    audioRef.current = audio;
    setPlayingId(id);
  }, [playingId]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { audioRef.current?.pause(); };
  }, []);

  return { playingId, toggle };
}

// --- Template Preview Component ---
function TemplatePreview({ color, photos }: { color: string; photos: Photo[] }) {
  const [idx, setIdx] = useState(0);
  const previewPhotos = photos.slice(0, 3);

  useEffect(() => {
    if (previewPhotos.length <= 1) return;
    const interval = setInterval(() => {
      setIdx((i) => (i + 1) % previewPhotos.length);
    }, 2000);
    return () => clearInterval(interval);
  }, [previewPhotos.length]);

  if (previewPhotos.length === 0) {
    return (
      <div style={{
        width: "100%", height: 56, borderRadius: 6,
        background: `linear-gradient(135deg, ${color}, ${color}dd)`,
      }} />
    );
  }

  return (
    <div style={{
      width: "100%", height: 56, borderRadius: 6, overflow: "hidden",
      position: "relative", background: color,
    }}>
      {previewPhotos.map((p, i) => (
        <div key={p.id} style={{
          position: "absolute", inset: 0,
          opacity: i === idx ? 1 : 0,
          transition: "opacity 1.5s ease-in-out",
        }}>
          <Image src={p.url} alt="" fill className="object-cover" sizes="200px" style={{ opacity: 0.7 }} />
        </div>
      ))}
      <div style={{
        position: "absolute", inset: 0,
        background: `linear-gradient(to top, ${color}cc, transparent)`,
      }} />
    </div>
  );
}

type MusiqueCustom = { id: string; label: string; url: string };

export default function VideoHommageWizard({
  slug,
  photos,
  musiquesCustom: initialCustom = [],
}: {
  slug: string;
  photos: Photo[];
  musiquesCustom?: MusiqueCustom[];
}) {
  const [step, setStep] = useState(1);
  const [selectedPhotos, setSelectedPhotos] = useState<string[]>([]);
  const [template, setTemplate] = useState("classique");
  const [musique, setMusique] = useState("piano-doux");
  const [musiqueCustomUrl, setMusiqueCustomUrl] = useState<string | null>(null);
  const [customMusiques, setCustomMusiques] = useState<MusiqueCustom[]>(initialCustom);
  const [uploadingMusique, setUploadingMusique] = useState(false);
  const [texte, setTexte] = useState("");
  const [status, setStatus] = useState<"idle" | "previewing" | "generating" | "done" | "error">("idle");
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { playingId, toggle: toggleAudio } = useAudioPreview();

  const togglePhoto = (id: string) => {
    setSelectedPhotos((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const selectPreset = (id: string) => {
    setMusique(id);
    setMusiqueCustomUrl(null);
  };

  const selectCustom = (m: MusiqueCustom) => {
    setMusique("");
    setMusiqueCustomUrl(m.url);
  };

  const handleMusiqueUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingMusique(true);
    try {
      const label = file.name.replace(/\.[^.]+$/, "").slice(0, 100);
      const fd = new FormData();
      fd.append("musique", file);
      fd.append("label", label);
      fd.append("source", "visiteur");
      const res = await fetch(`/api/memorial/${slug}/musique`, { method: "POST", body: fd });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setCustomMusiques((prev) => [data, ...prev]);
      selectCustom(data);
    } catch {
      // silently fail
    } finally {
      setUploadingMusique(false);
      e.target.value = "";
    }
  };

  const requestBody = () => JSON.stringify({
    photoIds: selectedPhotos,
    template,
    musique: musique || undefined,
    musiqueCustomUrl: musiqueCustomUrl || undefined,
    texteOverlay: texte,
  });

  const handlePreview = async () => {
    setStatus("previewing");
    setPreviewUrl(null);
    try {
      const res = await fetch(`/api/memorial/${slug}/video-hommage/preview`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody(),
      });
      if (!res.ok) throw new Error();
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
      setStatus("idle");
    } catch {
      setStatus("error");
    }
  };

  const handleGenerate = async () => {
    setStatus("generating");
    try {
      const res = await fetch(`/api/memorial/${slug}/video-hommage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: requestBody(),
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
  const selectedPhotosData = photos.filter((p) => selectedPhotos.includes(p.id));

  return (
    <div>
      {/* Stepper */}
      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3].map((s) => (
          <div key={s} className="flex items-center gap-2">
            <div
              style={{
                width: 32, height: 32, borderRadius: "50%",
                background: step >= s ? "#F8A809" : "#eee",
                color: step >= s ? "#fff" : "#999",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 14, fontWeight: 600,
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
                      position: "relative", aspectRatio: "1", borderRadius: 8, overflow: "hidden",
                      border: selectedPhotos.includes(photo.id)
                        ? "3px solid #F8A809" : "3px solid transparent",
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
                  padding: "12px 12px 14px",
                  borderRadius: 10,
                  border: template === t.id ? "2px solid #F8A809" : "2px solid #eee",
                  background: template === t.id ? "rgba(248,168,9,0.05)" : "#f9f9fb",
                  cursor: "pointer", textAlign: "left",
                }}
              >
                <TemplatePreview color={t.color} photos={selectedPhotosData} />
                <p style={{ fontSize: 13, fontWeight: 600, color: "#16234c", marginTop: 8, marginBottom: 2 }}>{t.label}</p>
                <p style={{ fontSize: 11, color: "#888", lineHeight: 1.3 }}>{t.description}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {t.features.map((f) => (
                    <span key={f} style={{
                      fontSize: 9,
                      background: template === t.id ? "rgba(248,168,9,0.15)" : "#eee",
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
              <div
                key={m.id}
                style={{
                  display: "flex", alignItems: "center", gap: 0,
                  borderRadius: 8,
                  border: musique === m.id ? "2px solid #F8A809" : "2px solid #eee",
                  background: musique === m.id ? "rgba(248,168,9,0.05)" : "#f9f9fb",
                  overflow: "hidden",
                }}
              >
                {/* Play/Pause button */}
                <button
                  onClick={(e) => { e.stopPropagation(); toggleAudio(m.id); }}
                  style={{
                    width: 48, minHeight: 56,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: playingId === m.id ? "#F8A809" : "transparent",
                    border: "none", cursor: "pointer",
                    transition: "background 0.2s",
                    flexShrink: 0,
                  }}
                  title={playingId === m.id ? "Pause" : "Écouter un extrait"}
                >
                  {playingId === m.id ? (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill={musique === m.id ? "#F8A809" : "#aaa"}>
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>

                {/* Select track */}
                <button
                  onClick={() => selectPreset(m.id)}
                  className="flex-1 flex items-center justify-between"
                  style={{
                    padding: "12px 16px 12px 8px",
                    cursor: "pointer", background: "none", border: "none",
                    textAlign: "left",
                  }}
                >
                  <div>
                    <span style={{ fontSize: 14, color: "#16234c", fontWeight: musique === m.id ? 600 : 400 }}>{m.label}</span>
                    <span style={{ display: "block", fontSize: 11, color: "#aaa", marginTop: 1 }}>{m.description}</span>
                  </div>
                  {musique === m.id && (
                    <div style={{
                      width: 22, height: 22, borderRadius: "50%",
                      background: "#F8A809", color: "#fff",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 12, flexShrink: 0,
                    }}>✓</div>
                  )}
                </button>
              </div>
            ))}

            {/* Musiques personnalisées */}
            {customMusiques.length > 0 && (
              <>
                <p style={{ fontSize: 12, color: "#aaa", fontWeight: 500, textTransform: "uppercase", letterSpacing: 1, marginTop: 12, marginBottom: 6 }}>
                  Musiques personnalisées
                </p>
                {customMusiques.map((m) => {
                  const isSelected = musiqueCustomUrl === m.url;
                  return (
                    <div key={m.id} style={{
                      display: "flex", alignItems: "center", gap: 0, borderRadius: 8,
                      border: isSelected ? "2px solid #F8A809" : "2px solid #eee",
                      background: isSelected ? "rgba(248,168,9,0.05)" : "#f9f9fb",
                      overflow: "hidden",
                    }}>
                      <button onClick={(e) => { e.stopPropagation(); toggleAudio(m.id, m.url); }}
                        style={{ width: 48, minHeight: 56, display: "flex", alignItems: "center", justifyContent: "center", background: playingId === m.id ? "#F8A809" : "transparent", border: "none", cursor: "pointer", flexShrink: 0 }}>
                        {playingId === m.id ? (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><rect x="6" y="4" width="4" height="16" /><rect x="14" y="4" width="4" height="16" /></svg>
                        ) : (
                          <svg width="18" height="18" viewBox="0 0 24 24" fill={isSelected ? "#F8A809" : "#aaa"}><path d="M8 5v14l11-7z" /></svg>
                        )}
                      </button>
                      <button onClick={() => selectCustom(m)} className="flex-1 flex items-center justify-between"
                        style={{ padding: "12px 16px 12px 8px", cursor: "pointer", background: "none", border: "none", textAlign: "left" }}>
                        <span style={{ fontSize: 14, color: "#16234c", fontWeight: isSelected ? 600 : 400 }}>{m.label}</span>
                        {isSelected && <div style={{ width: 22, height: 22, borderRadius: "50%", background: "#F8A809", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0 }}>✓</div>}
                      </button>
                    </div>
                  );
                })}
              </>
            )}

            {/* Upload musique */}
            <div style={{ marginTop: 8 }}>
              <label style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "10px 16px", borderRadius: 8, border: "2px dashed #ddd",
                fontSize: 13, color: "#888", cursor: "pointer",
                opacity: uploadingMusique ? 0.6 : 1,
              }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#aaa" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" /></svg>
                {uploadingMusique ? "Upload en cours..." : "Importer votre musique"}
                <input type="file" accept="audio/*" style={{ display: "none" }} onChange={handleMusiqueUpload} disabled={uploadingMusique} />
              </label>
              <p style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>MP3 ou WAV, 10 Mo max</p>
              <p style={{ fontSize: 10, color: "#bbb", marginTop: 4, lineHeight: 1.4 }}>
                En important un fichier audio, vous certifiez disposer des droits
                nécessaires pour son utilisation dans le cadre de cet hommage.
                Roc Eclerc ne saurait être tenu responsable en cas de non-respect
                des droits d&apos;auteur.
              </p>
            </div>
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

          {/* Aperçu rapide */}
          {previewUrl && status !== "done" && (
            <div style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
                Aperçu rapide (basse qualité, {Math.min(3, selectedPhotos.length)} photos max) :
              </p>
              <video src={previewUrl} controls className="w-full" style={{ borderRadius: 10, maxHeight: 300, marginBottom: 8, border: "1px solid #eee" }} />
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
            <div className="flex gap-3 flex-wrap">
              <button
                onClick={() => setStep(2)}
                style={{ padding: "12px 28px", fontSize: 15, borderRadius: 6, border: "1px solid #ddd", background: "#fff", color: "#16234c", cursor: "pointer" }}
              >
                Retour
              </button>
              <button
                onClick={handlePreview}
                disabled={status === "previewing" || status === "generating"}
                style={{
                  padding: "12px 28px", fontSize: 15, borderRadius: 6,
                  border: "1px solid #F8A809", background: "#fff", color: "#F8A809",
                  cursor: "pointer", fontWeight: 500,
                  opacity: status === "previewing" ? 0.7 : 1,
                }}
              >
                {status === "previewing" ? "Aperçu en cours..." : "Aperçu rapide"}
              </button>
              <button
                onClick={handleGenerate}
                disabled={status === "generating" || status === "previewing"}
                className="btn-accent"
                style={{ padding: "12px 28px", fontSize: 15, opacity: (status === "generating" || status === "previewing") ? 0.7 : 1 }}
              >
                {status === "generating" ? "Génération en cours..." : "Générer la vidéo HD"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
