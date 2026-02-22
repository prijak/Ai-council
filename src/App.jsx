import { useState } from "react";
import { SetupScreen } from "./components/SetupScreen";
import { DeliberationScreen } from "./components/DeliberationScreen";
import { AgentScreen } from "./components/AgentScreen";
import { InstallPrompt } from "./components/InstallPrompt";
import { AuthGate } from "./components/AuthGate";

function AppInner() {
  const [screen, setScreen] = useState("setup"); // "setup" | "council" | "agent"
  const [members, setMembers] = useState([]);
  const [chairId, setChairId] = useState(null);
  const [activePersona, setActivePersona] = useState(null);
  const [customPersonas, setCustomPersonas] = useState([]);

  const launchCouncil = (m, id) => {
    setMembers(m);
    setChairId(id);
    setScreen("council");
  };

  const launchAgent = (persona) => {
    setActivePersona(persona);
    setScreen("agent");
  };

  return (
    <>
      <InstallPrompt />
      {screen === "setup" && (
        <SetupScreen
          onLaunch={launchCouncil}
          onLaunchAgent={launchAgent}
          customPersonas={customPersonas}
          onUpdateCustomPersonas={setCustomPersonas}
        />
      )}
      {screen === "council" && (
        <DeliberationScreen
          initialMembers={members}
          initialChairmanId={chairId}
          onReset={() => setScreen("setup")}
        />
      )}
      {screen === "agent" && (
        <AgentScreen
          initialPersona={activePersona}
          customPersonas={customPersonas}
          onBack={() => setScreen("setup")}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AuthGate>
      <AppInner />
    </AuthGate>
  );
}
