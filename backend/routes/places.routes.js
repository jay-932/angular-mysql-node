const express = require('express');
const router = express.Router();
const db = require('../db');

// GET all places
router.get('/', (req, res) => {
  db.query('SELECT * FROM places', (err, results) => {
    if (err) return res.status(500).json({ message: 'Error fetching places' });
    res.status(200).json(results);
  });
});

module.exports = router;
