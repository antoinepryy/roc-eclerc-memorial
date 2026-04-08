"use client";

import { useState } from "react";

export default function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleCopy}
      style={{
        padding: "12px 20px", fontSize: 14, borderRadius: 6,
        border: "1px solid #ddd", color: "#16234c", cursor: "pointer",
        background: "#fff", fontWeight: 500,
      }}
    >
      {copied ? "Lien copié !" : "Copier le lien"}
    </button>
  );
}
