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
      
      if (data.error || !data.players) {
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
        version: typeof data.version === 'string' ? data.version : (data.version?.name || "Inconnue"),
        players: {
          online: data.players?.online || 0,
          max: data.players?.max || 0,
        },
        motd: typeof data.description === 'string' ? data.description : (data.description?.text || "Aucun MOTD"),
        latency: data.latency ? `${Math.round(data.latency)}ms` : "-",
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

    const intervalMs = 30000;
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
              <div className="mc-title">Event-Unlined</div>
            </div>
          </div>
        </div>

        <div className="mc-panel">
          {mcError ? (
            <div className="mc-error">
              <strong>Erreur:</strong> <code>{mcError}</code>
            </div>
          ) : mcData ? (
            <div className="mc-grid">
              <div className="mc-server-info">
                <div className="mc-server-name">
                  {mcData.port === 25565 ? mcData.host : `${mcData.host}:${mcData.port}`}
                </div>
              </div>
              <div className="mc-stats-grid">
                <div className="mc-stat-card">
                  <div className="mc-stat-label">Version</div>
                  <div className="mc-stat-value">{mcData.version}</div>
                </div>
                <div className="mc-stat-card">
                  <div className="mc-stat-label">Joueurs</div>
                  <div className="mc-stat-value">{mcData.players?.online ?? "?"}/{mcData.players?.max ?? "?"}</div>
                </div>
                <div className="mc-stat-card">
                  <div className="mc-stat-label">Latence</div>
                  <div className="mc-stat-value">{mcData.latency ?? "?"}</div>
                </div>
                <div className="mc-stat-card">
                  <div className="mc-stat-label">MOTD</div>
                  <div className="mc-stat-value">
                    <code>
                      {typeof mcData.motd === "string"
                        ? mcData.motd
                        : mcData.motd?.clean || mcData.motd?.raw || "?"}
                    </code>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="mc-empty">(Pas de données pour l'instant)</div>
          )}
        </div>
      </div>
    </div>
  );
}
