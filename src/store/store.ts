/**
 * store.ts — 状态管理与持久化
 *
 * 两种模式：
 *   1. 纯 localStorage（默认，跨标签页共享）
 *   2. File System Access API（Chrome/Edge，需 https 或 localhost）
 */

import type { AppState, EditorSettings, NoteProfile } from "@/types";
import { DEFAULT_THEME } from "@/theme";

const MD_KEY = "xhs_paiban_md_v1";
export const SETTINGS_KEY = "xhs_paiban_settings_v1";
export const ACTIVE_DECOR_KEY = "xhs_paiban_active_decor_v1";

// ============================================================
// 默认状态
// ============================================================

export const DEFAULT_PROFILE: NoteProfile = {
  displayName: "正先森AI手记",
  avatarSrc: "/assets/tx.jpg",
  noteDate: "",
};

export function defaultSettings(): EditorSettings {
  return {
    ...DEFAULT_THEME,
    exportCardWidth: 405,
    aspectRatio: "3:4",
    showNoteMeta: true,
    noteMetaPosition: "top",
    noteMetaAlign: "left",
    noteMetaPadLeft: 0,
    noteMetaPadRight: 0,
    displayName: DEFAULT_PROFILE.displayName,
    avatarSrc: DEFAULT_PROFILE.avatarSrc,
    bioLines: [
      "✍️ 不正经的程序员却被人叫正 gie",
      "AI 独立开发者",
      "在做有意思的 AI 产品",
    ],
    noteDate: "",
  };
}

/** 从 localStorage 合并恢复设置（缺省字段用 defaultSettings） */
export function loadStoredSettings(): EditorSettings {
  const base = defaultSettings();
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return base;
    const parsed = JSON.parse(raw) as Partial<EditorSettings>;
    return { ...base, ...parsed };
  } catch {
    return base;
  }
}

export function persistSettings(settings: EditorSettings): void {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    /* quota / private mode */
  }
}

export function defaultState(): AppState {
  return {
    markdown: "",
    settings: defaultSettings(),
    profile: DEFAULT_PROFILE,
    isDirty: false,
    mdFileHandle: null,
  };
}

// ============================================================
// 状态管理器（类 Hooks 风格，纯函数，便于 React useReducer 接入）
// ============================================================

export interface StoreActions {
  setMarkdown: (md: string) => void;
  updateSettings: (patch: Partial<EditorSettings>) => void;
  applyPreset: (preset: Record<string, unknown>) => void;
  resetSettings: () => void;
  persistMarkdown: (md: string) => void;
  loadMarkdown: () => string;
  openFile: (handle: FileSystemFileHandle) => void;
  closeFile: () => void;
}

export function createStore(initial: AppState): {
  state: AppState;
  actions: StoreActions;
  subscribe: (fn: (s: AppState) => void) => () => void;
} {
  let state = initial;
  const listeners = new Set<(s: AppState) => void>();

  function notify() {
    listeners.forEach((fn) => fn(state));
  }

  function setMarkdown(md: string) {
    state = { ...state, markdown: md, isDirty: true };
    notify();
  }

  function updateSettings(patch: Partial<EditorSettings>) {
    state = {
      ...state,
      settings: { ...state.settings, ...patch },
      isDirty: true,
    };
    notify();
  }

  function applyPreset(preset: Record<string, unknown>) {
    state = {
      ...state,
      settings: { ...state.settings, ...preset },
      isDirty: true,
    };
    notify();
  }

  function resetSettings() {
    state = { ...state, settings: defaultSettings(), isDirty: true };
    notify();
  }

  function persistMarkdown(md: string) {
    // 自动防抖保存，不触发 UI 刷新
    try {
      localStorage.setItem(MD_KEY, JSON.stringify({ text: md, ts: Date.now() }));
    } catch {}
  }

  function loadMarkdown(): string {
    try {
      const raw = localStorage.getItem(MD_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return parsed.text ?? "";
      }
    } catch {}
    return "";
  }

  function openFile(handle: FileSystemFileHandle) {
    state = { ...state, mdFileHandle: handle };
    notify();
  }

  function closeFile() {
    state = { ...state, mdFileHandle: null };
    notify();
  }

  const actions: StoreActions = {
    setMarkdown,
    updateSettings,
    applyPreset,
    resetSettings,
    persistMarkdown,
    loadMarkdown,
    openFile,
    closeFile,
  };

  return {
    get state() {
      return state;
    },
    actions,
    subscribe: (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}

// ============================================================
// File System Access API 写回
// ============================================================

export async function writeBackToFile(
  handle: FileSystemFileHandle,
  content: string
): Promise<void> {
  try {
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch (err) {
    console.error("[paiban] 文件写回失败：", err);
    throw err;
  }
}

export async function readFileHandle(
  handle: FileSystemFileHandle
): Promise<string> {
  const file = await handle.getFile();
  return await file.text();
}
