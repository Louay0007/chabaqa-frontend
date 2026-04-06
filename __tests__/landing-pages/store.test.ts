import {
    editorReducer,
    createInitialEditorState,
    createInitialPage,
    createInitialFullState,
    type FullEditorState,
} from "@/lib/landing-pages/store";
import type { PageBlock, LandingPage } from "@/lib/landing-pages/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeState(overrides?: Partial<FullEditorState>): FullEditorState {
    return {
        page: createInitialPage(),
        editor: createInitialEditorState(),
        ...overrides,
    };
}

function makeBlock(id: string, type: string = "text"): PageBlock {
    return {
        id,
        type: type as any,
        content: { body: "Test content" },
        style: {},
        visible: true,
    };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("editorReducer", () => {
    // ── 1. SET_PAGE ──────────────────────────────────────────────────────────

    describe("SET_PAGE", () => {
        it("sets page data and resets hasUnsavedChanges to false", () => {
            const state = makeState({
                editor: {
                    ...createInitialEditorState(),
                    hasUnsavedChanges: true,
                },
            });

            const newPage: LandingPage = {
                ...createInitialPage(),
                id: "page-123",
                title: "My Landing Page",
                slug: "my-landing-page",
            };

            const next = editorReducer(state, {
                type: "SET_PAGE",
                payload: newPage,
            });

            expect(next.page).toEqual(newPage);
            expect(next.editor.hasUnsavedChanges).toBe(false);
            expect(next.editor.selectedBlockId).toBeNull();
            expect(next.editor.hoveredBlockId).toBeNull();
        });
    });

    // ── 2–3. ADD_BLOCK ──────────────────────────────────────────────────────

    describe("ADD_BLOCK", () => {
        it("appends block to end, selects it, pushes to undoStack, clears redoStack, marks unsaved", () => {
            const existing = makeBlock("b-existing", "hero");
            const state = makeState({
                page: { ...createInitialPage(), blocks: [existing] },
                editor: {
                    ...createInitialEditorState(),
                    redoStack: [[existing]],
                },
            });

            const newBlock = makeBlock("b-new", "text");
            const next = editorReducer(state, {
                type: "ADD_BLOCK",
                payload: { block: newBlock },
            });

            // Appended to end
            expect(next.page.blocks).toHaveLength(2);
            expect(next.page.blocks[0].id).toBe("b-existing");
            expect(next.page.blocks[1].id).toBe("b-new");

            // Selects the new block
            expect(next.editor.selectedBlockId).toBe("b-new");

            // Pushes previous blocks onto undo stack
            expect(next.editor.undoStack.length).toBeGreaterThan(0);
            expect(
                next.editor.undoStack[next.editor.undoStack.length - 1],
            ).toEqual([existing]);

            // Clears redo stack
            expect(next.editor.redoStack).toEqual([]);

            // Marks unsaved
            expect(next.editor.hasUnsavedChanges).toBe(true);
        });

        it("inserts block at specified index", () => {
            const b0 = makeBlock("b-0");
            const b1 = makeBlock("b-1");
            const state = makeState({
                page: { ...createInitialPage(), blocks: [b0, b1] },
            });

            const inserted = makeBlock("b-inserted", "hero");
            const next = editorReducer(state, {
                type: "ADD_BLOCK",
                payload: { block: inserted, index: 1 },
            });

            expect(next.page.blocks).toHaveLength(3);
            expect(next.page.blocks[0].id).toBe("b-0");
            expect(next.page.blocks[1].id).toBe("b-inserted");
            expect(next.page.blocks[2].id).toBe("b-1");
        });
    });

    // ── 4–5. REMOVE_BLOCK ───────────────────────────────────────────────────

    describe("REMOVE_BLOCK", () => {
        it("removes the block and deselects if it was selected", () => {
            const b0 = makeBlock("b-0");
            const b1 = makeBlock("b-1");
            const state = makeState({
                page: { ...createInitialPage(), blocks: [b0, b1] },
                editor: {
                    ...createInitialEditorState(),
                    selectedBlockId: "b-0",
                },
            });

            const next = editorReducer(state, {
                type: "REMOVE_BLOCK",
                payload: "b-0",
            });

            expect(next.page.blocks).toHaveLength(1);
            expect(next.page.blocks[0].id).toBe("b-1");
            expect(next.editor.selectedBlockId).toBeNull();
        });

        it("keeps selection if a different block was selected", () => {
            const b0 = makeBlock("b-0");
            const b1 = makeBlock("b-1");
            const state = makeState({
                page: { ...createInitialPage(), blocks: [b0, b1] },
                editor: {
                    ...createInitialEditorState(),
                    selectedBlockId: "b-1",
                },
            });

            const next = editorReducer(state, {
                type: "REMOVE_BLOCK",
                payload: "b-0",
            });

            expect(next.page.blocks).toHaveLength(1);
            expect(next.page.blocks[0].id).toBe("b-1");
            expect(next.editor.selectedBlockId).toBe("b-1");
        });
    });

    // ── 6. UPDATE_BLOCK ─────────────────────────────────────────────────────

    describe("UPDATE_BLOCK", () => {
        it("updates block content and style by id", () => {
            const b0 = makeBlock("b-0", "hero");
            const state = makeState({
                page: { ...createInitialPage(), blocks: [b0] },
            });

            const next = editorReducer(state, {
                type: "UPDATE_BLOCK",
                payload: {
                    id: "b-0",
                    updates: {
                        content: { body: "Updated content" },
                        style: { backgroundColor: "#ff0000" },
                    },
                },
            });

            expect(next.page.blocks[0].content.body).toBe("Updated content");
            expect(next.page.blocks[0].style.backgroundColor).toBe("#ff0000");
            expect(next.editor.hasUnsavedChanges).toBe(true);
        });
    });

    // ── 7. MOVE_BLOCK ──────────────────────────────────────────────────────

    describe("MOVE_BLOCK", () => {
        it("moves block from one index to another", () => {
            const b0 = makeBlock("b-0");
            const b1 = makeBlock("b-1");
            const b2 = makeBlock("b-2");
            const state = makeState({
                page: { ...createInitialPage(), blocks: [b0, b1, b2] },
            });

            const next = editorReducer(state, {
                type: "MOVE_BLOCK",
                payload: { fromIndex: 0, toIndex: 2 },
            });

            expect(next.page.blocks[0].id).toBe("b-1");
            expect(next.page.blocks[1].id).toBe("b-2");
            expect(next.page.blocks[2].id).toBe("b-0");
        });
    });

    // ── 8–9. DUPLICATE_BLOCK ───────────────────────────────────────────────

    describe("DUPLICATE_BLOCK", () => {
        it("creates copy with new id after original and selects duplicate", () => {
            const b0 = makeBlock("b-0", "hero");
            const b1 = makeBlock("b-1", "text");
            const state = makeState({
                page: { ...createInitialPage(), blocks: [b0, b1] },
            });

            const next = editorReducer(state, {
                type: "DUPLICATE_BLOCK",
                payload: "b-0",
            });

            expect(next.page.blocks).toHaveLength(3);

            // Original at index 0
            expect(next.page.blocks[0].id).toBe("b-0");

            // Duplicate at index 1 with new id
            const dup = next.page.blocks[1];
            expect(dup.id).not.toBe("b-0");
            expect(dup.type).toBe("hero");
            expect(dup.content).toEqual(b0.content);

            // Second original stays at index 2
            expect(next.page.blocks[2].id).toBe("b-1");

            // Selects the duplicate
            expect(next.editor.selectedBlockId).toBe(dup.id);
        });

        it("returns unchanged state for invalid id", () => {
            const b0 = makeBlock("b-0");
            const state = makeState({
                page: { ...createInitialPage(), blocks: [b0] },
            });

            const next = editorReducer(state, {
                type: "DUPLICATE_BLOCK",
                payload: "nonexistent",
            });

            expect(next).toBe(state);
        });
    });

    // ── 10–11. SELECT_BLOCK ────────────────────────────────────────────────

    describe("SELECT_BLOCK", () => {
        it("sets selectedBlockId and opens right panel to content when selecting", () => {
            const state = makeState({
                editor: { ...createInitialEditorState(), rightPanel: "style" },
            });

            const next = editorReducer(state, {
                type: "SELECT_BLOCK",
                payload: "b-42",
            });

            expect(next.editor.selectedBlockId).toBe("b-42");
            expect(next.editor.rightPanel).toBe("content");
        });

        it("deselects when payload is null", () => {
            const state = makeState({
                editor: {
                    ...createInitialEditorState(),
                    selectedBlockId: "b-42",
                },
            });

            const next = editorReducer(state, {
                type: "SELECT_BLOCK",
                payload: null,
            });

            expect(next.editor.selectedBlockId).toBeNull();
        });
    });

    // ── 12. HOVER_BLOCK ────────────────────────────────────────────────────

    describe("HOVER_BLOCK", () => {
        it("sets hoveredBlockId", () => {
            const state = makeState();

            const next = editorReducer(state, {
                type: "HOVER_BLOCK",
                payload: "b-hover",
            });

            expect(next.editor.hoveredBlockId).toBe("b-hover");
        });
    });

    // ── 13. SET_DEVICE_PREVIEW ─────────────────────────────────────────────

    describe("SET_DEVICE_PREVIEW", () => {
        it("changes devicePreview", () => {
            const state = makeState();
            expect(state.editor.devicePreview).toBe("desktop");

            const next = editorReducer(state, {
                type: "SET_DEVICE_PREVIEW",
                payload: "mobile",
            });

            expect(next.editor.devicePreview).toBe("mobile");
        });
    });

    // ── 14–16. SET_ZOOM ────────────────────────────────────────────────────

    describe("SET_ZOOM", () => {
        it("sets zoom level", () => {
            const state = makeState();

            const next = editorReducer(state, {
                type: "SET_ZOOM",
                payload: 75,
            });

            expect(next.editor.zoom).toBe(75);
        });

        it("clamps to 25 when value is too low", () => {
            const state = makeState();

            const next = editorReducer(state, { type: "SET_ZOOM", payload: 5 });

            expect(next.editor.zoom).toBe(25);
        });

        it("clamps to 200 when value is too high", () => {
            const state = makeState();

            const next = editorReducer(state, {
                type: "SET_ZOOM",
                payload: 500,
            });

            expect(next.editor.zoom).toBe(200);
        });
    });

    // ── 17. TOGGLE_GRID ────────────────────────────────────────────────────

    describe("TOGGLE_GRID", () => {
        it("toggles showGrid boolean", () => {
            const state = makeState();
            expect(state.editor.showGrid).toBe(false);

            const toggled = editorReducer(state, { type: "TOGGLE_GRID" });
            expect(toggled.editor.showGrid).toBe(true);

            const toggledBack = editorReducer(toggled, { type: "TOGGLE_GRID" });
            expect(toggledBack.editor.showGrid).toBe(false);
        });
    });

    // ── 18–19. UNDO ────────────────────────────────────────────────────────

    describe("UNDO", () => {
        it("restores previous blocks from undoStack and pushes current to redoStack", () => {
            const b0 = makeBlock("b-0");
            const b1 = makeBlock("b-1");
            const previousBlocks = [b0];
            const currentBlocks = [b0, b1];

            const state = makeState({
                page: { ...createInitialPage(), blocks: currentBlocks },
                editor: {
                    ...createInitialEditorState(),
                    undoStack: [previousBlocks],
                },
            });

            const next = editorReducer(state, { type: "UNDO" });

            expect(next.page.blocks).toEqual(previousBlocks);
            expect(next.editor.undoStack).toHaveLength(0);
            expect(next.editor.redoStack).toHaveLength(1);
            expect(next.editor.redoStack[0]).toEqual(currentBlocks);
            expect(next.editor.selectedBlockId).toBeNull();
            expect(next.editor.hasUnsavedChanges).toBe(true);
        });

        it("is a no-op with empty undo stack", () => {
            const state = makeState({
                editor: { ...createInitialEditorState(), undoStack: [] },
            });

            const next = editorReducer(state, { type: "UNDO" });

            expect(next).toBe(state);
        });
    });

    // ── 20–21. REDO ────────────────────────────────────────────────────────

    describe("REDO", () => {
        it("restores next blocks from redoStack and pushes current to undoStack", () => {
            const b0 = makeBlock("b-0");
            const b1 = makeBlock("b-1");
            const currentBlocks = [b0];
            const redoBlocks = [b0, b1];

            const state = makeState({
                page: { ...createInitialPage(), blocks: currentBlocks },
                editor: {
                    ...createInitialEditorState(),
                    redoStack: [redoBlocks],
                },
            });

            const next = editorReducer(state, { type: "REDO" });

            expect(next.page.blocks).toEqual(redoBlocks);
            expect(next.editor.redoStack).toHaveLength(0);
            expect(next.editor.undoStack).toHaveLength(1);
            expect(next.editor.undoStack[0]).toEqual(currentBlocks);
            expect(next.editor.selectedBlockId).toBeNull();
            expect(next.editor.hasUnsavedChanges).toBe(true);
        });

        it("is a no-op with empty redo stack", () => {
            const state = makeState({
                editor: { ...createInitialEditorState(), redoStack: [] },
            });

            const next = editorReducer(state, { type: "REDO" });

            expect(next).toBe(state);
        });
    });

    // ── 22. SET_SAVING ─────────────────────────────────────────────────────

    describe("SET_SAVING", () => {
        it("sets isSaving flag", () => {
            const state = makeState();
            expect(state.editor.isSaving).toBe(false);

            const next = editorReducer(state, {
                type: "SET_SAVING",
                payload: true,
            });

            expect(next.editor.isSaving).toBe(true);
        });
    });

    // ── 23. MARK_SAVED ────────────────────────────────────────────────────

    describe("MARK_SAVED", () => {
        it("sets isSaving=false, hasUnsavedChanges=false, updates lastSavedAt", () => {
            const state = makeState({
                editor: {
                    ...createInitialEditorState(),
                    isSaving: true,
                    hasUnsavedChanges: true,
                    lastSavedAt: null,
                },
            });

            const before = new Date().toISOString();
            const next = editorReducer(state, { type: "MARK_SAVED" });
            const after = new Date().toISOString();

            expect(next.editor.isSaving).toBe(false);
            expect(next.editor.hasUnsavedChanges).toBe(false);
            expect(next.editor.lastSavedAt).not.toBeNull();

            // lastSavedAt should be a valid ISO timestamp in the right time range
            const savedAt = next.editor.lastSavedAt!;
            expect(savedAt >= before).toBe(true);
            expect(savedAt <= after).toBe(true);
        });
    });

    // ── 24. UPDATE_PAGE_META ───────────────────────────────────────────────

    describe("UPDATE_PAGE_META", () => {
        it("updates title, slug, and description and marks unsaved", () => {
            const state = makeState();

            const next = editorReducer(state, {
                type: "UPDATE_PAGE_META",
                payload: {
                    title: "New Title",
                    slug: "new-slug",
                    description: "A fresh description",
                },
            });

            expect(next.page.title).toBe("New Title");
            expect(next.page.slug).toBe("new-slug");
            expect(next.page.description).toBe("A fresh description");
            expect(next.editor.hasUnsavedChanges).toBe(true);
        });
    });

    // ── 25. Multiple operations ────────────────────────────────────────────

    describe("Multiple operations", () => {
        it("ADD then UNDO then REDO preserves state correctly", () => {
            const state = makeState();

            // Step 1: Add a block
            const block = makeBlock("b-added", "hero");
            const afterAdd = editorReducer(state, {
                type: "ADD_BLOCK",
                payload: { block },
            });

            expect(afterAdd.page.blocks).toHaveLength(1);
            expect(afterAdd.page.blocks[0].id).toBe("b-added");
            expect(afterAdd.editor.undoStack).toHaveLength(1);
            expect(afterAdd.editor.redoStack).toHaveLength(0);

            // Step 2: Undo — should go back to empty blocks
            const afterUndo = editorReducer(afterAdd, { type: "UNDO" });

            expect(afterUndo.page.blocks).toHaveLength(0);
            expect(afterUndo.editor.undoStack).toHaveLength(0);
            expect(afterUndo.editor.redoStack).toHaveLength(1);
            expect(afterUndo.editor.redoStack[0]).toEqual([block]);

            // Step 3: Redo — should restore the added block
            const afterRedo = editorReducer(afterUndo, { type: "REDO" });

            expect(afterRedo.page.blocks).toHaveLength(1);
            expect(afterRedo.page.blocks[0].id).toBe("b-added");
            expect(afterRedo.editor.redoStack).toHaveLength(0);
            expect(afterRedo.editor.undoStack).toHaveLength(1);
        });
    });
});
