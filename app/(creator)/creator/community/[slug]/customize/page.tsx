"use client";

import { useParams, useRouter } from "next/navigation";
import {
    ArrowRight,
    LayoutTemplate,
    MousePointerClick,
    Paintbrush,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { PageHeader, PageShell } from "@/components/creator-dashboard";

/**
 * Community-specific customization hub.
 * Funnels are no longer managed as a separate feature and now live inside
 * the Community Home Pages experience.
 */
export default function CommunityCustomizePage() {
    const router = useRouter();
    const params = useParams<{ slug: string }>();

    return (
        <PageShell>
            <PageHeader
                title="Customize Community"
                description="Manage your public community experience from one place."
                breadcrumbs={[
                    { label: "Dashboard", href: "/creator/dashboard" },
                    { label: "Communities", href: "/creator/communities" },
                    { label: params?.slug || "Community" },
                    { label: "Customize" },
                ]}
            />

            <div className="space-y-6">
                <Card className="overflow-hidden border-violet-200 bg-gradient-to-br from-violet-50 via-white to-fuchsia-50">
                    <CardContent className="flex flex-col gap-5 p-6 md:flex-row md:items-end md:justify-between">
                        <div className="max-w-2xl space-y-3">
                            <Badge className="w-fit bg-violet-600 text-white hover:bg-violet-600">
                                Community Home Pages
                            </Badge>
                            <div className="space-y-2">
                                <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
                                    Funnels now live inside your community page setup
                                </h2>
                                <p className="text-sm leading-6 text-slate-600">
                                    The separate funnels feature has been removed. Use Community Home Pages to build lead capture, CTA sections, and conversion-focused layouts for this community.
                                </p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-3">
                            <Button onClick={() => router.push("/creator/landing-pages")}>
                                Open Home Pages
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() =>
                                    router.push("/creator/landing-pages/templates")
                                }
                            >
                                Browse Templates
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="space-y-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-violet-100 text-violet-700">
                                <Paintbrush className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-base">Design the page</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm leading-6 text-slate-600">
                            Update branding, hero sections, proof blocks, and layouts from the home page builder.
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="space-y-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-rose-100 text-rose-700">
                                <MousePointerClick className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-base">Handle conversions</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm leading-6 text-slate-600">
                            Add calls to action, email capture blocks, pricing sections, and conversion paths directly on the page.
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="space-y-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
                                <LayoutTemplate className="h-5 w-5" />
                            </div>
                            <CardTitle className="text-base">Start from a template</CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0 text-sm leading-6 text-slate-600">
                            Pick a ready-made structure and adapt it to this community instead of creating a separate funnel flow.
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageShell>
    );
}
