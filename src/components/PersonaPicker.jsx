import { useState, useRef, useEffect } from "react";
import { PERSONAS, PERSONA_GROUPS } from "../constants/personas";
import { tokens } from "../styles";

/**
 * PersonaPicker — replaces the native <select> for persona selection.
 * Renders a searchable dropdown with grouped cards showing icon + label + prompt preview.
 *
 * Props:
 *   value      string   — selected persona id
 *   onChange   fn       — called with new persona id
 *   accentColor string  — border/highlight color
 */
export function PersonaPicker({
  value,
  onChange,
  accentColor = tokens.primary,
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeGroup, setActiveGroup] = useState(null);
  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const selected = PERSONAS.find((p) => p.id === value);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setOpen(false);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  const filteredGroups = query
    ? [
        {
          id: "search",
          label: "Search Results",
          color: accentColor,
          ids: PERSONAS.filter(
            (p) =>
              p.label.toLowerCase().includes(query.toLowerCase()) ||
              p.prompt.toLowerCase().includes(query.toLowerCase()),
          ).map((p) => p.id),
        },
      ]
    : activeGroup
      ? PERSONA_GROUPS.filter((g) => g.id === activeGroup)
      : PERSONA_GROUPS;

  const handleSelect = (pid) => {
    onChange(pid);
    setOpen(false);
    setQuery("");
    setActiveGroup(null);
  };

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      {/* ── Trigger Button ── */}
      <button
        onClick={() => setOpen((o) => !o)}
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "10px 13px",
          background: tokens.bgInput,
          border: `1px solid ${open ? accentColor + "80" : tokens.borderStrong}`,
          borderRadius: open ? "8px 8px 0 0" : 8,
          color: tokens.textPrimary,
          cursor: "pointer",
          textAlign: "left",
          transition: "border-color 0.15s, border-radius 0.1s",
        }}
      >
        <span style={{ fontSize: 18, flexShrink: 0 }}>
          {selected?.icon || "◈"}
        </span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: tokens.textPrimary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {selected?.label || "Select Persona"}
          </div>
          {selected?.category && (
            <div
              style={{ fontSize: 10, color: tokens.textFaint, marginTop: 1 }}
            >
              {PERSONA_GROUPS.find((g) => g.id === selected.category)?.label ||
                selected.category}
            </div>
          )}
        </div>
        {selected?.chairSuggest && (
          <span
            style={{
              fontSize: 10,
              color: "#f59e0b",
              background: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.3)",
              borderRadius: 4,
              padding: "1px 6px",
              flexShrink: 0,
            }}
          >
            👑 Chair
          </span>
        )}
        <span style={{ fontSize: 10, color: tokens.textFaint, flexShrink: 0 }}>
          {open ? "▲" : "▼"}
        </span>
      </button>

      {/* ── Dropdown Panel ── */}
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            zIndex: 300,
            background: "#0e0e1c",
            border: `1px solid ${accentColor}55`,
            borderTop: "none",
            borderRadius: "0 0 12px 12px",
            boxShadow: "0 24px 60px rgba(0,0,0,0.8)",
            maxHeight: 440,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* Search bar */}
          <div
            style={{
              padding: "10px 12px",
              borderBottom: `1px solid ${tokens.borderSubtle}`,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "rgba(255,255,255,0.04)",
                borderRadius: 7,
                padding: "7px 11px",
                border: `1px solid ${tokens.borderSubtle}`,
              }}
            >
              <span style={{ fontSize: 13, color: tokens.textFaint }}>🔍</span>
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setActiveGroup(null);
                }}
                placeholder="Search personas…"
                style={{
                  flex: 1,
                  background: "none",
                  border: "none",
                  outline: "none",
                  color: tokens.textPrimary,
                  fontSize: 13,
                  fontFamily: "inherit",
                }}
              />
              {query && (
                <button
                  onClick={() => setQuery("")}
                  style={{
                    background: "none",
                    border: "none",
                    color: tokens.textFaint,
                    cursor: "pointer",
                    fontSize: 11,
                    padding: 0,
                  }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>

          {/* Group filter pills */}
          {!query && (
            <div
              style={{
                display: "flex",
                gap: 6,
                padding: "8px 12px",
                overflowX: "auto",
                flexShrink: 0,
                borderBottom: `1px solid ${tokens.borderSubtle}`,
              }}
            >
              <button
                onClick={() => setActiveGroup(null)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 20,
                  border: `1px solid ${!activeGroup ? accentColor + "88" : tokens.borderSubtle}`,
                  background: !activeGroup ? `${accentColor}18` : "transparent",
                  color: !activeGroup ? accentColor : tokens.textMuted,
                  cursor: "pointer",
                  fontSize: 11,
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                All
              </button>
              {PERSONA_GROUPS.map((grp) => (
                <button
                  key={grp.id}
                  onClick={() =>
                    setActiveGroup(grp.id === activeGroup ? null : grp.id)
                  }
                  style={{
                    padding: "4px 10px",
                    borderRadius: 20,
                    border: `1px solid ${activeGroup === grp.id ? grp.color + "88" : tokens.borderSubtle}`,
                    background:
                      activeGroup === grp.id ? `${grp.color}18` : "transparent",
                    color:
                      activeGroup === grp.id ? grp.color : tokens.textMuted,
                    cursor: "pointer",
                    fontSize: 11,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                  }}
                >
                  {grp.label}
                </button>
              ))}
            </div>
          )}

          {/* Persona list */}
          <div
            style={{
              overflowY: "auto",
              flex: 1,
              overscrollBehavior: "contain",
            }}
          >
            {filteredGroups.map((grp) => {
              const personas = grp.ids
                .map((id) => PERSONAS.find((p) => p.id === id))
                .filter(Boolean);
              if (!personas.length) return null;
              return (
                <div key={grp.id}>
                  <div
                    style={{
                      padding: "8px 14px 4px",
                      fontSize: 10,
                      color: tokens.textFaint,
                      letterSpacing: 1.2,
                      fontWeight: 700,
                      textTransform: "uppercase",
                      borderBottom: `1px solid ${tokens.borderSubtle}`,
                    }}
                  >
                    {grp.label}
                  </div>
                  {personas.map((p) => {
                    const isSel = p.id === value;
                    return (
                      <PersonaRow
                        key={p.id}
                        persona={p}
                        isSelected={isSel}
                        accentColor={isSel ? accentColor : grp.color}
                        onSelect={() => handleSelect(p.id)}
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function PersonaRow({ persona, isSelected, accentColor, onSelect }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      onMouseDown={(e) => {
        e.preventDefault();
        onSelect();
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: "100%",
        display: "flex",
        alignItems: "flex-start",
        gap: 11,
        padding: "10px 14px",
        background: isSelected
          ? `${accentColor}14`
          : hovered
            ? "rgba(255,255,255,0.03)"
            : "transparent",
        border: "none",
        borderBottom: `1px solid ${tokens.borderSubtle}`,
        color: tokens.textPrimary,
        cursor: "pointer",
        textAlign: "left",
        transition: "background 0.1s",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: `${accentColor}15`,
          border: `1px solid ${isSelected || hovered ? accentColor + "55" : "transparent"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 16,
          flexShrink: 0,
          transition: "border-color 0.1s",
        }}
      >
        {persona.icon || "◈"}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 7,
            marginBottom: 3,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 600,
              color: isSelected ? accentColor : tokens.textPrimary,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {persona.label}
          </span>
          {persona.chairSuggest && (
            <span
              style={{
                fontSize: 9,
                color: "#f59e0b",
                background: "rgba(245,158,11,0.1)",
                border: "1px solid rgba(245,158,11,0.25)",
                borderRadius: 3,
                padding: "1px 5px",
                flexShrink: 0,
              }}
            >
              CHAIR
            </span>
          )}
        </div>
        {persona.prompt && (
          <div
            style={{
              fontSize: 11,
              color: tokens.textFaint,
              lineHeight: 1.45,
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
            }}
          >
            {persona.prompt.slice(0, 110)}
            {persona.prompt.length > 110 ? "…" : ""}
          </div>
        )}
      </div>

      {/* Check */}
      {isSelected && (
        <span
          style={{
            color: accentColor,
            fontSize: 14,
            flexShrink: 0,
            marginTop: 2,
          }}
        >
          ✓
        </span>
      )}
    </button>
  );
}
