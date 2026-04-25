"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, MousePointerClick } from "lucide-react";

/**
 * Legacy funnels route.
 * Funnels now belong to the Community Home Pages experience.
 */
export default function FunnelsPage() {
    const router = useRouter();

    useEffect(() => {
        const timer = window.setTimeout(() => {
            router.replace("/creator/landing-pages?from=funnels");
        }, 1200);

        return () => window.clearTimeout(timer);
    }, [router]);

    return (
        <div className="flex min-h-[55vh] items-center justify-center px-4">
            <div className="max-w-md space-y-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                    <MousePointerClick className="h-6 w-6" />
                </div>
                <div className="space-y-2">
                    <h1 className="text-lg font-semibold text-slate-900">
                        Funnels moved into Community Home Pages
                    </h1>
                    <p className="text-sm leading-6 text-slate-600">
                        Redirecting you to the updated customization area where CTA and conversion sections are now managed.
                    </p>
                </div>
                <div className="flex items-center justify-center gap-2 text-sm text-violet-700">
                    <span>Opening Community Home Pages</span>
                    <ArrowRight className="h-4 w-4" />
                </div>
            </div>
        </div>
    );
}
