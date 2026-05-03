/**
 * 将 Markdown 拆成「文本段」与「图片段」，便于预览区对图片做交互编辑并回写。
 */

const IMG_RE = /!\[([^\]]*)\]\(([^)]+)\)/g;

export type MdSegment =
  | { type: "md"; text: string }
  | { type: "img"; index: number; raw: string; alt: string; url: string };

export function splitMarkdownSegments(md: string): MdSegment[] {
  const segments: MdSegment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let index = 0;
  IMG_RE.lastIndex = 0;
  while ((m = IMG_RE.exec(md)) !== null) {
    if (m.index > last) {
      segments.push({ type: "md", text: md.slice(last, m.index) });
    }
    segments.push({
      type: "img",
      index: index++,
      raw: m[0],
      alt: m[1],
      url: m[2],
    });
    last = m.index + m[0].length;
  }
  if (last < md.length) {
    segments.push({ type: "md", text: md.slice(last) });
  }
  return segments;
}

export function replaceMarkdownImageAtIndex(
  markdown: string,
  imageIndex: number,
  newImageMarkdown: string
): string {
  let i = 0;
  IMG_RE.lastIndex = 0;
  return markdown.replace(IMG_RE, (full) => {
    if (i++ === imageIndex) return newImageMarkdown;
    return full;
  });
}

export function removeMarkdownImageAtIndex(markdown: string, imageIndex: number): string {
  let i = 0;
  IMG_RE.lastIndex = 0;
  let out = markdown.replace(IMG_RE, (full) => (i++ === imageIndex ? "" : full));
  out = out.replace(/\n{3,}/g, "\n\n");
  return out;
}
