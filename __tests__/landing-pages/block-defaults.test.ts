import {
    createBlock,
    blockTypeLabels,
    blockTypeIcons,
    blockCategories,
} from "@/lib/landing-pages/block-defaults";
import type { BlockType } from "@/lib/landing-pages/types";

// ---------------------------------------------------------------------------
// All 15 block types
// ---------------------------------------------------------------------------

const ALL_BLOCK_TYPES: BlockType[] = [
    "hero",
    "text",
    "image",
    "cta",
    "testimonials",
    "features",
    "pricing",
    "faq",
    "form",
    "video",
    "countdown",
    "divider",
    "social-proof",
    "header",
    "footer",
];

// ---------------------------------------------------------------------------
// createBlock
// ---------------------------------------------------------------------------

describe("createBlock", () => {
    it("returns a PageBlock with a unique id", () => {
        const block = createBlock("hero");

        expect(block).toBeDefined();
        expect(block.id).toBeDefined();
        expect(typeof block.id).toBe("string");
        expect(block.id.length).toBeGreaterThan(0);
        expect(block.type).toBeDefined();
        expect(block.content).toBeDefined();
        expect(block.style).toBeDefined();
        expect(typeof block.visible).toBe("boolean");
    });

    it("produces different ids on two consecutive calls", () => {
        const block1 = createBlock("text");
        const block2 = createBlock("text");

        expect(block1.id).not.toBe(block2.id);
    });

    it('createBlock("hero") returns a block with type "hero"', () => {
        const block = createBlock("hero");
        expect(block.type).toBe("hero");
    });

    it('createBlock("text") returns a block with type "text"', () => {
        const block = createBlock("text");
        expect(block.type).toBe("text");
    });

    it.each(ALL_BLOCK_TYPES)(
        'creates block of type "%s" with visible=true',
        (type) => {
            const block = createBlock(type);
            expect(block.visible).toBe(true);
        },
    );

    it("hero block has default headline content", () => {
        const block = createBlock("hero");

        expect(block.content.headline).toBeDefined();
        expect(typeof block.content.headline).toBe("string");
        expect(block.content.headline!.length).toBeGreaterThan(0);
    });

    it("text block has default body content", () => {
        const block = createBlock("text");

        expect(block.content.body).toBeDefined();
        expect(typeof block.content.body).toBe("string");
        expect(block.content.body!.length).toBeGreaterThan(0);
    });

    it("form block has default formFields", () => {
        const block = createBlock("form");

        expect(block.content.formFields).toBeDefined();
        expect(Array.isArray(block.content.formFields)).toBe(true);
        expect(block.content.formFields!.length).toBeGreaterThan(0);

        const firstField = block.content.formFields![0];
        expect(firstField.id).toBeDefined();
        expect(firstField.type).toBeDefined();
        expect(firstField.label).toBeDefined();
    });

    it("testimonials block has default testimonials array", () => {
        const block = createBlock("testimonials");

        expect(block.content.testimonials).toBeDefined();
        expect(Array.isArray(block.content.testimonials)).toBe(true);
        expect(block.content.testimonials!.length).toBeGreaterThan(0);

        const first = block.content.testimonials![0];
        expect(first.name).toBeDefined();
        expect(first.quote).toBeDefined();
    });

    it("features block has default features array", () => {
        const block = createBlock("features");

        expect(block.content.features).toBeDefined();
        expect(Array.isArray(block.content.features)).toBe(true);
        expect(block.content.features!.length).toBeGreaterThan(0);

        const first = block.content.features![0];
        expect(first.title).toBeDefined();
        expect(first.description).toBeDefined();
    });

    it("respects override parameter and keeps reasonable defaults", () => {
        const block = createBlock("text");

        // Should have default content fields
        expect(block.content.body).toBeDefined();
        expect(block.style).toBeDefined();
        expect(block.style.backgroundColor).toBeDefined();

        // Test with content override — other defaults should be preserved
        const overridden = createBlock("text", {
            content: { body: "Custom body text" },
        });

        expect(overridden.content.body).toBe("Custom body text");
        // Default headline from the text block should still be present
        expect(overridden.content.headline).toBeDefined();

        // Test with style override — other style defaults should be preserved
        const styledBlock = createBlock("text", {
            style: { textColor: "#ff0000" },
        });

        expect(styledBlock.style.textColor).toBe("#ff0000");
        expect(styledBlock.style.backgroundColor).toBeDefined();
    });
});

// ---------------------------------------------------------------------------
// blockTypeLabels
// ---------------------------------------------------------------------------

describe("blockTypeLabels", () => {
    it("has entries for all 15 block types", () => {
        for (const type of ALL_BLOCK_TYPES) {
            expect(blockTypeLabels[type]).toBeDefined();
            expect(typeof blockTypeLabels[type]).toBe("string");
            expect(blockTypeLabels[type].length).toBeGreaterThan(0);
        }

        expect(Object.keys(blockTypeLabels).length).toBe(
            ALL_BLOCK_TYPES.length,
        );
    });
});

// ---------------------------------------------------------------------------
// blockTypeIcons
// ---------------------------------------------------------------------------

describe("blockTypeIcons", () => {
    it("has entries for all 15 block types", () => {
        for (const type of ALL_BLOCK_TYPES) {
            expect(blockTypeIcons[type]).toBeDefined();
            expect(typeof blockTypeIcons[type]).toBe("string");
            expect(blockTypeIcons[type].length).toBeGreaterThan(0);
        }

        expect(Object.keys(blockTypeIcons).length).toBe(ALL_BLOCK_TYPES.length);
    });
});

// ---------------------------------------------------------------------------
// blockCategories
// ---------------------------------------------------------------------------

describe("blockCategories", () => {
    it("is an array with at least 3 categories", () => {
        expect(Array.isArray(blockCategories)).toBe(true);
        expect(blockCategories.length).toBeGreaterThanOrEqual(3);

        for (const category of blockCategories) {
            expect(category.name).toBeDefined();
            expect(typeof category.name).toBe("string");
            expect(Array.isArray(category.types)).toBe(true);
            expect(category.types.length).toBeGreaterThan(0);
        }
    });

    it("every block type appears in at least one category", () => {
        const allCategorizedTypes = blockCategories.flatMap((cat) => cat.types);

        for (const type of ALL_BLOCK_TYPES) {
            expect(allCategorizedTypes).toContain(type);
        }
    });
});
