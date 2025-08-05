const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// ✅ Multer config for hotels (save in /uploads/)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// ✅ GET all hotels
router.get('/', (req, res) => {
  db.query('SELECT * FROM hotels', (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching hotels' });
    res.status(200).json(results);
  });
});

// ✅ GET single hotel by ID
router.get('/:id', (req, res) => {
  const hotelId = req.params.id;
  db.query('SELECT * FROM hotels WHERE id = ?', [hotelId], (err, result) => {
    if (err) return res.status(500).json({ message: 'Error fetching hotel' });
    if (result.length === 0) return res.status(404).json({ message: 'Hotel not found' });
    res.status(200).json(result[0]);
  });
});

// ✅ POST add hotel with image
router.post('/add-hotel', upload.single('image'), (req, res) => {
  const { name, description, price_per_night, rating } = req.body;
  const image_url = req.file?.filename;

  if (!name || !description || !price_per_night || !rating || !image_url) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  const sql = `INSERT INTO hotels (name, description, price_per_night, rating, image_url)
               VALUES (?, ?, ?, ?, ?)`;
  db.query(sql, [name, description, price_per_night, rating, image_url], (err, result) => {
    if (err) {
      console.error("Insert error:", err);
      return res.status(500).json({ message: 'Error adding hotel' });
    }
    res.status(200).json({ message: 'Hotel added successfully' });
  });
});

// ✅ PUT update hotel (without changing image)
router.put('/:id', upload.single('image'), (req, res) => {
  const hotelId = req.params.id;
  const { name, description, price_per_night, rating } = req.body;
  const image_url = req.file?.filename;

  let sql = '';
  let params = [];

  if (image_url) {
    sql = `UPDATE hotels SET name=?, description=?, price_per_night=?, rating=?, image_url=? WHERE id=?`;
    params = [name, description, price_per_night, rating, image_url, hotelId];
  } else {
    sql = `UPDATE hotels SET name=?, description=?, price_per_night=?, rating=? WHERE id=?`;
    params = [name, description, price_per_night, rating, hotelId];
  }

  db.query(sql, params, (err, result) => {
    if (err) {
      console.error('Error updating hotel:', err);
      return res.status(500).json({ message: 'Update failed' });
    }
    res.status(200).json({ message: 'Hotel updated successfully' });
  });
});


// ✅ DELETE hotel
router.delete('/:id', (req, res) => {
  const hotelId = req.params.id;

  db.query('DELETE FROM hotels WHERE id = ?', [hotelId], (err, result) => {
    if (err) {
      console.error("Delete error:", err);
      return res.status(500).json({ message: 'Error deleting hotel' });
    }
    res.status(200).json({ message: 'Hotel deleted successfully' });
  });
});

module.exports = router;
