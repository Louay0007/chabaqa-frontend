"use client";

import React from "react";
import { CommunityJoinCheckoutSection } from "./community-join-checkout-section";
import { CommunityHero } from "./community-hero";
import { CommunityTestimonials } from "./community-testimonials";
import { CommunityCTA } from "./community-cta";
import { cn } from "@/lib/utils";
import {
    Star,
    Users,
    CheckCircle2,
    ArrowRight,
    Play,
    Quote,
    Clock,
    Shield,
    Sparkles,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { useState } from "react";

// ─── Types ──────────────────────────────────────────────────────────────────────

interface PageBlock {
    id: string;
    type: string;
    content: Record<string, any>;
    style?: Record<string, any>;
    visible?: boolean;
}

interface CommunityHomePageRendererProps {
    community: any;
    blocks: PageBlock[];
    pageContent?: any;
    checkoutCommunityData?: any;
    isMember?: boolean;
    ratings?: any;
    latestPosts?: any[];
    theme?: any;
}

// ─── Block Renderers ────────────────────────────────────────────────────────────

function HeroBlock({ block, community }: { block: PageBlock; community: any }) {
    const { headline, subheadline, ctaText, ctaUrl, backgroundImage } =
        block.content;
    const style = block.style || {};

    return (
        <section
            className="relative overflow-hidden"
            style={{
                backgroundColor: style.backgroundColor || "#0f0a2e",
                color: style.textColor || "#ffffff",
                paddingTop: style.padding?.top || 80,
                paddingBottom: style.padding?.bottom || 80,
                paddingLeft: style.padding?.left || 20,
                paddingRight: style.padding?.right || 20,
            }}
        >
            {backgroundImage && (
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-30"
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                />
            )}
            <div className="relative z-10 mx-auto max-w-4xl text-center">
                <h1 className="mb-6 text-4xl font-bold leading-tight md:text-5xl lg:text-6xl">
                    {headline || community?.name || "Welcome"}
                </h1>
                {subheadline && (
                    <p className="mb-8 text-lg opacity-90 md:text-xl">
                        {subheadline}
                    </p>
                )}
                {ctaText && (
                    <a
                        href={ctaUrl || "#join"}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-gray-900 transition-transform hover:scale-105"
                    >
                        {ctaText}
                        <ArrowRight className="h-4 w-4" />
                    </a>
                )}
            </div>
        </section>
    );
}

function TextBlock({ block }: { block: PageBlock }) {
    const { body, headline } = block.content;
    const style = block.style || {};

    return (
        <section
            style={{
                backgroundColor: style.backgroundColor || "#ffffff",
                color: style.textColor || "#1a1a2e",
                paddingTop: style.padding?.top || 60,
                paddingBottom: style.padding?.bottom || 60,
                paddingLeft: style.padding?.left || 20,
                paddingRight: style.padding?.right || 20,
            }}
        >
            <div className="mx-auto max-w-4xl">
                {headline && (
                    <h2 className="mb-4 text-3xl font-bold">{headline}</h2>
                )}
                {body && (
                    <div
                        className="prose prose-lg max-w-none"
                        dangerouslySetInnerHTML={{ __html: body }}
                    />
                )}
            </div>
        </section>
    );
}

function FeaturesBlock({ block }: { block: PageBlock }) {
    const { headline, subheadline, features } = block.content;
    const style = block.style || {};

    return (
        <section
            style={{
                backgroundColor: style.backgroundColor || "#ffffff",
                color: style.textColor || "#1a1a2e",
                paddingTop: style.padding?.top || 60,
                paddingBottom: style.padding?.bottom || 60,
                paddingLeft: style.padding?.left || 20,
                paddingRight: style.padding?.right || 20,
            }}
        >
            <div className="mx-auto max-w-6xl">
                <div className="mb-12 text-center">
                    {headline && (
                        <h2 className="mb-4 text-3xl font-bold">{headline}</h2>
                    )}
                    {subheadline && (
                        <p className="text-lg opacity-70">{subheadline}</p>
                    )}
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {(features || []).map((feature: any, idx: number) => (
                        <div
                            key={idx}
                            className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
                        >
                            <div className="mb-4 text-3xl">
                                {feature.icon || "✨"}
                            </div>
                            <h3 className="mb-2 text-lg font-semibold">
                                {feature.title}
                            </h3>
                            {feature.description && (
                                <p className="text-sm opacity-70">
                                    {feature.description}
                                </p>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function TestimonialsBlock({ block }: { block: PageBlock }) {
    const { headline, subheadline, testimonials } = block.content;
    const style = block.style || {};

    if (!testimonials?.length) return null;

    return (
        <section
            style={{
                backgroundColor: style.backgroundColor || "#ffffff",
                color: style.textColor || "#1a1a2e",
                paddingTop: style.padding?.top || 60,
                paddingBottom: style.padding?.bottom || 60,
                paddingLeft: style.padding?.left || 20,
                paddingRight: style.padding?.right || 20,
            }}
        >
            <div className="mx-auto max-w-6xl">
                <div className="mb-12 text-center">
                    {headline && (
                        <h2 className="mb-4 text-3xl font-bold">{headline}</h2>
                    )}
                    {subheadline && (
                        <p className="text-lg opacity-70">{subheadline}</p>
                    )}
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {testimonials.map((t: any, idx: number) => (
                        <div
                            key={idx}
                            className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
                        >
                            <div className="mb-4 flex items-center gap-1">
                                {Array.from({ length: t.rating || 5 }).map(
                                    (_, i) => (
                                        <Star
                                            key={i}
                                            className="h-4 w-4 fill-yellow-400 text-yellow-400"
                                        />
                                    ),
                                )}
                            </div>
                            <Quote className="mb-2 h-6 w-6 text-purple-300" />
                            <p className="mb-4 text-sm leading-relaxed opacity-80">
                                {t.content}
                            </p>
                            <div className="flex items-center gap-3">
                                {t.avatar && (
                                    <img
                                        src={t.avatar}
                                        alt={t.name}
                                        className="h-10 w-10 rounded-full object-cover"
                                    />
                                )}
                                <div>
                                    <p className="font-semibold text-sm">
                                        {t.name}
                                    </p>
                                    {t.role && (
                                        <p className="text-xs opacity-60">
                                            {t.role}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function CTABlock({ block }: { block: PageBlock }) {
    const { headline, subheadline, ctaText, ctaUrl, backgroundImage } =
        block.content;
    const style = block.style || {};

    return (
        <section
            className="relative overflow-hidden"
            style={{
                backgroundColor: style.backgroundColor || "#0f0a2e",
                color: style.textColor || "#ffffff",
                paddingTop: style.padding?.top || 60,
                paddingBottom: style.padding?.bottom || 60,
                paddingLeft: style.padding?.left || 20,
                paddingRight: style.padding?.right || 20,
            }}
        >
            {backgroundImage && (
                <div
                    className="absolute inset-0 bg-cover bg-center opacity-20"
                    style={{ backgroundImage: `url(${backgroundImage})` }}
                />
            )}
            <div className="relative z-10 mx-auto max-w-3xl text-center">
                {headline && (
                    <h2 className="mb-4 text-3xl font-bold">{headline}</h2>
                )}
                {subheadline && (
                    <p className="mb-8 text-lg opacity-80">{subheadline}</p>
                )}
                {ctaText && (
                    <a
                        href={ctaUrl || "#join"}
                        className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 font-semibold text-gray-900 transition-transform hover:scale-105"
                    >
                        {ctaText}
                        <ArrowRight className="h-4 w-4" />
                    </a>
                )}
            </div>
        </section>
    );
}

function ImageBlock({ block }: { block: PageBlock }) {
    const { src, alt, caption } = block.content;
    const style = block.style || {};

    return (
        <section
            style={{
                backgroundColor: style.backgroundColor || "#ffffff",
                paddingTop: style.padding?.top || 40,
                paddingBottom: style.padding?.bottom || 40,
                paddingLeft: style.padding?.left || 20,
                paddingRight: style.padding?.right || 20,
            }}
        >
            <div className="mx-auto max-w-4xl">
                {src && (
                    <img
                        src={src}
                        alt={alt || ""}
                        className="w-full rounded-xl shadow-md"
                    />
                )}
                {caption && (
                    <p className="mt-3 text-center text-sm opacity-60">
                        {caption}
                    </p>
                )}
            </div>
        </section>
    );
}

function VideoBlock({ block }: { block: PageBlock }) {
    const { url, headline } = block.content;
    const style = block.style || {};

    return (
        <section
            style={{
                backgroundColor: style.backgroundColor || "#ffffff",
                paddingTop: style.padding?.top || 60,
                paddingBottom: style.padding?.bottom || 60,
                paddingLeft: style.padding?.left || 20,
                paddingRight: style.padding?.right || 20,
            }}
        >
            <div className="mx-auto max-w-4xl">
                {headline && (
                    <h2 className="mb-6 text-center text-3xl font-bold">
                        {headline}
                    </h2>
                )}
                {url && (
                    <div className="aspect-video overflow-hidden rounded-xl shadow-lg">
                        <iframe
                            src={url}
                            className="h-full w-full"
                            allowFullScreen
                            allow="autoplay; encrypted-media"
                        />
                    </div>
                )}
            </div>
        </section>
    );
}

function FAQBlock({ block }: { block: PageBlock }) {
    const { headline, subheadline, faqs } = block.content;
    const style = block.style || {};
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <section
            style={{
                backgroundColor: style.backgroundColor || "#ffffff",
                color: style.textColor || "#1a1a2e",
                paddingTop: style.padding?.top || 60,
                paddingBottom: style.padding?.bottom || 60,
                paddingLeft: style.padding?.left || 20,
                paddingRight: style.padding?.right || 20,
            }}
        >
            <div className="mx-auto max-w-3xl">
                <div className="mb-12 text-center">
                    {headline && (
                        <h2 className="mb-4 text-3xl font-bold">{headline}</h2>
                    )}
                    {subheadline && (
                        <p className="text-lg opacity-70">{subheadline}</p>
                    )}
                </div>
                <div className="space-y-3">
                    {(faqs || []).map((faq: any, idx: number) => (
                        <div
                            key={idx}
                            className="rounded-lg border border-gray-200 bg-white"
                        >
                            <button
                                className="flex w-full items-center justify-between px-6 py-4 text-left font-medium"
                                onClick={() =>
                                    setOpenIndex(openIndex === idx ? null : idx)
                                }
                            >
                                {faq.question}
                                {openIndex === idx ? (
                                    <ChevronUp className="h-5 w-5 shrink-0 opacity-50" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 shrink-0 opacity-50" />
                                )}
                            </button>
                            {openIndex === idx && (
                                <div className="px-6 pb-4 text-sm opacity-70">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

function DividerBlock({ block }: { block: PageBlock }) {
    const style = block.style || {};

    return (
        <div
            style={{
                backgroundColor: style.backgroundColor || "transparent",
                paddingTop: style.padding?.top || 20,
                paddingBottom: style.padding?.bottom || 20,
            }}
        >
            <hr className="mx-auto max-w-4xl border-gray-200" />
        </div>
    );
}

function SocialProofBlock({ block }: { block: PageBlock }) {
    const { headline, stats, logos } = block.content;
    const style = block.style || {};

    return (
        <section
            style={{
                backgroundColor: style.backgroundColor || "#f8f7ff",
                color: style.textColor || "#1a1a2e",
                paddingTop: style.padding?.top || 40,
                paddingBottom: style.padding?.bottom || 40,
                paddingLeft: style.padding?.left || 20,
                paddingRight: style.padding?.right || 20,
            }}
        >
            <div className="mx-auto max-w-6xl text-center">
                {headline && (
                    <h2 className="mb-8 text-2xl font-bold">{headline}</h2>
                )}
                {stats?.length > 0 && (
                    <div className="mb-8 flex flex-wrap justify-center gap-12">
                        {stats.map((stat: any, idx: number) => (
                            <div key={idx}>
                                <div className="text-3xl font-bold">
                                    {stat.value}
                                </div>
                                <div className="text-sm opacity-60">
                                    {stat.label}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {logos?.length > 0 && (
                    <div className="flex flex-wrap items-center justify-center gap-8">
                        {logos.map((logo: any, idx: number) => (
                            <img
                                key={idx}
                                src={logo.src || logo}
                                alt={logo.alt || ""}
                                className="h-8 opacity-50 grayscale transition-opacity hover:opacity-100 hover:grayscale-0"
                            />
                        ))}
                    </div>
                )}
            </div>
        </section>
    );
}

function CommunityJoinBlock({
    block,
    community,
    checkoutCommunityData,
}: {
    block: PageBlock;
    community: any;
    checkoutCommunityData?: any;
}) {
    // Use the existing CommunityJoinCheckoutSection component
    return (
        <div id="join">
            <CommunityJoinCheckoutSection
                community={checkoutCommunityData || community}
            />
        </div>
    );
}

function CommunityStatsBlock({
    block,
    community,
}: {
    block: PageBlock;
    community: any;
}) {
    const { showMemberCount, showRating, showCreatorInfo, statsLayout } =
        block.content;
    const style = block.style || {};

    return (
        <section
            style={{
                backgroundColor: style.backgroundColor || "#0f0a2e",
                color: style.textColor || "#ffffff",
                paddingTop: style.padding?.top || 40,
                paddingBottom: style.padding?.bottom || 40,
                paddingLeft: style.padding?.left || 20,
                paddingRight: style.padding?.right || 20,
            }}
        >
            <div
                className={cn(
                    "mx-auto max-w-4xl",
                    statsLayout === "grid"
                        ? "grid grid-cols-2 gap-8 md:grid-cols-4"
                        : "flex flex-wrap items-center justify-center gap-12",
                )}
            >
                {showMemberCount && (
                    <div className="text-center">
                        <Users className="mx-auto mb-2 h-8 w-8 opacity-80" />
                        <div className="text-3xl font-bold">
                            {community?.members || community?.membersCount || 0}
                        </div>
                        <div className="text-sm opacity-60">Members</div>
                    </div>
                )}
                {showRating &&
                    (community?.rating || community?.averageRating) > 0 && (
                        <div className="text-center">
                            <Star className="mx-auto mb-2 h-8 w-8 opacity-80" />
                            <div className="text-3xl font-bold">
                                {community?.rating ||
                                    community?.averageRating ||
                                    0}
                            </div>
                            <div className="text-sm opacity-60">Rating</div>
                        </div>
                    )}
                {showCreatorInfo && community?.creator && (
                    <div className="text-center">
                        <Sparkles className="mx-auto mb-2 h-8 w-8 opacity-80" />
                        <div className="text-lg font-semibold">
                            {typeof community.creator === "string"
                                ? community.creator
                                : community.creator.name || "Creator"}
                        </div>
                        <div className="text-sm opacity-60">Creator</div>
                    </div>
                )}
            </div>
        </section>
    );
}

function CommunityContentPreviewBlock({
    block,
    latestPosts,
}: {
    block: PageBlock;
    latestPosts?: any[];
}) {
    const { headline, subheadline, previewCount } = block.content;
    const style = block.style || {};
    const posts = (latestPosts || []).slice(0, previewCount || 6);

    if (!posts.length) return null;

    return (
        <section
            style={{
                backgroundColor: style.backgroundColor || "#ffffff",
                color: style.textColor || "#1a1a2e",
                paddingTop: style.padding?.top || 60,
                paddingBottom: style.padding?.bottom || 60,
                paddingLeft: style.padding?.left || 20,
                paddingRight: style.padding?.right || 20,
            }}
        >
            <div className="mx-auto max-w-6xl">
                <div className="mb-12 text-center">
                    {headline && (
                        <h2 className="mb-4 text-3xl font-bold">{headline}</h2>
                    )}
                    {subheadline && (
                        <p className="text-lg opacity-70">{subheadline}</p>
                    )}
                </div>
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                    {posts.map((post: any, idx: number) => (
                        <div
                            key={idx}
                            className="rounded-xl border border-gray-100 bg-white p-6 shadow-sm"
                        >
                            <h3 className="mb-2 font-semibold line-clamp-2">
                                {post.title ||
                                    post.content?.substring(0, 100) ||
                                    "Post"}
                            </h3>
                            <p className="text-sm opacity-60 line-clamp-3">
                                {post.excerpt ||
                                    post.content?.substring(0, 200) ||
                                    ""}
                            </p>
                            <div className="mt-4 flex items-center gap-2 text-xs opacity-50">
                                <span>{post.author || "Member"}</span>
                                <span>·</span>
                                <span>{post.timestamp || ""}</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}

// ─── Main Renderer ──────────────────────────────────────────────────────────────

function BlockRenderer({
    block,
    community,
    checkoutCommunityData,
    isMember,
    latestPosts,
}: {
    block: PageBlock;
    community: any;
    checkoutCommunityData?: any;
    isMember?: boolean;
    latestPosts?: any[];
}) {
    switch (block.type) {
        case "hero":
            return <HeroBlock block={block} community={community} />;
        case "text":
            return <TextBlock block={block} />;
        case "features":
            return <FeaturesBlock block={block} />;
        case "testimonials":
            return <TestimonialsBlock block={block} />;
        case "cta":
            return <CTABlock block={block} />;
        case "image":
            return <ImageBlock block={block} />;
        case "video":
            return <VideoBlock block={block} />;
        case "faq":
            return <FAQBlock block={block} />;
        case "divider":
            return <DividerBlock block={block} />;
        case "social-proof":
            return <SocialProofBlock block={block} />;
        case "community-join":
            return (
                <CommunityJoinBlock
                    block={block}
                    community={community}
                    checkoutCommunityData={checkoutCommunityData}
                />
            );
        case "community-stats":
            return <CommunityStatsBlock block={block} community={community} />;
        case "community-content-preview":
            return (
                <CommunityContentPreviewBlock
                    block={block}
                    latestPosts={latestPosts}
                />
            );
        default:
            return null;
    }
}

export function CommunityHomePageRenderer({
    community,
    blocks,
    pageContent,
    checkoutCommunityData,
    isMember = false,
    ratings,
    latestPosts,
    theme,
}: CommunityHomePageRendererProps) {
    const visibleBlocks = blocks.filter((b) => b.visible !== false);

    // Commerce safety: ensure community-join block exists for non-members
    const hasCommunityJoin = visibleBlocks.some(
        (b) => b.type === "community-join",
    );
    const shouldInjectJoin = !isMember && !hasCommunityJoin;

    // Determine injection position: after hero block, or at index 1, or at end
    const heroIdx = visibleBlocks.findIndex((b) => b.type === "hero");
    const injectIdx = heroIdx >= 0 ? heroIdx + 1 : Math.min(1, visibleBlocks.length);

    return (
        <div className="min-h-screen">
            {visibleBlocks.map((block, idx) => (
                <React.Fragment key={block.id}>
                    {shouldInjectJoin && idx === injectIdx && (
                        <div id="join">
                            <CommunityJoinCheckoutSection
                                community={checkoutCommunityData || community}
                            />
                        </div>
                    )}
                    <BlockRenderer
                        block={block}
                        community={community}
                        checkoutCommunityData={checkoutCommunityData}
                        isMember={isMember}
                        latestPosts={latestPosts}
                    />
                </React.Fragment>
            ))}
            {/* If injection point was beyond all blocks, inject at end */}
            {shouldInjectJoin && injectIdx >= visibleBlocks.length && (
                <div id="join">
                    <CommunityJoinCheckoutSection
                        community={checkoutCommunityData || community}
                    />
                </div>
            )}
        </div>
    );
}
