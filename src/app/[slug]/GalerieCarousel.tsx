"use client";

import Image from "next/image";
import { useState } from "react";

type MediaItem = {
  id: string;
  url: string;
  caption: string | null;
};

export default function GalerieCarousel({ medias }: { medias: MediaItem[] }) {
  const [current, setCurrent] = useState(0);

  if (medias.length === 0) return null;

  return (
    <div>
      {/* Image principale */}
      <div
        style={{
          position: "relative",
          borderRadius: 10,
          overflow: "hidden",
          background: "#f0f0f0",
          aspectRatio: "16/10",
        }}
      >
        <Image
          src={medias[current].url}
          alt={medias[current].caption || "Photo souvenir"}
          fill
          className="object-contain"
          sizes="(max-width: 768px) 100vw, 800px"
        />
        {/* Flèches navigation */}
        {medias.length > 1 && (
          <>
            <button
              onClick={() => setCurrent((current - 1 + medias.length) % medias.length)}
              style={{
                position: "absolute",
                left: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(22,35,76,0.7)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 40,
                height: 40,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Photo précédente"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6" />
              </svg>
            </button>
            <button
              onClick={() => setCurrent((current + 1) % medias.length)}
              style={{
                position: "absolute",
                right: 12,
                top: "50%",
                transform: "translateY(-50%)",
                background: "rgba(22,35,76,0.7)",
                color: "#fff",
                border: "none",
                borderRadius: "50%",
                width: 40,
                height: 40,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
              aria-label="Photo suivante"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 18l6-6-6-6" />
              </svg>
            </button>
          </>
        )}
      </div>

      {/* Légende */}
      {medias[current].caption && (
        <p style={{ textAlign: "center", color: "#888", fontSize: 13, marginTop: 8 }}>
          {medias[current].caption}
        </p>
      )}

      {/* Compteur */}
      {medias.length > 1 && (
        <p style={{ textAlign: "center", color: "#aaa", fontSize: 12, marginTop: 4 }}>
          {current + 1} / {medias.length}
        </p>
      )}

      {/* Thumbnails */}
      {medias.length > 1 && (
        <div className="flex gap-2 mt-4 overflow-x-auto pb-2 justify-center">
          {medias.map((m, i) => (
            <button
              key={m.id}
              onClick={() => setCurrent(i)}
              style={{
                width: 64,
                height: 64,
                borderRadius: 6,
                overflow: "hidden",
                border: i === current ? "2px solid #F8A809" : "2px solid transparent",
                opacity: i === current ? 1 : 0.6,
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              <Image src={m.url} alt="" width={64} height={64} className="object-cover w-full h-full" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
