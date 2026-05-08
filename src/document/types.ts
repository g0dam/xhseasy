import type { ImageConfig } from "@/layout/imageLayout";
import type { PageTemplateKind, PageTemplateProps } from "@/page-templates";

export type VisualTextBlock = {
  id: string;
  type: "text";
  markdown: string;
  flow?: "block" | "inline";
  paragraphEnd?: boolean;
};

export type VisualImageBlock = {
  id: string;
  type: "image";
  imageIndex: number;
  config: ImageConfig;
};

export type VisualPageBlock = {
  id: string;
  type: "page";
  template: PageTemplateKind;
  props: PageTemplateProps;
  rawMarkdown: string;
};

export type VisualBlock = VisualTextBlock | VisualImageBlock | VisualPageBlock;

export type VisualDocument = {
  blocks: VisualBlock[];
};
