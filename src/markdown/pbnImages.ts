/**
 * 将内联 data URL 图片换成短占位符，避免编辑器被 base64 撑爆。
 * 预览与导出前用 expandPbnImages 还原。
 */

const HAS_DATA_IMG = /!\[[^\]]*\]\(data:image\/[^)]+\)/i;
const DATA_IMG_RE = /!\[([^\]]*)\]\((data:image\/[^)]+)\)/gi;

/** Markdown 图片语法里的占位 URL：![alt](pbn:img/<uuid>) */
/** 将单张图片 URL（pbn 或普通）转为预览/导出用地址 */
export function expandImageUrl(url: string, assets: Record<string, string>): string {
  const m = /^pbn:img\/([^)\s]+)$/.exec(url.trim());
  if (m) {
    const data = assets[m[1]];
    return data ?? url;
  }
  return url;
}

export function expandPbnImages(
  md: string,
  assets: Record<string, string>
): string {
  if (!md) return md;
  return md.replace(
    /!\[([^\]]*)\]\(pbn:img\/([^)\s]+)\)/g,
    (_match, alt: string, id: string) => {
      const u = assets[id];
      return u ? `![${alt}](${u})` : `![${alt}](pbn:img/${id})`;
    }
  );
}

/**
 * 把文中所有 data:image 图片改为占位符，并写入 assets（保留已有 id→url）。
 */
export function collapseDataImagesToPlaceholders(
  md: string,
  assets: Record<string, string>
): { md: string; assets: Record<string, string> } {
  if (!HAS_DATA_IMG.test(md)) {
    return { md, assets };
  }
  DATA_IMG_RE.lastIndex = 0;
  const next: Record<string, string> = { ...assets };
  const out = md.replace(DATA_IMG_RE, (_m, alt: string, dataUrl: string) => {
    const id = crypto.randomUUID();
    next[id] = dataUrl;
    return `![${alt}](pbn:img/${id})`;
  });
  return { md: out, assets: next };
}
