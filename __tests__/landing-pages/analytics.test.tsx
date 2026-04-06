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
    usePathname: () => "/creator/landing-pages/demo-page-001/analytics",
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

// Mock recharts
jest.mock("recharts", () => {
    const React = require("react");
    return {
        ResponsiveContainer: ({ children }: any) =>
            React.createElement(
                "div",
                { "data-testid": "responsive-container" },
                children,
            ),
        AreaChart: ({ children }: any) =>
            React.createElement(
                "div",
                { "data-testid": "area-chart" },
                children,
            ),
        Area: () => null,
        XAxis: () => null,
        YAxis: () => null,
        CartesianGrid: () => null,
        Tooltip: () => null,
        PieChart: ({ children }: any) =>
            React.createElement(
                "div",
                { "data-testid": "pie-chart" },
                children,
            ),
        Pie: () => null,
        Cell: () => null,
        Legend: () => null,
        BarChart: ({ children }: any) =>
            React.createElement(
                "div",
                { "data-testid": "bar-chart" },
                children,
            ),
        Bar: () => null,
    };
});

import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import AnalyticsPage from "@/app/(creator)/creator/landing-pages/[id]/analytics/page";

describe("Landing Page Analytics", () => {
    // 1. Renders without crashing
    it("renders without crashing", () => {
        expect(() => render(<AnalyticsPage />)).not.toThrow();
    });

    // 2. Shows stat labels like "Total Views" or "Unique Visitors" or "Conversions"
    it("shows stat labels for key metrics", () => {
        render(<AnalyticsPage />);
        expect(screen.getByText("Total Views")).toBeInTheDocument();
        expect(screen.getByText("Unique Visitors")).toBeInTheDocument();
        // "Conversions" appears both as a stat card label and in the chart legend
        expect(
            screen.getAllByText("Conversions").length,
        ).toBeGreaterThanOrEqual(1);
        expect(screen.getByText("Conversion Rate")).toBeInTheDocument();
    });

    // 3. Time range selector exists
    it("renders a time range selector", () => {
        render(<AnalyticsPage />);
        // The page renders a Select component with time range options.
        // The default value is "30d" which shows "Last 30 days" in the trigger.
        // Look for the select trigger button.
        const selectTrigger = document.querySelector('[role="combobox"]');
        expect(selectTrigger).toBeInTheDocument();
    });

    // 4. Chart containers render
    it("renders chart containers", () => {
        render(<AnalyticsPage />);
        // The mocked recharts ResponsiveContainer renders with data-testid
        const containers = screen.getAllByTestId("responsive-container");
        expect(containers.length).toBeGreaterThan(0);

        // Should have at least one area chart for the views & conversions chart
        const areaCharts = screen.getAllByTestId("area-chart");
        expect(areaCharts.length).toBeGreaterThan(0);
    });

    // 5. Traffic sources section exists
    it("renders the Traffic Sources section", async () => {
        render(<AnalyticsPage />);
        await waitFor(
            () => {
                expect(
                    screen.getByText(/traffic sources/i),
                ).toBeInTheDocument();
            },
            { timeout: 3000 },
        );
    });

    // 6. AI insights section exists
    it("renders the AI Insights section", () => {
        render(<AnalyticsPage />);
        expect(screen.getByText("AI Insights")).toBeInTheDocument();
        // Should show individual insight titles from the mock data
        expect(screen.getByText("Boost CTA Visibility")).toBeInTheDocument();
        expect(screen.getByText("Add Video Content")).toBeInTheDocument();
        expect(screen.getByText("Optimize for Mobile")).toBeInTheDocument();
    });
});
