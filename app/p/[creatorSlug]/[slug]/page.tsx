// Public landing page renderer
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import PageViewTracker from "./page-view-tracker";
import PublicBlockRenderer from "@/components/landing-pages/public-block-renderer";

interface Props {
    params: { creatorSlug: string; slug: string };
}

async function getPageData(creatorSlug: string, slug: string) {
    const baseUrl =
        process.env.API_INTERNAL_URL ||
        process.env.NEXT_PUBLIC_API_URL ||
        "http://localhost:3000/api";
    try {
        // Try creator-scoped endpoint first (prevents slug ambiguity)
        const res = await fetch(
            `${baseUrl}/landing-pages/public/${creatorSlug}/${slug}`,
            { next: { revalidate: 300 } },
        );
        if (res.ok) {
            const json = await res.json();
            return json.data ?? null;
        }
        // Fallback to slug-only endpoint for backwards compatibility
        const res2 = await fetch(`${baseUrl}/landing-pages/public/${slug}`, {
            next: { revalidate: 300 },
        });
        if (!res2.ok) return null;
        const json2 = await res2.json();
        return json2.data ?? null;
    } catch {
        return null;
    }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const page = await getPageData(params.creatorSlug, params.slug);
    if (!page) return { title: "Page Not Found" };
    return {
        title: page.seo?.title || page.title,
        description: page.seo?.description,
        keywords: page.seo?.keywords?.join(", "),
        robots: page.seo?.noIndex ? "noindex,nofollow" : "index,follow",
        openGraph: {
            title: page.seo?.ogTitle || page.seo?.title || page.title,
            description: page.seo?.ogDescription || page.seo?.description,
            images: page.seo?.ogImage ? [{ url: page.seo.ogImage }] : [],
        },
    };
}

export default async function PublicLandingPage({ params }: Props) {
    const page = await getPageData(params.creatorSlug, params.slug);
    if (!page) notFound();

    const pageId = page._id || page.id;
    // Do not execute database-provided script content on the public page.
    // Tracking pixels stored as arbitrary JS can break SSR/runtime stability.

    return (
        <>
            <PageViewTracker pageId={pageId} />
            <main style={{ fontFamily: "Inter, system-ui, sans-serif" }}>
                <PublicBlockRenderer
                    blocks={page.blocks ?? []}
                    pageId={pageId}
                />
            </main>
        </>
    );
}
