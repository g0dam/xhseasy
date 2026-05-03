/**
 * 预览区单张图片：点击选中后可改尺寸与样式，并回写到 Markdown。
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  configFromImageMarkdown,
  configToMarkdown,
  type ImageConfig,
} from "@/layout/imageLayout";
import { expandImageUrl } from "@/markdown/pbnImages";
import { ImageEditor } from "./ImageEditor";

function outerStyleForConfig(c: ImageConfig): React.CSSProperties {
  const base: React.CSSProperties = {
    position: "relative",
    width: c.layout === "full-width" ? "100%" : `${c.width}%`,
    maxWidth: "100%",
    marginTop: c.marginTop,
    marginBottom: c.marginBottom,
    boxSizing: "border-box",
    clear: "both",
  };
  if (c.layout === "block") {
    base.marginInline = "auto";
  }
  return base;
}

function shiftStyle(): React.CSSProperties {
  return {
    width: "100%",
    transform: "none",
    transformOrigin: "top center",
  };
}

export function PreviewImageBlock({
  rawMarkdown,
  imageIndex,
  assets,
  selected,
  onSelect,
  onCommit,
  onRemove,
  onDraftChange: _onDraftChange,
}: {
  rawMarkdown: string;
  imageIndex: number;
  assets: Record<string, string>;
  selected: boolean;
  onSelect: () => void;
  onCommit: (index: number, newRaw: string) => void;
  onRemove: (index: number) => void;
  onDraftChange?: (index: number, next: ImageConfig) => void;
}) {
  const [cfg, setCfg] = useState<ImageConfig | null>(() =>
    configFromImageMarkdown(rawMarkdown)
  );
  const cfgRef = useRef<ImageConfig | null>(null);
  cfgRef.current = cfg;

  useEffect(() => {
    const c = configFromImageMarkdown(rawMarkdown);
    setCfg(c);
    cfgRef.current = c;
  }, [rawMarkdown]);

  const onVisualChange = useCallback((next: ImageConfig) => {
    cfgRef.current = next;
    setCfg(next);
  }, []);

  const onPersist = useCallback(() => {
    const c = cfgRef.current;
    if (!c) return;
    onCommit(imageIndex, configToMarkdown({ ...c, offsetX: 0, offsetY: 0 }));
  }, [imageIndex, onCommit]);

  if (!cfg) return null;

  const previewSrc = expandImageUrl(cfg.src, assets);
  const rootStyle = outerStyleForConfig(cfg);
  const shiftStyleValue = shiftStyle();

  return (
    <div
      className={`xhs-preview-image-root${selected ? " xhs-preview-image-root--selected" : ""}`}
      data-layout={cfg.layout}
      style={rootStyle}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      role="presentation"
    >
      <div className="xhs-preview-image-shift" style={shiftStyleValue}>
        <ImageEditor
          config={cfg}
          visible={selected}
          onVisualChange={onVisualChange}
          onPersist={onPersist}
          onDelete={() => onRemove(imageIndex)}
        >
          <div
            className="xhs-image-figure"
            style={{
              borderRadius: cfg.borderRadius + 4,
            }}
          >
            <img
              src={previewSrc}
              alt={cfg.alt}
              draggable={false}
              style={{
                width: "100%",
                height: "auto",
                maxHeight: cfg.maxHeight,
                borderRadius: cfg.borderRadius,
                objectFit: "cover",
                display: "block",
                cursor: "pointer",
                userSelect: "none",
                willChange: selected ? "transform" : "auto",
              }}
              className="xhs-img-editable"
            />
          </div>
        </ImageEditor>
      </div>
    </div>
  );
}
