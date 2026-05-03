# Workflow: Write A Xiaohongshu Note

Use this workflow when the user gives a topic, keyword, product, article, voice memo, outline, or rough idea and wants a finished note for 小红书排版工具.

Your job is writing the note. The `xhs-page` components are optional layout blocks used inside the note; they are not the final deliverable.

## Input

The user may provide:

- A short topic: "AI 写作工具".
- A target audience: "给独立开发者看".
- Source material: article, transcript, bullets, product notes.
- Desired style: practical, emotional, tutorial, checklist, contrarian, review.

## Output

Output Markdown only unless the user asks for explanation. The Markdown must be directly pasteable into https://www.xhseasy.top/.

The output must be a complete article/note, not a plan and not component documentation.

Do not output:

- A list of available components.
- A tutorial about how to use this skill.
- A skeleton with placeholders such as "第一条" or "这里写内容".
- A short sample that stops after one component.

Do output:

- A complete title/cover.
- An opening paragraph with the core point.
- Several concrete content sections.
- Optional `xhs-page` blocks filled with real content.
- A closing takeaway or call to action.

## Structure

Default structure:

1. `cover` page with a clear title, subtitle, and badge.
2. One short opening Markdown section.
3. 2-4 structured `xhs-page` components.
4. Optional normal Markdown section for nuance.
5. Final checklist, quote, or CTA.

Minimum useful output for a normal topic:

- 1 `cover` block.
- 3-6 normal Markdown paragraphs.
- 2-4 filled `xhs-page` blocks.
- 6-12 concrete bullets/items across the whole note.
- No unfilled placeholders.

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

## Response Contract

If the user says "写一篇", "生成一篇", "帮我做一篇", "根据这个主题", or only provides a keyword, treat that as a writing request.

Return the final Markdown article directly. Do not preface it with "下面是组件说明" or "你可以这样使用组件".

Only explain component syntax if the user explicitly asks "这些组件怎么用", "解释 skill", "列出组件", or "给我文档".

## Complete Output Pattern

A finished response should look like this level of completeness, but adapted to the user's topic:

````markdown
```xhs-page
template: cover
title: 普通人做小红书，别先学排版
subtitle: 先把选题、结构和复盘跑通，模板才会真正帮你省时间
badge: 新手避坑
accent: inherit
```

## 先说结论

很多人一开始就纠结字体、颜色、封面。

但真正影响数据的，通常是这三件事：<xhs style="color:accent;highlight:soft">选题是否具体、第一屏是否有结论、每一页是否只讲一个重点</xhs>。

```xhs-page
template: checklist
title: 发布前先检查这 4 件事
items:
  - 标题里有没有明确对象：新手、宝妈、独立开发者、打工人
  - 第一屏有没有直接说结论，而不是铺背景
  - 正文是不是一页一个重点
  - 结尾有没有给收藏理由或下一步动作
accent: inherit
```

```xhs-page
template: comparison
title: 新手最容易写错的地方
leftTitle: 容易滑走
rightTitle: 更容易被看完
rows:
  - left: 我最近有一些思考
    right: 我踩过 3 个坑，建议你先避开
  - left: 这个工具很好用
    right: 它真正省时间的是第 2 步
  - left: 总结一下经验
    right: 你可以直接照这个清单检查
accent: inherit
```

## 最后记住一句

排版不是为了好看而好看。

排版的价值是让读者更快抓住重点，然后愿意收藏、转发、回来复看。
````
