import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import { status } from "minecraft-server-util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

const corsOrigin = process.env.CORS_ORIGIN || "*";

app.use(
  cors({
    origin: corsOrigin,
  })
);
app.use(express.json());

const configPath = path.join(__dirname, "mc-config.json");

let mcConfig = { host: "event-unlined.gl.joinmc.link", port: 25565 };

// Charger la config depuis le fichier au démarrage
try {
  const raw = fs.readFileSync(configPath, "utf-8");
  const parsed = JSON.parse(raw);
  if (parsed.host && parsed.port) {
    mcConfig = { host: parsed.host, port: Number(parsed.port) };
  }
} catch (error) {
  console.error("Error reading config file:", error);
  // Si le fichier n'existe pas, le créer avec la config par défaut
  fs.writeFileSync(configPath, JSON.stringify(mcConfig, null, 2) + "\n", "utf-8");
}

app.post("/api/minecraft/config", (req, res) => {
  const { url } = req.body;
  if (!url || typeof url !== "string") {
    return res.status(400).json({ ok: false, error: "Paramètre 'url' requis et doit être une chaîne" });
  }

  // Simple parsing host:port ou juste host
  const parts = url.trim().split(":");
  const host = parts[0];
  const port = parts[1] ? Number(parts[1]) : 25565;

  if (!host) {
    return res.status(400).json({ ok: false, error: "URL invalide" });
  }

  mcConfig = { host, port };
  fs.writeFileSync(configPath, JSON.stringify(mcConfig, null, 2) + "\n", "utf-8");

  res.json({ ok: true, ...mcConfig });
});

app.get("/api/minecraft", async (req, res) => {
  const host = req.query.host || mcConfig.host;
  const port = Number(req.query.port || mcConfig.port);

  try {
    const result = await status(host, port, {
      timeout: 5000,
      enableSRV: true,
    });

    res.json({
      ok: true,
      host,
      port,
      latency: result.roundTripLatency,
      version: result.version?.name,
      players: {
        online: result.players?.online,
        max: result.players?.max,
        sample: result.players?.sample ?? [],
      },
      motd: result.motd,
      favicon: result.favicon,
    });
  } catch (e) {
    res.status(502).json({
      ok: false,
      host,
      port,
      error: e?.message ?? String(e),
    });
  }
});

app.use(express.static(path.join(__dirname, "../client/dist")));

app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../client/dist", "index.html"));
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});
