import { useState } from "react";
import {
  tokens,
  formStyles,
  cardStyles,
  buttonStyles,
  layoutStyles,
} from "../styles";

/**
 * MCPPanel — Model Context Protocol server management.
 * Allows users to configure MCP servers that council members can use
 * for tool calls: web search, file system, databases, APIs, etc.
 *
 * Architecture: MCP servers run externally. The council's backend proxy
 * connects to them via stdio or SSE transport. Council members' prompts
 * can reference tool results injected into context.
 */

const MCP_PRESETS = [
  {
    id: "brave_search",
    name: "Brave Search",
    icon: "🔍",
    color: "#f59e0b",
    description:
      "Real-time web search. Council members get current information, not just training data.",
    transport: "sse",
    url: "https://mcp.brave.com/sse",
    needsKey: true,
    keyPlaceholder: "BSA…",
    keyLabel: "Brave Search API Key",
    keyLink: "https://brave.com/search/api",
    capabilities: ["web_search", "news_search"],
    useCases: ["Research queries", "Current events", "Fact checking"],
  },
  {
    id: "filesystem",
    name: "Filesystem",
    icon: "📁",
    color: "#34d399",
    description:
      "Read/write local files. Share documents with the council for analysis.",
    transport: "stdio",
    command: "npx @modelcontextprotocol/server-filesystem",
    needsKey: false,
    needsPath: true,
    pathLabel: "Allowed directories (comma-separated)",
    pathPlaceholder: "/home/user/documents, /tmp",
    capabilities: ["read_file", "write_file", "list_directory"],
    useCases: ["Document review", "Report generation", "Data analysis"],
  },
  {
    id: "github",
    name: "GitHub",
    icon: "🐙",
    color: "#94a3b8",
    description:
      "Read repos, issues, PRs, and code. Let the council review codebases.",
    transport: "sse",
    url: "https://mcp.github.com/sse",
    needsKey: true,
    keyPlaceholder: "ghp_…",
    keyLabel: "GitHub Personal Access Token",
    keyLink: "https://github.com/settings/tokens",
    capabilities: ["read_repo", "list_issues", "read_pr", "search_code"],
    useCases: ["Code review", "Issue triage", "PR analysis"],
  },
  {
    id: "postgres",
    name: "PostgreSQL",
    icon: "🐘",
    color: "#60a5fa",
    description: "Query your database. Council members can analyze real data.",
    transport: "stdio",
    command: "npx @modelcontextprotocol/server-postgres",
    needsKey: false,
    needsConnectionString: true,
    connectionLabel: "Connection string",
    connectionPlaceholder: "postgresql://user:pass@localhost:5432/db",
    capabilities: ["query", "list_tables", "describe_schema"],
    useCases: ["Data analysis", "Query generation", "Schema review"],
  },
  {
    id: "slack",
    name: "Slack",
    icon: "💬",
    color: "#a78bfa",
    description:
      "Read channel history and messages. Analyze team communication.",
    transport: "sse",
    url: "https://mcp.slack.com/sse",
    needsKey: true,
    keyPlaceholder: "xoxb-…",
    keyLabel: "Slack Bot Token",
    keyLink: "https://api.slack.com/apps",
    capabilities: ["read_messages", "list_channels", "search_messages"],
    useCases: ["Team analysis", "Decision history", "Communication audit"],
  },
  {
    id: "puppeteer",
    name: "Web Scraper",
    icon: "🕷️",
    color: "#f472b6",
    description:
      "Browse and scrape websites. Council members can analyze live web content.",
    transport: "stdio",
    command: "npx @modelcontextprotocol/server-puppeteer",
    needsKey: false,
    capabilities: ["navigate", "screenshot", "extract_text", "click"],
    useCases: [
      "Competitor analysis",
      "Content extraction",
      "Live web research",
    ],
  },
  {
    id: "notion",
    name: "Notion",
    icon: "📝",
    color: "#e2e8f0",
    description:
      "Read/write Notion pages and databases. Integrate your knowledge base.",
    transport: "sse",
    url: "https://mcp.notion.com/sse",
    needsKey: true,
    keyPlaceholder: "secret_…",
    keyLabel: "Notion Integration Token",
    keyLink: "https://www.notion.so/my-integrations",
    capabilities: ["read_page", "create_page", "query_database", "update_page"],
    useCases: ["Knowledge base access", "Note taking", "Project tracking"],
  },
  {
    id: "custom",
    name: "Custom MCP Server",
    icon: "⚙️",
    color: "#94a3b8",
    description:
      "Connect any MCP-compatible server via SSE or stdio transport.",
    transport: "sse",
    url: "",
    needsKey: false,
    capabilities: [],
    useCases: [],
  },
];

const TRANSPORT_DOCS = {
  sse: {
    label: "SSE (HTTP)",
    desc: "Server-Sent Events over HTTP/HTTPS. Best for cloud-hosted MCP servers.",
    icon: "🌐",
  },
  stdio: {
    label: "stdio",
    desc: "Standard input/output. For locally-installed MCP servers via npx/node.",
    icon: "💻",
  },
};

function PresetCard({ preset, isConnected, onConnect }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.02)",
        border: `1px solid ${isConnected ? preset.color + "55" : tokens.borderSubtle}`,
        borderRadius: 12,
        overflow: "hidden",
        transition: "border-color 0.15s",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          padding: "13px 16px",
          cursor: "pointer",
        }}
        onClick={() => setExpanded((e) => !e)}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 9,
            background: `${preset.color}18`,
            border: `1px solid ${preset.color}44`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 18,
            flexShrink: 0,
          }}
        >
          {preset.icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: tokens.textPrimary,
              }}
            >
              {preset.name}
            </span>
            {isConnected && (
              <span
                style={{
                  fontSize: 10,
                  color: "#34d399",
                  background: "rgba(52,211,153,0.1)",
                  border: "1px solid rgba(52,211,153,0.25)",
                  borderRadius: 4,
                  padding: "1px 6px",
                }}
              >
                ● CONNECTED
              </span>
            )}
            <span
              style={{
                fontSize: 10,
                color: tokens.textFaint,
                background: "rgba(255,255,255,0.04)",
                border: `1px solid ${tokens.borderSubtle}`,
                borderRadius: 4,
                padding: "1px 6px",
                marginLeft: "auto",
              }}
            >
              {TRANSPORT_DOCS[preset.transport]?.icon}{" "}
              {TRANSPORT_DOCS[preset.transport]?.label}
            </span>
          </div>
          <div style={{ fontSize: 11, color: tokens.textMuted, marginTop: 2 }}>
            {preset.description}
          </div>
        </div>
        <span style={{ fontSize: 10, color: tokens.textFaint }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {expanded && (
        <div
          style={{
            padding: "0 16px 16px",
            borderTop: `1px solid ${tokens.borderSubtle}`,
          }}
        >
          {/* Capabilities */}
          {preset.capabilities?.length > 0 && (
            <div style={{ marginTop: 12, marginBottom: 12 }}>
              <div
                style={{
                  fontSize: 10,
                  color: tokens.textFaint,
                  letterSpacing: 1,
                  marginBottom: 6,
                  textTransform: "uppercase",
                }}
              >
                Tools Available
              </div>
              <div style={{ display: "flex", gap: 5, flexWrap: "wrap" }}>
                {preset.capabilities.map((c) => (
                  <span
                    key={c}
                    style={{
                      fontSize: 10,
                      padding: "2px 8px",
                      borderRadius: 4,
                      background: `${preset.color}15`,
                      color: preset.color,
                      border: `1px solid ${preset.color}30`,
                      fontFamily: "monospace",
                    }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Use cases */}
          {preset.useCases?.length > 0 && (
            <div
              style={{
                fontSize: 11,
                color: tokens.textFaint,
                marginBottom: 12,
              }}
            >
              💡 {preset.useCases.join(" · ")}
            </div>
          )}

          <button
            onClick={() => onConnect(preset)}
            style={{
              width: "100%",
              padding: "9px",
              borderRadius: 8,
              border: `1px solid ${preset.color}55`,
              background: `${preset.color}12`,
              color: preset.color,
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {isConnected ? "⚙ Configure" : `+ Connect ${preset.name}`}
          </button>
        </div>
      )}
    </div>
  );
}

function ConnectionForm({ preset, onSave, onCancel }) {
  const [url, setUrl] = useState(preset.url || "");
  const [apiKey, setApiKey] = useState("");
  const [path, setPath] = useState("");
  const [connectionString, setConnectionString] = useState("");
  const [name, setName] = useState(preset.name);
  const [enabled, setEnabled] = useState(true);

  const canSave = name.trim() && (preset.needsKey ? apiKey.trim() : true);

  return (
    <div
      style={{
        ...cardStyles.formPanel,
        border: `1px solid ${preset.color}44`,
        marginTop: 0,
        animation: "slideDown 0.2s ease",
      }}
    >
      <div
        style={{
          fontSize: 14,
          fontWeight: 700,
          color: "#fff",
          marginBottom: 16,
          display: "flex",
          alignItems: "center",
          gap: 8,
        }}
      >
        <span>{preset.icon}</span> Configure {preset.name}
      </div>

      <div style={{ marginBottom: 12 }}>
        <label style={formStyles.label}>Server Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={formStyles.input}
          placeholder={preset.name}
        />
      </div>

      {(preset.transport === "sse" || preset.id === "custom") && (
        <div style={{ marginBottom: 12 }}>
          <label style={formStyles.label}>Server URL</label>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            style={formStyles.input}
            placeholder={preset.url || "https://…/sse"}
          />
        </div>
      )}

      {preset.transport === "stdio" && preset.command && (
        <div style={{ marginBottom: 12 }}>
          <label style={formStyles.label}>Command</label>
          <div
            style={{
              ...formStyles.input,
              fontFamily: "monospace",
              fontSize: 12,
              color: tokens.textMuted,
              background: "rgba(0,0,0,0.3)",
              cursor: "default",
            }}
          >
            {preset.command}
          </div>
        </div>
      )}

      {preset.needsKey && (
        <div style={{ marginBottom: 12 }}>
          <label style={formStyles.label}>
            {preset.keyLabel}
            {preset.keyLink && (
              <a
                href={preset.keyLink}
                target="_blank"
                rel="noreferrer"
                style={{ marginLeft: 8, color: preset.color, fontSize: 10 }}
              >
                Get key →
              </a>
            )}
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            style={formStyles.input}
            placeholder={preset.keyPlaceholder}
          />
        </div>
      )}

      {preset.needsPath && (
        <div style={{ marginBottom: 12 }}>
          <label style={formStyles.label}>{preset.pathLabel}</label>
          <input
            value={path}
            onChange={(e) => setPath(e.target.value)}
            style={formStyles.input}
            placeholder={preset.pathPlaceholder}
          />
        </div>
      )}

      {preset.needsConnectionString && (
        <div style={{ marginBottom: 12 }}>
          <label style={formStyles.label}>{preset.connectionLabel}</label>
          <input
            type="password"
            value={connectionString}
            onChange={(e) => setConnectionString(e.target.value)}
            style={formStyles.input}
            placeholder={preset.connectionPlaceholder}
          />
        </div>
      )}

      <div style={{ ...cardStyles.infoBox, marginBottom: 14, fontSize: 11 }}>
        ⚠ MCP servers run as external processes. Ensure your server is running
        and accessible from the backend proxy before connecting.
      </div>

      <div style={{ display: "flex", gap: 8 }}>
        <button
          onClick={onCancel}
          style={{ ...buttonStyles.ghost, flex: 1, padding: 9 }}
        >
          Cancel
        </button>
        <button
          onClick={() =>
            onSave({
              ...preset,
              name: name.trim(),
              url,
              apiKey,
              path,
              connectionString,
              enabled,
            })
          }
          disabled={!canSave}
          style={{
            flex: 2,
            padding: 9,
            borderRadius: 8,
            border: "none",
            background: canSave
              ? `linear-gradient(135deg,${preset.color},${preset.color}99)`
              : "rgba(255,255,255,0.05)",
            color: canSave ? "#fff" : tokens.textFaint,
            cursor: canSave ? "pointer" : "not-allowed",
            fontSize: 13,
            fontWeight: 600,
          }}
        >
          Save Connection
        </button>
      </div>
    </div>
  );
}

export function MCPPanel({ connections = [], onClose, onUpdate }) {
  const [activePreset, setActivePreset] = useState(null);
  const [tab, setTab] = useState("browse"); // browse | connected | docs

  const handleSave = (config) => {
    const next = [...connections.filter((c) => c.id !== config.id), config];
    onUpdate(next);
    setActivePreset(null);
  };

  const handleDisconnect = (id) => {
    onUpdate(connections.filter((c) => c.id !== id));
  };

  return (
    <>
      <div onClick={onClose} style={layoutStyles.backdrop} />
      <div style={{ ...layoutStyles.sidePanel, width: "min(500px, 100vw)" }}>
        {/* Header */}
        <div
          style={{
            padding: "16px 18px",
            borderBottom: `1px solid ${tokens.borderSubtle}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            position: "sticky",
            top: 0,
            background: tokens.bgPanel,
            zIndex: 1,
          }}
        >
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>
              🔌 MCP Servers
            </div>
            <div
              style={{
                fontSize: 10,
                color: tokens.textFaint,
                letterSpacing: 1,
                marginTop: 1,
              }}
            >
              MODEL CONTEXT PROTOCOL · {connections.length} CONNECTED
            </div>
          </div>
          <button onClick={onClose} style={buttonStyles.iconSquare}>
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{
            display: "flex",
            borderBottom: `1px solid ${tokens.borderSubtle}`,
            flexShrink: 0,
          }}
        >
          {[
            { id: "browse", label: "Browse Servers" },
            { id: "connected", label: `Connected (${connections.length})` },
            { id: "docs", label: "How It Works" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: "11px 8px",
                border: "none",
                background: "transparent",
                color: tab === t.id ? "#c4b5fd" : tokens.textMuted,
                cursor: "pointer",
                fontSize: 12,
                fontWeight: tab === t.id ? 700 : 400,
                borderBottom:
                  tab === t.id ? "2px solid #a78bfa" : "2px solid transparent",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "16px 18px" }}>
          {tab === "browse" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activePreset ? (
                <ConnectionForm
                  preset={activePreset}
                  onSave={handleSave}
                  onCancel={() => setActivePreset(null)}
                />
              ) : (
                MCP_PRESETS.map((preset) => (
                  <PresetCard
                    key={preset.id}
                    preset={preset}
                    isConnected={connections.some((c) => c.id === preset.id)}
                    onConnect={setActivePreset}
                  />
                ))
              )}
            </div>
          )}

          {tab === "connected" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {connections.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: 40,
                    color: tokens.textFaint,
                  }}
                >
                  <div style={{ fontSize: 36, marginBottom: 12, opacity: 0.4 }}>
                    🔌
                  </div>
                  <div style={{ fontSize: 13 }}>No MCP servers connected.</div>
                  <div
                    style={{
                      fontSize: 11,
                      marginTop: 6,
                      color: tokens.textFaint,
                    }}
                  >
                    Browse servers and connect one to get started.
                  </div>
                </div>
              ) : (
                connections.map((c) => (
                  <div
                    key={c.id}
                    style={{
                      padding: "13px 16px",
                      background: "rgba(52,211,153,0.05)",
                      border: "1px solid rgba(52,211,153,0.2)",
                      borderRadius: 12,
                    }}
                  >
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 10 }}
                    >
                      <span style={{ fontSize: 20 }}>{c.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: "#fff",
                          }}
                        >
                          {c.name}
                        </div>
                        <div
                          style={{
                            fontSize: 11,
                            color: tokens.textFaint,
                            fontFamily: "monospace",
                          }}
                        >
                          {c.url || c.command || "stdio"}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        <button
                          onClick={() => setActivePreset(c)}
                          style={{
                            ...buttonStyles.ghost,
                            padding: "4px 10px",
                            fontSize: 11,
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDisconnect(c.id)}
                          style={{
                            ...buttonStyles.iconSquare,
                            color: "#f87171",
                            borderColor: "rgba(248,113,113,0.3)",
                          }}
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                    {c.capabilities?.length > 0 && (
                      <div
                        style={{
                          display: "flex",
                          gap: 5,
                          flexWrap: "wrap",
                          marginTop: 10,
                        }}
                      >
                        {c.capabilities.map((cap) => (
                          <span
                            key={cap}
                            style={{
                              fontSize: 10,
                              padding: "1px 7px",
                              borderRadius: 4,
                              background: "rgba(52,211,153,0.1)",
                              color: "#34d399",
                              border: "1px solid rgba(52,211,153,0.2)",
                              fontFamily: "monospace",
                            }}
                          >
                            {cap}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {tab === "docs" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ ...cardStyles.infoBox }}>
                <strong
                  style={{
                    fontSize: 13,
                    color: "#fff",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  What is MCP?
                </strong>
                Model Context Protocol (MCP) is an open standard that lets AI
                models connect to external tools, data sources, and services.
                Instead of being limited to training data, council members can
                use MCP tools to fetch real-time data, search the web, query
                databases, or interact with external APIs.
              </div>

              {[
                {
                  step: "1",
                  title: "Choose a Server",
                  desc: "Browse presets or add a custom MCP server. Each server provides specific tools (web search, file access, database queries, etc.).",
                },
                {
                  step: "2",
                  title: "Connect & Configure",
                  desc: "Provide API keys or connection details. The council's backend proxy connects to the MCP server on your behalf.",
                },
                {
                  step: "3",
                  title: "Tools Become Available",
                  desc: "When a council member's response needs real-time data, the backend calls the appropriate MCP tool and injects results into context.",
                },
                {
                  step: "4",
                  title: "Richer Deliberation",
                  desc: "Members can now cite live search results, query your actual data, or read files — grounding the council in reality, not just training data.",
                },
              ].map((item) => (
                <div key={item.step} style={{ display: "flex", gap: 14 }}>
                  <div
                    style={{
                      width: 28,
                      height: 28,
                      borderRadius: "50%",
                      background: "rgba(167,139,250,0.15)",
                      border: "1px solid rgba(167,139,250,0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                      color: "#a78bfa",
                      flexShrink: 0,
                    }}
                  >
                    {item.step}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: tokens.textPrimary,
                        marginBottom: 4,
                      }}
                    >
                      {item.title}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: tokens.textMuted,
                        lineHeight: 1.6,
                      }}
                    >
                      {item.desc}
                    </div>
                  </div>
                </div>
              ))}

              <div style={{ ...cardStyles.warnBox }}>
                ⚠ MCP integration requires a running backend server. Ensure{" "}
                <code style={{ fontFamily: "monospace", fontSize: 11 }}>
                  ENABLE_MCP=true
                </code>{" "}
                is set in your deployment environment.
              </div>

              <a
                href="https://modelcontextprotocol.io"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "block",
                  textAlign: "center",
                  padding: "10px",
                  borderRadius: 8,
                  border: `1px solid rgba(167,139,250,0.3)`,
                  background: "rgba(167,139,250,0.06)",
                  color: "#c4b5fd",
                  fontSize: 12,
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                📖 MCP Documentation →
              </a>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
