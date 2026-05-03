import { useMemo } from "react";
import type { VisualBlock } from "@/document/types";
import { configToMarkdown } from "@/layout/imageLayout";
import { parseMarkdown } from "@/markdown/renderer";
import { PreviewImageBlock } from "./PreviewImageBlock";

function TextBlock({ markdown }: { markdown: string }) {
  const html = useMemo(() => parseMarkdown(markdown), [markdown]);
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
          return (
            <div
              key={block.id}
              className="note-flow-block note-flow-block--text"
              data-flow-block-id={block.id}
            >
              <TextBlock markdown={block.markdown} />
            </div>
          );
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
