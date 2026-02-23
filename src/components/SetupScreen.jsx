/**
 * SetupScreen.jsx — Root orchestrator (thin file)
 *
 * All pages are split into separate components under ./setup/:
 *   ./setup/Shell.jsx        — sidebar + mobile nav wrapper
 *   ./setup/design.js        — shared CSS animations & constants
 *   ./setup/PageHeader.jsx   — reusable page header
 *   ./setup/pages/HomePage.jsx
 *   ./setup/pages/CouncilPage.jsx
 *   ./setup/pages/AgentPage.jsx
 *   ./setup/pages/VoicePage.jsx
 *   ./setup/pages/WhatsAppPage.jsx
 *
 * Modals (SarvamVoiceChat, WhatsAppGateway) are now mobile-responsive.
 */
import { useState } from "react";
import { Shell } from "./setup/Shell";
import { HomePage } from "./setup/pages/HomePage";
import { CouncilPage } from "./setup/pages/CouncilPage";
import { AgentPage } from "./setup/pages/AgentPage";
import { VoicePage } from "./setup/pages/VoicePage";
import { WhatsAppPage } from "./setup/pages/WhatsAppPage";
import { PersonaCreator } from "./PersonaCreator";
import { SarvamVoiceChat } from "./SarvamVoiceChat";
import { WhatsAppGateway } from "./WhatsAppGateway";
import { useAuth } from "./AuthGate";

export function SetupScreen({
  onLaunch,
  onLaunchAgent,
  customPersonas,
  onUpdateCustomPersonas,
}) {
  const { user, openLogin } = useAuth();
  const [page, setPage] = useState("home");

  const [showCreator, setShowCreator] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  const [personas, setPersonas] = useState(customPersonas ?? []);

  const handlePersonasUpdate = (updated) => {
    setPersonas(updated);
    onUpdateCustomPersonas?.(updated);
  };

  /** Require login before opening a gated modal */
  const requireAuth = (openFn) => {
    if (!user) {
      openLogin?.(); // trigger the AuthGate login flow
      return;
    }
    openFn();
  };

  return (
    <>
      {showCreator && (
        <PersonaCreator
          customPersonas={personas}
          onUpdate={handlePersonasUpdate}
          onClose={() => setShowCreator(false)}
        />
      )}
      {showVoice && <SarvamVoiceChat onClose={() => setShowVoice(false)} />}
      {showWhatsApp && (
        <WhatsAppGateway onClose={() => setShowWhatsApp(false)} />
      )}

      <Shell
        page={page}
        setPage={setPage}
        onOpenCreator={() => setShowCreator(true)}
      >
        {page === "home" && <HomePage setPage={setPage} />}
        {page === "council" && <CouncilPage onLaunch={onLaunch} />}
        {page === "agent" && (
          <AgentPage
            onLaunchAgent={onLaunchAgent}
            customPersonas={personas}
            onOpenCreator={() => setShowCreator(true)}
          />
        )}
        {page === "voice" && (
          <VoicePage onLaunch={() => requireAuth(() => setShowVoice(true))} />
        )}
        {page === "whatsapp" && (
          <WhatsAppPage
            onLaunch={() => requireAuth(() => setShowWhatsApp(true))}
          />
        )}
      </Shell>
    </>
  );
}
