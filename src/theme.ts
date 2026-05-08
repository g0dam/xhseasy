import type {
  ThemeConfig,
  ThemeSwatch,
  ThemePreset,
  FontFamily,
  BackgroundMode,
  BackgroundImageFit,
  TemplateSurfaceStyle,
} from "@/types";

// ============================================================
// 字体映射
// ============================================================

/** 中文优先：避免 Noto 未加载时落到无 CJK 的泛 serif（如 Times）出现豆腐块 */
export const FONT_OPTIONS: Record<FontFamily, string> = {
  serif:
    '"Noto Serif SC","Source Han Serif SC","PingFang SC","Hiragino Sans GB","Microsoft YaHei","SimSun","NSimSun","STSong","Songti SC",serif',
  sans:
    'system-ui,-apple-system,"Segoe UI","PingFang SC","Hiragino Sans GB","Microsoft YaHei","Noto Sans SC",sans-serif',
  mono: 'ui-monospace,"Cascadia Code","SF Mono",Consolas,monospace',
};

export function getFontSpec(
  font: FontFamily,
  size?: number,
  weight?: number,
  opts?: { skipWeight?: boolean }
): string {
  const parts: string[] = [];
  if (weight && !opts?.skipWeight) parts.push(String(weight));
  if (size) parts.push(`${size}px`);
  parts.push(FONT_OPTIONS[font]);
  return parts.join(" ");
}

/** 不含 weight 的 font-spec（用于后续单独设置 fontWeight，避免 shorthand 冲突） */
export function getFontSpecLight(
  font: FontFamily,
  size?: number,
  _weight?: number
): string {
  const parts: string[] = [];
  if (size) parts.push(`${size}px`);
  parts.push(FONT_OPTIONS[font]);
  return parts.join(" ");
}

type RgbParts = { r: number; g: number; b: number };

function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function hexToRgbParts(hex: string): RgbParts {
  const normalized = hex.trim().match(/^#([0-9a-f]{6})$/i)?.[1];
  if (!normalized) {
    return { r: 0, g: 0, b: 0 };
  }
  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
  };
}

export function rgbaFromHex(hex: string, alpha: number): string {
  const { r, g, b } = hexToRgbParts(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function mixHexColors(first: string, second: string, firstWeight: number): string {
  const a = hexToRgbParts(first);
  const b = hexToRgbParts(second);
  const weight = Math.max(0, Math.min(1, firstWeight));
  const inverse = 1 - weight;
  const toHex = (value: number) => clampChannel(value).toString(16).padStart(2, "0");
  return `#${toHex(a.r * weight + b.r * inverse)}${toHex(a.g * weight + b.g * inverse)}${toHex(a.b * weight + b.b * inverse)}`;
}

export function deriveAccentPalette(accent: string, cardText: string, cardBg: string) {
  return {
    ink: mixHexColors(accent, cardText, 0.72),
    solid: mixHexColors(accent, cardBg, 0.24),
    soft: rgbaFromHex(accent, 0.1),
    line: rgbaFromHex(accent, 0.18),
    border: rgbaFromHex(accent, 0.14),
  };
}

// ============================================================
// 默认主题配置（纸感编辑）
// ============================================================

// 注意：ThemeDecor.topLineGradient = [string, string, number, string]
//       ThemeDecor.shadow           = [string, string, string, string]

export const DEFAULT_THEME = {
  // 配色
  cardBg: "#f7efe2",
  cardText: "#241a12",
  cardMuted: "#7f6c58",
  accent: "#c8642f",
  accentDim: "rgba(200, 100, 47, 0.14)",
  bodyBg: "#e7ddcc",
  cardBorder: "rgba(62, 40, 19, 0.08)",
  cardOutline: "rgba(62, 40, 19, 0.06)",
  // 排版
  font: "serif" as FontFamily,
  fontSize: 17,
  lineHeight: 1.82,
  letterSpacing: 0.018,
  inlinePad: 32,
  // 间距
  blockPadX: 32,
  blockPadY: 24,
  blockPadBottom: 36,
  pageBottomSafeArea: 8,
  metaMarginBottom: 16,
  pMarginBottom: 0.92,
  h2MarginTop: 1.14,
  h2MarginBottom: 0.48,
  h3MarginTop: 1.08,
  h3MarginBottom: 0.42,
  ulMarginBottom: 1.02,
  liMarginBottom: 0.38,
  liLineHeight: 1.58,
  listPadTop: 0.08,
  listAfterH: 1.12,
  blockquoteMargin: 0.82,
  blockquotePadding: 14,
  hrMargin: 1.3,
  imgMargin: 0.45,
  preMargin: 0.84,
  // 装饰
  topLineHeight: 3,
  topLineGradient: ["#c8642f", "#d98f56", 0.62, "rgba(200,100,47,0.18)"] as [string, string, number, string],
  cardRadius: 18,
  shadow: [
    "0 6px 18px rgba(84,58,28,0.08)",
    "0 20px 54px rgba(84,58,28,0.12)",
  ] as [string, string],
  h2Decor: "line" as const,
  h3Decor: "dot" as const,
  listMarkerCol: 0.95,
  listMarkerType: "dot" as const,
  codeDecor: "line" as const,
  blockquoteDecor: "accent-line" as const,
  paperTexture: true,
  backgroundMode: "color" as BackgroundMode,
  backgroundImageSrc: "",
  backgroundImageFit: "cover" as BackgroundImageFit,
  backgroundImagePosition: "center center",
  backgroundOverlay: "rgba(247, 239, 226, 0.72)",
  backgroundDim: 18,
  backgroundBlur: 6,
  templateSurfaceStyle: "blend" as TemplateSurfaceStyle,
  templatePanelRadius: 18,
  templatePanelOpacity: 48,
  templateAccentStrength: 42,
  contentInsetX: 24,
  contentDensity: "compact" as const,
  templateTitleScale: 0.88,
  templateBodyScale: 0.92,
  templateCardPadding: 16,
  templateSectionGap: 14,
  templateCardMinHeight: 0,
} satisfies ThemeConfig;

// ============================================================
// 预设主题
// ============================================================

export const SWATCHES: ThemeSwatch[] = [
  { name: "纸感编辑", cardBg: "#f5f2e9", cardText: "#222222", accent: "#c45c26", bodyBg: "#e8e4d9" },
  { name: "暖棕经典", cardBg: "#f7f5f2", cardText: "#1f1f1f", accent: "#c45c26", bodyBg: "#e8e6e3" },
  { name: "极简白",   cardBg: "#ffffff", cardText: "#1a1a1a", accent: "#2563eb", bodyBg: "#f0f0f0" },
  { name: "墨绿",     cardBg: "#f0faf4", cardText: "#1a3a2a", accent: "#16a34a", bodyBg: "#dcf0e3" },
  { name: "复古",     cardBg: "#fdf6e3", cardText: "#3b2f1e", accent: "#b45309", bodyBg: "#f5e6c8" },
  { name: "暗夜",     cardBg: "#1e1e1e", cardText: "#e0e0e0", accent: "#60a5fa", bodyBg: "#111111" },
];

export const PRESETS: ThemePreset[] = [
  { name: "纸感统一", cardBg: "#f5f2e9", cardText: "#222222", accent: "#c45c26", bodyBg: "#e8e4d9", font: "serif", fontSize: 17, lineHeight: 1.75, cardRadius: 18 },
  { name: "冷淡清新", cardBg: "#f0f7ff", cardText: "#1a2e4a", accent: "#2563eb", bodyBg: "#e0eaf8", font: "sans",  fontSize: 16, lineHeight: 1.8,  cardRadius: 16  },
  { name: "深邃暗调", cardBg: "#1e1e1e", cardText: "#e0e0e0", accent: "#60a5fa", bodyBg: "#111111", font: "sans",  fontSize: 16, lineHeight: 1.8,  cardRadius: 18 },
  { name: "纸质感",   cardBg: "#faf9f6", cardText: "#2a2418", accent: "#92400e", bodyBg: "#efede8", font: "serif", fontSize: 18, lineHeight: 1.95, cardRadius: 22  },
];

export const BACKGROUND_PRESETS = [
  {
    name: "暖纸",
    overlay: "rgba(247, 239, 226, 0.72)",
    dim: 18,
    blur: 6,
  },
  {
    name: "轻雾",
    overlay: "rgba(250, 247, 241, 0.58)",
    dim: 10,
    blur: 10,
  },
  {
    name: "暗调",
    overlay: "rgba(30, 24, 20, 0.48)",
    dim: 42,
    blur: 4,
  },
  {
    name: "冷静",
    overlay: "rgba(240, 244, 248, 0.62)",
    dim: 16,
    blur: 8,
  },
] as const;

// ============================================================
// CSS 变量生成器
// ============================================================

export type CssVars = Record<string, string>;

/**
 * 根据主题配置生成完整 CSS 变量集，
 * 可直接注入到 document.documentElement.style
 */
export function buildCssVars(theme: ThemeConfig): CssVars {
  const [shadow1, shadow2] = theme.shadow;
  const [gs, _gm, gmPct, _ge] = theme.topLineGradient;

  // 将 hex 转换为 rgb 字符串
  const hexToRgb = (hex: string): string => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `${r},${g},${b}`;
  };

  // 判断是否为暗色背景（用于纸纹等颜色调整）
  const isDark = (() => {
    const r = parseInt(theme.cardBg.slice(1, 3), 16);
    const g = parseInt(theme.cardBg.slice(3, 5), 16);
    const b = parseInt(theme.cardBg.slice(5, 7), 16);
    return (r * 299 + g * 587 + b * 114) / 1000 < 128;
  })();

  const cardBgRgb = hexToRgb(theme.cardBg);
  const textRgb = hexToRgb(theme.cardText);
  const accentRgb = hexToRgb(theme.accent);

  // 纸纹颜色：暗色背景用半透明白（肉眼干净），浅色背景用半透明深色（自然纸张感）
  const paperGrainColor = isDark
    ? "255,255,255"
    : textRgb;

  const gradStr = `linear-gradient(90deg, ${gs} 0%, ${gs} ${Math.round(gmPct * 100)}%, rgba(${hexToRgb(gs)},0.35) 100%)`;
  const accentPalette = deriveAccentPalette(theme.accent, theme.cardText, theme.cardBg);
  const opacity = Math.max(0, Math.min(100, theme.templatePanelOpacity)) / 100;
  const accentAlpha = Math.max(0, Math.min(100, theme.templateAccentStrength)) / 100;
  const templateStyleVars = (() => {
    switch (theme.templateSurfaceStyle) {
      case "paper":
        return {
          bg: `linear-gradient(180deg, rgba(255,255,255,${Math.min(0.86, opacity + 0.12)}), rgba(${cardBgRgb}, ${Math.min(0.92, opacity + 0.22)}))`,
          border: `rgba(${textRgb}, 0.08)`,
          shadow: `0 12px 28px rgba(${textRgb},0.06), inset 0 1px 0 rgba(255,255,255,0.7)`,
        };
      case "outline":
        return {
          bg: `linear-gradient(180deg, rgba(${cardBgRgb}, ${Math.max(0.12, opacity - 0.2)}), rgba(${cardBgRgb}, ${Math.max(0.06, opacity - 0.34)}))`,
          border: `rgba(${accentRgb}, ${Math.max(0.12, accentAlpha * 0.45)})`,
          shadow: "inset 0 1px 0 rgba(255,255,255,0.44)",
        };
      default:
        return {
          bg: `linear-gradient(180deg, rgba(255,255,255,${Math.min(0.72, opacity + 0.12)}), rgba(${cardBgRgb}, ${Math.min(0.68, opacity + 0.12)}))`,
          border: `rgba(${textRgb}, 0.07)`,
          shadow: `0 10px 24px rgba(${textRgb},0.04), inset 0 1px 0 rgba(255,255,255,0.62)`,
        };
    }
  })();

  const blockPadTop = theme.topLineHeight + 18;

  return {
    // 配色
    "--card-bg": theme.cardBg,
    "--card-text": theme.cardText,
    "--card-muted": theme.cardMuted,
    "--accent": theme.accent,
    "--accent-dim": theme.accentDim,
    "--body-bg": theme.bodyBg,
    "--card-border": theme.cardBorder,
    // 动态颜色（用于 CSS 中避免硬编码）
    "--card-bg-rgb": cardBgRgb,
    "--card-text-rgb": textRgb,
    "--accent-rgb": accentRgb,
    "--paper-grain-color": paperGrainColor,
    // 阴影颜色
    "--shadow-dark-rgb": textRgb,
    "--shadow-light-rgb": cardBgRgb,
    // 排版
    "--note-font-family": FONT_OPTIONS[theme.font],
    "--note-font-size": `${theme.fontSize}px`,
    "--note-line-height": String(theme.lineHeight),
    "--note-letter-spacing": `${theme.letterSpacing}em`,
    "--note-inline-pad": `${theme.inlinePad}px`,
    // 间距
    "--note-block-pad-top": `${blockPadTop}px`,
    "--note-block-pad-x": `${theme.blockPadX}px`,
    "--note-block-pad-bottom": `${theme.blockPadBottom}px`,
    "--note-page-bottom-safe-area": `${theme.pageBottomSafeArea ?? 8}px`,
    "--note-meta-margin-bottom": `${theme.metaMarginBottom}px`,
    "--note-meta-pad-left": `${(theme as any).noteMetaPadLeft ?? 0}px`,
    "--note-meta-pad-right": `${(theme as any).noteMetaPadRight ?? 0}px`,
    "--note-p-margin-bottom": `${theme.pMarginBottom}em`,
    "--note-h2-margin-top": `${theme.h2MarginTop}em`,
    "--note-h2-margin-bottom": `${theme.h2MarginBottom}em`,
    "--note-h3-margin-top": `${theme.h3MarginTop}em`,
    "--note-h3-margin-bottom": `${theme.h3MarginBottom}em`,
    "--note-ul-margin-bottom": `${theme.ulMarginBottom}em`,
    "--note-li-margin-bottom": `${theme.liMarginBottom}em`,
    "--note-li-line-height": String(theme.liLineHeight),
    "--note-list-pad-top": `${theme.listPadTop}em`,
    "--note-list-after-h": `${theme.listAfterH}em`,
    "--note-blockquote-margin": `${theme.blockquoteMargin}em`,
    "--note-blockquote-padding": `${theme.blockquotePadding}px`,
    "--note-hr-margin": `${theme.hrMargin}em`,
    "--note-img-margin": `${theme.imgMargin}em`,
    "--note-pre-margin": `${theme.preMargin}em`,
    // 装饰
    "--top-line-h": `${theme.topLineHeight}px`,
    "--top-line-grad": gradStr,
    "--radius-card": `${theme.cardRadius}px`,
    "--shadow-1": shadow1,
    "--shadow-2": shadow2,
    "--note-list-marker-col": `${theme.listMarkerCol}em`,
    "--stage-bg": theme.bodyBg,
    "--stage-bg-image": theme.backgroundMode === "image" && theme.backgroundImageSrc
      ? `url("${theme.backgroundImageSrc}")`
      : "none",
    "--stage-bg-size": theme.backgroundImageFit,
    "--stage-bg-position": theme.backgroundImagePosition,
    "--stage-overlay": theme.backgroundOverlay,
    "--stage-bg-dim": `${Math.max(0, Math.min(100, theme.backgroundDim)) / 100}`,
    "--stage-bg-blur": `${theme.backgroundBlur}px`,
    "--template-panel-bg": templateStyleVars.bg,
    "--template-panel-border": templateStyleVars.border,
    "--template-panel-shadow": templateStyleVars.shadow,
    "--template-panel-radius": `${theme.templatePanelRadius}px`,
    "--template-accent-ink": accentPalette.ink,
    "--template-accent-solid": accentPalette.solid,
    "--template-accent-soft": `rgba(${accentRgb}, ${Math.max(0.06, accentAlpha * 0.22)})`,
    "--template-accent-line": `rgba(${accentRgb}, ${Math.max(0.12, accentAlpha * 0.42)})`,
    "--template-danger-soft": `rgba(${textRgb}, 0.08)`,
    "--template-danger-text": `rgba(${textRgb}, 0.82)`,
    "--content-inset-x": `${theme.contentInsetX}px`,
    "--template-title-scale": String(theme.templateTitleScale),
    "--template-body-scale": String(theme.templateBodyScale),
    "--template-card-padding": `${theme.templateCardPadding}px`,
    "--template-section-gap": `${theme.templateSectionGap}px`,
    "--template-card-min-height": `${theme.templateCardMinHeight}px`,
    // 辅助色混合（用于 comparison head 等需要融合 muted 与 accent-ink 的场景）
    "--muted-mixed-color": mixHexColors(theme.cardMuted, accentPalette.ink, 0.82),
    // 时间线圆点光晕（白 74% + card-bg 26%）
    "--timeline-dot-ring-color": mixHexColors("#ffffff", theme.cardBg, 0.74),
  };
}

// ============================================================
// 字体规格工具
// ============================================================

/** 从主题配置构建正文 font-spec 字符串 */
export function buildBodyFontSpec(theme: ThemeConfig): string {
  return getFontSpec(theme.font, theme.fontSize, 400);
}

/** 从主题配置构建标题 font-spec 字符串 */
export function buildHeadingFontSpec(
  theme: ThemeConfig,
  level: "h1" | "h2" | "h3"
): string {
  const sizes: Record<string, number> = { h1: 23, h2: 19, h3: 17 };
  const weights: Record<string, number> = { h1: 700, h2: 600, h3: 600 };
  return getFontSpec(theme.font, sizes[level], weights[level]);
}

/** 从主题配置构建代码 font-spec 字符串 */
export function buildMonoFontSpec(theme: ThemeConfig): string {
  return getFontSpec("mono", Math.round(theme.fontSize * 0.88), 400);
}
