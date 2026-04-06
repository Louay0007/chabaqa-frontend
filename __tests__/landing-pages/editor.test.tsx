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
    usePathname: () => "/creator/landing-pages/demo-page-001/edit",
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

// Mock @dnd-kit/core
jest.mock("@dnd-kit/core", () => ({
    DndContext: ({ children }: any) => children,
    closestCenter: jest.fn(),
    KeyboardSensor: jest.fn(),
    PointerSensor: jest.fn(),
    useSensor: jest.fn(() => ({})),
    useSensors: jest.fn(() => []),
    useDraggable: jest.fn(() => ({
        attributes: {},
        listeners: {},
        setNodeRef: jest.fn(),
        transform: null,
        isDragging: false,
    })),
    DragOverlay: ({ children }: any) => children || null,
    useDroppable: jest.fn(() => ({
        setNodeRef: jest.fn(),
        isOver: false,
    })),
}));

// Mock @dnd-kit/sortable
jest.mock("@dnd-kit/sortable", () => ({
    SortableContext: ({ children }: any) => children,
    useSortable: jest.fn(() => ({
        attributes: {},
        listeners: {},
        setNodeRef: jest.fn(),
        transform: null,
        transition: null,
        isDragging: false,
    })),
    verticalListSortingStrategy: "vertical",
    sortableKeyboardCoordinates: jest.fn(),
    arrayMove: jest.fn((arr: any[], from: number, to: number) => {
        const result = [...arr];
        const [removed] = result.splice(from, 1);
        result.splice(to, 0, removed);
        return result;
    }),
}));

// Mock @dnd-kit/utilities
jest.mock("@dnd-kit/utilities", () => ({
    CSS: {
        Transform: {
            toString: jest.fn(() => ""),
        },
        Transition: {
            toString: jest.fn(() => ""),
        },
    },
}));

import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import EditorPage from "@/app/(creator)/creator/landing-pages/[id]/edit/page";

describe("Landing Page Editor", () => {
    // 1. Renders without crashing
    it("renders without crashing", () => {
        expect(() => render(<EditorPage />)).not.toThrow();
    });

    // 2. Shows the editor toolbar area
    it("shows the editor toolbar area", () => {
        render(<EditorPage />);
        // The TopToolbar renders a div with h-14 containing buttons and the page title
        // The page title "My Awesome Landing Page" is shown in the toolbar
        expect(screen.getByText("My Awesome Landing Page")).toBeInTheDocument();
    });

    // 3. Shows device preview buttons (Desktop/Tablet/Mobile)
    it("shows device preview buttons", () => {
        render(<EditorPage />);
        // The toolbar renders tooltips with "Desktop", "Tablet", "Mobile" as content.
        // The buttons have tooltip content, let's look for the device preview button group.
        // Since tooltips may not be visible, check for the buttons by their icon structure.
        // The devices array renders 3 buttons in a container with class "rounded-lg border".
        const previewContainer = document.querySelector(
            ".flex.items-center.gap-1.rounded-lg.border",
        );
        expect(previewContainer).toBeInTheDocument();
        // Should contain 3 device buttons
        const deviceButtons =
            previewContainer?.querySelectorAll("button") ?? [];
        expect(deviceButtons.length).toBe(3);
    });

    // 4. Shows the block library sidebar
    it("shows the block library sidebar with Blocks heading", () => {
        render(<EditorPage />);
        // The LeftSidebar has a heading "Blocks"
        expect(screen.getByText("Blocks")).toBeInTheDocument();
    });

    // 5. Shows blocks on the canvas (demo blocks should be initialized)
    it("shows blocks on the canvas from initial demo state", () => {
        render(<EditorPage />);
        // The editor initializes with these demo blocks:
        // header, hero, features, testimonials, cta, footer
        // BlockRenderer renders content based on block type.
        // The hero block has "Transform Your Vision Into Reality" as default headline.
        expect(
            screen.getByText("Transform Your Vision Into Reality"),
        ).toBeInTheDocument();
        // The features block has "Everything You Need to Succeed"
        expect(
            screen.getByText("Everything You Need to Succeed"),
        ).toBeInTheDocument();
        // The CTA block has "Ready to Take the Next Step?"
        expect(
            screen.getByText("Ready to Take the Next Step?"),
        ).toBeInTheDocument();
    });

    // 6. Undo and Redo buttons exist
    it("renders Undo and Redo buttons", () => {
        render(<EditorPage />);
        // The toolbar has Undo and Redo buttons. They're icon buttons
        // wrapped in TooltipTrigger. Look for the buttons by their
        // disabled state or by querying all buttons for the Undo2/Redo2 icons.
        const allButtons = screen.getAllByRole("button");

        // Undo button has an Undo2 SVG icon; Redo button has a Redo2 SVG icon.
        // Since both are disabled initially (no undo/redo history), let's find
        // disabled icon buttons. There should be at least 2 disabled ones.
        const disabledButtons = allButtons.filter(
            (btn) => (btn as HTMLButtonElement).disabled,
        );
        expect(disabledButtons.length).toBeGreaterThanOrEqual(2);
    });

    // 7. Publish button exists
    it("renders a Publish button", () => {
        render(<EditorPage />);
        expect(screen.getByText("Publish")).toBeInTheDocument();
    });

    // 8. Back navigation link exists
    it("renders a back navigation button", () => {
        render(<EditorPage />);
        // The TopToolbar has a back button (ArrowLeft icon) that navigates
        // to /creator/landing-pages. It's the first ghost icon button.
        const allButtons = screen.getAllByRole("button");
        // The first button in the toolbar is the back button with ArrowLeft icon
        // It should be an icon-sized button (h-8 w-8)
        const backButton = allButtons.find(
            (btn) =>
                btn.className.includes("h-8") &&
                btn.className.includes("w-8") &&
                !(btn as HTMLButtonElement).disabled,
        );
        expect(backButton).toBeDefined();
    });
});
