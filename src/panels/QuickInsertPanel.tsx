/**
 * QuickInsertPanel.tsx — 快捷插入面板（标题/引用/代码等）
 */

import { QUICK_INSERT_ITEMS, type QuickInsertItem } from "@/utils/constants";

interface QuickInsertPanelProps {
  open: boolean;
  onInsert: (text: string) => void;
  onWrap?: (before: string, after: string) => void;
  onClose: () => void;
}

export function QuickInsertPanel({
  open,
  onInsert,
  onWrap,
  onClose,
}: QuickInsertPanelProps) {
  const handleInsert = (item: QuickInsertItem) => {
    if ("wrap" in item) {
      onWrap?.(item.wrap[0], item.wrap[1]);
    } else if ("text" in item) {
      onInsert(item.text);
    } else {
      onInsert(item.prefix);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <div
      id="quick-insert-panel"
      className="quick-insert-panel"
    >
      {QUICK_INSERT_ITEMS.map((item, idx) => (
        <button
          key={idx}
          onClick={() => handleInsert(item)}
          className="quick-insert-panel__button"
        >
          <span>{item.icon}</span>
          <span>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
