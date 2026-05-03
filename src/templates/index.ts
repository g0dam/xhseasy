/**
 * templates/index.ts — 小红书笔记模板系统
 *
 * 支持多种视觉风格模板，每个模板包含：
 * - 卡片样式（背景、圆角、阴影）
 * - 装饰元素（顶线、角标、水印）
 * - 排版规则（字体、标题样式、列表样式）
 * - 预设默认值
 *
 * 配色规范：
 * - 所有深色背景模板的边框使用 rgba(255,255,255,0.12) 而非 0.08（确保可见）
 * - 所有浅色背景模板的边框使用 rgba(0,0,0,0.06~0.12)
 * - 强调色（accent）必须与背景有足够对比度
 * - 角落装饰（胶带/贴纸/角标）统一从 top:48px 开始（避开 meta 区）
 * - innerBorder 的 margin 至少 20px（避开 meta 区）
 */

import type { FontFamily } from "@/types";
import type { ThemeConfig } from "@/types";

// ============================================================
// 类型定义
// ============================================================

export type TemplateStyle = "paper" | "minimal" | "modern" | "dark" | "magazine" | "retro"
  | "sticky" | "notebook" | "typewriter" | "clean-grid" | "vintage-sepia" | "fresh-mint"
  | "warm-peach" | "night-purple" | "elegant-gold" | "pastel-dream" | "bold-contrast"
  | "linen" | "watercolor" | "gradient-mood"
  | "scrapbook" | "memo-cozy" | "sage-botanical" | "cream-pink" | "lemon-vintage";

export interface CardStyle {
  background: string;
  borderRadius: number;
  shadow: [string, string];
  border: string;
}

export interface DecorationConfig {
  topLine: {
    enabled: boolean;
    height: number;
    gradient: [string, string, number, string];
  };
  cornerBadge: {
    enabled: boolean;
    text: string;
    position: "tl" | "tr" | "bl" | "br";
    bg: string;
    color: string;
  } | null;
  watermark: {
    enabled: boolean;
    text: string;
    opacity: number;
    angle: number;
  } | null;
  paperTexture: boolean;
  /** 胶带装饰：贴在卡片角落的胶带效果（top 位置固定为 48px 避开 meta 区） */
  tapeDecor: {
    enabled: boolean;
    position: "tl" | "tr" | "bl" | "br";
    width: number;
    height: number;
    bg: string;
    opacity: number;
    angle: number;
  } | null;
  /** 内边框装饰：卡片内部虚线边框（margin 固定 20px 避开 meta 区） */
  innerBorder: {
    enabled: boolean;
    style: "dashed" | "dotted" | "double" | "solid";
    color: string;
    width: number;
    margin: number;
  } | null;
  /** 角落印章/贴纸（top 位置固定为 48px 避开 meta 区） */
  cornerStamp: {
    enabled: boolean;
    position: "tl" | "tr" | "bl" | "br";
    emoji: string;
    bg: string;
    opacity: number;
    scale: number;
  } | null;
  /** 底部装饰条 */
  bottomLine: {
    enabled: boolean;
    height: number;
    gradient: [string, string, number, string];
  } | null;
  /** 角落装饰括号（top 位置固定为 48px 避开 meta 区） */
  cornerBrackets: {
    enabled: boolean;
    color: string;
    width: number;
    size: number;
  } | null;
  /**
   * 高级模板专属的安全装饰层。
   * 这些元素只作为背景/边缘装饰渲染，内容层始终在其上方，避免遮挡正文。
   */
  advancedDecor?: {
    enabled: boolean;
    variant:
      | "soft-paper"
      | "tech-memo"
      | "warm-scrapbook"
      | "editorial-index"
      | "ai-dashboard"
      | "study-flashcard"
      | "archive-file"
      | "creator-note"
      | "food-recipe"
      | "travel-map"
      | "fashion-lookbook"
      | "beauty-swatch"
      | "fitness-energy"
      | "book-review"
      | "parenting-soft"
      | "home-decor"
      | "photo-frame"
      | "finance-ledger";
  } | null;
}

export interface TypographyRules {
  font: FontFamily;
  headingStyle: "line" | "dot" | "bracket" | "none" | "underline";
  listStyle: "dot" | "number" | "checkbox" | "dash";
  blockquoteStyle: "accent" | "dashed" | "filled" | "quote";
  codeStyle: "line" | "bg" | "mono";
}

export interface NoteTemplate {
  /** 模板 ID */
  id: string;
  /** 模板名称 */
  name: string;
  /** 描述 */
  description: string;
  /** 风格 */
  style: TemplateStyle;
  /** 缩略图（SVG 或 CSS 生成的预览） */
  thumbnail: string;
  /** 标签 */
  tags: string[];
  /** 卡片样式 */
  card: CardStyle;
  /** 装饰配置 */
  decorations: DecorationConfig;
  /** 排版规则 */
  typography: TypographyRules;
  /** 配色方案 */
  colors: {
    primary: string;
    secondary: string;
    muted: string;
    accent: string;
  };
  /** 默认主题配置 */
  defaultTheme: Partial<ThemeConfig>;
  /** 是否是内置模板 */
  builtIn: boolean;
}

// ============================================================
// 内置模板
// ============================================================

export const BUILT_IN_TEMPLATES: NoteTemplate[] = [
  // ── 1. 纸感笔记 ──────────────────────────────────────────
  // 经典复古纸感，适合知识整理
  {
    id: "paper-classic",
    name: "纸感笔记",
    description: "复古纸张质感，配合强调线装饰，适合知识整理类内容",
    style: "paper",
    thumbnail: "📄",
    tags: ["知识整理", "复古", "纸感"],
    card: {
      background: "#f5f2e9",
      borderRadius: 14,
      shadow: [
        "0 2px 8px rgba(0,0,0,0.07)",
        "0 10px 32px rgba(0,0,0,0.10)",
      ],
      border: "rgba(0,0,0,0.08)",
    },
    decorations: {
      topLine: { enabled: true, height: 3, gradient: ["#c45c26", "#c45c26", 0.6, "rgba(196,92,38,0.35)"] },
      cornerBadge: null,
      watermark: null,
      paperTexture: true,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "serif",
      headingStyle: "line",
      listStyle: "dot",
      blockquoteStyle: "accent",
      codeStyle: "line",
    },
    colors: {
      primary: "#222222",
      secondary: "#3b3b3b",
      muted: "#6e6e6e",
      accent: "#c45c26",
    },
    defaultTheme: {
      cardBg: "#f5f2e9",
      cardText: "#222222",
      cardMuted: "#6b5c4a",
      accent: "#c45c26",
      accentDim: "rgba(196,92,38,0.18)",
      bodyBg: "#e8e4d9",
      cardBorder: "rgba(90,70,50,0.10)",
      font: "serif",
      fontSize: 17,
      lineHeight: 1.75,
    },
    builtIn: true,
  },

  // ── 2. 极简白 ────────────────────────────────────────────
  // 大量留白，无装饰，适合简洁干练内容
  {
    id: "minimal-white",
    name: "极简白",
    description: "大量留白，无装饰元素，适合简洁干练的内容表达",
    style: "minimal",
    thumbnail: "⬜",
    tags: ["极简", "干净", "商务"],
    card: {
      background: "#ffffff",
      borderRadius: 8,
      shadow: [
        "0 1px 3px rgba(0,0,0,0.04)",
        "0 4px 12px rgba(0,0,0,0.06)",
      ],
      border: "rgba(0,0,0,0.06)",
    },
    decorations: {
      topLine: { enabled: false, height: 0, gradient: ["", "", 0, ""] },
      cornerBadge: null,
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "sans",
      headingStyle: "underline",
      listStyle: "number",
      blockquoteStyle: "dashed",
      codeStyle: "bg",
    },
    colors: {
      primary: "#1a1a1a",
      secondary: "#333333",
      muted: "#777777",
      accent: "#2563eb",
    },
    defaultTheme: {
      cardBg: "#ffffff",
      cardText: "#1a1a1a",
      cardMuted: "#666666",
      accent: "#2563eb",
      accentDim: "rgba(37,99,235,0.15)",
      bodyBg: "#f0f0f0",
      cardBorder: "rgba(0,0,0,0.06)",
      font: "sans",
      fontSize: 16,
      lineHeight: 1.8,
    },
    builtIn: true,
  },

  // ── 3. 杂志风 ────────────────────────────────────────────
  // 大标题醒目，红色角标，适合视觉冲击力内容
  {
    id: "magazine-style",
    name: "杂志风",
    description: "大标题醒目，彩色引言块，适合需要视觉冲击力的内容",
    style: "magazine",
    thumbnail: "📰",
    tags: ["杂志", "视觉冲击", "创意"],
    card: {
      background: "#fefefe",
      borderRadius: 16,
      shadow: [
        "0 4px 16px rgba(0,0,0,0.10)",
        "0 16px 48px rgba(0,0,0,0.12)",
      ],
      border: "rgba(0,0,0,0.06)",
    },
    decorations: {
      topLine: { enabled: true, height: 5, gradient: ["#ef4444", "#f97316", 0.5, "#fbbf24"] },
      cornerBadge: { enabled: true, text: "NEW", position: "tr", bg: "#ef4444", color: "#fff" },
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "serif",
      headingStyle: "bracket",
      listStyle: "dash",
      blockquoteStyle: "filled",
      codeStyle: "bg",
    },
    colors: {
      primary: "#1a1a1a",
      secondary: "#333333",
      muted: "#666666",
      accent: "#ef4444",
    },
    defaultTheme: {
      cardBg: "#fefefe",
      cardText: "#1a1a1a",
      cardMuted: "#5a5a5a",
      accent: "#ef4444",
      accentDim: "rgba(239,68,68,0.18)",
      bodyBg: "#f5f5f5",
      cardBorder: "rgba(0,0,0,0.06)",
      font: "serif",
      fontSize: 18,
      lineHeight: 1.7,
    },
    builtIn: true,
  },

  // ── 4. 暗夜模式 ──────────────────────────────────────────
  // 深色背景配亮色文字，深色边框改为 0.12 透明度确保可见
  {
    id: "dark-mode",
    name: "暗夜模式",
    description: "深色背景配亮色文字，适合夜间阅读和科技类内容",
    style: "dark",
    thumbnail: "🌙",
    tags: ["暗色", "科技", "夜间"],
    card: {
      background: "#1e1e1e",
      borderRadius: 12,
      shadow: [
        "0 2px 12px rgba(0,0,0,0.30)",
        "0 8px 32px rgba(0,0,0,0.40)",
      ],
      border: "rgba(255,255,255,0.12)",
    },
    decorations: {
      topLine: { enabled: true, height: 2, gradient: ["#60a5fa", "#60a5fa", 0.7, "rgba(96,165,250,0.30)"] },
      cornerBadge: null,
      watermark: { enabled: true, text: "DRAFT", opacity: 0.08, angle: -30 },
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "sans",
      headingStyle: "line",
      listStyle: "dot",
      blockquoteStyle: "accent",
      codeStyle: "mono",
    },
    colors: {
      primary: "#e0e0e0",
      secondary: "#c0c0c0",
      muted: "#909090",
      accent: "#60a5fa",
    },
    defaultTheme: {
      cardBg: "#1e1e1e",
      cardText: "#e0e0e0",
      cardMuted: "#a0a0a0",
      accent: "#60a5fa",
      accentDim: "rgba(96,165,250,0.25)",
      bodyBg: "#111111",
      cardBorder: "rgba(255,255,255,0.12)",
      font: "sans",
      fontSize: 16,
      lineHeight: 1.8,
    },
    builtIn: true,
  },

  // ── 5. 手账风 ────────────────────────────────────────────
  // 活泼配色，角标在右上角避开头像
  {
    id: "scrapbook",
    name: "手账风",
    description: "活泼配色，边角装饰，适合生活分享和个人记录",
    style: "modern",
    thumbnail: "📔",
    tags: ["生活", "活泼", "手账"],
    card: {
      background: "#fef9f0",
      borderRadius: 20,
      shadow: [
        "0 3px 10px rgba(0,0,0,0.08)",
        "0 12px 36px rgba(0,0,0,0.10)",
      ],
      border: "rgba(0,0,0,0.06)",
    },
    decorations: {
      topLine: { enabled: true, height: 4, gradient: ["#f472b6", "#a855f7", 0.5, "#6366f1"] },
      cornerBadge: { enabled: true, text: "✨", position: "tr", bg: "#fef08a", color: "#92400e" },
      watermark: null,
      paperTexture: true,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "sans",
      headingStyle: "dot",
      listStyle: "checkbox",
      blockquoteStyle: "quote",
      codeStyle: "line",
    },
    colors: {
      primary: "#1f1f1f",
      secondary: "#3f3f3f",
      muted: "#707070",
      accent: "#a855f7",
    },
    defaultTheme: {
      cardBg: "#fef9f0",
      cardText: "#1f1f1f",
      cardMuted: "#7a7a7a",
      accent: "#a855f7",
      accentDim: "rgba(168,85,247,0.20)",
      bodyBg: "#f0e6d3",
      cardBorder: "rgba(0,0,0,0.06)",
      font: "sans",
      fontSize: 16,
      lineHeight: 1.8,
    },
    builtIn: true,
  },

  // ── 6. 复古报纸（简化版）────────────────────────────────
  // 仿传统报纸排版，报头+水印，无复杂装饰确保头像不被挡
  {
    id: "retro-newspaper",
    name: "复古报纸",
    description: "仿传统报纸排版，适合历史、文学、深度分析类内容",
    style: "retro",
    thumbnail: "📰",
    tags: ["复古", "报纸", "深度"],
    card: {
      background: "#f5f0e6",
      borderRadius: 0,
      shadow: [
        "0 1px 2px rgba(0,0,0,0.05)",
        "0 4px 8px rgba(0,0,0,0.08)",
      ],
      border: "1px solid rgba(0,0,0,0.12)",
    },
    decorations: {
      topLine: { enabled: true, height: 2, gradient: ["#1a1a1a", "#1a1a1a", 1, "rgba(0,0,0,0.5)"] },
      cornerBadge: null,
      watermark: { enabled: true, text: "AI GENERATED", opacity: 0.06, angle: -45 },
      paperTexture: true,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "serif",
      headingStyle: "underline",
      listStyle: "number",
      blockquoteStyle: "accent",
      codeStyle: "line",
    },
    colors: {
      primary: "#1a1a1a",
      secondary: "#333333",
      muted: "#555555",
      accent: "#1a1a1a",
    },
    defaultTheme: {
      cardBg: "#f5f0e6",
      cardText: "#1a1a1a",
      cardMuted: "#5a5a5a",
      accent: "#1a1a1a",
      accentDim: "rgba(26,26,26,0.20)",
      bodyBg: "#e0d9c8",
      cardBorder: "rgba(0,0,0,0.12)",
      font: "serif",
      fontSize: 17,
      lineHeight: 1.65,
    },
    builtIn: true,
  },

  // ── 7. 便签墙 ────────────────────────────────────────────
  // 仿真黄色便利贴，随性活泼
  {
    id: "sticky-note",
    name: "便签墙",
    description: "仿真黄色便签风格，随手记录感，适合清单、碎碎念、个人灵感",
    style: "sticky",
    thumbnail: "📝",
    tags: ["便签", "生活", "活泼"],
    card: {
      background: "#fff9c4",
      borderRadius: 2,
      shadow: [
        "0 1px 3px rgba(0,0,0,0.10)",
        "0 4px 12px rgba(0,0,0,0.14)",
      ],
      border: "rgba(0,0,0,0.08)",
    },
    decorations: {
      topLine: { enabled: false, height: 0, gradient: ["", "", 0, ""] },
      cornerBadge: null,
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "sans",
      headingStyle: "dot",
      listStyle: "checkbox",
      blockquoteStyle: "quote",
      codeStyle: "line",
    },
    colors: {
      primary: "#3e2723",
      secondary: "#5d4037",
      muted: "#6d4c41",
      accent: "#f57f17",
    },
    defaultTheme: {
      cardBg: "#fff9c4",
      cardText: "#3e2723",
      cardMuted: "#6d4c41",
      accent: "#f57f17",
      accentDim: "rgba(245,127,23,0.25)",
      bodyBg: "#f5f5dc",
      cardBorder: "rgba(0,0,0,0.08)",
      font: "sans",
      fontSize: 15,
      lineHeight: 1.75,
    },
    builtIn: true,
  },

  // ── 8. 笔记本 ────────────────────────────────────────────
  // 仿真横线笔记本，适合学习笔记
  {
    id: "notebook",
    name: "笔记本",
    description: "仿真横线笔记本质感，适合学习笔记、读书摘录、课程记录",
    style: "notebook",
    thumbnail: "📓",
    tags: ["学习", "笔记", "横线"],
    card: {
      background: "#fafffe",
      borderRadius: 4,
      shadow: [
        "0 1px 4px rgba(0,0,0,0.08)",
        "0 6px 20px rgba(0,0,0,0.10)",
      ],
      border: "rgba(0,0,0,0.06)",
    },
    decorations: {
      topLine: { enabled: true, height: 1, gradient: ["#1565c0", "#1565c0", 0.5, "#42a5f5"] },
      cornerBadge: null,
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "serif",
      headingStyle: "underline",
      listStyle: "number",
      blockquoteStyle: "accent",
      codeStyle: "line",
    },
    colors: {
      primary: "#1a237e",
      secondary: "#283593",
      muted: "#5c6bc0",
      accent: "#1565c0",
    },
    defaultTheme: {
      cardBg: "#fafffe",
      cardText: "#1a237e",
      cardMuted: "#4a5568",
      accent: "#1565c0",
      accentDim: "rgba(21,101,192,0.22)",
      bodyBg: "#e3f2fd",
      cardBorder: "rgba(0,0,0,0.06)",
      font: "serif",
      fontSize: 16,
      lineHeight: 1.8,
    },
    builtIn: true,
  },

  // ── 9. 打字机 ────────────────────────────────────────────
  // 复古机械键盘感，等宽字体
  {
    id: "typewriter",
    name: "打字机",
    description: "机械打字机质感，等宽字体，适合故事叙述、书评影评、干货长文",
    style: "typewriter",
    thumbnail: "⌨️",
    tags: ["打字机", "复古", "文学"],
    card: {
      background: "#f0ede8",
      borderRadius: 0,
      shadow: [
        "0 2px 6px rgba(0,0,0,0.06)",
        "0 8px 24px rgba(0,0,0,0.08)",
      ],
      border: "1px solid rgba(0,0,0,0.10)",
    },
    decorations: {
      topLine: { enabled: true, height: 3, gradient: ["#b71c1c", "#c62828", 0.5, "#e53935"] },
      cornerBadge: null,
      watermark: { enabled: true, text: "TYPED", opacity: 0.05, angle: -20 },
      paperTexture: true,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "mono",
      headingStyle: "line",
      listStyle: "dash",
      blockquoteStyle: "accent",
      codeStyle: "mono",
    },
    colors: {
      primary: "#212121",
      secondary: "#424242",
      muted: "#616161",
      accent: "#c62828",
    },
    defaultTheme: {
      cardBg: "#f0ede8",
      cardText: "#212121",
      cardMuted: "#5a5a5a",
      accent: "#c62828",
      accentDim: "rgba(198,40,40,0.22)",
      bodyBg: "#d7ccc8",
      cardBorder: "rgba(0,0,0,0.10)",
      font: "mono",
      fontSize: 16,
      lineHeight: 1.85,
    },
    builtIn: true,
  },

  // ── 10. 极简网格 ──────────────────────────────────────────
  // 大幅留白，克制美学
  {
    id: "clean-grid",
    name: "极简网格",
    description: "大量留白，网格感强，适合技术文档、效率工具、干货清单",
    style: "clean-grid",
    thumbnail: "⬜",
    tags: ["极简", "克制", "网格"],
    card: {
      background: "#ffffff",
      borderRadius: 6,
      shadow: [
        "0 0 0 1px rgba(0,0,0,0.05)",
        "0 2px 8px rgba(0,0,0,0.04)",
      ],
      border: "rgba(0,0,0,0.06)",
    },
    decorations: {
      topLine: { enabled: false, height: 0, gradient: ["", "", 0, ""] },
      cornerBadge: null,
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "sans",
      headingStyle: "none",
      listStyle: "number",
      blockquoteStyle: "dashed",
      codeStyle: "bg",
    },
    colors: {
      primary: "#111111",
      secondary: "#333333",
      muted: "#666666",
      accent: "#222222",
    },
    defaultTheme: {
      cardBg: "#ffffff",
      cardText: "#111111",
      cardMuted: "#5a5a5a",
      accent: "#222222",
      accentDim: "rgba(34,34,34,0.15)",
      bodyBg: "#f7f7f7",
      cardBorder: "rgba(0,0,0,0.06)",
      font: "sans",
      fontSize: 15,
      lineHeight: 1.8,
    },
    builtIn: true,
  },

  // ── 11. 复古胶片 ──────────────────────────────────────────
  // 泛黄老照片质感，适合怀旧故事
  {
    id: "vintage-sepia",
    name: "复古胶片",
    description: "仿旧胶片色调，适合怀旧故事、旅行回忆、时光记录",
    style: "vintage-sepia",
    thumbnail: "📷",
    tags: ["复古", "胶片", "怀旧"],
    card: {
      background: "#f4e8d0",
      borderRadius: 12,
      shadow: [
        "0 2px 6px rgba(0,0,0,0.08)",
        "0 10px 30px rgba(0,0,0,0.12)",
      ],
      border: "rgba(0,0,0,0.08)",
    },
    decorations: {
      topLine: { enabled: true, height: 2, gradient: ["#8d6e63", "#8d6e63", 0.6, "rgba(141,110,99,0.3)"] },
      cornerBadge: null,
      watermark: { enabled: true, text: "MEMORY", opacity: 0.06, angle: -25 },
      paperTexture: true,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "serif",
      headingStyle: "line",
      listStyle: "dot",
      blockquoteStyle: "quote",
      codeStyle: "line",
    },
    colors: {
      primary: "#4e342e",
      secondary: "#6d4c41",
      muted: "#8d6e63",
      accent: "#8d6e63",
    },
    defaultTheme: {
      cardBg: "#f4e8d0",
      cardText: "#4e342e",
      cardMuted: "#795548",
      accent: "#8d6e63",
      accentDim: "rgba(141,110,99,0.22)",
      bodyBg: "#e8dcc8",
      cardBorder: "rgba(0,0,0,0.08)",
      font: "serif",
      fontSize: 17,
      lineHeight: 1.75,
    },
    builtIn: true,
  },

  // ── 12. 清新薄荷 ──────────────────────────────────────────
  // 薄荷绿清爽自然，适合生活记录
  {
    id: "fresh-mint",
    name: "清新薄荷",
    description: "薄荷绿为主色调，清爽自然，适合生活记录、穿搭分享、好物推荐",
    style: "fresh-mint",
    thumbnail: "🌿",
    tags: ["清新", "绿色", "自然"],
    card: {
      background: "#f0fdf4",
      borderRadius: 16,
      shadow: [
        "0 2px 8px rgba(0,0,0,0.06)",
        "0 8px 24px rgba(0,0,0,0.08)",
      ],
      border: "rgba(0,0,0,0.06)",
    },
    decorations: {
      topLine: { enabled: true, height: 4, gradient: ["#22c55e", "#16a34a", 0.5, "#86efac"] },
      cornerBadge: null,
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "sans",
      headingStyle: "dot",
      listStyle: "dot",
      blockquoteStyle: "accent",
      codeStyle: "bg",
    },
    colors: {
      primary: "#14532d",
      secondary: "#166534",
      muted: "#4a7c59",
      accent: "#22c55e",
    },
    defaultTheme: {
      cardBg: "#f0fdf4",
      cardText: "#14532d",
      cardMuted: "#4a7c59",
      accent: "#22c55e",
      accentDim: "rgba(34,197,94,0.22)",
      bodyBg: "#dcfce7",
      cardBorder: "rgba(0,0,0,0.06)",
      font: "sans",
      fontSize: 16,
      lineHeight: 1.8,
    },
    builtIn: true,
  },

  // ── 13. 温暖蜜桃 ──────────────────────────────────────────
  // 蜜桃色系柔和甜美，适合情感随笔
  {
    id: "warm-peach",
    name: "温暖蜜桃",
    description: "蜜桃色系，柔和甜美，适合情感随笔、生活美学、好物分享",
    style: "warm-peach",
    thumbnail: "🍑",
    tags: ["温暖", "蜜桃", "生活美学"],
    card: {
      background: "#fff5f0",
      borderRadius: 20,
      shadow: [
        "0 3px 10px rgba(0,0,0,0.07)",
        "0 12px 36px rgba(0,0,0,0.10)",
      ],
      border: "rgba(0,0,0,0.06)",
    },
    decorations: {
      topLine: { enabled: true, height: 3, gradient: ["#fb923c", "#f97316", 0.5, "#fed7aa"] },
      cornerBadge: null,
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "sans",
      headingStyle: "dot",
      listStyle: "dash",
      blockquoteStyle: "quote",
      codeStyle: "line",
    },
    colors: {
      primary: "#431407",
      secondary: "#77150c",
      muted: "#7c3d1e",
      accent: "#fb923c",
    },
    defaultTheme: {
      cardBg: "#fff5f0",
      cardText: "#431407",
      cardMuted: "#7c3d1e",
      accent: "#fb923c",
      accentDim: "rgba(251,146,60,0.22)",
      bodyBg: "#ffedd5",
      cardBorder: "rgba(0,0,0,0.06)",
      font: "sans",
      fontSize: 16,
      lineHeight: 1.8,
    },
    builtIn: true,
  },

  // ── 14. 暗夜紫 ────────────────────────────────────────────
  // 深邃夜空感，暗色边框改为 0.12 确保可见
  {
    id: "night-purple",
    name: "暗夜紫",
    description: "深紫夜空背景，适合深夜电台、情感倾诉、创意文案",
    style: "night-purple",
    thumbnail: "🌌",
    tags: ["暗色", "紫色", "夜晚"],
    card: {
      background: "#1e1b2e",
      borderRadius: 12,
      shadow: [
        "0 2px 12px rgba(0,0,0,0.30)",
        "0 8px 32px rgba(0,0,0,0.40)",
      ],
      border: "rgba(255,255,255,0.12)",
    },
    decorations: {
      topLine: { enabled: true, height: 2, gradient: ["#a855f7", "#7c3aed", 0.5, "rgba(168,85,247,0.3)"] },
      cornerBadge: null,
      watermark: { enabled: true, text: "DRAFT", opacity: 0.06, angle: -30 },
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "sans",
      headingStyle: "line",
      listStyle: "dot",
      blockquoteStyle: "accent",
      codeStyle: "mono",
    },
    colors: {
      primary: "#e8e0f0",
      secondary: "#c4b5dd",
      muted: "#a090c0",
      accent: "#a855f7",
    },
    defaultTheme: {
      cardBg: "#1e1b2e",
      cardText: "#e8e0f0",
      cardMuted: "#b0a0c8",
      accent: "#a855f7",
      accentDim: "rgba(168,85,247,0.30)",
      bodyBg: "#0f0d17",
      cardBorder: "rgba(255,255,255,0.12)",
      font: "sans",
      fontSize: 16,
      lineHeight: 1.8,
    },
    builtIn: true,
  },

  // ── 15. 优雅金 ────────────────────────────────────────────
  // 香槟金点缀轻奢质感
  {
    id: "elegant-gold",
    name: "优雅金",
    description: "香槟金点缀，轻奢质感，适合品牌内容、产品种草、好物推荐",
    style: "elegant-gold",
    thumbnail: "✨",
    tags: ["金色", "轻奢", "精致"],
    card: {
      background: "#fffdf7",
      borderRadius: 16,
      shadow: [
        "0 2px 10px rgba(0,0,0,0.08)",
        "0 10px 40px rgba(0,0,0,0.10)",
      ],
      border: "rgba(180,140,60,0.20)",
    },
    decorations: {
      topLine: { enabled: true, height: 3, gradient: ["#b8941f", "#d4a017", 0.5, "#f0d78c"] },
      cornerBadge: null,
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "serif",
      headingStyle: "line",
      listStyle: "number",
      blockquoteStyle: "accent",
      codeStyle: "line",
    },
    colors: {
      primary: "#2c1810",
      secondary: "#4a2c17",
      muted: "#7a5a30",
      accent: "#b8941f",
    },
    defaultTheme: {
      cardBg: "#fffdf7",
      cardText: "#2c1810",
      cardMuted: "#7a5a30",
      accent: "#b8941f",
      accentDim: "rgba(184,148,31,0.22)",
      bodyBg: "#f5f0e0",
      cardBorder: "rgba(180,140,60,0.20)",
      font: "serif",
      fontSize: 17,
      lineHeight: 1.75,
    },
    builtIn: true,
  },

  // ── 16. 马卡龙 ────────────────────────────────────────────
  // 梦幻粉彩色系，适合少女心
  {
    id: "pastel-dream",
    name: "马卡龙",
    description: "梦幻粉彩色系，柔和甜美，适合少女心、好物分享、生活记录",
    style: "pastel-dream",
    thumbnail: "🧁",
    tags: ["梦幻", "粉色", "甜美"],
    card: {
      background: "#fef0f5",
      borderRadius: 24,
      shadow: [
        "0 3px 12px rgba(0,0,0,0.07)",
        "0 12px 36px rgba(0,0,0,0.09)",
      ],
      border: "rgba(0,0,0,0.06)",
    },
    decorations: {
      topLine: { enabled: true, height: 4, gradient: ["#f472b6", "#ec4899", 0.5, "#fbcfe8"] },
      cornerBadge: null,
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "sans",
      headingStyle: "dot",
      listStyle: "dot",
      blockquoteStyle: "quote",
      codeStyle: "line",
    },
    colors: {
      primary: "#831843",
      secondary: "#a21caf",
      muted: "#be185d",
      accent: "#ec4899",
    },
    defaultTheme: {
      cardBg: "#fef0f5",
      cardText: "#831843",
      cardMuted: "#be185d",
      accent: "#ec4899",
      accentDim: "rgba(236,72,153,0.22)",
      bodyBg: "#fce7f3",
      cardBorder: "rgba(0,0,0,0.06)",
      font: "sans",
      fontSize: 16,
      lineHeight: 1.8,
    },
    builtIn: true,
  },

  // ── 17. 亚麻纸 ────────────────────────────────────────────
  // 仿真亚麻纸纹理，手工感强
  {
    id: "linen-paper",
    name: "亚麻纸",
    description: "仿真亚麻纸纹理，手工感强，适合匠心故事、手作分享、文艺内容",
    style: "linen",
    thumbnail: "🧵",
    tags: ["亚麻", "纸感", "手工"],
    card: {
      background: "#f5f0e8",
      borderRadius: 8,
      shadow: [
        "0 1px 4px rgba(0,0,0,0.07)",
        "0 6px 18px rgba(0,0,0,0.09)",
      ],
      border: "rgba(0,0,0,0.08)",
    },
    decorations: {
      topLine: { enabled: true, height: 2, gradient: ["#6d4c41", "#6d4c41", 0.6, "rgba(109,76,65,0.3)"] },
      cornerBadge: null,
      watermark: null,
      paperTexture: true,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "serif",
      headingStyle: "line",
      listStyle: "dash",
      blockquoteStyle: "accent",
      codeStyle: "line",
    },
    colors: {
      primary: "#3e2723",
      secondary: "#4e342e",
      muted: "#795548",
      accent: "#6d4c41",
    },
    defaultTheme: {
      cardBg: "#f5f0e8",
      cardText: "#3e2723",
      cardMuted: "#795548",
      accent: "#6d4c41",
      accentDim: "rgba(109,76,65,0.22)",
      bodyBg: "#e8e0d4",
      cardBorder: "rgba(0,0,0,0.08)",
      font: "serif",
      fontSize: 17,
      lineHeight: 1.75,
    },
    builtIn: true,
  },

  // ── 18. 水彩晕染 ──────────────────────────────────────────
  // 艺术感渐变，适合艺术分享
  {
    id: "watercolor-mood",
    name: "水彩晕染",
    description: "水彩晕染效果，文艺感十足，适合艺术分享、旅行记录、灵感笔记",
    style: "watercolor",
    thumbnail: "🎨",
    tags: ["水彩", "艺术", "文艺"],
    card: {
      background: "#faf8ff",
      borderRadius: 20,
      shadow: [
        "0 3px 10px rgba(0,0,0,0.07)",
        "0 12px 36px rgba(0,0,0,0.10)",
      ],
      border: "rgba(0,0,0,0.06)",
    },
    decorations: {
      topLine: { enabled: true, height: 5, gradient: ["#6366f1", "#8b5cf6", 0.4, "#a78bfa"] },
      cornerBadge: null,
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "serif",
      headingStyle: "dot",
      listStyle: "dot",
      blockquoteStyle: "quote",
      codeStyle: "line",
    },
    colors: {
      primary: "#2e1065",
      secondary: "#4c1d95",
      muted: "#7c3aed",
      accent: "#8b5cf6",
    },
    defaultTheme: {
      cardBg: "#faf8ff",
      cardText: "#2e1065",
      cardMuted: "#5b21b6",
      accent: "#8b5cf6",
      accentDim: "rgba(139,92,246,0.22)",
      bodyBg: "#ede9fe",
      cardBorder: "rgba(0,0,0,0.06)",
      font: "serif",
      fontSize: 17,
      lineHeight: 1.8,
    },
    builtIn: true,
  },

  // ── 19. 渐变情绪 ──────────────────────────────────────────
  // 大色块渐变背景，情绪感强
  {
    id: "gradient-mood",
    name: "渐变情绪",
    description: "大色块渐变背景，情绪感强，适合个人IP、观点表达、态度宣言",
    style: "gradient-mood",
    thumbnail: "🌈",
    tags: ["渐变", "情绪", "态度"],
    card: {
      background: "#ffffff",
      borderRadius: 16,
      shadow: [
        "0 4px 16px rgba(0,0,0,0.10)",
        "0 16px 48px rgba(0,0,0,0.14)",
      ],
      border: "rgba(255,255,255,0.20)",
    },
    decorations: {
      topLine: { enabled: true, height: 6, gradient: ["#3b82f6", "#8b5cf6", 0.3, "#ec4899"] },
      cornerBadge: null,
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "sans",
      headingStyle: "bracket",
      listStyle: "dash",
      blockquoteStyle: "filled",
      codeStyle: "bg",
    },
    colors: {
      primary: "#1e1b4b",
      secondary: "#312e81",
      muted: "#4f46e5",
      accent: "#ec4899",
    },
    defaultTheme: {
      cardBg: "#ffffff",
      cardText: "#1e1b4b",
      cardMuted: "#5a5a8a",
      accent: "#ec4899",
      accentDim: "rgba(236,72,153,0.22)",
      bodyBg: "#1e1b4b",
      cardBorder: "rgba(255,255,255,0.20)",
      font: "sans",
      fontSize: 17,
      lineHeight: 1.7,
    },
    builtIn: true,
  },

  // ── 20. 复古报纸（精致版）────────────────────────────────
  // 仿真报纸排版，报头+双线边框+底部线，innerBorder margin 20px 避开 meta 区
  {
    id: "vintage-newspaper",
    name: "复古报纸（精）",
    description: "仿真报纸排版，报头装饰、双线边框，适合内容科普、文化历史、深度好文",
    style: "vintage-sepia",
    thumbnail: "📰",
    tags: ["复古", "报纸", "科普"],
    card: {
      background: "#f5f0e4",
      borderRadius: 0,
      shadow: [
        "0 2px 12px rgba(80,60,30,0.15)",
        "0 8px 28px rgba(80,60,30,0.20)",
      ],
      border: "rgba(80,60,30,0.20)",
    },
    decorations: {
      topLine: { enabled: true, height: 6, gradient: ["#2a2018", "#3a2c1e", 0.5, "rgba(42,32,24,0.15)"] },
      cornerBadge: null,
      watermark: null,
      paperTexture: true,
      tapeDecor: null,
      innerBorder: { enabled: true, style: "double", color: "#8a7060", width: 2, margin: 56 },
      cornerStamp: null,
      bottomLine: { enabled: true, height: 2, gradient: ["#2a2018", "#3a2c1e", 0.5, "rgba(42,32,24,0.15)"] },
      cornerBrackets: null,
    },
    typography: {
      font: "serif",
      headingStyle: "line",
      listStyle: "number",
      blockquoteStyle: "quote",
      codeStyle: "bg",
    },
    colors: {
      primary: "#2a2018",
      secondary: "#4a3828",
      muted: "#8a7060",
      accent: "#b45a28",
    },
    defaultTheme: {
      cardBg: "#f5f0e4",
      cardText: "#2a2018",
      cardMuted: "#8a7060",
      accent: "#b45a28",
      accentDim: "rgba(180,90,40,0.22)",
      bodyBg: "#e8e0d0",
      cardBorder: "rgba(80,60,30,0.20)",
      contentInsetX: 32,
      font: "serif",
      fontSize: 16,
      lineHeight: 1.80,
    },
    builtIn: true,
  },

  // ── 21. 手账拼贴风 ────────────────────────────────────────
  // 胶带装饰、角落贴纸、柔和粉米底，角落装饰全部避开 meta 区（tr/br 位置）
  {
    id: "scrapbook-warm",
    name: "手账拼贴",
    description: "胶带装饰、角落贴纸，柔和粉米底，适合生活记录、种草分享、旅行日记",
    style: "scrapbook",
    thumbnail: "🩷",
    tags: ["少女", "手绘", "拼贴"],
    card: {
      background: "#fff8f5",
      borderRadius: 6,
      shadow: [
        "0 4px 16px rgba(200,100,120,0.12)",
        "0 16px 48px rgba(200,100,120,0.18)",
      ],
      border: "rgba(200,100,120,0.15)",
    },
    decorations: {
      topLine: { enabled: true, height: 5, gradient: ["#e8a0b0", "#f5c6cb", 0.5, "rgba(232,160,176,0.25)"] },
      cornerBadge: { enabled: true, text: "♡", position: "tr", bg: "#fff0f3", color: "#c4707f" },
      watermark: { enabled: true, text: "LOVE", opacity: 0.05, angle: -15 },
      paperTexture: true,
      tapeDecor: { enabled: true, position: "tl", width: 60, height: 20, bg: "#e8d0b0", opacity: 0.7, angle: -35 },
      innerBorder: null,
      cornerStamp: { enabled: true, position: "bl", emoji: "🩷", bg: "#fff0f3", opacity: 0.85, scale: 1.2 },
      bottomLine: null,
      cornerBrackets: { enabled: true, color: "#d4838f", width: 1.5, size: 18 },
    },
    typography: {
      font: "sans",
      headingStyle: "dot",
      listStyle: "dash",
      blockquoteStyle: "quote",
      codeStyle: "line",
    },
    colors: {
      primary: "#4a3040",
      secondary: "#6b4d5a",
      muted: "#a08090",
      accent: "#d4838f",
    },
    defaultTheme: {
      cardBg: "#fff8f5",
      cardText: "#4a3040",
      cardMuted: "#9a7080",
      accent: "#d4838f",
      accentDim: "rgba(212,131,143,0.22)",
      bodyBg: "#f8f0eb",
      cardBorder: "rgba(200,100,120,0.15)",
      font: "sans",
      fontSize: 16,
      lineHeight: 1.85,
    },
    builtIn: true,
  },

  // ── 22. 杂志社论风 ──────────────────────────────────────
  // 极简白底，内边框 margin 20px 避开 meta 区
  {
    id: "editorial-luxe",
    name: "杂志社论",
    description: "极简白底，大标题、编辑感，适合品牌内容、深度好文、精美种草",
    style: "magazine",
    thumbnail: "◆",
    tags: ["杂志", "编辑", "精致"],
    card: {
      background: "#ffffff",
      borderRadius: 0,
      shadow: [
        "0 2px 16px rgba(0,0,0,0.08)",
        "0 12px 40px rgba(0,0,0,0.10)",
      ],
      border: "rgba(0,0,0,0.06)",
    },
    decorations: {
      topLine: { enabled: true, height: 4, gradient: ["#1a1a1a", "#3a3a3a", 0.5, "rgba(26,26,26,0.1)"] },
      cornerBadge: null,
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: { enabled: true, style: "solid", color: "#1a1a1a", width: 1, margin: 56 },
      cornerStamp: null,
      bottomLine: { enabled: true, height: 1, gradient: ["#1a1a1a", "#3a3a3a", 0.5, "rgba(26,26,26,0.1)"] },
      cornerBrackets: null,
    },
    typography: {
      font: "serif",
      headingStyle: "none",
      listStyle: "dash",
      blockquoteStyle: "quote",
      codeStyle: "line",
    },
    colors: {
      primary: "#1a1a1a",
      secondary: "#3a3a3a",
      muted: "#888888",
      accent: "#c8102e",
    },
    defaultTheme: {
      cardBg: "#ffffff",
      cardText: "#1a1a1a",
      cardMuted: "#5a5a5a",
      accent: "#c8102e",
      accentDim: "rgba(200,16,46,0.18)",
      bodyBg: "#f4f4f4",
      cardBorder: "rgba(0,0,0,0.06)",
      contentInsetX: 32,
      font: "serif",
      fontSize: 17,
      lineHeight: 1.75,
    },
    builtIn: true,
  },

  // ── 23. 美式复古风 ────────────────────────────────────────
  // 深棕底、金色装饰线、报头，暗色边框改为 0.12，innerBorder margin 20px
  {
    id: "american-retro",
    name: "美式复古",
    description: "深棕底、金色装饰线、报头，适合生活方式、人物故事、旅行记录",
    style: "retro",
    thumbnail: "★",
    tags: ["复古", "美式", "生活"],
    card: {
      background: "#2c2418",
      borderRadius: 4,
      shadow: [
        "0 3px 16px rgba(0,0,0,0.30)",
        "0 12px 40px rgba(0,0,0,0.35)",
      ],
      border: "rgba(200,170,100,0.30)",
    },
    decorations: {
      topLine: { enabled: true, height: 8, gradient: ["#d4a850", "#c89030", 0.5, "rgba(200,160,50,0.2)"] },
      cornerBadge: null,
      watermark: { enabled: true, text: "VINTAGE", opacity: 0.04, angle: -25 },
      paperTexture: true,
      tapeDecor: null,
      innerBorder: { enabled: true, style: "double", color: "#d4a850", width: 2, margin: 56 },
      cornerStamp: { enabled: true, position: "br", emoji: "★", bg: "#3a2c1a", opacity: 0.9, scale: 1.0 },
      bottomLine: { enabled: true, height: 4, gradient: ["#d4a850", "#c89030", 0.5, "rgba(200,160,50,0.2)"] },
      cornerBrackets: null,
    },
    typography: {
      font: "serif",
      headingStyle: "line",
      listStyle: "number",
      blockquoteStyle: "quote",
      codeStyle: "bg",
    },
    colors: {
      primary: "#f5f0e8",
      secondary: "#d4c8b0",
      muted: "#a09080",
      accent: "#d4a850",
    },
    defaultTheme: {
      cardBg: "#2c2418",
      cardText: "#f5f0e8",
      cardMuted: "#b0a090",
      accent: "#d4a850",
      accentDim: "rgba(212,168,80,0.28)",
      bodyBg: "#1a1510",
      cardBorder: "rgba(200,170,100,0.30)",
      contentInsetX: 32,
      font: "serif",
      fontSize: 16,
      lineHeight: 1.78,
    },
    builtIn: true,
  },

  // ── 24. 清新插画风 ────────────────────────────────────────
  // 浅绿清新、植物装饰，角落装饰避开 meta 区（tr 胶带/br 贴纸）
  {
    id: "illustration-fresh",
    name: "清新插画",
    description: "浅绿清新、植物装饰，柔和圆角，适合生活方式、疗愈内容、旅行记录",
    style: "sage-botanical",
    thumbnail: "🌿",
    tags: ["清新", "插画", "自然"],
    card: {
      background: "#f2f9f4",
      borderRadius: 20,
      shadow: [
        "0 3px 14px rgba(50,140,80,0.10)",
        "0 14px 42px rgba(50,140,80,0.14)",
      ],
      border: "rgba(80,160,110,0.12)",
    },
    decorations: {
      topLine: { enabled: true, height: 4, gradient: ["#5ab87a", "#3d9e62", 0.5, "#8fd4a0"] },
      cornerBadge: null,
      watermark: null,
      paperTexture: false,
      tapeDecor: { enabled: true, position: "tr", width: 55, height: 18, bg: "#a8d8a8", opacity: 0.65, angle: 30 },
      innerBorder: null,
      cornerStamp: { enabled: true, position: "bl", emoji: "🌿", bg: "#e8f5ec", opacity: 0.9, scale: 1.0 },
      bottomLine: null,
      cornerBrackets: { enabled: true, color: "#5ab87a", width: 1.5, size: 16 },
    },
    typography: {
      font: "sans",
      headingStyle: "line",
      listStyle: "dot",
      blockquoteStyle: "accent",
      codeStyle: "line",
    },
    colors: {
      primary: "#1a3a28",
      secondary: "#2a5038",
      muted: "#5a8870",
      accent: "#3d9e62",
    },
    defaultTheme: {
      cardBg: "#f2f9f4",
      cardText: "#1a3a28",
      cardMuted: "#4a7860",
      accent: "#3d9e62",
      accentDim: "rgba(61,158,98,0.22)",
      bodyBg: "#e0f0e5",
      cardBorder: "rgba(80,160,110,0.12)",
      font: "sans",
      fontSize: 16,
      lineHeight: 1.82,
    },
    builtIn: true,
  },

  // ── 25. 奶油粉精致风 ────────────────────────────────────
  // 粉米底、衬线字，角落装饰避开 meta 区（br 贴纸）
  {
    id: "cream-pink-luxe",
    name: "奶油精致",
    description: "粉米底、金色边框、衬线字，适合精致生活、好物种草、品牌内容",
    style: "cream-pink",
    thumbnail: "✦",
    tags: ["精致", "粉色", "品牌"],
    card: {
      background: "#fff8f5",
      borderRadius: 24,
      shadow: [
        "0 4px 20px rgba(180,80,100,0.12)",
        "0 18px 54px rgba(180,80,100,0.16)",
      ],
      border: "rgba(220,120,140,0.18)",
    },
    decorations: {
      topLine: { enabled: true, height: 6, gradient: ["#e87090", "#f090a8", 0.5, "#fcd0dc"] },
      cornerBadge: null,
      watermark: { enabled: true, text: "PREMIUM", opacity: 0.04, angle: -20 },
      paperTexture: false,
      tapeDecor: null,
      innerBorder: { enabled: true, style: "dashed", color: "#e87090", width: 1.5, margin: 56 },
      cornerStamp: { enabled: true, position: "br", emoji: "✦", bg: "#fff0f5", opacity: 0.85, scale: 1.1 },
      bottomLine: null,
      cornerBrackets: { enabled: true, color: "#e87090", width: 1.5, size: 18 },
    },
    typography: {
      font: "serif",
      headingStyle: "line",
      listStyle: "dash",
      blockquoteStyle: "quote",
      codeStyle: "bg",
    },
    colors: {
      primary: "#3a1828",
      secondary: "#5c2a40",
      muted: "#a06080",
      accent: "#e87090",
    },
    defaultTheme: {
      cardBg: "#fff8f5",
      cardText: "#3a1828",
      cardMuted: "#904060",
      accent: "#e87090",
      accentDim: "rgba(232,112,144,0.22)",
      bodyBg: "#fceef2",
      cardBorder: "rgba(220,120,140,0.18)",
      contentInsetX: 32,
      font: "serif",
      fontSize: 17,
      lineHeight: 1.78,
    },
    builtIn: true,
  },

  // ── 26. 纸感日记 ────────────────────────────────────────
  {
    id: "paper-diary",
    name: "纸感日记",
    description: "温暖纸张质感与轻植物装饰，适合日常记录、生活方式和轻知识内容",
    style: "paper",
    thumbnail: "☕",
    tags: ["精选", "日记", "纸感", "生活"],
    card: {
      background: "#f3ead8",
      borderRadius: 8,
      shadow: [
        "0 3px 12px rgba(88,62,36,0.10)",
        "0 16px 42px rgba(88,62,36,0.14)",
      ],
      border: "rgba(120,86,48,0.15)",
    },
    decorations: {
      topLine: { enabled: false, height: 0, gradient: ["", "", 0, ""] },
      cornerBadge: null,
      watermark: { enabled: true, text: "DAILY", opacity: 0.045, angle: -16 },
      paperTexture: true,
      tapeDecor: null,
      innerBorder: { enabled: true, style: "solid", color: "rgba(133,96,55,0.18)", width: 1, margin: 18 },
      cornerStamp: { enabled: true, position: "br", emoji: "⌁", bg: "rgba(255,247,232,0.72)", opacity: 0.78, scale: 1 },
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "serif",
      headingStyle: "none",
      listStyle: "checkbox",
      blockquoteStyle: "quote",
      codeStyle: "line",
    },
    colors: {
      primary: "#2c2118",
      secondary: "#5b4a3b",
      muted: "#8b7762",
      accent: "#b96737",
    },
    defaultTheme: {
      cardBg: "#f3ead8",
      cardText: "#2c2118",
      cardMuted: "#7d6a55",
      accent: "#b96737",
      accentDim: "rgba(185,103,55,0.18)",
      bodyBg: "#efe3d0",
      cardBorder: "rgba(120,86,48,0.15)",
      contentInsetX: 34,
      font: "serif",
      fontSize: 17,
      lineHeight: 1.82,
      templateSurfaceStyle: "blend",
      templatePanelRadius: 8,
      templatePanelOpacity: 42,
    },
    builtIn: true,
  },

  // ── 27. 复古信纸 ────────────────────────────────────────
  {
    id: "vintage-letter",
    name: "复古信纸",
    description: "信纸纹理、邮戳感角标与植物边角，适合文艺表达、读书笔记和长文摘录",
    style: "linen",
    thumbnail: "✉",
    tags: ["精选", "复古", "信纸", "文艺"],
    card: {
      background: "#eadbc4",
      borderRadius: 8,
      shadow: [
        "0 4px 16px rgba(93,62,38,0.12)",
        "0 18px 50px rgba(93,62,38,0.16)",
      ],
      border: "rgba(113,76,46,0.20)",
    },
    decorations: {
      topLine: { enabled: false, height: 0, gradient: ["", "", 0, ""] },
      cornerBadge: { enabled: true, text: "TO:", position: "tl", bg: "rgba(255,248,232,0.74)", color: "#7b563c" },
      watermark: { enabled: true, text: "LETTER", opacity: 0.05, angle: -12 },
      paperTexture: true,
      tapeDecor: null,
      innerBorder: { enabled: true, style: "dashed", color: "rgba(123,86,60,0.28)", width: 1, margin: 22 },
      cornerStamp: { enabled: true, position: "br", emoji: "✿", bg: "rgba(255,246,226,0.72)", opacity: 0.78, scale: 1.05 },
      bottomLine: null,
      cornerBrackets: { enabled: true, color: "rgba(123,86,60,0.36)", width: 1.5, size: 18 },
    },
    typography: {
      font: "serif",
      headingStyle: "underline",
      listStyle: "dash",
      blockquoteStyle: "dashed",
      codeStyle: "line",
    },
    colors: {
      primary: "#3c2a20",
      secondary: "#6c5140",
      muted: "#8f7661",
      accent: "#9c6844",
    },
    defaultTheme: {
      cardBg: "#eadbc4",
      cardText: "#3c2a20",
      cardMuted: "#7a6351",
      accent: "#9c6844",
      accentDim: "rgba(156,104,68,0.18)",
      bodyBg: "#e7d5bc",
      cardBorder: "rgba(113,76,46,0.20)",
      contentInsetX: 32,
      font: "serif",
      fontSize: 16,
      lineHeight: 1.86,
      templateSurfaceStyle: "paper",
      templatePanelRadius: 8,
      templatePanelOpacity: 52,
    },
    builtIn: true,
  },

  // ── 28. 清新绿意 ────────────────────────────────────────
  {
    id: "fresh-greenery",
    name: "清新绿意",
    description: "低饱和植物绿与轻盈留白，适合自然生活、健康习惯和清单类内容",
    style: "sage-botanical",
    thumbnail: "🍃",
    tags: ["精选", "清新", "自然", "绿色"],
    card: {
      background: "#f1f2e7",
      borderRadius: 8,
      shadow: [
        "0 4px 16px rgba(67,92,54,0.10)",
        "0 18px 48px rgba(67,92,54,0.13)",
      ],
      border: "rgba(94,128,76,0.16)",
    },
    decorations: {
      topLine: { enabled: false, height: 0, gradient: ["", "", 0, ""] },
      cornerBadge: null,
      watermark: { enabled: true, text: "GREEN", opacity: 0.04, angle: -18 },
      paperTexture: true,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: { enabled: true, position: "br", emoji: "✓", bg: "rgba(228,238,213,0.78)", opacity: 0.82, scale: 0.95 },
      bottomLine: { enabled: true, height: 3, gradient: ["rgba(93,135,76,0.22)", "#6d9b5d", 0.42, "rgba(93,135,76,0.12)"] },
      cornerBrackets: null,
    },
    typography: {
      font: "sans",
      headingStyle: "dot",
      listStyle: "checkbox",
      blockquoteStyle: "accent",
      codeStyle: "bg",
    },
    colors: {
      primary: "#253521",
      secondary: "#4f6844",
      muted: "#78876d",
      accent: "#6d9b5d",
    },
    defaultTheme: {
      cardBg: "#f1f2e7",
      cardText: "#253521",
      cardMuted: "#687a5f",
      accent: "#6d9b5d",
      accentDim: "rgba(109,155,93,0.18)",
      bodyBg: "#e4ead8",
      cardBorder: "rgba(94,128,76,0.16)",
      contentInsetX: 30,
      font: "sans",
      fontSize: 16,
      lineHeight: 1.78,
      templateSurfaceStyle: "blend",
      templatePanelRadius: 8,
      templatePanelOpacity: 38,
    },
    builtIn: true,
  },

  // ── 29. 暖橙时光 ────────────────────────────────────────
  {
    id: "warm-orange-time",
    name: "暖橙时光",
    description: "暖橙光影、轻胶片氛围，适合生活美学、咖啡、旅行和个人故事",
    style: "warm-peach",
    thumbnail: "☀",
    tags: ["精选", "暖橙", "生活", "咖啡"],
    card: {
      background: "#fff0dc",
      borderRadius: 8,
      shadow: [
        "0 4px 16px rgba(175,89,42,0.12)",
        "0 18px 52px rgba(175,89,42,0.16)",
      ],
      border: "rgba(196,106,55,0.16)",
    },
    decorations: {
      topLine: { enabled: true, height: 3, gradient: ["#c8642f", "#df9b62", 0.55, "rgba(223,155,98,0.18)"] },
      cornerBadge: null,
      watermark: { enabled: true, text: "WARM", opacity: 0.045, angle: -16 },
      paperTexture: true,
      tapeDecor: { enabled: true, position: "tr", width: 46, height: 14, bg: "rgba(255,220,170,0.72)", opacity: 0.78, angle: 10 },
      innerBorder: null,
      cornerStamp: { enabled: true, position: "br", emoji: "☼", bg: "rgba(255,244,226,0.82)", opacity: 0.82, scale: 1 },
      bottomLine: null,
      cornerBrackets: null,
    },
    typography: {
      font: "serif",
      headingStyle: "dot",
      listStyle: "dash",
      blockquoteStyle: "quote",
      codeStyle: "line",
    },
    colors: {
      primary: "#3c2417",
      secondary: "#74472e",
      muted: "#9a755f",
      accent: "#c8642f",
    },
    defaultTheme: {
      cardBg: "#fff0dc",
      cardText: "#3c2417",
      cardMuted: "#8c6852",
      accent: "#c8642f",
      accentDim: "rgba(200,100,47,0.18)",
      bodyBg: "#f2dcc0",
      cardBorder: "rgba(196,106,55,0.16)",
      contentInsetX: 32,
      font: "serif",
      fontSize: 17,
      lineHeight: 1.78,
      templateSurfaceStyle: "paper",
      templatePanelRadius: 8,
      templatePanelOpacity: 48,
    },
    builtIn: true,
  },

  // ── 30. 纸感手记 ────────────────────────────────────────
  {
    id: "soft-paper-note",
    name: "纸感手记",
    description: "柔和纸感、轻胶带、折角与留白结构，适合通用图文笔记和知识整理",
    style: "cream-pink",
    thumbnail: "✎",
    tags: ["高级", "纸感", "手记", "通用"],
    card: {
      background: "#fff9f7",
      borderRadius: 8,
      shadow: [
        "0 5px 18px rgba(124,74,88,0.12)",
        "0 18px 56px rgba(124,74,88,0.18)",
      ],
      border: "rgba(196,120,142,0.16)",
    },
    decorations: {
      topLine: { enabled: true, height: 4, gradient: ["#e78aa8", "#f2bfd0", 0.52, "rgba(231,138,168,0.18)"] },
      cornerBadge: { enabled: true, text: "♡", position: "tr", bg: "rgba(255,240,245,0.78)", color: "#c55f7f" },
      watermark: null,
      paperTexture: true,
      tapeDecor: { enabled: true, position: "tl", width: 58, height: 18, bg: "rgba(235,203,164,0.76)", opacity: 0.82, angle: -34 },
      innerBorder: null,
      cornerStamp: { enabled: true, position: "bl", emoji: "❤", bg: "rgba(255,236,244,0.82)", opacity: 0.82, scale: 0.92 },
      bottomLine: null,
      cornerBrackets: { enabled: true, color: "rgba(213,111,139,0.42)", width: 1.4, size: 18 },
      advancedDecor: { enabled: true, variant: "soft-paper" },
    },
    typography: {
      font: "serif",
      headingStyle: "line",
      listStyle: "dot",
      blockquoteStyle: "quote",
      codeStyle: "line",
    },
    colors: {
      primary: "#3b2631",
      secondary: "#624552",
      muted: "#9a7580",
      accent: "#d66f8b",
    },
    defaultTheme: {
      cardBg: "#fff9f7",
      cardText: "#3b2631",
      cardMuted: "#8f6c78",
      accent: "#d66f8b",
      accentDim: "rgba(214,111,139,0.18)",
      bodyBg: "#efe6dc",
      cardBorder: "rgba(196,120,142,0.16)",
      contentInsetX: 30,
      font: "serif",
      fontSize: 17,
      lineHeight: 1.78,
      templateSurfaceStyle: "paper",
      templatePanelRadius: 8,
      templatePanelOpacity: 46,
    },
    builtIn: true,
  },

  // ── 31. 蓝格备忘 ────────────────────────────────────────
  {
    id: "clean-grid-memo",
    name: "蓝格备忘",
    description: "蓝灰网格、侧轨圆点和模块占位，适合清单、流程、说明和理性内容",
    style: "clean-grid",
    thumbnail: "□",
    tags: ["高级", "网格", "备忘", "通用"],
    card: {
      background: "#fbfdff",
      borderRadius: 8,
      shadow: [
        "0 4px 16px rgba(45,94,156,0.10)",
        "0 18px 50px rgba(45,94,156,0.15)",
      ],
      border: "rgba(77,126,190,0.18)",
    },
    decorations: {
      topLine: { enabled: true, height: 3, gradient: ["#5c8fd6", "#84addf", 0.58, "rgba(92,143,214,0.18)"] },
      cornerBadge: { enabled: true, text: "● ● ●", position: "tr", bg: "rgba(242,247,255,0.80)", color: "#4c82c6" },
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: { enabled: true, height: 28, gradient: ["rgba(54,105,170,0.88)", "#5c8fd6", 0.62, "rgba(92,143,214,0.68)"] },
      cornerBrackets: null,
      advancedDecor: { enabled: true, variant: "tech-memo" },
    },
    typography: {
      font: "sans",
      headingStyle: "line",
      listStyle: "number",
      blockquoteStyle: "dashed",
      codeStyle: "bg",
    },
    colors: {
      primary: "#18283d",
      secondary: "#2a4669",
      muted: "#64748b",
      accent: "#4c82c6",
    },
    defaultTheme: {
      cardBg: "#fbfdff",
      cardText: "#18283d",
      cardMuted: "#5f6f83",
      accent: "#4c82c6",
      accentDim: "rgba(76,130,198,0.16)",
      bodyBg: "#e8eef5",
      cardBorder: "rgba(77,126,190,0.18)",
      contentInsetX: 32,
      font: "sans",
      fontSize: 16,
      lineHeight: 1.76,
      templateSurfaceStyle: "outline",
      templatePanelRadius: 8,
      templatePanelOpacity: 42,
    },
    builtIn: true,
  },

  // ── 32. 拼贴清单 ────────────────────────────────────────
  {
    id: "warm-scrapbook-note",
    name: "拼贴清单",
    description: "撕纸、回形针、便签和手绘箭头氛围，适合生活记录、清单和经验复盘",
    style: "scrapbook",
    thumbnail: "⌁",
    tags: ["高级", "拼贴", "清单", "通用"],
    card: {
      background: "#fff6e8",
      borderRadius: 8,
      shadow: [
        "0 5px 18px rgba(155,91,43,0.13)",
        "0 18px 54px rgba(155,91,43,0.18)",
      ],
      border: "rgba(177,112,59,0.16)",
    },
    decorations: {
      topLine: { enabled: false, height: 0, gradient: ["", "", 0, ""] },
      cornerBadge: { enabled: true, text: "☆", position: "tr", bg: "rgba(255,229,151,0.82)", color: "#8a5524" },
      watermark: null,
      paperTexture: true,
      tapeDecor: { enabled: true, position: "tl", width: 42, height: 86, bg: "rgba(181,126,74,0.22)", opacity: 0.85, angle: 4 },
      innerBorder: null,
      cornerStamp: { enabled: true, position: "br", emoji: "✿", bg: "rgba(255,250,236,0.82)", opacity: 0.84, scale: 1.08 },
      bottomLine: null,
      cornerBrackets: null,
      advancedDecor: { enabled: true, variant: "warm-scrapbook" },
    },
    typography: {
      font: "sans",
      headingStyle: "underline",
      listStyle: "checkbox",
      blockquoteStyle: "filled",
      codeStyle: "bg",
    },
    colors: {
      primary: "#3a2718",
      secondary: "#6a4728",
      muted: "#9a7558",
      accent: "#c46a3d",
    },
    defaultTheme: {
      cardBg: "#fff6e8",
      cardText: "#3a2718",
      cardMuted: "#87684f",
      accent: "#c46a3d",
      accentDim: "rgba(196,106,61,0.18)",
      bodyBg: "#ead9bf",
      cardBorder: "rgba(177,112,59,0.16)",
      contentInsetX: 31,
      font: "sans",
      fontSize: 16,
      lineHeight: 1.82,
      templateSurfaceStyle: "paper",
      templatePanelRadius: 8,
      templatePanelOpacity: 52,
    },
    builtIn: true,
  },

  // ── 33. 社论索引 ────────────────────────────────────────
  {
    id: "editorial-index-note",
    name: "社论索引",
    description: "大留白、红色边注、书签和目录索引，适合深度观点与结构化文章",
    style: "magazine",
    thumbnail: "▌",
    tags: ["高级", "社论", "极简", "通用"],
    card: {
      background: "#fffdf9",
      borderRadius: 8,
      shadow: [
        "0 5px 16px rgba(86,58,45,0.08)",
        "0 18px 48px rgba(86,58,45,0.13)",
      ],
      border: "rgba(171,72,72,0.15)",
    },
    decorations: {
      topLine: { enabled: false, height: 0, gradient: ["", "", 0, ""] },
      cornerBadge: null,
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: { enabled: true, height: 1, gradient: ["rgba(171,72,72,0.16)", "#b84949", 0.32, "rgba(171,72,72,0.05)"] },
      cornerBrackets: null,
      advancedDecor: { enabled: true, variant: "editorial-index" },
    },
    typography: {
      font: "serif",
      headingStyle: "none",
      listStyle: "dash",
      blockquoteStyle: "quote",
      codeStyle: "line",
    },
    colors: {
      primary: "#231b18",
      secondary: "#57413b",
      muted: "#8d746d",
      accent: "#b84949",
    },
    defaultTheme: {
      cardBg: "#fffdf9",
      cardText: "#231b18",
      cardMuted: "#6f5c56",
      accent: "#b84949",
      accentDim: "rgba(184,73,73,0.16)",
      bodyBg: "#eee7dd",
      cardBorder: "rgba(171,72,72,0.15)",
      contentInsetX: 36,
      font: "serif",
      fontSize: 17,
      lineHeight: 1.80,
      templateSurfaceStyle: "outline",
      templatePanelRadius: 8,
      templatePanelOpacity: 34,
    },
    builtIn: true,
  },

  // ── 34. 仪表面板 ────────────────────────────────────────
  {
    id: "dashboard-card",
    name: "仪表面板",
    description: "胶囊占位、流程轨道和环形图形占位，适合任务看板、复盘和结构化展示",
    style: "fresh-mint",
    thumbnail: "◌",
    tags: ["高级", "看板", "面板", "通用"],
    card: {
      background: "#f7fbf8",
      borderRadius: 8,
      shadow: [
        "0 5px 18px rgba(37,116,81,0.10)",
        "0 18px 52px rgba(37,116,81,0.15)",
      ],
      border: "rgba(63,153,112,0.16)",
    },
    decorations: {
      topLine: { enabled: true, height: 3, gradient: ["#37a978", "#7cc8a4", 0.56, "rgba(55,169,120,0.16)"] },
      cornerBadge: { enabled: true, text: "●", position: "tr", bg: "rgba(221,246,235,0.82)", color: "#1f8b61" },
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
      advancedDecor: { enabled: true, variant: "ai-dashboard" },
    },
    typography: {
      font: "sans",
      headingStyle: "line",
      listStyle: "checkbox",
      blockquoteStyle: "filled",
      codeStyle: "bg",
    },
    colors: {
      primary: "#163327",
      secondary: "#345d4c",
      muted: "#6d8378",
      accent: "#37a978",
    },
    defaultTheme: {
      cardBg: "#f7fbf8",
      cardText: "#163327",
      cardMuted: "#5f746a",
      accent: "#37a978",
      accentDim: "rgba(55,169,120,0.16)",
      bodyBg: "#e3eee8",
      cardBorder: "rgba(63,153,112,0.16)",
      contentInsetX: 29,
      font: "sans",
      fontSize: 16,
      lineHeight: 1.76,
      templateSurfaceStyle: "blend",
      templatePanelRadius: 8,
      templatePanelOpacity: 42,
    },
    builtIn: true,
  },

  // ── 35. 学习闪卡 ────────────────────────────────────────
  {
    id: "study-flashcard-note",
    name: "学习闪卡",
    description: "紫色学习卡、便签摘要和书签丝带，适合概念解释、读书笔记和知识卡片",
    style: "pastel-dream",
    thumbnail: "★",
    tags: ["高级", "学习", "闪卡", "通用"],
    card: {
      background: "#fbf8ff",
      borderRadius: 8,
      shadow: [
        "0 5px 18px rgba(113,78,178,0.12)",
        "0 18px 56px rgba(113,78,178,0.18)",
      ],
      border: "rgba(148,108,214,0.16)",
    },
    decorations: {
      topLine: { enabled: true, height: 3, gradient: ["#9571d9", "#b79ce8", 0.55, "rgba(149,113,217,0.15)"] },
      cornerBadge: null,
      watermark: null,
      paperTexture: false,
      tapeDecor: { enabled: true, position: "tr", width: 24, height: 76, bg: "rgba(149,113,217,0.72)", opacity: 0.86, angle: 0 },
      innerBorder: null,
      cornerStamp: { enabled: true, position: "br", emoji: "✦", bg: "rgba(245,237,255,0.82)", opacity: 0.82, scale: 1.0 },
      bottomLine: null,
      cornerBrackets: null,
      advancedDecor: { enabled: true, variant: "study-flashcard" },
    },
    typography: {
      font: "sans",
      headingStyle: "underline",
      listStyle: "number",
      blockquoteStyle: "filled",
      codeStyle: "bg",
    },
    colors: {
      primary: "#30264f",
      secondary: "#594b82",
      muted: "#7c70a5",
      accent: "#8d6bd3",
    },
    defaultTheme: {
      cardBg: "#fbf8ff",
      cardText: "#30264f",
      cardMuted: "#706498",
      accent: "#8d6bd3",
      accentDim: "rgba(141,107,211,0.18)",
      bodyBg: "#ece3f7",
      cardBorder: "rgba(148,108,214,0.16)",
      contentInsetX: 32,
      font: "sans",
      fontSize: 16,
      lineHeight: 1.82,
      templateSurfaceStyle: "paper",
      templatePanelRadius: 8,
      templatePanelOpacity: 50,
    },
    builtIn: true,
  },

  // ── 36. 项目档案 ────────────────────────────────────────
  {
    id: "archive-file-note",
    name: "项目档案",
    description: "档案纸、侧边标签、印章轮廓和装订孔，适合资料整理、项目沉淀和归档内容",
    style: "vintage-sepia",
    thumbnail: "□",
    tags: ["高级", "档案", "复古", "通用"],
    card: {
      background: "#efe2c8",
      borderRadius: 8,
      shadow: [
        "0 5px 18px rgba(86,82,47,0.15)",
        "0 18px 56px rgba(86,82,47,0.20)",
      ],
      border: "rgba(112,106,61,0.22)",
    },
    decorations: {
      topLine: { enabled: false, height: 0, gradient: ["", "", 0, ""] },
      cornerBadge: { enabled: true, text: "▱", position: "tr", bg: "rgba(252,236,214,0.82)", color: "#b44432" },
      watermark: null,
      paperTexture: true,
      tapeDecor: null,
      innerBorder: { enabled: true, style: "solid", color: "rgba(112,95,54,0.22)", width: 1, margin: 32 },
      cornerStamp: null,
      bottomLine: { enabled: true, height: 24, gradient: ["rgba(112,106,61,0.34)", "#8b8649", 0.58, "rgba(112,106,61,0.20)"] },
      cornerBrackets: null,
      advancedDecor: { enabled: true, variant: "archive-file" },
    },
    typography: {
      font: "serif",
      headingStyle: "line",
      listStyle: "dash",
      blockquoteStyle: "dashed",
      codeStyle: "line",
    },
    colors: {
      primary: "#302616",
      secondary: "#5d4c2e",
      muted: "#806f4d",
      accent: "#9a8c45",
    },
    defaultTheme: {
      cardBg: "#efe2c8",
      cardText: "#302616",
      cardMuted: "#756544",
      accent: "#9a8c45",
      accentDim: "rgba(154,140,69,0.18)",
      bodyBg: "#dad2ae",
      cardBorder: "rgba(112,106,61,0.22)",
      contentInsetX: 35,
      font: "serif",
      fontSize: 16,
      lineHeight: 1.78,
      templateSurfaceStyle: "paper",
      templatePanelRadius: 8,
      templatePanelOpacity: 50,
    },
    builtIn: true,
  },

  // ── 37. 创作卡片 ────────────────────────────────────────
  {
    id: "creator-note-card",
    name: "创作卡片",
    description: "浅桃粉、气泡、闪光和互动底栏，适合方法总结、生活分享和轻教程",
    style: "lemon-vintage",
    thumbnail: "♥",
    tags: ["高级", "创作", "互动", "通用"],
    card: {
      background: "#fff4ec",
      borderRadius: 8,
      shadow: [
        "0 5px 18px rgba(211,92,67,0.13)",
        "0 18px 56px rgba(211,92,67,0.18)",
      ],
      border: "rgba(224,122,92,0.18)",
    },
    decorations: {
      topLine: { enabled: true, height: 3, gradient: ["#f07e70", "#f6b26b", 0.45, "rgba(246,178,107,0.18)"] },
      cornerBadge: { enabled: true, text: "♡", position: "br", bg: "rgba(255,235,219,0.88)", color: "#d35c43" },
      watermark: null,
      paperTexture: false,
      tapeDecor: { enabled: true, position: "tr", width: 38, height: 38, bg: "rgba(255,172,135,0.58)", opacity: 0.86, angle: 42 },
      innerBorder: null,
      cornerStamp: { enabled: true, position: "tl", emoji: "✦", bg: "rgba(255,247,235,0.78)", opacity: 0.82, scale: 0.95 },
      bottomLine: null,
      cornerBrackets: null,
      advancedDecor: { enabled: true, variant: "creator-note" },
    },
    typography: {
      font: "sans",
      headingStyle: "dot",
      listStyle: "checkbox",
      blockquoteStyle: "filled",
      codeStyle: "bg",
    },
    colors: {
      primary: "#5a2a20",
      secondary: "#9a4a34",
      muted: "#aa7766",
      accent: "#e36f55",
    },
    defaultTheme: {
      cardBg: "#fff4ec",
      cardText: "#5a2a20",
      cardMuted: "#9b6d60",
      accent: "#e36f55",
      accentDim: "rgba(227,111,85,0.18)",
      bodyBg: "#f4e3d8",
      cardBorder: "rgba(224,122,92,0.18)",
      contentInsetX: 30,
      font: "sans",
      fontSize: 16,
      lineHeight: 1.78,
      templateSurfaceStyle: "blend",
      templatePanelRadius: 8,
      templatePanelOpacity: 46,
    },
    builtIn: true,
  },

  // ── 38. 美食食谱 ────────────────────────────────────────
  {
    id: "food-recipe-card",
    name: "美食食谱",
    description: "餐盘、食谱卡、圆点食材和暖调纸面，适合美食教程、探店复盘和食谱合集",
    style: "warm-peach",
    thumbnail: "◒",
    tags: ["高级", "美食", "食谱", "博主"],
    card: {
      background: "#fff3e5",
      borderRadius: 8,
      shadow: [
        "0 5px 18px rgba(186,91,45,0.12)",
        "0 18px 56px rgba(186,91,45,0.16)",
      ],
      border: "rgba(202,117,66,0.16)",
    },
    decorations: {
      topLine: { enabled: true, height: 4, gradient: ["#d85f3f", "#f3b35f", 0.56, "rgba(243,179,95,0.18)"] },
      cornerBadge: { enabled: true, text: "◒", position: "br", bg: "rgba(255,244,226,0.88)", color: "#c85835" },
      watermark: null,
      paperTexture: true,
      tapeDecor: null,
      innerBorder: { enabled: true, style: "dashed", color: "rgba(200,91,53,0.16)", width: 1, margin: 24 },
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
      advancedDecor: { enabled: true, variant: "food-recipe" },
    },
    typography: {
      font: "sans",
      headingStyle: "dot",
      listStyle: "checkbox",
      blockquoteStyle: "filled",
      codeStyle: "bg",
    },
    colors: {
      primary: "#54281e",
      secondary: "#914734",
      muted: "#9b6f55",
      accent: "#d85f3f",
    },
    defaultTheme: {
      cardBg: "#fff3e5",
      cardText: "#54281e",
      cardMuted: "#9b6f55",
      accent: "#d85f3f",
      accentDim: "rgba(216,95,63,0.16)",
      bodyBg: "#ead7bd",
      cardBorder: "rgba(202,117,66,0.16)",
      contentInsetX: 31,
      font: "sans",
      fontSize: 16,
      lineHeight: 1.78,
      templateSurfaceStyle: "blend",
      templatePanelRadius: 8,
      templatePanelOpacity: 48,
    },
    builtIn: true,
  },

  // ── 39. 旅行地图 ────────────────────────────────────────
  {
    id: "travel-map-card",
    name: "旅行地图",
    description: "路线虚线、票根、相片框和清爽底纹，适合旅行攻略、城市漫游和路线分享",
    style: "watercolor",
    thumbnail: "⌁",
    tags: ["高级", "旅行", "地图", "博主"],
    card: {
      background: "#f6f1e8",
      borderRadius: 8,
      shadow: [
        "0 5px 18px rgba(60,112,122,0.12)",
        "0 18px 56px rgba(60,112,122,0.18)",
      ],
      border: "rgba(66,133,145,0.16)",
    },
    decorations: {
      topLine: { enabled: true, height: 3, gradient: ["#3f8991", "#e0a95e", 0.48, "rgba(224,169,94,0.18)"] },
      cornerBadge: { enabled: true, text: "⌁", position: "tr", bg: "rgba(247,241,229,0.88)", color: "#3f8991" },
      watermark: null,
      paperTexture: true,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: { enabled: true, color: "rgba(63,137,145,0.28)", width: 2, size: 22 },
      advancedDecor: { enabled: true, variant: "travel-map" },
    },
    typography: {
      font: "sans",
      headingStyle: "line",
      listStyle: "dash",
      blockquoteStyle: "accent",
      codeStyle: "bg",
    },
    colors: {
      primary: "#263b3a",
      secondary: "#46605c",
      muted: "#738276",
      accent: "#3f8991",
    },
    defaultTheme: {
      cardBg: "#f6f1e8",
      cardText: "#263b3a",
      cardMuted: "#738276",
      accent: "#3f8991",
      accentDim: "rgba(63,137,145,0.16)",
      bodyBg: "#dbe2d8",
      cardBorder: "rgba(66,133,145,0.16)",
      contentInsetX: 31,
      font: "sans",
      fontSize: 16,
      lineHeight: 1.78,
      templateSurfaceStyle: "paper",
      templatePanelRadius: 8,
      templatePanelOpacity: 46,
    },
    builtIn: true,
  },

  // ── 40. 穿搭画报 ────────────────────────────────────────
  {
    id: "fashion-lookbook-card",
    name: "穿搭画报",
    description: "杂志相框、吊牌、衣架线稿和色布圆点，适合穿搭记录、风格解析和单品清单",
    style: "magazine",
    thumbnail: "◇",
    tags: ["高级", "穿搭", "时尚", "博主"],
    card: {
      background: "#fbf7ef",
      borderRadius: 6,
      shadow: [
        "0 6px 18px rgba(43,38,33,0.10)",
        "0 18px 58px rgba(43,38,33,0.16)",
      ],
      border: "rgba(48,42,36,0.12)",
    },
    decorations: {
      topLine: { enabled: true, height: 2, gradient: ["#2d2a28", "#c48366", 0.32, "rgba(196,131,102,0.16)"] },
      cornerBadge: { enabled: true, text: "◇", position: "tl", bg: "rgba(255,255,255,0.82)", color: "#2d2a28" },
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: { enabled: true, style: "solid", color: "rgba(45,42,40,0.10)", width: 1, margin: 22 },
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
      advancedDecor: { enabled: true, variant: "fashion-lookbook" },
    },
    typography: {
      font: "serif",
      headingStyle: "underline",
      listStyle: "dot",
      blockquoteStyle: "quote",
      codeStyle: "line",
    },
    colors: {
      primary: "#2d2a28",
      secondary: "#5e4d43",
      muted: "#8b786b",
      accent: "#b76b52",
    },
    defaultTheme: {
      cardBg: "#fbf7ef",
      cardText: "#2d2a28",
      cardMuted: "#8b786b",
      accent: "#b76b52",
      accentDim: "rgba(183,107,82,0.14)",
      bodyBg: "#ded7cc",
      cardBorder: "rgba(48,42,36,0.12)",
      contentInsetX: 34,
      font: "serif",
      fontSize: 16,
      lineHeight: 1.78,
      templateSurfaceStyle: "outline",
      templatePanelRadius: 6,
      templatePanelOpacity: 44,
    },
    builtIn: true,
  },

  // ── 41. 美妆色卡 ────────────────────────────────────────
  {
    id: "beauty-swatch-card",
    name: "美妆色卡",
    description: "镜面弧形、腮红色盘和轻闪元素，适合美妆测评、妆容拆解和色号对比",
    style: "cream-pink",
    thumbnail: "◐",
    tags: ["高级", "美妆", "色卡", "博主"],
    card: {
      background: "#fff2f4",
      borderRadius: 8,
      shadow: [
        "0 5px 18px rgba(197,83,111,0.12)",
        "0 18px 56px rgba(197,83,111,0.16)",
      ],
      border: "rgba(218,129,151,0.18)",
    },
    decorations: {
      topLine: { enabled: true, height: 4, gradient: ["#d96e91", "#f5b4a6", 0.50, "rgba(245,180,166,0.18)"] },
      cornerBadge: { enabled: true, text: "✦", position: "tr", bg: "rgba(255,245,247,0.88)", color: "#d96e91" },
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: { enabled: true, color: "rgba(217,110,145,0.24)", width: 2, size: 20 },
      advancedDecor: { enabled: true, variant: "beauty-swatch" },
    },
    typography: {
      font: "sans",
      headingStyle: "dot",
      listStyle: "dot",
      blockquoteStyle: "filled",
      codeStyle: "bg",
    },
    colors: {
      primary: "#5a2530",
      secondary: "#94495b",
      muted: "#aa7580",
      accent: "#d96e91",
    },
    defaultTheme: {
      cardBg: "#fff2f4",
      cardText: "#5a2530",
      cardMuted: "#aa7580",
      accent: "#d96e91",
      accentDim: "rgba(217,110,145,0.16)",
      bodyBg: "#f1dce0",
      cardBorder: "rgba(218,129,151,0.18)",
      contentInsetX: 30,
      font: "sans",
      fontSize: 16,
      lineHeight: 1.78,
      templateSurfaceStyle: "blend",
      templatePanelRadius: 8,
      templatePanelOpacity: 46,
    },
    builtIn: true,
  },

  // ── 42. 健身能量 ────────────────────────────────────────
  {
    id: "fitness-energy-card",
    name: "健身能量",
    description: "斜纹、能量条、圆形进度和心率线感，适合健身计划、运动记录和饮食打卡",
    style: "bold-contrast",
    thumbnail: "▰",
    tags: ["高级", "健身", "运动", "博主"],
    card: {
      background: "#f5f7f0",
      borderRadius: 8,
      shadow: [
        "0 6px 18px rgba(34,85,69,0.13)",
        "0 18px 58px rgba(34,85,69,0.18)",
      ],
      border: "rgba(39,130,89,0.18)",
    },
    decorations: {
      topLine: { enabled: true, height: 5, gradient: ["#1f9d68", "#f0c33c", 0.44, "rgba(240,195,60,0.18)"] },
      cornerBadge: { enabled: true, text: "▰", position: "br", bg: "rgba(245,247,240,0.88)", color: "#1f9d68" },
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: { enabled: true, height: 16, gradient: ["rgba(31,157,104,0.24)", "#1f9d68", 0.42, "rgba(240,195,60,0.20)"] },
      cornerBrackets: null,
      advancedDecor: { enabled: true, variant: "fitness-energy" },
    },
    typography: {
      font: "sans",
      headingStyle: "line",
      listStyle: "checkbox",
      blockquoteStyle: "accent",
      codeStyle: "bg",
    },
    colors: {
      primary: "#17372e",
      secondary: "#2f5d4d",
      muted: "#668175",
      accent: "#1f9d68",
    },
    defaultTheme: {
      cardBg: "#f5f7f0",
      cardText: "#17372e",
      cardMuted: "#668175",
      accent: "#1f9d68",
      accentDim: "rgba(31,157,104,0.16)",
      bodyBg: "#d8dfd2",
      cardBorder: "rgba(39,130,89,0.18)",
      contentInsetX: 30,
      font: "sans",
      fontSize: 16,
      lineHeight: 1.72,
      templateSurfaceStyle: "blend",
      templatePanelRadius: 8,
      templatePanelOpacity: 42,
    },
    builtIn: true,
  },

  // ── 43. 读书批注 ────────────────────────────────────────
  {
    id: "book-review-card",
    name: "读书批注",
    description: "书脊、借阅卡、横线批注纸和克制书卷感，适合读书笔记、摘录和书评",
    style: "paper",
    thumbnail: "▤",
    tags: ["高级", "读书", "学习", "博主"],
    card: {
      background: "#f7edda",
      borderRadius: 8,
      shadow: [
        "0 5px 18px rgba(89,68,36,0.12)",
        "0 18px 56px rgba(89,68,36,0.16)",
      ],
      border: "rgba(118,88,45,0.16)",
    },
    decorations: {
      topLine: { enabled: true, height: 3, gradient: ["#8b5f36", "#c9a46a", 0.50, "rgba(201,164,106,0.18)"] },
      cornerBadge: { enabled: true, text: "▤", position: "tr", bg: "rgba(255,248,232,0.88)", color: "#8b5f36" },
      watermark: null,
      paperTexture: true,
      tapeDecor: null,
      innerBorder: { enabled: true, style: "solid", color: "rgba(118,88,45,0.14)", width: 1, margin: 28 },
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: null,
      advancedDecor: { enabled: true, variant: "book-review" },
    },
    typography: {
      font: "serif",
      headingStyle: "line",
      listStyle: "dash",
      blockquoteStyle: "quote",
      codeStyle: "line",
    },
    colors: {
      primary: "#35291d",
      secondary: "#6a5034",
      muted: "#856f55",
      accent: "#8b5f36",
    },
    defaultTheme: {
      cardBg: "#f7edda",
      cardText: "#35291d",
      cardMuted: "#856f55",
      accent: "#8b5f36",
      accentDim: "rgba(139,95,54,0.14)",
      bodyBg: "#dfd0b7",
      cardBorder: "rgba(118,88,45,0.16)",
      contentInsetX: 35,
      font: "serif",
      fontSize: 16,
      lineHeight: 1.82,
      templateSurfaceStyle: "paper",
      templatePanelRadius: 8,
      templatePanelOpacity: 50,
    },
    builtIn: true,
  },

  // ── 44. 亲子柔光 ────────────────────────────────────────
  {
    id: "parenting-soft-card",
    name: "亲子柔光",
    description: "柔和气泡、云朵底板和轻量星心元素，适合亲子记录、母婴清单和成长复盘",
    style: "pastel-dream",
    thumbnail: "♡",
    tags: ["高级", "亲子", "母婴", "博主"],
    card: {
      background: "#fff7ef",
      borderRadius: 8,
      shadow: [
        "0 5px 18px rgba(194,121,112,0.11)",
        "0 18px 56px rgba(194,121,112,0.15)",
      ],
      border: "rgba(213,145,132,0.16)",
    },
    decorations: {
      topLine: { enabled: true, height: 4, gradient: ["#f19a8a", "#f4c56e", 0.48, "rgba(244,197,110,0.18)"] },
      cornerBadge: { enabled: true, text: "♡", position: "br", bg: "rgba(255,247,239,0.88)", color: "#d97d70" },
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: { enabled: true, position: "tl", emoji: "☆", bg: "rgba(255,246,228,0.72)", opacity: 0.78, scale: 0.95 },
      bottomLine: null,
      cornerBrackets: null,
      advancedDecor: { enabled: true, variant: "parenting-soft" },
    },
    typography: {
      font: "sans",
      headingStyle: "dot",
      listStyle: "checkbox",
      blockquoteStyle: "filled",
      codeStyle: "bg",
    },
    colors: {
      primary: "#56312d",
      secondary: "#8b574f",
      muted: "#9b7a70",
      accent: "#d97d70",
    },
    defaultTheme: {
      cardBg: "#fff7ef",
      cardText: "#56312d",
      cardMuted: "#9b7a70",
      accent: "#d97d70",
      accentDim: "rgba(217,125,112,0.15)",
      bodyBg: "#efe1d2",
      cardBorder: "rgba(213,145,132,0.16)",
      contentInsetX: 30,
      font: "sans",
      fontSize: 16,
      lineHeight: 1.78,
      templateSurfaceStyle: "blend",
      templatePanelRadius: 8,
      templatePanelOpacity: 46,
    },
    builtIn: true,
  },

  // ── 45. 家居灵感 ────────────────────────────────────────
  {
    id: "home-decor-card",
    name: "家居灵感",
    description: "平面图网格、家具块和低饱和色片，适合家居改造、软装清单和审美灵感",
    style: "sage-botanical",
    thumbnail: "⌂",
    tags: ["高级", "家居", "审美", "博主"],
    card: {
      background: "#f2efe5",
      borderRadius: 8,
      shadow: [
        "0 5px 18px rgba(84,102,78,0.12)",
        "0 18px 56px rgba(84,102,78,0.17)",
      ],
      border: "rgba(105,126,91,0.16)",
    },
    decorations: {
      topLine: { enabled: true, height: 3, gradient: ["#6f8a5f", "#c1986b", 0.54, "rgba(193,152,107,0.16)"] },
      cornerBadge: { enabled: true, text: "⌂", position: "tl", bg: "rgba(247,244,234,0.88)", color: "#6f8a5f" },
      watermark: null,
      paperTexture: true,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: { enabled: true, color: "rgba(111,138,95,0.24)", width: 2, size: 22 },
      advancedDecor: { enabled: true, variant: "home-decor" },
    },
    typography: {
      font: "sans",
      headingStyle: "line",
      listStyle: "dash",
      blockquoteStyle: "accent",
      codeStyle: "bg",
    },
    colors: {
      primary: "#2d3829",
      secondary: "#59644f",
      muted: "#7d806d",
      accent: "#6f8a5f",
    },
    defaultTheme: {
      cardBg: "#f2efe5",
      cardText: "#2d3829",
      cardMuted: "#7d806d",
      accent: "#6f8a5f",
      accentDim: "rgba(111,138,95,0.15)",
      bodyBg: "#d8d3c3",
      cardBorder: "rgba(105,126,91,0.16)",
      contentInsetX: 31,
      font: "sans",
      fontSize: 16,
      lineHeight: 1.78,
      templateSurfaceStyle: "paper",
      templatePanelRadius: 8,
      templatePanelOpacity: 48,
    },
    builtIn: true,
  },

  // ── 46. 摄影相框 ────────────────────────────────────────
  {
    id: "photo-frame-card",
    name: "摄影相框",
    description: "相片白边、胶片条和对焦框，适合摄影作品、修图思路和图片故事",
    style: "clean-grid",
    thumbnail: "▣",
    tags: ["高级", "摄影", "图片", "博主"],
    card: {
      background: "#f7f8f4",
      borderRadius: 8,
      shadow: [
        "0 5px 18px rgba(42,62,72,0.12)",
        "0 18px 56px rgba(42,62,72,0.17)",
      ],
      border: "rgba(73,98,112,0.14)",
    },
    decorations: {
      topLine: { enabled: true, height: 3, gradient: ["#314b59", "#8cb0b6", 0.46, "rgba(140,176,182,0.18)"] },
      cornerBadge: { enabled: true, text: "▣", position: "tr", bg: "rgba(255,255,255,0.86)", color: "#314b59" },
      watermark: null,
      paperTexture: false,
      tapeDecor: null,
      innerBorder: null,
      cornerStamp: null,
      bottomLine: null,
      cornerBrackets: { enabled: true, color: "rgba(49,75,89,0.28)", width: 2, size: 24 },
      advancedDecor: { enabled: true, variant: "photo-frame" },
    },
    typography: {
      font: "sans",
      headingStyle: "none",
      listStyle: "dot",
      blockquoteStyle: "dashed",
      codeStyle: "mono",
    },
    colors: {
      primary: "#23323a",
      secondary: "#4a5d66",
      muted: "#7c8888",
      accent: "#314b59",
    },
    defaultTheme: {
      cardBg: "#f7f8f4",
      cardText: "#23323a",
      cardMuted: "#7c8888",
      accent: "#314b59",
      accentDim: "rgba(49,75,89,0.12)",
      bodyBg: "#d8ddd9",
      cardBorder: "rgba(73,98,112,0.14)",
      contentInsetX: 31,
      font: "sans",
      fontSize: 16,
      lineHeight: 1.76,
      templateSurfaceStyle: "outline",
      templatePanelRadius: 8,
      templatePanelOpacity: 42,
    },
    builtIn: true,
  },

  // ── 47. 财经账本 ────────────────────────────────────────
  {
    id: "finance-ledger-card",
    name: "财经账本",
    description: "账本网格、柱状趋势和克制金色线条，适合财经拆解、投资记录和数据复盘",
    style: "elegant-gold",
    thumbnail: "▥",
    tags: ["高级", "财经", "账本", "博主"],
    card: {
      background: "#f4efe3",
      borderRadius: 8,
      shadow: [
        "0 5px 18px rgba(77,70,52,0.12)",
        "0 18px 56px rgba(77,70,52,0.18)",
      ],
      border: "rgba(140,121,72,0.18)",
    },
    decorations: {
      topLine: { enabled: true, height: 3, gradient: ["#9a7c35", "#d6bd72", 0.50, "rgba(214,189,114,0.18)"] },
      cornerBadge: { enabled: true, text: "▥", position: "br", bg: "rgba(250,246,236,0.88)", color: "#9a7c35" },
      watermark: null,
      paperTexture: true,
      tapeDecor: null,
      innerBorder: { enabled: true, style: "solid", color: "rgba(140,121,72,0.16)", width: 1, margin: 26 },
      cornerStamp: null,
      bottomLine: { enabled: true, height: 14, gradient: ["rgba(154,124,53,0.16)", "#9a7c35", 0.48, "rgba(214,189,114,0.16)"] },
      cornerBrackets: null,
      advancedDecor: { enabled: true, variant: "finance-ledger" },
    },
    typography: {
      font: "sans",
      headingStyle: "line",
      listStyle: "dash",
      blockquoteStyle: "accent",
      codeStyle: "mono",
    },
    colors: {
      primary: "#342f22",
      secondary: "#63583b",
      muted: "#82755b",
      accent: "#9a7c35",
    },
    defaultTheme: {
      cardBg: "#f4efe3",
      cardText: "#342f22",
      cardMuted: "#82755b",
      accent: "#9a7c35",
      accentDim: "rgba(154,124,53,0.14)",
      bodyBg: "#d8d0bb",
      cardBorder: "rgba(140,121,72,0.18)",
      contentInsetX: 32,
      font: "sans",
      fontSize: 16,
      lineHeight: 1.76,
      templateSurfaceStyle: "paper",
      templatePanelRadius: 8,
      templatePanelOpacity: 48,
    },
    builtIn: true,
  },
];

// ============================================================
// 模板管理函数
// ============================================================

/** 获取所有内置模板 */
export function getBuiltInTemplates(): NoteTemplate[] {
  return BUILT_IN_TEMPLATES;
}

/** 根据 ID 获取模板 */
export function getTemplateById(id: string): NoteTemplate | undefined {
  return BUILT_IN_TEMPLATES.find(t => t.id === id);
}

/** 根据风格筛选模板 */
export function getTemplatesByStyle(style: TemplateStyle): NoteTemplate[] {
  return BUILT_IN_TEMPLATES.filter(t => t.style === style);
}

/** 根据标签筛选模板 */
export function getTemplatesByTag(tag: string): NoteTemplate[] {
  return BUILT_IN_TEMPLATES.filter(t => t.tags.includes(tag));
}

/** 搜索模板 */
export function searchTemplates(query: string): NoteTemplate[] {
  const lower = query.toLowerCase();
  return BUILT_IN_TEMPLATES.filter(t =>
    t.name.toLowerCase().includes(lower) ||
    t.description.toLowerCase().includes(lower) ||
    t.tags.some(tag => tag.toLowerCase().includes(lower))
  );
}

// ============================================================
// 模板应用
// ============================================================

/**
 * 将模板应用到当前主题配置
 */
export function applyTemplate(template: NoteTemplate, currentTheme: ThemeConfig): ThemeConfig {
  return {
    ...currentTheme,
    // 基础配色
    cardBg: template.defaultTheme.cardBg ?? currentTheme.cardBg,
    cardText: template.defaultTheme.cardText ?? currentTheme.cardText,
    cardMuted: template.defaultTheme.cardMuted ?? currentTheme.cardMuted,
    accent: template.defaultTheme.accent ?? currentTheme.accent,
    accentDim: template.defaultTheme.accentDim ?? currentTheme.accentDim,
    bodyBg: template.defaultTheme.bodyBg ?? currentTheme.bodyBg,
    cardBorder: template.defaultTheme.cardBorder ?? currentTheme.cardBorder,
    cardOutline: template.defaultTheme.cardOutline ?? currentTheme.cardOutline,
    // 排版
    contentInsetX: template.defaultTheme.contentInsetX ?? currentTheme.contentInsetX,
    font: template.defaultTheme.font ?? currentTheme.font,
    fontSize: template.defaultTheme.fontSize ?? currentTheme.fontSize,
    lineHeight: template.defaultTheme.lineHeight ?? currentTheme.lineHeight,
    templateSurfaceStyle: template.defaultTheme.templateSurfaceStyle ?? currentTheme.templateSurfaceStyle,
    templatePanelRadius: template.defaultTheme.templatePanelRadius ?? currentTheme.templatePanelRadius,
    templatePanelOpacity: template.defaultTheme.templatePanelOpacity ?? currentTheme.templatePanelOpacity,
    templateAccentStrength: template.defaultTheme.templateAccentStrength ?? currentTheme.templateAccentStrength,
    templateTitleScale: template.defaultTheme.templateTitleScale ?? currentTheme.templateTitleScale,
    templateBodyScale: template.defaultTheme.templateBodyScale ?? currentTheme.templateBodyScale,
    templateCardPadding: template.defaultTheme.templateCardPadding ?? currentTheme.templateCardPadding,
    templateSectionGap: template.defaultTheme.templateSectionGap ?? currentTheme.templateSectionGap,
    templateCardMinHeight: template.defaultTheme.templateCardMinHeight ?? currentTheme.templateCardMinHeight,
    // 卡片样式（来自 template.card）
    cardRadius: template.card.borderRadius,
    shadow: template.card.shadow,
    paperTexture: template.decorations.paperTexture,
    // 顶线
    topLineHeight: template.decorations.topLine.enabled ? template.decorations.topLine.height : 0,
    topLineGradient: template.decorations.topLine.gradient,
  };
}

/**
 * 验证模板配置
 */
export function validateTemplate(template: Partial<NoteTemplate>): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!template.id) errors.push("模板 ID 不能为空");
  if (!template.name) errors.push("模板名称不能为空");
  if (!template.card) errors.push("卡片样式不能为空");
  if (!template.colors) errors.push("配色方案不能为空");

  return { valid: errors.length === 0, errors };
}

// ============================================================
// 自定义模板存储
// ============================================================

const CUSTOM_TEMPLATES_KEY = "xhs_paiban_custom_templates";

export function getCustomTemplates(): NoteTemplate[] {
  try {
    const raw = localStorage.getItem(CUSTOM_TEMPLATES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveCustomTemplate(template: NoteTemplate): void {
  const customs = getCustomTemplates();
  const existing = customs.findIndex(t => t.id === template.id);

  if (existing >= 0) {
    customs[existing] = template;
  } else {
    customs.push(template);
  }

  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(customs));
}

export function deleteCustomTemplate(id: string): void {
  const customs = getCustomTemplates().filter(t => t.id !== id);
  localStorage.setItem(CUSTOM_TEMPLATES_KEY, JSON.stringify(customs));
}

/** 获取所有模板（内置 + 自定义） */
export function getAllTemplates(): NoteTemplate[] {
  return [...BUILT_IN_TEMPLATES, ...getCustomTemplates()];
}
