// const express = require("express");
// const router = express.Router();
// const db = require("../db");

// router.post("/", (req, res) => {
//   const { name, email, subject, message } = req.body;

//   if (!name || !email || !subject || !message) {
//     return res.status(400).json({ message: "All fields required" });
//   }

//   const query = "INSERT INTO support (name, email, subject, message) VALUES (?, ?, ?, ?)";
//   db.query(query, [name, email, subject, message], (err) => {
//     if (err) return res.status(500).json({ message: "DB error" });
//     res.send({ message: "Support request submitted" });
//   });
// });

// module.exports = router;
