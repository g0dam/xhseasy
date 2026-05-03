/**
 * constants.ts — Emoji、快捷插入项、日期工具等常量
 */

export const EMOJIS = [
  "😀","😂","🥹","🤔","👍","🔥","💡","⭐",
  "✨","⚡","🎯","🚀","💪","👏","🤝","❤️",
  "🧡","💛","💚","💙","💜","🖤","🤍","❣️",
  "🎉","🎊","✅","❌","⚠️","💬","📌","📖",
  "🔍","🔑","🛠️","📱","💻","🌐","☁️","📊",
  "📝","🖊️","📷","🎨","🎬","🎵","🌟","💤",
];

export type QuickInsertItem =
  | { label: string; icon: string; prefix: string }
  | { label: string; icon: string; text: string; noWrap?: boolean }
  | { label: string; icon: string; wrap: [string, string] };

export const QUICK_INSERT_ITEMS: QuickInsertItem[] = [
  { label: "H2 标题", prefix: "## ", icon: "H2" },
  { label: "H3 标题", prefix: "### ", icon: "H3" },
  { label: "引用", prefix: "> ", icon: "❝" },
  { label: "分割线", text: "\n---\n", icon: "—", noWrap: true },
  { label: "代码块", text: "\n```\n\n```\n", icon: "</>", noWrap: true },
  { label: "有序列表", prefix: "1. ", icon: "①" },
  { label: "无序列表", prefix: "- ", icon: "•" },
  { label: "加粗", wrap: ["**", "**"], icon: "B" },
  { label: "斜体", wrap: ["*", "*"], icon: "I" },
  { label: "删除线", wrap: ["~~", "~~"], icon: "S" },
];

// ============================================================
// 日期工具
// ============================================================

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function isoDateOrToday(noteDate: string): string {
  const t = noteDate.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(t)) return t;
  return todayIso();
}
