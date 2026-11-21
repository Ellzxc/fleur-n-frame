const express = require("express");
const multer = require("multer");
const { cloudinary } = require("../cloudinary");
const db = require("../db");

const router = express.Router();

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = /jpeg|jpg|png|webp/;
    const extOk = allowed.test(file.originalname.toLowerCase());
    const mimeOk = allowed.test(file.mimetype);
    cb(extOk && mimeOk ? null : new Error("Only image files are allowed"), extOk && mimeOk);
  },
});

// List templates
router.get("/", (req, res) => {
  db.listTemplates({ published: req.query.published === "true" })
    .then((templates) => res.json(templates))
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Get single template
router.get("/:id", (req, res) => {
  db.getTemplate(req.params.id)
    .then((t) => {
      if (!t) return res.status(404).json({ error: "Template not found" });
      res.json(t);
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Upload a new template (draft) to Cloudinary
router.post("/", upload.single("template"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No template file uploaded" });
    const name = req.body.name || req.file.originalname;

    const uploadResp = await cloudinary.uploader.upload(req.file.buffer, {
      folder: "fleur-n-frame/templates",
      resource_type: "image",
    });

    const originalPath = uploadResp.secure_url;
    const template = await db.createTemplate({
      name,
      filename: req.file.originalname,
      originalPath,
      width: req.body.width ? Number(req.body.width) : null,
      height: req.body.height ? Number(req.body.height) : null,
    });
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update template (name, status, frames)
router.put("/:id", express.json(), (req, res) => {
  const { name, status, frames } = req.body;
  const fields = {};
  if (name !== undefined) fields.name = name;
  if (status !== undefined) fields.status = status;
  if (frames !== undefined) fields.frames = frames;
  if (Object.keys(fields).length === 0) return res.status(400).json({ error: "Nothing to update" });
  db.updateTemplate(req.params.id, fields)
    .then((t) => {
      if (!t) return res.status(404).json({ error: "Template not found" });
      res.json(t);
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Publish template
router.post("/:id/publish", (req, res) => {
  db.publishTemplate(req.params.id)
    .then((t) => {
      if (!t) return res.status(404).json({ error: "Template not found" });
      res.json(t);
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

// Delete template
router.delete("/:id", (req, res) => {
  db.deleteTemplate(req.params.id)
    .then((t) => {
      if (!t) return res.status(404).json({ error: "Template not found" });
      res.json({ ok: true });
    })
    .catch((err) => res.status(500).json({ error: err.message }));
});

module.exports = router;
