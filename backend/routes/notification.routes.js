const express = require("express");
const router = express.Router();
const db = require("../db");

// Get all
router.get("/", (req, res) => {
  db.query("SELECT * FROM notifications ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ err });
    res.send({ data: rows });
  });
});

// Add
router.post("/", (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ message: "Missing fields" });

  db.query("INSERT INTO notifications (title, message, is_read, created_at) VALUES (?, ?, 0, NOW())",
    [title, message], (err, result) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.send({ message: "Notification added", id: result.insertId });
    });
});

// Update
router.put("/:id", (req, res) => {
  const { id } = req.params;
  const { title, message, is_read } = req.body;
  db.query(
    "UPDATE notifications SET title = ?, message = ?, is_read = ? WHERE id = ?",
    [title, message, is_read, id],
    (err, result) => {
      if (err) return res.status(500).json({ err });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Updated successfully" });
    }
  );
});

// Mark as read
router.put("/:id/read", (req, res) => {
  db.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ message: "Failed to mark as read" });
    res.send({ message: "Marked as read" });
  });
});

// Delete
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM notifications WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ err });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Not found" });
    res.send({ message: "Notification deleted" });
  });
});

module.exports = router;
