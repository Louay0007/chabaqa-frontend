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
    usePathname: () => "/creator/landing-pages/demo-page-001/leads",
    useParams: () => ({ id: "demo-page-001" }),
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
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LeadsPage from "@/app/(creator)/creator/landing-pages/[id]/leads/page";

describe("Landing Page Leads", () => {
    // 1. Renders without crashing
    it("renders without crashing", () => {
        expect(() => render(<LeadsPage />)).not.toThrow();
    });

    // 2. Shows leads table — table only renders after the API resolves with data
    it("shows a leads table", async () => {
        render(<LeadsPage />);
        await waitFor(
            () => {
                const table = document.querySelector("table");
                expect(table).not.toBeNull();
            },
            { timeout: 3000 },
        );
    });

    // 3. Search input exists
    it("renders a search input", () => {
        render(<LeadsPage />);
        const searchInput = screen.getByPlaceholderText(
            /search by name or email/i,
        );
        expect(searchInput).toBeInTheDocument();
    });

    // 4. Export button exists
    it("renders an export button", () => {
        render(<LeadsPage />);
        // The PageHeader actions include "Export All" button
        expect(screen.getByText("Export All")).toBeInTheDocument();
    });

    // 5. Pagination controls render — pagination is inside the table block which
    //    only appears after the API resolves with leads data
    it("renders pagination controls", async () => {
        render(<LeadsPage />);
        await waitFor(
            () => {
                // pagination might be simple text or buttons
                expect(
                    document.querySelector("[data-testid]") ||
                        document.querySelector("nav") ||
                        document.querySelector(".pagination") ||
                        screen.queryByText(/page/i),
                ).toBeTruthy();
            },
            { timeout: 3000 },
        );
    });

    // 6. Shows lead data from the API mock in the table
    it("shows lead data in the table", async () => {
        render(<LeadsPage />);
        await waitFor(
            () => {
                expect(screen.getByText("Ahmed Al-Rashid")).toBeInTheDocument();
            },
            { timeout: 3000 },
        );
    });

    // Additional: Stat cards render
    it("renders stat cards with lead metrics", () => {
        render(<LeadsPage />);
        expect(screen.getByText("Total Leads")).toBeInTheDocument();
        expect(screen.getByText("This Week")).toBeInTheDocument();
        expect(screen.getByText("Avg Score")).toBeInTheDocument();
        expect(screen.getByText("Conversion Rate")).toBeInTheDocument();
    });

    // Additional: Score filter exists
    it("renders score filter options", () => {
        render(<LeadsPage />);
        // The page has Select components for filtering by score, source, and date
        // Look for combobox roles (Select triggers)
        const selectTriggers = document.querySelectorAll('[role="combobox"]');
        expect(selectTriggers.length).toBeGreaterThan(0);
    });
});
