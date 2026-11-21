const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "data.json");

function ensureFile() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify({ templates: [], photos: [] }, null, 2));
  }
}

function readData() {
  ensureFile();
  return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
}

function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

function parseFrames(t) {
  if (t == null) return [];
  if (typeof t.frames === "string") {
    try {
      const arr = JSON.parse(t.frames);
      return Array.isArray(arr) ? arr : [];
    } catch (e) { return []; }
  }
  if (Array.isArray(t.frames)) return t.frames;
  return [];
}

const db = {
  listTemplates({ published } = {}) {
    const data = readData();
    let templates = data.templates || [];
    if (published === true || published === "true") {
      templates = templates.filter((t) => t.status === "published");
    }
    return templates
      .map((t) => ({ ...t, frames: parseFrames(t) }))
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  },

  getTemplate(id) {
    const data = readData();
    const t = (data.templates || []).find((x) => x.id == id);
    if (!t) return null;
    return { ...t, frames: parseFrames(t) };
  },

  createTemplate({ name, filename, originalPath, width, height }) {
    const data = readData();
    const id = Date.now().toString();
    const now = new Date().toISOString();
    const template = {
      id,
      name,
      filename,
      original_path: originalPath,
      width: width ? Number(width) : null,
      height: height ? Number(height) : null,
      status: "draft",
      frames: JSON.stringify([]),
      created_at: now,
      updated_at: now,
    };
    data.templates.push(template);
    writeData(data);
    return { ...template, frames: [] };
  },

  updateTemplate(id, fields) {
    const data = readData();
    const idx = (data.templates || []).findIndex((x) => x.id == id);
    if (idx === -1) return null;
    const t = data.templates[idx];
    if (fields.name !== undefined) t.name = fields.name;
    if (fields.status !== undefined) t.status = fields.status;
    if (fields.frames !== undefined) t.frames = JSON.stringify(fields.frames);
    t.updated_at = new Date().toISOString();
    writeData(data);
    return { ...t, frames: parseFrames(t) };
  },

  publishTemplate(id) {
    return this.updateTemplate(id, { status: "published" });
  },

  deleteTemplate(id) {
    const data = readData();
    const idx = (data.templates || []).findIndex((x) => x.id == id);
    if (idx === -1) return null;
    const removed = data.templates.splice(idx, 1)[0];
    writeData(data);
    return removed;
  },

  // Photo session storage
  createPhotoSession(sessionId, photos) {
    const data = readData();
    data.photos = data.photos || [];
    data.photos.push({ id: sessionId, photos, created_at: new Date().toISOString() });
    writeData(data);
    return { id: sessionId, photos };
  },

  getPhotoSession(sessionId) {
    const data = readData();
    const session = (data.photos || []).find((x) => x.id == sessionId);
    return session || null;
  },
};

module.exports = db;
