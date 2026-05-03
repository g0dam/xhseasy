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
      style={{
        position: "fixed",
        bottom: "60px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "#fff",
        border: "1px solid #e0e0e0",
        borderRadius: "12px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
        padding: "10px",
        zIndex: 150,
        display: "flex",
        flexWrap: "wrap",
        gap: "6px",
        width: "280px",
      }}
    >
      {QUICK_INSERT_ITEMS.map((item, idx) => (
        <button
          key={idx}
          onClick={() => handleInsert(item)}
          style={{
            padding: "6px 12px",
            border: "1px solid #ddd",
            borderRadius: "6px",
            background: "#fafafa",
            fontSize: "12px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>{item.icon}</span>
          <span style={{ color: "#666" }}>{item.label}</span>
        </button>
      ))}
    </div>
  );
}
