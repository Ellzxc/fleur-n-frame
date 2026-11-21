const express = require("express");
const cors = require("cors");
const path = require("path");
const templatesRoute = require("./routes/templates");
const db = require("./db");

const app = express();
const PORT = process.env.PORT || 5000;

const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: "10mb" }));

app.use("/api/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/templates", templatesRoute);

// Photo session routes
app.post("/api/photos", express.json(), (req, res) => {
  const { sessionId, photos } = req.body;
  if (!sessionId || !photos) return res.status(400).json({ error: "Missing sessionId or photos" });
  const session = db.createPhotoSession(sessionId, photos);
  res.status(201).json(session);
});

app.get("/api/photos/:sessionId", (req, res) => {
  const session = db.getPhotoSession(req.params.sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json(session);
});

app.get("/api/health", (req, res) => res.json({ ok: true }));

app.listen(PORT, () => {
  console.log(`Fleur 'N Frame server running on http://localhost:${PORT}`);
});
