const mongoose = require("mongoose");
const { cloudinary } = require("./cloudinary");

mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const connection = mongoose.connection;
connection.on("error", console.error.bind(console, "MongoDB connection error:"));
connection.once("open", () => console.log("Connected to MongoDB Atlas"));

const templateSchema = new mongoose.Schema({
  name: String,
  filename: String,
  original_path: String,
  width: Number,
  height: Number,
  status: { type: String, default: "draft" },
  frames: { type: mongoose.Schema.Types.Mixed, default: [] },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

const photoSessionSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  photos: [String],
  created_at: { type: Date, default: Date.now },
});

const Template = mongoose.model("Template", templateSchema);
const PhotoSession = mongoose.model("PhotoSession", photoSessionSchema);

function parseFrames(t) {
  if (t == null) return [];
  if (Array.isArray(t.frames)) return t.frames;
  return [];
}

const db = {
  listTemplates({ published } = {}) {
    const filter = published === true || published === "true" ? { status: "published" } : {};
    return Template.find(filter).sort({ created_at: -1 }).lean().then((templates) =>
      templates.map((t) => ({ ...t, frames: parseFrames(t) }))
    );
  },

  getTemplate(id) {
    return Template.findById(id).lean().then((t) => {
      if (!t) return null;
      return { ...t, frames: parseFrames(t) };
    });
  },

  createTemplate({ name, filename, originalPath, width, height }) {
    const template = new Template({
      name,
      filename,
      original_path: originalPath,
      width: width ? Number(width) : null,
      height: height ? Number(height) : null,
      status: "draft",
      frames: [],
    });
    return template.save().then((t) => ({ ...t.toObject(), frames: [] }));
  },

  updateTemplate(id, fields) {
    const update = { ...fields, updated_at: new Date() };
    if (fields.frames !== undefined) update.frames = JSON.stringify(fields.frames);
    return Template.findByIdAndUpdate(id, update, { new: true, lean: true }).then((t) => {
      if (!t) return null;
      return { ...t, frames: parseFrames(t) };
    });
  },

  publishTemplate(id) {
    return this.updateTemplate(id, { status: "published" });
  },

  deleteTemplate(id) {
    return Template.findById(id).lean().then((t) => {
      if (!t) return null;
      return Template.findByIdAndDelete(id).then(() => t);
    });
  },

  createPhotoSession(sessionId, photos) {
    const session = new PhotoSession({ id: sessionId, photos });
    return session.save().then(() => ({ id: sessionId, photos }));
  },

  getPhotoSession(sessionId) {
    return PhotoSession.findOne({ id: sessionId }).lean().then((session) => session || null);
  },
};

module.exports = db;
