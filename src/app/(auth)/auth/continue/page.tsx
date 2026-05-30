"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { getPostLoginPath } from "@/lib/auth/post-login-path";
import { Loader2 } from "lucide-react";

/**
 * Middleware sends signed-in users away from /signin here so we can read Firestore role
 * client-side and route admins to /admin (Edge middleware cannot read Firestore).
 */
function AuthContinueContent() {
    const { user, loading } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect") || searchParams.get("from") || "/";

    useEffect(() => {
        if (loading) return;
        if (!user) {
            const q = redirect && redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : "";
            router.replace(`/signin${q}`);
            return;
        }
        router.replace(getPostLoginPath(user.role, redirect));
    }, [loading, user, redirect, router]);

    return (
        <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3">
            <Loader2 className="h-9 w-9 animate-spin text-brand-primary" aria-hidden />
            <p className="text-sm text-muted-foreground">Taking you to your account…</p>
        </div>
    );
}

export default function AuthContinuePage() {
    return (
        <Suspense fallback={null}>
            <AuthContinueContent />
        </Suspense>
    );
}
