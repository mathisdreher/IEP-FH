"use client";

import { useLanguage } from "./language-provider";

interface FooterProps {
  lastUpdated?: string;
}

export function Footer({ lastUpdated }: FooterProps) {
  const { locale, t } = useLanguage();

  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString(locale === "en" ? "en-GB" : "fr-FR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <footer className="border-t border-border bg-muted/50 py-6 text-center text-sm text-muted-foreground">
      <p className="font-medium text-foreground/70 mb-2">
        🇫🇷 {t.footer.frenchData}
      </p>
      <p>
        {t.footer.dataFrom}{" "}
        <a
          href="https://www.data.gouv.fr/datasets/index-egalite-professionnelle-f-h-des-entreprises-de-50-salaries-ou-plus/"
          className="underline hover:text-foreground"
          target="_blank"
          rel="noopener noreferrer"
        >
          data.gouv.fr
        </a>
        {" "}—{" "}
        {formattedDate
          ? `${t.footer.updatedOn} ${formattedDate}`
          : t.footer.autoUpdated}
      </p>
      <p className="mt-1">
        {t.footer.openSource} —{" "}
        <a
          href="https://github.com/mathisdreher/IEP-FH"
          className="underline hover:text-foreground"
          target="_blank"
          rel="noopener noreferrer"
        >
          GitHub
        </a>
        {" "}({t.footer.license})
      </p>
    </footer>
  );
}
