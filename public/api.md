# API And Runtime Model

小红书排版工具 is currently a browser-side React/Vite app. It does not expose a public backend API.

## What Exists

- Main site: `https://www.xhseasy.top/`
- Agent entry: `https://www.xhseasy.top/skill.md`
- LLM summary: `https://www.xhseasy.top/llms.txt`
- Markdown format docs: `https://www.xhseasy.top/xhs-markdown.md`
- Component docs: `https://www.xhseasy.top/components.md`

## Browser-Side Features

The app performs these operations in the browser:

- Edit Markdown.
- Persist draft Markdown and settings in `localStorage`.
- Upload or paste images into browser memory and convert large data URLs to internal `pbn:img/<uuid>` placeholders.
- Render a live preview from Markdown.
- Export rendered cards to PNG using browser canvas capture.
- Download and load `.md` files through browser file APIs.

## No Remote Publishing

There is no remote API for:

- Publishing to Xiaohongshu.
- Uploading files to a server.
- Creating posts remotely.
- Reading a user's private drafts from the server.

If a user asks an agent to "publish", the agent must clarify that this site only prepares export-ready images and Markdown. Actual Xiaohongshu publishing happens outside this site.

## Agent Operation

For content generation, agents should not call an API. They should:

1. Read `skill.md`.
2. Generate Markdown that follows `xhs-markdown.md` and `components.md`.
3. Give the Markdown to the user or paste it into the site if operating a browser.
4. Use the site's UI for preview and PNG export.
