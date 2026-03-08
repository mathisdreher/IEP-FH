"use client";

import { useLanguage } from "./language-provider";

export function Footer() {
  const { t } = useLanguage();

  return (
    <footer className="border-t border-border bg-muted/50 py-6 text-center text-sm text-muted-foreground">
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
        {" "}— {t.footer.autoUpdated}
      </p>
    </footer>
  );
}
