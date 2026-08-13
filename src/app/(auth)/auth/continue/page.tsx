"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/auth-provider";
import { getPostAuthPath } from "@/lib/auth/post-login-path";
import { Preloader } from "@/components/ui/preloader";
import { toast } from "sonner";

/**
 * Middleware / sign-in send users here so we can read Firestore role +
 * hotelPartnerStatus client-side and route to the correct destination.
 */
function AuthContinueContent() {
    const { user, loading, profileError } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirect = searchParams.get("redirect") || searchParams.get("from") || "/";
    const [label, setLabel] = useState("Taking you to your account…");

    useEffect(() => {
        if (loading) {
            setLabel("Loading your profile…");
            return;
        }
        if (profileError) {
            toast.error(
                "Could not load your account profile. Refresh the page or sign in again.",
            );
            setLabel("Could not load profile");
            return;
        }
        if (!user) {
            const q =
                redirect && redirect !== "/"
                    ? `?redirect=${encodeURIComponent(redirect)}`
                    : "";
            setLabel("Redirecting to sign in…");
            router.replace(`/signin${q}`);
            return;
        }

        const dest = getPostAuthPath(user, redirect);
        if (dest.startsWith("/partner/pending")) {
            setLabel("Opening application status…");
        } else if (dest.includes("hotel_partner")) {
            setLabel("Continue hotel registration…");
        } else if (dest.startsWith("/admin")) {
            setLabel("Opening admin…");
        } else {
            setLabel("Opening your account…");
        }
        router.replace(dest);
    }, [loading, profileError, user, redirect, router]);

    return <Preloader fullScreen size="lg" label={label} />;
}

export default function AuthContinuePage() {
    return (
        <Suspense
            fallback={<Preloader fullScreen size="lg" label="Loading…" />}
        >
            <AuthContinueContent />
        </Suspense>
    );
}
