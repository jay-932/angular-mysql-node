const express = require("express");
const router = express.Router();
const db = require("../db");
const upload = require("../middleware/upload");
const path = require("path");

// Send chat message with optional file
router.post("/:chat_id", upload.single("file"), (req, res) => {
  const { chat_id } = req.params;
  const { sender, message = "" } = req.body;
  const file = req.file;

  let type = "text";
  let file_url = "";

  if (file) {
    const ext = path.extname(file.originalname).toLowerCase();
    type = [".jpg", ".png", ".jpeg", ".gif"].includes(ext) ? "image" : "file";
    file_url = `/uploads/chat/${file.filename}`;
  }

  db.query(
    "INSERT INTO chat (chat_id, sender, message, type, file_url) VALUES (?, ?, ?, ?, ?)",
    [chat_id, sender, message, type, file_url],
    (err, result) => {
      if (err) return res.status(500).json({ err });
      res.send({ message: "Message saved", id: result.insertId });
    }
  );
});

// Get chat history
router.get("/:chat_id", (req, res) => {
  const { chat_id } = req.params;
  db.query(
    "SELECT * FROM chat WHERE chat_id = ? ORDER BY created_at ASC",
    [chat_id],
    (err, rows) => {
      if (err) return res.status(500).json({ err });
      res.send({ data: rows });
    }
  );
});

// Delete message by ID
router.delete("/message/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM chat WHERE id=?", [id], (err) => {
    if (err) return res.status(500).json({ message: "Failed to delete message" });
    res.send({ message: "Message deleted" });
  });
});

module.exports = router;
