import { Fragment, useMemo } from "react";
import type { VisualBlock } from "@/document/types";
import { configToMarkdown } from "@/layout/imageLayout";
import { parseInlineMarkdown, parseMarkdown } from "@/markdown/renderer";
import { PreviewImageBlock } from "./PreviewImageBlock";

function TextBlock({
  markdown,
  inline,
}: {
  markdown: string;
  inline?: boolean;
}) {
  const html = useMemo(
    () => (inline ? parseInlineMarkdown(markdown) : parseMarkdown(markdown)),
    [inline, markdown]
  );
  if (inline) {
    return <span className="note-flow-inline" dangerouslySetInnerHTML={{ __html: html }} />;
  }
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export function FlowBody({
  blocks,
  embeddedAssets,
  selectedImageIndex,
  onSelectImage,
  onCommitImage,
  onRemoveImage,
}: {
  blocks: VisualBlock[];
  embeddedAssets: Record<string, string>;
  selectedImageIndex: number | null;
  onSelectImage: (index: number) => void;
  onCommitImage: (index: number, next: string) => void;
  onRemoveImage: (index: number) => void;
}) {
  return (
    <>
      {blocks.map((block) => {
        if (block.type === "text") {
          const inline = block.flow === "inline";
          const Tag = inline ? "span" : "div";
          const textNode = (
            <Tag
              key={block.id}
              className={`note-flow-block note-flow-block--text${inline ? " note-flow-block--inline-text" : ""}${block.paragraphEnd ? " note-flow-block--paragraph-end" : ""}`}
              data-flow-block-id={block.id}
              data-flow-inline={inline ? "true" : undefined}
              data-flow-paragraph-end={block.paragraphEnd ? "true" : undefined}
            >
              <TextBlock markdown={block.markdown} inline={inline} />
            </Tag>
          );

          if (inline && block.paragraphEnd) {
            return (
              <Fragment key={`${block.id}-wrap`}>
                {textNode}
                <span
                  className="note-flow-paragraph-break"
                  data-flow-paragraph-break-for={block.id}
                  aria-hidden="true"
                />
              </Fragment>
            );
          }

          return textNode;
        }

        if (block.type === "image") {
          return (
            <div
              key={block.id}
              className="note-flow-block note-flow-block--image"
              data-flow-block-id={block.id}
            >
              <PreviewImageBlock
                rawMarkdown={configToMarkdown(block.config)}
                imageIndex={block.imageIndex}
                assets={embeddedAssets}
                selected={selectedImageIndex === block.imageIndex}
                onSelect={() => onSelectImage(block.imageIndex)}
                onCommit={onCommitImage}
                onRemove={onRemoveImage}
              />
            </div>
          );
        }

        return null;
      })}
    </>
  );
}
