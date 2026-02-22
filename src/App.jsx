import { useState } from "react";
import { SetupScreen } from "./components/SetupScreen";
import { DeliberationScreen } from "./components/DeliberationScreen";

export default function App() {
  const [screen, setScreen] = useState("setup");
  const [members, setMembers] = useState([]);
  const [chairId, setChairId] = useState(null);

  const launch = (m, id) => {
    setMembers(m);
    setChairId(id);
    setScreen("council");
  };

  return screen === "setup" ? (
    <SetupScreen onLaunch={launch} />
  ) : (
    <DeliberationScreen
      initialMembers={members}
      initialChairmanId={chairId}
      onReset={() => setScreen("setup")}
    />
  );
}
