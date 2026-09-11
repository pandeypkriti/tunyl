import type { Metadata } from "next";
import { Archivo, Source_Serif_4 } from "next/font/google";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], weight: ["500", "600", "700"], variable: "--font-archivo", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-source-serif", display: "swap" });

export const metadata: Metadata = {
  title: { default: "Tunyl", template: "%s · Tunyl" },
  description: "The site photographs the docket. The office gets the claim.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${serif.variable}`}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
