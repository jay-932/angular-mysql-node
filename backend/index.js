const express = require("express");
const bodyparser = require('body-parser');
const cors = require('cors');
const mysql = require('mysql2');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();

app.use(cors());
app.use(bodyparser.json());

// Define the path for the uploads directory
const uploadDir = path.join(__dirname, 'uploads', 'images');

// Create the directory if it doesn't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir); // Save files to the uploads/images directory
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname)); // Add timestamp to filename
    }
});
const upload = multer({ storage: storage });

// Serve static files from the uploads/images directory
app.use('/uploads/images', express.static(uploadDir));

// Connect MySQL database
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'userinfo',
    port: 3306
});

// Check database connection
db.connect(err => {
    if (err) {
        console.log('Database connection error:', err);
    } else {
        console.log('Database Connect Successful!!!');
    }
});

// Get all data
app.get('/users', (req, res) => {
    let qrr = `SELECT * FROM users`;
    db.query(qrr, (err, results) => {
        if (err) {
            console.log('Error:', err);
            res.status(500).send({ message: 'Error fetching data', error: err });
        } else {
            if (results.length > 0) {
                results.forEach(user => {
                    if (user.image) {
                        user.image = `/uploads/images/${user.image}`; // Prefix with /uploads/images/
                    }
                });
                res.send({ message: 'All users Data', data: results });
            } else {
                res.send({ message: 'No data found' });
            }
        }
    });
});

// Get single data by ID
app.get('/user/:id', (req, res) => {
    let qrId = req.params.id;
    let qr = `SELECT * FROM users WHERE id = ${qrId}`;
    
    db.query(qr, (err, results) => {
        if (err) {
            console.log('Error:', err);
            res.status(500).send({ message: 'Error fetching data', error: err });
        } else {
            if (results.length > 0) {
                if (results[0].image) {
                    results[0].image = `/uploads/images/${results[0].image}`; // Prefix with /uploads/images/
                }
                res.send({ message: 'Get data by ID', data: results });
            } else {
                res.send({ message: 'Data not found' });
            }
        }
    });
});

// Add new user with image upload
app.post('/user', upload.single('image'), (req, res) => {
    let fullName = req.body.fullname;
    let Email = req.body.email;
    let Mobile = req.body.mobile;
    let image = req.file ? req.file.filename : null; // Store only the filename

    let qr = `INSERT INTO users (fullname, email, mobile, image) VALUES ('${fullName}', '${Email}', '${Mobile}', '${image}')`;

    db.query(qr, (err, results) => {
        if (err) {
            console.log('Error:', err);
            res.status(500).send({ message: 'Error inserting data', error: err });
        } else {
            res.send({ message: 'User added successfully', data: results });
        }
    });
});

// Update user with image upload
app.put('/user/:id', upload.single('image'), (req, res) => {
    let uID = req.params.id;
    let fullName = req.body.fullname;
    let Email = req.body.email;
    let Mobile = req.body.mobile;
    let image = req.file ? req.file.filename : null;

    let qr = `UPDATE users SET fullname = '${fullName}', email = '${Email}', mobile = '${Mobile}'${image ? `, image = '${image}'` : ''} WHERE id = ${uID}`;

    db.query(qr, (err, results) => {
        if (err) {
            console.log('Error:', err);
            res.status(500).send({ message: 'Error updating data', error: err });
        } else {
            if (results.affectedRows > 0) {
                res.send({ message: 'User updated successfully', data: results });
            } else {
                res.send({ message: 'User not found' });
            }
        }
    });
});

// Delete data by ID
app.delete('/user/:id', (req, res) => {
    let uID = req.params.id;
    
    let qr = `DELETE FROM users WHERE id = ${uID}`;
    
    db.query(qr, (err, results) => {
        if (err) {
            console.log('Error:', err);
            res.status(500).send({ message: 'Error deleting data', error: err });
        } else {
            res.send({ message: 'Data deleted successfully' });
        }
    });
});

app.post('/admin/register', (req, res) => {
    const { name, password, email } = req.body;  // Use 'name' instead of 'username'

    // Check if name or email already exists
    let checkQuery = `SELECT * FROM admin WHERE name = '${name}' OR email = '${email}'`;  // Updated 'username' to 'name'
    
    db.query(checkQuery, (err, results) => {
        if (err) {
            console.log('Error:', err);
            res.status(500).send({ message: 'Error checking existing user', error: err });
        } else if (results.length > 0) {
            res.status(400).send({ message: 'Name or Email already exists' });  // Updated message
        } else {
            // Insert new admin into database
            let registerQuery = `INSERT INTO admin (name, password, email) VALUES ('${name}', '${password}', '${email}')`;  // Updated 'username' to 'name'
            
            db.query(registerQuery, (err, results) => {
                if (err) {
                    console.log('Error:', err);
                    res.status(500).send({ message: 'Error registering admin', error: err });
                } else {
                    res.send({ message: 'Admin registered successfully', data: results });
                }
            });
        }
    });
});


// Login API for Admin
const bcrypt = require('bcrypt');

app.post('/admin/login', (req, res) => {
  const { email, password } = req.body;

  // Query to get user by email
  let loginQuery = `SELECT * FROM admin WHERE email = '${email}'`;
  db.query(loginQuery, (err, results) => {
    if (err) {
      console.log('Database error:', err);
      return res.status(500).send({ message: 'Error during login', error: err });
    }

    if (results.length > 0) {
      const user = results[0];

      // Compare entered password with hashed password in the database
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) {
          console.log('Error comparing passwords:', err);
          return res.status(500).send({ message: 'Error comparing passwords' });
        }

        if (isMatch) {
          res.send({ message: 'Login successful', data: user });
        } else {
          res.status(401).send({ message: 'Invalid email or password' });
        }
      });
    } else {
      res.status(401).send({ message: 'Invalid email or password' });
    }
  });
});

  

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on PORT ${PORT}`);
});
