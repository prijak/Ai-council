import { useState, useRef, useEffect, useCallback } from "react";
import { tokens } from "../styles";

/**
 * ModelPicker — replaces the plain <input list="datalist"> for model selection.
 *
 * Props:
 *   value        string   — currently selected model
 *   onChange     fn       — called with new model string
 *   suggestions  string[] — list of model ids (fetched or static)
 *   placeholder  string
 *   accentColor  string   — provider accent colour for theming
 *   onFetchClick fn|null  — if set, shows a "↻ Fetch" button
 *   fetching     bool
 */
export function ModelPicker({
  value,
  onChange,
  suggestions = [],
  placeholder = "model-name",
  accentColor = tokens.primary,
  onFetchClick = null,
  fetching = false,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || "");
  const [focused, setFocused] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const wrapRef = useRef(null);

  // Keep query in sync with external value changes (e.g. when loading a config)
  useEffect(() => {
    setQuery(value || "");
  }, [value]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        commitAndClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open, query]);

  const filtered = suggestions.filter((m) =>
    m.toLowerCase().includes(query.toLowerCase()),
  );

  const commitAndClose = useCallback(() => {
    onChange(query.trim());
    setOpen(false);
    setFocused(false);
  }, [query, onChange]);

  const select = (model) => {
    setQuery(model);
    onChange(model);
    setOpen(false);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      commitAndClose();
      return;
    }
    if (e.key === "Enter") {
      if (open && filtered.length === 1) {
        select(filtered[0]);
      } else {
        commitAndClose();
      }
      return;
    }
    if (e.key === "ArrowDown" && open) {
      e.preventDefault();
      listRef.current?.querySelector("button")?.focus();
    }
  };

  const handleItemKeyDown = (e, model, idx) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      select(model);
    }
    if (e.key === "Escape") {
      commitAndClose();
      inputRef.current?.focus();
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      const items = listRef.current?.querySelectorAll("button");
      items?.[idx + 1]?.focus();
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      if (idx === 0) inputRef.current?.focus();
      else listRef.current?.querySelectorAll("button")?.[idx - 1]?.focus();
    }
  };

  const isSelected = (m) => m === value;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {/* ── Input row ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          background: tokens.bgInput,
          border: `1px solid ${focused || open ? accentColor + "80" : tokens.borderStrong}`,
          borderRadius: open ? "8px 8px 0 0" : 8,
          transition: "border-color 0.15s, border-radius 0.1s",
          overflow: "hidden",
        }}
      >
        {/* Search icon */}
        <span
          style={{
            paddingLeft: 11,
            fontSize: 13,
            color: tokens.textFaint,
            flexShrink: 0,
          }}
        >
          {open ? "🔍" : "◈"}
        </span>

        <input
          ref={inputRef}
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => setFocused(false)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          spellCheck={false}
          autoComplete="off"
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            color: tokens.textPrimary,
            fontSize: 14,
            padding: "10px 8px",
            fontFamily: "inherit",
            minWidth: 0,
          }}
        />

        {/* Clear button */}
        {query && (
          <button
            onMouseDown={(e) => {
              e.preventDefault();
              setQuery("");
              onChange("");
              inputRef.current?.focus();
              setOpen(true);
            }}
            style={{ ...iconBtn, marginRight: 2 }}
            title="Clear"
          >
            ✕
          </button>
        )}

        {/* Chevron */}
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            setOpen((o) => !o);
            inputRef.current?.focus();
          }}
          style={{
            ...iconBtn,
            marginRight: 4,
            fontSize: 10,
            color: open ? accentColor : tokens.textFaint,
          }}
          title={open ? "Close" : "Open"}
        >
          {open ? "▲" : "▼"}
        </button>

        {/* Fetch button */}
        {onFetchClick && (
          <button
            onClick={onFetchClick}
            disabled={fetching}
            title="Fetch live models"
            style={{
              padding: "0 12px",
              height: "100%",
              minHeight: 40,
              borderLeft: `1px solid ${tokens.borderStrong}`,
              background: fetching ? "transparent" : `${accentColor}12`,
              color: fetching ? tokens.textFaint : accentColor,
              cursor: fetching ? "wait" : "pointer",
              fontSize: 11,
              fontWeight: 600,
              whiteSpace: "nowrap",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {fetching ? (
              <>
                <SpinMini color={tokens.textFaint} /> Fetching…
              </>
            ) : (
              "↻ Fetch"
            )}
          </button>
        )}
      </div>

      {/* ── Dropdown ── */}
      {open && (
        <div
          ref={listRef}
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 200,
            background: "#111120",
            border: `1px solid ${accentColor}55`,
            borderTop: "none",
            borderRadius: "0 0 8px 8px",
            boxShadow: "0 16px 40px rgba(0,0,0,0.7)",
            maxHeight: 260,
            overflowY: "auto",
            overscrollBehavior: "contain",
          }}
        >
          {filtered.length === 0 ? (
            <div
              style={{
                padding: "14px 14px",
                color: tokens.textFaint,
                fontSize: 12,
                textAlign: "center",
              }}
            >
              {query ? (
                <>
                  No match — press Enter to use{" "}
                  <strong style={{ color: tokens.textSecondary }}>
                    "{query}"
                  </strong>
                </>
              ) : (
                "No models — click ↻ Fetch or type manually"
              )}
            </div>
          ) : (
            <>
              {/* Count badge */}
              <div
                style={{
                  padding: "6px 12px 4px",
                  fontSize: 10,
                  color: tokens.textFaint,
                  letterSpacing: 0.8,
                  borderBottom: `1px solid ${tokens.borderSubtle}`,
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <span>MODELS</span>
                <span>
                  {filtered.length}{" "}
                  {filtered.length !== suggestions.length
                    ? `of ${suggestions.length}`
                    : ""}
                </span>
              </div>

              {filtered.map((model, idx) => {
                const sel = isSelected(model);
                return (
                  <button
                    key={model}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      select(model);
                    }}
                    onKeyDown={(e) => handleItemKeyDown(e, model, idx)}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "9px 12px",
                      background: sel ? `${accentColor}18` : "transparent",
                      border: "none",
                      borderBottom: `1px solid ${tokens.borderSubtle}`,
                      color: sel ? accentColor : tokens.textPrimary,
                      cursor: "pointer",
                      fontSize: 13,
                      textAlign: "left",
                      fontFamily: "monospace",
                      transition: "background 0.1s",
                    }}
                    onMouseEnter={(e) => {
                      if (!sel)
                        e.currentTarget.style.background =
                          "rgba(255,255,255,0.04)";
                    }}
                    onMouseLeave={(e) => {
                      if (!sel)
                        e.currentTarget.style.background = "transparent";
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        width: 14,
                        textAlign: "center",
                        flexShrink: 0,
                        color: sel ? accentColor : tokens.textFaint,
                      }}
                    >
                      {sel ? "✓" : ""}
                    </span>
                    <span
                      style={{
                        flex: 1,
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap",
                      }}
                    >
                      <Highlight
                        text={model}
                        query={query}
                        accentColor={accentColor}
                      />
                    </span>
                    {/* Tag: quantization hint */}
                    {model.includes(":") && (
                      <span
                        style={{
                          fontSize: 10,
                          color: tokens.textFaint,
                          background: "rgba(255,255,255,0.05)",
                          padding: "1px 6px",
                          borderRadius: 4,
                          flexShrink: 0,
                        }}
                      >
                        {model.split(":")[1]}
                      </span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function Highlight({ text, query, accentColor }) {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <span style={{ color: accentColor, fontWeight: 700 }}>
        {text.slice(idx, idx + query.length)}
      </span>
      {text.slice(idx + query.length)}
    </>
  );
}

function SpinMini({ color }) {
  return (
    <span
      style={{
        display: "inline-block",
        width: 10,
        height: 10,
        flexShrink: 0,
        border: `2px solid ${color}28`,
        borderTop: `2px solid ${color}`,
        borderRadius: "50%",
        animation: "spin 0.65s linear infinite",
      }}
    />
  );
}

const iconBtn = {
  background: "none",
  border: "none",
  color: tokens.textFaint,
  cursor: "pointer",
  fontSize: 11,
  padding: "4px 5px",
  borderRadius: 4,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};
