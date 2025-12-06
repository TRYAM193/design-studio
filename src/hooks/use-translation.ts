import { useAuth } from "@/hooks/use-auth";
import { translations, Language } from "@/lib/translations";

export function useTranslation() {
  const { user } = useAuth();
  // Default to 'en' if user is not logged in or language is not set
  const language = (user?.language as Language) || "en";

  const t = (key: string) => {
    const translation = translations[language]?.[key];
    // Fallback to English if translation is missing, then to the key itself
    return translation || translations["en"][key] || key;
  };

  return { t, language };
}
