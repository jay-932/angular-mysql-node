// const express = require("express");
// const router = express.Router();
// const bcrypt = require("bcrypt");
// const db = require("../db");

// // Admin Register
// router.post("/register", (req, res) => {
//   const { name, password, email } = req.body;
//   db.query("SELECT * FROM admin WHERE name=? OR email=?", [name, email], (err, r) => {
//     if (err) return res.status(500).json({ err });
//     if (r.length) return res.status(400).json({ message: "User already exists" });
//     bcrypt.hash(password, 10, (err, hash) => {
//       if (err) return res.status(500).json({ err });
//       db.query("INSERT INTO admin (name, password, email) VALUES (?, ?, ?)", [name, hash, email], (err) => {
//         if (err) return res.status(500).json({ err });
//         res.send({ message: "Admin registered" });
//       });
//     });
//   });
// });

// // Admin Login
// router.post("/login", (req, res) => {
//   const { email, password } = req.body;
//   db.query("SELECT * FROM admin WHERE email=?", [email], (err, r) => {
//     if (err) return res.status(500).json({ err });
//     if (!r.length) return res.status(401).json({ message: "Invalid email" });
//     bcrypt.compare(password, r[0].password, (err, match) => {
//       if (match) res.send({ message: "Login success", user: r[0] });
//       else res.status(401).json({ message: "Invalid password" });
//     });
//   });
// });

// // Admin Reset Password
// router.post("/reset-password", (req, res) => {
//   const { email, newPassword } = req.body;
//   if (!email || !newPassword) return res.status(400).json({ message: "Missing fields" });

//   bcrypt.hash(newPassword, 10, (err, hashed) => {
//     if (err) return res.status(500).json({ message: "Error hashing password" });

//     db.query("UPDATE admin SET password=? WHERE email=?", [hashed, email], (err, result) => {
//       if (err) return res.status(500).json({ message: "DB error" });
//       if (result.affectedRows === 0) return res.status(404).json({ message: "Email not found" });

//       res.json({ message: "Password reset successful" });
//     });
//   });
// });

// module.exports = router;
