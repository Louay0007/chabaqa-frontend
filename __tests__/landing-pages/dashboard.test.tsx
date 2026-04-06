// Mock next/navigation
jest.mock("next/navigation", () => ({
    useRouter: () => ({
        push: jest.fn(),
        back: jest.fn(),
        replace: jest.fn(),
        refresh: jest.fn(),
        forward: jest.fn(),
        prefetch: jest.fn(),
    }),
    usePathname: () => "/creator/landing-pages",
    useParams: () => ({}),
    useSearchParams: () => new URLSearchParams(),
}));

// Mock framer-motion
jest.mock("framer-motion", () => {
    const React = require("react");
    return {
        motion: new Proxy(
            {},
            {
                get: (_: any, tag: string) => {
                    const Component = React.forwardRef(
                        (props: any, ref: any) => {
                            const {
                                animate,
                                initial,
                                exit,
                                variants,
                                whileHover,
                                whileTap,
                                whileInView,
                                transition,
                                layout,
                                drag,
                                dragConstraints,
                                onDragEnd,
                                viewport,
                                ...rest
                            } = props;
                            return React.createElement(tag, { ...rest, ref });
                        },
                    );
                    Component.displayName = "motion." + tag;
                    return Component;
                },
            },
        ),
        AnimatePresence: ({ children }: any) => children,
        useMotionValue: () => ({ set: jest.fn(), get: () => 0 }),
        useTransform: () => ({ set: jest.fn(), get: () => 0 }),
        useAnimation: () => ({ start: jest.fn() }),
        useInView: () => true,
    };
});

// Mock canvas-confetti
jest.mock("canvas-confetti", () => jest.fn());

// Mock the landing pages API
jest.mock("@/lib/api/landing-pages.api", () => ({
    landingPagesApi: {
        getAll: jest.fn().mockResolvedValue({
            data: [
                {
                    id: "lp-1",
                    title: "Arabic Course Sales Page",
                    slug: "arabic-course-sales",
                    status: "published",
                    description: "Sell your course",
                    blocks: [],
                    seo: {},
                    analytics: {
                        views: 1240,
                        uniqueVisitors: 980,
                        conversions: 87,
                        conversionRate: 7.02,
                        avgTimeOnPage: 245,
                        bounceRate: 32,
                    },
                    createdAt: "2024-01-01T00:00:00.000Z",
                    updatedAt: "2024-01-15T00:00:00.000Z",
                    publishedAt: "2024-01-10T00:00:00.000Z",
                },
                {
                    id: "lp-2",
                    title: "Lead Capture Page",
                    slug: "lead-capture",
                    status: "draft",
                    description: "Capture leads",
                    blocks: [],
                    seo: {},
                    analytics: {
                        views: 0,
                        uniqueVisitors: 0,
                        conversions: 0,
                        conversionRate: 0,
                        avgTimeOnPage: 0,
                        bounceRate: 0,
                    },
                    createdAt: "2024-01-02T00:00:00.000Z",
                    updatedAt: "2024-01-02T00:00:00.000Z",
                },
            ],
        }),
        delete: jest.fn().mockResolvedValue({ data: null }),
        duplicate: jest.fn().mockResolvedValue({
            data: {
                id: "lp-copy",
                title: "Arabic Course Sales Page (Copy)",
                slug: "arabic-course-sales-copy",
                status: "draft",
                blocks: [],
                seo: {},
                analytics: {
                    views: 0,
                    uniqueVisitors: 0,
                    conversions: 0,
                    conversionRate: 0,
                    avgTimeOnPage: 0,
                    bounceRate: 0,
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        }),
        publish: jest.fn().mockResolvedValue({
            data: {
                id: "lp-1",
                title: "Arabic Course Sales Page",
                slug: "arabic-course-sales",
                status: "published",
                blocks: [],
                seo: {},
                analytics: {
                    views: 0,
                    uniqueVisitors: 0,
                    conversions: 0,
                    conversionRate: 0,
                    avgTimeOnPage: 0,
                    bounceRate: 0,
                },
                createdAt: "2024-01-01T00:00:00.000Z",
                updatedAt: new Date().toISOString(),
                publishedAt: new Date().toISOString(),
            },
        }),
        update: jest.fn().mockResolvedValue({ data: {} }),
        getAnalytics: jest.fn().mockResolvedValue({
            data: {
                views: 5420,
                uniqueVisitors: 3840,
                conversions: 312,
                conversionRate: 5.75,
                avgTimeOnPage: 187,
                bounceRate: 38.5,
                dailyViews: [
                    {
                        date: "2024-01-01",
                        views: 120,
                        conversions: 8,
                        uniqueVisitors: 95,
                    },
                    {
                        date: "2024-01-02",
                        views: 145,
                        conversions: 11,
                        uniqueVisitors: 112,
                    },
                    {
                        date: "2024-01-03",
                        views: 98,
                        conversions: 6,
                        uniqueVisitors: 78,
                    },
                ],
                deviceBreakdown: [
                    { device: "desktop", count: 3142 },
                    { device: "mobile", count: 1846 },
                    { device: "tablet", count: 432 },
                ],
                topReferrers: [
                    { source: "direct", count: 1842 },
                    { source: "google.com", count: 1356 },
                    { source: "facebook.com", count: 723 },
                ],
            },
        }),
        getLeads: jest.fn().mockResolvedValue({
            data: [
                {
                    id: "lead-1",
                    pageId: "lp-1",
                    email: "ahmed.rashid@example.com",
                    name: "Ahmed Al-Rashid",
                    phone: "+971 50 123 4567",
                    score: 85,
                    source: "Organic",
                    status: "new",
                    data: {
                        email: "ahmed.rashid@example.com",
                        name: "Ahmed Al-Rashid",
                    },
                    createdAt: "2024-01-15T10:30:00.000Z",
                    updatedAt: "2024-01-15T10:30:00.000Z",
                },
                {
                    id: "lead-2",
                    pageId: "lp-1",
                    email: "fatima.mansour@example.com",
                    name: "Fatima Mansour",
                    phone: "+971 55 987 6543",
                    score: 65,
                    source: "Social",
                    status: "contacted",
                    data: {
                        email: "fatima.mansour@example.com",
                        name: "Fatima Mansour",
                    },
                    createdAt: "2024-01-14T09:15:00.000Z",
                    updatedAt: "2024-01-14T09:15:00.000Z",
                },
            ],
            pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
        }),
        exportLeads: jest
            .fn()
            .mockResolvedValue(
                new Blob(["id,name,email\n"], { type: "text/csv" }),
            ),
        deleteLead: jest.fn().mockResolvedValue({ data: null }),
        submitLead: jest
            .fn()
            .mockResolvedValue({ data: { leadId: "lead-123" } }),
        trackView: jest.fn().mockResolvedValue(undefined),
        trackExit: jest.fn().mockResolvedValue(undefined),
    },
    funnelsApi: {
        getAll: jest.fn().mockResolvedValue({ data: [] }),
        create: jest.fn().mockResolvedValue({
            data: {
                id: "funnel-1",
                name: "Test Funnel",
                status: "draft",
                steps: [],
                connections: [],
                analytics: {},
            },
        }),
        update: jest.fn().mockResolvedValue({ data: {} }),
        delete: jest.fn().mockResolvedValue({ data: null }),
    },
}));

import React from "react";
import { render, screen, waitFor, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LandingPagesPage from "@/app/(creator)/creator/landing-pages/page";

describe("Landing Pages Dashboard", () => {
    // 1. Renders without crashing
    it("renders without crashing", () => {
        expect(() => render(<LandingPagesPage />)).not.toThrow();
    });

    // 2. Shows "Build high-converting pages" heading text (after loading)
    it('shows "high-converting" heading text after loading', async () => {
        render(<LandingPagesPage />);
        await waitFor(
            () => {
                expect(
                    screen.getByText(/high-converting/i),
                ).toBeInTheDocument();
            },
            { timeout: 3000 },
        );
    });

    // 3. Shows stat cards (look for "Total Pages" text)
    it('shows stat cards including "Total Pages"', async () => {
        render(<LandingPagesPage />);
        await waitFor(
            () => {
                expect(screen.getByText("Total Pages")).toBeInTheDocument();
            },
            { timeout: 3000 },
        );
    });

    // 4. Shows search input
    it("shows a search input", async () => {
        render(<LandingPagesPage />);
        await waitFor(
            () => {
                expect(
                    screen.getByPlaceholderText(/search pages/i),
                ).toBeInTheDocument();
            },
            { timeout: 3000 },
        );
    });

    // 5. Shows status filter tabs (All, Draft, Published, Archived)
    it("shows status filter tabs", async () => {
        render(<LandingPagesPage />);
        await waitFor(
            () => {
                // "All" only appears as a tab label (badge count is a child element,
                // so getNodeText returns just the direct text node "All")
                expect(screen.getByText("All")).toBeInTheDocument();
                // "Draft" and "Published" appear as tab labels and status badges on cards
                expect(
                    screen.getAllByText("Draft").length,
                ).toBeGreaterThanOrEqual(1);
                expect(
                    screen.getAllByText("Published").length,
                ).toBeGreaterThanOrEqual(1);
                // "Archived" tab has no badge when count is 0, so its direct
                // text node is exactly "Archived"
                expect(
                    screen.getAllByText("Archived").length,
                ).toBeGreaterThanOrEqual(1);
                // Verify the tab triggers exist by role
                expect(
                    screen.getByRole("tab", { name: /All/i }),
                ).toBeInTheDocument();
                expect(
                    screen.getByRole("tab", { name: /Draft/i }),
                ).toBeInTheDocument();
            },
            { timeout: 3000 },
        );
    });

    // 6. Renders page cards (look for mock page titles)
    it("renders page cards with mock page titles", async () => {
        render(<LandingPagesPage />);
        await waitFor(
            () => {
                expect(
                    screen.getByText("Arabic Course Sales Page"),
                ).toBeInTheDocument();
            },
            { timeout: 3000 },
        );
    });

    // 7. FAB button is rendered (look for "+" or the Plus icon button)
    it("renders the floating action button", async () => {
        render(<LandingPagesPage />);
        await waitFor(
            () => {
                const allButtons = screen.getAllByRole("button");
                // At minimum the FAB should exist among the buttons
                expect(allButtons.length).toBeGreaterThan(0);
                // The FAB container has a Plus svg icon; check it exists in the document
                // by finding the fixed-position container
                const fabContainer = document.querySelector(
                    ".fixed.bottom-6.right-6",
                );
                expect(fabContainer).toBeInTheDocument();
            },
            { timeout: 3000 },
        );
    });

    // 8. Status badges show correct text
    it("shows status badges with correct text on page cards", async () => {
        render(<LandingPagesPage />);
        await waitFor(
            () => {
                // There are published and draft pages in mock data
                const publishedBadges = screen.getAllByText("Published");
                expect(publishedBadges.length).toBeGreaterThan(0);

                const draftBadges = screen.getAllByText("Draft");
                expect(draftBadges.length).toBeGreaterThan(0);
            },
            { timeout: 3000 },
        );
    });
});
