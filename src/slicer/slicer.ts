/**
 * slicer.ts — 智能切片与导出引擎
 *
 * 核心设计：
 * - 导出不修改主文档 DOM 样式（避免卡顿）
 * - html2canvas 的 onclone 只补齐真实预览页的计算后样式，不重新排版
 * - 背景在克隆根节点和 canvas 底色上同时兜底，避免透明导出
 * - 预览已经完成分页，导出逐页捕获同一批 DOM，保证所见即所得
 */

import html2canvas from "html2canvas";
import type { SlicePage, ExportOptions } from "@/types";
import type { ThemeConfig } from "@/types";
import { FONT_OPTIONS } from "@/theme";

const DEFAULT_SCALE = 2;
const EXPORT_CAPTURE_ATTR = "data-export-capture-id";
const EXPORT_NODE_ATTR = "data-export-node-id";
let fontsReadyPromise: Promise<void> | null = null;

const SNAPSHOT_STYLE_PROPS = [
  "box-sizing",
  "display",
  "position",
  "top",
  "right",
  "bottom",
  "left",
  "z-index",
  "width",
  "min-width",
  "max-width",
  "height",
  "min-height",
  "max-height",
  "overflow",
  "overflow-x",
  "overflow-y",
  "margin-top",
  "margin-right",
  "margin-bottom",
  "margin-left",
  "padding-top",
  "padding-right",
  "padding-bottom",
  "padding-left",
  "border-top-width",
  "border-right-width",
  "border-bottom-width",
  "border-left-width",
  "border-top-style",
  "border-right-style",
  "border-bottom-style",
  "border-left-style",
  "border-top-color",
  "border-right-color",
  "border-bottom-color",
  "border-left-color",
  "border-radius",
  "background",
  "background-color",
  "background-image",
  "background-size",
  "background-position",
  "background-repeat",
  "box-shadow",
  "opacity",
  "transform",
  "transform-origin",
  "font-family",
  "font-size",
  "font-weight",
  "font-style",
  "font-variant",
  "line-height",
  "letter-spacing",
  "color",
  "text-align",
  "text-decoration-line",
  "text-transform",
  "white-space",
  "word-break",
  "overflow-wrap",
  "flex",
  "flex-basis",
  "flex-direction",
  "flex-grow",
  "flex-shrink",
  "flex-wrap",
  "align-items",
  "align-self",
  "justify-content",
  "gap",
  "row-gap",
  "column-gap",
  "grid-template-columns",
  "grid-template-rows",
  "grid-column",
  "grid-row",
  "object-fit",
  "object-position",
  "vertical-align",
] as const;

interface CaptureResult {
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
}

interface SliceResult {
  pages: SlicePage[];
  totalHeight: number;
}

type NodeStyleSnapshot = {
  id: string;
  styles: Record<string, string>;
};

type TextLineSnapshot = {
  id: string;
  lines: string[];
};

type CaptureSnapshot = {
  captureId: string;
  nodes: NodeStyleSnapshot[];
  textLines: TextLineSnapshot[];
  restore: () => void;
};

/** 等待字体加载 */
async function waitForFonts(): Promise<void> {
  if (!fontsReadyPromise) {
    fontsReadyPromise = (async () => {
      try {
        await document.fonts.ready;
      } catch { /* ignore */ }
      await new Promise<void>((resolve) => setTimeout(resolve, 80));
    })();
  }
  await fontsReadyPromise;
}

/**
 * 读取元素的完整 background 属性（包含 color + image + gradient）。
 */
function copyBackgroundStyle(el: HTMLElement): string {
  const cs = getComputedStyle(el);
  const hasNoPaintedLayer =
    (!cs.backgroundImage || cs.backgroundImage === "none") &&
    (!cs.backgroundColor ||
      cs.backgroundColor === "transparent" ||
      cs.backgroundColor === "rgba(0, 0, 0, 0)");
  if (hasNoPaintedLayer) return "";

  const bg = cs.background;
  if (!bg || bg === "transparent" || bg === "rgba(0, 0, 0, 0)") {
    return "";
  }
  return bg;
}

function fallbackPageBackground(theme: ThemeConfig): string {
  return `linear-gradient(180deg, rgba(255,255,255,0.24), rgba(255,255,255,0) 12%), ${theme.cardBg}`;
}

function resolvePageBackground(el: HTMLElement, theme: ThemeConfig): string {
  return copyBackgroundStyle(el) || fallbackPageBackground(theme);
}

function resolvePageHeight(el: HTMLElement): number {
  const rectHeight = Math.round(el.getBoundingClientRect().height);
  return Math.max(1, rectHeight, el.offsetHeight);
}

function resolvePageWidth(el: HTMLElement): number {
  const rectWidth = Math.round(el.getBoundingClientRect().width);
  return Math.max(1, rectWidth, el.offsetWidth);
}

function snapshotComputedStyle(el: HTMLElement): Record<string, string> {
  const cs = getComputedStyle(el);
  const styles: Record<string, string> = {};

  SNAPSHOT_STYLE_PROPS.forEach((prop) => {
    const value = cs.getPropertyValue(prop);
    if (prop === "letter-spacing" && value === "0px") return;
    if (value && value !== "auto" && value !== "normal none currentcolor") {
      styles[prop] = value;
    }
  });

  return styles;
}

function collectTextNodes(root: Node): Text[] {
  const nodes: Text[] = [];
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let node = walker.nextNode();
  while (node) {
    if (node.textContent) nodes.push(node as Text);
    node = walker.nextNode();
  }
  return nodes;
}

function measureRenderedTextLines(el: HTMLElement): string[] {
  const textNodes = collectTextNodes(el);
  const pieces: Array<{ text: string; top: number }> = [];

  textNodes.forEach((node) => {
    const text = node.textContent ?? "";
    for (let i = 0; i < text.length; i += 1) {
      const range = document.createRange();
      range.setStart(node, i);
      range.setEnd(node, i + 1);
      const rect = range.getBoundingClientRect();
      range.detach();
      if (rect.width === 0 && rect.height === 0) continue;
      pieces.push({ text: text[i], top: rect.top });
    }
  });

  if (pieces.length === 0) {
    const fallback = el.textContent?.trim() ?? "";
    return fallback ? [fallback] : [];
  }

  const lines: Array<{ top: number; text: string }> = [];
  pieces.forEach((piece) => {
    const line = lines.find((candidate) => Math.abs(candidate.top - piece.top) < 3);
    if (line) {
      line.text += piece.text;
    } else {
      lines.push({ top: piece.top, text: piece.text });
    }
  });

  return lines
    .sort((a, b) => a.top - b.top)
    .map((line) => line.text.trim())
    .filter(Boolean);
}

function createCaptureSnapshot(el: HTMLElement): CaptureSnapshot {
  const id = `xhs-export-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const previousCapture = el.getAttribute(EXPORT_CAPTURE_ATTR);
  const nodes = [
    el,
    ...Array.from(
      el.querySelectorAll<HTMLElement>(
        ".note-content,.note-meta,.note-body,.note-flow-block,.note-flow-inline,.note-flow-inline-wrap,.note-flow-paragraph-break,.note-body h1,.note-body h2,.note-body h3,.xhs-page-template"
      )
    ),
  ];
  const previousNodeIds = new Map<HTMLElement, string | null>();
  const snapshots: NodeStyleSnapshot[] = [];
  const textLines: TextLineSnapshot[] = [];

  el.setAttribute(EXPORT_CAPTURE_ATTR, id);
  nodes.forEach((node, index) => {
    const nodeId = `${id}-node-${index}`;
    previousNodeIds.set(node, node.getAttribute(EXPORT_NODE_ATTR));
    node.setAttribute(EXPORT_NODE_ATTR, nodeId);
    snapshots.push({ id: nodeId, styles: snapshotComputedStyle(node) });
    if (node.matches(".note-body h1, .note-body h2, .note-body h3")) {
      textLines.push({ id: nodeId, lines: measureRenderedTextLines(node) });
    }
  });

  return {
    captureId: id,
    nodes: snapshots,
    textLines,
    restore: () => {
      if (previousCapture == null) {
        el.removeAttribute(EXPORT_CAPTURE_ATTR);
      } else {
        el.setAttribute(EXPORT_CAPTURE_ATTR, previousCapture);
      }

      previousNodeIds.forEach((previous, node) => {
        if (previous == null) {
          node.removeAttribute(EXPORT_NODE_ATTR);
        } else {
          node.setAttribute(EXPORT_NODE_ATTR, previous);
        }
      });
    },
  };
}

function applyCaptureSnapshot(clonedDoc: Document, snapshot: CaptureSnapshot): void {
  snapshot.nodes.forEach(({ id, styles }) => {
    const cloned = clonedDoc.querySelector<HTMLElement>(`[${EXPORT_NODE_ATTR}="${id}"]`);
    if (!cloned) return;

    Object.entries(styles).forEach(([prop, value]) => {
      cloned.style.setProperty(prop, value);
    });
  });
}

function applyMeasuredTextLines(clonedDoc: Document, snapshot: CaptureSnapshot): void {
  snapshot.textLines.forEach(({ id, lines }) => {
    if (lines.length <= 1) return;
    const cloned = clonedDoc.querySelector<HTMLElement>(`[${EXPORT_NODE_ATTR}="${id}"]`);
    if (!cloned) return;

    cloned.replaceChildren(
      ...lines.map((line) => {
        const span = clonedDoc.createElement("span");
        span.textContent = line;
        span.style.display = "block";
        span.style.whiteSpace = "nowrap";
        span.style.lineHeight = "inherit";
        return span;
      })
    );
  });
}

function copyRootCssVariables(clonedDoc: Document): void {
  const source = document.documentElement.style;
  for (let i = 0; i < source.length; i++) {
    const name = source.item(i);
    if (name.startsWith("--")) {
      clonedDoc.documentElement.style.setProperty(
        name,
        source.getPropertyValue(name),
        source.getPropertyPriority(name)
      );
    }
  }
}

/**
 * 读取元素的完整 border-radius 属性。
 */
function copyBorderRadius(el: HTMLElement): string {
  return getComputedStyle(el).borderRadius;
}

function resolvePageBorderRadius(el: HTMLElement, theme: ThemeConfig): string {
  const radius = copyBorderRadius(el);
  return radius && radius !== "0px" ? radius : `${theme.cardRadius}px`;
}

/**
 * 读取元素的 boxShadow 属性。
 */
function copyBoxShadow(el: HTMLElement): string {
  return getComputedStyle(el).boxShadow;
}

function resolvePageBoxShadow(el: HTMLElement): string {
  const shadow = copyBoxShadow(el);
  return shadow && shadow !== "none"
    ? shadow
    : "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.08), 0 12px 40px rgba(0,0,0,0.06)";
}

async function capturePage(
  el: HTMLElement,
  theme: ThemeConfig,
  scale: number
): Promise<CaptureResult> {
  await waitForFonts();

  await new Promise<void>((resolve) => {
    requestAnimationFrame(() => { requestAnimationFrame(() => { resolve(); }); });
  });

  const W = resolvePageWidth(el);
  const H = resolvePageHeight(el);

  const bg = resolvePageBackground(el, theme);
  const borderRadius = resolvePageBorderRadius(el, theme);
  const boxShadow = resolvePageBoxShadow(el);
  const captureTarget = createCaptureSnapshot(el);

  const captureOptions = {
      scale,
      width: W,
      height: H,
      useCORS: true,
      allowTaint: true,
      backgroundColor: theme.cardBg,
      logging: false,
      onclone: (clonedDoc: Document) => {
        const zhStack = FONT_OPTIONS[theme.font] ?? FONT_OPTIONS.serif;
        copyRootCssVariables(clonedDoc);
        clonedDoc.documentElement.style.setProperty("--note-font-family", zhStack);
        applyCaptureSnapshot(clonedDoc, captureTarget);
        applyMeasuredTextLines(clonedDoc, captureTarget);

        const clonedRoot = clonedDoc.querySelector<HTMLElement>(
          `[${EXPORT_CAPTURE_ATTR}="${captureTarget.captureId}"]`
        );
        if (clonedRoot) {
          clonedRoot.style.width = `${W}px`;
          clonedRoot.style.height = `${H}px`;
          clonedRoot.style.overflow = "hidden";
          clonedRoot.style.background = bg;
          clonedRoot.style.backgroundColor = theme.cardBg;
          if (borderRadius) clonedRoot.style.borderRadius = borderRadius;
          if (boxShadow) clonedRoot.style.boxShadow = boxShadow;
          clonedRoot.style.fontFamily = zhStack;
        }

        clonedDoc.querySelectorAll<HTMLElement>(
          ".note-meta,.xhs-page-template,.note-content,.note-body"
        ).forEach((n) => {
          n.style.fontFamily = zhStack;
        });

        clonedDoc.querySelectorAll<HTMLElement>(".note-meta, .note-meta span").forEach((n) => {
          n.style.whiteSpace = "nowrap";
        });
        clonedDoc.querySelectorAll<HTMLElement>(".note-meta > span").forEach((n) => {
          n.style.width = "auto";
          n.style.minWidth = "max-content";
          n.style.height = "auto";
          n.style.flexShrink = "0";
        });
      },
    };

  let canvas: HTMLCanvasElement;
  try {
    canvas = await html2canvas(el, captureOptions);
  } finally {
    captureTarget.restore();
  }

  return { canvas, width: W, height: H };
}

// ── 主导出函数 ───────────────────────────────────────────

export async function exportToPng(
  rootEl: HTMLElement,
  theme: ThemeConfig,
  options: Partial<ExportOptions> = {}
): Promise<SliceResult> {
  const scale = options.scale ?? DEFAULT_SCALE;

  if (!html2canvas) throw new Error("html2canvas 未加载，请刷新页面。");

  const exportPages = rootEl.querySelectorAll<HTMLElement>("[data-export-page='true']");
  const pages: SlicePage[] = [];
  let runningIndex = 0;
  let totalHeight = 0;

  for (const pageEl of exportPages) {
    const { canvas, width, height } = await capturePage(pageEl, theme, scale);
    totalHeight += height * scale;
    pages.push({
      index: runningIndex++,
      rect: { x: 0, y: 0, width: width * scale, height: height * scale },
      canvas,
    });
  }

  return { pages, totalHeight };
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) {
        resolve(blob);
      } else {
        reject(new Error("导出失败：图片编码失败"));
      }
    }, "image/png");
  });
}

function yieldToBrowser(delay = 24): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, delay));
}

function releaseCanvas(canvas: HTMLCanvasElement): void {
  canvas.width = 1;
  canvas.height = 1;
}

async function downloadCanvas(canvas: HTMLCanvasElement, index: number): Promise<void> {
  const blob = await canvasToBlob(canvas);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `xhs-note-${String(index + 1).padStart(3, "0")}.png`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}

export async function downloadSlices(pages: SlicePage[]): Promise<void> {
  for (const [idx, page] of pages.entries()) {
    await downloadCanvas(page.canvas, idx);
    releaseCanvas(page.canvas);
    await yieldToBrowser(18);
  }
}

export async function exportAndDownload(
  rootEl: HTMLElement,
  theme: ThemeConfig,
  options?: Partial<ExportOptions>
): Promise<number> {
  const scale = options?.scale ?? DEFAULT_SCALE;

  if (!html2canvas) throw new Error("html2canvas 未加载，请刷新页面。");

  const exportPages = Array.from(rootEl.querySelectorAll<HTMLElement>("[data-export-page='true']"));
  const total = exportPages.length;

  for (const [idx, pageEl] of exportPages.entries()) {
    options?.onProgress?.(idx + 1, total);
    await yieldToBrowser();
    const { canvas } = await capturePage(pageEl, theme, scale);
    await downloadCanvas(canvas, idx);
    releaseCanvas(canvas);
    await yieldToBrowser();
  }

  return total;
}
