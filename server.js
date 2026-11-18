
const express = require("express");
const crypto = require("crypto");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const sessions = new Map();

app.post("/api/create", (req, res) => {
  const id = crypto.randomUUID();
  sessions.set(id, {
    location: null,
    sharing: false,
    createdAt: Date.now()
  });

  res.json({
    id,
    shareLink: `/share/${id}`,
    viewLink: `/view/${id}`
  });
});

app.post("/api/share/:id", (req, res) => {
  const session = sessions.get(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Session not found" });
  }

  const { latitude, longitude, consent } = req.body;

  if (consent !== true) {
    return res.status(403).json({ error: "Consent required" });
  }

  if (
    typeof latitude !== "number" ||
    typeof longitude !== "number" ||
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    Math.abs(latitude) > 90 ||
    Math.abs(longitude) > 180
  ) {
    return res.status(400).json({ error: "Invalid coordinates" });
  }

  session.location = { latitude, longitude };
  session.sharing = true;

  res.json({ success: true });
});

app.get("/api/view/:id", (req, res) => {
  const session = sessions.get(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Not found" });
  }

  res.json(session);
});

app.post("/api/stop/:id", (req, res) => {
  const session = sessions.get(req.params.id);

  if (!session) {
    return res.status(404).json({ error: "Not found" });
  }

  session.location = null;
  session.sharing = false;

  res.json({ success: true });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});
