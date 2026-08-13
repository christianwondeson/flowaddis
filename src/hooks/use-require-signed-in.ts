'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/components/providers/auth-provider';
import { buildSignInHref } from '@/lib/auth/post-login-path';

/**
 * Client-side guard for account pages. Middleware protects full page loads;
 * after client logout the URL can stay on /dashboard while user is null  redirect instead of a blank screen.
 */
export function useRequireSignedIn() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (loading || user) return;
        const currentPath =
            typeof window !== 'undefined'
                ? window.location.pathname + window.location.search
                : pathname;
        router.replace(buildSignInHref(currentPath));
    }, [loading, user, router, pathname]);

    return { user, loading, isAuthenticated: !!user };
}
