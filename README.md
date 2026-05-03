# 小红书排版工具 · xiaohongshu/paiban

基于 TypeScript + React + Vite 构建的小红书笔记排版工具，支持 Markdown 写作、实时预览和 3:4 竖图导出。

## 核心功能

- **Markdown 编辑**：实时渲染，支持标题、列表、引用、代码块、分割线、图片插入
- **多主题预设**：纸感编辑 / 暖棕经典 / 极简白 / 墨绿 / 复古 / 暗夜
- **精细化排版**：顶装饰线、纸纹质感、标题层级装饰（h2 竖线 / h3 圆点）
- **智能切片导出**：按 3:4 竖图比例切分，自动对齐到块边界，避免拦腰断行
- **Pretext 文本测量**：精准预计算块高度，减少 DOM reflow（需 npm install 后生效）

## 快速开始

```bash
cd xiaohongshu/paiban
npm install
npm run dev
```

## 项目结构

```
paiban/
├── src/
│   ├── types/index.ts     # 类型定义
│   ├── theme.ts           # 主题配置 & CSS 变量生成
│   ├── markdown/
│   │   └── renderer.ts   # Markdown → HTML 解析
│   ├── measure/
│   │   └── measure.ts    # Pretext 文本高度测量
│   ├── slicer/
│   │   └── slicer.ts     # 智能切片 & PNG 导出
│   ├── store/
│   │   └── store.ts      # 状态管理与持久化
│   ├── components/
│   │   └── App.tsx        # React 主组件
│   ├── styles/
│   │   └── global.css    # 全局样式
│   └── main.tsx          # 入口
├── public/
│   └── assets/tx.jpg     # 默认头像
├── index.html
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Pretext 集成说明

[Pretext](https://github.com/chenglou/pretext) (`@chenglou/pretext`) 用于在截图前精准预计算每段文本的渲染高度。

**运行条件**：需先 `npm install`，Vite dev server 会自动动态加载 Pretext。
**降级**：若 Pretext 加载失败（网络问题等），工具会自动降级为简化估算方案，导出功能不受影响。
