/**
 * imageLayout.ts — 图片布局系统（精简版）
 *
 * 只保留被实际使用的函数：
 *   configFromImageMarkdown, configToMarkdown, extractAllImages, generateLayoutButtons
 */

export type ImageLayout = "block" | "float-left" | "float-right" | "full-width";

export interface ImageConfig {
  id: string;
  src: string;
  alt: string;
  layout: ImageLayout;
  width: number;
  maxHeight: number;
  borderRadius: number;
  marginTop: number;
  marginBottom: number;
  position: "start" | "middle" | "end";
  editable: boolean;
  rawMarkdown: string;
  offsetX: number;
  offsetY: number;
}

// ============================================================
// URL 参数解析
// ============================================================

const PARAM_RE = /!\[([^\]]*)\]\(([^?)\s]+)(\?[^)]*)?\)/gi;

interface ParsedParams {
  w?: number;
  h?: number;
  layout?: string;
  r?: number;
  m?: number;
  pos?: string;
  dx?: number;
  dy?: number;
}

function parseParams(queryString: string): ParsedParams {
  const params: ParsedParams = {};
  const pairs = queryString.replace(/^\?/, "").split("&");
  for (const pair of pairs) {
    const [key, value] = pair.split("=");
    if (!key || !value) continue;
    const num = parseFloat(value);
    switch (key) {
      case "w": params.w = Math.min(100, Math.max(10, num)); break;
      case "h": params.h = num; break;
      case "layout": params.layout = value; break;
      case "r": params.r = Math.min(50, Math.max(0, num)); break;
      case "m": params.m = num; break;
      case "pos": params.pos = value; break;
      case "dx": params.dx = num; break;
      case "dy": params.dy = num; break;
    }
  }
  return params;
}

function normalizeLayout(layout?: string | null): ImageLayout {
  if (layout === "full-width") return "full-width";
  if (layout === "float-left" || layout === "float-right") return "block";
  return "block";
}

// ============================================================
// 图片配置解析
// ============================================================

export function parseImageConfig(markdown: string, defaultConfig: Partial<ImageConfig> = {}): ImageConfig | null {
  PARAM_RE.lastIndex = 0;
  const match = markdown.match(PARAM_RE);
  if (!match) return null;

  const full = match[0];
  const altMatch = full.match(/!\[([^\]]*)\]/);
  const alt = altMatch ? altMatch[1] : "";
  const urlMatch = full.match(/\]\(([^)]+)\)/);
  if (!urlMatch) return null;

  const rawUrl = urlMatch[1];
  const [cleanUrl, queryString] = rawUrl.includes("?")
    ? [rawUrl.split("?")[0], rawUrl.split("?")[1]]
    : [rawUrl, ""];

  const params = parseParams(queryString);

  return {
    ...defaultConfig,
    id: crypto.randomUUID(),
    src: cleanUrl,
    alt,
    layout: normalizeLayout(params.layout ?? defaultConfig.layout),
    width: params.w ?? defaultConfig.width ?? 100,
    maxHeight: params.h ?? defaultConfig.maxHeight ?? 400,
    borderRadius: params.r ?? defaultConfig.borderRadius ?? 8,
    marginTop: params.m ?? 16,
    marginBottom: params.m ?? 16,
    position: (params.pos as "start" | "middle" | "end") ?? "start",
    offsetX: params.dx ?? defaultConfig.offsetX ?? 0,
    offsetY: params.dy ?? defaultConfig.offsetY ?? 0,
    editable: true,
    rawMarkdown: full,
  };
}

export function extractAllImages(markdown: string): ImageConfig[] {
  const images: ImageConfig[] = [];
  const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
  let match;

  while ((match = imgRegex.exec(markdown)) !== null) {
    const alt = match[1];
    const raw = match[0];
    const url = match[2];
    const [cleanUrl, queryString] = url.includes("?")
      ? [url.split("?")[0], url.split("?")[1]]
      : [url, ""];
    const params = parseParams(queryString);

    images.push({
      id: crypto.randomUUID(),
      src: cleanUrl,
      alt,
      layout: normalizeLayout(params.layout),
      width: params.w ?? 100,
      maxHeight: params.h ?? 400,
      borderRadius: params.r ?? 8,
      marginTop: params.m ?? 16,
      marginBottom: params.m ?? 16,
      position: (params.pos as "start" | "middle" | "end") ?? "start",
      offsetX: params.dx ?? 0,
      offsetY: params.dy ?? 0,
      editable: true,
      rawMarkdown: raw,
    });
  }
  return images;
}

export function configToMarkdown(config: ImageConfig): string {
  const params: string[] = [];
  if (config.width !== 100) params.push(`w=${config.width}`);
  if (config.maxHeight !== 400) params.push(`h=${config.maxHeight}`);
  if (config.layout === "full-width") params.push(`layout=${config.layout}`);
  if (config.borderRadius !== 8) params.push(`r=${config.borderRadius}`);
  if (config.marginTop !== 16) params.push(`m=${config.marginTop}`);
  if (config.offsetX !== 0) params.push(`dx=${Math.round(config.offsetX)}`);
  if (config.offsetY !== 0) params.push(`dy=${Math.round(config.offsetY)}`);
  const paramStr = params.length > 0 ? `?${params.join("&")}` : "";
  return `![${config.alt}](${config.src}${paramStr})`;
}

const ONE_IMG_RE = /^\s*!\[([^\]]*)\]\(([^)]+)\)\s*$/;

export function configFromImageMarkdown(fullMatch: string): ImageConfig | null {
  const m = fullMatch.match(ONE_IMG_RE);
  if (!m) return null;
  return parseImageConfig(m[0], {});
}

export function generateLayoutButtons(_currentLayout: ImageLayout): Array<{ layout: ImageLayout; label: string; icon: string }> {
  return [
    { layout: "block", label: "占行", icon: "▣" },
    { layout: "full-width", label: "全宽", icon: "▤" },
  ];
}
