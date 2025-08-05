const express = require('express');
const router = express.Router();
const db = require('../db');

// CREATE a hotel booking
router.post('/', (req, res) => {
  const { user_email, hotel_id, check_in, check_out, travelers } = req.body;
  if (!user_email || !hotel_id || !check_in || !check_out || !travelers) {
    return res.status(400).json({ message: 'All fields required' });
  }

  const sql = `
    INSERT INTO hotel_bookings (user_email, hotel_id, check_in, check_out, travelers)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [user_email, hotel_id, check_in, check_out, travelers], (err, result) => {
    if (err) return res.status(500).json({ message: 'Booking error' });
    res.status(201).json({ message: 'Hotel booked', id: result.insertId });
  });
});

// ✅ GET all hotel bookings with full hotel info
router.get('/', (req, res) => {
  const sql = `
    SELECT 
      hb.*, 
      h.name AS hotel_name, 
      h.image_url, 
      h.description, 
      h.price_per_night, 
      h.rating
    FROM hotel_bookings hb
    JOIN hotels h ON hb.hotel_id = h.id
  `;

  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching bookings' });
    res.status(200).json(results);
  });
});

// ✅ GET bookings for a specific user (optional)
router.get('/user', (req, res) => {
  const { email } = req.query;
  if (!email) return res.status(400).json({ message: 'Email is required' });

  const sql = `
    SELECT 
      hb.*, 
      h.name AS hotel_name, 
      h.image_url, 
      h.description, 
      h.price_per_night, 
      h.rating
    FROM hotel_bookings hb
    JOIN hotels h ON hb.hotel_id = h.id
    WHERE hb.user_email = ?
  `;

  db.query(sql, [email], (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching user bookings' });
    res.status(200).json(results);
  });
});

router.delete('/:id', (req, res) => {
  const bookingId = req.params.id;
  const sql = 'DELETE FROM hotel_bookings WHERE id = ?';

  db.query(sql, [bookingId], (err, result) => {
    if (err) {
      console.error('Error deleting booking:', err);
      res.status(500).json({ message: 'Error deleting booking' });
    } else {
      res.json({ message: 'Booking cancelled successfully' });
    }
  });
});


module.exports = router;
