import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import Link from "next/link";
import Image from "next/image";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Espace Memoriel | Roc Eclerc Nancy",
  description:
    "Espace memoriel Roc Eclerc Nancy - Rendez hommage a vos proches disparus. Consultez les avis de deces et deposez des messages de condoleances.",
};

function Header() {
  return (
    <header className="sticky top-0 z-50 bg-[#1b284c] shadow-lg">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <Image
            src="/images/logo.png"
            alt="Roc Eclerc Nancy"
            width={160}
            height={48}
            className="h-auto w-[130px] sm:w-[160px]"
            priority
          />
        </Link>

        {/* Desktop nav */}
        <div className="hidden items-center gap-8 md:flex">
          <Link
            href="/"
            className="text-sm font-medium text-white/90 transition-colors hover:text-[#F8A809]"
          >
            Espace Memoriel
          </Link>
          <Link
            href="/?q="
            className="text-sm font-medium text-white/90 transition-colors hover:text-[#F8A809]"
          >
            Rechercher
          </Link>
          <a
            href="https://www.pompes-funebres-roceclerc-nancy.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-[#F8A809]/40 px-4 py-1.5 text-sm font-medium text-[#F8A809] transition-colors hover:bg-[#F8A809]/10"
          >
            roceclerc-nancy.com
          </a>
        </div>

        {/* Mobile hamburger */}
        <details className="group relative md:hidden">
          <summary className="flex h-10 w-10 cursor-pointer list-none items-center justify-center rounded-md text-white hover:bg-white/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="h-6 w-6 group-open:hidden"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5"
              />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={2}
              stroke="currentColor"
              className="hidden h-6 w-6 group-open:block"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </summary>
          <div className="absolute right-0 top-full mt-2 w-56 rounded-lg bg-[#1b284c] p-4 shadow-xl ring-1 ring-white/10">
            <Link
              href="/"
              className="block rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-[#F8A809]"
            >
              Espace Memoriel
            </Link>
            <Link
              href="/?q="
              className="block rounded-md px-3 py-2 text-sm font-medium text-white/90 hover:bg-white/10 hover:text-[#F8A809]"
            >
              Rechercher
            </Link>
            <a
              href="https://www.pompes-funebres-roceclerc-nancy.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 block rounded-md border border-[#F8A809]/40 px-3 py-2 text-center text-sm font-medium text-[#F8A809] hover:bg-[#F8A809]/10"
            >
              roceclerc-nancy.com
            </a>
          </div>
        </details>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="mt-auto border-t-4 border-[#F8A809] bg-[#16234c] text-white/80">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
          {/* Brand */}
          <div>
            <h3 className="mb-3 text-lg font-semibold text-[#F8A809]">
              Roc Eclerc Nancy
            </h3>
            <p className="text-sm leading-relaxed text-white/60">
              Espace memoriel dedie au souvenir de vos proches. Consultez les
              avis de deces et deposez vos messages de condoleances en toute
              simplicite.
            </p>
          </div>

          {/* Contact */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
              Contact
            </h4>
            <a
              href="tel:0383555555"
              className="flex items-center gap-2 text-sm text-white/70 transition-colors hover:text-[#F8A809]"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="h-4 w-4"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                />
              </svg>
              03 83 55 55 55
            </a>
          </div>

          {/* Links */}
          <div>
            <h4 className="mb-3 text-sm font-semibold uppercase tracking-wider text-white/50">
              Liens
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  className="text-white/70 transition-colors hover:text-[#F8A809]"
                >
                  Espace Memoriel
                </Link>
              </li>
              <li>
                <a
                  href="https://www.pompes-funebres-roceclerc-nancy.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white/70 transition-colors hover:text-[#F8A809]"
                >
                  Site principal
                </a>
              </li>
              <li>
                <Link
                  href="/mentions-legales"
                  className="text-white/70 transition-colors hover:text-[#F8A809]"
                >
                  Mentions legales
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          &copy; 2026 Roc Eclerc Nancy. Tous droits reserves.
        </div>
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className={`${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col font-sans">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
