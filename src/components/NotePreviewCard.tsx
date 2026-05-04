/**
 * 笔记预览卡：Markdown 分段渲染，图片块可在预览中编辑并回写源文档。
 */

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { AspectRatio, EditorSettings, ThemeConfig } from "@/types";
import { buildCssVars } from "@/theme";
import { configFromImageMarkdown } from "@/layout/imageLayout";
import {
  removeImageBlockFromDocument,
  updateImageBlockInDocument,
} from "@/document/markdown";
import type { VisualBlock, VisualDocument } from "@/document/types";
import type { DecorationConfig } from "@/templates/index";
import { FlowBody } from "./FlowBody";
import { PageTemplateRenderer } from "./PageTemplateRenderer";

export function aspectRatioValue(ratio: AspectRatio): number {
  return ratio === "3:5" ? 5 / 3 : 4 / 3;
}

function calcPageHeight(cardWidth: number, ratio: AspectRatio): number {
  return Math.round(cardWidth * aspectRatioValue(ratio));
}

function formatNoteDateForCard(noteDate: string): string {
  const t = noteDate.trim();
  if (!t) {
    const d = new Date();
    return `${String(d.getMonth() + 1).padStart(2, "0")}/${String(d.getDate()).padStart(2, "0")}`;
  }
  const m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return `${m[2]}/${m[3]}`;
  return t;
}

function blockHasRenderableContent(block: VisualBlock): boolean {
  if (block.type === "image" || block.type === "page") return true;
  return block.markdown.trim().length > 0;
}

function getBodyContentWidth(settings: EditorSettings): number {
  return Math.max(
    120,
    settings.exportCardWidth - settings.contentInsetX * 2
  );
}

function getPageChromeHeight(settings: EditorSettings): number {
  return settings.topLineHeight + 18 + settings.blockPadBottom;
}

function splitOversizedTextBlock(
  block: Extract<VisualBlock, { type: "text" }>,
  maxHeight: number,
  settings: EditorSettings
): VisualBlock[] {
  if (estimateBlockHeightFallback(block, settings) <= maxHeight) return [block];

  const raw = block.markdown;
  const fence = raw.match(/^(\s*```[^\n]*\n)([\s\S]*?)(\n```\s*)$/);
  if (fence) {
    const codeLines = fence[2].split("\n");
    const codeLineHeight = Math.round(settings.fontSize * 0.88 * 1.56);
    const maxLines = Math.max(
      4,
      Math.floor((maxHeight - 28) / Math.max(1, codeLineHeight))
    );
    const chunks: VisualBlock[] = [];
    for (let i = 0; i < codeLines.length; i += maxLines) {
      const body = codeLines.slice(i, i + maxLines).join("\n");
      chunks.push({
        ...block,
        id: `${block.id}-code-${chunks.length}`,
        markdown: `${fence[1]}${body}${fence[3]}`,
      });
    }
    return chunks.length > 0 ? chunks : [block];
  }

  const lines = raw.split(/(?<=\n)/);
  const lineLike = lines.filter((line) => line.trim()).length >= 2;
  const pieces = lineLike
    ? lines
    : raw
        .split(/(?<=[。！？；.!?;])\s*/)
        .filter(Boolean)
        .flatMap((piece) => {
          if (piece.length <= 80) return [piece];
          const chunks: string[] = [];
          for (let i = 0; i < piece.length; i += 60) chunks.push(piece.slice(i, i + 60));
          return chunks;
        });

  const chunks: string[] = [];
  let current = "";
  const limit = Math.max(80, maxHeight * 0.82);

  pieces.forEach((piece) => {
    const next = current + piece;
    const nextBlock = { ...block, markdown: next };
    if (current && estimateBlockHeightFallback(nextBlock, settings) > limit) {
      chunks.push(current);
      current = piece;
    } else {
      current = next;
    }
  });
  if (current) chunks.push(current);

  if (chunks.length <= 1) return [block];
  return chunks.map((markdown, index) => ({
    ...block,
    id: `${block.id}-part-${index}`,
    markdown,
  }));
}

function prepareBodyBlocksForPagination(
  blocks: VisualBlock[],
  pageHeight: number,
  settings: EditorSettings
): VisualBlock[] {
  const maxTextHeight = Math.max(180, (pageHeight - getPageChromeHeight(settings) - 76) * 0.86);
  return blocks
    .filter(blockHasRenderableContent)
    .flatMap((block) =>
      block.type === "text"
        ? splitOversizedTextBlock(block, maxTextHeight, settings)
        : [block]
    );
}

/**
 * 按浏览器实测高度分页。缺失测量值时只用估算兜底，预览稳定后会自动切回实测。
 */
function sliceBlocksIntoPagesByMeasuredHeight(
  blocks: VisualBlock[],
  pageHeight: number,
  settings: EditorSettings,
  hasMetaOnFirstPage: boolean,
  blockHeights: Record<string, number>,
  metaHeight: number
): VisualBlock[][] {
  const meaningful = prepareBodyBlocksForPagination(blocks, pageHeight, settings);
  if (meaningful.length === 0) return [];

  const chromeH = getPageChromeHeight(settings);
  const usableForPage = (pageIndex: number) =>
    Math.max(
      140,
      pageHeight -
        chromeH -
        (pageIndex === 0 && hasMetaOnFirstPage && settings.showNoteMeta !== false
          ? metaHeight
          : 0) -
        10
    );

  const pages: VisualBlock[][] = [];
  let current: VisualBlock[] = [];
  let currentH = 0;

  meaningful.forEach((block) => {
    const usableH = usableForPage(pages.length);
    const blockH = Math.max(
      1,
      Math.ceil(blockHeights[block.id] ?? estimateBlockHeightFallback(block, settings))
    );

    if (current.length > 0 && currentH + blockH > usableH) {
      pages.push([...current]);
      current = [];
      currentH = 0;
    }
    current.push(block);
    currentH += blockH;
  });
  if (current.length > 0) pages.push(current);
  return pages;
}

/** 估算块高度（无 DOM 时备用）*/
function estimateBlockHeightFallback(block: VisualBlock, settings: EditorSettings): number {
  const fontSize = settings.fontSize;
  const lineHeight = settings.lineHeight;
  if (block.type === "image") {
    const contentWidth = getBodyContentWidth(settings);
    const imageWidth = block.config.layout === "full-width"
      ? contentWidth
      : Math.max(120, (contentWidth * block.config.width) / 100);
    const imageHeight = Math.min(block.config.maxHeight, imageWidth / 1.45);
    return Math.round(
      block.config.marginTop + imageHeight + block.config.marginBottom + fontSize * 0.8
    );
  }
  if (block.type === "page") {
    return Math.round(settings.exportCardWidth * 0.75);
  }
  const text = block.markdown;
  const fence = text.match(/^```[^\n]*\n([\s\S]*?)\n```\s*$/);
  if (fence) {
    const codeLines = Math.max(1, fence[1].split("\n").length);
    return Math.round(
      26 + codeLines * (fontSize * 0.88 * 1.56) + fontSize * settings.preMargin * 0.7
    );
  }
  const avgCharWidth = fontSize * 0.56;
  const contentWidth = getBodyContentWidth(settings);
  const charsPerLine = Math.max(1, Math.floor(contentWidth / avgCharWidth));
  const lines = Math.max(1, Math.ceil(text.length / charsPerLine));
  return Math.round(lines * fontSize * lineHeight * 1.14 + settings.fontSize * 1.2);
}

/**
 * 构建预览分页数据：整合模板页和正文分页。
 */
type PageItem =
  | { kind: "body"; id: string; blocks: VisualBlock[]; ordinal: number; isFirstBodySection: boolean; isFirstPage: boolean }
  | { kind: "template"; id: string; block: Extract<VisualBlock, { type: "page" }>; isFirstPage: boolean };

type BodyMeasurementState = {
  key: string;
  blockHeights: Record<string, number>;
  metaHeight: number;
};

function buildMeasurementKey(
  blocks: VisualBlock[],
  pageHeight: number,
  settings: EditorSettings
): string {
  const contentKey = blocks
    .map((block) => {
      if (block.type === "text") return `${block.id}:t:${block.markdown}`;
      if (block.type === "image") {
        return `${block.id}:i:${block.config.src}:${block.config.width}:${block.config.maxHeight}:${block.config.marginTop}:${block.config.marginBottom}:${block.config.layout}`;
      }
      return `${block.id}:p:${block.template}`;
    })
    .join("|");
  const settingsKey = [
    pageHeight,
    settings.exportCardWidth,
    settings.font,
    settings.fontSize,
    settings.lineHeight,
    settings.letterSpacing,
    settings.blockPadX,
    settings.blockPadBottom,
    settings.contentInsetX,
    settings.showNoteMeta,
    settings.noteMetaPosition,
    settings.noteMetaAlign,
  ].join(":");
  return `${settingsKey}::${contentKey}`;
}

function buildPreviewPages(
  blocks: VisualBlock[],
  pageHeight: number,
  settings: EditorSettings,
  blockHeights: Record<string, number>,
  metaHeight: number
): PageItem[] {
  const grouped: PageItem[] = [];
  let bodyIndex = 0;
  let currentBody: VisualBlock[] = [];
  let isFirstBody = true;
  let globalFirstPage = true;

  const flushBody = () => {
    if (currentBody.length === 0) return;
    const sliced = sliceBlocksIntoPagesByMeasuredHeight(
      currentBody,
      pageHeight,
      settings,
      globalFirstPage,
      blockHeights,
      metaHeight
    );
    sliced.forEach((pageBlocks, sliceIdx) => {
      const isFirst = globalFirstPage;
      if (globalFirstPage) globalFirstPage = false;
      grouped.push({
        kind: "body",
        id: `body-page-${bodyIndex}-${sliceIdx}`,
        blocks: pageBlocks,
        ordinal: bodyIndex,
        isFirstBodySection: isFirstBody,
        isFirstPage: isFirst,
      });
    });
    bodyIndex++;
    isFirstBody = false;
    currentBody = [];
  };

  blocks.forEach((block) => {
    if (block.type === "page") {
      flushBody();
      const isFirst = globalFirstPage;
      if (globalFirstPage) globalFirstPage = false;
      grouped.push({ kind: "template", id: block.id, block, isFirstPage: isFirst });
      return;
    }
    currentBody.push(block);
  });
  flushBody();
  return grouped;
}

export interface NotePreviewCardProps {
  visualDocument: VisualDocument;
  embeddedAssets: Record<string, string>;
  settings: EditorSettings;
  onDocumentCommitted: (next: VisualDocument) => void;
  decorations?: DecorationConfig | null;
  onPageCountChange?: (count: number) => void;
}

export function NotePreviewCard({
  visualDocument,
  embeddedAssets,
  settings,
  onDocumentCommitted,
  decorations,
  onPageCountChange,
}: NotePreviewCardProps) {
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const hasPageBackgroundImage = settings.backgroundMode === "image" && settings.backgroundImageSrc.trim().length > 0;

  useEffect(() => {
    const root = document.documentElement;
    const vars = buildCssVars(settings as unknown as ThemeConfig);
    Object.entries(vars).forEach(([k, v]) => root.style.setProperty(k, v));
    root.style.setProperty("--note-card-w", `${settings.exportCardWidth}px`);
    root.style.setProperty("--note-card-ratio", settings.aspectRatio === "3:5" ? "3/5" : "3/4");
    root.style.setProperty("--note-meta-pad-left", `${settings.noteMetaPadLeft}px`);
    root.style.setProperty("--note-meta-pad-right", `${settings.noteMetaPadRight}px`);
    root.style.setProperty("--stage-bg", settings.backgroundMode === "image" ? "transparent" : settings.bodyBg);
    root.style.setProperty("--stage-bg-image", settings.backgroundMode === "image" && settings.backgroundImageSrc ? `url("${settings.backgroundImageSrc}")` : "none");
    root.style.setProperty("--stage-bg-size", settings.backgroundImageFit);
    root.style.setProperty("--stage-bg-position", settings.backgroundImagePosition);
    root.style.setProperty("--stage-bg-dim", `${Math.max(0, Math.min(100, settings.backgroundDim)) / 100}`);
    root.style.setProperty("--stage-bg-blur", `${settings.backgroundBlur}px`);
    root.style.setProperty("--stage-overlay", settings.backgroundOverlay);
    document.body.style.background = settings.bodyBg;
    root.style.background = settings.bodyBg;
  }, [settings]);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      const el = e.target as Element;
      // 工具栏通过 portal 挂在 body 上，仍在编辑态，勿取消选中
      if (el.closest(".xhs-image-edit-toolbar")) return;
      if (!rootRef.current?.contains(el)) {
        setSelectedImageIndex(null);
        return;
      }
      if (el.closest(".xhs-preview-image-root")) return;
      setSelectedImageIndex(null);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedImageIndex(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const commitImage = useCallback(
    (index: number, newRaw: string) => {
      const parsed = configFromImageMarkdown(newRaw);
      if (!parsed) return;
      const next = updateImageBlockInDocument(visualDocument, index, (block) => ({
        ...block,
        config: parsed,
      }));
      onDocumentCommitted(next);
    },
    [onDocumentCommitted, visualDocument]
  );

  const removeImage = useCallback(
    (index: number) => {
      const next = removeImageBlockFromDocument(visualDocument, index);
      onDocumentCommitted(next);
      setSelectedImageIndex(null);
    },
    [onDocumentCommitted, visualDocument]
  );

  const pageHeight = useMemo(
    () => calcPageHeight(settings.exportCardWidth, settings.aspectRatio),
    [settings.exportCardWidth, settings.aspectRatio]
  );

  const bodyMeasureBlocks = useMemo(
    () =>
      prepareBodyBlocksForPagination(
        visualDocument.blocks.filter((block) => block.type !== "page"),
        pageHeight,
        settings
      ),
    [pageHeight, settings, visualDocument.blocks]
  );

  const measurementKey = useMemo(
    () => buildMeasurementKey(visualDocument.blocks, pageHeight, settings),
    [pageHeight, settings, visualDocument.blocks]
  );

  const [measurements, setMeasurements] = useState<BodyMeasurementState>({
    key: "",
    blockHeights: {},
    metaHeight: 68,
  });

  useLayoutEffect(() => {
    const root = measureRef.current;
    if (!root) return;

    let frame = 0;
    const readMeasurements = () => {
      const nextHeights: Record<string, number> = {};
      root.querySelectorAll<HTMLElement>("[data-flow-block-id]").forEach((node) => {
        const id = node.dataset.flowBlockId;
        if (!id) return;
        nextHeights[id] = Math.max(1, Math.ceil(node.getBoundingClientRect().height));
      });

      const meta = root.querySelector<HTMLElement>("[data-measure-note-meta]");
      const nextMetaHeight = meta ? Math.ceil(meta.getBoundingClientRect().height) : 0;

      setMeasurements((prev) => {
        const prevKeys = Object.keys(prev.blockHeights);
        const nextKeys = Object.keys(nextHeights);
        const sameHeights =
          prevKeys.length === nextKeys.length &&
          nextKeys.every((key) => prev.blockHeights[key] === nextHeights[key]);
        if (prev.key === measurementKey && sameHeights && prev.metaHeight === nextMetaHeight) {
          return prev;
        }
        return {
          key: measurementKey,
          blockHeights: nextHeights,
          metaHeight: nextMetaHeight,
        };
      });
    };

    const scheduleRead = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(readMeasurements);
    };

    readMeasurements();
    scheduleRead();
    const ro = new ResizeObserver(scheduleRead);
    ro.observe(root);
    root.querySelectorAll<HTMLElement>("[data-flow-block-id], img").forEach((node) => {
      ro.observe(node);
    });

    return () => {
      cancelAnimationFrame(frame);
      ro.disconnect();
    };
  }, [measurementKey, bodyMeasureBlocks.length]);

  // 预览分页：以当前 DOM 实测高度为准，导出直接捕获同一批页面。
  const previewPages = useMemo(
    () =>
      buildPreviewPages(
        visualDocument.blocks,
        pageHeight,
        settings,
        measurements.key === measurementKey ? measurements.blockHeights : {},
        measurements.metaHeight
      ),
    [measurementKey, measurements, pageHeight, settings, visualDocument.blocks]
  );

  useEffect(() => {
    onPageCountChange?.(Math.max(1, previewPages.length));
  }, [onPageCountChange, previewPages.length]);

  const bodyPageCount = previewPages.filter(p => p.kind === "body").length;
  const activeAdvancedVariant = decorations?.advancedDecor?.enabled
    ? decorations.advancedDecor.variant
    : undefined;

  const formattedDate = formatNoteDateForCard(settings.noteDate ?? "");

  function renderNoteMeta() {
    return (
      <div className={`note-meta note-meta--${settings.noteMetaAlign}`}>
        <img className="avatar-small" src={settings.avatarSrc} alt="" />
        <span className="who">{settings.displayName}</span>
        <span className="sep">·</span>
        <span>{formattedDate}</span>
      </div>
    );
  }

  function renderPageBackground() {
    if (!hasPageBackgroundImage) return null;
    return (
      <>
        <div className="xhs-page-background" aria-hidden="true" />
        <div className="xhs-page-background-overlay" aria-hidden="true" />
        <div className="xhs-page-background-grain" aria-hidden="true" />
      </>
    );
  }

  function renderAdvancedDecorations(
    variant: NonNullable<DecorationConfig["advancedDecor"]>["variant"],
    hasMetaArea: boolean,
    mode: "body" | "template"
  ) {
    const top = mode === "template" ? (hasMetaArea ? 72 : 18) : hasMetaArea ? 72 : 24;
    const bottom = mode === "template" ? 18 : 28;
    const accent = settings.accent;
    const ink = settings.cardText;
    const muted = settings.cardMuted;
    const elements: React.ReactNode[] = [];

    const chipStyle = (overrides: React.CSSProperties = {}): React.CSSProperties => ({
      position: "absolute",
      border: `1px solid rgba(var(--accent-rgb), 0.18)`,
      background: `rgba(var(--card-bg-rgb), 0.72)`,
      color: muted,
      fontSize: 10,
      lineHeight: 1,
      fontWeight: 700,
      letterSpacing: 0,
      borderRadius: 999,
      padding: "5px 8px",
      boxShadow: "0 8px 18px rgba(var(--shadow-dark-rgb), 0.06)",
      ...overrides,
    });

    const addEdgeGrid = (key: string, color = "rgba(var(--accent-rgb), 0.13)") => {
      elements.push(
        <div key={key} style={{
          position: "absolute",
          inset: 0,
          opacity: 0.38,
          backgroundImage: `linear-gradient(${color} 1px, transparent 1px), linear-gradient(90deg, ${color} 1px, transparent 1px)`,
          backgroundSize: "24px 24px",
        }} />
      );
    };

    const renderBlankPillGroup = (
      key: string,
      opts: { left: number; top: number; widths: number[]; activeIndex?: number }
    ) => (
      <div key={key} style={{ position: "absolute", left: opts.left, top: opts.top, display: "flex", gap: 6 }}>
        {opts.widths.map((width, index) => (
          <span key={`${key}-${index}`} style={chipStyle({
            position: "static",
            width,
            height: 20,
            padding: 0,
            background: index === opts.activeIndex
              ? "rgba(var(--accent-rgb), 0.72)"
              : "rgba(255,255,255,0.62)",
            borderColor: "rgba(var(--accent-rgb), 0.16)",
          })} />
        ))}
      </div>
    );

    const renderRailMarkers = (
      key: string,
      opts: { left: number; top: number; count: number; gap: number; size?: number }
    ) => (
      <>
        {Array.from({ length: opts.count }).map((_, index) => (
          <span key={`${key}-${index}`} style={{
            position: "absolute",
            left: opts.left,
            top: opts.top + index * opts.gap,
            width: opts.size ?? 24,
            height: opts.size ?? 24,
            borderRadius: "50%",
            background: index === 0 ? "rgba(var(--accent-rgb), 0.72)" : "rgba(var(--card-bg-rgb), 0.70)",
            border: "1px solid rgba(var(--accent-rgb), 0.24)",
            boxShadow: "0 8px 18px rgba(var(--shadow-dark-rgb), 0.06)",
          }} />
        ))}
      </>
    );

    const renderFlowPanel = (key: string, opts: { left: number; right: number; top: number }) => (
      <div key={key} style={{
        position: "absolute", left: opts.left, right: opts.right, top: opts.top, height: 68,
        borderRadius: 8, border: "1px solid rgba(var(--accent-rgb),0.12)", background: "rgba(255,255,255,0.32)",
      }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <span key={`${key}-node-${index}`} style={{
            position: "absolute", left: `${12 + index * 24}%`, top: 20, width: 28, height: 28,
            borderRadius: 8, border: "1px solid rgba(var(--accent-rgb),0.24)",
            background: "rgba(var(--accent-rgb),0.12)",
          }} />
        ))}
        {Array.from({ length: 3 }).map((_, index) => (
          <span key={`${key}-line-${index}`} style={{
            position: "absolute", left: `${22 + index * 24}%`, top: 32, width: 24, height: 1,
            background: "rgba(var(--accent-rgb),0.35)",
          }} />
        ))}
      </div>
    );

    const renderRuledNote = (key: string, opts: { left: number; right: number; bottom: number; height: number; rotate?: number }) => (
      <div key={key} style={{
        position: "absolute", left: opts.left, right: opts.right, bottom: opts.bottom, height: opts.height,
        background:
          "linear-gradient(rgba(164,130,42,0.11) 1px, transparent 1px), linear-gradient(90deg, rgba(164,130,42,0.08) 1px, transparent 1px), rgba(255,232,138,0.42)",
        backgroundSize: "18px 18px",
        border: "1px solid rgba(164,130,42,0.13)",
        borderRadius: 4,
        transform: `rotate(${opts.rotate ?? -2}deg)`,
      }} />
    );

    const renderArchiveTabs = (key: string, opts: { top: number }) => (
      <div key={key} style={{ position: "absolute", right: 0, top: opts.top, display: "flex", flexDirection: "column", gap: 6 }}>
        {Array.from({ length: 4 }).map((_, index) => (
          <span key={`${key}-${index}`} style={{
            width: 30, height: 58, display: "flex", alignItems: "center", justifyContent: "center",
            background: "rgba(154,140,69,0.46)", border: "1px solid rgba(87,75,45,0.18)",
            borderRadius: "6px 0 0 6px",
          }}>
            <span style={{ width: 12, height: 2, borderRadius: 999, background: "rgba(85,75,40,0.32)" }} />
          </span>
        ))}
      </div>
    );

    const renderInteractionBar = (key: string, opts: { left: number; right: number; bottom: number }) => (
      <div key={key} style={{
        position: "absolute", left: opts.left, right: opts.right, bottom: opts.bottom, height: 34,
        borderRadius: 10, background: "rgba(255,255,255,0.48)",
        border: "1px solid rgba(227,111,85,0.12)",
        display: "flex", alignItems: "center", justifyContent: "space-around",
      }}>
        {["♡", "☆", "○"].map((icon) => (
          <span key={`${key}-${icon}`} style={{ color: accent, fontSize: 16, lineHeight: 1, opacity: 0.82 }}>{icon}</span>
        ))}
      </div>
    );

    switch (variant) {
      case "soft-paper":
        elements.push(
          <div key="soft-fold" style={{
            position: "absolute", right: 0, top: 0, width: 42, height: 42,
            background: "linear-gradient(135deg, rgba(255,255,255,0) 48%, rgba(231,138,168,0.16) 49%, rgba(255,238,242,0.82) 100%)",
          }} />,
          <div key="soft-dots" style={{
            position: "absolute", left: 12, top, width: 7, bottom,
            backgroundImage: `radial-gradient(circle, ${accent} 1.3px, transparent 1.8px)`,
            backgroundSize: "7px 18px",
            opacity: 0.18,
          }} />,
          <div key="soft-heart" style={chipStyle({ right: 18, top: top + 72, color: accent, fontSize: 22, background: "transparent", border: "none", boxShadow: "none", transform: "rotate(-10deg)", opacity: 0.72 })}>♡</div>,
          <div key="soft-note" style={{
            position: "absolute", left: 26, right: 26, bottom: 72, height: 62,
            borderRadius: 8, background: "rgba(255,230,237,0.42)",
            border: "1px solid rgba(214,111,139,0.18)", transform: "rotate(-1.2deg)",
          }} />
        );
        break;
      case "tech-memo":
        addEdgeGrid("tech-grid", "rgba(76,130,198,0.16)");
        elements.push(
          <div key="tech-rail" style={{
            position: "absolute", left: 14, top, bottom: 54, width: 1,
            background: "linear-gradient(180deg, rgba(76,130,198,0.08), rgba(76,130,198,0.42), rgba(76,130,198,0.08))",
          }} />,
          renderRailMarkers("tech-step", { left: 5, top: top + 34, count: 4, gap: 58 }),
          <div key="tech-terminal" style={{
            position: "absolute", right: 20, bottom: 58, width: 54, height: 38,
            borderRadius: 6, background: "rgba(31,42,58,0.88)", boxShadow: "0 12px 24px rgba(31,42,58,0.16)",
          }}>
            <span style={{ position: "absolute", left: 10, top: 12, width: 7, height: 7, borderRadius: "50%", background: "#f0c04b" }} />
            <span style={{ position: "absolute", left: 24, top: 15, width: 18, height: 2, borderRadius: 999, background: "#f0c04b" }} />
          </div>
        );
        break;
      case "warm-scrapbook":
        elements.push(
          <div key="scrap-clip" style={{
            position: "absolute", left: 18, top: top - 8, width: 14, height: 54,
            border: `3px solid rgba(var(--shadow-dark-rgb),0.38)`,
            borderRightColor: "transparent", borderRadius: "14px 0 0 14px", transform: "rotate(8deg)",
          }} />,
          <div key="scrap-sticky" style={{
            position: "absolute", right: 28, top: top + 6, width: 74, height: 62,
            borderRadius: 3, background: "rgba(255,225,128,0.58)",
            border: "1px solid rgba(170,116,30,0.16)", transform: "rotate(5deg)",
          }} />,
          <div key="scrap-torn" style={{
            position: "absolute", left: 44, right: 44, bottom: 56, height: 96,
            background: "rgba(244,177,168,0.34)",
            clipPath: "polygon(0 8%, 9% 3%, 21% 9%, 35% 4%, 48% 8%, 61% 3%, 74% 8%, 90% 2%, 100% 8%, 96% 100%, 4% 100%)",
            transform: "rotate(1.2deg)",
          }} />,
          <svg key="scrap-arrow" viewBox="0 0 70 70" style={{ position: "absolute", right: 44, top: top + 102, width: 70, height: 70, opacity: 0.72 }}>
            <path d="M12 8 C52 18 55 42 34 56" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
            <path d="M35 56 L48 51 M35 56 L43 43" stroke={ink} strokeWidth="2" fill="none" strokeLinecap="round" />
          </svg>
        );
        break;
      case "editorial-index":
        elements.push(
          <div key="editorial-left" style={{
            position: "absolute", left: 16, top: top + 20, bottom: 48, width: 1,
            background: "rgba(184,73,73,0.42)",
          }} />,
          <div key="editorial-label" style={{
            position: "absolute", left: 10, top: top + 118, width: 12, height: 88,
            borderTop: `1px solid ${accent}`,
            borderBottom: `1px solid ${accent}`,
            opacity: 0.44,
          }} />,
          <div key="editorial-ribbon" style={{
            position: "absolute", right: 32, top: 0, width: 22, height: 54,
            background: accent,
            clipPath: "polygon(0 0,100% 0,100% 100%,50% 78%,0 100%)",
            opacity: 0.86,
          }} />,
          ...Array.from({ length: 4 }).map((_, index) => (
            <div key={`editorial-index-${index}`} style={{
              position: "absolute", right: 18, top: top + 44 + index * 48,
              width: index === 0 ? 18 : 12,
              height: 2,
              background: accent,
              borderRadius: 999,
              opacity: 0.72,
            }} />
          ))
        );
        break;
      case "ai-dashboard":
        elements.push(
          renderBlankPillGroup("dash-pills", { left: 24, top, widths: [34, 42, 34], activeIndex: 1 }),
          renderFlowPanel("dash-flow", { left: 28, right: 28, top: top + 48 }),
          <div key="dash-meter" style={{
            position: "absolute", left: 30, bottom: 62, width: 78, height: 78,
            borderRadius: "50%",
            background: `conic-gradient(${accent} 0 78%, rgba(55,169,120,0.14) 78% 100%)`,
            opacity: 0.32,
          }} />
        );
        break;
      case "study-flashcard":
        elements.push(
          <div key="study-underline" style={{
            position: "absolute", left: 48, right: 58, top: top + 94, height: 3,
            background: "rgba(141,107,211,0.46)", borderRadius: 999, transform: "rotate(-1deg)",
          }} />,
          renderRuledNote("study-note", { left: 48, right: 48, bottom: 88, height: 118 }),
          <div key="study-tab" style={{
            position: "absolute", right: 24, top: 0, width: 26, height: 60,
            background: "rgba(141,107,211,0.78)",
            clipPath: "polygon(0 0,100% 0,100% 100%,50% 82%,0 100%)",
          }} />,
          ...[0, 1, 2, 3].map((item) => (
            <span key={`study-star-${item}`} style={{
              position: "absolute", left: item % 2 ? "auto" : 22, right: item % 2 ? 30 : "auto",
              top: top + 24 + item * 40, color: accent, fontSize: 20, opacity: 0.72,
            }}>✦</span>
          ))
        );
        break;
      case "archive-file":
        elements.push(
          ...[0, 1, 2].map((item) => (
            <span key={`archive-hole-${item}`} style={{
              position: "absolute", left: 16, top: top + 60 + item * 118,
              width: 12, height: 12, borderRadius: "50%",
              background: "rgba(255,248,232,0.78)", border: "1px solid rgba(87,75,45,0.22)",
            }} />
          )),
          <div key="archive-stamp" style={{
            position: "absolute", right: 36, top: top + 16,
            border: "2px solid #b44432", color: "#b44432",
            width: 74, height: 24,
            transform: "rotate(-10deg)", background: "rgba(255,245,230,0.42)",
          }} />,
          renderArchiveTabs("archive-tabs", { top: top + 88 })
        );
        break;
      case "creator-note":
        elements.push(
          ...[0, 1, 2, 3, 4, 5].map((item) => (
            <span key={`creator-spark-${item}`} style={{
              position: "absolute",
              left: `${8 + (item * 17) % 78}%`,
              top: top + 20 + (item % 3) * 52,
              color: item % 2 ? "#f5a623" : accent,
              fontSize: item % 2 ? 14 : 18,
              opacity: 0.62,
            }}>{item % 2 ? "✦" : "♡"}</span>
          )),
          <div key="creator-bubbles" style={{
            position: "absolute", left: 26, right: 26, bottom: 84, height: 52,
            borderRadius: 10, border: "1px solid rgba(227,111,85,0.16)",
            background: "rgba(255,218,210,0.32)",
          }} />,
          renderInteractionBar("creator-footer", { left: 22, right: 22, bottom: 22 })
        );
        break;
      case "food-recipe":
        elements.push(
          <div key="food-plate" style={{
            position: "absolute", right: 26, top: top + 18, width: 74, height: 74,
            borderRadius: "50%", border: "10px solid rgba(var(--accent-rgb),0.12)",
            background: "rgba(255,255,255,0.38)", boxShadow: "inset 0 0 0 1px rgba(var(--accent-rgb),0.16)",
          }} />,
          <div key="food-recipe-card" style={{
            position: "absolute", left: 28, right: 88, bottom: 72, height: 112,
            borderRadius: 8, background: "rgba(255,246,230,0.52)",
            border: "1px solid rgba(var(--accent-rgb),0.16)",
            backgroundImage: "linear-gradient(rgba(var(--accent-rgb),0.10) 1px, transparent 1px)",
            backgroundSize: "100% 20px",
            transform: "rotate(-1deg)",
          }} />,
          ...[0, 1, 2, 3, 4].map((item) => (
            <span key={`food-dot-${item}`} style={{
              position: "absolute", left: 22 + item * 15, bottom: 42,
              width: 9, height: 9, borderRadius: "50%",
              background: item % 2 ? "rgba(98,140,76,0.42)" : "rgba(var(--accent-rgb),0.42)",
            }} />
          ))
        );
        break;
      case "travel-map":
        elements.push(
          <svg key="travel-route" viewBox="0 0 320 420" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", opacity: 0.58 }}>
            <path d="M48 90 C138 44 178 132 116 188 C62 236 134 298 224 238 C270 208 282 282 226 338" stroke={accent} strokeWidth="2" fill="none" strokeDasharray="6 8" strokeLinecap="round" />
            {[ [48,90], [116,188], [224,238], [226,338] ].map(([cx, cy], index) => (
              <circle key={index} cx={cx} cy={cy} r="6" fill="rgba(255,255,255,0.82)" stroke={accent} strokeWidth="2" />
            ))}
          </svg>,
          <div key="travel-ticket" style={{
            position: "absolute", right: 26, top: top + 18, width: 88, height: 38,
            borderRadius: 5, background: "rgba(255,255,255,0.54)",
            border: "1px dashed rgba(var(--accent-rgb),0.30)", transform: "rotate(6deg)",
          }} />,
          <div key="travel-photo" style={{
            position: "absolute", left: 28, right: 28, bottom: 56, height: 96,
            borderRadius: 8, border: "8px solid rgba(255,255,255,0.54)",
            background: "linear-gradient(135deg, rgba(var(--accent-rgb),0.16), rgba(var(--card-bg-rgb),0.62))",
            boxShadow: "0 14px 28px rgba(var(--shadow-dark-rgb),0.08)",
          }} />
        );
        break;
      case "fashion-lookbook":
        elements.push(
          <svg key="fashion-hanger" viewBox="0 0 120 56" style={{ position: "absolute", right: 28, top: top + 18, width: 100, height: 48, opacity: 0.58 }}>
            <path d="M58 17 C58 6 72 8 68 18 C64 27 55 26 55 36 M55 36 L16 52 M55 36 L103 52" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>,
          <div key="fashion-frame" style={{
            position: "absolute", left: 34, top: top + 78, width: 112, height: 158,
            borderRadius: 6, border: "1px solid rgba(var(--accent-rgb),0.18)",
            background: "linear-gradient(180deg, rgba(255,255,255,0.42), rgba(var(--card-bg-rgb),0.42))",
          }} />,
          <div key="fashion-tag" style={{
            position: "absolute", right: 34, bottom: 74, width: 56, height: 72,
            borderRadius: "7px 7px 16px 16px", background: "rgba(255,255,255,0.50)",
            border: "1px solid rgba(var(--accent-rgb),0.20)", transform: "rotate(-4deg)",
          }} />,
          ...[0, 1, 2].map((item) => (
            <span key={`fashion-swatch-${item}`} style={{
              position: "absolute", left: 36 + item * 34, bottom: 42,
              width: 22, height: 22, borderRadius: "50%",
              background: item === 0 ? "rgba(var(--accent-rgb),0.46)" : item === 1 ? "rgba(var(--card-text-rgb),0.22)" : "rgba(255,255,255,0.68)",
              border: "1px solid rgba(var(--accent-rgb),0.16)",
            }} />
          ))
        );
        break;
      case "beauty-swatch":
        elements.push(
          <div key="beauty-mirror" style={{
            position: "absolute", right: 30, top: top + 22, width: 78, height: 94,
            borderRadius: "48% 48% 10px 10px", border: "3px solid rgba(var(--accent-rgb),0.28)",
            background: "linear-gradient(135deg, rgba(255,255,255,0.64), rgba(var(--accent-rgb),0.08))",
          }} />,
          <div key="beauty-palette" style={{
            position: "absolute", left: 30, right: 30, bottom: 64, height: 104,
            borderRadius: 12, background: "rgba(255,255,255,0.46)",
            border: "1px solid rgba(var(--accent-rgb),0.15)",
          }}>
            {[0, 1, 2, 3].map((item) => (
              <span key={item} style={{
                position: "absolute", left: 18 + item * 48, top: 22,
                width: 30, height: 30, borderRadius: "50%",
                background: `rgba(${item === 0 ? "226,118,142" : item === 1 ? "244,169,150" : item === 2 ? "188,102,116" : "255,211,196"},0.68)`,
              }} />
            ))}
          </div>,
          ...[0, 1, 2].map((item) => (
            <span key={`beauty-spark-${item}`} style={{
              position: "absolute", left: 34 + item * 48, top: top + 42 + item * 16,
              color: accent, fontSize: 18, opacity: 0.58,
            }}>✦</span>
          ))
        );
        break;
      case "fitness-energy":
        elements.push(
          <div key="fit-stripes" style={{
            position: "absolute", inset: 0, opacity: 0.16,
            backgroundImage: `repeating-linear-gradient(135deg, ${accent} 0 8px, transparent 8px 22px)`,
          }} />,
          ...[0, 1, 2].map((item) => (
            <span key={`fit-bar-${item}`} style={{
              position: "absolute", left: 28, right: 42 + item * 38, top: top + 76 + item * 34,
              height: 9, borderRadius: 999, background: "rgba(var(--accent-rgb),0.36)",
            }} />
          )),
          <div key="fit-ring" style={{
            position: "absolute", right: 34, bottom: 78, width: 82, height: 82,
            borderRadius: "50%",
            background: `conic-gradient(${accent} 0 68%, rgba(var(--accent-rgb),0.10) 68% 100%)`,
            opacity: 0.38,
          }} />,
          <div key="fit-pulse" style={{
            position: "absolute", left: 32, bottom: 56, width: 118, height: 42,
            borderRadius: 8, border: "1px solid rgba(var(--accent-rgb),0.18)",
            background: "linear-gradient(90deg, transparent 0 8%, rgba(var(--accent-rgb),0.30) 8% 10%, transparent 10% 20%, rgba(var(--accent-rgb),0.26) 20% 24%, transparent 24% 100%)",
          }} />
        );
        break;
      case "book-review":
        elements.push(
          <div key="book-spine" style={{
            position: "absolute", left: 22, top, bottom: 48, width: 18,
            borderRadius: 8, background: "rgba(var(--accent-rgb),0.28)",
            boxShadow: "inset -1px 0 0 rgba(var(--accent-rgb),0.18)",
          }} />,
          <div key="book-card" style={{
            position: "absolute", right: 28, top: top + 38, width: 118, height: 164,
            borderRadius: 4, background: "rgba(255,255,255,0.42)",
            border: "1px solid rgba(var(--accent-rgb),0.16)",
          }} />,
          <div key="book-slip" style={{
            position: "absolute", left: 58, right: 42, bottom: 74, height: 86,
            borderRadius: 5, background: "rgba(255,248,226,0.46)",
            border: "1px solid rgba(var(--accent-rgb),0.14)",
            backgroundImage: "linear-gradient(rgba(var(--card-text-rgb),0.08) 1px, transparent 1px)",
            backgroundSize: "100% 18px",
            transform: "rotate(-1.5deg)",
          }} />
        );
        break;
      case "parenting-soft":
        elements.push(
          ...[0, 1, 2, 3].map((item) => (
            <span key={`parent-bubble-${item}`} style={{
              position: "absolute",
              left: item % 2 ? "auto" : 26 + item * 18,
              right: item % 2 ? 28 + item * 12 : "auto",
              top: top + 30 + item * 34,
              width: 34 + item * 6,
              height: 34 + item * 6,
              borderRadius: "50%",
              background: item % 2 ? "rgba(255,220,160,0.32)" : "rgba(var(--accent-rgb),0.18)",
            }} />
          )),
          <div key="parent-cloud" style={{
            position: "absolute", left: 32, right: 32, bottom: 68, height: 88,
            borderRadius: "30px", background: "rgba(255,255,255,0.42)",
            border: "1px solid rgba(var(--accent-rgb),0.13)",
          }} />,
          <span key="parent-star" style={{ position: "absolute", right: 42, bottom: 170, color: accent, fontSize: 22, opacity: 0.58 }}>☆</span>
        );
        break;
      case "home-decor":
        elements.push(
          <div key="home-grid" style={{
            position: "absolute", left: 26, right: 26, top: top + 28, bottom: 78,
            borderRadius: 8, border: "1px solid rgba(var(--accent-rgb),0.12)",
            backgroundImage: "linear-gradient(rgba(var(--card-text-rgb),0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--card-text-rgb),0.07) 1px, transparent 1px)",
            backgroundSize: "26px 26px",
          }} />,
          ...[
            { left: 54, top: top + 68, width: 78, height: 42 },
            { left: 168, top: top + 104, width: 52, height: 82 },
            { left: 74, top: top + 210, width: 118, height: 48 },
          ].map((rect, index) => (
            <span key={`home-block-${index}`} style={{
              position: "absolute", ...rect,
              borderRadius: 8,
              background: "rgba(var(--accent-rgb),0.16)",
              border: "1px solid rgba(var(--accent-rgb),0.16)",
            }} />
          )),
          ...[0, 1, 2].map((item) => (
            <span key={`home-chip-${item}`} style={{
              position: "absolute", left: 32 + item * 42, bottom: 42,
              width: 28, height: 16, borderRadius: 999,
              background: item === 1 ? "rgba(var(--accent-rgb),0.32)" : "rgba(255,255,255,0.48)",
              border: "1px solid rgba(var(--accent-rgb),0.13)",
            }} />
          ))
        );
        break;
      case "photo-frame":
        elements.push(
          <div key="photo-main" style={{
            position: "absolute", left: 30, right: 30, top: top + 30, height: 176,
            borderRadius: 8, border: "10px solid rgba(255,255,255,0.54)",
            background: "linear-gradient(135deg, rgba(var(--accent-rgb),0.22), rgba(var(--card-text-rgb),0.10))",
            boxShadow: "0 14px 32px rgba(var(--shadow-dark-rgb),0.10)",
          }} />,
          <div key="photo-strip" style={{
            position: "absolute", right: 28, bottom: 48, width: 68, height: 150,
            borderRadius: 6, background: "rgba(var(--card-text-rgb),0.10)",
            display: "grid", gap: 7, padding: 7,
          }}>
            {[0, 1, 2].map((item) => (
              <span key={item} style={{ borderRadius: 4, background: "rgba(255,255,255,0.48)" }} />
            ))}
          </div>,
          <div key="photo-focus" style={{
            position: "absolute", left: 42, bottom: 82, width: 84, height: 54,
            border: `2px solid ${accent}`, borderRadius: 4, opacity: 0.46,
          }} />
        );
        break;
      case "finance-ledger":
        elements.push(
          <div key="finance-ledger" style={{
            position: "absolute", left: 28, right: 28, top: top + 34, bottom: 64,
            borderRadius: 6, border: "1px solid rgba(var(--accent-rgb),0.16)",
            backgroundImage: "linear-gradient(rgba(var(--card-text-rgb),0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(var(--card-text-rgb),0.06) 1px, transparent 1px)",
            backgroundSize: "100% 26px, 52px 100%",
            backgroundColor: "rgba(255,255,255,0.34)",
          }} />,
          ...[0, 1, 2, 3].map((item) => (
            <span key={`finance-bar-${item}`} style={{
              position: "absolute", right: 48 + item * 24, bottom: 82,
              width: 12, height: 36 + item * 18,
              borderRadius: "8px 8px 0 0",
              background: item % 2 ? "rgba(var(--accent-rgb),0.22)" : "rgba(var(--accent-rgb),0.42)",
            }} />
          )),
          <svg key="finance-line" viewBox="0 0 170 70" style={{ position: "absolute", left: 48, bottom: 78, width: 170, height: 70, opacity: 0.66 }}>
            <path d="M4 58 L42 42 L78 48 L112 24 L162 12" stroke={accent} strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );
        break;
    }

    return elements;
  }

  /**
   * 渲染所有装饰元素（用于正文卡片）
   * @param hasMetaArea - 是否有 meta 区，决定角落装饰的 top 偏移
   */
  function renderDecorations(hasMetaArea: boolean) {
    if (!decorations) return null;
    const elements: React.ReactNode[] = [];
    const cardRadius = settings.cardRadius;
    const topOffset = hasMetaArea ? "56px" : "12px";
    const bottomOffset = hasMetaArea ? "12px" : "12px";

    if (decorations.advancedDecor?.enabled) {
      elements.push(...renderAdvancedDecorations(decorations.advancedDecor.variant, hasMetaArea, "body"));
    }

    // 顶装饰线（只在有 topLine 配置且启用时渲染）
    if (decorations.topLine?.enabled && decorations.topLine.height > 0) {
      const tl = decorations.topLine;
      elements.push(
        <div key="top-line" style={{
          position: "absolute",
          top: 0, left: 0, right: 0,
          height: tl.height,
          background: `linear-gradient(90deg, ${tl.gradient[0]} 0%, ${tl.gradient[0]} ${Math.round(tl.gradient[2] * 100)}%, transparent 100%)`,
          zIndex: 5,
        }} />
      );
    }

    // 胶带
    if (decorations.tapeDecor?.enabled) {
      const t = decorations.tapeDecor;
      const posMap: Record<string, React.CSSProperties> = {
        tl: { top: topOffset, left: "-4px", transform: `rotate(${t.angle}deg)`, transformOrigin: "bottom right" },
        tr: { top: topOffset, right: "-4px", transform: `rotate(${-t.angle}deg)`, transformOrigin: "bottom left" },
        bl: { bottom: bottomOffset, left: "-4px", transform: `rotate(${-t.angle}deg)`, transformOrigin: "top right" },
        br: { bottom: bottomOffset, right: "-4px", transform: `rotate(${t.angle}deg)`, transformOrigin: "top left" },
      };
      elements.push(
        <div key="tape" style={{
          position: "absolute",
          width: `${t.width}px`,
          height: `${t.height}px`,
          background: t.bg,
          opacity: t.opacity,
          zIndex: 10,
          ...posMap[t.position],
        }} />
      );
    }

    // 角落贴纸/印章
    if (decorations.cornerStamp?.enabled) {
      const s = decorations.cornerStamp;
      const posMap: Record<string, React.CSSProperties> = {
        tl: { top: topOffset, left: "8px" },
        tr: { top: topOffset, right: "8px" },
        bl: { bottom: bottomOffset, left: "8px" },
        br: { bottom: bottomOffset, right: "8px" },
      };
      elements.push(
        <div key="stamp" style={{
          position: "absolute",
          fontSize: `${14 * s.scale}px`,
          background: s.bg,
          opacity: s.opacity,
          borderRadius: "6px",
          padding: "3px 6px",
          zIndex: 10,
          boxShadow: "0 2px 6px rgba(var(--shadow-dark-rgb), 0.1)",
          ...posMap[s.position],
        }}>
          {s.emoji}
        </div>
      );
    }

    // 角落括号（SVG）
    if (decorations.cornerBrackets?.enabled) {
      const c = decorations.cornerBrackets;
      const w = c.size;
      const lineW = c.width;
      const bracketLeft = "10px";
      const bracketBottom = "10px";
      elements.push(
        <svg key="brackets-tl" style={{ position: "absolute", top: topOffset, left: bracketLeft, width: `${w}px`, height: `${w}px`, zIndex: 10 }}
          viewBox={`0 0 ${w} ${w}`}>
          <path d={`M${lineW},${w} L${lineW},${lineW} L${w},${lineW}`} stroke={c.color} strokeWidth={lineW} fill="none" strokeLinecap="round" />
        </svg>
      );
      elements.push(
        <svg key="brackets-br" style={{ position: "absolute", bottom: bracketBottom, right: bracketLeft, width: `${w}px`, height: `${w}px`, zIndex: 10 }}
          viewBox={`0 0 ${w} ${w}`}>
          <path d={`M0,${w - lineW} L${w - lineW},${w - lineW} L${w - lineW},0`} stroke={c.color} strokeWidth={lineW} fill="none" strokeLinecap="round" />
        </svg>
      );
    }

    // 底部装饰线
    if (decorations.bottomLine?.enabled) {
      const bl = decorations.bottomLine;
      elements.push(
        <div key="bottom-line" style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: bl.height,
          background: `linear-gradient(90deg, ${bl.gradient[0]} 0%, ${bl.gradient[1]} ${bl.gradient[2] * 100}%, ${bl.gradient[3]} 100%)`,
          zIndex: 5,
        }} />
      );
    }

    // 纸纹（颜色跟随主题：浅色背景用深色噪点，深色背景用浅色噪点）
    if (decorations.paperTexture) {
      elements.push(
        <div key="paper-texture" style={{
          position: "absolute",
          inset: 0,
          opacity: 0.055,
          backgroundColor: `rgba(var(--paper-grain-color), 0.9)`,
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "200px 200px",
          pointerEvents: "none",
          zIndex: 1,
          borderRadius: `${cardRadius}px`,
        }} />
      );
    }

    // 水印
    if (decorations.watermark?.enabled) {
      const wm = decorations.watermark;
      const fontFamily = settings.font === "serif"
        ? '"Noto Serif SC",serif'
        : settings.font === "mono"
          ? '"Cascadia Code",monospace'
          : '"PingFang SC",sans-serif';
      elements.push(
        <div key="watermark" style={{
          position: "absolute",
          bottom: "12px",
          right: "12px",
          fontSize: "11px",
          color: settings.cardText,
          opacity: wm.opacity,
          transform: `rotate(${wm.angle}deg)`,
          fontFamily,
          letterSpacing: "0.1em",
          pointerEvents: "none",
          zIndex: 6,
          textTransform: "uppercase",
        }}>
          {wm.text}
        </div>
      );
    }

    // 角标
    if (decorations.cornerBadge?.enabled) {
      const cb = decorations.cornerBadge;
      const posMap: Record<string, React.CSSProperties> = {
        tl: { top: topOffset, left: "8px" },
        tr: { top: topOffset, right: "8px" },
        bl: { bottom: bottomOffset, left: "8px" },
        br: { bottom: bottomOffset, right: "8px" },
      };
      elements.push(
        <div key="corner-badge" style={{
          position: "absolute",
          padding: "3px 8px",
          background: cb.bg,
          color: cb.color,
          borderRadius: "4px",
          fontSize: "11px",
          fontWeight: 700,
          zIndex: 10,
          ...posMap[cb.position],
        }}>
          {cb.text}
        </div>
      );
    }

    return <>{elements}</>;
  }

  /**
   * 渲染模板页面专用装饰（只含非侵入性元素：胶带、贴纸、括号、内边框）
   * 不含纸纹和水印，避免遮挡模板内容
   */
  function renderTemplateDecorations(hasMetaArea: boolean) {
    if (!decorations) return null;
    const elements: React.ReactNode[] = [];
    const cardRadius = settings.cardRadius;
    const topOffset = hasMetaArea ? "62px" : "8px";

    if (decorations.advancedDecor?.enabled) {
      elements.push(...renderAdvancedDecorations(decorations.advancedDecor.variant, hasMetaArea, "template"));
    }

    if (decorations.tapeDecor?.enabled) {
      const t = decorations.tapeDecor;
      const posMap: Record<string, React.CSSProperties> = {
        tl: { top: topOffset, left: "-4px", transform: `rotate(${t.angle}deg)`, transformOrigin: "bottom right" },
        tr: { top: topOffset, right: "-4px", transform: `rotate(${-t.angle}deg)`, transformOrigin: "bottom left" },
        bl: { bottom: "-6px", left: "-4px", transform: `rotate(${-t.angle}deg)`, transformOrigin: "top right" },
        br: { bottom: "-6px", right: "-4px", transform: `rotate(${t.angle}deg)`, transformOrigin: "top left" },
      };
      elements.push(
        <div key="tape" style={{ position: "absolute", width: `${t.width}px`, height: `${t.height}px`, background: t.bg, opacity: t.opacity, zIndex: 10, ...posMap[t.position] }} />
      );
    }

    if (decorations.cornerStamp?.enabled) {
      const s = decorations.cornerStamp;
      const posMap: Record<string, React.CSSProperties> = {
        tl: { top: topOffset, left: "8px" }, tr: { top: topOffset, right: "8px" },
        bl: { bottom: "8px", left: "8px" }, br: { bottom: "8px", right: "8px" },
      };
      elements.push(
        <div key="stamp" style={{ position: "absolute", fontSize: `${14 * s.scale}px`, background: s.bg, opacity: s.opacity, borderRadius: "6px", padding: "3px 6px", zIndex: 10, boxShadow: "0 2px 6px rgba(var(--shadow-dark-rgb), 0.1)", ...posMap[s.position] }}>
          {s.emoji}
        </div>
      );
    }

    if (decorations.cornerBrackets?.enabled) {
      const c = decorations.cornerBrackets;
      const w = c.size, lw = c.width;
      elements.push(
        <svg key="brackets-tl" style={{ position: "absolute", top: topOffset, left: "8px", width: `${w}px`, height: `${w}px`, zIndex: 10 }} viewBox={`0 0 ${w} ${w}`}>
          <path d={`M${lw},${w} L${lw},${lw} L${w},${lw}`} stroke={c.color} strokeWidth={lw} fill="none" strokeLinecap="round" />
        </svg>
      );
      elements.push(
        <svg key="brackets-br" style={{ position: "absolute", bottom: "8px", right: "8px", width: `${w}px`, height: `${w}px`, zIndex: 10 }} viewBox={`0 0 ${w} ${w}`}>
          <path d={`M0,${w - lw} L${w - lw},${w - lw} L${w - lw},0`} stroke={c.color} strokeWidth={lw} fill="none" strokeLinecap="round" />
        </svg>
      );
    }

    if (decorations.innerBorder?.enabled) {
      const b = decorations.innerBorder;
      elements.push(
        <div key="inner-border" style={{ position: "absolute", inset: `${b.margin}px`, border: `${b.width}px ${b.style} ${b.color}`, borderRadius: `${Math.max(0, cardRadius - b.margin)}px`, pointerEvents: "none", zIndex: 5, opacity: 0.55 }} />
      );
    }

    if (decorations.bottomLine?.enabled) {
      const bl = decorations.bottomLine;
      elements.push(
        <div key="bottom-line" style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: bl.height, background: `linear-gradient(90deg, ${bl.gradient[0]} 0%, ${bl.gradient[1]} ${bl.gradient[2] * 100}%, ${bl.gradient[3]} 100%)`, zIndex: 5 }} />
      );
    }

    if (decorations.cornerBadge?.enabled) {
      const cb = decorations.cornerBadge;
      const posMap: Record<string, React.CSSProperties> = {
        tl: { top: topOffset, left: "8px" }, tr: { top: topOffset, right: "8px" },
        bl: { bottom: "8px", left: "8px" }, br: { bottom: "8px", right: "8px" },
      };
      elements.push(
        <div key="corner-badge" style={{ position: "absolute", padding: "3px 8px", background: cb.bg, color: cb.color, borderRadius: "4px", fontSize: "11px", fontWeight: 700, zIndex: 10, ...posMap[cb.position] }}>
          {cb.text}
        </div>
      );
    }

    return <>{elements}</>;
  }

  return (
    <div className="xhs-stage" id="capture-target" ref={rootRef}>
      <div className="xhs-measure-root" ref={measureRef} aria-hidden="true">
        <article
          className="xhs-export-page-card note-block--body xhs-measure-card"
          style={{ height: pageHeight, position: "relative" }}
        >
          <div className="note-content">
            {settings.showNoteMeta !== false ? (
              <div data-measure-note-meta>{renderNoteMeta()}</div>
            ) : null}
            <div className="note-body note-body--flow">
              <FlowBody
                blocks={bodyMeasureBlocks}
                embeddedAssets={embeddedAssets}
                selectedImageIndex={null}
                onSelectImage={() => undefined}
                onCommitImage={commitImage}
                onRemoveImage={removeImage}
              />
            </div>
          </div>
        </article>
      </div>
      <div className="xhs-capture-stack xhs-capture-stack--continuous">
        {previewPages.map((page, pageIdx) => {
          const isFirstCard = page.isFirstPage;
          const showMeta = isFirstCard && settings.showNoteMeta !== false;
          const decor = decorations && isFirstCard
            ? (page.kind === "template"
              ? renderTemplateDecorations(showMeta)
              : renderDecorations(showMeta))
            : null;

          if (page.kind === "template") {
            return (
              <article
                key={page.id}
                className={`xhs-export-page-card note-block--template${page.isFirstPage ? " note-block--first" : ""}`}
                data-export-page="true"
                data-export-page-type="template"
                data-page-label={`${pageIdx + 1}/${previewPages.length}`}
                data-is-first-page={page.isFirstPage ? "true" : "false"}
                data-advanced-template={activeAdvancedVariant}
                style={{ height: pageHeight, position: "relative" }}
              >
                {renderPageBackground()}
                {/* Layer 1: 内容区 */}
                <div className="note-content">
                  {showMeta && settings.noteMetaPosition === "top" ? renderNoteMeta() : null}
                  <PageTemplateRenderer block={page.block} settings={settings} embeddedAssets={embeddedAssets} />
                  {showMeta && settings.noteMetaPosition === "bottom" ? renderNoteMeta() : null}
                </div>
                {/* Layer 2: 装饰层 */}
                {decor && <div className="note-decor-layer">{decor}</div>}
              </article>
            );
          }
          return (
            <article
              key={page.id}
              className={`xhs-export-page-card note-block--body${!showMeta ? " note-block--continuation" : ""}${!showMeta && settings.noteMetaPosition === "bottom" ? " note-block--meta-bottom" : ""}`}
              data-export-page="true"
              data-export-page-type="body"
              data-page-label={`${page.ordinal + 1}/${bodyPageCount}`}
              data-is-first-page={page.isFirstPage ? "true" : "false"}
              data-advanced-template={activeAdvancedVariant}
              style={{ height: pageHeight, position: "relative" }}
            >
              {renderPageBackground()}
              {/* Layer 1: 内容区 — 装饰的 safe zone，有明确边界 */}
              <div className="note-content">
                {showMeta && settings.noteMetaPosition === "top" ? renderNoteMeta() : null}
                <div className="note-body note-body--flow">
                  <FlowBody
                    blocks={page.blocks}
                    embeddedAssets={embeddedAssets}
                    selectedImageIndex={selectedImageIndex}
                    onSelectImage={(index) => setSelectedImageIndex(index)}
                    onCommitImage={commitImage}
                    onRemoveImage={removeImage}
                  />
                </div>
                {showMeta && settings.noteMetaPosition === "bottom" ? renderNoteMeta() : null}
              </div>
              {/* Layer 2: 装饰层 — 独立 Absolute 层，所有装饰都在这里，pointer-events:none */}
              {decor && <div className="note-decor-layer">{decor}</div>}
            </article>
          );
        })}
      </div>
    </div>
  );
}
