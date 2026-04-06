import type { BlockType, PageBlock, BlockContent, BlockStyle } from "./types";

/**
 * Generate a unique block ID
 */
function generateBlockId(): string {
    return `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Default styles for each block type
 */
const defaultStyles: Record<BlockType, BlockStyle> = {
    hero: {
        backgroundColor: "#0f0a2e",
        textColor: "#ffffff",
        padding: "80px 24px",
        textAlign: "center",
        maxWidth: "1200px",
        borderRadius: "0px",
    },
    text: {
        backgroundColor: "#ffffff",
        textColor: "#1a1a2e",
        padding: "48px 24px",
        textAlign: "left",
        maxWidth: "800px",
    },
    image: {
        backgroundColor: "#ffffff",
        padding: "32px 24px",
        textAlign: "center",
        maxWidth: "1000px",
    },
    cta: {
        backgroundColor: "#f8f7ff",
        textColor: "#1a1a2e",
        padding: "64px 24px",
        textAlign: "center",
        maxWidth: "800px",
        borderRadius: "0px",
    },
    testimonials: {
        backgroundColor: "#fafafa",
        textColor: "#1a1a2e",
        padding: "64px 24px",
        textAlign: "center",
        maxWidth: "1200px",
    },
    features: {
        backgroundColor: "#ffffff",
        textColor: "#1a1a2e",
        padding: "64px 24px",
        textAlign: "center",
        maxWidth: "1200px",
    },
    pricing: {
        backgroundColor: "#f8f7ff",
        textColor: "#1a1a2e",
        padding: "64px 24px",
        textAlign: "center",
        maxWidth: "1200px",
    },
    faq: {
        backgroundColor: "#ffffff",
        textColor: "#1a1a2e",
        padding: "64px 24px",
        textAlign: "left",
        maxWidth: "800px",
    },
    form: {
        backgroundColor: "#f8f7ff",
        textColor: "#1a1a2e",
        padding: "64px 24px",
        textAlign: "center",
        maxWidth: "600px",
    },
    video: {
        backgroundColor: "#0f0a2e",
        textColor: "#ffffff",
        padding: "48px 24px",
        textAlign: "center",
        maxWidth: "960px",
    },
    countdown: {
        backgroundGradient: "linear-gradient(135deg, #8e78fb 0%, #f65887 100%)",
        textColor: "#ffffff",
        padding: "48px 24px",
        textAlign: "center",
        maxWidth: "800px",
    },
    divider: {
        backgroundColor: "transparent",
        padding: "16px 24px",
        maxWidth: "1200px",
    },
    "social-proof": {
        backgroundColor: "#ffffff",
        textColor: "#1a1a2e",
        padding: "48px 24px",
        textAlign: "center",
        maxWidth: "1200px",
    },
    header: {
        backgroundColor: "#ffffff",
        textColor: "#1a1a2e",
        padding: "16px 24px",
        maxWidth: "1200px",
    },
    footer: {
        backgroundColor: "#0f0a2e",
        textColor: "#a0a0b8",
        padding: "48px 24px",
        textAlign: "center",
        maxWidth: "1200px",
    },
    "community-join": {
        backgroundColor: "#f8f7ff",
        textColor: "#1a1a2e",
        padding: "60px 20px 60px 20px",
    },
    "community-content-preview": {
        backgroundColor: "#ffffff",
        textColor: "#1a1a2e",
        padding: "60px 20px 60px 20px",
    },
    "community-stats": {
        backgroundColor: "#0f0a2e",
        textColor: "#ffffff",
        padding: "40px 20px 40px 20px",
    },
};

/**
 * Default content for each block type
 */
const defaultContent: Record<BlockType, BlockContent> = {
    hero: {
        headline: "Transform Your Vision Into Reality",
        subheadline:
            "Build stunning landing pages and high-converting funnels in minutes — no coding required.",
        ctaText: "Get Started Free",
        ctaUrl: "#signup",
        ctaVariant: "primary",
    },
    text: {
        headline: "Section Heading",
        body: "Write your content here. Use this block to share detailed information, tell your story, or explain your product. Rich, compelling copy helps build trust and moves visitors toward taking action.",
    },
    image: {
        imageUrl: "/placeholder-image.jpg",
        imageAlt: "Descriptive image alt text",
        caption: "",
    },
    cta: {
        headline: "Ready to Take the Next Step?",
        subheadline:
            "Join thousands of creators who have already transformed their business.",
        buttonText: "Start Now",
        buttonUrl: "#signup",
        buttonVariant: "gradient",
        secondaryButtonText: "Learn More",
        secondaryButtonUrl: "#features",
    },
    testimonials: {
        headline: "What Our Customers Say",
        testimonials: [
            {
                id: "testimonial-default-1",
                name: "Sarah Chen",
                role: "Marketing Director at GrowthCo",
                avatar: "",
                quote: "This platform completely transformed how we approach landing pages. Our conversion rate increased by 340% in just two months.",
                rating: 5,
            },
            {
                id: "testimonial-default-2",
                name: "Ahmed Al-Rashid",
                role: "Founder, Digital Academy",
                avatar: "",
                quote: "The drag-and-drop builder is incredibly intuitive. I built my entire course sales funnel in an afternoon.",
                rating: 5,
            },
            {
                id: "testimonial-default-3",
                name: "Maria Garcia",
                role: "Freelance Consultant",
                avatar: "",
                quote: "Finally a tool that lets me create professional pages without hiring a developer. The templates are beautiful and easy to customize.",
                rating: 5,
            },
        ],
    },
    features: {
        headline: "Everything You Need to Succeed",
        subheadline:
            "Powerful features designed to help you build, launch, and grow.",
        features: [
            {
                id: "feature-default-1",
                icon: "Layers",
                title: "Drag & Drop Builder",
                description:
                    "Effortlessly build pages with our intuitive drag-and-drop interface. No coding skills required.",
            },
            {
                id: "feature-default-2",
                icon: "Zap",
                title: "Lightning Fast",
                description:
                    "Optimized for speed and performance. Your pages load instantly on any device.",
            },
            {
                id: "feature-default-3",
                icon: "BarChart3",
                title: "Built-in Analytics",
                description:
                    "Track views, conversions, and engagement with comprehensive real-time analytics.",
            },
            {
                id: "feature-default-4",
                icon: "Globe",
                title: "Custom Domains",
                description:
                    "Connect your own domain for a fully branded experience your audience will trust.",
            },
            {
                id: "feature-default-5",
                icon: "Palette",
                title: "Beautiful Templates",
                description:
                    "Start with professionally designed templates and customize every detail to match your brand.",
            },
            {
                id: "feature-default-6",
                icon: "Shield",
                title: "Secure & Reliable",
                description:
                    "Enterprise-grade security and 99.9% uptime so your pages are always available.",
            },
        ],
        columns: 3,
    },
    pricing: {
        headline: "Simple, Transparent Pricing",
        subheadline:
            "Choose the plan that fits your needs. Upgrade or downgrade anytime.",
        pricingPlans: [
            {
                id: "plan-default-1",
                name: "Starter",
                price: "$19",
                period: "/month",
                features: [
                    "5 Landing Pages",
                    "1,000 Monthly Visitors",
                    "Basic Analytics",
                    "Email Support",
                    "Core Templates",
                ],
                highlighted: false,
                ctaText: "Start Free Trial",
                ctaUrl: "#signup-starter",
            },
            {
                id: "plan-default-2",
                name: "Professional",
                price: "$49",
                period: "/month",
                features: [
                    "Unlimited Landing Pages",
                    "50,000 Monthly Visitors",
                    "Advanced Analytics",
                    "Priority Support",
                    "All Templates",
                    "Custom Domains",
                    "A/B Testing",
                ],
                highlighted: true,
                ctaText: "Start Free Trial",
                ctaUrl: "#signup-pro",
            },
            {
                id: "plan-default-3",
                name: "Enterprise",
                price: "$149",
                period: "/month",
                features: [
                    "Unlimited Everything",
                    "Unlimited Visitors",
                    "White-label Solution",
                    "Dedicated Support",
                    "Custom Integrations",
                    "SLA Guarantee",
                    "Team Collaboration",
                    "API Access",
                ],
                highlighted: false,
                ctaText: "Contact Sales",
                ctaUrl: "#contact",
            },
        ],
    },
    faq: {
        headline: "Frequently Asked Questions",
        faqs: [
            {
                id: "faq-default-1",
                question: "How do I get started?",
                answer: "Simply sign up for a free account, choose a template or start from scratch, and use our drag-and-drop builder to create your page. You can publish in minutes.",
            },
            {
                id: "faq-default-2",
                question: "Can I use my own domain?",
                answer: "Yes! You can connect any custom domain to your landing pages. We provide step-by-step instructions for DNS configuration.",
            },
            {
                id: "faq-default-3",
                question: "Is there a free trial?",
                answer: "Absolutely. All plans come with a 14-day free trial with full access to all features. No credit card required.",
            },
            {
                id: "faq-default-4",
                question: "Can I cancel anytime?",
                answer: "Yes, you can cancel your subscription at any time. There are no long-term contracts or cancellation fees.",
            },
        ],
    },
    form: {
        headline: "Get in Touch",
        subheadline:
            "Fill out the form below and we'll get back to you within 24 hours.",
        formFields: [
            {
                id: "field-default-1",
                type: "text",
                label: "Full Name",
                placeholder: "Enter your full name",
                required: true,
            },
            {
                id: "field-default-2",
                type: "email",
                label: "Email Address",
                placeholder: "you@example.com",
                required: true,
            },
            {
                id: "field-default-3",
                type: "phone",
                label: "Phone Number",
                placeholder: "+1 (555) 000-0000",
                required: false,
            },
            {
                id: "field-default-4",
                type: "textarea",
                label: "Message",
                placeholder: "Tell us how we can help...",
                required: false,
            },
        ],
        formSubmitText: "Send Message",
        formSuccessMessage:
            "Thank you! Your message has been sent successfully.",
    },
    video: {
        headline: "See It in Action",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoThumbnail: "/placeholder-video-thumb.jpg",
        autoplay: false,
    },
    countdown: {
        headline: "Don't Miss Out — Offer Ends Soon!",
        targetDate: new Date(
            Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(),
        countdownLabel: "Time Remaining",
        expiredMessage: "This offer has expired.",
    },
    divider: {},
    "social-proof": {
        headline: "Trusted by Industry Leaders",
        stats: [
            { id: "stat-default-1", value: "10,000+", label: "Active Users" },
            { id: "stat-default-2", value: "50M+", label: "Page Views Served" },
            {
                id: "stat-default-3",
                value: "98%",
                label: "Customer Satisfaction",
            },
            { id: "stat-default-4", value: "4.9/5", label: "Average Rating" },
        ],
        logos: [
            {
                id: "logo-default-1",
                imageUrl: "/logos/company-1.svg",
                alt: "Company 1",
            },
            {
                id: "logo-default-2",
                imageUrl: "/logos/company-2.svg",
                alt: "Company 2",
            },
            {
                id: "logo-default-3",
                imageUrl: "/logos/company-3.svg",
                alt: "Company 3",
            },
            {
                id: "logo-default-4",
                imageUrl: "/logos/company-4.svg",
                alt: "Company 4",
            },
            {
                id: "logo-default-5",
                imageUrl: "/logos/company-5.svg",
                alt: "Company 5",
            },
        ],
    },
    header: {
        logoUrl: "/logo.svg",
        navLinks: [
            { label: "Features", url: "#features" },
            { label: "Pricing", url: "#pricing" },
            { label: "Testimonials", url: "#testimonials" },
            { label: "FAQ", url: "#faq" },
        ],
        ctaText: "Get Started",
        ctaUrl: "#signup",
    },
    footer: {
        logoUrl: "/logo-light.svg",
        navLinks: [
            { label: "Privacy Policy", url: "/privacy" },
            { label: "Terms of Service", url: "/terms" },
            { label: "Contact", url: "/contact" },
        ],
        socialLinks: [
            { platform: "twitter", url: "https://twitter.com" },
            { platform: "linkedin", url: "https://linkedin.com" },
            { platform: "instagram", url: "https://instagram.com" },
        ],
        copyrightText: `© ${new Date().getFullYear()} Your Company. All rights reserved.`,
    },
    "community-join": {
        headline: "Join Our Community",
        subheadline:
            "Get access to exclusive content, resources, and a supportive network.",
        showPricing: true,
        showMemberCount: true,
        showRating: true,
        ctaText: "Join Now",
        ctaUrl: "#join",
    },
    "community-content-preview": {
        headline: "What's Inside",
        subheadline: "Preview the latest content from our community.",
        previewCount: 6,
        previewTypes: ["posts", "courses"],
    },
    "community-stats": {
        headline: "Community at a Glance",
        showMemberCount: true,
        showRating: true,
        showCreatorInfo: true,
        statsLayout: "horizontal",
    },
};

/**
 * Human-readable labels for each block type
 */
export const blockTypeLabels: Record<BlockType, string> = {
    hero: "Hero Section",
    text: "Text Block",
    image: "Image",
    cta: "Call to Action",
    testimonials: "Testimonials",
    features: "Features",
    pricing: "Pricing Table",
    faq: "FAQ",
    form: "Form",
    video: "Video",
    countdown: "Countdown Timer",
    divider: "Divider",
    "social-proof": "Social Proof",
    header: "Header / Navigation",
    footer: "Footer",
    "community-join": "Community Join",
    "community-content-preview": "Content Preview",
    "community-stats": "Community Stats",
};

/**
 * Icon names (Lucide icon names) for each block type
 */
export const blockTypeIcons: Record<BlockType, string> = {
    hero: "Sparkles",
    text: "Type",
    image: "Image",
    cta: "MousePointerClick",
    testimonials: "MessageSquareQuote",
    features: "LayoutGrid",
    pricing: "CreditCard",
    faq: "HelpCircle",
    form: "FileInput",
    video: "PlayCircle",
    countdown: "Timer",
    divider: "Minus",
    "social-proof": "Users",
    header: "PanelTop",
    footer: "PanelBottom",
    "community-join": "UserPlus",
    "community-content-preview": "Layout",
    "community-stats": "BarChart3",
};

/**
 * Block type categories for the block picker panel
 */
export const blockCategories: Array<{
    name: string;
    types: BlockType[];
}> = [
    {
        name: "Layout",
        types: ["header", "footer", "divider"],
    },
    {
        name: "Content",
        types: ["hero", "text", "image", "video"],
    },
    {
        name: "Engagement",
        types: ["cta", "form", "countdown"],
    },
    {
        name: "Social",
        types: ["testimonials", "social-proof", "features"],
    },
    {
        name: "Commerce",
        types: ["pricing", "faq"],
    },
    {
        name: "Community",
        types: [
            "community-join",
            "community-content-preview",
            "community-stats",
        ] as BlockType[],
    },
];

/**
 * Creates a new block with default content and style for the given type.
 * Returns a fully populated PageBlock ready to insert into a page.
 */
export function createBlock(
    type: BlockType,
    overrides?: {
        content?: Partial<BlockContent>;
        style?: Partial<BlockStyle>;
    },
): PageBlock {
    const content: BlockContent = {
        ...defaultContent[type],
        ...(overrides?.content ?? {}),
    };

    const style: BlockStyle = {
        ...defaultStyles[type],
        ...(overrides?.style ?? {}),
    };

    return {
        id: generateBlockId(),
        type,
        content,
        style,
        visible: true,
        locked: false,
    };
}

/**
 * Returns just the default content for a given block type.
 * Useful when resetting a block's content to defaults.
 */
export function getDefaultContent(type: BlockType): BlockContent {
    return { ...defaultContent[type] };
}

/**
 * Returns just the default style for a given block type.
 * Useful when resetting a block's style to defaults.
 */
export function getDefaultStyle(type: BlockType): BlockStyle {
    return { ...defaultStyles[type] };
}

/**
 * All available block types as an ordered array
 */
export const allBlockTypes: BlockType[] = [
    "header",
    "hero",
    "text",
    "image",
    "video",
    "features",
    "cta",
    "testimonials",
    "social-proof",
    "pricing",
    "faq",
    "form",
    "countdown",
    "divider",
    "footer",
    "community-join",
    "community-content-preview",
    "community-stats",
];
