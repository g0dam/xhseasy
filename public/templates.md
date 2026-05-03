# Visual Templates

The site includes many built-in visual templates. A user can apply templates in the UI. Agents generating Markdown usually do not need to set the visual template directly; they should write content that works across templates.

## Common Template IDs

| ID | Name | Best for |
| --- | --- | --- |
| `paper-classic` | 纸感笔记 | Knowledge notes, calm explainers |
| `minimal-white` | 极简白 | Business, clean frameworks |
| `magazine-style` | 杂志风 | Strong visual opinions |
| `dark-mode` | 暗夜模式 | Tech and AI topics |
| `scrapbook` | 手账风 | Lifestyle and casual sharing |
| `retro-newspaper` | 复古报纸 | Long-form analysis |
| `clean-grid` | 极简网格 | Structured memos |
| `fresh-mint` | 清新薄荷 | Natural, health, soft topics |
| `warm-peach` | 温暖蜜桃 | Lifestyle and personal notes |
| `elegant-gold` | 优雅金 | Premium, finance, business |
| `dashboard-card` | 仪表面板 | Metrics, dashboards, reviews |
| `study-flashcard-note` | 学习闪卡 | Education and study notes |
| `food-recipe-card` | 美食食谱 | Food and recipes |
| `travel-map-card` | 旅行地图 | Travel routes |
| `fashion-lookbook-card` | 穿搭画报 | Fashion and lookbooks |
| `beauty-swatch-card` | 美妆色卡 | Beauty and color cards |
| `fitness-energy-card` | 健身能量 | Fitness and sports |
| `book-review-card` | 读书批注 | Book notes |
| `finance-ledger-card` | 财经账本 | Finance and ledgers |

## Agent Guidance

- If the user asks for a style, recommend one template ID in a short note before or after the Markdown.
- If the user asks for Markdown only, do not include template instructions outside the Markdown.
- Do not invent template IDs.
- Content should remain valid even if the user picks a different visual template.
