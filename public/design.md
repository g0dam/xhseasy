# Design Guide For Agents

小红书排版工具 is optimized for vertical Xiaohongshu image cards.

## Output Constraints

- Main export ratios: `3:4` and `3:5`.
- Default card width in source: `405px`.
- Content should remain readable on mobile.
- Avoid long paragraphs and dense walls of text.
- Use one main idea per card.

## Typography And Tone

Good Xiaohongshu note writing:

- Strong title.
- Short opening conclusion.
- Scannable sections.
- Useful lists.
- Concrete examples.
- Light emphasis with `<xhs>` on key phrases.

Avoid:

- Long essay paragraphs.
- Too many heading levels.
- Overusing bold, highlights, and emoji.
- Huge tables; convert them to `comparison`, `checklist`, or `data-summary`.

## Visual Component Style

The site has custom page components rendered as card-like sections:

- `cover`: large title page.
- `toc`: numbered roadmap.
- `checklist`: save-worthy action list.
- `comparison`: two-column contrast.
- `steps`: numbered process.
- `timeline`: process over time.
- `qa`: question-answer cards.
- `myth-fact`: misconception correction.
- `quote-note`: quote plus commentary.
- `data-summary`: headline plus stats.
- `gallery`: 2-3 image composition.
- `testimonial`: user feedback cards.

Use these components to create structure instead of writing everything as normal paragraphs.

## Recommended Content Density

For a 6-9 image Xiaohongshu note:

- 1 cover page.
- 3-5 structured pages.
- 2-4 normal Markdown sections.
- 1 closing checklist or quote.

For a short 3-5 image note:

- 1 cover page.
- 2 structured pages.
- 1 closing section.
