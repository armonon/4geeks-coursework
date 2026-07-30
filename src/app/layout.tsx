import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import Navbar from "@/components/Navbar";
import { FavoritesProvider } from "@/context/FavoritesContext";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Wanderlust Explorer",
  description: "Discover and save extraordinary experiences around the world.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${display.variable} ${sans.variable}`}>
        <FavoritesProvider>
          <Navbar />
          <main>{children}</main>
          <footer className="footer">
            <div className="shell footer__inner">
              <strong>WANDERLUST</strong>
              <p>Go farther. Feel more.</p>
              <span>© 2026 Wanderlust Explorer</span>
            </div>
          </footer>
        </FavoritesProvider>
      </body>
    </html>
  );
}
