// const express = require("express");
// const router = express.Router();
// const db = require("../db");
// const upload = require("../middleware/upload");

// // GET all users
// router.get("/", (req, res) => {
//   db.query("SELECT * FROM users", (err, results) => {
//     if (err) return res.status(500).json({ err });
//     results.forEach((u) => {
//       if (u.image) u.image = `/uploads/images/${u.image}`;
//     });
//     res.send({ data: results });
//   });
// });

// // GET user by ID
// router.get("/:id", (req, res) => {
//   db.query("SELECT * FROM users WHERE id = ?", [req.params.id], (err, r) => {
//     if (err) return res.status(500).json({ err });
//     if (r[0]?.image) r[0].image = `/uploads/images/${r[0].image}`;
//     res.send({ data: r });
//   });
// });

// // CREATE new user
// router.post("/", upload.single("image"), (req, res) => {
//   const { fullname, email, mobile } = req.body;
//   const image = req.file?.filename || null;
//   db.query(
//     "INSERT INTO users (fullname, email, mobile, image) VALUES (?, ?, ?, ?)",
//     [fullname, email, mobile, image],
//     (err, result) => {
//       if (err) return res.status(500).json({ err });
//       res.send({ message: "User added", id: result.insertId });
//     }
//   );
// });

// // UPDATE user
// router.put("/:id", upload.single("image"), (req, res) => {
//   const { fullname, email, mobile } = req.body;
//   const image = req.file?.filename;
//   const query = image
//     ? "UPDATE users SET fullname=?, email=?, mobile=?, image=? WHERE id=?"
//     : "UPDATE users SET fullname=?, email=?, mobile=? WHERE id=?";
//   const values = image
//     ? [fullname, email, mobile, image, req.params.id]
//     : [fullname, email, mobile, req.params.id];

//   db.query(query, values, (err) => {
//     if (err) return res.status(500).json({ err });
//     res.send({ message: "User updated" });
//   });
// });

// // DELETE user
// router.delete("/:id", (req, res) => {
//   db.query("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
//     if (err) return res.status(500).json({ err });
//     res.send({ message: "User deleted" });
//   });
// });

// module.exports = router;
