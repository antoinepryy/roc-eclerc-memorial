"use client";

import { useState } from "react";

export default function CondoleanceForm({ slug }: { slug: string }) {
  const [form, setForm] = useState({ auteurNom: "", auteurEmail: "", message: "" });
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [honeypot, setHoneypot] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (honeypot) return; // anti-spam

    setStatus("sending");
    try {
      const res = await fetch(`/api/memorial/${slug}/condoleances`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error();
      setStatus("success");
      setForm({ auteurNom: "", auteurEmail: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div style={{ textAlign: "center", padding: "20px 0" }}>
        <div style={{ background: "#f0fdf4", color: "#166534", borderRadius: 6, padding: "16px 20px", marginBottom: 16 }}>
          Merci pour votre message. Il sera visible après validation par la famille.
        </div>
        <a
          href={`/${slug}`}
          style={{ color: "#F8A809", fontWeight: 500, fontSize: 15 }}
        >
          Retour à l&apos;espace mémoriel
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {/* Honeypot */}
      <input
        type="text"
        name="website"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ display: "none" }}
        tabIndex={-1}
        autoComplete="off"
      />

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>
          Votre nom *
        </label>
        <input
          type="text"
          required
          value={form.auteurNom}
          onChange={(e) => setForm({ ...form, auteurNom: e.target.value })}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 6,
            border: "1px solid #ddd",
            fontSize: 15,
            outline: "none",
          }}
          placeholder="Prénom et nom"
        />
      </div>

      <div style={{ marginBottom: 16 }}>
        <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>
          Email <span style={{ color: "#aaa", fontWeight: 400 }}>(optionnel, pour être notifié des réponses)</span>
        </label>
        <input
          type="email"
          value={form.auteurEmail}
          onChange={(e) => setForm({ ...form, auteurEmail: e.target.value })}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 6,
            border: "1px solid #ddd",
            fontSize: 15,
            outline: "none",
          }}
          placeholder="votre@email.fr"
        />
      </div>

      <div style={{ marginBottom: 20 }}>
        <label style={{ display: "block", fontSize: 14, fontWeight: 500, color: "#16234c", marginBottom: 6 }}>
          Votre message *
        </label>
        <textarea
          required
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={6}
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 6,
            border: "1px solid #ddd",
            fontSize: 15,
            outline: "none",
            resize: "vertical",
          }}
          placeholder="Votre message de condoléances..."
        />
      </div>

      {status === "error" && (
        <div style={{ background: "#fef2f2", color: "#991b1b", borderRadius: 6, padding: "12px 16px", marginBottom: 16, fontSize: 14 }}>
          Une erreur est survenue. Veuillez réessayer.
        </div>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="btn-accent"
        style={{
          width: "100%",
          padding: "14px",
          fontSize: 16,
          opacity: status === "sending" ? 0.7 : 1,
        }}
      >
        {status === "sending" ? "Envoi en cours..." : "Envoyer mes condoléances"}
      </button>
    </form>
  );
}
