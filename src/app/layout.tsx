import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
// Note: J'ai renommé Web3Provider pour qu'il corresponde au nom de fichier
// Correctif: Remplacement des alias de chemin (@/) par des chemins relatifs
import { Web3Provider } from "./Web3Provider"; 
// Sidebar n'est plus importé ici, Header s'en charge
// Correctif: Remplacement des alias de chemin (@/) par des chemins relatifs
import { Header } from "../components/layout/Header";
import { Analytics } from "@vercel/analytics/next";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "YB marketplace",
  description: "",
};


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Web3Provider>
          {/* Le Header contient maintenant la navigation */}
          <Header />
          {/* Le contenu de la page est rendu en dessous */}
          {children}
          <Analytics />
        </Web3Provider>

      </body>
    </html >
  );
}