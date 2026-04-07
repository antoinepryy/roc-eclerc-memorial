"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function MemorialSearch({ defaultValue }: { defaultValue?: string }) {
  const [query, setQuery] = useState(defaultValue || "");
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = query.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
    router.push(`/${params}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 max-w-[480px] mx-auto">
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Rechercher par nom ou prénom..."
        style={{
          flex: 1,
          padding: "12px 16px",
          borderRadius: 6,
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(255,255,255,0.1)",
          color: "#fff",
          fontSize: 15,
          outline: "none",
        }}
      />
      <button
        type="submit"
        className="btn-accent"
        style={{ padding: "12px 20px", fontSize: 14 }}
      >
        Rechercher
      </button>
    </form>
  );
}
