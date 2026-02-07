import { translations } from "@/lib/translations";

export function useTranslation() {
  // Enforce English only
  const language = "en";

  const t = (key: string) => {
    const translation = translations[language]?.[key];
    // Fallback to the key itself if translation is missing
    return translation || key;
  };

  return { t, language };
}