"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { dictionaries, type Locale, type Dictionary } from "@/lib/i18n";

interface LanguageContextValue {
  locale: Locale;
  setLocale: (l: Locale) => void;
  t: Dictionary;
}

const LanguageContext = createContext<LanguageContextValue>({
  locale: "fr",
  setLocale: () => {},
  t: dictionaries.fr,
});

export function useLanguage() {
  return useContext(LanguageContext);
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored && (stored === "fr" || stored === "en")) {
      setLocaleState(stored);
      document.documentElement.lang = stored;
      document.cookie = `locale=${stored};path=/;max-age=31536000;SameSite=Lax`;
    }
  }, []);

  const setLocale = useCallback((l: Locale) => {
    setLocaleState(l);
    localStorage.setItem("locale", l);
    document.documentElement.lang = l;
    document.cookie = `locale=${l};path=/;max-age=31536000;SameSite=Lax`;
  }, []);

  const t = dictionaries[locale];

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
