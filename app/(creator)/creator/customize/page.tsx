"use client";

import { useRouter } from "next/navigation";
import { ArrowRight, LayoutTemplate, MousePointerClick } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

/**
 * Legacy customize route kept as a simple upgrade path.
 */
export default function CustomizeCommunityPage() {
    const router = useRouter();

    return (
        <div className="mx-auto flex min-h-[60vh] max-w-3xl items-center px-4 py-10">
            <Card className="w-full border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50 shadow-sm">
                <CardContent className="space-y-5 p-6 md:p-8">
                    <Badge className="bg-violet-600 text-white hover:bg-violet-600">
                        Community Home Pages
                    </Badge>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                            Customize pages and conversion flows in one place
                        </h1>
                        <p className="text-sm leading-6 text-slate-600">
                            The old funnels area has been removed. Use Community Home Pages to design your public page, add lead capture blocks, and guide visitors into your community.
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2">
                        <div className="rounded-2xl border bg-white/80 p-4 text-sm text-slate-600">
                            <LayoutTemplate className="mb-3 h-5 w-5 text-violet-600" />
                            Build and manage home pages with templates and the visual editor.
                        </div>
                        <div className="rounded-2xl border bg-white/80 p-4 text-sm text-slate-600">
                            <MousePointerClick className="mb-3 h-5 w-5 text-rose-600" />
                            Add CTA, pricing, and signup sections without a separate funnel dashboard.
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-3">
                        <Button onClick={() => router.push("/creator/landing-pages")}>
                            Open Home Pages
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => router.push("/creator/landing-pages/templates")}
                        >
                            Browse Templates
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
