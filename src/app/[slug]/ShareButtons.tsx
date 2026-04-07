"use client";

import { useState } from "react";

export default function ShareButtons({ url, name }: { url: string; name: string }) {
  const [copied, setCopied] = useState(false);
  const text = `Hommage à ${name}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
      <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>Partager :</span>

      <button
        onClick={copyLink}
        style={{
          background: "rgba(255,255,255,0.1)",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          padding: "8px 14px",
          fontSize: 13,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
        </svg>
        {copied ? "Copié !" : "Copier le lien"}
      </button>

      <a
        href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: "rgba(255,255,255,0.1)",
          color: "#fff",
          borderRadius: 6,
          padding: "8px 14px",
          fontSize: 13,
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        WhatsApp
      </a>

      <a
        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          background: "rgba(255,255,255,0.1)",
          color: "#fff",
          borderRadius: 6,
          padding: "8px 14px",
          fontSize: 13,
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        Facebook
      </a>

      <a
        href={`mailto:?subject=${encodeURIComponent(text)}&body=${encodeURIComponent(`${text}\n\n${url}`)}`}
        style={{
          background: "rgba(255,255,255,0.1)",
          color: "#fff",
          borderRadius: 6,
          padding: "8px 14px",
          fontSize: 13,
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        Email
      </a>
    </div>
  );
}
