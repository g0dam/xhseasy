/**
 * EmojiPanel.tsx — 表情选择面板
 */

import { EMOJIS } from "@/utils/constants";

interface EmojiPanelProps {
  open: boolean;
  onSelect: (emoji: string) => void;
  onClose: () => void;
}

export function EmojiPanel({ open, onSelect, onClose }: EmojiPanelProps) {
  return (
    <div id="emoji-panel" className={open ? "open" : ""}>
      <div className="emoji-grid">
        {EMOJIS.map((e) => (
          <button
            key={e}
            className="emoji-btn"
            onClick={() => { onSelect(e); onClose(); }}
          >
            {e}
          </button>
        ))}
      </div>
    </div>
  );
}
