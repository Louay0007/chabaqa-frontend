"use client";

import { useState, useEffect, type FormEvent } from "react";
import { landingPagesApi } from "@/lib/api/landing-pages.api";
import type { PageBlock } from "@/lib/landing-pages/types";

/* ------------------------------------------------------------------ */
/*  Helper: build individual padding from style props                 */
/* ------------------------------------------------------------------ */
function buildPaddingStylePublic(s: Record<string, any>): React.CSSProperties {
    if (s.paddingTop || s.paddingBottom || s.paddingLeft || s.paddingRight) {
        return {
            paddingTop: s.paddingTop || undefined,
            paddingBottom: s.paddingBottom || undefined,
            paddingLeft: s.paddingLeft || undefined,
            paddingRight: s.paddingRight || undefined,
        };
    }
    return { padding: s.padding || "48px 24px" };
}

/* ------------------------------------------------------------------ */
/*  Helper: convert YouTube / Vimeo watch URLs → embed URLs            */
/* ------------------------------------------------------------------ */
function toEmbedUrl(url: string): string {
    if (!url) return url;
    // YouTube: https://www.youtube.com/watch?v=VIDEO_ID  or  https://youtu.be/VIDEO_ID
    const ytMatch = url.match(
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]+)/,
    );
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}`;

    // Vimeo: https://vimeo.com/VIDEO_ID
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}`;

    return url;
}

/* ------------------------------------------------------------------ */
/*  CountdownBlock – needs hooks so must be its own component          */
/* ------------------------------------------------------------------ */
function CountdownBlock({ block }: { block: PageBlock }) {
    const c = block.content as Record<string, any>;
    const s = block.style as Record<string, any>;

    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        mins: 0,
        secs: 0,
    });
    const [expired, setExpired] = useState(false);

    useEffect(() => {
        if (!c.targetDate) return;
        const target = new Date(c.targetDate).getTime();

        function tick() {
            const diff = target - Date.now();
            if (diff <= 0) {
                setExpired(true);
                setTimeLeft({ days: 0, hours: 0, mins: 0, secs: 0 });
                return;
            }
            setExpired(false);
            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
            const mins = Math.floor((diff / (1000 * 60)) % 60);
            const secs = Math.floor((diff / 1000) % 60);
            setTimeLeft({ days, hours, mins, secs });
        }

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, [c.targetDate]);

    const base: React.CSSProperties = {
        backgroundColor: s.backgroundGradient
            ? undefined
            : s.backgroundColor || undefined,
        backgroundImage: s.backgroundGradient
            ? s.backgroundGradient
            : s.backgroundImage
              ? `url(${s.backgroundImage})`
              : undefined,
        backgroundSize:
            s.backgroundImage && !s.backgroundGradient
                ? s.backgroundSize || "cover"
                : undefined,
        backgroundPosition:
            s.backgroundImage && !s.backgroundGradient
                ? s.backgroundPosition || "center"
                : undefined,
        color: s.textColor || undefined,
        textAlign:
            (s.textAlign as React.CSSProperties["textAlign"]) || "center",
        ...buildPaddingStylePublic(s),
        marginTop: s.marginTop || undefined,
        marginBottom: s.marginBottom || undefined,
        borderRadius: s.borderRadius || undefined,
        borderWidth:
            s.borderStyle && s.borderStyle !== "none"
                ? s.borderWidth || "1px"
                : undefined,
        borderStyle:
            s.borderStyle && s.borderStyle !== "none"
                ? s.borderStyle
                : undefined,
        borderColor: s.borderColor || undefined,
        boxShadow: s.boxShadow || undefined,
        opacity: s.opacity ?? undefined,
        minHeight: s.minHeight || undefined,
        fontFamily: s.fontFamily || "inherit",
        fontSize: s.fontSize || undefined,
        fontWeight: s.fontWeight || undefined,
        lineHeight: s.lineHeight || undefined,
        letterSpacing: s.letterSpacing || undefined,
        maxWidth: s.maxWidth || "100%",
        width: "100%",
        boxSizing: "border-box" as const,
    };

    const units: [number, string][] = [
        [timeLeft.days, "Days"],
        [timeLeft.hours, "Hours"],
        [timeLeft.mins, "Mins"],
        [timeLeft.secs, "Secs"],
    ];

    return (
        <div
            style={{
                ...base,
                background:
                    s.backgroundGradient ||
                    s.backgroundColor ||
                    "linear-gradient(135deg, #8e78fb, #f65887)",
                color: s.textColor || "#fff",
            }}
        >
            <div style={{ maxWidth: "600px", margin: "0 auto" }}>
                <h2
                    style={{
                        fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                        fontWeight: 700,
                        marginBottom: "24px",
                        margin: "0 0 24px 0",
                    }}
                >
                    {c.headline || "Don't Miss Out!"}
                </h2>
                {expired ? (
                    <p style={{ fontSize: "1.25rem", opacity: 0.9 }}>
                        {c.expiredMessage || "This offer has expired."}
                    </p>
                ) : (
                    <div
                        style={{
                            display: "flex",
                            gap: "16px",
                            justifyContent: "center",
                        }}
                    >
                        {units.map(([v, l]) => (
                            <div key={l} style={{ textAlign: "center" }}>
                                <div
                                    style={{
                                        background: "rgba(255,255,255,0.2)",
                                        borderRadius: "12px",
                                        padding: "16px 20px",
                                        fontSize: "2rem",
                                        fontWeight: 800,
                                        minWidth: "64px",
                                    }}
                                >
                                    {String(v).padStart(2, "0")}
                                </div>
                                <div
                                    style={{
                                        fontSize: "11px",
                                        marginTop: "6px",
                                        opacity: 0.8,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.05em",
                                    }}
                                >
                                    {l}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {c.countdownLabel && (
                    <p
                        style={{
                            marginTop: "16px",
                            opacity: 0.85,
                            fontSize: "15px",
                        }}
                    >
                        {c.countdownLabel}
                    </p>
                )}
            </div>
        </div>
    );
}

/* ------------------------------------------------------------------ */
/*  Props                                                              */
/* ------------------------------------------------------------------ */
interface Props {
    blocks: PageBlock[];
    pageId: string;
}

/* ------------------------------------------------------------------ */
/*  PublicBlock – renders a single block by type                       */
/* ------------------------------------------------------------------ */
function PublicBlock({ block, pageId }: { block: PageBlock; pageId: string }) {
    const {
        content: c,
        style: s,
        type,
    } = block as {
        content: Record<string, any>;
        style: Record<string, any>;
        type: string;
    };

    const [formValues, setFormValues] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [formError, setFormError] = useState("");

    /* ---------- base style (BUG-001, 002, 003, 025) ---------- */
    const base: React.CSSProperties = {
        backgroundColor: s.backgroundGradient
            ? undefined
            : s.backgroundColor || undefined,
        backgroundImage: s.backgroundGradient
            ? s.backgroundGradient
            : s.backgroundImage
              ? `url(${s.backgroundImage})`
              : undefined,
        backgroundSize:
            s.backgroundImage && !s.backgroundGradient
                ? s.backgroundSize || "cover"
                : undefined,
        backgroundPosition:
            s.backgroundImage && !s.backgroundGradient
                ? s.backgroundPosition || "center"
                : undefined,
        color: s.textColor || undefined,
        textAlign:
            (s.textAlign as React.CSSProperties["textAlign"]) || "center",
        ...buildPaddingStylePublic(s),
        marginTop: s.marginTop || undefined,
        marginBottom: s.marginBottom || undefined,
        borderRadius: s.borderRadius || undefined,
        borderWidth:
            s.borderStyle && s.borderStyle !== "none"
                ? s.borderWidth || "1px"
                : undefined,
        borderStyle:
            s.borderStyle && s.borderStyle !== "none"
                ? s.borderStyle
                : undefined,
        borderColor: s.borderColor || undefined,
        boxShadow: s.boxShadow || undefined,
        opacity: s.opacity ?? undefined,
        minHeight: s.minHeight || undefined,
        fontFamily: s.fontFamily || "inherit",
        fontSize: s.fontSize || undefined,
        fontWeight: s.fontWeight || undefined,
        lineHeight: s.lineHeight || undefined,
        letterSpacing: s.letterSpacing || undefined,
        maxWidth: s.maxWidth || "100%",
        width: "100%",
        boxSizing: "border-box" as const,
    };

    if (block.visible === false) return null;

    switch (type) {
        /* ============================================================== */
        /*  HEADER (BUG-014: use logoUrl / logoText)                      */
        /* ============================================================== */
        case "header":
            return (
                <div
                    style={{
                        ...base,
                        padding:
                            s.paddingTop ||
                            s.paddingBottom ||
                            s.paddingLeft ||
                            s.paddingRight
                                ? undefined
                                : s.padding || "16px 24px",
                        ...(s.paddingTop ||
                        s.paddingBottom ||
                        s.paddingLeft ||
                        s.paddingRight
                            ? {}
                            : {}),
                        backgroundColor: s.backgroundGradient
                            ? undefined
                            : s.backgroundColor || "#ffffff",
                    }}
                >
                    <div
                        style={{
                            maxWidth: "1200px",
                            margin: "0 auto",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "8px",
                            }}
                        >
                            {c.logoUrl ? (
                                <img
                                    src={c.logoUrl}
                                    alt={c.logoText || "Logo"}
                                    style={{
                                        height: "32px",
                                        width: "auto",
                                        borderRadius: "8px",
                                        flexShrink: 0,
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "32px",
                                        height: "32px",
                                        borderRadius: "8px",
                                        background:
                                            "linear-gradient(135deg, #8e78fb, #f65887)",
                                        flexShrink: 0,
                                    }}
                                />
                            )}
                            <span style={{ fontWeight: 700, fontSize: "16px" }}>
                                {c.logoText || "Brand"}
                            </span>
                        </div>
                        <nav style={{ display: "flex", gap: "24px" }}>
                            {(c.navLinks || []).map((l: any, i: number) => (
                                <a
                                    key={i}
                                    href={l.url}
                                    style={{
                                        fontSize: "14px",
                                        textDecoration: "none",
                                        opacity: 0.8,
                                        color: "inherit",
                                    }}
                                >
                                    {l.label}
                                </a>
                            ))}
                        </nav>
                        {c.ctaText && (
                            <a
                                href={c.ctaUrl || "#"}
                                style={{
                                    background:
                                        "linear-gradient(135deg, #8e78fb, #f65887)",
                                    color: "#fff",
                                    padding: "8px 20px",
                                    borderRadius: "8px",
                                    textDecoration: "none",
                                    fontSize: "14px",
                                    fontWeight: 600,
                                }}
                            >
                                {c.ctaText}
                            </a>
                        )}
                    </div>
                </div>
            );

        /* ============================================================== */
        /*  HERO (BUG-020: read c.backgroundImageUrl)                     */
        /* ============================================================== */
        case "hero": {
            const heroBg: React.CSSProperties = {};
            if (s.backgroundGradient) {
                heroBg.background = s.backgroundGradient;
            } else if (c.backgroundImageUrl || s.backgroundImage) {
                heroBg.backgroundImage = `url(${c.backgroundImageUrl || s.backgroundImage})`;
                heroBg.backgroundSize = s.backgroundSize || "cover";
                heroBg.backgroundPosition = s.backgroundPosition || "center";
                heroBg.backgroundColor = s.backgroundColor || "#0f0a2e";
            } else {
                heroBg.background =
                    s.backgroundColor ||
                    "linear-gradient(135deg, #0f0a2e, #1a1a4e)";
            }

            return (
                <div
                    style={{
                        ...base,
                        ...heroBg,
                        color: s.textColor || "#ffffff",
                        textAlign:
                            (s.textAlign as React.CSSProperties["textAlign"]) ||
                            "center",
                    }}
                >
                    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                        <h1
                            style={{
                                fontSize: "clamp(2rem, 5vw, 3.5rem)",
                                fontWeight: 800,
                                marginBottom: "16px",
                                lineHeight: 1.2,
                                margin: "0 0 16px 0",
                            }}
                        >
                            {c.headline || "Welcome"}
                        </h1>
                        {c.subheadline && (
                            <p
                                style={{
                                    fontSize: "clamp(1rem, 2vw, 1.25rem)",
                                    opacity: 0.85,
                                    marginBottom: "32px",
                                    lineHeight: 1.6,
                                    margin: "0 0 32px 0",
                                }}
                            >
                                {c.subheadline}
                            </p>
                        )}
                        {c.ctaText && (
                            <a
                                href={c.ctaUrl || "#"}
                                style={{
                                    display: "inline-block",
                                    background:
                                        "linear-gradient(135deg, #8e78fb, #f65887)",
                                    color: "#fff",
                                    padding: "16px 40px",
                                    borderRadius: "12px",
                                    textDecoration: "none",
                                    fontSize: "16px",
                                    fontWeight: 700,
                                    boxShadow:
                                        "0 8px 32px rgba(142,120,251,0.4)",
                                }}
                            >
                                {c.ctaText}
                            </a>
                        )}
                    </div>
                </div>
            );
        }

        /* ============================================================== */
        /*  TEXT                                                           */
        /* ============================================================== */
        case "text":
            return (
                <div style={base}>
                    <div style={{ maxWidth: "800px", margin: "0 auto" }}>
                        {c.headline && (
                            <h2
                                style={{
                                    fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                                    fontWeight: 700,
                                    marginBottom: "16px",
                                    margin: "0 0 16px 0",
                                }}
                            >
                                {c.headline}
                            </h2>
                        )}
                        {c.body && (
                            <p
                                style={{
                                    fontSize: "16px",
                                    lineHeight: 1.8,
                                    opacity: 0.85,
                                    whiteSpace: "pre-wrap",
                                    margin: 0,
                                }}
                            >
                                {c.body}
                            </p>
                        )}
                    </div>
                </div>
            );

        /* ============================================================== */
        /*  IMAGE (BUG-021: imageSize & imageBorderRadius)                */
        /* ============================================================== */
        case "image": {
            const imgMaxWidth =
                c.imageSize === "full-width"
                    ? "100%"
                    : c.imageSize === "contained"
                      ? "600px"
                      : "900px";
            const imgBorderRadius =
                c.imageBorderRadius != null
                    ? `${c.imageBorderRadius}px`
                    : "12px";

            return (
                <div style={base}>
                    <div style={{ maxWidth: imgMaxWidth, margin: "0 auto" }}>
                        {c.imageUrl ? (
                            <img
                                src={c.imageUrl}
                                alt={c.imageAlt || ""}
                                style={{
                                    width: "100%",
                                    borderRadius: imgBorderRadius,
                                    display: "block",
                                }}
                            />
                        ) : (
                            <div
                                style={{
                                    aspectRatio: "16/9",
                                    background: "#f3f4f6",
                                    borderRadius: imgBorderRadius,
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#9ca3af",
                                    fontSize: "14px",
                                }}
                            >
                                No image
                            </div>
                        )}
                        {c.caption && (
                            <p
                                style={{
                                    textAlign: "center",
                                    fontSize: "14px",
                                    marginTop: "8px",
                                    opacity: 0.6,
                                }}
                            >
                                {c.caption}
                            </p>
                        )}
                    </div>
                </div>
            );
        }

        /* ============================================================== */
        /*  CTA                                                           */
        /* ============================================================== */
        case "cta":
            return (
                <div
                    style={{
                        ...base,
                        background:
                            s.backgroundGradient ||
                            s.backgroundColor ||
                            "#f8f7ff",
                    }}
                >
                    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
                        {c.headline && (
                            <h2
                                style={{
                                    fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                                    fontWeight: 700,
                                    marginBottom: "12px",
                                    margin: "0 0 12px 0",
                                }}
                            >
                                {c.headline}
                            </h2>
                        )}
                        {c.subheadline && (
                            <p
                                style={{
                                    fontSize: "16px",
                                    opacity: 0.75,
                                    marginBottom: "24px",
                                    margin: "0 0 24px 0",
                                }}
                            >
                                {c.subheadline}
                            </p>
                        )}
                        <div
                            style={{
                                display: "flex",
                                gap: "12px",
                                justifyContent: "center",
                                flexWrap: "wrap",
                            }}
                        >
                            {c.buttonText && (
                                <a
                                    href={c.buttonUrl || "#"}
                                    style={{
                                        background:
                                            "linear-gradient(135deg, #8e78fb, #f65887)",
                                        color: "#fff",
                                        padding: "14px 36px",
                                        borderRadius: "10px",
                                        textDecoration: "none",
                                        fontSize: "16px",
                                        fontWeight: 700,
                                    }}
                                >
                                    {c.buttonText}
                                </a>
                            )}
                            {c.secondaryButtonText && (
                                <a
                                    href={c.secondaryButtonUrl || "#"}
                                    style={{
                                        border: "2px solid currentColor",
                                        padding: "14px 36px",
                                        borderRadius: "10px",
                                        textDecoration: "none",
                                        fontSize: "16px",
                                        fontWeight: 600,
                                        opacity: 0.8,
                                        color: "inherit",
                                    }}
                                >
                                    {c.secondaryButtonText}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            );

        /* ============================================================== */
        /*  FEATURES (BUG-017: auto-fit grid)                             */
        /* ============================================================== */
        case "features":
            return (
                <div style={base}>
                    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                        {c.headline && (
                            <h2
                                style={{
                                    fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                                    fontWeight: 700,
                                    marginBottom: "8px",
                                    margin: "0 0 8px 0",
                                }}
                            >
                                {c.headline}
                            </h2>
                        )}
                        {c.subheadline && (
                            <p
                                style={{
                                    fontSize: "16px",
                                    opacity: 0.7,
                                    marginBottom: "40px",
                                    margin: "0 0 40px 0",
                                }}
                            >
                                {c.subheadline}
                            </p>
                        )}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(260px, 1fr))",
                                gap: "24px",
                            }}
                        >
                            {(c.features || []).map((f: any) => (
                                <div
                                    key={f.id}
                                    style={{
                                        background: "#fff",
                                        borderRadius: "12px",
                                        padding: "24px",
                                        textAlign: "center",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                    }}
                                >
                                    <div
                                        style={{
                                            width: "48px",
                                            height: "48px",
                                            borderRadius: "12px",
                                            background: "#f4f0ff",
                                            margin: "0 auto 12px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            fontSize: "24px",
                                        }}
                                    >
                                        {f.icon || "✦"}
                                    </div>
                                    <h3
                                        style={{
                                            fontWeight: 700,
                                            marginBottom: "8px",
                                            fontSize: "16px",
                                            margin: "0 0 8px 0",
                                        }}
                                    >
                                        {f.title}
                                    </h3>
                                    <p
                                        style={{
                                            fontSize: "14px",
                                            opacity: 0.7,
                                            lineHeight: 1.6,
                                            margin: 0,
                                        }}
                                    >
                                        {f.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        /* ============================================================== */
        /*  TESTIMONIALS (BUG-022: avatar vs avatarUrl)                   */
        /* ============================================================== */
        case "testimonials":
            return (
                <div style={base}>
                    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                        {c.headline && (
                            <h2
                                style={{
                                    fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                                    fontWeight: 700,
                                    marginBottom: "32px",
                                    margin: "0 0 32px 0",
                                }}
                            >
                                {c.headline}
                            </h2>
                        )}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(280px, 1fr))",
                                gap: "24px",
                            }}
                        >
                            {(c.testimonials || []).map((t: any) => {
                                const avatarSrc = t.avatarUrl || t.avatar;
                                return (
                                    <div
                                        key={t.id}
                                        style={{
                                            background: "#fff",
                                            borderRadius: "16px",
                                            padding: "24px",
                                            textAlign: "left",
                                            boxShadow:
                                                "0 4px 16px rgba(0,0,0,0.08)",
                                        }}
                                    >
                                        <div
                                            style={{
                                                display: "flex",
                                                gap: "2px",
                                                marginBottom: "12px",
                                            }}
                                        >
                                            {Array.from({
                                                length: t.rating || 5,
                                            }).map((_, i) => (
                                                <span
                                                    key={i}
                                                    style={{
                                                        color: "#f59e0b",
                                                        fontSize: "16px",
                                                    }}
                                                >
                                                    ★
                                                </span>
                                            ))}
                                        </div>
                                        <p
                                            style={{
                                                fontSize: "15px",
                                                lineHeight: 1.7,
                                                marginBottom: "16px",
                                                opacity: 0.85,
                                                margin: "0 0 16px 0",
                                            }}
                                        >
                                            &ldquo;{t.quote}&rdquo;
                                        </p>
                                        <div
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "10px",
                                            }}
                                        >
                                            {avatarSrc ? (
                                                <img
                                                    src={avatarSrc}
                                                    alt={t.name || ""}
                                                    style={{
                                                        width: "36px",
                                                        height: "36px",
                                                        borderRadius: "50%",
                                                        objectFit: "cover",
                                                        flexShrink: 0,
                                                    }}
                                                />
                                            ) : (
                                                <div
                                                    style={{
                                                        width: "36px",
                                                        height: "36px",
                                                        borderRadius: "50%",
                                                        background:
                                                            "linear-gradient(135deg, #8e78fb, #f65887)",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        justifyContent:
                                                            "center",
                                                        color: "#fff",
                                                        fontWeight: 700,
                                                        fontSize: "14px",
                                                        flexShrink: 0,
                                                    }}
                                                >
                                                    {t.name?.charAt(0) ?? "?"}
                                                </div>
                                            )}
                                            <div>
                                                <p
                                                    style={{
                                                        fontWeight: 700,
                                                        fontSize: "14px",
                                                        margin: 0,
                                                    }}
                                                >
                                                    {t.name}
                                                </p>
                                                {t.role && (
                                                    <p
                                                        style={{
                                                            fontSize: "12px",
                                                            opacity: 0.6,
                                                            margin: 0,
                                                        }}
                                                    >
                                                        {t.role}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            );

        /* ============================================================== */
        /*  PRICING                                                       */
        /* ============================================================== */
        case "pricing":
            return (
                <div style={base}>
                    <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
                        {c.headline && (
                            <h2
                                style={{
                                    fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                                    fontWeight: 700,
                                    marginBottom: "8px",
                                    margin: "0 0 8px 0",
                                }}
                            >
                                {c.headline}
                            </h2>
                        )}
                        {c.subheadline && (
                            <p
                                style={{
                                    fontSize: "16px",
                                    opacity: 0.7,
                                    marginBottom: "40px",
                                    margin: "0 0 40px 0",
                                }}
                            >
                                {c.subheadline}
                            </p>
                        )}
                        <div
                            style={{
                                display: "grid",
                                gridTemplateColumns:
                                    "repeat(auto-fit, minmax(260px, 1fr))",
                                gap: "24px",
                            }}
                        >
                            {(c.pricingPlans || []).map((plan: any) => (
                                <div
                                    key={plan.id}
                                    style={{
                                        background: "#fff",
                                        borderRadius: "16px",
                                        padding: "32px",
                                        textAlign: "left",
                                        border: plan.highlighted
                                            ? "2px solid #8e78fb"
                                            : "2px solid #e5e7eb",
                                        boxShadow: plan.highlighted
                                            ? "0 8px 32px rgba(142,120,251,0.2)"
                                            : "0 2px 8px rgba(0,0,0,0.06)",
                                    }}
                                >
                                    {plan.highlighted && (
                                        <span
                                            style={{
                                                background: "#f4f0ff",
                                                color: "#8e78fb",
                                                padding: "4px 12px",
                                                borderRadius: "100px",
                                                fontSize: "12px",
                                                fontWeight: 700,
                                            }}
                                        >
                                            Most Popular
                                        </span>
                                    )}
                                    <h3
                                        style={{
                                            fontWeight: 700,
                                            marginTop: "12px",
                                            marginBottom: "4px",
                                            fontSize: "18px",
                                        }}
                                    >
                                        {plan.name}
                                    </h3>
                                    <div style={{ marginBottom: "16px" }}>
                                        <span
                                            style={{
                                                fontSize: "2rem",
                                                fontWeight: 800,
                                            }}
                                        >
                                            {plan.price}
                                        </span>
                                        <span
                                            style={{
                                                opacity: 0.6,
                                                fontSize: "14px",
                                            }}
                                        >
                                            {plan.period}
                                        </span>
                                    </div>
                                    <ul
                                        style={{
                                            listStyle: "none",
                                            padding: 0,
                                            margin: "0 0 24px 0",
                                        }}
                                    >
                                        {(plan.features || []).map(
                                            (feat: string, i: number) => (
                                                <li
                                                    key={i}
                                                    style={{
                                                        padding: "4px 0",
                                                        fontSize: "14px",
                                                        display: "flex",
                                                        gap: "8px",
                                                        alignItems:
                                                            "flex-start",
                                                    }}
                                                >
                                                    <span
                                                        style={{
                                                            color: "#10b981",
                                                            flexShrink: 0,
                                                        }}
                                                    >
                                                        ✓
                                                    </span>
                                                    {feat}
                                                </li>
                                            ),
                                        )}
                                    </ul>
                                    <a
                                        href={plan.ctaUrl || "#"}
                                        style={{
                                            display: "block",
                                            textAlign: "center",
                                            background: plan.highlighted
                                                ? "linear-gradient(135deg, #8e78fb, #f65887)"
                                                : "#f3f4f6",
                                            color: plan.highlighted
                                                ? "#fff"
                                                : "#374151",
                                            padding: "12px",
                                            borderRadius: "10px",
                                            textDecoration: "none",
                                            fontWeight: 700,
                                            fontSize: "15px",
                                        }}
                                    >
                                        {plan.ctaText || "Get Started"}
                                    </a>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            );

        /* ============================================================== */
        /*  FAQ                                                           */
        /* ============================================================== */
        case "faq":
            return (
                <div style={base}>
                    <div style={{ maxWidth: "700px", margin: "0 auto" }}>
                        {c.headline && (
                            <h2
                                style={{
                                    fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                                    fontWeight: 700,
                                    marginBottom: "32px",
                                    margin: "0 0 32px 0",
                                }}
                            >
                                {c.headline}
                            </h2>
                        )}
                        <div
                            style={{
                                display: "flex",
                                flexDirection: "column",
                                gap: "12px",
                            }}
                        >
                            {(c.faqs || []).map((faq: any) => (
                                <details
                                    key={faq.id}
                                    style={{
                                        background: "#fff",
                                        borderRadius: "12px",
                                        padding: "20px",
                                        textAlign: "left",
                                        boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                                        cursor: "pointer",
                                    }}
                                >
                                    <summary
                                        style={{
                                            fontWeight: 700,
                                            fontSize: "15px",
                                            listStyle: "none",
                                            userSelect: "none",
                                        }}
                                    >
                                        {faq.question}
                                    </summary>
                                    <p
                                        style={{
                                            marginTop: "12px",
                                            fontSize: "14px",
                                            lineHeight: 1.7,
                                            opacity: 0.8,
                                            margin: "12px 0 0 0",
                                        }}
                                    >
                                        {faq.answer}
                                    </p>
                                </details>
                            ))}
                        </div>
                    </div>
                </div>
            );

        /* ============================================================== */
        /*  VIDEO (BUG-016: toEmbedUrl helper)                            */
        /* ============================================================== */
        case "video":
            return (
                <div
                    style={{
                        ...base,
                        background:
                            s.backgroundGradient ||
                            s.backgroundColor ||
                            "#0f0a2e",
                        color: s.textColor || "#fff",
                    }}
                >
                    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
                        {c.headline && (
                            <h2
                                style={{
                                    fontSize: "clamp(1.5rem, 3vw, 2.5rem)",
                                    fontWeight: 700,
                                    marginBottom: "24px",
                                    margin: "0 0 24px 0",
                                }}
                            >
                                {c.headline}
                            </h2>
                        )}
                        {c.videoUrl ? (
                            <div
                                style={{
                                    position: "relative",
                                    paddingBottom: "56.25%",
                                    height: 0,
                                    borderRadius: "12px",
                                    overflow: "hidden",
                                }}
                            >
                                <iframe
                                    src={toEmbedUrl(c.videoUrl)}
                                    style={{
                                        position: "absolute",
                                        inset: 0,
                                        width: "100%",
                                        height: "100%",
                                        border: "none",
                                    }}
                                    allowFullScreen
                                    title={c.headline || "Video"}
                                />
                            </div>
                        ) : (
                            <div
                                style={{
                                    aspectRatio: "16/9",
                                    background: "rgba(255,255,255,0.1)",
                                    borderRadius: "12px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    fontSize: "64px",
                                }}
                            >
                                ▶
                            </div>
                        )}
                        {c.videoCaption && (
                            <p
                                style={{
                                    textAlign: "center",
                                    fontSize: "14px",
                                    marginTop: "12px",
                                    opacity: 0.7,
                                }}
                            >
                                {c.videoCaption}
                            </p>
                        )}
                    </div>
                </div>
            );

        /* ============================================================== */
        /*  COUNTDOWN (BUG-010: delegate to CountdownBlock sub-component) */
        /* ============================================================== */
        case "countdown":
            return <CountdownBlock block={block} />;

        /* ============================================================== */
        /*  SOCIAL PROOF (BUG-017: auto-fit grid, BUG-019: logos)         */
        /* ============================================================== */
        case "social-proof":
            return (
                <div style={base}>
                    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
                        {c.headline && (
                            <h2
                                style={{
                                    fontSize: "1.8rem",
                                    fontWeight: 700,
                                    marginBottom: "32px",
                                    margin: "0 0 32px 0",
                                }}
                            >
                                {c.headline}
                            </h2>
                        )}
                        {(c.stats || []).length > 0 && (
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns:
                                        "repeat(auto-fit, minmax(140px, 1fr))",
                                    gap: "24px",
                                    marginBottom:
                                        (c.logos || []).length > 0
                                            ? "40px"
                                            : undefined,
                                }}
                            >
                                {(c.stats as any[]).map((st: any) => (
                                    <div
                                        key={st.id}
                                        style={{ textAlign: "center" }}
                                    >
                                        <div
                                            style={{
                                                fontSize: "2.5rem",
                                                fontWeight: 800,
                                                color: "#8e78fb",
                                                lineHeight: 1.1,
                                            }}
                                        >
                                            {st.value}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: "14px",
                                                opacity: 0.7,
                                                marginTop: "4px",
                                            }}
                                        >
                                            {st.label}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                        {/* BUG-019: render logos */}
                        {(c.logos || []).length > 0 && (
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    gap: "24px",
                                    justifyContent: "center",
                                    alignItems: "center",
                                }}
                            >
                                {(c.logos as any[]).map((logo: any) => (
                                    <img
                                        key={logo.id}
                                        src={logo.imageUrl}
                                        alt={logo.alt || ""}
                                        style={{
                                            height: "40px",
                                            width: "auto",
                                            objectFit: "contain",
                                            opacity: 0.7,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            );

        /* ============================================================== */
        /*  DIVIDER (BUG-013: dividerStyle, dividerColor, dividerThickness)*/
        /* ============================================================== */
        case "divider": {
            const dColor = c.dividerColor || "#e5e7eb";
            const dThickness = c.dividerThickness
                ? `${c.dividerThickness}px`
                : "1px";
            const dStyle = c.dividerStyle || "line";

            let dividerContent: React.ReactNode = null;

            if (dStyle === "dots") {
                dividerContent = (
                    <div
                        style={{
                            maxWidth: "1000px",
                            margin: "0 auto",
                            textAlign: "center",
                            letterSpacing: "8px",
                            color: dColor,
                            fontSize: `${Math.max(parseInt(dThickness) * 4, 12)}px`,
                        }}
                    >
                        ● ● ● ● ● ● ●
                    </div>
                );
            } else if (dStyle === "gradient") {
                dividerContent = (
                    <div
                        style={{
                            maxWidth: "1000px",
                            margin: "0 auto",
                            height: dThickness,
                            background: `linear-gradient(90deg, transparent, ${dColor}, transparent)`,
                            borderRadius: "999px",
                        }}
                    />
                );
            } else if (dStyle === "zigzag") {
                dividerContent = (
                    <div
                        style={{
                            maxWidth: "1000px",
                            margin: "0 auto",
                            textAlign: "center",
                            color: dColor,
                            fontSize: `${Math.max(parseInt(dThickness) * 3, 12)}px`,
                            lineHeight: 1,
                            overflow: "hidden",
                            whiteSpace: "nowrap",
                        }}
                    >
                        {"∿".repeat(80)}
                    </div>
                );
            } else {
                // default "line"
                dividerContent = (
                    <hr
                        style={{
                            border: "none",
                            borderTop: `${dThickness} solid ${dColor}`,
                            maxWidth: "1000px",
                            margin: "0 auto",
                        }}
                    />
                );
            }

            return (
                <div
                    style={{
                        ...base,
                        padding:
                            s.paddingTop ||
                            s.paddingBottom ||
                            s.paddingLeft ||
                            s.paddingRight
                                ? undefined
                                : s.padding || "16px 24px",
                    }}
                >
                    {dividerContent}
                </div>
            );
        }

        /* ============================================================== */
        /*  FORM (BUG-018: select & checkbox support)                     */
        /* ============================================================== */
        case "form": {
            if (isSuccess) {
                return (
                    <div style={base}>
                        <div
                            style={{
                                maxWidth: "500px",
                                margin: "0 auto",
                                background: "#fff",
                                borderRadius: "16px",
                                padding: "40px",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                                textAlign: "center",
                            }}
                        >
                            <div
                                style={{
                                    fontSize: "48px",
                                    marginBottom: "16px",
                                }}
                            >
                                ✅
                            </div>
                            <h3
                                style={{
                                    fontWeight: 700,
                                    marginBottom: "8px",
                                    fontSize: "20px",
                                    margin: "0 0 8px 0",
                                }}
                            >
                                {c.formSuccessMessage || "Thank you!"}
                            </h3>
                            <p
                                style={{
                                    opacity: 0.7,
                                    margin: 0,
                                    fontSize: "15px",
                                }}
                            >
                                Your information has been submitted
                                successfully.
                            </p>
                        </div>
                    </div>
                );
            }

            return (
                <div style={base}>
                    <div style={{ maxWidth: "500px", margin: "0 auto" }}>
                        {c.headline && (
                            <h2
                                style={{
                                    fontSize: "2rem",
                                    fontWeight: 700,
                                    marginBottom: "8px",
                                    margin: "0 0 8px 0",
                                }}
                            >
                                {c.headline}
                            </h2>
                        )}
                        {c.subheadline && (
                            <p
                                style={{
                                    opacity: 0.75,
                                    marginBottom: "24px",
                                    margin: "0 0 24px 0",
                                    fontSize: "15px",
                                }}
                            >
                                {c.subheadline}
                            </p>
                        )}
                        <form
                            onSubmit={async (e: FormEvent) => {
                                e.preventDefault();
                                setIsSubmitting(true);
                                setFormError("");
                                try {
                                    await landingPagesApi.submitLead(pageId, {
                                        email: formValues["email"],
                                        name: formValues["name"],
                                        phone: formValues["phone"],
                                        data: formValues,
                                        source:
                                            typeof document !== "undefined"
                                                ? document.referrer || undefined
                                                : undefined,
                                    });
                                    setIsSuccess(true);
                                } catch {
                                    setFormError(
                                        "Submission failed. Please try again.",
                                    );
                                } finally {
                                    setIsSubmitting(false);
                                }
                            }}
                            style={{
                                background: "#fff",
                                borderRadius: "16px",
                                padding: "32px",
                                boxShadow: "0 4px 16px rgba(0,0,0,0.08)",
                            }}
                        >
                            {(c.formFields || []).map((f: any) => (
                                <div
                                    key={f.id}
                                    style={{
                                        marginBottom: "16px",
                                        textAlign: "left",
                                    }}
                                >
                                    {f.type === "checkbox" ? (
                                        /* ---- CHECKBOX (BUG-018) ---- */
                                        <label
                                            style={{
                                                display: "flex",
                                                alignItems: "center",
                                                gap: "8px",
                                                fontSize: "14px",
                                                fontWeight: 500,
                                                cursor: "pointer",
                                            }}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={
                                                    formValues[f.id] === "true"
                                                }
                                                onChange={(e) =>
                                                    setFormValues((p) => ({
                                                        ...p,
                                                        [f.id]: e.target.checked
                                                            ? "true"
                                                            : "false",
                                                    }))
                                                }
                                                required={f.required}
                                                style={{
                                                    width: "18px",
                                                    height: "18px",
                                                    accentColor: "#8e78fb",
                                                }}
                                            />
                                            {f.label}
                                            {f.required && (
                                                <span
                                                    style={{ color: "#ef4444" }}
                                                >
                                                    {" "}
                                                    *
                                                </span>
                                            )}
                                        </label>
                                    ) : (
                                        <>
                                            <label
                                                style={{
                                                    display: "block",
                                                    fontSize: "14px",
                                                    fontWeight: 600,
                                                    marginBottom: "6px",
                                                }}
                                            >
                                                {f.label}
                                                {f.required && (
                                                    <span
                                                        style={{
                                                            color: "#ef4444",
                                                        }}
                                                    >
                                                        {" "}
                                                        *
                                                    </span>
                                                )}
                                            </label>
                                            {f.type === "textarea" ? (
                                                <textarea
                                                    value={
                                                        formValues[f.id] || ""
                                                    }
                                                    onChange={(e) =>
                                                        setFormValues((p) => ({
                                                            ...p,
                                                            [f.id]: e.target
                                                                .value,
                                                        }))
                                                    }
                                                    placeholder={f.placeholder}
                                                    required={f.required}
                                                    rows={3}
                                                    style={{
                                                        width: "100%",
                                                        padding: "10px 12px",
                                                        borderRadius: "8px",
                                                        border: "1px solid #e5e7eb",
                                                        fontSize: "14px",
                                                        resize: "vertical",
                                                        boxSizing: "border-box",
                                                        fontFamily: "inherit",
                                                    }}
                                                />
                                            ) : f.type === "select" ? (
                                                /* ---- SELECT (BUG-018) ---- */
                                                <select
                                                    value={
                                                        formValues[f.id] || ""
                                                    }
                                                    onChange={(e) =>
                                                        setFormValues((p) => ({
                                                            ...p,
                                                            [f.id]: e.target
                                                                .value,
                                                        }))
                                                    }
                                                    required={f.required}
                                                    style={{
                                                        width: "100%",
                                                        padding: "10px 12px",
                                                        borderRadius: "8px",
                                                        border: "1px solid #e5e7eb",
                                                        fontSize: "14px",
                                                        boxSizing: "border-box",
                                                        fontFamily: "inherit",
                                                        background: "#fff",
                                                    }}
                                                >
                                                    <option value="">
                                                        {f.placeholder ||
                                                            "Select..."}
                                                    </option>
                                                    {(f.options || []).map(
                                                        (
                                                            opt: string,
                                                            oi: number,
                                                        ) => (
                                                            <option
                                                                key={oi}
                                                                value={opt}
                                                            >
                                                                {opt}
                                                            </option>
                                                        ),
                                                    )}
                                                </select>
                                            ) : (
                                                <input
                                                    type={
                                                        f.type === "email"
                                                            ? "email"
                                                            : f.type === "phone"
                                                              ? "tel"
                                                              : "text"
                                                    }
                                                    value={
                                                        formValues[f.id] || ""
                                                    }
                                                    onChange={(e) =>
                                                        setFormValues((p) => ({
                                                            ...p,
                                                            [f.id]: e.target
                                                                .value,
                                                        }))
                                                    }
                                                    placeholder={f.placeholder}
                                                    required={f.required}
                                                    style={{
                                                        width: "100%",
                                                        padding: "10px 12px",
                                                        borderRadius: "8px",
                                                        border: "1px solid #e5e7eb",
                                                        fontSize: "14px",
                                                        boxSizing: "border-box",
                                                        fontFamily: "inherit",
                                                    }}
                                                />
                                            )}
                                        </>
                                    )}
                                </div>
                            ))}
                            {formError && (
                                <p
                                    style={{
                                        color: "#ef4444",
                                        fontSize: "14px",
                                        marginBottom: "12px",
                                        margin: "0 0 12px 0",
                                    }}
                                >
                                    {formError}
                                </p>
                            )}
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                style={{
                                    width: "100%",
                                    background:
                                        "linear-gradient(135deg, #8e78fb, #f65887)",
                                    color: "#fff",
                                    padding: "14px",
                                    borderRadius: "10px",
                                    border: "none",
                                    fontSize: "16px",
                                    fontWeight: 700,
                                    cursor: isSubmitting
                                        ? "not-allowed"
                                        : "pointer",
                                    opacity: isSubmitting ? 0.7 : 1,
                                    fontFamily: "inherit",
                                }}
                            >
                                {isSubmitting
                                    ? "Submitting…"
                                    : c.formSubmitText || "Submit"}
                            </button>
                        </form>
                    </div>
                </div>
            );
        }

        /* ============================================================== */
        /*  FOOTER (BUG-014: use logoUrl / logoText)                      */
        /* ============================================================== */
        case "footer":
            return (
                <div
                    style={{
                        ...base,
                        background:
                            s.backgroundGradient ||
                            s.backgroundColor ||
                            "#0f0a2e",
                        color: s.textColor || "#a0a0b8",
                    }}
                >
                    <div
                        style={{
                            maxWidth: "1000px",
                            margin: "0 auto",
                            textAlign: "center",
                        }}
                    >
                        <div
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "8px",
                                marginBottom: "16px",
                            }}
                        >
                            {c.logoUrl ? (
                                <img
                                    src={c.logoUrl}
                                    alt={c.logoText || "Logo"}
                                    style={{
                                        height: "24px",
                                        width: "auto",
                                        borderRadius: "6px",
                                        flexShrink: 0,
                                    }}
                                />
                            ) : (
                                <div
                                    style={{
                                        width: "24px",
                                        height: "24px",
                                        borderRadius: "6px",
                                        background:
                                            "linear-gradient(135deg, #8e78fb, #f65887)",
                                        flexShrink: 0,
                                    }}
                                />
                            )}
                            <span
                                style={{
                                    fontWeight: 700,
                                    color: "#fff",
                                    fontSize: "15px",
                                }}
                            >
                                {c.logoText || "Brand"}
                            </span>
                        </div>
                        <div
                            style={{
                                display: "flex",
                                flexWrap: "wrap",
                                gap: "24px",
                                justifyContent: "center",
                                marginBottom: "16px",
                            }}
                        >
                            {(c.navLinks || []).map((l: any, i: number) => (
                                <a
                                    key={i}
                                    href={l.url}
                                    style={{
                                        fontSize: "13px",
                                        opacity: 0.6,
                                        textDecoration: "none",
                                        color: "inherit",
                                    }}
                                >
                                    {l.label}
                                </a>
                            ))}
                        </div>
                        {(c.socialLinks || []).length > 0 && (
                            <div
                                style={{
                                    display: "flex",
                                    gap: "16px",
                                    justifyContent: "center",
                                    marginBottom: "16px",
                                }}
                            >
                                {(c.socialLinks as any[]).map(
                                    (sl: any, i: number) => (
                                        <a
                                            key={i}
                                            href={sl.url}
                                            style={{
                                                fontSize: "13px",
                                                opacity: 0.6,
                                                textDecoration: "none",
                                                color: "inherit",
                                            }}
                                        >
                                            {sl.platform}
                                        </a>
                                    ),
                                )}
                            </div>
                        )}
                        <p
                            style={{
                                fontSize: "12px",
                                opacity: 0.4,
                                margin: 0,
                            }}
                        >
                            {c.copyrightText || "© 2025. All rights reserved."}
                        </p>
                    </div>
                </div>
            );

        default:
            return null;
    }
}

/* ==================================================================== */
/*  PublicBlockRenderer – wraps each block with visibility / animation   */
/*  BUG-007: hideOnMobile / hideOnDesktop                               */
/*  BUG-008: customClassName                                            */
/*  BUG-015: animationEffect                                            */
/* ==================================================================== */
export default function PublicBlockRenderer({ blocks, pageId }: Props) {
    return (
        <div style={{ width: "100%", minHeight: "100vh" }}>
            {blocks
                .filter((b) => b.visible !== false)
                .map((block) => {
                    const s = block.style || ({} as Record<string, any>);

                    const wrapperClasses: string[] = [];
                    if (s.hideOnMobile) wrapperClasses.push("hide-on-mobile");
                    if (s.hideOnDesktop) wrapperClasses.push("hide-on-desktop");
                    if (s.animationEffect && s.animationEffect !== "none") {
                        wrapperClasses.push(`anim-${s.animationEffect}`);
                    }
                    if (s.customClassName)
                        wrapperClasses.push(s.customClassName);

                    return (
                        <div
                            key={block.id}
                            className={
                                wrapperClasses.length > 0
                                    ? wrapperClasses.join(" ")
                                    : undefined
                            }
                        >
                            <PublicBlock block={block} pageId={pageId} />
                        </div>
                    );
                })}
        </div>
    );
}
