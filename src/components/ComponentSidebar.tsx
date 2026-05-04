import { useMemo } from "react";
import type { PageTemplateDefinition, PageTemplateKind } from "@/page-templates";

const CATEGORY_ORDER: PageTemplateDefinition["category"][] = ["封面", "结构", "知识卡", "图片卡"];

function TemplatePreview({ kind }: { kind: PageTemplateKind }) {
  if (kind === "cover") {
    return (
      <div className="component-thumb component-thumb--cover" data-kind={kind}>
        <span className="component-thumb__accent" />
        <span className="component-thumb__pill" />
        <span className="component-thumb__title component-thumb__title--hero" />
        <span className="component-thumb__line component-thumb__line--short" />
      </div>
    );
  }

  if (kind === "comparison") {
    return (
      <div className="component-thumb component-thumb--comparison" data-kind={kind}>
        <span className="component-thumb__accent" />
        <div className="component-thumb__columns">
          <div className="component-thumb__column">
            <span className="component-thumb__line component-thumb__line--short" />
            <span className="component-thumb__line" />
            <span className="component-thumb__line component-thumb__line--soft" />
          </div>
          <div className="component-thumb__column">
            <span className="component-thumb__line component-thumb__line--short" />
            <span className="component-thumb__line" />
            <span className="component-thumb__line component-thumb__line--soft" />
          </div>
        </div>
      </div>
    );
  }

  if (kind === "steps" || kind === "timeline") {
    return (
      <div className="component-thumb component-thumb--steps" data-kind={kind}>
        <span className="component-thumb__accent" />
        <div className="component-thumb__stack">
          {[0, 1, 2].map((index) => (
            <div key={index} className="component-thumb__step-row">
              <span className="component-thumb__dot" />
              <div className="component-thumb__row-lines">
                <span className="component-thumb__line component-thumb__line--short" />
                <span className="component-thumb__line component-thumb__line--soft" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (kind === "gallery") {
    return (
      <div className="component-thumb component-thumb--gallery" data-kind={kind}>
        <span className="component-thumb__accent" />
        <div className="component-thumb__gallery-grid">
          <span className="component-thumb__image" />
          <span className="component-thumb__image" />
          <span className="component-thumb__image component-thumb__image--wide" />
        </div>
      </div>
    );
  }

  if (kind === "qa" || kind === "myth-fact" || kind === "data-summary" || kind === "testimonial" || kind === "quote-note") {
    return (
      <div className="component-thumb component-thumb--cards" data-kind={kind}>
        <span className="component-thumb__accent" />
        <div className="component-thumb__card-grid">
          {[0, 1, 2].map((index) => (
            <div key={index} className="component-thumb__panel">
              <span className="component-thumb__line component-thumb__line--short" />
              <span className="component-thumb__line" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="component-thumb component-thumb--list" data-kind={kind}>
      <span className="component-thumb__accent" />
      <div className="component-thumb__stack">
        {[0, 1, 2, 3].map((index) => (
          <div key={index} className="component-thumb__list-row">
            <span className="component-thumb__bullet" />
            <span className={`component-thumb__line ${index % 2 === 0 ? "" : "component-thumb__line--short"}`} />
          </div>
        ))}
      </div>
    </div>
  );
}

export function ComponentSidebar({
  templates,
  onInsertSnippet,
  collapsed,
  onCollapsedChange,
}: {
  templates: PageTemplateDefinition[];
  onInsertSnippet: (snippet: string, mode: "cursor" | "append") => void;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}) {
  const orderedTemplates = useMemo(() => {
    return [...templates].sort((left, right) => {
      const categoryDiff =
        CATEGORY_ORDER.indexOf(left.category) - CATEGORY_ORDER.indexOf(right.category);
      if (categoryDiff !== 0) return categoryDiff;
      return left.label.localeCompare(right.label, "zh-Hans-CN");
    });
  }, [templates]);

  if (collapsed) {
    return (
      <aside className="component-sidebar component-sidebar--collapsed" aria-label="组件库已折叠">
        <button
          type="button"
          className="component-sidebar__rail-button"
          onClick={() => onCollapsedChange(false)}
          aria-label="展开组件区"
          title="展开组件区"
        >
          <span className="component-sidebar__rail-mark">+</span>
          <span className="component-sidebar__rail-text">组件</span>
        </button>
      </aside>
    );
  }

  return (
    <aside className="component-sidebar" aria-label="组件库">
      <div className="component-sidebar__header">
        <div className="component-sidebar__header-top">
          <span className="component-sidebar__eyebrow">Components</span>
          <button
            type="button"
            className="component-sidebar__toggle"
            onClick={() => onCollapsedChange(true)}
            aria-label="折叠组件区"
            title="折叠组件区"
          >
            ‹
          </button>
        </div>
        <h2>插入组件</h2>
        <p>从左侧挑一个结构块，直接插进文稿里。</p>
      </div>

      <div className="component-library component-library--simple">
        {orderedTemplates.map((template) => (
          <button
            key={template.kind}
            type="button"
            className="component-library-card"
            onClick={() => onInsertSnippet(template.skeleton, "cursor")}
            aria-label={`插入${template.label}`}
          >
            <TemplatePreview kind={template.kind} />
            <div className="component-library-card__content">
              <div className="component-library-card__meta">
                <span className="component-library-card__category">{template.category}</span>
                <span className="component-library-card__action">+</span>
              </div>
              <strong>{template.label}</strong>
              <p>{template.description}</p>
            </div>
          </button>
        ))}
      </div>
    </aside>
  );
}
