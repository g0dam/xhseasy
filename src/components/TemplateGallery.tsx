/**
 * TemplateGallery.tsx — 模板选择与编辑组件
 *
 * 功能：
 * 1. 按 7 大风格类别展示模板（折叠分组）
 * 2. 悬停即浮起大预览（无需先点击）
 * 3. 悬停预览中一键应用
 */

import { useState, useMemo, useRef } from "react";
import type { NoteTemplate, DecorationConfig, TemplateStyle } from "@/templates/index";
import { getAllTemplates } from "@/templates/index";

// ============================================================
// 类型
// ============================================================

export interface TemplateGalleryProps {
  open: boolean;
  onApply: (template: NoteTemplate) => void;
  onClose: () => void;
}

// ============================================================
// 模板分类配置
// ============================================================

interface Category {
  id: string;
  label: string;
  icon: string;
  styles: TemplateStyle[];
  tag?: string;
}

const CATEGORIES: Category[] = [
  { id: "all",     label: "全部",     icon: "✦", styles: [] },
  { id: "advanced",label: "高级系",  icon: "✧", styles: [], tag: "高级" },
  { id: "simple", label: "简约系",  icon: "□", styles: ["paper", "minimal", "clean-grid", "linen"] },
  { id: "mag",    label: "杂志系",  icon: "◆", styles: ["magazine"] },
  { id: "vintage",label: "复古系",  icon: "✿", styles: ["retro", "vintage-sepia"] },
  { id: "nature", label: "自然系",  icon: "❀", styles: ["sage-botanical", "fresh-mint", "watercolor"] },
  { id: "warm",   label: "温暖系",  icon: "♡", styles: ["warm-peach", "cream-pink", "scrapbook", "memo-cozy"] },
  { id: "dark",   label: "暗色系",  icon: "◑", styles: ["dark", "night-purple", "gradient-mood"] },
  { id: "fun",    label: "趣味系",  icon: "☆", styles: ["sticky", "notebook", "typewriter", "pastel-dream", "elegant-gold", "lemon-vintage"] },
];

// ============================================================
// 装饰渲染工具（复用给缩略图和预览浮层）
// ============================================================

function renderDecorInline(
  decorations: DecorationConfig,
  opts: { cardText: string; cardRadius: number; accent: string }
): React.ReactNode {
  const { cardText, cardRadius, accent } = opts;
  const elements: React.ReactNode[] = [];

  if (decorations.paperTexture) {
    elements.push(
      <div key="pt" style={{
        position: "absolute", inset: 0,
        opacity: 0.055,
        backgroundColor: "rgba(var(--paper-grain-color), 0.9)",
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='200' height='200' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat", backgroundSize: "200px 200px",
        pointerEvents: "none", zIndex: 1, borderRadius: `${cardRadius}px`,
      }} />
    );
  }

  if (decorations.topLine?.enabled) {
    const g = decorations.topLine.gradient;
    elements.push(
      <div key="tl" style={{
        position: "absolute", top: 0, left: 0, right: 0,
        height: decorations.topLine.height,
        background: `linear-gradient(90deg, ${g[0]} 0%, ${g[1]} ${g[2] * 100}%, ${g[3]} 100%)`,
        borderRadius: `${cardRadius}px ${cardRadius}px 0 0`,
        zIndex: 2,
      }} />
    );
  }

  if (decorations.bottomLine?.enabled) {
    const g = decorations.bottomLine.gradient;
    elements.push(
      <div key="bl" style={{
        position: "absolute", bottom: 0, left: 0, right: 0,
        height: decorations.bottomLine.height,
        background: `linear-gradient(90deg, ${g[0]} 0%, ${g[1]} ${g[2] * 100}%, ${g[3]} 100%)`,
        zIndex: 2,
      }} />
    );
  }

  if (decorations.tapeDecor?.enabled) {
    const t = decorations.tapeDecor;
    const posMap: Record<string, React.CSSProperties> = {
      tl: { top: "48px", left: "-3px", transform: `rotate(${t.angle}deg)`, transformOrigin: "bottom right" },
      tr: { top: "48px", right: "-3px", transform: `rotate(${-t.angle}deg)`, transformOrigin: "bottom left" },
      bl: { bottom: "-5px", left: "-3px", transform: `rotate(${-t.angle}deg)`, transformOrigin: "top right" },
      br: { bottom: "-5px", right: "-3px", transform: `rotate(${t.angle}deg)`, transformOrigin: "top left" },
    };
    elements.push(
      <div key="td" style={{
        position: "absolute",
        width: `${t.width}px`, height: `${t.height}px`,
        background: t.bg, opacity: t.opacity, zIndex: 10,
        boxShadow: "0 2px 4px rgba(var(--shadow-dark-rgb), 0.1)",
        ...posMap[t.position],
      }} />
    );
  }

  if (decorations.innerBorder?.enabled) {
    const b = decorations.innerBorder;
    elements.push(
      <div key="ib" style={{
        position: "absolute",
        inset: `${b.margin}px`,
        border: `${b.width}px ${b.style} ${b.color}`,
        borderRadius: `${Math.max(0, cardRadius - b.margin)}px`,
        pointerEvents: "none", zIndex: 5, opacity: 0.6,
      }} />
    );
  }

  if (decorations.cornerStamp?.enabled) {
    const s = decorations.cornerStamp;
    const posMap: Record<string, React.CSSProperties> = {
      tl: { top: "48px", left: "8px" }, tr: { top: "48px", right: "8px" },
      bl: { bottom: "8px", left: "8px" }, br: { bottom: "8px", right: "8px" },
    };
    elements.push(
      <div key="cs" style={{
        position: "absolute", fontSize: `${18 * s.scale}px`,
        background: s.bg, opacity: s.opacity,
        borderRadius: "8px", padding: "4px 8px",
        boxShadow: "0 2px 8px rgba(var(--shadow-dark-rgb), 0.15)",
        zIndex: 10, ...posMap[s.position],
      }}>
        {s.emoji}
      </div>
    );
  }

  if (decorations.cornerBadge?.enabled) {
    const cb = decorations.cornerBadge;
    const posMap: Record<string, React.CSSProperties> = {
      tl: { top: "48px", left: "8px" }, tr: { top: "48px", right: "8px" },
      bl: { bottom: "8px", left: "8px" }, br: { bottom: "8px", right: "8px" },
    };
    elements.push(
      <div key="cb" style={{
        position: "absolute",
        padding: "3px 8px",
        background: cb.bg, color: cb.color, borderRadius: "4px",
        fontSize: "11px", fontWeight: 700, zIndex: 10, ...posMap[cb.position],
      }}>
        {cb.text}
      </div>
    );
  }

  if (decorations.watermark?.enabled) {
    const wm = decorations.watermark;
    elements.push(
      <div key="wm" style={{
        position: "absolute", bottom: "10px", right: "12px",
        fontSize: "10px", color: cardText, opacity: wm.opacity,
        transform: `rotate(${wm.angle}deg)`,
        letterSpacing: "0.12em", pointerEvents: "none", zIndex: 6,
        textTransform: "uppercase",
      }}>
        {wm.text}
      </div>
    );
  }

  if (decorations.cornerBrackets?.enabled) {
    const c = decorations.cornerBrackets;
    const w = c.size, lw = c.width;
    elements.push(
      <svg key="br1" style={{ position: "absolute", top: "48px", left: "8px", width: `${w}px`, height: `${w}px`, zIndex: 8 }}
        viewBox={`0 0 ${w} ${w}`}>
        <path d={`M${lw},${w} L${lw},${lw} L${w},${lw}`} stroke={c.color} strokeWidth={lw} fill="none" strokeLinecap="round" />
      </svg>
    );
    elements.push(
      <svg key="br2" style={{ position: "absolute", bottom: "8px", right: "8px", width: `${w}px`, height: `${w}px`, zIndex: 8 }}
        viewBox={`0 0 ${w} ${w}`}>
        <path d={`M0,${w - lw} L${w - lw},${w - lw} L${w - lw},0`} stroke={c.color} strokeWidth={lw} fill="none" strokeLinecap="round" />
      </svg>
    );
  }

  if (decorations.advancedDecor?.enabled) {
    const variant = decorations.advancedDecor.variant;
    const accentHint = accent;
    const lowInk = "rgba(0,0,0,0.10)";
    elements.push(
      <div key="ad-grid" style={{
        position: "absolute",
        inset: variant === "archive-file" ? "8px 26px 8px 18px" : "8px",
        borderRadius: `${Math.max(2, cardRadius - 4)}px`,
        backgroundImage: variant === "tech-memo"
          ? `linear-gradient(${lowInk} 1px, transparent 1px), linear-gradient(90deg, ${lowInk} 1px, transparent 1px)`
          : "none",
        backgroundSize: "12px 12px",
        border: variant === "editorial-index" || variant === "archive-file" ? `1px solid ${lowInk}` : "none",
        zIndex: 3,
        opacity: 0.72,
      }} />
    );
    if (variant === "tech-memo" || variant === "editorial-index") {
      elements.push(
        <div key="ad-rail" style={{ position: "absolute", left: 8, top: 20, bottom: 8, width: 2, background: accentHint, opacity: 0.44, zIndex: 4 }} />
      );
    }
    if (variant === "study-flashcard" || variant === "warm-scrapbook") {
      elements.push(
        <div key="ad-note" style={{ position: "absolute", left: 22, right: 16, bottom: 10, height: 18, background: "rgba(255,221,128,0.46)", transform: "rotate(-3deg)", zIndex: 4 }} />
      );
    }
    if (variant === "archive-file") {
      elements.push(
        <div key="ad-tabs" style={{ position: "absolute", right: 0, top: 20, width: 12, height: 44, background: "rgba(130,124,70,0.44)", borderRadius: "5px 0 0 5px", zIndex: 4 }} />
      );
    }
    if (variant === "creator-note" || variant === "soft-paper") {
      elements.push(
        <div key="ad-heart" style={{ position: "absolute", right: 12, top: 22, color: cardText, opacity: 0.28, fontSize: 18, zIndex: 4 }}>♡</div>
      );
    }
    if (variant === "ai-dashboard") {
      elements.push(
        <div key="ad-meter" style={{ position: "absolute", left: 14, bottom: 10, width: 24, height: 24, borderRadius: "50%", background: `conic-gradient(${accentHint} 0 78%, rgba(0,0,0,0.08) 78% 100%)`, opacity: 0.58, zIndex: 4 }} />
      );
    }
  }

  return <>{elements}</>;
}

// ============================================================
// 缩略图（简化版，悬停触发预览浮层）
// ============================================================

function TemplateChipCard({
  template,
  onHover,
  onLeave,
  onClick,
}: {
  template: NoteTemplate;
  onHover: (e: React.MouseEvent) => void;
  onLeave: () => void;
  onClick: () => void;
}) {
  const { card, decorations, typography, colors } = template;
  const radius = Math.min(card.borderRadius, 6);

  const headingPrefix =
    typography.headingStyle === "line" ? "▎" :
    typography.headingStyle === "dot" ? "•" :
    typography.headingStyle === "bracket" ? "【" :
    typography.headingStyle === "underline" ? "_" : "";

  const listPrefix =
    typography.listStyle === "dot" ? "·" :
    typography.listStyle === "dash" ? "—" :
    typography.listStyle === "number" ? "①" :
    typography.listStyle === "checkbox" ? "☐" : "·";

  return (
    <div
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onClick={onClick}
      style={{
        position: "relative",
        cursor: "pointer",
        borderRadius: "12px",
        overflow: "visible",
        transition: "transform 0.18s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.18s ease",
      }}
    >
      <div
        style={{
          width: "100%",
          height: "72px",
          background: card.background,
          borderRadius: `${radius}px`,
          boxShadow: card.shadow[0],
          border: card.border !== "rgba(0,0,0,0)" && card.border !== "transparent" ? card.border : "none",
          position: "relative",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          padding: "6px",
          gap: "2px",
        }}
      >
        {decorations.topLine?.enabled && (
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            height: Math.max(decorations.topLine.height * 0.7, 2),
            background: `linear-gradient(90deg, ${decorations.topLine.gradient[0]} 0%, ${decorations.topLine.gradient[1]} ${(decorations.topLine.gradient[2] ?? 0.5) * 100}%, ${decorations.topLine.gradient[3]} 100%)`,
          }} />
        )}
        {decorations.paperTexture && (
          <div style={{
            position: "absolute", inset: 0, opacity: 0.07,
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='20' height='20'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='20' height='20' filter='url(%23n)' opacity='0.5'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat", backgroundSize: "20px 20px",
            pointerEvents: "none",
          }} />
        )}
        <div style={{ position: "relative", zIndex: 1, paddingTop: decorations.topLine?.enabled ? "4px" : "0" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
            {headingPrefix && <span style={{ fontSize: "5px", color: colors.accent, fontWeight: 700, lineHeight: 1 }}>{headingPrefix}</span>}
            <div style={{ flex: 1, height: "4px", background: colors.primary, borderRadius: "2px", opacity: 0.8 }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "1px", marginTop: "2px" }}>
            <div style={{ width: "85%", height: "3px", background: colors.primary, borderRadius: "2px", opacity: 0.25 }} />
            <div style={{ width: "65%", height: "3px", background: colors.primary, borderRadius: "2px", opacity: 0.25 }} />
          </div>
          {typography.blockquoteStyle === "accent" && (
            <div style={{ width: "22%", height: "2px", background: colors.accent, borderRadius: "2px", marginTop: "2px" }} />
          )}
          <div style={{ display: "flex", alignItems: "center", gap: "2px", marginTop: "2px" }}>
            <span style={{ fontSize: "5px", color: colors.muted }}>{listPrefix}</span>
            <div style={{ width: "18%", height: "2px", background: colors.primary, borderRadius: "1px", opacity: 0.2 }} />
          </div>
        </div>
        {decorations.cornerBadge && (
          <div style={{
            position: "absolute",
            top: decorations.cornerBadge.position.includes("t") ? "2px" : "auto",
            bottom: decorations.cornerBadge.position.includes("b") ? "2px" : "auto",
            right: decorations.cornerBadge.position.includes("r") ? "2px" : "auto",
            left: decorations.cornerBadge.position.includes("l") ? "2px" : "auto",
            padding: "1px 4px", background: decorations.cornerBadge.bg,
            color: decorations.cornerBadge.color, borderRadius: "3px",
            fontSize: "5px", fontWeight: 700, zIndex: 2,
          }}>
            {decorations.cornerBadge.text}
          </div>
        )}
      </div>
      <div style={{ textAlign: "center", marginTop: "4px" }}>
        <div style={{ fontSize: "11px", fontWeight: 600, color: colors.primary, lineHeight: 1.2 }}>{template.name}</div>
      </div>
    </div>
  );
}

// ============================================================
// 预览浮层（大尺寸，带应用按钮）
// ============================================================

function TemplateHoverPreview({
  template,
  onApply,
  onClose,
}: {
  template: NoteTemplate;
  onApply: (t: NoteTemplate) => void;
  onClose: () => void;
}) {
  const { card, decorations, typography, colors } = template;
  const radius = card.borderRadius;
  const previewW = 220;
  const fontFamily =
    typography.font === "serif"
      ? '"Noto Serif SC",serif'
      : typography.font === "mono"
        ? '"Cascadia Code",monospace'
        : '"PingFang SC",sans-serif';

  return (
    <div
      style={{
        position: "fixed",
        zIndex: 9999,
        width: `${previewW + 32}px`,
        pointerEvents: "none",
      }}
    >
      {/* 卡片 */}
      <div style={{
        width: `${previewW}px`,
        background: card.background,
        borderRadius: `${radius}px`,
        boxShadow: card.shadow[1] ?? card.shadow[0],
        border: card.border !== "rgba(0,0,0,0)" && card.border !== "transparent" ? card.border : "none",
        position: "relative",
        overflow: "hidden",
        padding: "16px",
      }}>
        {/* 装饰元素 */}
        {renderDecorInline(decorations, {
          cardText: colors.primary,
          cardRadius: radius,
          accent: colors.accent,
        })}

        {/* 内容 */}
        <div style={{ position: "relative", zIndex: 5 }}>
          <h2 style={{
            fontSize: "15px", fontWeight: 700, color: colors.primary,
            margin: decorations.topLine?.enabled ? "8px 0 10px" : "0 0 10px",
            fontFamily,
            letterSpacing: "0",
          }}>
            {typography.headingStyle === "line" ? "▎ " : ""}标题示例
          </h2>
          <p style={{
            fontSize: "12px", lineHeight: 1.7, color: colors.primary,
            margin: "0 0 10px", fontFamily, opacity: 0.8,
          }}>
            正文内容预览，展示当前模板的排版效果与装饰元素组合。
          </p>
          {typography.blockquoteStyle === "accent" && (
            <div style={{
              padding: "6px 10px",
              borderLeft: `3px solid ${colors.accent}`,
              background: `${colors.accent}12`,
              borderRadius: "0 6px 6px 0",
              fontSize: "11px", color: colors.muted,
              marginBottom: "10px", fontFamily, fontStyle: "italic",
            }}>
              " 引言示例 "
            </div>
          )}
          <div style={{ fontSize: "11px", color: colors.muted, fontFamily }}>
            {typography.listStyle === "dash" ? "— " : typography.listStyle === "number" ? "① " : "· "}列表项一
            <br />
            {typography.listStyle === "dash" ? "— " : typography.listStyle === "number" ? "② " : "· "}列表项二
          </div>
        </div>
      </div>

      {/* 操作按钮 */}
      <div style={{
        display: "flex", gap: "8px", marginTop: "10px",
        justifyContent: "center", pointerEvents: "auto",
      }}>
        <button
          onClick={(e) => { e.stopPropagation(); onClose(); onApply(template); }}
          style={{
            padding: "8px 20px",
            border: "none",
            borderRadius: "10px",
            background: `linear-gradient(135deg, ${colors.accent} 0%, ${colors.secondary ?? colors.accent} 100%)`,
            color: "#fff",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            boxShadow: `0 8px 20px ${colors.accent}40`,
            fontFamily: "inherit",
            letterSpacing: "0.04em",
            transition: "transform 0.12s, box-shadow 0.12s",
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = "translateY(-2px)")}
          onMouseLeave={e => (e.currentTarget.style.transform = "translateY(0)")}
        >
          应用此模板
        </button>
      </div>
    </div>
  );
}

// ============================================================
// 主组件
// ============================================================

export function TemplateGallery({
  open,
  onApply,
  onClose,
}: TemplateGalleryProps) {
  const [activeCategory, setActiveCategory] = useState("all");
  const [hoveredTemplate, setHoveredTemplate] = useState<NoteTemplate | null>(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });
  const listRef = useRef<HTMLDivElement>(null);

  // 用 ref 管理 hover，避免 onMouseLeave/onMouseEnter 时序冲突
  const hoverRef = useRef<NoteTemplate | null>(null);
  const leaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 按分类过滤模板
  const categoryTemplates = useMemo(() => {
    const cat = CATEGORIES.find(c => c.id === activeCategory);
    if (!cat || cat.id === "all") return getAllTemplates();
    if (cat.tag) return getAllTemplates().filter(t => t.tags.includes(cat.tag!));
    return getAllTemplates().filter(t => cat.styles.includes(t.style));
  }, [activeCategory]);

  // 当前分类（不含"全部"）
  const currentCat = CATEGORIES.find(c => c.id === activeCategory);

  function handleMouseEnter(template: NoteTemplate, e: React.MouseEvent) {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
    setHoveredTemplate(template);
    hoverRef.current = template;
    // 计算浮层位置：以当前按钮为基准，优先在右侧，贴边时切到左侧
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const previewW = 220;
    const previewH = 340;
    let x = rect.right + 12;
    let y = rect.top;
    if (x + previewW > window.innerWidth - 8) x = rect.left - previewW - 12;
    if (y + previewH > window.innerHeight - 8) y = window.innerHeight - previewH - 8;
    if (y < 8) y = 8;
    setHoverPos({ x, y });
  }

  function handleMouseLeave() {
    // 延时清除，防止鼠标快速滑过到浮层时误触
    leaveTimerRef.current = setTimeout(() => {
      setHoveredTemplate(null);
      hoverRef.current = null;
    }, 120);
  }

  function handlePreviewMouseEnter() {
    if (leaveTimerRef.current) clearTimeout(leaveTimerRef.current);
  }

  if (!open) return null;

  return (
    <>
      {/* 遮罩 */}
      <div onClick={onClose} style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.35)",
        zIndex: 200, backdropFilter: "blur(2px)",
      }} />

      {/* 面板 */}
      <div style={{
        position: "fixed",
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        width: "min(92vw, 860px)",
        maxHeight: "88vh",
        background: "#fff",
        borderRadius: "20px",
        boxShadow: "0 24px 80px rgba(0,0,0,0.25), 0 8px 24px rgba(0,0,0,0.12)",
        zIndex: 201,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}>
        {/* 头部 */}
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "16px 20px",
          borderBottom: "1px solid #f0f0f0",
          flexShrink: 0,
          background: "linear-gradient(to right, rgba(196,92,38,0.04) 0%, transparent 60%)",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <h2 style={{ fontSize: "17px", fontWeight: 700, margin: 0 }}>选择模板</h2>
            <span style={{ fontSize: "12px", color: "#aaa" }}>{categoryTemplates.length} 个模板</span>
          </div>
          <button onClick={onClose} style={{
            background: "none", border: "none", fontSize: "18px",
            color: "#bbb", cursor: "pointer", padding: "4px 8px",
          }}>
            ✕
          </button>
        </div>

        {/* 分类导航 */}
        <div style={{
          display: "flex", gap: "6px", padding: "12px 16px",
          borderBottom: "1px solid #f5f5f5",
          flexShrink: 0, overflowX: "auto",
          scrollbarWidth: "none",
        }}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                border: "1.5px solid",
                borderColor: activeCategory === cat.id ? cat.id === "all" ? "#c45c26" : getAllTemplates().find(t => cat.styles.includes(t.style))?.colors.accent ?? "#c45c26" : "#e8e8e8",
                background: activeCategory === cat.id ? "rgba(196,92,38,0.08)" : "#fff",
                color: activeCategory === cat.id ? "#c45c26" : "#666",
                fontSize: "12px",
                fontWeight: activeCategory === cat.id ? 700 : 500,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s",
                flexShrink: 0,
              }}
            >
              <span style={{ marginRight: "4px" }}>{cat.icon}</span>
              {cat.label}
            </button>
          ))}
        </div>

        {/* 分类标题 */}
        {currentCat && currentCat.id !== "all" && (
          <div style={{
            padding: "8px 20px 4px",
            fontSize: "11px", color: "#aaa", fontWeight: 500,
            letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0,
          }}>
            {currentCat.icon} {currentCat.label}
          </div>
        )}

        {/* 模板网格 */}
        <div
          data-list
          ref={listRef}
          style={{
            flex: 1, overflowY: "auto",
            padding: "12px 16px 16px",
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
            gap: "16px",
            alignContent: "start",
          }}
        >
          {categoryTemplates.map(template => (
            <TemplateChipCard
              key={template.id}
              template={template}
              onHover={(e: React.MouseEvent) => handleMouseEnter(template, e)}
              onLeave={handleMouseLeave}
              onClick={() => { onApply(template); onClose(); }}
            />
          ))}
          {categoryTemplates.length === 0 && (
            <div style={{ gridColumn: "1/-1", textAlign: "center", color: "#ccc", padding: "40px 0", fontSize: "13px" }}>
              该分类暂无模板
            </div>
          )}
        </div>
      </div>

      {/* 悬停预览浮层（固定在鼠标悬停位置） */}
      {hoveredTemplate && (
        <div
          onMouseEnter={handlePreviewMouseEnter}
          onMouseLeave={handleMouseLeave}
          style={{
            position: "fixed",
            left: `${hoverPos.x}px`,
            top: `${hoverPos.y}px`,
            zIndex: 9999,
          }}
        >
          <TemplateHoverPreview
            template={hoveredTemplate}
            onApply={onApply}
            onClose={() => setHoveredTemplate(null)}
          />
        </div>
      )}
    </>
  );
}

// ============================================================
// 工具：模板 Chip（轻量版按钮）
// ============================================================

export function TemplateChip({
  template,
  isActive,
  onClick,
}: {
  template: NoteTemplate;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: "6px",
        padding: "5px 10px",
        border: "1.5px solid",
        borderColor: isActive ? template.colors.accent : "#e0e0e0",
        borderRadius: "20px",
        background: isActive ? `${template.colors.accent}12` : "#fff",
        color: isActive ? template.colors.accent : "#555",
        fontSize: "12px",
        cursor: "pointer",
        transition: "all 0.15s",
        fontWeight: isActive ? 700 : 500,
      }}
    >
      <div style={{
        width: "10px", height: "10px", borderRadius: "3px",
        background: template.colors.accent, flexShrink: 0,
      }} />
      <span>{template.name}</span>
    </button>
  );
}
