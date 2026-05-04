/**
 * SettingsPanel.tsx — 设置面板
 */

import type { EditorSettings } from "@/types";
import { SWATCHES, PRESETS, BACKGROUND_PRESETS } from "@/theme";
import { defaultSettings } from "@/store/store";
import { todayIso, isoDateOrToday } from "@/utils/constants";

interface SettingsPanelProps {
  settings: EditorSettings;
  onUpdate: (patch: Partial<EditorSettings>) => void;
  onReset: () => void;
  open: boolean;
  onClose: () => void;
}

export function SettingsPanel({ settings, onUpdate, onReset, open, onClose }: SettingsPanelProps) {
  if (!open) return null;

  const hasBackgroundImage = settings.backgroundImageSrc.trim().length > 0;
  const showBackgroundEffects = settings.backgroundMode === "image" && hasBackgroundImage;

  return (
    <>
      <div id="settings-overlay" className="visible" onClick={onClose} />
      <div id="settings-panel" className="open">
        <div className="settings-header">
          <h2>设置</h2>
          <button className="settings-close" onClick={onClose}>✕</button>
        </div>
        <div className="settings-body">

          <div className="settings-section">
            <h3>色调主题</h3>
            <div className="theme-swatches">
              {SWATCHES.map((sw) => (
                <button
                  key={sw.name}
                  className="swatch"
                  title={sw.name}
                  style={{ background: `linear-gradient(135deg, ${sw.cardBg} 50%, ${sw.accent} 50%)` }}
                  onClick={() => onUpdate({ cardBg: sw.cardBg, cardText: sw.cardText, accent: sw.accent, bodyBg: sw.bodyBg })}
                />
              ))}
            </div>
            <hr className="settings-divider" />
            <div className="settings-row"><label>卡片背景色</label><input type="color" value={settings.cardBg} onChange={(e) => onUpdate({ cardBg: e.target.value })} /></div>
            <div className="settings-row"><label>正文文字色</label><input type="color" value={settings.cardText} onChange={(e) => onUpdate({ cardText: e.target.value })} /></div>
            <div className="settings-row"><label>强调色</label><input type="color" value={settings.accent} onChange={(e) => onUpdate({ accent: e.target.value })} /></div>
            <div className="settings-row"><label>工作区背景色</label><input type="color" value={settings.bodyBg} onChange={(e) => onUpdate({ bodyBg: e.target.value })} /></div>
            <div className="settings-btn-row"><button onClick={onReset}>恢复默认</button></div>
          </div>

          <div className="settings-section">
            <h3>字体与排版</h3>
            <div className="settings-row">
              <label>正文字体</label>
              <select value={settings.font} onChange={(e) => onUpdate({ font: e.target.value as EditorSettings["font"] })}>
                <option value="serif">宋体衬线</option>
                <option value="sans">黑体无衬线</option>
                <option value="mono">等宽字体</option>
              </select>
            </div>
            <div className="settings-row">
              <label>正文字号</label>
              <div className="range-with-val">
                <input type="range" min="12" max="22" value={settings.fontSize} onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })} />
                <span>{settings.fontSize}px</span>
              </div>
            </div>
            <div className="settings-row">
              <label>行高</label>
              <div className="range-with-val">
                <input type="range" min="1.3" max="2.4" step="0.05" value={settings.lineHeight} onChange={(e) => onUpdate({ lineHeight: Number(e.target.value) })} />
                <span>{settings.lineHeight}</span>
              </div>
            </div>
            <div className="settings-row">
              <label>圆角（px）</label>
              <div className="range-with-val">
                <input type="range" min="8" max="30" step="1" value={settings.cardRadius} onChange={(e) => onUpdate({ cardRadius: Number(e.target.value) })} />
                <span>{settings.cardRadius}px</span>
              </div>
            </div>
            <div className="settings-row">
              <label>正文左右边距</label>
              <div className="range-with-val">
                <input type="range" min="0" max="40" step="1" value={settings.contentInsetX} onChange={(e) => onUpdate({ contentInsetX: Number(e.target.value) })} />
                <span>{settings.contentInsetX}px</span>
              </div>
            </div>
          </div>

          <div className="settings-section">
            <h3>模板组件风格</h3>
            <div className="settings-row">
              <label>内容密度</label>
              <select value={settings.contentDensity} onChange={(e) => {
                const density = e.target.value as EditorSettings["contentDensity"];
                onUpdate(density === "compact"
                  ? { contentDensity: density, contentInsetX: 24, templateTitleScale: 0.88, templateBodyScale: 0.92, templateCardPadding: 16, templateSectionGap: 14, templateCardMinHeight: 0 }
                  : { contentDensity: density, contentInsetX: 30, templateTitleScale: 1, templateBodyScale: 1, templateCardPadding: 20, templateSectionGap: 18, templateCardMinHeight: 24 });
              }}>
                <option value="compact">紧凑</option>
                <option value="balanced">平衡</option>
              </select>
            </div>
            <div className="settings-row">
              <label>模板面板风格</label>
              <select value={settings.templateSurfaceStyle} onChange={(e) => onUpdate({ templateSurfaceStyle: e.target.value as EditorSettings["templateSurfaceStyle"] })}>
                <option value="blend">融合</option>
                <option value="paper">纸片</option>
                <option value="outline">描边</option>
              </select>
            </div>
            <div className="settings-row"><label>模板圆角</label><div className="range-with-val"><input type="range" min="8" max="30" step="1" value={settings.templatePanelRadius} onChange={(e) => onUpdate({ templatePanelRadius: Number(e.target.value) })} /><span>{settings.templatePanelRadius}px</span></div></div>
            <div className="settings-row"><label>模板标题大小</label><div className="range-with-val"><input type="range" min="0.72" max="1.12" step="0.02" value={settings.templateTitleScale} onChange={(e) => onUpdate({ templateTitleScale: Number(e.target.value) })} /><span>{settings.templateTitleScale.toFixed(2)}</span></div></div>
            <div className="settings-row"><label>模板正文大小</label><div className="range-with-val"><input type="range" min="0.78" max="1.1" step="0.02" value={settings.templateBodyScale} onChange={(e) => onUpdate({ templateBodyScale: Number(e.target.value) })} /><span>{settings.templateBodyScale.toFixed(2)}</span></div></div>
            <div className="settings-row"><label>面板存在感</label><div className="range-with-val"><input type="range" min="10" max="90" step="1" value={settings.templatePanelOpacity} onChange={(e) => onUpdate({ templatePanelOpacity: Number(e.target.value) })} /><span>{settings.templatePanelOpacity}</span></div></div>
            <div className="settings-row"><label>强调色强度</label><div className="range-with-val"><input type="range" min="0" max="100" step="1" value={settings.templateAccentStrength} onChange={(e) => onUpdate({ templateAccentStrength: Number(e.target.value) })} /><span>{settings.templateAccentStrength}</span></div></div>
            <div className="settings-row"><label>模板卡内边距</label><div className="range-with-val"><input type="range" min="10" max="28" step="1" value={settings.templateCardPadding} onChange={(e) => onUpdate({ templateCardPadding: Number(e.target.value) })} /><span>{settings.templateCardPadding}px</span></div></div>
            <div className="settings-row"><label>模板区块间距</label><div className="range-with-val"><input type="range" min="8" max="28" step="1" value={settings.templateSectionGap} onChange={(e) => onUpdate({ templateSectionGap: Number(e.target.value) })} /><span>{settings.templateSectionGap}px</span></div></div>
          </div>

          <div className="settings-section">
            <h3>背景画布</h3>
            <div className="settings-row">
              <label>背景模式</label>
              <select value={settings.backgroundMode} onChange={(e) => onUpdate({ backgroundMode: e.target.value as EditorSettings["backgroundMode"] })}>
                <option value="color">纯色</option>
                <option value="image">背景图</option>
              </select>
            </div>
            <div className="settings-row settings-row--col">
              <span className="settings-label-top">背景图片</span>
              <div className="settings-avatar-row">
                <div className="settings-bg-preview">
                  {hasBackgroundImage ? <img src={settings.backgroundImageSrc} alt="" /> : <div className="settings-bg-preview__empty">无背景图</div>}
                </div>
                <div className="settings-avatar-actions">
                  <label className="settings-file-btn">
                    上传背景
                    <input type="file" accept="image/*" className="settings-file-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => onUpdate({ backgroundMode: "image", backgroundImageSrc: reader.result as string });
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button type="button" className="settings-mini-btn" onClick={() => onUpdate({ backgroundMode: "color", backgroundImageSrc: "" })}>清除</button>
                </div>
              </div>
            </div>
            {showBackgroundEffects ? (
              <>
                <div className="settings-row settings-row--col">
                  <span className="settings-label-top">背景预设</span>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {BACKGROUND_PRESETS.map((preset) => (
                      <button key={preset.name} className="preset-chip" type="button"
                        onClick={() => onUpdate({ backgroundOverlay: preset.overlay, backgroundDim: preset.dim, backgroundBlur: preset.blur })}>
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="settings-row">
                  <label>铺满方式</label>
                  <select value={settings.backgroundImageFit} onChange={(e) => onUpdate({ backgroundImageFit: e.target.value as EditorSettings["backgroundImageFit"] })}>
                    <option value="cover">铺满裁切</option>
                    <option value="contain">完整显示</option>
                  </select>
                </div>
                <div className="settings-row"><label>遮罩色</label><input type="text" className="settings-input settings-input--inline" value={settings.backgroundOverlay} onChange={(e) => onUpdate({ backgroundOverlay: e.target.value })} spellCheck={false} /></div>
                <div className="settings-row"><label>压暗强度</label><div className="range-with-val"><input type="range" min="0" max="70" step="1" value={settings.backgroundDim} onChange={(e) => onUpdate({ backgroundDim: Number(e.target.value) })} /><span>{settings.backgroundDim}</span></div></div>
                <div className="settings-row"><label>背景模糊</label><div className="range-with-val"><input type="range" min="0" max="24" step="1" value={settings.backgroundBlur} onChange={(e) => onUpdate({ backgroundBlur: Number(e.target.value) })} /><span>{settings.backgroundBlur}px</span></div></div>
              </>
            ) : null}
          </div>

          <div className="settings-section">
            <h3>笔记头与导出</h3>
            <div className="settings-row settings-row--col">
              <label htmlFor="settings-display-name">笔记昵称</label>
              <input id="settings-display-name" type="text" className="settings-input" value={settings.displayName} onChange={(e) => onUpdate({ displayName: e.target.value })} placeholder="显示在头像右侧" autoComplete="off" />
            </div>
            <div className="settings-row settings-row--col">
              <span className="settings-label-top">头像</span>
              <div className="settings-avatar-row">
                <img className="settings-avatar-preview" src={settings.avatarSrc} alt="" />
                <div className="settings-avatar-actions">
                  <label className="settings-file-btn">
                    上传图片
                    <input type="file" accept="image/*" className="settings-file-input"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const reader = new FileReader();
                        reader.onload = () => onUpdate({ avatarSrc: reader.result as string });
                        reader.readAsDataURL(file);
                        e.target.value = "";
                      }}
                    />
                  </label>
                  <button type="button" className="settings-mini-btn" onClick={() => onUpdate({ avatarSrc: defaultSettings().avatarSrc })}>默认</button>
                </div>
              </div>
              <input type="text" className="settings-input settings-input--mt"
                value={settings.avatarSrc.startsWith("data:") ? "" : settings.avatarSrc}
                onChange={(e) => onUpdate({ avatarSrc: e.target.value.trim() || defaultSettings().avatarSrc })}
                placeholder={settings.avatarSrc.startsWith("data:") ? "当前为上传图片，可粘贴 https 链接替换" : "图片地址（https 或 /assets/...）"}
                spellCheck={false}
              />
            </div>
            <div className="settings-row settings-row--col">
              <span className="settings-label-top">笔记日期</span>
              <label className="settings-check-row">
                <input type="checkbox" checked={!settings.noteDate?.trim()} onChange={(e) => onUpdate({ noteDate: e.target.checked ? "" : todayIso() })} />
                <span>使用当天日期（每天自动变）</span>
              </label>
              {!settings.noteDate?.trim() ? null : (
                <input type="date" className="settings-input settings-input--mt" value={isoDateOrToday(settings.noteDate)} onChange={(e) => onUpdate({ noteDate: e.target.value })} />
              )}
            </div>
            <div className="settings-row"><label>显示笔记顶栏</label><input type="checkbox" checked={settings.showNoteMeta} onChange={(e) => onUpdate({ showNoteMeta: e.target.checked })} /></div>
            <div className="settings-row">
              <label>导出比例</label>
              <select value={settings.aspectRatio} onChange={(e) => onUpdate({ aspectRatio: e.target.value as EditorSettings["aspectRatio"] })}>
                <option value="3:4">3:4 常规图文</option>
                <option value="3:5">3:5 竖版长图</option>
              </select>
            </div>
            <div className="settings-row">
              <label>顶栏位置</label>
              <select value={settings.noteMetaPosition} onChange={(e) => onUpdate({ noteMetaPosition: e.target.value as EditorSettings["noteMetaPosition"] })}>
                <option value="top">正文上方</option>
                <option value="bottom">正文下方</option>
              </select>
            </div>
            <div className="settings-row">
              <label>顶栏对齐</label>
              <select value={settings.noteMetaAlign} onChange={(e) => onUpdate({ noteMetaAlign: e.target.value as EditorSettings["noteMetaAlign"] })}>
                <option value="left">左对齐</option>
                <option value="center">居中</option>
              </select>
            </div>
            <div className="settings-row"><label>导出宽度（px）</label><div className="range-with-val"><input type="range" min="360" max="450" step="5" value={settings.exportCardWidth} onChange={(e) => onUpdate({ exportCardWidth: Number(e.target.value) })} /><span>{settings.exportCardWidth}px</span></div></div>
            <div className="settings-row"><label>顶栏左侧边距</label><div className="range-with-val"><input type="range" min="0" max="48" step="2" value={settings.noteMetaPadLeft} onChange={(e) => onUpdate({ noteMetaPadLeft: Number(e.target.value) })} /><span>{settings.noteMetaPadLeft}px</span></div></div>
            <div className="settings-row"><label>顶栏右侧边距</label><div className="range-with-val"><input type="range" min="0" max="48" step="2" value={settings.noteMetaPadRight} onChange={(e) => onUpdate({ noteMetaPadRight: Number(e.target.value) })} /><span>{settings.noteMetaPadRight}px</span></div></div>
          </div>

          <div className="settings-section">
            <h3>快速预设</h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
              {PRESETS.map((p) => (
                <button key={p.name} className="preset-chip" onClick={() => onUpdate(p as Partial<EditorSettings>)}>{p.name}</button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
