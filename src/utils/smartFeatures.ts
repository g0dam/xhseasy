/**
 * smartFeatures.ts — 智能功能增强
 *
 * 功能：
 * 1. 阅读时间预估
 * 2. 字数统计
 * 3. 内容密度分析
 * 4. 分片数量预测
 * 5. 编辑历史记录
 * 6. 自动建议（精简、优化）
 * 7. 健康度评分
 */

import type { ThemeConfig } from "@/types";

// ============================================================
// 类型定义
// ============================================================

export interface ContentStats {
  /** 字符数（不含空格） */
  charCount: number;
  /** 字数（含中文） */
  wordCount: number;
  /** 总行数 */
  lineCount: number;
  /** 段落数 */
  paragraphCount: number;
  /** 图片数 */
  imageCount: number;
  /** 代码块数 */
  codeBlockCount: number;
  /** 引用块数 */
  blockquoteCount: number;
  /** 预估阅读时间（秒） */
  readTimeSeconds: number;
  /** 预估阅读时间（分钟） */
  readTimeMinutes: number;
}

export interface ContentHealth {
  /** 总体评分 0-100 */
  score: number;
  /** 等级：优秀/良好/一般/需优化 */
  grade: "excellent" | "good" | "fair" | "needs-work";
  /** 问题列表 */
  issues: ContentIssue[];
  /** 建议列表 */
  suggestions: ContentSuggestion[];
  /** 每项指标评分 */
  metrics: {
    length: number;      // 内容长度
    density: number;     // 内容密度
    structure: number;   // 结构清晰度
    readability: number;  // 可读性
    visual: number;      // 视觉丰富度
  };
}

export interface ContentIssue {
  type: "warning" | "error" | "info";
  code: string;
  message: string;
  position?: string;
}

export interface ContentSuggestion {
  type: "add" | "remove" | "optimize";
  priority: "high" | "medium" | "low";
  message: string;
  action?: string;
}

export interface EditHistoryEntry {
  timestamp: number;
  content: string;
  action: "edit" | "paste" | "insert-image" | "load-file" | "template-apply";
  preview: string;  // 内容预览（前50字）
}

// ============================================================
// 内容统计
// ============================================================

/**
 * 统计 Markdown 内容
 */
export function analyzeContent(markdown: string): ContentStats {
  const lines = markdown.split("\n");

  // 字符数（不含空格和 Markdown 语法）
  const plainText = markdown
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, "[图片]")  // 图片
    .replace(/```[\s\S]*?```/g, "[代码块]")         // 代码块
    .replace(/#{1,6}\s/g, "")                        // 标题标记
    .replace(/[*_`~]/g, "")                          // 格式标记
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")        // 链接
    .replace(/[>\-+*]\s/g, "")                       // 列表标记
    .replace(/\s+/g, "");                           // 空白

  // 统计
  const charCount = plainText.length;

  // 字数计算（中英文分开统计）
  const chineseChars = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (plainText.replace(/[\u4e00-\u9fa5]/g, " ").match(/\S+/g) || []).length;
  const wordCount = chineseChars + englishWords;

  // 行数（忽略空行）
  const nonEmptyLines = lines.filter(line => line.trim().length > 0);
  const lineCount = nonEmptyLines.length;

  // 段落数（双换行分割）
  const paragraphs = markdown.split(/\n\n+/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length;

  // 图片数
  const imageMatches = markdown.match(/!\[([^\]]*)\]\(([^)]+)\)/g) || [];
  const imageCount = imageMatches.length;

  // 代码块数
  const codeBlockMatches = markdown.match(/```[\s\S]*?```/g) || [];
  const codeBlockCount = codeBlockMatches.length;

  // 引用块数
  const blockquoteMatches = markdown.match(/^>\s.+/gm) || [];
  const blockquoteCount = blockquoteMatches.length;

  // 预估阅读时间（中文约 400字/分钟，英文约 200词/分钟）
  const baseSpeed = 300; // 字/分钟
  const readTimeMinutes = Math.ceil(wordCount / baseSpeed);
  const readTimeSeconds = readTimeMinutes * 60;

  return {
    charCount,
    wordCount,
    lineCount,
    paragraphCount,
    imageCount,
    codeBlockCount,
    blockquoteCount,
    readTimeSeconds,
    readTimeMinutes,
  };
}

// ============================================================
// 内容健康度评估
// ============================================================

export interface HealthCheckOptions {
  targetReadTime?: number;  // 目标阅读时间（分钟）
  maxSlices?: number;       // 最大分片数
  cardWidth?: number;       // 卡片宽度
  aspectRatio?: number;      // 宽高比
}

export function evaluateContentHealth(
  markdown: string,
  theme: ThemeConfig,
  options: HealthCheckOptions = {}
): ContentHealth {
  const stats = analyzeContent(markdown);
  const {
    targetReadTime: _targetReadTime = 2,
    maxSlices: _maxSlices = 4,
    cardWidth: _cardWidth = 405,
    aspectRatio: _aspectRatio = 4 / 3,
  } = options;

  const issues: ContentIssue[] = [];
  const suggestions: ContentSuggestion[] = [];
  const metrics = {
    length: 0,
    density: 0,
    structure: 0,
    readability: 0,
    visual: 0,
  };

  // 1. 长度评估
  if (stats.wordCount < 50) {
    issues.push({
      type: "warning",
      code: "TOO_SHORT",
      message: "内容过短，建议至少 100 字",
      position: "全文",
    });
    metrics.length = 30;
  } else if (stats.wordCount < 200) {
    metrics.length = 60;
    suggestions.push({
      type: "add",
      priority: "medium",
      message: "内容偏短，可适当补充细节",
    });
  } else if (stats.wordCount > 2000) {
    issues.push({
      type: "info",
      code: "TOO_LONG",
      message: "内容较长，建议拆分为多篇",
      position: "全文",
    });
    metrics.length = 70;
  } else {
    metrics.length = 100;
  }

  // 2. 结构评估
  const hasHeading = /^#{1,3}\s/.test(markdown);
  const hasList = /^[-*]\s|^\\d+\\.\s/.test(markdown);
  const hasQuote = /^>\s/.test(markdown);

  let structureScore = 50;
  if (hasHeading) structureScore += 20;
  if (hasList) structureScore += 15;
  if (hasQuote) structureScore += 15;
  metrics.structure = Math.min(100, structureScore);

  if (!hasHeading && stats.wordCount > 300) {
    suggestions.push({
      type: "add",
      priority: "high",
      message: "建议添加小标题提升结构清晰度",
      action: "使用 ## 标题语法",
    });
  }

  if (!hasList && stats.paragraphCount > 3) {
    suggestions.push({
      type: "optimize",
      priority: "low",
      message: "可考虑使用列表增强条理性",
    });
  }

  // 3. 视觉丰富度评估
  let visualScore = 50;
  if (stats.imageCount > 0) visualScore += Math.min(20, stats.imageCount * 8);
  if (stats.codeBlockCount > 0) visualScore += 10;
  if (stats.blockquoteCount > 0) visualScore += 10;
  metrics.visual = Math.min(100, visualScore);

  if (stats.imageCount === 0 && stats.wordCount > 500) {
    suggestions.push({
      type: "add",
      priority: "high",
      message: "长文建议添加图片增强可读性",
    });
  }

  if (stats.imageCount > 5) {
    suggestions.push({
      type: "optimize",
      priority: "medium",
      message: "图片较多，建议精简到 3-5 张",
    });
  }

  // 4. 可读性评估（基于行高和字数）
  let readabilityScore = 80;
  if (theme.lineHeight < 1.6) {
    readabilityScore -= 10;
    suggestions.push({
      type: "optimize",
      priority: "low",
      message: "行高较小，可适当增加以提升阅读体验",
    });
  }
  if (theme.fontSize < 15) {
    readabilityScore -= 10;
  }
  metrics.readability = readabilityScore;

  // 5. 内容密度评估
  const density = stats.wordCount / Math.max(1, stats.paragraphCount);
  let densityScore = 50;
  if (density > 50) densityScore += 30;
  else if (density > 30) densityScore += 20;
  else if (density < 15) densityScore -= 20;
  metrics.density = Math.max(0, Math.min(100, densityScore));

  // 计算总分
  const score = Math.round(
    metrics.length * 0.2 +
    metrics.density * 0.2 +
    metrics.structure * 0.25 +
    metrics.readability * 0.15 +
    metrics.visual * 0.2
  );

  // 判定等级
  let grade: ContentHealth["grade"];
  if (score >= 85) grade = "excellent";
  else if (score >= 70) grade = "good";
  else if (score >= 50) grade = "fair";
  else grade = "needs-work";

  return { score, grade, issues, suggestions, metrics };
}

// ============================================================
// 编辑历史记录
// ============================================================

const HISTORY_KEY = "xhs_paiban_edit_history";
const MAX_HISTORY = 50;

export function getEditHistory(): EditHistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function addToHistory(
  content: string,
  action: EditHistoryEntry["action"]
): void {
  const history = getEditHistory();

  // 避免重复（相邻且内容相同）
  const last = history[0];
  if (last && last.content === content && last.action === action) {
    return;
  }

  const entry: EditHistoryEntry = {
    timestamp: Date.now(),
    content,
    action,
    preview: content.slice(0, 50) + (content.length > 50 ? "..." : ""),
  };

  history.unshift(entry);

  // 限制长度
  if (history.length > MAX_HISTORY) {
    history.pop();
  }

  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearHistory(): void {
  localStorage.removeItem(HISTORY_KEY);
}

export function getHistoryEntry(index: number): EditHistoryEntry | null {
  const history = getEditHistory();
  return history[index] || null;
}

export function restoreFromHistory(index: number): string | null {
  const entry = getHistoryEntry(index);
  return entry ? entry.content : null;
}

// ============================================================
// 自动建议
// ============================================================

export interface AutoSuggestion {
  type: "optimize-reading" | "add-image" | "add-heading" | "balance-slices";
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  originalValue?: string;
  suggestedValue?: string;
}

/**
 * 生成自动建议
 */
export function generateAutoSuggestions(
  markdown: string,
  theme: ThemeConfig,
  sliceCount: number,
  options: { targetSlices?: number } = {}
): AutoSuggestion[] {
  const suggestions: AutoSuggestion[] = [];
  const { targetSlices = 3 } = options;

  // 切片数量建议
  if (sliceCount > targetSlices + 1) {
    suggestions.push({
      type: "balance-slices",
      priority: "high",
      title: "分片过多",
      description: `当前 ${sliceCount} 张，建议控制在 ${targetSlices} 张以内。可通过减小行高或精简内容来减少分片。`,
    });

    // 具体建议
    if (theme.lineHeight < 1.8) {
      suggestions.push({
        type: "balance-slices",
        priority: "medium",
        title: "建议调小行高",
        description: `当前行高 ${theme.lineHeight}，可尝试 ${Math.max(1.5, theme.lineHeight - 0.1)} 来减少分片。`,
        originalValue: String(theme.lineHeight),
        suggestedValue: String(Math.max(1.5, theme.lineHeight - 0.1)),
      });
    }
  }

  // 图片建议
  const stats = analyzeContent(markdown);
  if (stats.imageCount === 0 && stats.wordCount > 300) {
    suggestions.push({
      type: "add-image",
      priority: "high",
      title: "建议添加图片",
      description: "长文建议配合图片增强可读性和分享欲。使用插图按钮添加图片。",
    });
  }

  // 标题建议
  const hasHeading = /^#{1,3}\s/.test(markdown);
  if (!hasHeading && stats.wordCount > 200) {
    suggestions.push({
      type: "add-heading",
      priority: "medium",
      title: "建议添加标题",
      description: "添加小标题可以提升内容结构感，让读者更容易理解。",
    });
  }

  // 阅读体验建议
  if (stats.readTimeMinutes > 3) {
    suggestions.push({
      type: "optimize-reading",
      priority: "low",
      title: "阅读时间较长",
      description: `预估阅读时间 ${stats.readTimeMinutes} 分钟。可以考虑精简内容或分段发布。`,
    });
  }

  return suggestions.sort((a, b) => {
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });
}

// ============================================================
// 智能格式化
// ============================================================

/**
 * 智能添加空行（改善可读性）
 */
export function smartFormatMarkdown(markdown: string): string {
  let formatted = markdown;

  // 在标题后添加空行
  formatted = formatted.replace(/^(#{1,3}\s[^\n]+)\n([^\n])/gm, "$1\n\n$2");

  // 在列表项之间保持空行
  formatted = formatted.replace(/^(\s*[-*]\s[^\n]+)\n\n(\s*[-*]\s)/gm, "$1\n$2");

  // 清理多余的连续空行
  formatted = formatted.replace(/\n{3,}/g, "\n\n");

  return formatted;
}

/**
 * 估算卡片渲染高度（结合图片）
 */
export function estimateCardRenderHeight(
  markdown: string,
  theme: ThemeConfig,
  cardWidth: number
): number {
  const stats = analyzeContent(markdown);
  const avgLineHeight = theme.fontSize * theme.lineHeight;
  const lines = Math.ceil(stats.wordCount / (cardWidth / (theme.fontSize * 0.56)));

  // 基础高度
  let height = lines * avgLineHeight;

  // 加上段落间距
  height += stats.paragraphCount * theme.pMarginBottom * theme.fontSize;

  // 加上图片高度（估算每张 200px）
  height += stats.imageCount * 200;

  // 加上标题高度
  const headings = (markdown.match(/^#{1,3}\s/gm) || []).length;
  height += headings * theme.fontSize * 1.5;

  // 加上顶栏和 padding
  height += 68 + theme.topLineHeight + theme.blockPadBottom;

  return Math.round(height);
}

/**
 * 预测分片数量
 */
export function predictSliceCount(
  markdown: string,
  theme: ThemeConfig,
  cardWidth: number,
  aspectRatio: number = 4 / 3
): number {
  const totalHeight = estimateCardRenderHeight(markdown, theme, cardWidth);
  const sliceHeight = cardWidth * aspectRatio;
  return Math.ceil(totalHeight / sliceHeight);
}