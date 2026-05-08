"use client";

import { AccountNav } from "./account-nav";

type AccountShellProps = {
    children: React.ReactNode;
    /** Omit when the page provides its own hero (e.g. profile card). */
    title?: string;
    description?: string;
};

/**
 * Shared layout for account pages: clears fixed header, sticky section nav, consistent width and safe-area padding.
 */
export function AccountShell({ children, title, description }: AccountShellProps) {
    return (
        <div className="min-h-[calc(100dvh-5rem)] bg-brand-gray/30 pb-[max(1.25rem,env(safe-area-inset-bottom))] pt-16 dark:bg-background">
            <AccountNav />
            <div className="container mx-auto max-w-3xl px-4 sm:px-6 pt-6 md:pt-8 pb-12">
                {title ? (
                    <header className="mb-6 md:mb-8">
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-brand-dark dark:text-foreground">
                            {title}
                        </h1>
                        {description ? (
                            <p className="mt-2 text-sm text-muted-foreground md:text-base">{description}</p>
                        ) : null}
                    </header>
                ) : null}
                {children}
            </div>
        </div>
    );
}
