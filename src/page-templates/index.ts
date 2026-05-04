import { expandImageUrl } from "@/markdown/pbnImages";

export type PageTemplateKind =
  | "cover"
  | "toc"
  | "checklist"
  | "comparison"
  | "steps"
  | "timeline"
  | "qa"
  | "myth-fact"
  | "quote-note"
  | "data-summary"
  | "gallery"
  | "testimonial";

export type PageTemplateProps = Record<string, unknown>;

export interface ParsedPageTemplateBlock {
  template: PageTemplateKind;
  props: PageTemplateProps;
  rawMarkdown: string;
}

export interface PageTemplateDefinition {
  kind: PageTemplateKind;
  label: string;
  category: "封面" | "结构" | "知识卡" | "图片卡";
  description: string;
  skeleton: string;
}

const PAGE_BLOCK_RE = /```xhs-page\s*\n([\s\S]*?)\n```/g;

const TEMPLATE_DEFINITIONS: PageTemplateDefinition[] = [
  {
    kind: "cover",
    label: "大字报封面",
    category: "封面",
    description: "主标题 + 副标题 + 标签",
    skeleton: `\n\`\`\`xhs-page\ntemplate: cover\ntitle: 这篇笔记想说清什么\nsubtitle: 一句话补充场景和价值\nbadge: 今日重点\naccent: inherit\n\`\`\`\n`,
  },
  {
    kind: "toc",
    label: "目录页",
    category: "结构",
    description: "章节目录导航",
    skeleton: `\n\`\`\`xhs-page\ntemplate: toc\ntitle: 这一篇你会看到什么\nitems:\n  - 为什么这件事重要\n  - 三个核心判断\n  - 可直接照抄的做法\n  - 最后怎么落地\naccent: inherit\n\`\`\`\n`,
  },
  {
    kind: "checklist",
    label: "清单卡",
    category: "知识卡",
    description: "适合收藏的检查清单",
    skeleton: `\n\`\`\`xhs-page\ntemplate: checklist\ntitle: 写作前检查\nitems:\n  - 结论先行\n  - 一页一个重点\n  - 标题里出现对象词\n  - 把空话换成动作\naccent: inherit\n\`\`\`\n`,
  },
  {
    kind: "comparison",
    label: "对比卡",
    category: "知识卡",
    description: "双栏对照",
    skeleton: `\n\`\`\`xhs-page\ntemplate: comparison\ntitle: 两种写法对比\nleftTitle: 常见写法\nrightTitle: 更好写法\nrows:\n  - left: 先铺背景\n    right: 先给判断\n  - left: 句子太满\n    right: 只留关键句\n  - left: 信息太多\n    right: 先放重点\naccent: inherit\n\`\`\`\n`,
  },
  {
    kind: "steps",
    label: "步骤页",
    category: "结构",
    description: "步骤分解",
    skeleton: `\n\`\`\`xhs-page\ntemplate: steps\ntitle: 3 步写清一件事\nsteps:\n  - title: 先定结论\n    detail: 先写最想让人记住的一句\n  - title: 再拆结构\n    detail: 把正文拆成几个可浏览小节\n  - title: 最后补例子\n    detail: 用真实场景把观点压实\naccent: inherit\n\`\`\`\n`,
  },
  {
    kind: "timeline",
    label: "时间轴",
    category: "结构",
    description: "过程与变化",
    skeleton: `\n\`\`\`xhs-page\ntemplate: timeline\ntitle: 一个项目如何成形\npoints:\n  - time: 第 1 周\n    title: 先看需求\n    detail: 先找用户在抱怨什么\n  - time: 第 2 周\n    title: 做最小功能\n    detail: 先打通核心链路\n  - time: 第 3 周\n    title: 再补模板\n    detail: 把稳定场景做成结构\naccent: inherit\n\`\`\`\n`,
  },
  {
    kind: "qa",
    label: "问答卡",
    category: "知识卡",
    description: "问题在上，回答在下",
    skeleton: `\n\`\`\`xhs-page\ntemplate: qa\ntitle: 最常被问的 2 个问题\npairs:\n  - q: 为什么不用自由拖拽？\n    a: 因为结构化模板更稳定，也更适合导出。\n  - q: 模板会不会太死？\n    a: 模板解决结构，不限制内容表达。\naccent: inherit\n\`\`\`\n`,
  },
  {
    kind: "myth-fact",
    label: "误区卡",
    category: "知识卡",
    description: "误区 / 真相",
    skeleton: `\n\`\`\`xhs-page\ntemplate: myth-fact\ntitle: 3 个常见误区\nitems:\n  - myth: 版式越自由越高级\n    fact: 真正高级的是结构清晰且能稳定导出\n  - myth: 一页放越多信息越值钱\n    fact: 一页一个结论更容易被记住\naccent: inherit\n\`\`\`\n`,
  },
  {
    kind: "quote-note",
    label: "引言批注卡",
    category: "知识卡",
    description: "引用 + 拆解",
    skeleton: `\n\`\`\`xhs-page\ntemplate: quote-note\nquote: 读源码不是为了背目录，而是为了建立循环、工具和上下文预算的直觉。\nnote: 这类句子适合做单页展开，因为用户会停下来读批注。\nsource: Claude Code 读后感\naccent: inherit\n\`\`\`\n`,
  },
  {
    kind: "data-summary",
    label: "数据结论卡",
    category: "知识卡",
    description: "大结论 + 指标",
    skeleton: `\n\`\`\`xhs-page\ntemplate: data-summary\ntitle: 这次优化结果\nheadline: 模板页更稳\nstats:\n  - label: 交互复杂度\n    value: 更低\n  - label: 导出一致性\n    value: 更高\n  - label: 维护成本\n    value: 更可控\naccent: inherit\n\`\`\`\n`,
  },
  {
    kind: "gallery",
    label: "拼图页",
    category: "图片卡",
    description: "多图拼接展示",
    skeleton: `\n\`\`\`xhs-page\ntemplate: gallery\ntitle: 这组截图想说明什么\nlayout: 2-grid\nimages:\n  - https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=800&q=80\n  - https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=800&q=80\naccent: inherit\n\`\`\`\n`,
  },
  {
    kind: "testimonial",
    label: "反馈卡",
    category: "知识卡",
    description: "用户反馈/评价汇总",
    skeleton: `\n\`\`\`xhs-page\ntemplate: testimonial\ntitle: 用户最常提到的感受\nitems:\n  - quote: 终于不是一大坨正文了，阅读舒服很多。\n    author: 读者 A\n  - quote: 模板页更适合收藏，信息抓得更快。\n    author: 读者 B\naccent: inherit\n\`\`\`\n`,
  },
];

const ACCENT_MAP: Record<string, string> = {
  inherit: "",
  orange: "#c8642f",
  red: "#d94f45",
  green: "#4f8f55",
  blue: "#3d6fd6",
  purple: "#7d5ad8",
  brown: "#8d6a43",
};

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) return "";
  if (trimmed === "true") return true;
  if (trimmed === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) return Number(trimmed);
  return trimmed.replace(/^["']|["']$/g, "");
}

function parseYamlLike(input: string): Record<string, unknown> {
  const root: Record<string, unknown> = {};
  const lines = input.replace(/\r\n/g, "\n").split("\n");
  type ContainerFrame = {
    indent: number;
    kind: "object" | "array";
    value: Record<string, unknown> | Array<unknown>;
    pendingKey?: string;
  };
  const stack: ContainerFrame[] = [{ indent: -1, kind: "object", value: root }];

  const getParent = (indent: number) => {
    while (stack.length > 1 && indent <= stack[stack.length - 1].indent) {
      stack.pop();
    }
    return stack[stack.length - 1];
  };

  const attachContainer = (
    parent: ContainerFrame,
    key: string | undefined,
    kind: "object" | "array",
    indent: number
  ) => {
    const container: Record<string, unknown> | Array<unknown> =
      kind === "object" ? {} : [];
    if (parent.kind === "object") {
      if (!key) return null;
      (parent.value as Record<string, unknown>)[key] = container;
      parent.pendingKey = undefined;
    } else {
      (parent.value as Array<unknown>).push(container);
    }
    const frame: ContainerFrame = { indent, kind, value: container };
    stack.push(frame);
    return frame;
  };

  for (const rawLine of lines) {
    if (!rawLine.trim() || rawLine.trim().startsWith("#")) continue;
    const indent = rawLine.match(/^ */)?.[0].length ?? 0;
    const line = rawLine.trim();
    const parent = getParent(indent);

    if (line.startsWith("- ")) {
      let arrayFrame = parent;
      if (parent.kind === "object") {
        if (!parent.pendingKey) continue;
        arrayFrame =
          attachContainer(parent, parent.pendingKey, "array", indent - 1) ?? parent;
      }
      if (arrayFrame.kind !== "array") continue;
      const itemBody = line.slice(2).trim();
      if (!itemBody) {
        attachContainer(arrayFrame, undefined, "object", indent);
        continue;
      }
      const objMatch = itemBody.match(/^([^:]+):(.*)$/);
      if (objMatch) {
        const obj = { [objMatch[1].trim()]: parseScalar(objMatch[2].trim()) };
        (arrayFrame.value as Array<unknown>).push(obj);
        stack.push({ indent, kind: "object", value: obj });
        continue;
      }
      (arrayFrame.value as Array<unknown>).push(parseScalar(itemBody));
      continue;
    }

    const match = line.match(/^([^:]+):(.*)$/);
    if (!match) continue;
    const key = match[1].trim();
    const rest = match[2].trim();
    if (parent.kind !== "object") continue;
    if (!rest) {
      parent.pendingKey = key;
      continue;
    }
    (parent.value as Record<string, unknown>)[key] = parseScalar(rest);
    parent.pendingKey = undefined;
  }

  return root;
}

function asString(value: unknown, fallback = ""): string {
  return typeof value === "string" ? value : fallback;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((item) => asString(item)).filter(Boolean);
}

function asRecordArray(value: unknown): Array<Record<string, unknown>> {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null);
}

function normalizeTemplateProps(
  template: PageTemplateKind,
  raw: Record<string, unknown>
): PageTemplateProps {
  const accent = asString(raw.accent, "orange");
  switch (template) {
    case "cover":
      return {
        title: asString(raw.title, "模板页标题"),
        subtitle: asString(raw.subtitle),
        badge: asString(raw.badge),
        accent,
      };
    case "toc":
    case "checklist":
      return {
        title: asString(raw.title, "模板页标题"),
        items: asStringArray(raw.items),
        accent,
      };
    case "comparison":
      return {
        title: asString(raw.title, "对比标题"),
        leftTitle: asString(raw.leftTitle, "左侧"),
        rightTitle: asString(raw.rightTitle, "右侧"),
        rows: asRecordArray(raw.rows).map((row) => ({
          left: asString(row.left),
          right: asString(row.right),
        })),
        accent,
      };
    case "steps":
      return {
        title: asString(raw.title, "步骤标题"),
        steps: asRecordArray(raw.steps).map((row) => ({
          title: asString(row.title),
          detail: asString(row.detail),
        })),
        accent,
      };
    case "timeline":
      return {
        title: asString(raw.title, "时间轴标题"),
        points: asRecordArray(raw.points).map((row) => ({
          time: asString(row.time),
          title: asString(row.title),
          detail: asString(row.detail),
        })),
        accent,
      };
    case "qa":
      return {
        title: asString(raw.title),
        pairs: asRecordArray(raw.pairs).map((row) => ({
          q: asString(row.q),
          a: asString(row.a),
        })),
        accent,
      };
    case "myth-fact":
      return {
        title: asString(raw.title),
        items: asRecordArray(raw.items).map((row) => ({
          myth: asString(row.myth),
          fact: asString(row.fact),
        })),
        accent,
      };
    case "quote-note":
      return {
        quote: asString(raw.quote, "引用内容"),
        note: asString(raw.note, "批注内容"),
        source: asString(raw.source),
        accent,
      };
    case "data-summary":
      return {
        title: asString(raw.title, "数据结论"),
        headline: asString(raw.headline, "核心结论"),
        stats: asRecordArray(raw.stats).map((row) => ({
          label: asString(row.label),
          value: asString(row.value),
        })),
        accent,
      };
    case "gallery":
      return {
        title: asString(raw.title),
        layout: asString(raw.layout, "2-grid"),
        images: asStringArray(raw.images),
        accent,
      };
    case "testimonial":
      return {
        title: asString(raw.title),
        items: asRecordArray(raw.items).map((row) => ({
          quote: asString(row.quote),
          author: asString(row.author),
        })),
        accent,
      };
    default:
      return raw;
  }
}

export function findPageTemplateBlocks(markdown: string): Array<{
  index: number;
  rawMarkdown: string;
  inner: string;
}> {
  const blocks: Array<{ index: number; rawMarkdown: string; inner: string }> = [];
  PAGE_BLOCK_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = PAGE_BLOCK_RE.exec(markdown)) !== null) {
    blocks.push({
      index: match.index,
      rawMarkdown: match[0],
      inner: match[1],
    });
  }
  return blocks;
}

export function parsePageTemplateBlock(rawMarkdown: string): ParsedPageTemplateBlock | null {
  const match = rawMarkdown.match(/^```xhs-page\s*\n([\s\S]*?)\n```$/);
  if (!match) return null;
  const parsed = parseYamlLike(match[1]);
  const templateValue = asString(parsed.template) as PageTemplateKind;
  if (!templateValue) return null;
  const definition = TEMPLATE_DEFINITIONS.find((item) => item.kind === templateValue);
  if (!definition) return null;
  return {
    template: templateValue,
    props: normalizeTemplateProps(templateValue, parsed),
    rawMarkdown,
  };
}

export function getPageTemplateDefinitions(): PageTemplateDefinition[] {
  return TEMPLATE_DEFINITIONS;
}

export function getPageTemplateAccent(value: unknown, fallback: string): string {
  const key = typeof value === "string" ? value : "";
  if (!key || key === "inherit") return fallback;
  if (ACCENT_MAP[key]) return ACCENT_MAP[key];
  return /^#([0-9a-f]{6})$/i.test(key) ? key : fallback;
}

export function resolveTemplateImage(src: string, assets: Record<string, string>): string {
  return expandImageUrl(src, assets);
}
