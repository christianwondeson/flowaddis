'use client';

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Preloader } from '@/components/ui/preloader';

/**
 * Legacy /login URL  auth lives at /signin.
 * Shows brand preloader while redirecting (preserves next/redirect/from).
 */
function LoginAliasRedirect() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const qs = new URLSearchParams();
        searchParams.forEach((value, key) => {
            if (!value) return;
            if (key === 'next') qs.set('redirect', value);
            else qs.set(key, value);
        });
        const suffix = qs.toString() ? `?${qs.toString()}` : '';
        router.replace(`/signin${suffix}`);
    }, [router, searchParams]);

    return (
        <Preloader
            fullScreen
            size="lg"
            label="Taking you to sign in…"
        />
    );
}

export default function LoginAliasPage() {
    return (
        <Suspense
            fallback={
                <Preloader fullScreen size="lg" label="Loading…" />
            }
        >
            <LoginAliasRedirect />
        </Suspense>
    );
}
