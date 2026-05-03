/**
 * ImageEditor.tsx — 图片可视化编辑器组件
 *
 * 工具栏通过 portal 固定在视口中、锚在图片外侧（优先图片下方），避免挡住图片。
 */

import {
  useState,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";
import type { ImageConfig, ImageLayout } from "@/layout/imageLayout";
import { generateLayoutButtons } from "@/layout/imageLayout";

// ============================================================
// 类型
// ============================================================

export interface ImageEditorProps {
  config: ImageConfig;
  onVisualChange: (config: ImageConfig) => void;
  onPersist: () => void;
  onDelete: () => void;
  accentColor?: string;
  visible?: boolean;
  children?: ReactNode;
}

type DragState =
  | {
      kind: "resize";
      type: "resize-br" | "resize-tl" | "resize-tr" | "resize-bl";
      startX: number;
      startConfig: ImageConfig;
    };

type Dock = { top: number; left: number; width: number };

const TOOLBAR_W = 248;
const TOOLBAR_MIN_GAP = 12;
const TOOLBAR_EST_H = 174;
const Z_TOOLBAR = 10050;
const Z_HANDLE = 40;

function sameVisualConfig(a: ImageConfig, b: ImageConfig) {
  return (
    a.layout === b.layout &&
    a.width === b.width &&
    a.maxHeight === b.maxHeight &&
    a.borderRadius === b.borderRadius &&
    a.marginTop === b.marginTop &&
    a.marginBottom === b.marginBottom &&
    a.src === b.src &&
    a.alt === b.alt
  );
}

// ============================================================
// 布局切换按钮
// ============================================================

function LayoutButton({
  layout,
  current,
  label,
  icon,
  onClick,
}: {
  layout: ImageLayout;
  current: ImageLayout;
  label: string;
  icon: string;
  onClick: () => void;
}) {
  const isActive = current === layout;
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        padding: "6px 10px",
        border: "1px solid",
        borderColor: isActive ? "rgba(200,100,47,0.55)" : "rgba(108,76,33,0.12)",
        borderRadius: "12px",
        background: isActive
          ? "linear-gradient(180deg, rgba(255,244,236,0.96), rgba(247,229,214,0.96))"
          : "rgba(255,255,255,0.72)",
        color: isActive ? "var(--accent)" : "#6e5b49",
        fontSize: "11px",
        fontWeight: isActive ? 700 : 500,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "4px",
        transition: "all 0.15s",
        boxShadow: isActive ? "0 8px 18px rgba(200,100,47,0.12)" : "none",
      }}
      title={label}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

// ============================================================
// 主组件
// ============================================================

export function ImageEditor({
  config,
  onVisualChange,
  onPersist,
  onDelete,
  accentColor = "#c45c26",
  visible = true,
  children,
}: ImageEditorProps) {
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [showToolbar, setShowToolbar] = useState(true);
  const anchorRef = useRef<HTMLDivElement>(null);
  const [dock, setDock] = useState<Dock | null>(null);
  const rafRef = useRef<number | null>(null);
  const pendingPointRef = useRef<{ x: number; y: number } | null>(null);
  const lastVisualRef = useRef<ImageConfig>(config);

  useEffect(() => {
    lastVisualRef.current = config;
  }, [config]);

  const measureDock = useCallback(() => {
    if (typeof window === "undefined") return;
    if (!visible || !showToolbar) {
      setDock((prev) => (prev === null ? prev : null));
      return;
    }

    const anchor = anchorRef.current;
    if (!anchor) {
      setDock((prev) => (prev === null ? prev : null));
      return;
    }

    const rect = anchor.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const panelWidth = Math.min(TOOLBAR_W, Math.max(220, vw - 24));

    const rightSpace = vw - rect.right - TOOLBAR_MIN_GAP;
    const leftSpace = rect.left - TOOLBAR_MIN_GAP;
    const preferRight = rightSpace >= panelWidth;
    const preferLeft = leftSpace >= panelWidth;

    let left: number;
    let top: number;

    if (preferRight) {
      left = rect.right + TOOLBAR_MIN_GAP;
      top = rect.top + Math.min(16, Math.max(0, rect.height * 0.12));
    } else if (preferLeft) {
      left = rect.left - panelWidth - TOOLBAR_MIN_GAP;
      top = rect.top + Math.min(16, Math.max(0, rect.height * 0.12));
    } else {
      left = rect.left + Math.max(0, (rect.width - panelWidth) / 2);
      top = rect.bottom + TOOLBAR_MIN_GAP;
      if (top + TOOLBAR_EST_H > vh - 8) {
        top = Math.max(8, rect.top - TOOLBAR_EST_H - TOOLBAR_MIN_GAP);
      }
    }

    left = Math.max(8, Math.min(left, vw - panelWidth - 8));
    top = Math.max(8, Math.min(top, vh - TOOLBAR_EST_H - 8));

    setDock((prev) => {
      if (
        prev &&
        Math.abs(prev.top - top) < 0.5 &&
        Math.abs(prev.left - left) < 0.5 &&
        Math.abs(prev.width - panelWidth) < 0.5
      ) {
        return prev;
      }
      return { top, left, width: panelWidth };
    });
  }, [showToolbar, visible]);

  useLayoutEffect(() => {
    if (!visible || !showToolbar) {
      setDock((prev) => (prev === null ? prev : null));
      return;
    }
    measureDock();
    const id = requestAnimationFrame(() => measureDock());
    return () => cancelAnimationFrame(id);
  }, [
    config.layout,
    config.width,
    config.maxHeight,
    measureDock,
    showToolbar,
    visible,
  ]);

  useEffect(() => {
    if (!visible || !showToolbar) return;
    const anchor = anchorRef.current;
    const ro = anchor ? new ResizeObserver(() => measureDock()) : null;
    if (anchor && ro) ro.observe(anchor);
    const opts = { capture: true } as const;
    window.addEventListener("scroll", measureDock, opts);
    window.addEventListener("resize", measureDock);
    return () => {
      ro?.disconnect();
      window.removeEventListener("scroll", measureDock, opts);
      window.removeEventListener("resize", measureDock);
    };
  }, [measureDock, showToolbar, visible]);

  const handleResizeStart = useCallback(
    (
      e: React.MouseEvent,
      type: "resize-br" | "resize-tl" | "resize-tr" | "resize-bl"
    ) => {
      e.preventDefault();
      e.stopPropagation();
      setDragState({
        kind: "resize",
        type,
        startX: e.clientX,
        startConfig: { ...config },
      });
      setShowToolbar(false);
    },
    [config]
  );

  useEffect(() => {
    if (!dragState) return;

    const flushMove = () => {
      rafRef.current = null;
      const point = pendingPointRef.current;
      if (!point) return;

      let next: ImageConfig;
      const isLeftHandle =
        dragState.type === "resize-tl" || dragState.type === "resize-bl";
      const deltaX = isLeftHandle
        ? dragState.startX - point.x
        : point.x - dragState.startX;
      const newWidth = Math.max(
        20,
        Math.min(100, dragState.startConfig.width + deltaX / 5)
      );
      next = {
        ...dragState.startConfig,
        layout:
          dragState.startConfig.layout === "full-width"
            ? "block"
            : dragState.startConfig.layout,
        width: Math.round(newWidth * 10) / 10,
        offsetX: 0,
        offsetY: 0,
      };

      if (!sameVisualConfig(lastVisualRef.current, next)) {
        lastVisualRef.current = next;
        onVisualChange(next);
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      pendingPointRef.current = { x: e.clientX, y: e.clientY };
      if (rafRef.current === null) {
        rafRef.current = requestAnimationFrame(flushMove);
      }
    };

    const handleMouseUp = () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        flushMove();
      }
      pendingPointRef.current = null;
      setDragState(null);
      setShowToolbar(true);
      onPersist();
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
      pendingPointRef.current = null;
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragState, onVisualChange, onPersist]);

  const handleLayoutChange = (layout: ImageLayout) => {
    onVisualChange({
      ...config,
      layout,
      width: layout === "full-width" ? 100 : config.width,
      offsetX: 0,
      offsetY: 0,
    });
    onPersist();
  };

  const handleWidthChange = (value: number) => {
    onVisualChange({
      ...config,
      layout: value < 100 && config.layout === "full-width" ? "block" : config.layout,
      width: value,
      offsetX: 0,
      offsetY: 0,
    });
  };

  const handleMaxHeightChange = (value: number) => {
    onVisualChange({ ...config, maxHeight: value, offsetX: 0, offsetY: 0 });
  };

  const handleRadiusChange = (value: number) => {
    onVisualChange({ ...config, borderRadius: value, offsetX: 0, offsetY: 0 });
  };

  const persistSliders = () => {
    onPersist();
  };

  const layoutButtons = generateLayoutButtons(config.layout);

  const toolbarNode =
    showToolbar && dock && typeof document !== "undefined" ? (
      <div
        className="xhs-image-edit-toolbar"
        style={{
          position: "fixed",
          top: dock.top,
          left: dock.left,
          width: dock.width,
          zIndex: Z_TOOLBAR,
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          padding: "10px 12px",
          background: "rgba(255,252,247,0.95)",
          borderRadius: "16px",
          boxShadow: "0 12px 26px rgba(61,42,18,0.14), 0 1px 0 rgba(255,255,255,0.88) inset",
          border: "1px solid rgba(108,76,33,0.10)",
          backdropFilter: "blur(10px) saturate(1.03)",
          boxSizing: "border-box",
          fontFamily:
            'system-ui,"PingFang SC","Microsoft YaHei",sans-serif',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "6px",
            alignItems: "center",
            justifyContent: "space-between",
            width: "100%",
          }}
        >
        <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", maxWidth: "100%" }}>
          {layoutButtons.map(({ layout, label, icon }) => (
            <LayoutButton
              key={layout}
              layout={layout}
              current={config.layout}
              label={label}
              icon={icon}
              onClick={() => handleLayoutChange(layout)}
            />
          ))}
        </div>

        <div style={{ width: "1px", height: "24px", background: "rgba(108,76,33,0.12)", flexShrink: 0 }} />

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "10px", color: "#6e5b49" }}>宽</span>
          <input
            type="range"
            min={20}
            max={100}
            value={config.width}
            onChange={(e) => handleWidthChange(Number(e.target.value))}
            onPointerUp={persistSliders}
            onBlur={persistSliders}
            style={{ width: "64px", accentColor }}
          />
          <span style={{ fontSize: "10px", color: "#8e7d68", minWidth: "26px" }}>
            {config.width}%
          </span>
        </div>

        <div style={{ width: "1px", height: "24px", background: "rgba(108,76,33,0.12)", flexShrink: 0 }} />

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "10px", color: "#6e5b49" }}>高</span>
          <input
            type="range"
            min={80}
            max={900}
            step={10}
            value={config.maxHeight}
            onChange={(e) => handleMaxHeightChange(Number(e.target.value))}
            onPointerUp={persistSliders}
            onBlur={persistSliders}
            style={{ width: "56px", accentColor }}
          />
          <span style={{ fontSize: "10px", color: "#8e7d68", minWidth: "30px" }}>
            {config.maxHeight}
          </span>
        </div>

        <div style={{ width: "1px", height: "24px", background: "rgba(108,76,33,0.12)", flexShrink: 0 }} />

        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
          <span style={{ fontSize: "10px", color: "#6e5b49" }}>圆角</span>
          <input
            type="range"
            min={0}
            max={24}
            value={config.borderRadius}
            onChange={(e) => handleRadiusChange(Number(e.target.value))}
            onPointerUp={persistSliders}
            onBlur={persistSliders}
            style={{ width: "50px", accentColor }}
          />
          <span style={{ fontSize: "10px", color: "#8e7d68", minWidth: "20px" }}>
            {config.borderRadius}
          </span>
        </div>

        <div style={{ width: "1px", height: "24px", background: "rgba(108,76,33,0.12)", flexShrink: 0 }} />

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          style={{
            padding: "6px 14px",
            border: "1px solid rgba(240,128,128,0.35)",
            borderRadius: "12px",
            background: "rgba(255,244,242,0.92)",
            color: "#d14b4b",
            fontSize: "11px",
            cursor: "pointer",
            marginLeft: "auto",
          }}
          title="从文中删除此图"
        >
          删除
        </button>
        </div>

      </div>
    ) : null;

  if (!visible) {
    return <>{children}</>;
  }

  return (
    <>
      <div
        ref={anchorRef}
        style={{
          position: "relative",
          width: "100%",
          overflow: "visible",
          pointerEvents: "auto",
          userSelect: "none",
          outline: dragState ? `2px solid ${accentColor}` : "1.5px dashed rgba(196,92,38,0.38)",
          outlineOffset: "5px",
          borderRadius: "18px",
          transition: "outline 0.15s, outline-offset 0.15s",
        }}
      >
        {children}

        {[
          { pos: "top-left", cursor: "nw-resize", type: "resize-tl" as const },
          { pos: "top-right", cursor: "ne-resize", type: "resize-tr" as const },
          { pos: "bottom-left", cursor: "sw-resize", type: "resize-bl" as const },
          { pos: "bottom-right", cursor: "se-resize", type: "resize-br" as const },
        ].map(({ pos, cursor, type }) => (
          <div
            key={pos}
            data-resize-handle="1"
            onMouseDown={(e) => handleResizeStart(e, type)}
            style={{
              position: "absolute",
              width: "16px",
              height: "16px",
              background: "rgba(255,252,247,0.98)",
              border: `2px solid ${accentColor}`,
              borderRadius: "6px",
              cursor,
              zIndex: Z_HANDLE,
              boxShadow: "0 6px 18px rgba(61,42,18,0.16)",
              ...(pos.includes("top") ? { top: "-8px" } : { bottom: "-8px" }),
              ...(pos.includes("left") ? { left: "-8px" } : { right: "-8px" }),
            }}
          />
        ))}
      </div>

      {toolbarNode ? createPortal(toolbarNode, document.body) : null}
    </>
  );
}

// ============================================================
// 工具函数：生成编辑后的 Markdown
// ============================================================

export function updateImageInMarkdown(
  markdown: string,
  imageIndex: number,
  updates: Partial<ImageConfig>
): string {
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let idx = 0;

  return markdown.replace(imgRegex, (match, alt, url) => {
    if (idx !== imageIndex) {
      idx++;
      return match;
    }
    idx++;

    const [cleanUrl, existingParams] = url.includes("?")
      ? [url.split("?")[0], url.split("?")[1]]
      : [url, ""];

    const params = new URLSearchParams(existingParams);
    if (updates.width !== undefined && updates.width !== 100) {
      params.set("w", String(updates.width));
    }
    if (updates.maxHeight !== undefined && updates.maxHeight !== 400) {
      params.set("h", String(updates.maxHeight));
    }
    if (updates.layout !== undefined && updates.layout !== "block") {
      params.set("layout", updates.layout);
    }
    if (updates.borderRadius !== undefined && updates.borderRadius !== 8) {
      params.set("r", String(updates.borderRadius));
    }
    if (updates.offsetX !== undefined && updates.offsetX !== 0) {
      params.set("dx", String(Math.round(updates.offsetX)));
    } else if (updates.offsetX === 0) {
      params.delete("dx");
    }
    if (updates.offsetY !== undefined && updates.offsetY !== 0) {
      params.set("dy", String(Math.round(updates.offsetY)));
    } else if (updates.offsetY === 0) {
      params.delete("dy");
    }

    const paramStr = params.toString();
    const newUrl = paramStr ? `${cleanUrl}?${paramStr}` : cleanUrl;

    return `![${alt}](${newUrl})`;
  });
}
