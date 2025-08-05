const express = require("express");
const bodyparser = require("body-parser");
const cors = require("cors");
const mysql = require("mysql2");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const bcrypt = require("bcrypt");

const travelRoutes = require('./routes/travel.routes');
const placesRoutes = require('./routes/places.routes');
const hotelsRoutes = require('./routes/hotels.routes');
const hotelBookingRoutes = require('./routes/hotelBookings.routes');

const app = express();
app.use(cors());
app.use(bodyparser.json());

// ✅ Make all files inside /uploads accessible (for static hotel2.jpg etc.)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ✅ Upload directories
const userImgPath = path.join(__dirname, "uploads", "images");
const chatFilePath = path.join(__dirname, "uploads", "chat");

[userImgPath, chatFilePath].forEach((dir) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

// ✅ Routes
app.use('/travel', travelRoutes);
app.use('/places', placesRoutes);
app.use('/hotels', hotelsRoutes);
app.use('/hotel-booking', hotelBookingRoutes);

// ✅ Multer config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    if (req.url.includes("/user")) cb(null, userImgPath);
    else if (req.url.includes("/chat")) cb(null, chatFilePath);
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage });

// ✅ Static paths
app.use("/uploads/images", express.static(userImgPath));
app.use("/uploads/chat", express.static(chatFilePath));

// ✅ MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "userinfo",
  port: 3306,
});
db.connect((err) => {
  if (err) console.log("❌ DB error", err);
  else console.log("✅ MySQL Connected");
});



// ✅ USERS
app.get("/users", (_, res) => {
  db.query("SELECT * FROM users", (err, results) => {
    if (err) return res.status(500).json({ err });
    results.forEach((u) => {
      if (u.image) u.image = `/uploads/images/${u.image}`;
    });
    res.send({ data: results });
  });
});
app.get("/user/:id", (req, res) => {
  db.query("SELECT * FROM users WHERE id = ?", [req.params.id], (err, r) => {
    if (err) return res.status(500).json({ err });
    if (r[0]?.image) r[0].image = `/uploads/images/${r[0].image}`;
    res.send({ data: r });
  });
});
app.post("/user", upload.single("image"), (req, res) => {
  const { fullname, email, mobile } = req.body;
  const image = req.file?.filename || null;
  db.query(
    "INSERT INTO users (fullname, email, mobile, image) VALUES (?, ?, ?, ?)",
    [fullname, email, mobile, image],
    (err, result) => {
      if (err) return res.status(500).json({ err });
      res.send({ message: "User added", id: result.insertId });
    }
  );
});
app.put("/user/:id", upload.single("image"), (req, res) => {
  const { fullname, email, mobile } = req.body;
  const image = req.file?.filename;
  const query = image
    ? "UPDATE users SET fullname=?, email=?, mobile=?, image=? WHERE id=?"
    : "UPDATE users SET fullname=?, email=?, mobile=? WHERE id=?";
  const values = image
    ? [fullname, email, mobile, image, req.params.id]
    : [fullname, email, mobile, req.params.id];

  db.query(query, values, (err) => {
    if (err) return res.status(500).json({ err });
    res.send({ message: "User updated" });
  });
});
app.delete("/user/:id", (req, res) => {
  db.query("DELETE FROM users WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ err });
    res.send({ message: "User deleted" });
  });
});

// ✅ AUTH
app.post("/admin/register", (req, res) => {
  const { name, password, email } = req.body;
  db.query("SELECT * FROM admin WHERE name=? OR email=?", [name, email], (err, r) => {
    if (err) return res.status(500).json({ err });
    if (r.length) return res.status(400).json({ message: "User exists" });
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) return res.status(500).json({ err });
      db.query("INSERT INTO admin (name, password, email) VALUES (?, ?, ?)", [name, hash, email], (err) => {
        if (err) return res.status(500).json({ err });
        res.send({ message: "Admin registered" });
      });
    });
  });
});
app.post("/admin/login", (req, res) => {
  const { email, password } = req.body;
  db.query("SELECT * FROM admin WHERE email=?", [email], (err, r) => {
    if (err) return res.status(500).json({ err });
    if (!r.length) return res.status(401).json({ message: "Invalid email" });
    bcrypt.compare(password, r[0].password, (err, match) => {
      if (match) res.send({ message: "Login success", user: r[0] });
      else res.status(401).json({ message: "Invalid password" });
    });
  });
});

app.post("/admin/reset-password", (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) return res.status(400).json({ message: "Missing fields" });

  bcrypt.hash(newPassword, 10, (err, hashed) => {
    if (err) return res.status(500).json({ message: "Error hashing password" });

    db.query("UPDATE admin SET password=? WHERE email=?", [hashed, email], (err, result) => {
      if (err) return res.status(500).json({ message: "DB error" });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Email not found" });

      res.json({ message: "Password reset successful" });
    });
  });
});
// Delete single chat message by ID
app.delete("/chat/message/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM chat WHERE id=?", [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Failed to delete message" });
    res.send({ message: "Message deleted" });
  });
});


// ✅ POST /notifications
app.post("/notifications", (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ message: "Missing fields" });

  db.query(
    "INSERT INTO notifications (title, message, is_read, created_at) VALUES (?, ?, 0, NOW())",
    [title, message],
    (err, result) => {
      if (err) return res.status(500).json({ message: "DB error" });
      res.send({ message: "Notification added", id: result.insertId });
    }
  );

});


// ✅ UPDATE Notification by ID
app.put('/notifications/:id', (req, res) => {
  const { id } = req.params;
  const { title, message, is_read } = req.body;

  const query = `UPDATE notifications SET title = ?, message = ?, is_read = ? WHERE id = ?`;

  db.query(query, [title, message, is_read, id], (err, result) => {
    if (err) return res.status(500).json({ message: "Failed to update notification", err });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification updated successfully" });
  });
});

// ✅ DELETE Notification by ID
app.delete('/notifications/:id', (req, res) => {
  const { id } = req.params;

  db.query('DELETE FROM notifications WHERE id = ?', [id], (err, result) => {
    if (err) return res.status(500).json({ message: "Failed to delete notification", err });

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification deleted successfully" });
  });
});

// app.js
// app.get('/api/exam/questions', (req, res) => {
//   db.query('SELECT id, question, options FROM exam_questions ORDER BY RAND() LIMIT 10', (e, r) => {
//     if (e) return res.status(500).json({ error: e });
//     res.json({ questions: r });
//   });
// });

app.post('/api/exam/submit', (req, res) => {
  const { user_id, answers, duration } = req.body;
  db.query('SELECT id, correct_option FROM exam_questions WHERE id IN (?)', [answers.map(a=>a.id)], (e, rows) => {
    if (e) return res.status(500).json({ error: e });
    const correctMap = Object.assign({}, ...rows.map(r=>({[r.id]: r.correct_option})));
    let score = answers.reduce((sum, a) => sum + (+correctMap[a.id] === +a.selected), 0);
    db.query('INSERT INTO exam_results (user_id, score, duration_taken) VALUES (?, ?, ?)', [user_id, score, duration], (e, r) => {
      if (e) return res.status(500).json({ error: e });
      res.json({ score, total: answers.length, duration, resultId: r.insertId });
    });
  });
});

// POST /exam-result
app.post('/api/exam/questions', (req, res) => {
  const { question, options, correct_option } = req.body;

  if (!question || !options || options.length !== 4 || correct_option === undefined) {
    return res.status(400).json({ message: "Invalid input" });
  }

  const [option1, option2, option3, option4] = options;

  const query = `
    INSERT INTO exam_questions (question, option1, option2, option3, option4, correct_option)
    VALUES (?, ?, ?, ?, ?, ?)
  `;

  db.query(query, [question, option1, option2, option3, option4, correct_option], (err, result) => {
    if (err) return res.status(500).json({ message: "DB Error", error: err });
    res.json({ message: "Question added successfully", questionId: result.insertId });
  });
});

/////
// ➤ Get All Questions
// ✅ CORRECT VERSION
app.get('/api/exam/questions', (req, res) => {
  db.query('SELECT id, question, option1, option2, option3, option4, correct_option FROM exam_questions ORDER BY RAND() LIMIT 10', (err, rows) => {
    if (err) return res.status(500).json({ error: err });

    const questions = rows.map(q => ({
      id: q.id,
      question: q.question,
      options: [q.option1, q.option2, q.option3, q.option4],
      correct_option: q.correct_option
    }));

    res.json({ questions });
  });
});



// ✅ Keep this only
// app.get('/api/exam/questions', (req, res) => {
//   db.query(
//     'SELECT id, question, option1, option2, option3, option4, correct_option FROM exam_questions',
//     (err, rows) => {
//       if (err) return res.status(500).json({ error: err });

//       const questions = rows.map(q => ({
//         id: q.id,
//         question: q.question,
//         option1: q.option1,
//         option2: q.option2,
//         option3: q.option3,
//         option4: q.option4,
//         correct_option: q.correct_option
//       }));

//       res.json({ questions });
//     }
//   );
// });





// ➤ Add Question
app.get('/api/exam/questions', (req, res) => {
  db.query(
    'SELECT id, question, option1, option2, option3, option4, correct_option FROM exam_questions',
    (err, rows) => {
      if (err) return res.status(500).json({ error: err });

      const questions = rows.map(q => ({
        id: q.id,
        question: q.question,
        option1: q.option1,
        option2: q.option2,
        option3: q.option3,
        option4: q.option4,
        correct_option: q.correct_option
      }));

      res.json({ questions });
    }
  );
});


// ➤ Update Question
app.put('/api/exam/questions/:id', (req, res) => {
  const { question, option1, option2, option3, option4, correct_option } = req.body;

  // Basic validation to ensure all required fields are present
  if (!question || !option1 || !option2 || !option3 || !option4 || correct_option === undefined) {
    console.error('Update Error: Invalid input received.', req.body);
    return res.status(400).json({ message: 'Invalid input. All fields are required.' });
  }

  // ✅ CORRECTED SQL query: Removed JavaScript comments from inside the string
  const sql = `
    UPDATE exam_questions SET
      question = ?,
      option1 = ?,
      option2 = ?,
      option3 = ?,
      option4 = ?,
      correct_option = ?
    WHERE id = ?
  `;

  // Execute the SQL query
  db.query(
    sql,
    [question, option1, option2, option3, option4, correct_option, req.params.id],
    (err, result) => {
      if (err) {
        console.error('Database Error during update:', err);
        // The detailed error object `err` is useful for debugging in the console
        // but avoid exposing full error details in production responses
        return res.status(500).json({ message: 'DB Error. Failed to update question.', error: err.message });
      }

      if (result.affectedRows === 0) {
        console.warn('Update: Question not found or no changes made for ID:', req.params.id);
        return res.status(404).json({ message: 'Question not found or no changes were made.' });
      }

      console.log('Question updated successfully for ID:', req.params.id);
      return res.json({ message: 'Question updated successfully!' });
    }
  );
});
// ➤ Delete Question
app.delete('/api/exam/questions/:id', (req, res) => {
  db.query('DELETE FROM exam_questions WHERE id=?', [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: 'Question deleted' });
  });
});


// ✅ Get all notifications
app.get("/notifications", (req, res) => {
  db.query("SELECT * FROM notifications ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ err });
    res.send({ data: rows });
  });
});

// ✅ Mark notification as read
app.put("/notifications/:id/read", (req, res) => {
  const { id } = req.params;
  db.query("UPDATE notifications SET is_read = 1 WHERE id = ?", [id], (err) => {
    if (err) return res.status(500).json({ message: "Failed to mark as read" });
    res.send({ message: "Marked as read" });
  });
});

// ✅ Create notification
app.post("/notifications", (req, res) => {
  const { title, message } = req.body;
  if (!title || !message) return res.status(400).json({ message: "Missing fields" });

  db.query(
    "INSERT INTO notifications (title, message) VALUES (?, ?)",
    [title, message],
    (err, result) => {
      if (err) return res.status(500).json({ message: "Failed to create notification" });
      res.send({ message: "Notification created", id: result.insertId });
    }
  );
});
// ✅ Get all chat messages
app.get("/chat/history", (req, res) => {
  db.query("SELECT * FROM chat ORDER BY created_at DESC", (err, rows) => {
    if (err) return res.status(500).json({ err });
    res.send({ data: rows });
  });
});


app.post('/support', (req, res) => {
  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({ message: 'All fields required' });
  }

  const query = "INSERT INTO support (name, email, subject, message) VALUES (?, ?, ?, ?)";
  db.query(query, [name, email, subject, message], (err, result) => {
    if (err) return res.status(500).json({ message: 'DB error' });
    res.send({ message: 'Support request submitted' });
  });
});



// ✅ CHAT
app.post("/chat/:chat_id", upload.single("file"), (req, res) => {
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

  const query = `INSERT INTO chat (chat_id, sender, message, type, file_url) VALUES (?, ?, ?, ?, ?)`;
  db.query(query, [chat_id, sender, message, type, file_url], (err, result) => {
    if (err) return res.status(500).json({ err });
    res.send({ message: "Message saved", id: result.insertId });
  });
});
app.get("/chat/:chat_id", (req, res) => {
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




// ✅ TRAVEL BOOKINGS
// app.post('/travel-booking', (req, res) => {
//   const { name, email, destination, date, travelers } = req.body;
//   if (!name || !email || !destination || !date || !travelers) {
//     return res.status(400).json({ error: 'All fields are required' });
//   }

//   db.query("INSERT INTO travel_bookings (name, email, destination, date, travelers) VALUES (?, ?, ?, ?, ?)",
//     [name, email, destination, date, travelers],
//     (err, result) => {
//       if (err) return res.status(500).json({ error: 'Database error' });
//       res.status(201).json({ message: 'Booking successful', bookingId: result.insertId });
//     });
// });


// ✅ Start server
const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

// // Port jab laptop ke ip address se app mobile pe chalana ho
// const PORT = 3000;
// // ✅ LAN par bind karne ke liye host ko "0.0.0.0" karo
// app.listen(PORT, "0.0.0.0", () => {
//   console.log(`Server running at http://localhost:${PORT}`);
// });