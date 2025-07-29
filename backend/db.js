const mysql = require("mysql2");

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

module.exports = db;
