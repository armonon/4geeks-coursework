import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Talk to the Machine",
  description: "An observable AI chat powered by Groq and Meta Llama 3",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
