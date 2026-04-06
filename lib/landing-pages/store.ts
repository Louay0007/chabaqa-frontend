"use client"

import { createContext, useContext, useCallback, type Dispatch } from 'react'
import type { PageBlock, EditorState, LandingPage, DevicePreview } from './types'

// ─────────────────────────────────────────────
// Actions
// ─────────────────────────────────────────────

export type EditorAction =
  | { type: 'SET_PAGE'; payload: LandingPage }
  | { type: 'ADD_BLOCK'; payload: { block: PageBlock; index?: number } }
  | { type: 'REMOVE_BLOCK'; payload: string }
  | { type: 'UPDATE_BLOCK'; payload: { id: string; updates: Partial<PageBlock> } }
  | { type: 'MOVE_BLOCK'; payload: { fromIndex: number; toIndex: number } }
  | { type: 'DUPLICATE_BLOCK'; payload: string }
  | { type: 'SELECT_BLOCK'; payload: string | null }
  | { type: 'HOVER_BLOCK'; payload: string | null }
  | { type: 'SET_DEVICE_PREVIEW'; payload: DevicePreview }
  | { type: 'SET_ZOOM'; payload: number }
  | { type: 'TOGGLE_GRID'; payload?: undefined }
  | { type: 'SET_DRAGGING'; payload: boolean }
  | { type: 'UNDO'; payload?: undefined }
  | { type: 'REDO'; payload?: undefined }
  | { type: 'SET_RIGHT_PANEL'; payload: EditorState['rightPanel'] }
  | { type: 'TOGGLE_LEFT_PANEL'; payload?: undefined }
  | { type: 'SET_SAVING'; payload: boolean }
  | { type: 'MARK_SAVED'; payload?: undefined }
  | { type: 'UPDATE_PAGE_META'; payload: Partial<Pick<LandingPage, 'title' | 'slug' | 'description' | 'seo'>> }
  | { type: 'TOGGLE_BLOCK_VISIBILITY'; payload: string }
  | { type: 'TOGGLE_BLOCK_LOCK'; payload: string }
  | { type: 'REPLACE_ALL_BLOCKS'; payload: PageBlock[] }

// ─────────────────────────────────────────────
// Initial state factories
// ─────────────────────────────────────────────

export const createInitialEditorState = (): EditorState => ({
  selectedBlockId: null,
  hoveredBlockId: null,
  devicePreview: 'desktop',
  zoom: 100,
  showGrid: false,
  isDragging: false,
  undoStack: [],
  redoStack: [],
  rightPanel: 'content',
  leftPanelOpen: true,
  isSaving: false,
  lastSavedAt: null,
  hasUnsavedChanges: false,
})

export const createInitialPage = (): LandingPage => ({
  id: '',
  title: 'Untitled Page',
  slug: '',
  status: 'draft',
  blocks: [],
  seo: {},
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
})

// ─────────────────────────────────────────────
// Combined state
// ─────────────────────────────────────────────

export interface FullEditorState {
  page: LandingPage
  editor: EditorState
}

export const createInitialFullState = (): FullEditorState => ({
  page: createInitialPage(),
  editor: createInitialEditorState(),
})

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────

/** Push to undo stack (capped at 50 entries to prevent memory bloat) */
function pushUndo(editor: EditorState, currentBlocks: PageBlock[]): EditorState {
  const stack = [...editor.undoStack, currentBlocks]
  if (stack.length > 50) stack.shift()
  return {
    ...editor,
    undoStack: stack,
    redoStack: [],
    hasUnsavedChanges: true,
  }
}

function now(): string {
  return new Date().toISOString()
}

// ─────────────────────────────────────────────
// Reducer
// ─────────────────────────────────────────────

export function editorReducer(state: FullEditorState, action: EditorAction): FullEditorState {
  switch (action.type) {
    // ── Page-level ──────────────────────────

    case 'SET_PAGE':
      return {
        ...state,
        page: action.payload,
        editor: {
          ...state.editor,
          hasUnsavedChanges: false,
          selectedBlockId: null,
          hoveredBlockId: null,
        },
      }

    case 'UPDATE_PAGE_META':
      return {
        ...state,
        page: { ...state.page, ...action.payload, updatedAt: now() },
        editor: { ...state.editor, hasUnsavedChanges: true },
      }

    // ── Block CRUD ─────────────────────────

    case 'ADD_BLOCK': {
      const { block, index } = action.payload
      const newBlocks = [...state.page.blocks]
      if (index !== undefined && index >= 0 && index <= newBlocks.length) {
        newBlocks.splice(index, 0, block)
      } else {
        newBlocks.push(block)
      }
      return {
        ...state,
        page: { ...state.page, blocks: newBlocks, updatedAt: now() },
        editor: {
          ...pushUndo(state.editor, state.page.blocks),
          selectedBlockId: block.id,
          rightPanel: 'content',
        },
      }
    }

    case 'REMOVE_BLOCK': {
      const blockId = action.payload
      const filtered = state.page.blocks.filter(b => b.id !== blockId)
      if (filtered.length === state.page.blocks.length) return state // nothing removed
      return {
        ...state,
        page: { ...state.page, blocks: filtered, updatedAt: now() },
        editor: {
          ...pushUndo(state.editor, state.page.blocks),
          selectedBlockId:
            state.editor.selectedBlockId === blockId ? null : state.editor.selectedBlockId,
          hoveredBlockId:
            state.editor.hoveredBlockId === blockId ? null : state.editor.hoveredBlockId,
        },
      }
    }

    case 'UPDATE_BLOCK': {
      const { id, updates } = action.payload
      const blockExists = state.page.blocks.some(b => b.id === id)
      if (!blockExists) return state
      return {
        ...state,
        page: {
          ...state.page,
          blocks: state.page.blocks.map(b => (b.id === id ? { ...b, ...updates } : b)),
          updatedAt: now(),
        },
        editor: pushUndo(state.editor, state.page.blocks),
      }
    }

    case 'MOVE_BLOCK': {
      const { fromIndex, toIndex } = action.payload
      if (
        fromIndex < 0 ||
        toIndex < 0 ||
        fromIndex >= state.page.blocks.length ||
        toIndex >= state.page.blocks.length ||
        fromIndex === toIndex
      ) {
        return state
      }
      const newBlocks = [...state.page.blocks]
      const [moved] = newBlocks.splice(fromIndex, 1)
      newBlocks.splice(toIndex, 0, moved)
      return {
        ...state,
        page: { ...state.page, blocks: newBlocks, updatedAt: now() },
        editor: pushUndo(state.editor, state.page.blocks),
      }
    }

    case 'DUPLICATE_BLOCK': {
      const idx = state.page.blocks.findIndex(b => b.id === action.payload)
      if (idx === -1) return state
      const original = state.page.blocks[idx]
      const duplicate: PageBlock = {
        ...JSON.parse(JSON.stringify(original)),
        id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
        locked: false,
      }
      const newBlocks = [...state.page.blocks]
      newBlocks.splice(idx + 1, 0, duplicate)
      return {
        ...state,
        page: { ...state.page, blocks: newBlocks, updatedAt: now() },
        editor: {
          ...pushUndo(state.editor, state.page.blocks),
          selectedBlockId: duplicate.id,
          rightPanel: 'content',
        },
      }
    }

    case 'TOGGLE_BLOCK_VISIBILITY': {
      const blockId = action.payload
      return {
        ...state,
        page: {
          ...state.page,
          blocks: state.page.blocks.map(b =>
            b.id === blockId ? { ...b, visible: !b.visible } : b
          ),
          updatedAt: now(),
        },
        editor: pushUndo(state.editor, state.page.blocks),
      }
    }

    case 'TOGGLE_BLOCK_LOCK': {
      const blockId = action.payload
      return {
        ...state,
        page: {
          ...state.page,
          blocks: state.page.blocks.map(b =>
            b.id === blockId ? { ...b, locked: !b.locked } : b
          ),
          updatedAt: now(),
        },
        editor: { ...state.editor, hasUnsavedChanges: true },
      }
    }

    case 'REPLACE_ALL_BLOCKS': {
      return {
        ...state,
        page: { ...state.page, blocks: action.payload, updatedAt: now() },
        editor: {
          ...pushUndo(state.editor, state.page.blocks),
          selectedBlockId: null,
        },
      }
    }

    // ── Selection & hover ──────────────────

    case 'SELECT_BLOCK':
      return {
        ...state,
        editor: {
          ...state.editor,
          selectedBlockId: action.payload,
          rightPanel: action.payload ? 'content' : state.editor.rightPanel,
        },
      }

    case 'HOVER_BLOCK':
      return {
        ...state,
        editor: { ...state.editor, hoveredBlockId: action.payload },
      }

    // ── Viewport ───────────────────────────

    case 'SET_DEVICE_PREVIEW':
      return {
        ...state,
        editor: { ...state.editor, devicePreview: action.payload },
      }

    case 'SET_ZOOM':
      return {
        ...state,
        editor: {
          ...state.editor,
          zoom: Math.max(25, Math.min(200, action.payload)),
        },
      }

    case 'TOGGLE_GRID':
      return {
        ...state,
        editor: { ...state.editor, showGrid: !state.editor.showGrid },
      }

    case 'SET_DRAGGING':
      return {
        ...state,
        editor: { ...state.editor, isDragging: action.payload },
      }

    // ── Undo / Redo ────────────────────────

    case 'UNDO': {
      if (state.editor.undoStack.length === 0) return state
      const previous = state.editor.undoStack[state.editor.undoStack.length - 1]
      return {
        ...state,
        page: { ...state.page, blocks: previous, updatedAt: now() },
        editor: {
          ...state.editor,
          undoStack: state.editor.undoStack.slice(0, -1),
          redoStack: [...state.editor.redoStack, state.page.blocks],
          hasUnsavedChanges: true,
          selectedBlockId: null,
        },
      }
    }

    case 'REDO': {
      if (state.editor.redoStack.length === 0) return state
      const next = state.editor.redoStack[state.editor.redoStack.length - 1]
      return {
        ...state,
        page: { ...state.page, blocks: next, updatedAt: now() },
        editor: {
          ...state.editor,
          redoStack: state.editor.redoStack.slice(0, -1),
          undoStack: [...state.editor.undoStack, state.page.blocks],
          hasUnsavedChanges: true,
          selectedBlockId: null,
        },
      }
    }

    // ── Panels ─────────────────────────────

    case 'SET_RIGHT_PANEL':
      return {
        ...state,
        editor: { ...state.editor, rightPanel: action.payload },
      }

    case 'TOGGLE_LEFT_PANEL':
      return {
        ...state,
        editor: { ...state.editor, leftPanelOpen: !state.editor.leftPanelOpen },
      }

    // ── Persistence ────────────────────────

    case 'SET_SAVING':
      return {
        ...state,
        editor: { ...state.editor, isSaving: action.payload },
      }

    case 'MARK_SAVED':
      return {
        ...state,
        editor: {
          ...state.editor,
          isSaving: false,
          lastSavedAt: now(),
          hasUnsavedChanges: false,
        },
      }

    default:
      return state
  }
}

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

interface EditorContextValue {
  state: FullEditorState
  dispatch: Dispatch<EditorAction>
}

export const EditorContext = createContext<EditorContextValue | null>(null)

/**
 * Access the raw editor state and dispatch.
 * Must be used inside an `<EditorProvider>`.
 */
export function useEditor() {
  const ctx = useContext(EditorContext)
  if (!ctx) {
    throw new Error('useEditor must be used within an EditorProvider')
  }
  return ctx
}

// ─────────────────────────────────────────────
// Action helper hooks
// ─────────────────────────────────────────────

/**
 * Convenience hook that exposes memoised action helpers
 * so consumers don't need to construct action objects manually.
 */
export function useEditorActions() {
  const { state, dispatch } = useEditor()

  const addBlock = useCallback(
    (block: PageBlock, index?: number) => {
      dispatch({ type: 'ADD_BLOCK', payload: { block, index } })
    },
    [dispatch],
  )

  const removeBlock = useCallback(
    (id: string) => {
      dispatch({ type: 'REMOVE_BLOCK', payload: id })
    },
    [dispatch],
  )

  const updateBlock = useCallback(
    (id: string, updates: Partial<PageBlock>) => {
      dispatch({ type: 'UPDATE_BLOCK', payload: { id, updates } })
    },
    [dispatch],
  )

  const updateBlockContent = useCallback(
    (id: string, content: Partial<PageBlock['content']>) => {
      const block = state.page.blocks.find(b => b.id === id)
      if (!block) return
      dispatch({
        type: 'UPDATE_BLOCK',
        payload: { id, updates: { content: { ...block.content, ...content } } },
      })
    },
    [dispatch, state.page.blocks],
  )

  const updateBlockStyle = useCallback(
    (id: string, style: Partial<PageBlock['style']>) => {
      const block = state.page.blocks.find(b => b.id === id)
      if (!block) return
      dispatch({
        type: 'UPDATE_BLOCK',
        payload: { id, updates: { style: { ...block.style, ...style } } },
      })
    },
    [dispatch, state.page.blocks],
  )

  const moveBlock = useCallback(
    (fromIndex: number, toIndex: number) => {
      dispatch({ type: 'MOVE_BLOCK', payload: { fromIndex, toIndex } })
    },
    [dispatch],
  )

  const duplicateBlock = useCallback(
    (id: string) => {
      dispatch({ type: 'DUPLICATE_BLOCK', payload: id })
    },
    [dispatch],
  )

  const selectBlock = useCallback(
    (id: string | null) => {
      dispatch({ type: 'SELECT_BLOCK', payload: id })
    },
    [dispatch],
  )

  const hoverBlock = useCallback(
    (id: string | null) => {
      dispatch({ type: 'HOVER_BLOCK', payload: id })
    },
    [dispatch],
  )

  const toggleBlockVisibility = useCallback(
    (id: string) => {
      dispatch({ type: 'TOGGLE_BLOCK_VISIBILITY', payload: id })
    },
    [dispatch],
  )

  const toggleBlockLock = useCallback(
    (id: string) => {
      dispatch({ type: 'TOGGLE_BLOCK_LOCK', payload: id })
    },
    [dispatch],
  )

  const replaceAllBlocks = useCallback(
    (blocks: PageBlock[]) => {
      dispatch({ type: 'REPLACE_ALL_BLOCKS', payload: blocks })
    },
    [dispatch],
  )

  const setDevicePreview = useCallback(
    (device: DevicePreview) => {
      dispatch({ type: 'SET_DEVICE_PREVIEW', payload: device })
    },
    [dispatch],
  )

  const setZoom = useCallback(
    (zoom: number) => {
      dispatch({ type: 'SET_ZOOM', payload: zoom })
    },
    [dispatch],
  )

  const toggleGrid = useCallback(() => {
    dispatch({ type: 'TOGGLE_GRID' })
  }, [dispatch])

  const setDragging = useCallback(
    (isDragging: boolean) => {
      dispatch({ type: 'SET_DRAGGING', payload: isDragging })
    },
    [dispatch],
  )

  const undo = useCallback(() => {
    dispatch({ type: 'UNDO' })
  }, [dispatch])

  const redo = useCallback(() => {
    dispatch({ type: 'REDO' })
  }, [dispatch])

  const setRightPanel = useCallback(
    (panel: EditorState['rightPanel']) => {
      dispatch({ type: 'SET_RIGHT_PANEL', payload: panel })
    },
    [dispatch],
  )

  const toggleLeftPanel = useCallback(() => {
    dispatch({ type: 'TOGGLE_LEFT_PANEL' })
  }, [dispatch])

  const setSaving = useCallback(
    (saving: boolean) => {
      dispatch({ type: 'SET_SAVING', payload: saving })
    },
    [dispatch],
  )

  const markSaved = useCallback(() => {
    dispatch({ type: 'MARK_SAVED' })
  }, [dispatch])

  const updatePageMeta = useCallback(
    (meta: Partial<Pick<LandingPage, 'title' | 'slug' | 'description' | 'seo'>>) => {
      dispatch({ type: 'UPDATE_PAGE_META', payload: meta })
    },
    [dispatch],
  )

  return {
    // State (read-only convenience)
    state,
    page: state.page,
    editor: state.editor,
    blocks: state.page.blocks,
    selectedBlockId: state.editor.selectedBlockId,
    selectedBlock: state.page.blocks.find(b => b.id === state.editor.selectedBlockId) ?? null,
    canUndo: state.editor.undoStack.length > 0,
    canRedo: state.editor.redoStack.length > 0,
    hasUnsavedChanges: state.editor.hasUnsavedChanges,

    // Raw dispatch (escape hatch)
    dispatch,

    // Block mutations
    addBlock,
    removeBlock,
    updateBlock,
    updateBlockContent,
    updateBlockStyle,
    moveBlock,
    duplicateBlock,
    toggleBlockVisibility,
    toggleBlockLock,
    replaceAllBlocks,

    // Selection
    selectBlock,
    hoverBlock,

    // Viewport
    setDevicePreview,
    setZoom,
    toggleGrid,
    setDragging,

    // History
    undo,
    redo,

    // Panels
    setRightPanel,
    toggleLeftPanel,

    // Persistence
    setSaving,
    markSaved,

    // Page metadata
    updatePageMeta,
  } as const
}

// ─────────────────────────────────────────────
// Selector helpers
// ─────────────────────────────────────────────

/** Get a block by ID from the current page state. */
export function selectBlockById(state: FullEditorState, blockId: string): PageBlock | undefined {
  return state.page.blocks.find(b => b.id === blockId)
}

/** Get the index of a block by ID. Returns -1 if not found. */
export function selectBlockIndex(state: FullEditorState, blockId: string): number {
  return state.page.blocks.findIndex(b => b.id === blockId)
}

/** Check whether undo is possible. */
export function selectCanUndo(state: FullEditorState): boolean {
  return state.editor.undoStack.length > 0
}

/** Check whether redo is possible. */
export function selectCanRedo(state: FullEditorState): boolean {
  return state.editor.redoStack.length > 0
}

/** Get the currently selected block (or null). */
export function selectSelectedBlock(state: FullEditorState): PageBlock | null {
  if (!state.editor.selectedBlockId) return null
  return state.page.blocks.find(b => b.id === state.editor.selectedBlockId) ?? null
}

/** Get only visible blocks in order. */
export function selectVisibleBlocks(state: FullEditorState): PageBlock[] {
  return state.page.blocks.filter(b => b.visible)
}
