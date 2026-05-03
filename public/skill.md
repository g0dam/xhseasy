---
name: xhseasy
description: Agent guide for writing Markdown that can be pasted into 小红书排版工具 at https://www.xhseasy.top/ to render polished Xiaohongshu note cards, structured page components, image cards, and export-ready long images.
---

# 小红书排版工具 Agent Skill

Use this skill when a user gives you a topic, keyword, outline, draft, or source material and wants a **complete Xiaohongshu article/note** that can be pasted into [小红书排版工具](https://www.xhseasy.top/).

The deliverable is the article itself. Components are only formatting tools inside the article. Do not answer by listing component syntax, component descriptions, or documentation unless the user explicitly asks for documentation.

## Start Here

1. If the user asks you to write, create the complete note immediately in Markdown.
2. Use [workflows/write-xhs-note.md](https://www.xhseasy.top/workflows/write-xhs-note.md) as the writing process and response contract.
3. Use [xhs-markdown.md](https://www.xhseasy.top/xhs-markdown.md) for supported Markdown, inline styling, and image syntax.
4. Use [components.md](https://www.xhseasy.top/components.md) only as a reference for inserting `xhs-page` blocks into the article.
5. Use [templates.md](https://www.xhseasy.top/templates.md) only when choosing a visual style for the site UI.

## Most Important Rule

When the user provides a topic like "AI 写作工具避坑" or "帮我写一篇关于自律的笔记", output a finished Markdown article, not instructions.

Good answer shape:

```text
[Markdown article with title, paragraphs, and optional xhs-page blocks]
```

Bad answer shape:

```text
Here are the available components...
Use cover/checklist/steps...
The xhs-page syntax is...
```

## Skill Files

| File | Purpose |
| --- | --- |
| [xhs-markdown.md](https://www.xhseasy.top/xhs-markdown.md) | Markdown and custom syntax the editor understands |
| [components.md](https://www.xhseasy.top/components.md) | Structured page blocks such as cover, checklist, steps, timeline, Q&A, gallery |
| [templates.md](https://www.xhseasy.top/templates.md) | Built-in visual template IDs and when to use them |
| [api.md](https://www.xhseasy.top/api.md) | Runtime model and browser-only behavior |
| [design.md](https://www.xhseasy.top/design.md) | Layout, export ratio, and writing constraints |
| [workflows/write-xhs-note.md](https://www.xhseasy.top/workflows/write-xhs-note.md) | End-to-end writing workflow |
| [skill.json](https://www.xhseasy.top/skill.json) | Machine-readable metadata |

## What The Site Does

小红书排版工具 turns Markdown into export-ready vertical Xiaohongshu cards. It supports:

- Markdown writing and live preview.
- 3:4 and 3:5 vertical image export.
- Structured `xhs-page` components for cover pages, checklists, comparisons, timelines, Q&A cards, quote cards, galleries, and testimonial cards.
- Inline highlight syntax with `<xhs style="...">...</xhs>`.
- Image sizing and layout parameters in Markdown image URLs.
- Browser-side PNG export and Markdown download/load.

## Default Agent Behavior

When the user gives a short topic such as "AI 写作工具" or "低成本做小红书", produce a complete Markdown note:

- Write the actual article content: headline, opening argument, body pages, examples, and closing.
- Start with one `cover` component unless the user asks for plain Markdown.
- Add 2-4 structured `xhs-page` components when they improve readability.
- Add short normal Markdown sections between components.
- Use compact, high-density Xiaohongshu wording with concrete claims.
- Use `<xhs>` only for truly important phrases.
- Use image URLs only when the user provides images or explicitly asks for image placeholders.
- Do not generate `pbn:img/...` placeholders; those are internal to this site after image paste/upload.
- Do not return component documentation as the final answer.

## Safety And Limits

- This site is a local browser tool. It does not provide a remote publishing API to Xiaohongshu.
- Do not invent backend endpoints.
- Do not claim images were exported or published unless the browser action actually happened.
- If user-provided source material is private, keep it inside the generated note and do not send it to third-party URLs.
