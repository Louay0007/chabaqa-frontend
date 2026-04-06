import {
    pageTemplates,
    getTemplatesByCategory,
    getTemplateCategories,
    cloneTemplateBlocks,
} from "@/lib/landing-pages/templates";
import type { BlockType } from "@/lib/landing-pages/types";

const VALID_BLOCK_TYPES: BlockType[] = [
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

describe("Landing Page Templates", () => {
    // 1. PAGE_TEMPLATES is a non-empty array
    it("pageTemplates is a non-empty array", () => {
        expect(Array.isArray(pageTemplates)).toBe(true);
        expect(pageTemplates.length).toBeGreaterThan(0);
    });

    // 2. Each template has id, name, description, category
    it("each template has id, name, description, and category", () => {
        for (const template of pageTemplates) {
            expect(template).toHaveProperty("id");
            expect(typeof template.id).toBe("string");
            expect(template.id.length).toBeGreaterThan(0);

            expect(template).toHaveProperty("name");
            expect(typeof template.name).toBe("string");
            expect(template.name.length).toBeGreaterThan(0);

            expect(template).toHaveProperty("description");
            expect(typeof template.description).toBe("string");
            expect(template.description.length).toBeGreaterThan(0);

            expect(template).toHaveProperty("category");
            expect(typeof template.category).toBe("string");
            expect(template.category.length).toBeGreaterThan(0);
        }
    });

    // 3. Each template has a blocks array with at least 3 blocks
    it("each template has a blocks array with at least 3 blocks", () => {
        for (const template of pageTemplates) {
            expect(Array.isArray(template.blocks)).toBe(true);
            expect(template.blocks.length).toBeGreaterThanOrEqual(3);
        }
    });

    // 4. Each template block has id, type, content, style, visible properties
    it("each template block has id, type, content, style, and visible properties", () => {
        for (const template of pageTemplates) {
            for (const block of template.blocks) {
                expect(block).toHaveProperty("id");
                expect(typeof block.id).toBe("string");

                expect(block).toHaveProperty("type");
                expect(typeof block.type).toBe("string");

                expect(block).toHaveProperty("content");
                expect(typeof block.content).toBe("object");

                expect(block).toHaveProperty("style");
                expect(typeof block.style).toBe("object");

                expect(block).toHaveProperty("visible");
                expect(typeof block.visible).toBe("boolean");
            }
        }
    });

    // 5. All template block types are valid BlockType values
    it("all template block types are valid BlockType values", () => {
        for (const template of pageTemplates) {
            for (const block of template.blocks) {
                expect(VALID_BLOCK_TYPES).toContain(block.type);
            }
        }
    });

    // 6. getTemplatesByCategory('sales') returns only templates with sales category
    it("getTemplatesByCategory returns only templates matching the given category", () => {
        // Pick a category that actually exists in the templates
        const categories = [...new Set(pageTemplates.map((t) => t.category))];
        for (const cat of categories) {
            const result = getTemplatesByCategory(cat);
            expect(Array.isArray(result)).toBe(true);
            for (const t of result) {
                expect(t.category).toBe(cat);
            }
        }

        // Specifically test 'course' which we know exists
        const courseTemplates = getTemplatesByCategory("course");
        expect(courseTemplates.length).toBeGreaterThan(0);
        courseTemplates.forEach((t) => expect(t.category).toBe("course"));
    });

    // 7. getTemplatesByCategory with non-existent category returns empty array
    it("getTemplatesByCategory with non-existent category returns empty array", () => {
        const result = getTemplatesByCategory("nonexistent-category" as any);
        expect(Array.isArray(result)).toBe(true);
        expect(result).toHaveLength(0);
    });

    // 8. getTemplateCategories returns an array of category objects
    it("getTemplateCategories returns an array of category objects with value and label", () => {
        const categories = getTemplateCategories();
        expect(Array.isArray(categories)).toBe(true);
        expect(categories.length).toBeGreaterThan(0);

        for (const cat of categories) {
            expect(cat).toHaveProperty("value");
            expect(typeof cat.value).toBe("string");
            expect(cat.value.length).toBeGreaterThan(0);

            expect(cat).toHaveProperty("label");
            expect(typeof cat.label).toBe("string");
            expect(cat.label.length).toBeGreaterThan(0);
        }
    });

    // 9. cloneTemplateBlocks returns blocks with different ids than originals
    it("cloneTemplateBlocks returns blocks with different ids than originals", () => {
        const template = pageTemplates[0];
        const cloned = cloneTemplateBlocks(template.id);

        expect(cloned.length).toBe(template.blocks.length);

        const originalIds = template.blocks.map((b) => b.id);
        const clonedIds = cloned.map((b) => b.id);

        // Every cloned id should be different from the original
        for (const clonedId of clonedIds) {
            expect(originalIds).not.toContain(clonedId);
        }
    });

    // 10. cloneTemplateBlocks preserves block types and content
    it("cloneTemplateBlocks preserves block types and content", () => {
        const template = pageTemplates[0];
        const cloned = cloneTemplateBlocks(template.id);

        expect(cloned.length).toBe(template.blocks.length);

        for (let i = 0; i < cloned.length; i++) {
            expect(cloned[i].type).toBe(template.blocks[i].type);
            // Content should be deeply equal (same values)
            expect(cloned[i].content).toEqual(template.blocks[i].content);
            expect(cloned[i].visible).toBe(template.blocks[i].visible);
        }
    });

    // 11. Each template name is unique
    it("each template name is unique", () => {
        const names = pageTemplates.map((t) => t.name);
        const uniqueNames = new Set(names);
        expect(uniqueNames.size).toBe(names.length);
    });

    // 12. Templates cover at least 3 different categories
    it("templates cover at least 3 different categories", () => {
        const categories = new Set(pageTemplates.map((t) => t.category));
        expect(categories.size).toBeGreaterThanOrEqual(3);
    });
});
