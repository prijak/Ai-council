import { useState, useEffect } from "react";
import { tokens, formStyles, cardStyles, buttonStyles } from "../styles";
import { PROVIDERS, ACCENT_COLORS, ACCENT_ICONS } from "../constants/providers";
import { PERSONAS, PERSONA_GROUPS } from "../constants/personas";
import { fetchModels } from "../lib/api";
import { loadConfigs, deleteConfig } from "../lib/storage";
import { cloudLoadConfigs, cloudDeleteConfig } from "../lib/cloudStorage";
import { useAuth } from "./AuthGate";
import { uid } from "../lib/utils";
import { Spin, Toggle } from "./atoms";
import { ModelPicker } from "./ModelPicker";
import { SavedConfigCard, SaveConfigRow } from "./SavedConfig";
import { SystemPromptEditor } from "./SystemPromptEditor";

export function MemberForm({
  onAdd,
  onCancel,
  slotIndex,
  currentChairmanId,
  editMember = null,
}) {
  const isEdit = !!editMember;
  const { user, isAnonymous } = useAuth();
  const isCloud = !!(user && !isAnonymous);
  const [prov, setProv] = useState(editMember?.provider || "ollama");
  const [endpoint, setEndpoint] = useState(
    editMember?.endpoint || "http://localhost:11434",
  );
  const [apiKey, setApiKey] = useState(editMember?.apiKey || "");
  const [model, setModel] = useState(editMember?.model || "");
  const [name, setName] = useState(editMember?.name || "");
  const [personaId, setPersonaId] = useState(
    editMember
      ? PERSONAS.find((p) => p.prompt === editMember.systemPrompt)?.id ||
          "custom"
      : "analyst",
  );
  const [customSys, setCustomSys] = useState(() => {
    if (!editMember) return "";
    const m = PERSONAS.find(
      (p) => p.id !== "custom" && p.prompt === editMember.systemPrompt,
    );
    return m ? "" : editMember.systemPrompt || "";
  });
  const [isChairman, setIsChairman] = useState(false);
  const [fetched, setFetched] = useState([]);
  const [fetching, setFetching] = useState(false);
  const [fetchErr, setFetchErr] = useState("");
  const [chairMsg, setChairMsg] = useState("");
  const [configs, setConfigs] = useState([]);
  const [loadingCfg, setLoadingCfg] = useState(true);

  useEffect(() => {
    if (isCloud) {
      cloudLoadConfigs(user.uid).then((c) => {
        setConfigs(c);
        setLoadingCfg(false);
      });
    } else {
      loadConfigs().then((c) => {
        setConfigs(c);
        setLoadingCfg(false);
      });
    }
  }, [isCloud]);

  const pInfo = PROVIDERS[prov];
  const color = ACCENT_COLORS[slotIndex % ACCENT_COLORS.length];
  const icon = ACCENT_ICONS[slotIndex % ACCENT_ICONS.length];
  const suggestions = fetched.length ? fetched : pInfo.suggestedModels;
  const personaObj = PERSONAS.find((p) => p.id === personaId);
  const canAdd =
    name.trim() && model.trim() && (pInfo.needsKey ? apiKey.trim() : true);

  const handleProvChange = (p) => {
    setProv(p);
    setEndpoint(PROVIDERS[p].defaultEndpoint || "");
    setModel("");
    setFetched([]);
    setFetchErr("");
  };

  const handlePersonaChange = (pid) => {
    setPersonaId(pid);
    const p = PERSONAS.find((x) => x.id === pid);
    if (p?.chairSuggest && !currentChairmanId) {
      setIsChairman(true);
      setChairMsg(
        "👑 Auto-selected — this persona is the natural synthesizer.",
      );
    } else setChairMsg("");
  };

  const handleLoadConfig = (cfg) => {
    handleProvChange(cfg.provider);
    setEndpoint(cfg.endpoint || PROVIDERS[cfg.provider]?.defaultEndpoint || "");
    setApiKey(cfg.apiKey || "");
    setModel(cfg.model || "");
    setFetched([]);
  };

  const handleDeleteConfig = async (id) => {
    if (isCloud) {
      await cloudDeleteConfig(user.uid, id);
      setConfigs((prev) => prev.filter((c) => c.id !== id));
    } else {
      const next = await deleteConfig(id);
      setConfigs(next);
    }
  };

  const doFetch = async () => {
    if (pInfo.needsKey && !apiKey.trim()) {
      setFetchErr("Enter your API key first.");
      return;
    }
    setFetching(true);
    setFetchErr("");
    try {
      const ms = await fetchModels(prov, endpoint, apiKey);
      setFetched(ms);
      if (ms.length && !model) setModel(ms[0]);
    } catch (e) {
      setFetchErr(e.message);
    } finally {
      setFetching(false);
    }
  };

  const doAdd = () => {
    if (!canAdd) return;
    onAdd({
      ...(editMember || {}),
      id: editMember?.id || uid(),
      name: name.trim(),
      provider: prov,
      model: model.trim(),
      endpoint: endpoint.trim(),
      apiKey: apiKey.trim(),
      personaLabel: personaObj.label,
      systemPrompt:
        personaId === "custom"
          ? customSys
          : customSys.trim()
            ? customSys
            : personaObj.prompt,
      color: editMember?.color || color,
      icon: editMember?.icon || icon,
      isChairman,
    });
  };

  return (
    <div
      style={{
        ...cardStyles.formPanel,
        border: `1px solid ${editMember?.color || color}44`,
        position: "relative",
      }}
    >
      {/* ── Top close button ── */}
      <button
        onClick={onCancel}
        title="Close"
        style={{
          position: "absolute",
          top: 14,
          right: 14,
          width: 28,
          height: 28,
          borderRadius: 7,
          border: `1px solid ${tokens.borderSubtle}`,
          background: "rgba(255,255,255,0.04)",
          color: tokens.textMuted,
          cursor: "pointer",
          fontSize: 13,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "rgba(248,113,113,0.4)";
          e.currentTarget.style.color = "#fca5a5";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = tokens.borderSubtle;
          e.currentTarget.style.color = tokens.textMuted;
        }}
      >
        ✕
      </button>

      {!loadingCfg && configs.length > 0 && (
        <div style={{ marginBottom: 22 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 10,
            }}
          >
            <label style={formStyles.label}>
              Saved Configs ({configs.length})
            </label>
            <span style={{ fontSize: 11, color: tokens.textMuted }}>
              Loads provider · model · key only
            </span>
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 7,
              maxHeight: 200,
              overflowY: "auto",
            }}
          >
            {configs.map((cfg) => (
              <SavedConfigCard
                key={cfg.id}
                cfg={cfg}
                onLoad={handleLoadConfig}
                onDelete={handleDeleteConfig}
              />
            ))}
          </div>
          <div style={formStyles.divider} />
        </div>
      )}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 20,
        }}
      >
        <div
          style={{
            width: 34,
            height: 34,
            borderRadius: 9,
            background: `${editMember?.color || color}20`,
            border: `1px solid ${editMember?.color || color}55`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 17,
            color: editMember?.color || color,
          }}
        >
          {editMember?.icon || icon}
        </div>
        <span
          style={{ fontSize: 14, fontWeight: 600, color: tokens.textPrimary }}
        >
          {isEdit ? "Edit Member" : "Configure Member"}
        </span>
      </div>

      {/* Provider selector */}
      <div style={{ marginBottom: 18 }}>
        <label style={formStyles.label}>Provider</label>
        <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
          {Object.entries(PROVIDERS)
            .filter(([, p]) => !p.managed || isCloud)
            .map(([k, p]) => (
              <button
                key={k}
                onClick={() => handleProvChange(k)}
                style={{
                  padding: "6px 12px",
                  borderRadius: 8,
                  cursor: "pointer",
                  fontSize: 12,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  border: `1px solid ${prov === k ? p.color + "99" : tokens.borderSubtle}`,
                  background: prov === k ? `${p.color}18` : "transparent",
                  color: prov === k ? p.color : tokens.textMuted,
                }}
              >
                <span>{p.icon}</span>
                <span>{p.name}</span>
              </button>
            ))}
        </div>
        {pInfo.hint && (
          <div
            style={{
              ...cardStyles.warnBox,
              marginTop: 9,
              fontSize: 11,
              lineHeight: 1.5,
            }}
          >
            ⚠ {pInfo.hint}
          </div>
        )}
        {prov === "ollama" && (
          <div
            style={{
              marginTop: 8,
              padding: "10px 12px",
              background: "rgba(52,211,153,0.05)",
              border: "1px solid rgba(52,211,153,0.2)",
              borderRadius: 8,
              fontSize: 11,
              color: "#6ee7b7",
              lineHeight: 1.6,
            }}
          >
            <strong>🔧 CORS fix for reverse proxy (nginx):</strong>
            <br />
            Add to your location block:
            <br />
            <code
              style={{
                fontFamily: "monospace",
                color: "#a7f3d0",
                display: "block",
                marginTop: 4,
              }}
            >
              add_header 'Access-Control-Allow-Origin' '*';
              <br />
              add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
              <br />
              add_header 'Access-Control-Allow-Headers' 'Content-Type';
              <br />
              if ($request_method = 'OPTIONS') {"{ return 204; }"}
            </code>
          </div>
        )}
      </div>

      {/* Endpoint / API Key */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            pInfo.needsEndpoint && pInfo.needsKey ? "1fr 1fr" : "1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        {pInfo.needsEndpoint && (
          <div>
            <label style={formStyles.label}>Endpoint URL</label>
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder={pInfo.defaultEndpoint}
              style={formStyles.input}
            />
          </div>
        )}
        {pInfo.needsKey && (
          <div>
            <label style={formStyles.label}>API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-…"
              style={formStyles.input}
            />
          </div>
        )}
      </div>

      {/* Model — uses improved ModelPicker from v2 */}
      <div style={{ marginBottom: 12 }}>
        <label style={formStyles.label}>Model</label>
        <ModelPicker
          value={model}
          onChange={setModel}
          suggestions={suggestions}
          placeholder={suggestions[0] || "model-name"}
          accentColor={pInfo.color || tokens.primary}
          onFetchClick={pInfo.canFetchModels ? doFetch : null}
          fetching={fetching}
        />
        {fetchErr && (
          <div style={{ fontSize: 11, color: tokens.danger, marginTop: 4 }}>
            ⚠ {fetchErr}
          </div>
        )}
        {fetched.length > 0 && !fetchErr && (
          <div style={{ fontSize: 11, color: tokens.success, marginTop: 4 }}>
            ✓ {fetched.length} models loaded
          </div>
        )}
      </div>

      {/* Name + Persona */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <label style={formStyles.label}>Display Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Gemini Flash"
            style={formStyles.input}
          />
        </div>
        <div>
          <label style={formStyles.label}>Persona</label>
          <select
            value={personaId}
            onChange={(e) => handlePersonaChange(e.target.value)}
            style={{ ...formStyles.input, cursor: "pointer" }}
          >
            {PERSONA_GROUPS.map((grp) => (
              <optgroup key={grp.label} label={grp.label}>
                {grp.ids.map((pid) => {
                  const p = PERSONAS.find((x) => x.id === pid);
                  return p ? (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ) : null;
                })}
              </optgroup>
            ))}
          </select>
        </div>
      </div>

      {chairMsg && (
        <div
          style={{
            ...cardStyles.infoBox,
            marginBottom: 10,
            background: "rgba(167,139,250,0.08)",
            border: `1px solid rgba(167,139,250,0.25)`,
            color: "#c4b5fd",
          }}
        >
          {chairMsg}
        </div>
      )}

      {personaId === "custom" ? (
        <div style={{ marginBottom: 14 }}>
          <label style={formStyles.label}>System Prompt</label>
          <textarea
            value={customSys}
            onChange={(e) => setCustomSys(e.target.value)}
            rows={4}
            style={{ ...formStyles.input, resize: "vertical", lineHeight: 1.6 }}
            placeholder="Describe how this member should think and respond…"
          />
        </div>
      ) : (
        <SystemPromptEditor
          prompt={personaObj?.prompt || ""}
          override={customSys}
          accentColor={editMember?.color || color}
          onChange={(val) => setCustomSys(val)}
        />
      )}

      {!isEdit && (
        <div style={{ marginBottom: 18 }}>
          <Toggle
            on={isChairman}
            onChange={() => setIsChairman((c) => !c)}
            label={
              isChairman
                ? "👑 Chairman — will synthesize the final verdict"
                : "Designate as Chairman"
            }
          />
          {currentChairmanId && isChairman && (
            <div
              style={{
                fontSize: 11,
                color: tokens.warning,
                marginTop: 5,
                marginLeft: 48,
              }}
            >
              ⚠ This will replace the current Chairman
            </div>
          )}
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <SaveConfigRow
          prov={prov}
          endpoint={endpoint}
          apiKey={apiKey}
          model={model}
          onSaved={setConfigs}
        />
      </div>

      <div style={{ display: "flex", gap: 9 }}>
        <button
          onClick={onCancel}
          style={{
            ...buttonStyles.ghost,
            flex: 1,
            padding: 11,
            borderRadius: 8,
          }}
        >
          Cancel
        </button>
        <button
          onClick={doAdd}
          disabled={!canAdd}
          style={{
            flex: 2,
            padding: 11,
            borderRadius: 8,
            border: "none",
            fontSize: 14,
            fontWeight: 600,
            background: canAdd
              ? `linear-gradient(135deg,${editMember?.color || color},${ACCENT_COLORS[(slotIndex + 2) % ACCENT_COLORS.length]})`
              : "rgba(255,255,255,0.05)",
            color: canAdd ? "#fff" : tokens.textFaint,
            cursor: canAdd ? "pointer" : "not-allowed",
          }}
        >
          {isEdit ? "Save Changes ✓" : "Add to Council →"}
        </button>
      </div>
    </div>
  );
}
