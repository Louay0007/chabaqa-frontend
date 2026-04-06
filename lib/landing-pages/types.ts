// Block types for the page builder
export type BlockType =
    | "hero"
    | "text"
    | "image"
    | "cta"
    | "testimonials"
    | "features"
    | "pricing"
    | "faq"
    | "form"
    | "video"
    | "countdown"
    | "divider"
    | "social-proof"
    | "header"
    | "footer"
    | "community-join"
    | "community-content-preview"
    | "community-stats";

export interface BlockStyle {
    backgroundColor?: string;
    textColor?: string;
    padding?: string;
    margin?: string;
    borderRadius?: string;
    backgroundImage?: string;
    backgroundGradient?: string;
    textAlign?: "left" | "center" | "right";
    maxWidth?: string;
    fontFamily?: string;

    // Typography
    fontSize?: string;
    fontWeight?: string;
    lineHeight?: string;
    letterSpacing?: string;

    // Border
    borderWidth?: string;
    borderColor?: string;
    borderStyle?: "none" | "solid" | "dashed" | "dotted";

    // Effects
    boxShadow?: string;
    opacity?: number;

    // Individual padding/margin
    paddingTop?: string;
    paddingBottom?: string;
    paddingLeft?: string;
    paddingRight?: string;
    marginTop?: string;
    marginBottom?: string;

    // Background
    backgroundSize?: "cover" | "contain" | "auto";
    backgroundPosition?: string;
    minHeight?: string;

    // Responsive & Animation
    customClassName?: string;
    hideOnMobile?: boolean;
    hideOnDesktop?: boolean;
    animationEffect?:
        | "none"
        | "fadeIn"
        | "slideUp"
        | "slideLeft"
        | "slideRight"
        | "scaleIn"
        | "bounce";
}

export interface BlockContent {
    // Hero
    headline?: string;
    subheadline?: string;
    ctaText?: string;
    ctaUrl?: string;
    ctaVariant?: "primary" | "secondary" | "outline";
    backgroundImageUrl?: string;

    // Text
    body?: string;

    // Image
    imageUrl?: string;
    imageAlt?: string;
    caption?: string;
    imageSize?: "auto" | "full-width" | "contained";
    imageBorderRadius?: number;

    // CTA
    buttonText?: string;
    buttonUrl?: string;
    buttonVariant?: "primary" | "secondary" | "outline" | "gradient";
    secondaryButtonText?: string;
    secondaryButtonUrl?: string;

    // Testimonials
    testimonials?: Array<{
        id: string;
        name: string;
        role?: string;
        avatar?: string;
        avatarUrl?: string;
        quote: string;
        rating?: number;
    }>;

    // Features
    features?: Array<{
        id: string;
        icon?: string;
        title: string;
        description: string;
    }>;
    columns?: 2 | 3 | 4;

    // Pricing
    pricingPlans?: Array<{
        id: string;
        name: string;
        price: string;
        period?: string;
        features: string[];
        highlighted?: boolean;
        ctaText?: string;
        ctaUrl?: string;
    }>;

    // FAQ
    faqs?: Array<{
        id: string;
        question: string;
        answer: string;
    }>;

    // Form
    formFields?: Array<{
        id: string;
        type: "text" | "email" | "phone" | "textarea" | "select" | "checkbox";
        label: string;
        placeholder?: string;
        required?: boolean;
        options?: string[]; // for select
    }>;
    formSubmitText?: string;
    formSuccessMessage?: string;
    formRedirectUrl?: string;

    // Video
    videoUrl?: string;
    videoThumbnail?: string;
    autoplay?: boolean;
    videoCaption?: string;

    // Countdown
    targetDate?: string;
    countdownLabel?: string;
    expiredMessage?: string;

    // Social proof
    stats?: Array<{
        id: string;
        value: string;
        label: string;
    }>;
    logos?: Array<{
        id: string;
        imageUrl: string;
        alt: string;
    }>;
    // Header/Footer
    logoUrl?: string;
    logoText?: string;
    headerStyle?: "transparent" | "solid" | "gradient";
    navLinks?: Array<{ label: string; url: string }>;
    socialLinks?: Array<{ platform: string; url: string }>;
    copyrightText?: string;
    footerColumns?: Array<{
        title: string;
        links: Array<{ label: string; url: string }>;
    }>;

    // Pricing enhancements
    pricingHeadline?: string;
    pricingSubheadline?: string;

    // Divider
    dividerStyle?: "line" | "dots" | "gradient" | "zigzag";
    dividerThickness?: number;
    dividerColor?: string;

    // Community-specific block content
    communityId?: string;
    communitySlug?: string;
    communityName?: string;
    showPricing?: boolean;
    showMemberCount?: boolean;
    showRating?: boolean;
    showCreatorInfo?: boolean;
    previewCount?: number;
    previewTypes?: string[]; // e.g. ['posts', 'courses', 'events']
    statsLayout?: "horizontal" | "vertical" | "grid";
}

export interface PageBlock {
    id: string;
    type: BlockType;
    content: BlockContent;
    style: BlockStyle;
    visible: boolean;
    locked?: boolean;
}

export type PageStatus = "draft" | "published" | "archived";

export interface PageSEO {
    title?: string;
    description?: string;
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
    keywords?: string[];
    noIndex?: boolean;
}

export interface LandingPage {
    id: string;
    title: string;
    slug: string;
    description?: string;
    status: PageStatus;
    blocks: PageBlock[];
    seo: PageSEO;
    customDomain?: string;
    favicon?: string;
    analytics?: PageAnalytics;
    createdAt: string;
    updatedAt: string;
    publishedAt?: string;
    settings?: {
        passwordProtected?: boolean;
        password?: string;
        trackingPixels?: { meta?: string; google?: string };
    };
    thumbnail?: string;
    communityId?: string;
    communityName?: string;
    communitySlug?: string;
    pageType?: "standalone" | "community-home" | "funnel-step";
    isPrimaryHome?: boolean;
}

export interface PageAnalytics {
    views: number;
    uniqueVisitors: number;
    conversions: number;
    conversionRate: number;
    avgTimeOnPage: number;
    bounceRate: number;
    topReferrers?: Array<{ source: string; count: number }>;
    dailyViews?: Array<{ date: string; views: number; conversions: number }>;
}

export interface PageLead {
    id: string;
    pageId: string;
    email: string;
    name?: string;
    phone?: string;
    data: Record<string, unknown>;
    score?: number;
    source?: string;
    createdAt: string;
}

// ---------------------------------------------------------------------------
// Funnel types
// ---------------------------------------------------------------------------

export type FunnelStepType =
    | "landing"
    | "checkout"
    | "upsell"
    | "downsell"
    | "thank-you"
    | "webinar"
    | "opt-in";

export interface FunnelStep {
    id: string;
    type: FunnelStepType;
    title: string;
    pageId?: string;
    order: number;
    conversionRate?: number;
    visitors?: number;
    conversions?: number;
}

export interface FunnelConnection {
    id: string;
    fromStepId: string;
    toStepId: string;
    condition?: string;
    label?: string;
}

export type FunnelStatus = "draft" | "active" | "paused" | "archived";

export interface Funnel {
    id: string;
    name: string;
    description?: string;
    status: FunnelStatus;
    steps: FunnelStep[];
    connections: FunnelConnection[];
    analytics?: FunnelAnalytics;
    createdAt: string;
    updatedAt: string;
}

export interface FunnelAnalytics {
    totalVisitors: number;
    totalConversions: number;
    overallConversionRate: number;
    revenue: number;
    avgTimeToConvert: number;
    stepMetrics: Array<{
        stepId: string;
        visitors: number;
        conversions: number;
        dropOff: number;
        conversionRate: number;
    }>;
}

// ---------------------------------------------------------------------------
// Template types
// ---------------------------------------------------------------------------

export type TemplateCategory =
    | "sales"
    | "lead-capture"
    | "events"
    | "arabic"
    | "business"
    | "webinar"
    | "course";

export interface PageTemplate {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    thumbnail: string;
    blocks: PageBlock[];
    popularity: number;
    rating: number;
    usageCount: number;
}

// ---------------------------------------------------------------------------
// Editor state
// ---------------------------------------------------------------------------

export type DevicePreview = "desktop" | "tablet" | "mobile";

export type RightPanelTab = "content" | "style" | "advanced" | null;

export interface EditorState {
    selectedBlockId: string | null;
    hoveredBlockId: string | null;
    devicePreview: DevicePreview;
    zoom: number;
    showGrid: boolean;
    isDragging: boolean;
    undoStack: PageBlock[][];
    redoStack: PageBlock[][];
    rightPanel: RightPanelTab;
    leftPanelOpen: boolean;
    isSaving: boolean;
    lastSavedAt: string | null;
    hasUnsavedChanges: boolean;
}

// ---------------------------------------------------------------------------
// AI suggestions
// ---------------------------------------------------------------------------

export type AISuggestionType = "copy" | "color" | "layout" | "block" | "seo";
export type AISuggestionImpact = "low" | "medium" | "high";

export interface AIPageSuggestion {
    type: AISuggestionType;
    title: string;
    description: string;
    impact: AISuggestionImpact;
    action?: () => void;
}
