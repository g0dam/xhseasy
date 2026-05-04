# 小红书排版工具 · xhseasy

基于 TypeScript + React + Vite 构建的小红书笔记排版工具，支持 Markdown 写作、实时预览和 3:4 竖图导出。

## 核心功能

- **Markdown 编辑**：实时渲染，支持标题、列表、引用、代码块、分割线、图片插入
- **多主题预设**：纸感编辑 / 暖棕经典 / 极简白 / 墨绿 / 复古 / 暗夜
- **精细化排版**：顶装饰线、纸纹质感、标题层级装饰（h2 竖线 / h3 圆点）
- **结构化组件**：支持封面、目录、清单、对比、步骤、时间线、问答、图库等 `xhs-page` 页面块
- **图片编辑**：支持上传 / 粘贴图片，预览中调整图片宽度、圆角和高度
- **智能分页导出**：按 3:4 / 3:5 竖图比例分页预览，并逐页导出 PNG

## 快速开始

```bash
cd xhseasy
npm install
npm run dev
```

## 项目结构

```
xhseasy/
├── src/
│   ├── types/index.ts     # 类型定义
│   ├── theme.ts           # 主题配置 & CSS 变量生成
│   ├── markdown/
│   │   └── renderer.ts    # Markdown → HTML 解析
│   ├── document/
│   │   └── markdown.ts    # Markdown ↔ VisualDocument
│   ├── page-templates/
│   │   └── index.ts       # xhs-page 结构化组件 DSL
│   ├── slicer/
│   │   └── slicer.ts     # 智能切片 & PNG 导出
│   ├── store/
│   │   └── store.ts      # 状态管理与持久化
│   ├── components/        # 预览、模板、首页等组件
│   ├── styles/
│   │   ├── app.css        # 应用样式
│   │   └── preview.css    # 预览 / 导出样式
│   └── main.tsx          # 入口
├── public/
│   ├── assets/tx.jpg      # 默认头像
│   └── *.md               # Agent / LLM 说明文档
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```
