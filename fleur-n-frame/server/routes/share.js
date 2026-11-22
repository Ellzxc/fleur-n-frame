const express = require("express");
const { cloudinary } = require("../cloudinary");
const db = require("../db");
const { nanoid } = require("nanoid");

const router = express.Router();

// Upload composite photobooth image to Cloudinary + save metadata.
router.post("/upload", express.json({ limit: "20mb" }), async (req, res) => {
  try {
    const { image } = req.body || {};
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "Missing image data URL" });
    }

    const photoId = nanoid(10);
    const uploadResp = await cloudinary.uploader.upload(image, {
      folder: "fleur-n-frame/photobooth",
      resource_type: "image",
    });

    const photo = await db.createPhoto({
      photoId,
      cloudinaryUrl: uploadResp.secure_url,
      publicId: uploadResp.public_id,
    });

    return res.status(201).json({
      photoId: photo.photoId,
      imageUrl: photo.cloudinaryUrl,
      downloadUrl: photo.cloudinaryUrl.replace("/upload/", "/upload/fl_attachment/"),
      shareUrl: photo.cloudinaryUrl,
    });
  } catch (err) {
    console.error("share upload error:", err);
    return res.status(500).json({ error: err.message || "Share upload failed" });
  }
});

// Look up a shared photo by short photoId.
router.get("/:photoId", async (req, res) => {
  try {
    const photo = await db.getPhoto(req.params.photoId);
    if (!photo) return res.status(404).json({ error: "Photo not found" });
    return res.json({
      photoId: photo.photoId,
      imageUrl: photo.cloudinaryUrl,
      downloadUrl: photo.cloudinaryUrl.replace("/upload/", "/upload/fl_attachment/"),
    });
  } catch (err) {
    console.error("share lookup error:", err);
    return res.status(500).json({ error: err.message || "Share lookup failed" });
  }
});

// Delete a shared photo from Cloudinary + MongoDB when the customer is done.
router.delete("/:photoId", async (req, res) => {
  try {
    const photo = await db.getPhoto(req.params.photoId);
    if (!photo) return res.status(404).json({ error: "Photo not found" });
    if (photo.publicId) {
      try {
        await cloudinary.uploader.destroy(photo.publicId);
      } catch (err) {
        console.error("cloudinary delete error:", err.message);
      }
    }
    await db.deletePhoto(req.params.photoId);
    return res.json({ ok: true });
  } catch (err) {
    console.error("share delete error:", err);
    return res.status(500).json({ error: err.message || "Share delete failed" });
  }
});

module.exports = router;
