const express = require("express");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");
const db = require("../db");

const router = express.Router();

const uploadsDir = path.join(__dirname, "..", "uploads", "templates");
fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `${uuidv4()}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extOk = allowed.test(path.extname(file.originalname).toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    cb(extOk && mimeOk ? null : new Error("Only image files are allowed"), extOk && mimeOk);
  },
});

// Serve uploaded template images (mounted at app level: /api/uploads)

// List templates
router.get("/", (req, res) => {
  const templates = db.listTemplates({ published: req.query.published === "true" });
  res.json(templates);
});

// Get single template
router.get("/:id", (req, res) => {
  const t = db.getTemplate(req.params.id);
  if (!t) return res.status(404).json({ error: "Template not found" });
  res.json(t);
});

// Upload a new template (draft)
router.post("/", upload.single("template"), (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No template file uploaded" });
  const name = req.body.name || req.file.originalname;
  const originalPath = `templates/${req.file.filename}`;
  const template = db.createTemplate({
    name,
    filename: req.file.filename,
    originalPath,
    width: req.body.width ? Number(req.body.width) : null,
    height: req.body.height ? Number(req.body.height) : null,
  });
  res.status(201).json(template);
});

// Update template (name, status, frames)
router.put("/:id", express.json(), (req, res) => {
  const { name, status, frames } = req.body;
  const fields = {};
  if (name !== undefined) fields.name = name;
  if (status !== undefined) fields.status = status;
  if (frames !== undefined) fields.frames = frames;
  if (Object.keys(fields).length === 0) return res.status(400).json({ error: "Nothing to update" });
  const t = db.updateTemplate(req.params.id, fields);
  if (!t) return res.status(404).json({ error: "Template not found" });
  res.json(t);
});

// Publish template
router.post("/:id/publish", (req, res) => {
  const t = db.publishTemplate(req.params.id);
  if (!t) return res.status(404).json({ error: "Template not found" });
  res.json(t);
});

// Delete template
router.delete("/:id", (req, res) => {
  const t = db.getTemplate(req.params.id);
  if (!t) return res.status(404).json({ error: "Template not found" });
  const filePath = path.join(__dirname, "..", t.original_path);
  try { fs.unlinkSync(filePath); } catch (e) { /* ignore */ }
  db.deleteTemplate(req.params.id);
  res.json({ ok: true });
});

module.exports = router;
