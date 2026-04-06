"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Home, ArrowRight } from "lucide-react";

/**
 * Legacy customize page — redirects to the Community Home Pages dashboard.
 * @deprecated Use Community Home Pages at /creator/landing-pages instead.
 */
export default function CustomizeCommunityPage() {
    const router = useRouter();

    useEffect(() => {
        const timer = setTimeout(() => {
            router.replace("/creator/landing-pages");
        }, 1500);
        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
                    <Home className="h-6 w-6 text-purple-600" />
                </div>
                <div className="space-y-1">
                    <h2 className="text-sm font-semibold text-gray-800">
                        Community Home Pages
                    </h2>
                    <p className="text-sm text-muted-foreground flex items-center justify-center gap-1">
                        Redirecting to the new visual page builder
                        <ArrowRight className="h-3.5 w-3.5" />
                    </p>
                </div>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600 mx-auto" />
                <p className="text-xs text-muted-foreground/60">
                    The old customize experience has moved to Community Home Pages.
                </p>
            </div>
        </div>
    );
}
