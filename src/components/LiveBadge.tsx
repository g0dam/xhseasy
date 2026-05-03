/**
 * LiveBadge.tsx — 实时状态徽章
 */

interface LiveBadgeProps {
  text: string;
  isError: boolean;
}

export function LiveBadge({ text, isError }: LiveBadgeProps) {
  if (!text) return null;
  return (
    <span id="live-badge" style={{
      background: isError ? "#ffe8e8" : "#e8f5e9",
      color: isError ? "#8b0000" : "#1b5e20",
    }}>
      {text}
    </span>
  );
}
