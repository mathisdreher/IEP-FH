import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Navigation } from "@/components/navigation";
import { ThemeProvider } from "@/components/theme-provider";
import { LanguageProvider } from "@/components/language-provider";
import { Footer } from "@/components/footer";
import { BottomTabBar } from "@/components/bottom-tab-bar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Index Égalité Professionnelle F/H",
    template: "%s | Index Égalité Pro",
  },
  description:
    "Explorez l'Index d'Égalité Professionnelle Femmes-Hommes des entreprises françaises. Comparez les scores par entreprise, secteur et région.",
};

const themeScript = `(function(){try{var t=localStorage.getItem('theme');var d=t==='dark'||(t!=='light'&&matchMedia('(prefers-color-scheme:dark)').matches);if(d)document.documentElement.classList.add('dark')}catch(e){}})()`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider>
          <LanguageProvider>
            <Navigation />
            <main className="min-h-[calc(100vh-4rem)] pb-16 md:pb-0">{children}</main>
            <Footer />
            <BottomTabBar />
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
