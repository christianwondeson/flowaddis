"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Moon } from "lucide-react";
import { useTheme } from "@/components/providers/theme-provider";
import { writeStoredThemePreference } from "@/lib/theme-storage";

/**
 * Dark mode switch: `writeStoredThemePreference` updates storage, `<html class="dark">`, and
 * fires an event so ThemeProvider refreshes `resolvedTheme` for this controlled Switch.
 */
export function AppearanceThemeSection() {
    const { resolvedTheme } = useTheme();

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-2 text-lg font-semibold text-foreground">
                <Moon className="w-5 h-5 text-brand-primary" aria-hidden />
                <h2>Appearance</h2>
            </div>
            <div className="space-y-4 pl-0 sm:pl-7">
                <div className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50/80 dark:bg-slate-800/50 px-4 py-3">
                    <div className="space-y-0.5 min-w-0">
                        <Label htmlFor="dark-mode" className="text-base text-foreground">
                            Dark mode
                        </Label>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            Light by default. When you flip this switch, your choice is saved{" "}
                            <span className="font-medium text-slate-600 dark:text-slate-300">immediately</span> in this
                            browser (browser local storage). You don&apos;t need to press &quot;Save Changes&quot; at the
                            bottom. Other browsers or devices won&apos;t share it.
                        </p>
                    </div>
                    <Switch
                        id="dark-mode"
                        checked={resolvedTheme === "dark"}
                        onCheckedChange={(on) => writeStoredThemePreference(on ? "dark" : "light")}
                        aria-label="Toggle dark mode"
                    />
                </div>
            </div>
        </div>
    );
}
