/**
 * App.tsx — 小红书排版工具 v2
 *
 * 核心功能：
 * - Markdown 编辑与实时预览
 * - 模板系统（6 种内置模板）
 * - 图片可视化编辑（拖拽/缩放/浮动布局）
 * - 所见即所得预览与逐页导出
 * - 内容健康度评估
 * - 多格式导出
 */

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";
import type { EditorSettings, ThemeConfig } from "@/types";
import { ACTIVE_DECOR_KEY, defaultSettings, loadStoredSettings, persistSettings } from "@/store/store";
import { expandPbnImages, collapseDataImagesToPlaceholders } from "@/markdown/pbnImages";
import { exportAndDownload } from "@/slicer/slicer";
import { TemplateGallery } from "@/components/TemplateGallery";
import { NotePreviewCard } from "@/components/NotePreviewCard";
import { ComponentSidebar } from "@/components/ComponentSidebar";
import { TemplateQuickSelect } from "@/components/TemplateQuickSelect";
import { LandingPage } from "@/components/LandingPage";
import { applyTemplate, getAllTemplates } from "@/templates/index";
import type { DecorationConfig, NoteTemplate } from "@/templates/index";
import {
  findPageTemplateBlocks,
  getPageTemplateDefinitions,
  type PageTemplateDefinition,
} from "@/page-templates";
import {
  parseMarkdownToDocument,
  serializeDocumentToMarkdown,
} from "@/document/markdown";
import type { VisualDocument } from "@/document/types";

import { EmojiPanel } from "@/panels/EmojiPanel";
import { QuickInsertPanel } from "@/panels/QuickInsertPanel";
import { SettingsPanel } from "@/panels/SettingsPanel";
import { LiveBadge } from "@/components/LiveBadge";

type SelectionToolbarState = {
  open: boolean;
  top: number;
  left: number;
  start: number;
  end: number;
};

type TemplateSafeSegment = {
  start: number;
  end: number;
};

const EDITOR_PANE_WIDTH_KEY = "xhs_paiban_editor_pane_width_v1";
const COMPONENT_SIDEBAR_COLLAPSED_KEY = "xhs_paiban_component_sidebar_collapsed_v1";
const DEFAULT_EDITOR_PANE_PERCENT = 46;
const MIN_EDITOR_PANE_PERCENT = 30;
const MAX_EDITOR_PANE_PERCENT = 72;

function clampEditorPanePercent(value: number): number {
  if (!Number.isFinite(value)) return DEFAULT_EDITOR_PANE_PERCENT;
  return Math.min(MAX_EDITOR_PANE_PERCENT, Math.max(MIN_EDITOR_PANE_PERCENT, value));
}

function loadStoredEditorPanePercent(): number {
  try {
    const raw = localStorage.getItem(EDITOR_PANE_WIDTH_KEY);
    if (!raw) return DEFAULT_EDITOR_PANE_PERCENT;
    return clampEditorPanePercent(Number(raw));
  } catch {
    return DEFAULT_EDITOR_PANE_PERCENT;
  }
}

function loadStoredComponentSidebarCollapsed(): boolean {
  try {
    return localStorage.getItem(COMPONENT_SIDEBAR_COLLAPSED_KEY) === "true";
  } catch {
    return false;
  }
}

function buildXhsInlineStyle(options: {
  size?: "sm" | "md" | "lg" | string;
  color?: "accent" | "red" | "green" | "blue" | string;
  highlight?: "soft";
}): string {
  const tokens: string[] = [];
  if (options.size && options.size !== "md") tokens.push(`size:${options.size}`);
  if (options.color) tokens.push(`color:${options.color}`);
  if (options.highlight) tokens.push(`highlight:${options.highlight}`);
  return tokens.join(";");
}

function getTemplateSafeValueSegments(
  markdown: string,
  start: number,
  end: number
): TemplateSafeSegment[] | null {
  const block = findPageTemplateBlocks(markdown).find((item) => {
    const blockStart = item.index;
    const blockEnd = item.index + item.rawMarkdown.length;
    return start >= blockStart && end <= blockEnd;
  });

  if (!block) return null;

  const contentStart = block.index + block.rawMarkdown.indexOf("\n") + 1;
  const contentEnd = block.index + block.rawMarkdown.lastIndexOf("\n```");
  const content = markdown.slice(contentStart, contentEnd);
  const lines = content.split("\n");
  const segments: TemplateSafeSegment[] = [];
  let cursor = contentStart;

  lines.forEach((line) => {
    const lineStart = cursor;
    const lineEnd = cursor + line.length;
    cursor = lineEnd + 1;

    const matchers = [
      /^(\s*-\s+[^:\n]+:\s+)(.+)$/,
      /^(\s*[^:\n]+:\s+)(.+)$/,
      /^(\s*-\s+)(.+)$/,
    ];

    const match = matchers
      .map((pattern) => line.match(pattern))
      .find((value): value is RegExpMatchArray => Boolean(value));

    if (!match) return;

    const valueStart = lineStart + match[1].length;
    const valueEnd = lineEnd;
    const segmentStart = Math.max(start, valueStart);
    const segmentEnd = Math.min(end, valueEnd);

    if (segmentStart < segmentEnd) {
      segments.push({ start: segmentStart, end: segmentEnd });
    }
  });

  return segments;
}

// ============================================================
// 主应用
// ============================================================

const DEFAULT_MD = `# 读 Claude Code：Agent 为什么也要「做梦」

每次新开会话，上下文其实是空的。

**Claude Code** 靠两套东西跨会话延续：\`CLAUDE.md\`（你写的规则）和 **auto memory**（它自己记的笔记）。

官方文档里写得很直白：\`MEMORY.md\` 每次只自动加载前 **200 行** 或 **25KB**。

这和「显存不够」是同一类问题：**工作记忆有限，就必须做离线整理。**

> 小结：读源码不是为了背目录，而是为了建立「循环 + 工具 + 上下文预算」的直觉。

---

下一篇再写我怎么用 \`/memory\` 做月度清理。`;

function loadStoredDecorations(): DecorationConfig | null {
  try {
    const raw = localStorage.getItem(ACTIVE_DECOR_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as DecorationConfig;
  } catch {
    return null;
  }
}

function persistDecorations(decorations: DecorationConfig | null): void {
  try {
    if (decorations) {
      localStorage.setItem(ACTIVE_DECOR_KEY, JSON.stringify(decorations));
    } else {
      localStorage.removeItem(ACTIVE_DECOR_KEY);
    }
  } catch {
    /* quota / private mode */
  }
}

export function App() {
  const [view, setView] = useState<"landing" | "editor">(() =>
    window.location.hash === "#editor" ? "editor" : "landing"
  );
  const [markdown, setMarkdown] = useState("");
  const [visualDocument, setVisualDocument] = useState<VisualDocument>({ blocks: [] });
  const [settings, setSettings] = useState<EditorSettings>(() => loadStoredSettings());
  const [activeDecorations, setActiveDecorations] = useState<DecorationConfig | null>(() => loadStoredDecorations());
  const [liveText, setLiveText] = useState("");
  const [liveError, setLiveError] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [quickInsertOpen, setQuickInsertOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [templateGalleryOpen, setTemplateGalleryOpen] = useState(false);
  const [editorHidden, setEditorHidden] = useState(false);
  const [componentSidebarCollapsed, setComponentSidebarCollapsed] = useState(() =>
    loadStoredComponentSidebarCollapsed()
  );
  const [editorPanePercent, setEditorPanePercent] = useState(() =>
    loadStoredEditorPanePercent()
  );
  const [editorPaneResizing, setEditorPaneResizing] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [embeddedAssets, setEmbeddedAssets] = useState<Record<string, string>>({});
  const [mdStorageReady, setMdStorageReady] = useState(false);
  const [inlineStyleDraft, setInlineStyleDraft] = useState({ size: "16", color: "#c8642f" });
  const [selectionToolbar, setSelectionToolbar] = useState<SelectionToolbarState>({
    open: false,
    top: 0,
    left: 0,
    start: 0,
    end: 0,
  });
  const liveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const mdSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const settingsSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const layoutRef = useRef<HTMLDivElement>(null);
  const editorBodyRef = useRef<HTMLDivElement>(null);
  const previewScrollRef = useRef<HTMLDivElement>(null);
  const scrollSyncLockRef = useRef(false);
  const pageTemplates = useMemo(() => getPageTemplateDefinitions(), []);
  const allTemplates = useMemo(() => getAllTemplates(), []);

  const enterEditor = useCallback(() => {
    setView("editor");
    if (window.location.hash !== "#editor") {
      window.history.replaceState(null, "", "#editor");
    }
  }, []);

  const applyScrollRatio = useCallback(
    (from: "editor" | "preview") => {
      if (scrollSyncLockRef.current) return;
      const ta = textareaRef.current;
      const pv = previewScrollRef.current;
      if (!ta || !pv) return;
      const maxT = ta.scrollHeight - ta.clientHeight;
      const maxP = pv.scrollHeight - pv.clientHeight;
      scrollSyncLockRef.current = true;
      if (from === "editor") {
        if (maxT <= 0) pv.scrollTop = 0;
        else {
          const ratio = ta.scrollTop / maxT;
          pv.scrollTop = maxP <= 0 ? 0 : ratio * maxP;
        }
      } else {
        if (maxP <= 0) ta.scrollTop = 0;
        else {
          const ratio = pv.scrollTop / maxP;
          ta.scrollTop = maxT <= 0 ? 0 : ratio * maxT;
        }
      }
      requestAnimationFrame(() => { scrollSyncLockRef.current = false; });
    },
    []
  );

  const appLayoutStyle = useMemo(
    () => ({ "--app-editor-w": `${editorPanePercent}%` }) as CSSProperties,
    [editorPanePercent]
  );

  useEffect(() => {
    try {
      localStorage.setItem(COMPONENT_SIDEBAR_COLLAPSED_KEY, String(componentSidebarCollapsed));
    } catch {
      /* quota / private mode */
    }
  }, [componentSidebarCollapsed]);

  useEffect(() => {
    try {
      localStorage.setItem(EDITOR_PANE_WIDTH_KEY, String(editorPanePercent));
    } catch {
      /* quota / private mode */
    }
  }, [editorPanePercent]);

  const handleLayoutResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      if (editorHidden) return;
      const layout = layoutRef.current;
      if (!layout) return;
      const rect = layout.getBoundingClientRect();
      if (rect.width <= 0) return;

      event.preventDefault();
      setEditorPaneResizing(true);

      const minEditorPx = componentSidebarCollapsed ? 390 : 560;
      const minPreviewPx = 420;
      const maxEditorPx = Math.max(minEditorPx, rect.width - minPreviewPx);

      const updateFromClientX = (clientX: number) => {
        const rawWidth = clientX - rect.left;
        const nextWidth = Math.min(maxEditorPx, Math.max(minEditorPx, rawWidth));
        const nextPercent = Math.round((nextWidth / rect.width) * 1000) / 10;
        setEditorPanePercent(clampEditorPanePercent(nextPercent));
      };

      const previousCursor = document.body.style.cursor;
      const previousUserSelect = document.body.style.userSelect;
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";

      const handlePointerMove = (moveEvent: PointerEvent) => {
        updateFromClientX(moveEvent.clientX);
      };

      const stopResize = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", stopResize);
        window.removeEventListener("pointercancel", stopResize);
        document.body.style.cursor = previousCursor;
        document.body.style.userSelect = previousUserSelect;
        setEditorPaneResizing(false);
      };

      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", stopResize);
      window.addEventListener("pointercancel", stopResize);
    },
    [componentSidebarCollapsed, editorHidden]
  );

  const handleLayoutResizeKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home" && event.key !== "End") {
        return;
      }
      event.preventDefault();
      if (event.key === "Home") {
        setEditorPanePercent(MIN_EDITOR_PANE_PERCENT);
        return;
      }
      if (event.key === "End") {
        setEditorPanePercent(MAX_EDITOR_PANE_PERCENT);
        return;
      }
      const delta = event.key === "ArrowLeft" ? -3 : 3;
      setEditorPanePercent((prev) => clampEditorPanePercent(prev + delta));
    },
    []
  );

  // ---- 初始化 ----
  useEffect(() => {
    try {
      const rawMd = localStorage.getItem("xhs_paiban_md_v1");
      if (!rawMd) {
        setMarkdown(DEFAULT_MD);
        setVisualDocument(parseMarkdownToDocument(DEFAULT_MD));
        setEmbeddedAssets({});
        setMdStorageReady(true);
        return;
      }
      const parsed = JSON.parse(rawMd) as { text?: string; assets?: Record<string, string> };
      const rawText = typeof parsed.text === "string" ? parsed.text : DEFAULT_MD;
      const base = parsed.assets && typeof parsed.assets === "object" && !Array.isArray(parsed.assets) ? parsed.assets : {};
      const { md, assets } = collapseDataImagesToPlaceholders(rawText, base);
      setMarkdown(md);
      setVisualDocument(parseMarkdownToDocument(md));
      setEmbeddedAssets(assets);
    } catch {
      setMarkdown(DEFAULT_MD);
      setVisualDocument(parseMarkdownToDocument(DEFAULT_MD));
      setEmbeddedAssets({});
    }
    setMdStorageReady(true);
  }, []);

  // ---- 设置持久化 ----
  useEffect(() => {
    if (settingsSaveTimerRef.current) clearTimeout(settingsSaveTimerRef.current);
    settingsSaveTimerRef.current = setTimeout(() => { persistSettings(settings); }, 450);
    return () => { if (settingsSaveTimerRef.current) clearTimeout(settingsSaveTimerRef.current); };
  }, [settings]);

  // ---- Live 渲染防抖 ----
  const scheduleLive = useCallback(() => {
    if (liveTimerRef.current) clearTimeout(liveTimerRef.current);
    liveTimerRef.current = setTimeout(() => {
      setLiveText("已同步");
      setLiveError(false);
      setTimeout(() => setLiveText(""), 900);
    }, 150);
  }, []);

  // ---- Markdown 保存 ----
  useEffect(() => {
    if (!mdStorageReady) return;
    if (mdSaveTimerRef.current) clearTimeout(mdSaveTimerRef.current);
    mdSaveTimerRef.current = setTimeout(() => {
      try {
        localStorage.setItem("xhs_paiban_md_v1", JSON.stringify({ text: markdown, assets: embeddedAssets, ts: Date.now() }));
      } catch { /* quota / private mode */ }
    }, 900);
    return () => { if (mdSaveTimerRef.current) clearTimeout(mdSaveTimerRef.current); };
  }, [markdown, embeddedAssets, mdStorageReady]);

  const commitMarkdown = useCallback(
    (raw: string) => {
      setEmbeddedAssets((prev) => {
        const { md, assets } = collapseDataImagesToPlaceholders(raw, prev);
        setMarkdown(md);
        setVisualDocument(parseMarkdownToDocument(md));
        return assets;
      });
      scheduleLive();
    },
    [scheduleLive]
  );

  const commitDocument = useCallback(
    (next: VisualDocument) => {
      const nextMarkdown = serializeDocumentToMarkdown(next);
      setVisualDocument(next);
      setMarkdown(nextMarkdown);
      scheduleLive();
    },
    [scheduleLive]
  );

  const updateSelectionToolbar = useCallback(() => {
    const ta = textareaRef.current;
    const container = editorBodyRef.current;
    if (!ta || !container || document.activeElement !== ta) {
      setSelectionToolbar((prev) => (prev.open ? { ...prev, open: false } : prev));
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) {
      setSelectionToolbar((prev) => (prev.open ? { ...prev, open: false } : prev));
      return;
    }
    const before = ta.value.slice(0, start);
    const line = before.split("\n").length - 1;
    const containerRect = container.getBoundingClientRect();
    const estimatedTop = containerRect.top + 28 + line * 22 - ta.scrollTop - 56;
    const toolbarWidth = 420;
    const margin = 16;
    const top = Math.max(margin, Math.min(window.innerHeight - 72, estimatedTop));
    const left = Math.max(
      margin,
      Math.min(window.innerWidth - toolbarWidth - margin, containerRect.left + 24)
    );
    setSelectionToolbar({ open: true, top, left, start, end });
  }, []);

  function applySelectionMarkup(transform: (selected: string) => string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    if (start === end) return;
    const safeSegments = getTemplateSafeValueSegments(ta.value, start, end);

    if (safeSegments) {
      if (safeSegments.length === 0) {
        setLiveText("模板块里只能修改值内容，不能改结构键");
        setLiveError(true);
        setTimeout(() => setLiveText(""), 1800);
        return;
      }

      let next = ta.value;
      let offset = 0;
      let lastCursor = end;

      safeSegments.forEach((segment) => {
        const segmentStart = segment.start + offset;
        const segmentEnd = segment.end + offset;
        const selected = next.slice(segmentStart, segmentEnd);
        const wrapped = transform(selected);
        next = next.slice(0, segmentStart) + wrapped + next.slice(segmentEnd);
        offset += wrapped.length - (segmentEnd - segmentStart);
        lastCursor = segmentStart + wrapped.length;
      });

      commitMarkdown(next);
      setLiveText("已在模板值区应用样式");
      setLiveError(false);
      setTimeout(() => setLiveText(""), 1400);
      requestAnimationFrame(() => {
        ta.focus();
        ta.setSelectionRange(lastCursor, lastCursor);
        updateSelectionToolbar();
      });
      return;
    }

    const selected = ta.value.slice(start, end);
    const wrapped = transform(selected);
    const next = ta.value.slice(0, start) + wrapped + ta.value.slice(end);
    commitMarkdown(next);
    requestAnimationFrame(() => {
      ta.focus();
      const cursor = start + wrapped.length;
      ta.setSelectionRange(cursor, cursor);
      updateSelectionToolbar();
    });
  }

  function applyInlineXhsStyle(style: string) {
    applySelectionMarkup((selected) => `<xhs style="${style}">${selected}</xhs>`);
  }

  function clearInlineMarkup() {
    applySelectionMarkup((selected) =>
      selected
        .replace(/<xhs\s+style="[^"]*">([\s\S]+?)<\/xhs>/g, "$1")
        .replace(/\*\*([\s\S]+?)\*\*/g, "$1")
        .replace(/\*([\s\S]+?)\*/g, "$1")
    );
  }

  function handleMdChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    commitMarkdown(e.target.value);
    requestAnimationFrame(updateSelectionToolbar);
  }

  function handleEmojiSelect(emoji: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const ins = emoji + (start === end ? "" : ta.value.substring(start, end));
    const newVal = ta.value.substring(0, start) + ins + ta.value.substring(end);
    commitMarkdown(newVal);
    ta.focus();
    ta.setSelectionRange(start + emoji.length, start + emoji.length);
  }

  function handleQuickInsert(prefix: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const newVal = ta.value.substring(0, start) + prefix + ta.value.substring(start);
    commitMarkdown(newVal);
    ta.focus();
    ta.setSelectionRange(start + prefix.length, start + prefix.length);
  }

  function handleQuickWrap(before: string, after: string) {
    const ta = textareaRef.current;
    if (!ta) return;
    const s = ta.selectionStart;
    const e = ta.selectionEnd;
    const sel = ta.value.substring(s, e);
    const defaults: Record<string, string> = { "**": "粗体", "*": "斜体", "~~": "删除" };
    const mid = sel || defaults[before] || "文字";
    const newVal = ta.value.substring(0, s) + before + mid + after + ta.value.substring(e);
    commitMarkdown(newVal);
    ta.focus();
    const endPos = s + before.length + mid.length + after.length;
    if (!sel) {
      ta.setSelectionRange(s + before.length, s + before.length + mid.length);
    } else {
      ta.setSelectionRange(endPos, endPos);
    }
  }

  function handleInsertImage() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        const ta = textareaRef.current;
        if (!ta) return;
        const pos = ta.selectionStart;
        const id = crypto.randomUUID();
        const md = `\n![${file.name}](pbn:img/${id})\n`;
        const newVal = ta.value.substring(0, pos) + md + ta.value.substring(pos);
        setEmbeddedAssets((prev) => ({ ...prev, [id]: dataUrl }));
        setMarkdown(newVal);
        setVisualDocument(parseMarkdownToDocument(newVal));
        ta.focus();
        scheduleLive();
        setLiveText(`图片已插入：${file.name}`);
        setLiveError(false);
        setTimeout(() => setLiveText(""), 3000);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  function insertSnippet(snippet: string, mode: "cursor" | "append" = "cursor") {
    const ta = textareaRef.current;
    if (!ta) {
      commitMarkdown(markdown + snippet);
      return;
    }
    const insertAt = mode === "append" ? ta.value.length : ta.selectionStart;
    const next = ta.value.slice(0, insertAt) + snippet + ta.value.slice(insertAt);
    commitMarkdown(next);
    requestAnimationFrame(() => {
      ta.focus();
      const titleIndex = next.indexOf("title:", insertAt);
      if (titleIndex >= 0) {
        const cursor = titleIndex + "title: ".length;
        ta.setSelectionRange(cursor, cursor);
        return;
      }
      const cursor = insertAt + snippet.length;
      ta.setSelectionRange(cursor, cursor);
    });
  }

  function handleInsertPageTemplate(template: PageTemplateDefinition) {
    insertSnippet(template.skeleton, "cursor");
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    e.preventDefault();
    const file = imageItem.getAsFile();
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      const ta = textareaRef.current;
      if (!ta) return;
      const pos = ta.selectionStart;
      const id = crypto.randomUUID();
      const md = `\n![粘贴图片](pbn:img/${id})\n`;
      const newVal = ta.value.substring(0, pos) + md + ta.value.substring(pos);
      setEmbeddedAssets((prev) => ({ ...prev, [id]: dataUrl }));
      setMarkdown(newVal);
      setVisualDocument(parseMarkdownToDocument(newVal));
      ta.focus();
      ta.setSelectionRange(pos + md.length, pos + md.length);
      scheduleLive();
      setLiveText(`图片已粘贴（${(file.size / 1024).toFixed(0)}KB）`);
      setLiveError(false);
      setTimeout(() => setLiveText(""), 3000);
    };
    reader.readAsDataURL(file);
  }

  function handleLoadMd() {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".md,.markdown,.txt";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return;
      file.text().then((text: string) => {
        setEmbeddedAssets((prev) => {
          const { md, assets } = collapseDataImagesToPlaceholders(text, prev);
          setMarkdown(md);
          setVisualDocument(parseMarkdownToDocument(md));
          return assets;
        });
        setLiveText(`已加载：${file.name}`);
        setLiveError(false);
        setTimeout(() => setLiveText(""), 3000);
      }).catch(() => {
        setLiveText("加载失败");
        setLiveError(true);
        setTimeout(() => setLiveText(""), 3000);
      });
    };
    input.click();
  }

  function handleDownloadMd() {
    const body = expandPbnImages(
      serializeDocumentToMarkdown(visualDocument),
      embeddedAssets
    );
    const blob = new Blob([body], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `xhs-note-${Date.now()}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleExport() {
    const el = document.getElementById("capture-target") as HTMLElement | null;
    if (!el) { setLiveText("导出失败：未找到卡片"); setLiveError(true); return; }
    setExporting(true);
    setLiveText("正在截图...");
    try {
      await new Promise((r) => setTimeout(r, 120));
      await document.fonts.ready;
      const total = await exportAndDownload(el, settings as unknown as ThemeConfig, {
        scale: 2,
        aspectRatio: settings.aspectRatio,
        onProgress: (current, totalPages) => {
          setLiveText(`正在导出 ${current}/${totalPages}...`);
        },
      });
      setLiveText(`已导出 ${total} 张图片`);
      setLiveError(false);
      setTimeout(() => setLiveText(""), 5000);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "导出失败";
      setLiveText(msg);
      setLiveError(true);
      setTimeout(() => setLiveText(""), 5000);
    } finally {
      setExporting(false);
    }
  }

  function handleUpdate(patch: Partial<EditorSettings>) {
    setSettings((prev) => ({ ...prev, ...patch }));
  }

  function handleResetSettings() {
    setSettings(defaultSettings());
    setActiveDecorations(null);
    persistDecorations(null);
  }

  // 应用模板
  function handleApplyTemplate(template: NoteTemplate) {
    const newSettings = applyTemplate(template, settings as unknown as ThemeConfig);
    setSettings((prev) => ({ ...prev, ...newSettings }));
    setActiveDecorations(template.decorations);
    persistDecorations(template.decorations);
    setLiveText(`已应用「${template.name}」模板`);
    setLiveError(false);
    setTimeout(() => setLiveText(""), 2000);
  }

  function handleLandingTemplate(template: NoteTemplate) {
    handleApplyTemplate(template);
    enterEditor();
  }

  // ---- 快捷键 ----
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setSettingsOpen(false);
        setEmojiOpen(false);
        setQuickInsertOpen(false);
        setTemplateGalleryOpen(false);
      }
      // Ctrl/Cmd + S 保存
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        scheduleLive();
      }
      // Ctrl/Cmd + E 导出
      if ((e.ctrlKey || e.metaKey) && e.key === "e") {
        e.preventDefault();
        handleExport();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [scheduleLive]);

  function openTemplateGalleryFromLanding() {
    enterEditor();
    requestAnimationFrame(() => setTemplateGalleryOpen(true));
  }

  if (view === "landing") {
    return (
      <LandingPage
        templates={allTemplates}
        onStart={enterEditor}
        onOpenTemplates={openTemplateGalleryFromLanding}
        onUseTemplate={handleLandingTemplate}
      />
    );
  }

  return (
    <>
      {/* 工具条：主按钮区可换行，同步状态固定在同一行右侧 */}
      <div className="toolbar">
        <div className="toolbar-main">
          <button onClick={() => {
            setView("landing");
            window.history.replaceState(null, "", window.location.pathname);
          }}>首页</button>
          <button className="primary" onClick={scheduleLive}>刷新预览</button>
          <button onClick={() => setEditorHidden((h) => !h)}>
            {editorHidden ? "显示编辑区" : "隐藏编辑区"}
          </button>

          <TemplateQuickSelect
            onSelect={handleApplyTemplate}
            onOpenGallery={() => setTemplateGalleryOpen(true)}
          />

          <div className="aspect-ratio-switcher" aria-label="导出比例">
            {(["3:4", "3:5"] as const).map((ratio) => (
              <button
                key={ratio}
                type="button"
                className={settings.aspectRatio === ratio ? "active" : ""}
                onClick={() => handleUpdate({ aspectRatio: ratio })}
                aria-pressed={settings.aspectRatio === ratio}
              >
                {ratio}
              </button>
            ))}
          </div>

          <button onClick={() => setEmojiOpen((o) => !o)}>表情</button>
          <button onClick={() => setQuickInsertOpen((o) => !o)}>插入</button>
          <button onClick={handleInsertImage}>插图</button>
          <div className="sep" />

          {/* 图片布局帮助 */}
          <button
            onClick={() => setLiveText("提示：在 Markdown 中使用 ![alt](url?w=80&r=8) 或 ![alt](url?w=100&layout=full-width) 控制图片")}
            title="图片布局语法"
            style={{ fontSize: "11px", color: "#888" }}
          >
            📖
          </button>

          <button onClick={() => setSettingsOpen(true)}>设置</button>
          <button
            className="accent"
            onClick={handleExport}
            disabled={exporting || !markdown.trim()}
          >
            {exporting ? "导出中..." : `导出多图 ${settings.aspectRatio}`}
          </button>
          <button onClick={handleDownloadMd}>下载 .md</button>
          <button onClick={handleLoadMd}>加载 .md</button>
        </div>
        <div className="toolbar-status">
          <LiveBadge text={liveText} isError={liveError} />
        </div>
      </div>

      <EmojiPanel open={emojiOpen} onSelect={handleEmojiSelect} onClose={() => setEmojiOpen(false)} />

      <QuickInsertPanel
        open={quickInsertOpen}
        onInsert={handleQuickInsert}
        onWrap={handleQuickWrap}
        onClose={() => setQuickInsertOpen(false)}
      />

      <SettingsPanel
        settings={settings}
        onUpdate={handleUpdate}
        onReset={handleResetSettings}
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />

      <TemplateGallery
        open={templateGalleryOpen}
        onApply={handleApplyTemplate}
        onClose={() => setTemplateGalleryOpen(false)}
      />

      {/* 主内容 */}
      <div
        className={`app-layout${editorPaneResizing ? " app-layout--resizing" : ""}`}
        ref={layoutRef}
        style={appLayoutStyle}
      >

        {/* 编辑区 */}
        {!editorHidden && (
          <div className="pane-editor">
            <div className={`pane-editor-shell${componentSidebarCollapsed ? " pane-editor-shell--components-collapsed" : ""}`}>
              <ComponentSidebar
                templates={pageTemplates}
                onInsertSnippet={insertSnippet}
                collapsed={componentSidebarCollapsed}
                onCollapsedChange={setComponentSidebarCollapsed}
              />

              <div className="editor-workspace">
                <div className="editor-bar">
                  <button onClick={() => handleUpdate({ font: "serif" })}>宋</button>
                  <button onClick={() => handleUpdate({ font: "sans" })}>黑</button>
                  <button onClick={() => handleUpdate({ font: "mono" })}>等</button>
                  <div className="bar-sep" />
                  <button onClick={() => {
                    const ta = textareaRef.current;
                    if (!ta) return;
                    const s = ta.selectionStart, e = ta.selectionEnd;
                    const sel = ta.value.substring(s, e) || "粗体";
                    ta.value = ta.value.substring(0, s) + `**${sel}**` + ta.value.substring(e);
                    commitMarkdown(ta.value);
                    ta.focus();
                  }}>B</button>
                  <button onClick={() => {
                    const ta = textareaRef.current;
                    if (!ta) return;
                    const s = ta.selectionStart, e = ta.selectionEnd;
                    const sel = ta.value.substring(s, e) || "斜体";
                    ta.value = ta.value.substring(0, s) + `*${sel}*` + ta.value.substring(e);
                    commitMarkdown(ta.value);
                    ta.focus();
                  }}>I</button>
                  <div className="bar-sep" />
                  <button onClick={() => {
                    const ta = textareaRef.current;
                    if (!ta) return;
                    const s = ta.selectionStart;
                    ta.value = ta.value.substring(0, s) + `## ` + ta.value.substring(s);
                    commitMarkdown(ta.value);
                    ta.focus();
                  }}>H</button>
                  <div className="bar-sep" />
                  <button onClick={() => handleInsertPageTemplate(pageTemplates[0])}>封面页</button>
                  <button onClick={() => insertSnippet("\n---\n", "cursor")}>分隔</button>
                </div>
                <div className="pane-editor-body" ref={editorBodyRef}>
                  <textarea
                    id="md-editor"
                    ref={textareaRef}
                    value={markdown}
                    onChange={handleMdChange}
                    onPaste={handlePaste}
                    onSelect={updateSelectionToolbar}
                    onKeyUp={updateSelectionToolbar}
                    onMouseUp={updateSelectionToolbar}
                    onScroll={() => { applyScrollRatio("editor"); updateSelectionToolbar(); }}
                    onBlur={() => setSelectionToolbar((prev) => ({ ...prev, open: false }))}
                    placeholder="在这里输入 Markdown..."
                    spellCheck={false}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {!editorHidden && (
          <div
            className="layout-resizer"
            role="separator"
            aria-label="调整编辑区和预览区宽度"
            aria-orientation="vertical"
            aria-valuemin={MIN_EDITOR_PANE_PERCENT}
            aria-valuemax={MAX_EDITOR_PANE_PERCENT}
            aria-valuenow={Math.round(editorPanePercent)}
            tabIndex={0}
            title="拖拽调整编辑区和预览区宽度，双击恢复默认"
            onPointerDown={handleLayoutResizeStart}
            onDoubleClick={() => setEditorPanePercent(DEFAULT_EDITOR_PANE_PERCENT)}
            onKeyDown={handleLayoutResizeKeyDown}
          >
            <span />
          </div>
        )}

        {/* 预览区 */}
        <div className="pane-preview">
          <div
            className="preview-scroll"
            ref={previewScrollRef}
            onScroll={() => applyScrollRatio("preview")}
          >
            <NotePreviewCard
              visualDocument={visualDocument}
              embeddedAssets={embeddedAssets}
              settings={settings}
              onDocumentCommitted={commitDocument}
              decorations={activeDecorations}
            />
          </div>
        </div>

        {selectionToolbar.open && (
          <div
            className="selection-toolbar"
            style={{ top: selectionToolbar.top, left: selectionToolbar.left }}
            onMouseDown={(event) => event.preventDefault()}
          >
            <div className="selection-toolbar__group">
              <button type="button" onClick={() => applySelectionMarkup((selected) => `**${selected}**`)}>B</button>
              <button type="button" onClick={() => applySelectionMarkup((selected) => `*${selected}*`)}>I</button>
              <button type="button" onClick={() => applyInlineXhsStyle("highlight:soft")}>高亮</button>
            </div>
            <div className="selection-toolbar__group">
              <button type="button" onClick={() => applyInlineXhsStyle(buildXhsInlineStyle({ size: "sm" }))}>A-</button>
              <button type="button" onClick={() => applyInlineXhsStyle(buildXhsInlineStyle({ size: "lg" }))}>A+</button>
              <button type="button" onClick={() => applyInlineXhsStyle(buildXhsInlineStyle({ color: "accent" }))}>主题</button>
              <button type="button" onClick={() => applyInlineXhsStyle(buildXhsInlineStyle({ color: "red" }))}>红</button>
              <button type="button" onClick={() => applyInlineXhsStyle(buildXhsInlineStyle({ color: "green" }))}>绿</button>
              <button type="button" onClick={() => applyInlineXhsStyle(buildXhsInlineStyle({ color: "blue" }))}>蓝</button>
            </div>
            <div className="selection-toolbar__group selection-toolbar__group--controls">
              <select
                value={inlineStyleDraft.size}
                onChange={(e) => setInlineStyleDraft((prev) => ({ ...prev, size: e.target.value }))}
              >
                <option value="13">13</option>
                <option value="15">15</option>
                <option value="16">16</option>
                <option value="18">18</option>
                <option value="20">20</option>
                <option value="24">24</option>
              </select>
              <label className="selection-toolbar__color">
                <input
                  type="color"
                  onChange={(e) => setInlineStyleDraft((prev) => ({ ...prev, color: e.target.value }))}
                  value={inlineStyleDraft.color}
                />
              </label>
              <button
                type="button"
                onClick={() => applyInlineXhsStyle(`size:${inlineStyleDraft.size};color:${inlineStyleDraft.color}`)}
              >
                应用
              </button>
              <button type="button" onClick={clearInlineMarkup}>清除</button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
