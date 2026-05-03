import type { EditorSettings } from "@/types";
import type { VisualPageBlock } from "@/document/types";
import { deriveAccentPalette } from "@/theme";
import {
  getPageTemplateAccent,
  resolveTemplateImage,
} from "@/page-templates";

type InlineStyleSpec = {
  size?: "sm" | "md" | "lg" | `${number}`;
  color?: string;
  bold?: boolean;
  italic?: boolean;
  highlight?: "soft";
};

type InlineRun = {
  text: string;
  style: InlineStyleSpec;
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value)
    ? value.map((item) => (typeof item === "string" ? item : "")).filter(Boolean)
    : [];
}

function asRecordArray(value: unknown): Array<Record<string, unknown>> {
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => typeof item === "object" && item !== null)
    : [];
}

function parseXhsStyle(styleText: string): InlineStyleSpec {
  const spec: InlineStyleSpec = {};
  styleText
    .split(";")
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((item) => {
      const [rawKey, rawValue] = item.split(":").map((part) => part.trim());
      if (!rawKey || !rawValue) return;
      if (rawKey === "size" && (rawValue === "sm" || rawValue === "md" || rawValue === "lg" || /^\d+$/.test(rawValue))) {
        spec.size = rawValue as InlineStyleSpec["size"];
      }
      if (rawKey === "color") {
        spec.color = rawValue;
      }
      if (rawKey === "highlight" && rawValue === "soft") {
        spec.highlight = "soft";
      }
    });
  return spec;
}

function tokenizeRichRuns(text: string, inherited: InlineStyleSpec = {}): InlineRun[] {
  const runs: InlineRun[] = [];
  const pattern = /<xhs\s+style="([^"]+)">([\s\S]+?)<\/xhs>|\*\*([\s\S]+?)\*\*|\*([\s\S]+?)\*/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      runs.push({ text: text.slice(lastIndex, match.index), style: inherited });
    }
    if (match[1] && match[2]) {
      runs.push(...tokenizeRichRuns(match[2], { ...inherited, ...parseXhsStyle(match[1]) }));
    } else if (match[3]) {
      runs.push(...tokenizeRichRuns(match[3], { ...inherited, bold: true }));
    } else if (match[4]) {
      runs.push(...tokenizeRichRuns(match[4], { ...inherited, italic: true }));
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    runs.push({ text: text.slice(lastIndex), style: inherited });
  }

  return runs.filter((run) => run.text.length > 0);
}

function resolveInlineColor(color: string | undefined, accent: string, settings: EditorSettings): string | undefined {
  const accentToken = (hex: string) =>
    deriveAccentPalette(hex, settings.cardText, settings.cardBg).ink;
  switch (color) {
    case "accent":
      return deriveAccentPalette(accent, settings.cardText, settings.cardBg).ink;
    case "red":
      return accentToken("#d45151");
    case "green":
      return accentToken("#2f9a57");
    case "blue":
      return accentToken("#3f71d8");
    default:
      return color && /^#([0-9a-f]{6})$/i.test(color) ? color : undefined;
  }
}

function resolveInlineSize(
  size: InlineStyleSpec["size"],
  variant: "hero" | "title" | "subtitle" | "body" | "meta" | "value" | "quote",
  settings: EditorSettings
): number | undefined {
  if (!size || size === "md") return undefined;
  const titleScale = settings.templateTitleScale ?? 1;
  const bodyScale = settings.templateBodyScale ?? 1;
  const baseMap = {
    hero: 40 * titleScale,
    title: 28 * titleScale,
    subtitle: 14 * bodyScale,
    body: 15 * bodyScale,
    meta: 12 * bodyScale,
    value: 24 * titleScale,
    quote: 30 * titleScale,
  };
  const baseSize = baseMap[variant];
  if (/^\d+$/.test(size)) return Number(size);
  if (size === "sm") return Math.round(baseSize * 0.88);
  if (size === "lg") return Math.round(baseSize * 1.14);
  return undefined;
}

function RichText({
  as: Tag = "span",
  text,
  settings,
  accent,
  fallbackColor,
  variant = "body",
  className,
  style,
}: {
  as?: "span" | "p" | "div" | "h1" | "h2" | "h3" | "blockquote" | "strong";
  text: string;
  settings: EditorSettings;
  accent: string;
  fallbackColor: string;
  variant?: "hero" | "title" | "subtitle" | "body" | "meta" | "value" | "quote";
  className?: string;
  style?: React.CSSProperties;
}) {
  const runs = tokenizeRichRuns(text);
  return (
    <Tag className={className} style={style}>
      {runs.map((run, idx) => {
        const inlineStyle: React.CSSProperties = {};
        const inlineColor = resolveInlineColor(run.style.color, accent, settings);
        const inlineSize = resolveInlineSize(run.style.size, variant, settings);
        if (run.style.bold) inlineStyle.fontWeight = 700;
        if (run.style.italic) inlineStyle.fontStyle = "italic";
        if (run.style.highlight) {
          inlineStyle.background = "rgba(243, 216, 150, 0.42)";
          inlineStyle.borderRadius = "0.38em";
          inlineStyle.padding = "0 0.18em";
        }
        inlineStyle.color = inlineColor ?? fallbackColor;
        if (inlineSize) inlineStyle.fontSize = `${inlineSize}px`;
        return (
          <span key={`${run.text}-${idx}`} style={inlineStyle}>
            {run.text}
          </span>
        );
      })}
    </Tag>
  );
}

function PageShell({
  children,
  accent,
  settings,
  tone = "info",
}: {
  children: React.ReactNode;
  accent: string;
  settings: EditorSettings;
  tone?: "cover" | "info" | "result";
}) {
  const accentPalette = deriveAccentPalette(accent, settings.cardText, settings.cardBg);
  const shellStyle = {
    "--template-local-accent": accent,
    "--template-local-accent-ink": accentPalette.ink,
    "--template-local-accent-solid": accentPalette.solid,
    "--template-local-accent-soft": accentPalette.soft,
    "--template-local-accent-line": accentPalette.line,
    "--template-local-accent-border": accentPalette.border,
  } as React.CSSProperties;
  return (
    <div className={`xhs-page-template xhs-page-template--${tone}`} style={shellStyle}>
      <div className="xhs-page-template__top" />
      {children}
    </div>
  );
}

export function PageTemplateRenderer({
  block,
  settings,
  embeddedAssets,
}: {
  block: VisualPageBlock;
  settings: EditorSettings;
  embeddedAssets: Record<string, string>;
}) {
  const accent = getPageTemplateAccent(block.props.accent, settings.accent);
  const muted = settings.cardMuted;
  const text = settings.cardText;

  switch (block.template) {
    case "cover":
      return (
        <PageShell accent={accent} settings={settings} tone="cover">
          <div className="xhs-page-template__cover">
            {asString(block.props.badge) ? (
              <RichText
                as="span"
                className="xhs-page-template__badge"
                text={asString(block.props.badge)}
                settings={settings}
                accent={accent}
                fallbackColor={"var(--template-local-accent-ink)"}
                variant="meta"
                style={{ color: "var(--template-local-accent-ink)", borderColor: "var(--template-local-accent-border)" }}
              />
            ) : null}
            <RichText as="h1" text={asString(block.props.title)} settings={settings} accent={accent} fallbackColor={text} variant="hero" style={{ color: text }} />
            {asString(block.props.subtitle) ? (
              <RichText as="p" text={asString(block.props.subtitle)} settings={settings} accent={accent} fallbackColor={muted} variant="subtitle" style={{ color: muted }} />
            ) : null}
          </div>
        </PageShell>
      );
    case "toc":
    case "checklist": {
      const items = asStringArray(block.props.items);
      return (
        <PageShell accent={accent} settings={settings} tone="info">
          <div className={`xhs-page-template__section ${block.template === "toc" ? "xhs-page-template__section--toc" : ""}`}>
            <div className="xhs-page-template__heading">
              <RichText as="h2" text={asString(block.props.title)} settings={settings} accent={accent} fallbackColor={text} variant="title" style={{ color: text }} />
            </div>
            <div className={`xhs-page-template__list${block.template === "toc" ? " xhs-page-template__list--toc" : ""}`}>
              {items.map((item, idx) => (
                <div key={`${block.id}-item-${idx}`} className="xhs-page-template__list-item">
                  <span className="xhs-page-template__list-mark" style={{ background: "var(--template-local-accent-solid)", color: "var(--template-local-accent-ink)", border: "1px solid var(--template-local-accent-line)" }}>
                    {block.template === "toc" ? String(idx + 1).padStart(2, "0") : "✓"}
                  </span>
                  <RichText as="span" text={item} settings={settings} accent={accent} fallbackColor={text} variant="body" style={{ color: text }} />
                </div>
              ))}
            </div>
          </div>
        </PageShell>
      );
    }
    case "comparison": {
      const rows = asRecordArray(block.props.rows);
      return (
        <PageShell accent={accent} settings={settings} tone="info">
          <div className="xhs-page-template__section">
            <div className="xhs-page-template__heading">
              <RichText as="h2" text={asString(block.props.title)} settings={settings} accent={accent} fallbackColor={text} variant="title" style={{ color: text }} />
            </div>
            <div className="xhs-page-template__comparison-head">
              <RichText as="div" text={asString(block.props.leftTitle)} settings={settings} accent={accent} fallbackColor={muted} variant="meta" />
              <RichText as="div" text={asString(block.props.rightTitle)} settings={settings} accent={accent} fallbackColor={muted} variant="meta" />
            </div>
            <div className="xhs-page-template__comparison-grid">
              {rows.map((row, idx) => (
                <div key={`${block.id}-row-${idx}`} className="xhs-page-template__comparison-row">
                  <RichText as="div" text={asString(row.left)} settings={settings} accent={accent} fallbackColor={text} variant="body" style={{ color: text }} />
                  <RichText as="div" text={asString(row.right)} settings={settings} accent={accent} fallbackColor={text} variant="body" style={{ color: text }} />
                </div>
              ))}
            </div>
          </div>
        </PageShell>
      );
    }
    case "steps": {
      const steps = asRecordArray(block.props.steps);
      return (
        <PageShell accent={accent} settings={settings} tone="info">
          <div className="xhs-page-template__section">
            <div className="xhs-page-template__heading">
              <RichText as="h2" text={asString(block.props.title)} settings={settings} accent={accent} fallbackColor={text} variant="title" style={{ color: text }} />
            </div>
            <div className="xhs-page-template__steps">
              {steps.map((step, idx) => (
                <div key={`${block.id}-step-${idx}`} className="xhs-page-template__step">
                  <div className="xhs-page-template__step-index" style={{ background: "var(--template-local-accent-solid)", color: "var(--template-local-accent-ink)", border: "1px solid var(--template-local-accent-line)" }}>{idx + 1}</div>
                  <div>
                    <RichText as="h3" text={asString(step.title)} settings={settings} accent={accent} fallbackColor={text} variant="body" style={{ color: text }} />
                    <RichText as="p" text={asString(step.detail)} settings={settings} accent={accent} fallbackColor={muted} variant="body" style={{ color: muted }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageShell>
      );
    }
    case "timeline": {
      const points = asRecordArray(block.props.points);
      return (
        <PageShell accent={accent} settings={settings} tone="info">
          <div className="xhs-page-template__section">
            <div className="xhs-page-template__heading">
              <RichText as="h2" text={asString(block.props.title)} settings={settings} accent={accent} fallbackColor={text} variant="title" style={{ color: text }} />
            </div>
            <div className="xhs-page-template__timeline">
              {points.map((point, idx) => (
                <div key={`${block.id}-point-${idx}`} className="xhs-page-template__timeline-item">
                  <RichText as="div" className="xhs-page-template__timeline-time" text={asString(point.time)} settings={settings} accent={accent} fallbackColor={"var(--template-local-accent-ink)"} variant="meta" style={{ color: "var(--template-local-accent-ink)" }} />
                  <div className="xhs-page-template__timeline-dot" style={{ background: "var(--template-local-accent-solid)", border: "2px solid var(--template-local-accent-line)" }} />
                  <div>
                    <RichText as="h3" text={asString(point.title)} settings={settings} accent={accent} fallbackColor={text} variant="body" style={{ color: text }} />
                    <RichText as="p" text={asString(point.detail)} settings={settings} accent={accent} fallbackColor={muted} variant="body" style={{ color: muted }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageShell>
      );
    }
    case "qa": {
      const pairs = asRecordArray(block.props.pairs);
      return (
        <PageShell accent={accent} settings={settings} tone="info">
          <div className="xhs-page-template__section">
            {asString(block.props.title) ? (
              <div className="xhs-page-template__heading">
                <RichText as="h2" text={asString(block.props.title)} settings={settings} accent={accent} fallbackColor={text} variant="title" style={{ color: text }} />
              </div>
            ) : null}
            <div className="xhs-page-template__cards">
              {pairs.map((pair, idx) => (
                <div key={`${block.id}-qa-${idx}`} className="xhs-page-template__qa-card">
                  <RichText as="strong" text={`Q. ${asString(pair.q)}`} settings={settings} accent={accent} fallbackColor={text} variant="body" style={{ color: text }} />
                  <RichText as="p" text={`A. ${asString(pair.a)}`} settings={settings} accent={accent} fallbackColor={muted} variant="body" style={{ color: muted }} />
                </div>
              ))}
            </div>
          </div>
        </PageShell>
      );
    }
    case "myth-fact": {
      const items = asRecordArray(block.props.items);
      return (
        <PageShell accent={accent} settings={settings} tone="info">
          <div className="xhs-page-template__section">
            {asString(block.props.title) ? (
              <div className="xhs-page-template__heading">
                <RichText as="h2" text={asString(block.props.title)} settings={settings} accent={accent} fallbackColor={text} variant="title" style={{ color: text }} />
              </div>
            ) : null}
            <div className="xhs-page-template__cards">
              {items.map((item, idx) => (
                <div key={`${block.id}-mf-${idx}`} className="xhs-page-template__myth-fact">
                  <div>
                    <span className="xhs-page-template__mini-badge xhs-page-template__mini-badge--danger">误区</span>
                    <RichText as="p" text={asString(item.myth)} settings={settings} accent={accent} fallbackColor={text} variant="body" style={{ color: text }} />
                  </div>
                  <div>
                    <span className="xhs-page-template__mini-badge xhs-page-template__mini-badge--accent">真相</span>
                    <RichText as="p" text={asString(item.fact)} settings={settings} accent={accent} fallbackColor={text} variant="body" style={{ color: text }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </PageShell>
      );
    }
    case "quote-note":
      return (
        <PageShell accent={accent} settings={settings} tone="result">
          <div className="xhs-page-template__quote">
            <RichText as="blockquote" text={asString(block.props.quote)} settings={settings} accent={accent} fallbackColor={text} variant="quote" style={{ color: text }} />
            <div className="xhs-page-template__quote-note" style={{ borderColor: "var(--template-local-accent-border)" }}>
              <RichText as="p" text={asString(block.props.note)} settings={settings} accent={accent} fallbackColor={muted} variant="body" style={{ color: muted }} />
              {asString(block.props.source) ? (
                <RichText as="span" text={asString(block.props.source)} settings={settings} accent={accent} fallbackColor={"var(--template-local-accent-ink)"} variant="meta" style={{ color: "var(--template-local-accent-ink)" }} />
              ) : null}
            </div>
          </div>
        </PageShell>
      );
    case "data-summary": {
      const stats = asRecordArray(block.props.stats);
      return (
        <PageShell accent={accent} settings={settings} tone="result">
          <div className="xhs-page-template__section">
            <div className="xhs-page-template__heading">
              <RichText as="h2" text={asString(block.props.title)} settings={settings} accent={accent} fallbackColor={text} variant="title" style={{ color: text }} />
            </div>
            <RichText as="div" className="xhs-page-template__headline" text={asString(block.props.headline)} settings={settings} accent={accent} fallbackColor={text} variant="hero" style={{ color: text }} />
            <div className="xhs-page-template__stats">
              {stats.map((stat, idx) => (
                <div key={`${block.id}-stat-${idx}`} className="xhs-page-template__stat-card">
                  <RichText as="span" text={asString(stat.label)} settings={settings} accent={accent} fallbackColor={muted} variant="meta" style={{ color: muted }} />
                  <RichText as="strong" text={asString(stat.value)} settings={settings} accent={accent} fallbackColor={"var(--template-local-accent-ink)"} variant="value" style={{ color: "var(--template-local-accent-ink)" }} />
                </div>
              ))}
            </div>
          </div>
        </PageShell>
      );
    }
    case "gallery": {
      const images = asStringArray(block.props.images).slice(0, 3);
      const layout = asString(block.props.layout) || "2-grid";
      return (
        <PageShell accent={accent} settings={settings} tone="result">
          <div className="xhs-page-template__section">
            {asString(block.props.title) ? (
              <RichText as="h2" text={asString(block.props.title)} settings={settings} accent={accent} fallbackColor={text} variant="title" style={{ color: text }} />
            ) : null}
            <div className={`xhs-page-template__gallery xhs-page-template__gallery--${layout}`}>
              {images.map((src, idx) => (
                <img
                  key={`${block.id}-gallery-${idx}`}
                  src={resolveTemplateImage(src, embeddedAssets)}
                  alt=""
                  className="xhs-page-template__gallery-img"
                />
              ))}
            </div>
          </div>
        </PageShell>
      );
    }
    case "testimonial": {
      const items = asRecordArray(block.props.items);
      return (
        <PageShell accent={accent} settings={settings} tone="result">
          <div className="xhs-page-template__section">
            {asString(block.props.title) ? (
              <RichText as="h2" text={asString(block.props.title)} settings={settings} accent={accent} fallbackColor={text} variant="title" style={{ color: text }} />
            ) : null}
            <div className="xhs-page-template__cards">
              {items.map((item, idx) => (
                <div key={`${block.id}-t-${idx}`} className="xhs-page-template__testimonial">
                  <RichText as="p" text={`“${asString(item.quote)}”`} settings={settings} accent={accent} fallbackColor={text} variant="body" style={{ color: text }} />
                  <RichText as="span" text={asString(item.author)} settings={settings} accent={accent} fallbackColor={"var(--template-local-accent-ink)"} variant="meta" style={{ color: "var(--template-local-accent-ink)" }} />
                </div>
              ))}
            </div>
          </div>
        </PageShell>
      );
    }
    default:
      return null;
  }
}
