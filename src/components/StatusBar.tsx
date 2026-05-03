/**
 * StatusBar.tsx — 预览区底部状态栏
 *
 * 展示字数、行数、预估阅读时间、分片数、内容健康度与快捷操作提示。
 */

import { useMemo } from "react";
import type { ThemeConfig } from "@/types";
import { analyzeContent, evaluateContentHealth } from "@/utils/smartFeatures";

// ============================================================
// Props
// ============================================================

export interface StatusBarProps {
  markdown: string;
  theme: ThemeConfig;
  estimatedSlices?: number;
  mode?: "edit" | "preview" | "split";
  detailed?: boolean;
}

// ============================================================
// 子组件
// ============================================================

function StatItem({
  label,
  value,
  icon,
  tooltip,
}: {
  label: string;
  value: string | number;
  icon?: string;
  tooltip?: string;
}) {
  return (
    <div
      title={tooltip}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "5px",
        padding: "6px 10px",
        background: "rgba(255,255,255,0.62)",
        borderRadius: "12px",
        border: "1px solid rgba(108,76,33,0.08)",
        cursor: tooltip ? "help" : "default",
        boxShadow: "0 6px 16px rgba(61,42,18,0.04)",
      }}
    >
      {icon && <span style={{ fontSize: "10px" }}>{icon}</span>}
      <span style={{ fontSize: "11px", color: "#8a7661" }}>{label}</span>
      <span
        style={{
          fontSize: "11px",
          fontWeight: 700,
          color: "#2d2219",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {value}
      </span>
    </div>
  );
}

// ============================================================
// StatusBar
// ============================================================

export function StatusBar({
  markdown,
  theme,
  estimatedSlices = 1,
  mode = "split",
  detailed = false,
}: StatusBarProps) {
  const stats = useMemo(() => analyzeContent(markdown), [markdown]);
  const health = useMemo(
    () => evaluateContentHealth(markdown, theme),
    [markdown, theme]
  );

  const readTimeDisplay = useMemo(() => {
    if (stats.readTimeMinutes < 1) {
      return `${Math.ceil(stats.readTimeSeconds)} 秒`;
    }
    return `${stats.readTimeMinutes} 分钟`;
  }, [stats]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "8px 12px",
        margin: "8px 12px 0",
        background: "rgba(255,251,246,0.62)",
        border: "1px solid rgba(108,76,33,0.06)",
        borderRadius: "14px",
        backdropFilter: "blur(10px) saturate(1.02)",
        flexWrap: "wrap",
        gap: "8px",
        fontSize: "11px",
        fontFamily:
          'system-ui,"PingFang SC","Microsoft YaHei",sans-serif',
        boxShadow: "0 10px 24px rgba(61,42,18,0.05)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          flexWrap: "wrap",
        }}
      >
        <StatItem
          label="字数"
          value={stats.wordCount}
          icon="📝"
          tooltip={`字符数（含标点）：${stats.charCount}`}
        />
        <StatItem
          label="分片"
          value={`${estimatedSlices} 张`}
          icon="📄"
          tooltip="根据当前预览页数统计"
        />
        <StatItem
          label="健康"
          value={`${health.score}`}
          icon="●"
          tooltip={health.suggestions[0]?.message ?? `内容健康度 ${health.score}/100`}
        />
        <StatItem
          label="阅读"
          value={readTimeDisplay}
          icon="⏱"
          tooltip={`约 ${stats.readTimeMinutes} 分钟读完（参考）`}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <div
          style={{
            padding: "3px 8px",
            background: "rgba(108,76,33,0.08)",
            borderRadius: "999px",
            fontSize: "10px",
            color: "#6b5845",
          }}
        >
          {mode === "edit"
            ? "编辑"
            : mode === "preview"
              ? "预览"
              : "分栏"}
        </div>

        {detailed ? (
          <div style={{ display: "flex", gap: "6px", fontSize: "10px", color: "#999" }}>
            <kbd
              style={{
                padding: "1px 4px",
                background: "#f0f0f0",
                border: "1px solid #ddd",
                borderRadius: "3px",
                fontSize: "9px",
                fontFamily: "monospace",
                color: "#666",
              }}
            >
              Ctrl+S
            </kbd>
            <span>刷新</span>
            <kbd
              style={{
                padding: "1px 4px",
                background: "#f0f0f0",
                border: "1px solid #ddd",
                borderRadius: "3px",
                fontSize: "9px",
                fontFamily: "monospace",
                color: "#666",
              }}
            >
              Ctrl+E
            </kbd>
            <span>导出</span>
          </div>
        ) : null}
      </div>
    </div>
  );
}

// ============================================================
// MiniStatusBar
// ============================================================

export function MiniStatusBar({
  markdown,
  pretextLoaded,
}: {
  markdown: string;
  pretextLoaded?: boolean;
}) {
  const stats = useMemo(() => analyzeContent(markdown), [markdown]);

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontSize: "11px",
        color: "#8a7661",
        fontFamily:
          'system-ui,"PingFang SC","Microsoft YaHei",sans-serif',
      }}
    >
      <span>字数 {stats.wordCount}</span>
      <span>行 {stats.lineCount}</span>
      <span>图 {stats.imageCount}</span>
      {pretextLoaded !== undefined && (
        <span
          style={{
            color: pretextLoaded ? "#22c55e" : "#f59e0b",
          }}
        >
          {pretextLoaded ? "测量已就绪" : "测量加载中"}
        </span>
      )}
    </div>
  );
}
