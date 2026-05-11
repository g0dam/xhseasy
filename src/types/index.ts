// ============================================================
// 主题与配置模型
// ============================================================

export type FontFamily = "serif" | "sans" | "mono";
export type BackgroundMode = "color" | "image";
export type BackgroundImageFit = "cover" | "contain";
export type NoteMetaPosition = "top" | "bottom";
export type NoteMetaAlign = "left" | "center";
export type TemplateSurfaceStyle = "blend" | "paper" | "outline";
export type ContentDensity = "compact" | "balanced";
export type AspectRatio = "3:4" | "3:5";

export interface ThemeColors {
  cardBg: string;      // 卡片背景
  cardText: string;    // 正文颜色
  cardMuted: string;    // 辅助文字色
  accent: string;       // 强调色（引用线、顶线）
  accentDim: string;    // 淡化强调色（h2装饰等）
  bodyBg: string;       // 外层工作区背景
  cardBorder: string;   // 卡片描边
  cardOutline: string;  // 卡片外轮廓
}

export interface ThemeTypography {
  font: FontFamily;
  fontSize: number;     // px
  lineHeight: number;   // e.g. 1.75
  letterSpacing: number; // em
  inlinePad: number;     // 左右边距 px
}

export interface ThemeSpacing {
  blockPadX: number;
  blockPadY: number;
  blockPadBottom: number;
  pageBottomSafeArea: number;
  metaMarginBottom: number;
  pMarginBottom: number;
  h2MarginTop: number;
  h2MarginBottom: number;
  h3MarginTop: number;
  h3MarginBottom: number;
  ulMarginBottom: number;
  liMarginBottom: number;
  liLineHeight: number;
  listPadTop: number;
  listAfterH: number;
  blockquoteMargin: number;
  blockquotePadding: number;
  hrMargin: number;
  imgMargin: number;
  preMargin: number;
}

export interface ThemeDecor {
  topLineHeight: number;  // 顶装饰线高度 px
  topLineGradient: [string, string, number, string]; // [start, mid, midPct(0-1), end]
  cardRadius: number;      // 圆角 px
  shadow: [string, string]; // 各层阴影
  h2Decor: "line" | "dot" | "none";
  h3Decor: "dot" | "line" | "none";
  listMarkerCol: number;   // em，数字标记列宽
  listMarkerType: "dot" | "dash" | "number";
  codeDecor: "line" | "bg" | "none";
  blockquoteDecor: "accent-line" | "gray-line" | "bg";
  paperTexture: boolean;
  /** 导出卡片宽度（px），用于预览和切片计算 */
  exportCardWidth?: number;
  backgroundMode: BackgroundMode;
  backgroundImageSrc: string;
  backgroundImageFit: BackgroundImageFit;
  backgroundImagePosition: string;
  backgroundOverlay: string;
  backgroundDim: number;
  backgroundBlur: number;
  templateSurfaceStyle: TemplateSurfaceStyle;
  templatePanelRadius: number;
  templatePanelOpacity: number;
  templateAccentStrength: number;
  contentInsetX: number;
  contentDensity: ContentDensity;
  templateTitleScale: number;
  templateBodyScale: number;
  templateCardPadding: number;
  templateSectionGap: number;
  templateCardMinHeight: number;
}

export interface ThemeSwatch {
  name: string;
  cardBg: string;
  cardText: string;
  accent: string;
  bodyBg: string;
}

export interface ThemePreset {
  name: string;
  cardBg: string;
  cardText: string;
  accent: string;
  bodyBg: string;
  font: FontFamily;
  fontSize: number;
  lineHeight: number;
  cardRadius: number;
}

// 合并后的完整主题配置
export interface ThemeConfig extends ThemeColors, ThemeTypography, ThemeSpacing, ThemeDecor {}

// ============================================================
// 笔记元信息
// ============================================================

export interface NoteProfile {
  displayName: string;
  avatarSrc: string;
  noteDate: string;  // 空字符串 = 自动用当天日期
}

// ============================================================
// 排版引擎状态
// ============================================================

export interface EditorSettings extends ThemeColors, ThemeTypography, ThemeSpacing, ThemeDecor {
  exportCardWidth: number;  // 导出宽度 px
  aspectRatio: AspectRatio;  // 导出比例
  showNoteMeta: boolean;
  showPageNumber: boolean;
  noteMetaPosition: NoteMetaPosition;
  noteMetaAlign: NoteMetaAlign;
  /** 顶栏左侧内边距（px） */
  noteMetaPadLeft: number;
  /** 顶栏右侧内边距（px） */
  noteMetaPadRight: number;
  /** 笔记顶栏昵称（头像右侧） */
  displayName: string;
  avatarSrc: string;
  bioLines: string[];
  /** 空字符串 = 预览里始终显示「当天」的 MM/DD；YYYY-MM-DD = 固定日期 */
  noteDate: string;
}

export interface AppState {
  markdown: string;
  settings: EditorSettings;
  profile: NoteProfile;
  isDirty: boolean;
  mdFileHandle: FileSystemFileHandle | null;
}

// ============================================================
// 切片导出
// ============================================================

export interface SliceRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SlicePage {
  index: number;
  rect: SliceRect;
  canvas: HTMLCanvasElement;
}

export interface SliceBoundary {
  fromBlock: number;
  toBlock: number;
  topY: number;
  bottomY: number;
  height: number;
  index: number;
}

export interface ExportOptions {
  scale: number;           // 导出分辨率倍率（默认2）
  aspectRatio: "3:4" | "3:5" | "4:5" | "1:1" | "auto";
  includeMeta: boolean;
  onProgress?: (current: number, total: number) => void;
}

// ============================================================
// 文本测量
// ============================================================

export interface TextMeasurement {
  raw: string;
  fontSpec: string;
  maxWidth: number;
  lineHeight: number;
  height: number;
  lineCount: number;
  maxLineWidth: number;
}

export interface RichInlineSpan {
  text: string;
  font: string;
  bold?: boolean;
  italic?: boolean;
  extraWidth?: number;  // pill/chip 的 padding + border
  breakNever?: boolean;
}

// ============================================================
// Markdown AST（渲染用）
// ============================================================

export type BlockType =
  | "p"
  | "h1"
  | "h2"
  | "h3"
  | "ul"
  | "ol"
  | "blockquote"
  | "hr"
  | "pre"
  | "img"
  | "divider";

export interface Block {
  type: BlockType;
  raw: string;         // 原始 markdown 文本
  html?: string;       // 渲染后的 HTML
  children?: Block[];
  depth?: number;       // 嵌套层级（列表）
  attrs?: Record<string, string>;
}

// ============================================================
// 图片布局配置
// ============================================================

export type ImageLayout = "block" | "float-left" | "float-right" | "full-width";

export interface ImageBlockConfig {
  id: string;
  src: string;
  alt: string;
  layout: ImageLayout;
  width: number;
  maxHeight: number;
  borderRadius: number;
  marginTop: number;
  marginBottom: number;
  editable: boolean;
}
