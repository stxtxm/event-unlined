import { useEffect, useState } from "react";

export default function App() {
  const [mcLoading, setMcLoading] = useState(false);
  const [mcData, setMcData] = useState(null);
  const [mcError, setMcError] = useState("");


  async function loadMinecraft() {
    setMcLoading(true);
    setMcError("");

    try {
      const res = await fetch("/api/minecraft");
      const data = await res.json();
      if (!res.ok || data?.ok === false) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      setMcData(data);
    } catch (e) {
      setMcError(e?.message ?? String(e));
      setMcData(null);
    } finally {
      setMcLoading(false);
    }
  }

  useEffect(() => {
    loadMinecraft();

    const intervalMs = 15000;
    const id = setInterval(() => {
      loadMinecraft();
    }, intervalMs);

    return () => {
      clearInterval(id);
    };
  }, []);

  return (
    <div className="page">
      <div className="mc-shell">
        <div className="mc-header">
          <div className="mc-header-inner">
            <img src="/minecraft.png" alt="Minecraft" className="mc-icon" />
            <div>
              <div className="mc-title">Minecraft Server Status</div>
              <div className="mc-subtitle">
                Refresh auto toutes les <code>15s</code> (et bouton manuel)
              </div>
            </div>
          </div>
        </div>

        <div className="mc-actions">
          <button className="mc-button" onClick={loadMinecraft} disabled={mcLoading}>
            {mcLoading ? "Ping…" : "Rafraîchir"}
          </button>
        </div>

        <div className="mc-panel">
          {mcError ? (
            <div className="mc-error">
              <strong>Erreur:</strong> <code>{mcError}</code>
            </div>
          ) : mcData ? (
            <div className="mc-grid">
              <div className="mc-row">
                <span className="mc-label">Serveur</span>
                <span className="mc-value">
                  <code>
                    {mcData.host}:{mcData.port}
                  </code>
                </span>
              </div>
              <div className="mc-row">
                <span className="mc-label">Version</span>
                <span className="mc-value">
                  <code>{mcData.version || "?"}</code>
                </span>
              </div>
              <div className="mc-row">
                <span className="mc-label">Joueurs</span>
                <span className="mc-value">
                  <code>
                    {mcData.players?.online ?? "?"}/{mcData.players?.max ?? "?"}
                  </code>
                </span>
              </div>
              <div className="mc-row">
                <span className="mc-label">Latence</span>
                <span className="mc-value">
                  <code>{mcData.latency ?? "?"}ms</code>
                </span>
              </div>
              <div className="mc-row mc-row-wide">
                <span className="mc-label">MOTD</span>
                <span className="mc-value">
                  <code>
                    {typeof mcData.motd === "string"
                      ? mcData.motd
                      : mcData.motd?.clean || mcData.motd?.raw || "?"}
                  </code>
                </span>
              </div>
            </div>
          ) : (
            <div className="mc-empty">(Pas de données pour l’instant)</div>
          )}
        </div>
      </div>
    </div>
  );
}
