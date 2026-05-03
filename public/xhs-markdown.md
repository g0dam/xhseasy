# XHS Markdown Format

This editor accepts normal Markdown plus a small custom syntax layer for Xiaohongshu card writing.

## Standard Markdown

Use:

- `#` for the main title.
- `##` for section titles.
- `###` for small section titles.
- `>` for quote blocks.
- `-` for unordered lists.
- `1.` for ordered lists.
- `---` for divider lines.
- Backticks and fenced code blocks for code.
- `**bold**`, `*italic*`, and `~~delete~~`.

Keep paragraphs short. Xiaohongshu cards should scan quickly.

## Inline Highlight Syntax

Use custom inline tags for emphasis:

```html
<xhs style="size:18;color:accent;highlight:soft">重点句</xhs>
```

Supported style keys:

| Key | Values | Meaning |
| --- | --- | --- |
| `size` | `sm`, `lg`, or a number from 11-30 | Inline font size |
| `color` | `accent`, `red`, `green`, `blue`, or `#rrggbb` | Inline color |
| `highlight` | `soft` | Soft yellow highlight |

Good examples:

```markdown
真正拉开差距的不是工具，而是 <xhs style="color:accent;highlight:soft">你有没有稳定复盘</xhs>。
```

```markdown
把结论写在第一屏：<xhs style="size:20;color:red">别让用户滑三页才知道你想说什么</xhs>。
```

Rules:

- Use double quotes in `style`.
- Do not nest many `<xhs>` tags.
- Do not wrap whole paragraphs; emphasize short phrases.

## Image Syntax

Use normal Markdown image syntax:

```markdown
![图片说明](https://example.com/image.jpg)
```

The editor supports URL query parameters:

```markdown
![图片说明](https://example.com/image.jpg?w=100&h=400&r=8&m=16)
```

| Param | Meaning | Default |
| --- | --- | --- |
| `w` | Width percent, clamped from 10 to 100 | `100` |
| `h` | Maximum image height in px | `400` |
| `layout` | `block` or `full-width` | `block` |
| `r` | Border radius, clamped from 0 to 50 | `8` |
| `m` | Top and bottom margin in px | `16` |
| `dx` | Horizontal crop/position offset | `0` |
| `dy` | Vertical crop/position offset | `0` |

Examples:

```markdown
![产品截图](https://example.com/screenshot.png?w=92&h=360&r=12&m=18)
![氛围图](https://example.com/cover.jpg?w=100&layout=full-width&r=16)
```

Do not generate `pbn:img/<uuid>` unless you are editing an existing document that already contains those placeholders. They are created by this site's browser image paste/upload flow.

## Recommended Note Structure

For a complete Xiaohongshu note:

````markdown
```xhs-page
template: cover
title: 主标题
subtitle: 一句话讲清价值
badge: 今日重点
accent: inherit
```

## 先给结论

短段落，直接说明用户为什么要看。

```xhs-page
template: checklist
title: 可以直接照做的清单
items:
  - 第一条
  - 第二条
  - 第三条
accent: inherit
```
````

When writing inside another Markdown document, keep the outer code fence handling correct. The actual note should contain literal ` ```xhs-page ` blocks.
