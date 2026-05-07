"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Globe } from "lucide-react";

const languages = [
  { code: "en", name: "English", flag: "🇺🇸" },
  { code: "de", name: "Deutsch", flag: "🇩🇪" },
  { code: "de-CH", name: "Deutsch Schweiz", flag: "🇨🇭" },
  { code: "lb-LU", name: "Lëtzebuergesch", flag: "🇱🇺" },
  { code: "es", name: "Español", flag: "🇪🇸" },
  { code: "hi-IN", name: "हिन्दी", flag: "🇮🇳" },
];

export function LanguageSwitcher() {
  const t = useTranslations("LanguageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();

  const handleLanguageChange = (newLocale: string) => {
    router.replace(pathname, { locale: newLocale });
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={locale} onValueChange={handleLanguageChange}>
        <SelectTrigger
          aria-label={t("label")}
          className="h-10 w-[170px] max-w-[45vw] rounded-full border-zinc-200 bg-white/90 shadow-sm backdrop-blur transition hover:shadow-md focus:ring-purple-500 dark:border-zinc-800 dark:bg-zinc-900/90"
        >
          <Globe className="mr-2 h-4 w-4 text-purple-600 dark:text-purple-400" />
          <SelectValue placeholder={t("placeholder")} />
        </SelectTrigger>
        <SelectContent className="z-[100] rounded-xl border-zinc-200 bg-white/95 shadow-xl backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/95">
          {languages.map((lang) => (
            <SelectItem
              key={lang.code}
              value={lang.code}
              className="cursor-pointer transition-colors focus:bg-purple-50 focus:text-purple-700 dark:focus:bg-purple-900/20 dark:focus:text-purple-300"
            >
              <span className="flex items-center gap-2">
                <span aria-hidden>{lang.flag}</span>
                <span>{lang.name}</span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
