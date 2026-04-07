"use client";

import Image from "next/image";
import { useState, useCallback } from "react";

type Photo = {
  id: string;
  url: string;
  caption: string | null;
};

export default function GalerieUpload({ slug }: { slug: string }) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const uploadFiles = useCallback(async (files: FileList) => {
    setUploading(true);
    const formData = new FormData();
    Array.from(files).forEach((file) => {
      if (file.size > 5 * 1024 * 1024) return; // 5 Mo max
      if (!file.type.startsWith("image/")) return;
      formData.append("photos", file);
    });

    try {
      const res = await fetch(`/api/memorial/${slug}/photos`, {
        method: "POST",
        body: formData,
      });
      if (res.ok) {
        const data = await res.json();
        setPhotos((prev) => [...prev, ...data.photos]);
      }
    } finally {
      setUploading(false);
    }
  }, [slug]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      uploadFiles(e.dataTransfer.files);
    }
  }, [uploadFiles]);

  return (
    <div>
      {/* Zone de drop */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        style={{
          border: `2px dashed ${dragOver ? "#F8A809" : "#ddd"}`,
          borderRadius: 10,
          padding: "40px 20px",
          textAlign: "center",
          background: dragOver ? "rgba(248,168,9,0.05)" : "#f9f9fb",
          transition: "all 0.2s ease",
          marginBottom: 24,
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke={dragOver ? "#F8A809" : "#ccc"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-3">
          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
          <polyline points="17 8 12 3 7 8" />
          <line x1="12" y1="3" x2="12" y2="15" />
        </svg>
        <p style={{ color: "#888", fontSize: 15, marginBottom: 12 }}>
          {uploading ? "Envoi en cours..." : "Glissez-déposez vos photos ici"}
        </p>
        <label
          style={{
            display: "inline-block",
            padding: "10px 20px",
            borderRadius: 6,
            background: "#16234c",
            color: "#fff",
            fontSize: 14,
            cursor: "pointer",
          }}
        >
          Sélectionner des fichiers
          <input
            type="file"
            multiple
            accept="image/*"
            style={{ display: "none" }}
            onChange={(e) => e.target.files && uploadFiles(e.target.files)}
          />
        </label>
        <p style={{ color: "#aaa", fontSize: 12, marginTop: 8 }}>
          JPG, PNG, WebP — 5 Mo max par photo — 20 photos max
        </p>
      </div>

      {/* Grille photos */}
      {photos.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              style={{
                position: "relative",
                aspectRatio: "1",
                borderRadius: 8,
                overflow: "hidden",
                background: "#f0f0f0",
              }}
            >
              <Image
                src={photo.url}
                alt={photo.caption || "Photo souvenir"}
                fill
                className="object-cover"
                sizes="200px"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
