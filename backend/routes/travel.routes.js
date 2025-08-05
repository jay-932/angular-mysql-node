const express = require('express');
const router = express.Router();
const db = require('../db'); // make sure this is your correct db config file

// CREATE a new booking
router.post('/', (req, res) => {
  const { full_name, email, destination, date, travelers } = req.body;

  if (!full_name || !email || !destination || !date || !travelers) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const sql = `INSERT INTO travel_bookings (full_name, email, destination, date, travelers, created_at) VALUES (?, ?, ?, ?, ?, NOW())`;
  const values = [full_name, email, destination, date, travelers];

  db.query(sql, values, (err, result) => {
    if (err) {
      console.error('Booking insert error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(201).json({ message: 'Booking successful', id: result.insertId });
  });
});

// GET all bookings
router.get('/', (req, res) => {
  db.query('SELECT * FROM travel_bookings ORDER BY id DESC', (err, results) => {
    if (err) {
      console.error('Fetch bookings error:', err);
      return res.status(500).json({ message: 'Database error' });
    }
    res.status(200).json(results);
  });
});

module.exports = router;
