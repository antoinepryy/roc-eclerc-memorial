import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import Link from "next/link";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin-login");

  return (
    <div style={{ minHeight: "100vh", background: "#f5f5f5" }}>
      {/* Admin Nav */}
      <nav style={{ background: "#16234c", padding: "12px 0", borderBottom: "3px solid #F8A809" }}>
        <div className="max-w-[1200px] mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/admin" style={{ color: "#F8A809", fontWeight: 700, fontSize: 16, textDecoration: "none" }}>
              Admin Mémoriel
            </Link>
            <Link href="/admin/memorial" style={{ color: "rgba(255,255,255,0.8)", fontSize: 14, textDecoration: "none" }}>
              Fiches
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <span style={{ color: "rgba(255,255,255,0.6)", fontSize: 13 }}>{session.nom}</span>
            <form action="/api/admin/auth" method="DELETE">
              <button
                type="submit"
                style={{
                  background: "rgba(255,255,255,0.1)",
                  color: "#fff",
                  border: "none",
                  borderRadius: 4,
                  padding: "6px 12px",
                  fontSize: 13,
                  cursor: "pointer",
                }}
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </nav>

      <div className="max-w-[1200px] mx-auto px-4 py-8">
        {children}
      </div>
    </div>
  );
}
