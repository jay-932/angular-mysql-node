const express = require("express");
const router = express.Router();
const db = require("../db");

// Get Random 10 Questions
router.get("/questions", (req, res) => {
  db.query(
    "SELECT id, question, option1, option2, option3, option4, correct_option FROM exam_questions ORDER BY RAND() LIMIT 10",
    (err, rows) => {
      if (err) return res.status(500).json({ error: err });
      const questions = rows.map(q => ({
        id: q.id,
        question: q.question,
        options: [q.option1, q.option2, q.option3, q.option4],
        correct_option: q.correct_option
      }));
      res.json({ questions });
    }
  );
});

// Add Question
router.post("/questions", (req, res) => {
  const { question, options, correct_option } = req.body;
  if (!question || !options || options.length !== 4 || correct_option === undefined) {
    return res.status(400).json({ message: "Invalid input" });
  }
  const [o1, o2, o3, o4] = options;
  db.query(
    "INSERT INTO exam_questions (question, option1, option2, option3, option4, correct_option) VALUES (?, ?, ?, ?, ?, ?)",
    [question, o1, o2, o3, o4, correct_option],
    (err, result) => {
      if (err) return res.status(500).json({ message: "DB Error", error: err });
      res.json({ message: "Question added", questionId: result.insertId });
    }
  );
});

// Update Question
router.put("/questions/:id", (req, res) => {
  const { question, option1, option2, option3, option4, correct_option } = req.body;
  if (!question || !option1 || !option2 || !option3 || !option4 || correct_option === undefined) {
    return res.status(400).json({ message: "Invalid input" });
  }
  db.query(
    "UPDATE exam_questions SET question=?, option1=?, option2=?, option3=?, option4=?, correct_option=? WHERE id=?",
    [question, option1, option2, option3, option4, correct_option, req.params.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: err });
      if (result.affectedRows === 0) return res.status(404).json({ message: "Not found" });
      res.json({ message: "Updated successfully" });
    }
  );
});

// Delete Question
router.delete("/questions/:id", (req, res) => {
  db.query("DELETE FROM exam_questions WHERE id=?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: err });
    res.json({ message: "Question deleted" });
  });
});

// Submit Answers
router.post("/submit", (req, res) => {
  const { user_id, answers, duration } = req.body;
  db.query(
    "SELECT id, correct_option FROM exam_questions WHERE id IN (?)",
    [answers.map(a => a.id)],
    (e, rows) => {
      if (e) return res.status(500).json({ error: e });
      const correctMap = Object.assign({}, ...rows.map(r => ({ [r.id]: r.correct_option })));
      let score = answers.reduce((sum, a) => sum + (+correctMap[a.id] === +a.selected), 0);
      db.query(
        "INSERT INTO exam_results (user_id, score, duration_taken) VALUES (?, ?, ?)",
        [user_id, score, duration],
        (e, r) => {
          if (e) return res.status(500).json({ error: e });
          res.json({ score, total: answers.length, duration, resultId: r.insertId });
        }
      );
    }
  );
});

module.exports = router;
