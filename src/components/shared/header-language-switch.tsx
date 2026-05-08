"use client";

import { Globe } from "lucide-react";
import { clsx } from "clsx";
import { useTranslations } from "@/components/providers/locale-provider";
import type { AppLocale } from "@/lib/i18n/config";

type Props = {
    /** Light-on-transparent hero (home / booking heroes) */
    transparentLight?: boolean;
};

export function HeaderLanguageSwitch({ transparentLight }: Props) {
    const { locale, setLocale, t } = useTranslations();

    return (
        <label
            className={clsx(
                "inline-flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-semibold cursor-pointer shrink-0",
                transparentLight
                    ? "text-white border border-white/30 hover:bg-white/10"
                    : "text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800",
            )}
        >
            <Globe className="w-4 h-4 shrink-0 opacity-90" aria-hidden />
            <select
                value={locale}
                onChange={(e) => setLocale(e.target.value as AppLocale)}
                className={clsx(
                    "bg-transparent font-semibold outline-none cursor-pointer max-w-[10rem]",
                    transparentLight && "text-white",
                )}
                aria-label={t("languageSwitcher.label")}
            >
                <option value="en">{t("languageSwitcher.englishShort")} · English</option>
                <option value="am">{t("languageSwitcher.amharicShort")} · አማርኛ</option>
            </select>
        </label>
    );
}
