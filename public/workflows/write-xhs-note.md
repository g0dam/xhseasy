# Workflow: Write A Xiaohongshu Note

Use this workflow when the user gives a topic, keyword, product, article, voice memo, outline, or rough idea and wants a note for 小红书排版工具.

## Input

The user may provide:

- A short topic: "AI 写作工具".
- A target audience: "给独立开发者看".
- Source material: article, transcript, bullets, product notes.
- Desired style: practical, emotional, tutorial, checklist, contrarian, review.

## Output

Output Markdown only unless the user asks for explanation. The Markdown must be directly pasteable into https://www.xhseasy.top/.

## Structure

Default structure:

1. `cover` page with a clear title, subtitle, and badge.
2. One short opening Markdown section.
3. 2-4 structured `xhs-page` components.
4. Optional normal Markdown section for nuance.
5. Final checklist, quote, or CTA.

Recommended component mix:

- Practical tutorial: `cover` + `toc` + `steps` + `checklist`.
- Opinion note: `cover` + `quote-note` + `comparison` + `myth-fact`.
- Product review: `cover` + `data-summary` + `comparison` + `qa`.
- Case study: `cover` + `timeline` + `data-summary` + `checklist`.
- Image-heavy post: `cover` + `gallery` + `steps` + `testimonial`.

## Writing Rules

- Use short sentences.
- Put the strongest conclusion in the first screen.
- One card should carry one main idea.
- Prefer concrete verbs over abstract claims.
- Avoid long paragraphs; 1-3 lines per paragraph is enough.
- Use lists for scanability.
- Use `<xhs style="color:accent;highlight:soft">...</xhs>` for the one phrase users should remember.
- Do not overuse emoji. One or two in titles/badges is enough.

## Image Rules

- If the user gives image URLs, include them with Markdown image syntax.
- If the user asks for placeholders, use normal placeholder URLs or clear alt text, not `pbn:img/...`.
- Use `gallery` for 2-3 related images.
- Use `layout=full-width` only for a strong visual cover/screenshot.

## Example Prompt Handling

User: "帮我写一篇 AI 写作工具避坑的小红书笔记"

Good response pattern:

````markdown
```xhs-page
template: cover
title: AI 写作工具别乱买
subtitle: 真正省时间的不是工具数量，而是你的写作流程
badge: 避坑清单
accent: inherit
```

## 先说结论

大多数人买 AI 写作工具失败，不是因为模型不够强。

而是没有先定义：<xhs style="color:accent;highlight:soft">我要让它替我完成哪一步</xhs>。

```xhs-page
template: checklist
title: 购买前先问 4 个问题
items:
  - 它是帮我找选题，还是帮我改表达？
  - 它能不能接住我的固定风格？
  - 它输出后还需要我改多久？
  - 它有没有稳定复用的模板？
accent: inherit
```
````

The actual answer should continue with complete content, not stop after the example.
