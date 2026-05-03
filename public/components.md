# XHS Page Components

This file is a reference for writing articles, not the final answer to a writing request.

Use fenced `xhs-page` blocks as structured visual cards inside a Xiaohongshu article. When the user asks for an article, choose useful components and fill them with real content. Do not return this component catalog as the answer.

Common rules:

- Start with ```` ```xhs-page ```` and end with ```` ``` ````.
- Include `template: ...`.
- Use two spaces for nested list fields.
- Keep text concise. Each page is rendered into a vertical Xiaohongshu card.
- `accent` accepts `inherit`, `orange`, `red`, `green`, `blue`, `purple`, `brown`, or a hex color such as `#c8642f`.
- Inline `<xhs style="...">...</xhs>` can be used inside string values.

## cover

Use for the opening page.

````markdown
```xhs-page
template: cover
title: 这篇笔记想说清什么
subtitle: 一句话补充场景和价值
badge: 今日重点
accent: inherit
```
````

Fields: `title`, `subtitle`, `badge`, `accent`.

## toc

Use for a contents/roadmap page.

````markdown
```xhs-page
template: toc
title: 这一篇你会看到什么
items:
  - 为什么这件事重要
  - 三个核心判断
  - 可直接照抄的做法
  - 最后怎么落地
accent: inherit
```
````

Fields: `title`, `items`, `accent`.

## checklist

Use for save-worthy checklists.

````markdown
```xhs-page
template: checklist
title: 发布前检查
items:
  - 标题里出现对象词
  - 第一屏先给结论
  - 每页只讲一个重点
  - 结尾给可执行动作
accent: inherit
```
````

Fields: `title`, `items`, `accent`.

## comparison

Use for before/after or wrong/right comparisons.

````markdown
```xhs-page
template: comparison
title: 两种写法对比
leftTitle: 常见写法
rightTitle: 更好写法
rows:
  - left: 先铺背景
    right: 先给判断
  - left: 句子太满
    right: 只留关键句
  - left: 信息太多
    right: 一页一个结论
accent: inherit
```
````

Fields: `title`, `leftTitle`, `rightTitle`, `rows[].left`, `rows[].right`, `accent`.

## steps

Use for methods, tutorials, workflows.

````markdown
```xhs-page
template: steps
title: 3 步写清一件事
steps:
  - title: 先定结论
    detail: 写最想让人记住的一句话
  - title: 再拆结构
    detail: 把正文拆成几个可浏览小节
  - title: 最后补例子
    detail: 用真实场景把观点压实
accent: inherit
```
````

Fields: `title`, `steps[].title`, `steps[].detail`, `accent`.

## timeline

Use for process, growth, roadmap, project history.

````markdown
```xhs-page
template: timeline
title: 一个项目如何成形
points:
  - time: 第 1 周
    title: 先看需求
    detail: 找用户真实抱怨的问题
  - time: 第 2 周
    title: 做最小功能
    detail: 先打通核心链路
  - time: 第 3 周
    title: 再补模板
    detail: 把稳定场景做成结构
accent: inherit
```
````

Fields: `title`, `points[].time`, `points[].title`, `points[].detail`, `accent`.

## qa

Use for FAQ cards.

````markdown
```xhs-page
template: qa
title: 最常被问的 2 个问题
pairs:
  - q: 为什么要用结构化模板？
    a: 因为它能让内容稳定导出，也让读者更快抓重点。
  - q: 模板会不会限制表达？
    a: 模板解决结构，不限制观点和语言风格。
accent: inherit
```
````

Fields: `title`, `pairs[].q`, `pairs[].a`, `accent`.

## myth-fact

Use for misconception correction.

````markdown
```xhs-page
template: myth-fact
title: 3 个常见误区
items:
  - myth: 版式越自由越高级
    fact: 真正高级的是结构清晰且能稳定导出
  - myth: 一页放越多信息越值钱
    fact: 一页一个结论更容易被记住
accent: inherit
```
````

Fields: `title`, `items[].myth`, `items[].fact`, `accent`.

## quote-note

Use for quote plus commentary.

````markdown
```xhs-page
template: quote-note
quote: 读源码不是为了背目录，而是为了建立循环、工具和上下文预算的直觉。
note: 这类句子适合做单页展开，因为用户会停下来读批注。
source: Claude Code 读后感
accent: inherit
```
````

Fields: `quote`, `note`, `source`, `accent`.

## data-summary

Use for result, metrics, summary claims.

````markdown
```xhs-page
template: data-summary
title: 这次优化结果
headline: 模板页更稳
stats:
  - label: 交互复杂度
    value: 更低
  - label: 导出一致性
    value: 更高
  - label: 维护成本
    value: 更可控
accent: inherit
```
````

Fields: `title`, `headline`, `stats[].label`, `stats[].value`, `accent`.

## gallery

Use for image groups. Only the first 3 images are rendered.

````markdown
```xhs-page
template: gallery
title: 这组截图想说明什么
layout: 2-grid
images:
  - https://example.com/image-1.jpg
  - https://example.com/image-2.jpg
  - https://example.com/image-3.jpg
accent: inherit
```
````

Fields: `title`, `layout`, `images`, `accent`.

## testimonial

Use for user feedback or review summaries.

````markdown
```xhs-page
template: testimonial
title: 用户最常提到的感受
items:
  - quote: 终于不是一大坨正文了，阅读舒服很多。
    author: 读者 A
  - quote: 模板页更适合收藏，信息抓得更快。
    author: 读者 B
accent: inherit
```
````

Fields: `title`, `items[].quote`, `items[].author`, `accent`.

## Component Selection Guide

| User intent | Prefer |
| --- | --- |
| "给我一个开头/封面" | `cover` |
| "列清单/避坑/检查项" | `checklist` |
| "步骤/教程/怎么做" | `steps` |
| "对比两种方法" | `comparison` |
| "时间线/过程复盘" | `timeline` |
| "FAQ/常见问题" | `qa` |
| "纠正常见误区" | `myth-fact` |
| "金句/观点展开" | `quote-note` |
| "结果/指标/复盘" | `data-summary` |
| "多张图展示" | `gallery` |
| "用户反馈/评价" | `testimonial` |
