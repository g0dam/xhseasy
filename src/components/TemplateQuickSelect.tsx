/**
 * TemplateQuickSelect.tsx — 模板快捷选择下拉组件
 */

import { useState } from "react";
import { getBuiltInTemplates } from "@/templates/index";
import type { NoteTemplate } from "@/templates/index";

interface TemplateQuickSelectProps {
  onSelect: (template: NoteTemplate) => void;
  onOpenGallery: () => void;
}

export function TemplateQuickSelect({ onSelect, onOpenGallery }: TemplateQuickSelectProps) {
  const [open, setOpen] = useState(false);
  const templates = getBuiltInTemplates();

  return (
    <div style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          padding: "5px 11px",
          borderRadius: "7px",
          border: "1px solid #ccc",
          background: "#fff",
          fontSize: "12px",
          cursor: "pointer",
        }}
      >
        模板
      </button>

      {open && (
        <>
          <div
            onClick={() => setOpen(false)}
            style={{ position: "fixed", inset: 0, zIndex: 149 }}
          />
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              marginTop: "4px",
              background: "#fff",
              border: "1px solid #e0e0e0",
              borderRadius: "10px",
              boxShadow: "0 6px 24px rgba(0,0,0,0.12)",
              padding: "8px",
              zIndex: 150,
              display: "flex",
              flexDirection: "column",
              gap: "8px",
              width: "240px",
            }}
          >
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {templates.map((t: NoteTemplate) => (
                <button
                  key={t.id}
                  onClick={() => { onSelect(t); setOpen(false); }}
                  style={{
                    padding: "6px 10px",
                    border: "1px solid #ddd",
                    borderRadius: "6px",
                    background: t.card.background,
                    color: t.colors.primary,
                    fontSize: "11px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    minWidth: "70px",
                  }}
                  title={t.description}
                >
                  <span>{t.thumbnail}</span>
                  <span>{t.name}</span>
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenGallery();
              }}
              style={{
                width: "100%",
                padding: "6px 8px",
                border: "1px dashed #c45c26",
                borderRadius: "8px",
                background: "rgba(196,92,38,0.06)",
                color: "#c45c26",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              浏览全部模板…
            </button>
          </div>
        </>
      )}
    </div>
  );
}
