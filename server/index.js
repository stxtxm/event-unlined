import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { status } from "minecraft-server-util";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 5000;

const corsOrigin = process.env.CORS_ORIGIN || "http://localhost:5173";

app.use(
  cors({
    origin: corsOrigin,
  })
);
app.use(express.json());

app.get("/api/hello", (req, res) => {
  res.json({ message: "Hello depuis Express!" });
});

app.get("/api/minecraft", async (req, res) => {
  const host = req.query.host || process.env.MC_HOST || "event-unlined.gl.joinmc.link";
  const port = Number(req.query.port || process.env.MC_PORT || 25565);

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
