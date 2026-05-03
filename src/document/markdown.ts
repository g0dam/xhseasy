import {
  configFromImageMarkdown,
  configToMarkdown,
} from "@/layout/imageLayout";
import { splitMarkdownSegments } from "@/markdown/mdSegments";
import { findPageTemplateBlocks, parsePageTemplateBlock } from "@/page-templates";
import type { VisualDocument, VisualBlock, VisualImageBlock } from "./types";

function makeBlockId(prefix: string, index: number) {
  return `${prefix}-${index}`;
}

function hasMeaningfulText(input: string): boolean {
  return input.trim().length > 0;
}

function splitLinesPreservingEol(input: string): string[] {
  const lines = input.match(/[^\n]*(?:\n|$)/g) ?? [];
  if (lines[lines.length - 1] === "") lines.pop();
  return lines;
}

function lineText(line: string): string {
  return line.replace(/\r?\n$/, "");
}

function isBlankLine(line: string): boolean {
  return lineText(line).trim().length === 0;
}

function isFenceStart(line: string): boolean {
  return /^```/.test(lineText(line).trim());
}

function isHeadingStart(line: string): boolean {
  return /^#{1,3}\s/.test(lineText(line).trim());
}

function isBlockquoteStart(line: string): boolean {
  return /^>\s?/.test(lineText(line).trim());
}

function isListStart(line: string): boolean {
  return /^\s*(?:[-*+]\s+|\d+[.)]\s+)/.test(lineText(line));
}

function isIndentedContinuation(line: string): boolean {
  return /^\s{2,}\S/.test(lineText(line));
}

function isHorizontalRule(line: string): boolean {
  return /^\s*[-*_]{3,}\s*$/.test(lineText(line));
}

function isStructuralStart(line: string): boolean {
  return (
    isFenceStart(line) ||
    isHeadingStart(line) ||
    isBlockquoteStart(line) ||
    isListStart(line) ||
    isHorizontalRule(line)
  );
}

function splitTextMarkdownBlocks(input: string): string[] {
  const lines = splitLinesPreservingEol(input);
  const chunks: string[] = [];
  let pendingBlankLines: string[] = [];
  let i = 0;

  while (i < lines.length) {
    if (isBlankLine(lines[i])) {
      pendingBlankLines.push(lines[i]);
      i++;
      continue;
    }

    const chunkLines = [...pendingBlankLines];
    pendingBlankLines = [];

    if (isFenceStart(lines[i])) {
      chunkLines.push(lines[i]);
      i++;
      while (i < lines.length) {
        chunkLines.push(lines[i]);
        const closesFence = isFenceStart(lines[i]);
        i++;
        if (closesFence) break;
      }
    } else if (isHeadingStart(lines[i]) || isHorizontalRule(lines[i])) {
      chunkLines.push(lines[i]);
      i++;
    } else if (isBlockquoteStart(lines[i])) {
      while (i < lines.length && isBlockquoteStart(lines[i])) {
        chunkLines.push(lines[i]);
        i++;
      }
    } else if (isListStart(lines[i])) {
      while (i < lines.length && !isBlankLine(lines[i])) {
        if (
          isStructuralStart(lines[i]) &&
          !isListStart(lines[i]) &&
          !isIndentedContinuation(lines[i])
        ) {
          break;
        }
        chunkLines.push(lines[i]);
        i++;
      }
    } else {
      while (
        i < lines.length &&
        !isBlankLine(lines[i]) &&
        !isStructuralStart(lines[i])
      ) {
        chunkLines.push(lines[i]);
        i++;
      }
    }

    const chunk = chunkLines.join("");
    if (hasMeaningfulText(chunk)) {
      chunks.push(chunk);
    } else {
      pendingBlankLines.push(...chunkLines);
    }
  }

  if (pendingBlankLines.length > 0 && chunks.length > 0) {
    chunks[chunks.length - 1] += pendingBlankLines.join("");
  }

  return chunks;
}

export function parseMarkdownToDocument(markdown: string): VisualDocument {
  const blocks: VisualBlock[] = [];
  const pageBlocks = findPageTemplateBlocks(markdown);
  let last = 0;
  let index = 0;
  let imageIndex = 0;

  const pushTextMarkdownBlocks = (input: string) => {
    splitTextMarkdownBlocks(input).forEach((chunk) => {
      blocks.push({
        id: makeBlockId("text", index++),
        type: "text",
        markdown: chunk,
      });
    });
  };

  const pushMixedMarkdown = (input: string) => {
    if (!input) return;
    const segments = splitMarkdownSegments(input);
    segments.forEach((segment) => {
      if (segment.type === "md") {
        pushTextMarkdownBlocks(segment.text);
        return;
      }

      const config = configFromImageMarkdown(segment.raw);
      if (!config) {
        pushTextMarkdownBlocks(segment.raw);
        return;
      }

      blocks.push({
        id: makeBlockId("image", index++),
        type: "image",
        imageIndex: imageIndex++,
        config,
      });
    });
  };

  pageBlocks.forEach((pageBlock) => {
    if (pageBlock.index > last) {
      pushMixedMarkdown(markdown.slice(last, pageBlock.index));
    }
    const parsed = parsePageTemplateBlock(pageBlock.rawMarkdown);
    if (!parsed) {
      pushMixedMarkdown(pageBlock.rawMarkdown);
    } else {
      blocks.push({
        id: makeBlockId("page", index++),
        type: "page",
        template: parsed.template,
        props: parsed.props,
        rawMarkdown: parsed.rawMarkdown,
      });
    }
    last = pageBlock.index + pageBlock.rawMarkdown.length;
  });

  if (last < markdown.length) {
    pushMixedMarkdown(markdown.slice(last));
  }

  return { blocks };
}

export function serializeDocumentToMarkdown(document: VisualDocument): string {
  return document.blocks
    .map((block) => {
      if (block.type === "text") {
        return block.markdown;
      }
      if (block.type === "page") {
        return block.rawMarkdown;
      }
      return configToMarkdown(block.config);
    })
    .join("");
}

export function updateImageBlockInDocument(
  document: VisualDocument,
  imageIndex: number,
  updater: (block: VisualImageBlock) => VisualImageBlock
): VisualDocument {
  return {
    blocks: document.blocks.map((block) => {
      if (block.type !== "image" || block.imageIndex !== imageIndex) {
        return block;
      }
      return updater(block);
    }),
  };
}

export function removeImageBlockFromDocument(
  document: VisualDocument,
  imageIndex: number
): VisualDocument {
  return {
    blocks: document.blocks.filter(
      (block) => block.type !== "image" || block.imageIndex !== imageIndex
    ),
  };
}
