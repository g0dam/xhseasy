import type { NoteTemplate } from "@/templates/index";

const HERO_MD_LINES = [
  "# 生活是自己的",
  "",
  "## 记录日常 · 发现美好",
  "",
  "我喜欢把平凡的日子",
  "过得热气腾腾。",
  "晨光、咖啡、书页、和风，",
  "这些小事拼在一起，",
  "就是我想要的生活。",
  "",
  "## 今日清单",
  "- 早起喝水",
  "- 30 分钟阅读",
  "- 给自己 20 分钟",
];

const FEATURES = [
  {
    icon: "write",
    title: "Markdown 写作",
    body: "专注内容创作，支持常用 Markdown 语法，写作更高效。",
  },
  {
    icon: "palette",
    title: "主题模板",
    body: "多种质感主题与版式，一键应用，风格统一。",
  },
  {
    icon: "slice",
    title: "智能切片",
    body: "自动识别卡片边界，智能切片，适配小红书发布规范。",
  },
  {
    icon: "image",
    title: "PNG 导出",
    body: "高清导出无水印，像素级清晰，发布更安心。",
  },
];

const AUDIENCES = [
  ["知识博主", "把教程、清单、复盘和方法论整理成可收藏的长图笔记。"],
  ["AI 创作者", "将提示词、工具流、模型经验快速排版成稳定风格的图文内容。"],
  ["独立开发者", "把产品更新、构建日志、经验分享转成更适合小红书传播的视觉稿。"],
  ["运营团队", "复用模板统一品牌质感，减少每篇内容的设计沟通成本。"],
];

const SCENARIOS = [
  {
    title: "写完文章后，直接进入排版",
    solution: "把 Markdown 文稿粘贴进编辑器，选择模板后就能看到竖版长图效果。",
    proof: "工具支持 3:4 和 3:5 这类常用比例，适合把一篇内容拆成多张连续图片发布。",
  },
  {
    title: "让每篇笔记保持相近的视觉风格",
    solution: "模板会统一字体、颜色、间距、纸纹和装饰，避免每次都从空白画布重新调。",
    proof: "纸感日记、极简白、复古信纸、暗夜模式等模板可以用于不同栏目，也能长期复用。",
  },
  {
    title: "导出前先看清分页和切片结果",
    solution: "长文会按页面比例分页预览，导出时再按每一页的边界生成图片。",
    proof: "这样可以减少手工截图时常见的断行、裁切和背景不一致问题。",
  },
];

const COMPARISON = [
  ["工作环节", "手工截图排版", "小红书排版工具"],
  ["内容输入", "复制到设计软件后再改样式", "直接写 Markdown 或粘贴文稿"],
  ["视觉统一", "每次手动调字体和间距", "模板统一控制主题与装饰"],
  ["切片导出", "手动裁图，容易断行", "按比例智能切片并导出 PNG"],
  ["复用成本", "每篇都要重新整理画布", "保存设置后持续复用"],
];

const FAQS = [
  [
    "这个工具主要用来做什么？",
    "它用来把已经写好的文字排成适合小红书发布的竖版图片。你可以用 Markdown 写正文，选择模板后预览效果，再导出多张 PNG 图片。",
  ],
  [
    "不懂设计也能用吗？",
    "可以。模板已经处理好字体、配色、留白和装饰，日常使用时主要是写内容、选模板、检查分页和导出。",
  ],
  [
    "适合哪些类型的小红书笔记？",
    "适合知识卡片、AI 工具教程、读书笔记、产品复盘、经验总结、清单类内容，以及需要用长图承载的图文笔记。",
  ],
  [
    "导出的图片会不会被裁掉？",
    "编辑区会先展示每一页的实际排版效果，导出时按页面边界生成图片。发布前仍建议快速检查一次分页，尤其是长英文、代码块和图片较多的内容。",
  ],
];

const WORKFLOW = [
  ["1", "写作", "在 Markdown 编辑器中专注写作你的内容。"],
  ["2", "预览", "实时预览 3:4 / 3:5 卡片效果，所见即所得。"],
  ["3", "调整", "切换主题、调整样式，打磨你喜欢的版式。"],
  ["4", "导出", "智能切片并导出高清 PNG，发布小红书更轻松。"],
];

const XHS_PROFILE_POINTS = [
  "小红书号：8961365594",
  "IP 属地：浙江",
  "内容方向：AI 产品、AI 副业、AI 工具",
  "目前记录 AI 产品开发、工具使用和一些随手观察。",
];

const FEATURED_IDS = [
  "soft-paper-note",
  "clean-grid-memo",
  "warm-scrapbook-note",
  "editorial-index-note",
  "dashboard-card",
  "archive-file-note",
];

function Icon({ name }: { name: string }) {
  if (name === "write") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M7 6h13l5 5v15H7z" />
        <path d="M20 6v6h6" />
        <path d="M11 17h10M11 21h7" />
      </svg>
    );
  }
  if (name === "palette") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M16 5c-6 0-11 4.4-11 9.9 0 4.6 3.8 8.4 8.6 8.4h1.7c1.4 0 2.1.9 2.1 2 0 1.3 1.1 2.2 2.5 1.7 4.2-1.5 7.1-5.4 7.1-10C27 10.4 22.1 5 16 5z" />
        <circle cx="11" cy="13" r="1.5" />
        <circle cx="16" cy="10.5" r="1.5" />
        <circle cx="21" cy="13" r="1.5" />
        <circle cx="13" cy="18" r="1.5" />
      </svg>
    );
  }
  if (name === "slice") {
    return (
      <svg viewBox="0 0 32 32" aria-hidden="true">
        <path d="M8 6l16 20M24 6L8 26" />
        <circle cx="8" cy="6" r="2" />
        <circle cx="24" cy="26" r="2" />
        <path d="M6 16h20" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true">
      <rect x="6" y="7" width="20" height="18" rx="2" />
      <circle cx="20" cy="13" r="2" />
      <path d="M8 23l6-7 4 4 3-3 5 6" />
    </svg>
  );
}

function HeroPreview() {
  return (
    <div className="landing-product" aria-label="产品界面预览">
      <div className="landing-product__top">
        <div className="landing-product__brand">
          <span className="landing-mark landing-mark--small" />
          <span>小红书排版工具</span>
        </div>
        <span className="landing-saved">已保存</span>
        <div className="landing-theme-switch">
          <span>主题：纸感日记</span>
          <span className="landing-mini-icon">☼</span>
          <span className="landing-mini-icon">⚙</span>
        </div>
      </div>
      <div className="landing-product__body">
        <section className="landing-editor-mock">
          <div className="landing-panel-title">Markdown 编辑器</div>
          <div className="landing-code">
            {HERO_MD_LINES.map((line, index) => (
              <div key={`${line}-${index}`} className={line ? "" : "is-empty"}>
                <span>{index + 1}</span>
                <code>{line || " "}</code>
              </div>
            ))}
          </div>
          <div className="landing-editor-foot">
            <span>字数：123</span>
            <span>预计阅读：1 分钟</span>
          </div>
        </section>
        <section className="landing-preview-mock">
          <div className="landing-panel-title">
            <span>预览（3:4 / 3:5）</span>
            <span className="landing-ratio">3:5</span>
          </div>
          <article className="landing-note-card">
            <h2>生活是自己的</h2>
            <p className="landing-note-subtitle">记录日常 · 发现美好</p>
            <div className="landing-photo" />
            <p>
              我喜欢把平凡的日子过得热气腾腾。晨光、咖啡、书页、和风，
              这些小事拼在一起，就是我想要的生活。
            </p>
            <h3>今日清单</h3>
            <ul>
              <li>早起喝水</li>
              <li>30 分钟阅读</li>
              <li>给自己 20 分钟</li>
              <li>写一篇小红书笔记</li>
            </ul>
            <p className="landing-note-footer">生活不会一直完美，但我们可以认真把日子排成一页。</p>
          </article>
        </section>
      </div>
    </div>
  );
}

function TemplateThumb({
  template,
  index,
  onUse,
}: {
  template: NoteTemplate;
  index: number;
  onUse: (template: NoteTemplate) => void;
}) {
  return (
    <button
      className={`landing-template landing-template--${index + 1}`}
      type="button"
      onClick={() => onUse(template)}
      aria-label={`应用模板：${template.name}`}
    >
      <div className="landing-template__card">
        <div className="landing-template__title">{template.name}</div>
        <div className="landing-template__caption">记录日常 · 发现美好</div>
        <div className="landing-template__visual" />
        <div className="landing-template__lines">
          <span />
          <span />
          <span />
        </div>
        <div className="landing-template__checks">
          <i />
          <i />
          <i />
        </div>
      </div>
      <span>{template.name}</span>
    </button>
  );
}

export function LandingPage({
  templates,
  onStart,
  onOpenTemplates,
  onUseTemplate,
}: {
  templates: NoteTemplate[];
  onStart: () => void;
  onOpenTemplates: () => void;
  onUseTemplate: (template: NoteTemplate) => void;
}) {
  const featured = FEATURED_IDS
    .map((id) => templates.find((template) => template.id === id))
    .filter((template): template is NoteTemplate => Boolean(template));

  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label="首页导航">
        <div className="landing-brand">
          <span className="landing-mark" />
          <span>小红书排版工具</span>
        </div>
        <div className="landing-nav__links">
          <a href="#landing-templates">模板</a>
          <button type="button" onClick={onStart}>编辑</button>
          <button type="button" onClick={onStart}>导出</button>
          <button type="button" onClick={onStart}>设置</button>
        </div>
      </nav>

      <section className="landing-hero">
        <div className="landing-hero__copy">
          <h1>
            把 Markdown
            <span>变成小红书长图</span>
          </h1>
          <p>实时预览、纸感主题、智能切片、高清导出</p>
          <ul>
            <li>专为内容创作者设计</li>
            <li>写作即排版，所见即所得</li>
            <li>一键导出高清长图，发布更轻松</li>
          </ul>
          <div className="landing-actions">
            <button className="landing-btn landing-btn--primary" type="button" onClick={onStart}>开始排版</button>
            <button className="landing-btn landing-btn--secondary" type="button" onClick={onOpenTemplates}>查看模板</button>
          </div>
          <div className="landing-proof" aria-label="用户数">
            <div className="landing-avatars">
              <span />
              <span />
              <span />
              <span />
            </div>
            <span>10,000+ 创作者正在使用</span>
          </div>
        </div>
        <HeroPreview />
      </section>

      <section className="landing-feature-band" aria-label="核心功能">
        {FEATURES.map((feature) => (
          <article className="landing-feature" key={feature.title}>
            <Icon name={feature.icon} />
            <h2>{feature.title}</h2>
            <p>{feature.body}</p>
          </article>
        ))}
      </section>

      <section className="landing-section landing-audience" aria-labelledby="audience-title">
        <div className="landing-section__heading">
          <span className="landing-eyebrow">适用人群</span>
          <h2 id="audience-title">适合需要稳定产出图文内容的人</h2>
          <p>这不是单纯的截图工具，而是把写作、排版、切片和发布准备串起来的内容生产工作台。</p>
        </div>
        <div className="landing-audience__grid">
          {AUDIENCES.map(([title, body]) => (
            <article className="landing-audience-card" key={title}>
              <h3>{title}</h3>
              <p>{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-scenarios" aria-labelledby="scenario-title">
        <div className="landing-section__heading">
          <span className="landing-eyebrow">常见使用方式</span>
          <h2 id="scenario-title">小红书长图排版的常见场景</h2>
          <p>从写完正文到导出图片，尽量把容易出错的排版步骤放在同一个界面里完成。</p>
        </div>
        <div className="landing-scenario-list">
          {SCENARIOS.map((item) => (
            <article className="landing-scenario" key={item.title}>
              <h3>{item.title}</h3>
              <p>{item.solution}</p>
              <p>{item.proof}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section" id="landing-templates">
        <div className="landing-section__heading">
          <h2>精选模板</h2>
          <p>多种风格模板，适配不同内容场景</p>
        </div>
        <div className="landing-template-row">
          {featured.map((template, index) => (
            <TemplateThumb key={template.id} template={template} index={index} onUse={onUseTemplate} />
          ))}
        </div>
        <button className="landing-link-btn" type="button" onClick={onOpenTemplates}>
          查看更多模板 <span>→</span>
        </button>
      </section>

      <section className="landing-section landing-comparison" aria-labelledby="comparison-title">
        <div className="landing-section__heading">
          <span className="landing-eyebrow">为什么需要</span>
          <h2 id="comparison-title">比手工截图更适合持续创作</h2>
          <p>当你一周要发多篇内容时，稳定的排版流程比单次好看更重要。</p>
        </div>
        <div className="landing-compare-table" role="table" aria-label="手工排版和小红书排版工具对比">
          {COMPARISON.map((row, rowIndex) => (
            <div className={rowIndex === 0 ? "landing-compare-row landing-compare-row--head" : "landing-compare-row"} role="row" key={row[0]}>
              {row.map((cell) => (
                <span role="cell" key={cell}>{cell}</span>
              ))}
            </div>
          ))}
        </div>
      </section>

      <section className="landing-section landing-workflow">
        <div className="landing-section__heading">
          <h2>工作流程</h2>
          <p>简单四步，快速完成小红书长图排版</p>
        </div>
        <div className="landing-workflow__grid">
          {WORKFLOW.map(([step, title, body], index) => (
            <article className="landing-step" key={title}>
              <span className="landing-step__num">{step}</span>
              <div>
                <h3>{title}</h3>
                <p>{body}</p>
              </div>
              {index < WORKFLOW.length - 1 && <span className="landing-step__arrow">→</span>}
            </article>
          ))}
        </div>
      </section>

      <section className="landing-section landing-promo" aria-labelledby="promo-title">
        <div className="landing-promo__main">
          <span className="landing-eyebrow">XIAOHONGSHU</span>
          <h2 id="promo-title">正先森 AI 手记</h2>
          <p>
            不正经的程序员，也会在小红书记录一些和 AI 有关的内容。这里主要放 AI 产品、AI 工具、独立开发过程，以及做产品时遇到的想法。
          </p>
          <div className="landing-profile-list" aria-label="小红书账号信息">
            {XHS_PROFILE_POINTS.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
        </div>
        <aside className="landing-qr-card" aria-label="小红书二维码">
          <div className="landing-qr-box">
            <img src="/assets/xhs-qr.webp" alt="正先森 AI 手记小红书二维码" width="207" height="216" loading="lazy" />
          </div>
          <strong>扫码打开小红书主页</strong>
          <p>正先森 AI 手记 · AI 随便开发者</p>
        </aside>
      </section>

      <section className="landing-section landing-faq" aria-labelledby="faq-title">
        <div className="landing-section__heading">
          <span className="landing-eyebrow">常见问题</span>
          <h2 id="faq-title">关于小红书排版工具的常见问题</h2>
          <p>先回答使用前最容易关心的几个问题。</p>
        </div>
        <div className="landing-faq__list">
          {FAQS.map(([question, answer]) => (
            <article className="landing-faq-item" key={question}>
              <h3>{question}</h3>
              <p>{answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="landing-cta">
        <div className="landing-cta__copy">
          <h2>开始你的排版之旅</h2>
          <p>专注创作，排版交给我们</p>
          <div className="landing-actions">
            <button className="landing-btn landing-btn--primary" type="button" onClick={onStart}>开始排版</button>
            <button className="landing-btn landing-btn--secondary" type="button" onClick={onOpenTemplates}>查看模板</button>
          </div>
        </div>
        <div className="landing-desk-scene" aria-hidden="true">
          <div className="landing-cup" />
          <div className="landing-notebook">
            <span>记录生活</span>
            <span>热爱文字</span>
            <span>分享美好</span>
          </div>
          <div className="landing-pen" />
        </div>
      </section>

      <footer className="landing-footer">
        <span className="landing-mark landing-mark--small" />
        <strong>小红书排版工具</strong>
        <p>让写作与排版成为一件愉快的事</p>
        <small>© 2024 Xiaohongshu Paiban. All rights reserved.</small>
      </footer>
    </main>
  );
}
