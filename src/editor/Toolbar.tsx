/**
 * Toolbar.tsx — 工具栏按钮组件（内嵌在编辑区上方）
 */

interface ToolbarProps {
  onInsertPageTemplate: () => void;
  onInsertDivider: () => void;
  onWrapBold: () => void;
  onWrapItalic: () => void;
}

export function Toolbar({ onInsertPageTemplate, onInsertDivider, onWrapBold, onWrapItalic }: ToolbarProps) {
  return (
    <div className="editor-bar">
      <button onClick={onWrapBold}>B</button>
      <button onClick={onWrapItalic}>I</button>
      <div className="bar-sep" />
      <button onClick={onInsertPageTemplate}>封面页</button>
      <button onClick={onInsertDivider}>分隔</button>
    </div>
  );
}
