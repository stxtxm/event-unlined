import { useEffect, useState } from "react";

export default function App() {
  const [mcLoading, setMcLoading] = useState(false);
  const [mcData, setMcData] = useState(null);
  const [mcError, setMcError] = useState("");

  async function loadMinecraft() {
    setMcLoading(true);
    setMcError("");

    try {
      // Load server config
      const configRes = await fetch("/event-unlined/server-config.json");
      const config = await configRes.json();
      
      // Use API that supports CORS
      const apiUrl = `https://api.minetools.eu/ping/${config.host}/${config.port}`;
      const res = await fetch(apiUrl);
      const data = await res.json();
      
      if (data.error) {
        setMcData({
          host: config.host,
          port: config.port,
          version: "Hors ligne",
          players: {
            online: 0,
            max: 0,
          },
          motd: "Serveur hors ligne",
          latency: "-",
        });
        return;
      }
      
      setMcData({
        host: config.host,
        port: config.port,
        version: data.version || "Inconnue",
        players: {
          online: data.players?.online || 0,
          max: data.players?.max || 0,
        },
        motd: data.description || "Aucun MOTD",
        latency: data.latency || "-",
      });
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
            <img src="/event-unlined/minecraft.png" alt="Minecraft" className="mc-icon" />
            <div>
              <div className="mc-title">Server Status</div>
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
