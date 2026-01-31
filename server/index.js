import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import simpleGit from "simple-git";
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

const git = simpleGit(__dirname);
const dbPath = path.join(__dirname, "mc.db");

let db;

async function initDbAndGit() {
  // Git pull au démarrage pour récupérer la dernière BDD
  try {
    await git.pull("origin", "master");
  } catch (e) {
    console.warn("git pull failed (maybe first time):", e.message);
  }

  // Init SQLite
  db = await open({
    filename: dbPath,
    driver: sqlite3.Database,
  });
  await db.exec(`
    CREATE TABLE IF NOT EXISTS minecraft_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      host TEXT NOT NULL,
      port INTEGER NOT NULL DEFAULT 25565,
      updated_at INTEGER NOT NULL
    );
    INSERT OR IGNORE INTO minecraft_config (id, host, port, updated_at)
    VALUES (1, 'event-unlined.gl.joinmc.link', 25565, unixepoch());
  `);

  // Si le dépôt n’existe pas encore, l’initialiser
  try {
    await git.status();
  } catch {
    await git.init();
    await git.addConfig("user.name", "Render Bot");
    await git.addConfig("user.email", "bot@render.com");
  }

  // Ajouter mc.db au suivi Git s’il n’est pas déjà suivi
  const statusRes = await git.status();
  if (!statusRes.current.includes("mc.db")) {
    await git.add(dbPath);
    await git.commit("init: add mc.db");
    try {
      await git.push();
    } catch (e) {
      console.warn("git push failed (maybe no remote yet):", e.message);
    }
  }
}

initDbAndGit();

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello depuis Express!" });
});

app.get("/api/minecraft/config", async (req, res) => {
  const cfg = await db.get("SELECT host, port FROM minecraft_config WHERE id = 1");
  res.json({ ok: true, host: cfg?.host || "event-unlined.gl.joinmc.link", port: cfg?.port || 25565 });
});

app.post("/api/minecraft/config", async (req, res) => {
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

  await db.run(
    `UPDATE minecraft_config SET host = ?, port = ?, updated_at = unixepoch() WHERE id = 1`,
    [host, port]
  );

  // Git add/commit/push pour persister
  try {
    await git.add(dbPath);
    await git.commit(`update: minecraft config to ${host}:${port}`);
    await git.push("origin", "master");
  } catch (e) {
    console.error("Git push failed:", e);
    // On continue même si le push échoue (la BDD est à jour localement)
  }

  res.json({ ok: true, host, port });
});

app.get("/api/minecraft", async (req, res) => {
  const cfg = await db.get("SELECT host, port FROM minecraft_config WHERE id = 1");
  const host = req.query.host || cfg?.host || "event-unlined.gl.joinmc.link";
  const port = Number(req.query.port || cfg?.port || 25565);

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
