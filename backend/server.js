const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Static folders
app.use("/uploads/images", express.static(path.join(__dirname, "uploads/images")));
app.use("/uploads/chat", express.static(path.join(__dirname, "uploads/chat")));

// Ensure upload directories exist
["uploads/images", "uploads/chat"].forEach((dir) => {
  const fullPath = path.join(__dirname, dir);
  if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
});

// Mount routes
app.use("/api/users", require("./routes/user.routes"));

app.use("/api/users", require("./routes/user.routes"));
app.use("/api/auth", require("./routes/auth.routes"));
app.use("/api/chat", require("./routes/chat.routes"));
app.use("/api/notifications", require("./routes/notification.routes"));
app.use("/api/support", require("./routes/support.routes"));
app.use("/api/exam", require("./routes/exam.routes"));


const PORT = 3000;
app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));
