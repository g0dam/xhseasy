import { marked } from "marked";
import DOMPurify from "dompurify";

// ============================================================
// Markdown 解析
// ============================================================

marked.setOptions({ breaks: true, gfm: true });

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function xhsStyleToCss(styleText: string): string {
  const css: string[] = [];
  styleText
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const [rawKey, rawValue] = item.split(":").map((part) => part.trim());
      if (!rawKey || !rawValue) return;
      if (rawKey === "size") {
        if (rawValue === "sm") css.push("font-size:.88em");
        if (rawValue === "lg") css.push("font-size:1.14em");
        if (/^\d+$/.test(rawValue)) {
          const px = Math.max(11, Math.min(30, Number(rawValue)));
          css.push(`font-size:${px}px`);
        }
      }
      if (rawKey === "color") {
        const palette: Record<string, string> = {
          accent: "var(--accent)",
          red: "#c84949",
          green: "#2f8f5b",
          blue: "#3f68cc",
        };
        if (palette[rawValue]) css.push(`color:${palette[rawValue]}`);
        if (/^#([0-9a-f]{6})$/i.test(rawValue)) css.push(`color:${rawValue}`);
      }
      if (rawKey === "highlight" && rawValue === "soft") {
        css.push("background:rgba(243,216,150,.42)", "border-radius:.38em", "padding:0 .18em");
      }
    });
  return css.join(";");
}

function normalizeXhsInline(md: string): string {
  return md.replace(
    /<xhs\s+style="([^"]*)">([\s\S]*?)<\/xhs>/g,
    (_full, styleText: string, content: string) => {
      const css = xhsStyleToCss(styleText);
      return `<span class="xhs-inline"${css ? ` style="${escapeHtml(css)}"` : ""}>${content}</span>`;
    }
  );
}

export function parseMarkdown(md: string): string {
  const raw = marked.parse(normalizeXhsInline(md), { async: false }) as string;
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ["span"],
    ADD_ATTR: ["class", "style"],
  });
}

export function parseInlineMarkdown(md: string): string {
  const raw = marked.parseInline(normalizeXhsInline(md), { async: false }) as string;
  return DOMPurify.sanitize(raw, {
    USE_PROFILES: { html: true },
    ADD_TAGS: ["span"],
    ADD_ATTR: ["class", "style"],
  });
}

// ============================================================
// 渲染结果：包含原始块信息，用于切片决策
// ============================================================

export interface RenderedBlock {
  tag: string;
  raw: string;
  html: string;
  /** 元素节点引用 */
  el?: HTMLElement;
}

// ============================================================
// 生成带标记注释的 HTML（用于智能切片）
// ============================================================

/**
 * 将 Markdown 转为带唯一 id 注释的 HTML，
 * 每个顶级块被包在 <!--block-0--> <!--block-end-0--> 之间，
 * 以便后续精确提取各块内容。
 */
export function parseMarkdownWithBlocks(md: string): {
  html: string;
  blockBoundaries: Array<{ start: number; end: number; tag: string }>;
} {
  const raw = marked.parse(md, { async: false }) as string;
  const clean = DOMPurify.sanitize(raw, { USE_PROFILES: { html: true } });

  // 用栈追踪块嵌套，顶级块加标记
  const lines = clean.split("\n");
  const boundaries: Array<{ start: number; end: number; tag: string }> = [];
  const stack: number[] = [];

  lines.forEach((line, i) => {
    const trimmed = line.trim();
    if (/<(p|h[123]|blockquote|pre|ul|ol|li|hr|div|img|section)/.test(trimmed)) {
      if (stack.length === 0) {
        const tag = trimmed.match(/<([a-z]+)/)?.[1] ?? "div";
        boundaries.push({ start: i, end: -1, tag });
      }
    }
  });

  return { html: clean, blockBoundaries: boundaries };
}

// ============================================================
// 获取元素的自然行数（用于切片决策）
// ============================================================

/**
 * 返回一个 DOM 元素内各子块底边 Y 坐标的数组（CSS px）。
 * 用于在 html2canvas 截图后找最近的切分点。
 */
export function collectBlockBottomYs(
  root: HTMLElement,
  scale: number
): number[] {
  const body = root.querySelector<HTMLElement>(".note-body");
  if (!body) return [];

  const scaleFactor = 1 / scale;
  const bottoms: number[] = [];

  // 每个直接子块
  for (const child of Array.from(body.children)) {
    const rect = child.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    bottoms.push((rect.bottom - rootRect.top) * scaleFactor);
  }

  // 末尾段落
  const lastP = body.querySelector<HTMLElement>("p:last-child");
  if (lastP) {
    const rect = lastP.getBoundingClientRect();
    const rootRect = root.getBoundingClientRect();
    bottoms.push((rect.bottom - rootRect.top) * scaleFactor);
  }

  return bottoms;
}

/**
 * 在给定的 Y 坐标附近找最近的 block 子元素底边（SNAP 逻辑）
 */
export function snapToBlockBoundary(
  y: number,
  blockBottoms: number[],
  direction: "up" | "down"
): number {
  if (direction === "up") {
    // 取不超过 y 的最大底边
    const candidates = blockBottoms.filter((b) => b <= y);
    return candidates.length ? Math.max(...candidates) : blockBottoms[0] ?? y;
  } else {
    const candidates = blockBottoms.filter((b) => b > y);
    return candidates.length ? Math.min(...candidates) : y;
  }
}
