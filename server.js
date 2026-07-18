require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");
const fs = require("fs");

const app = express();

app.use(cors());
app.use(express.json());

// Uploads directory ensure karna
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}
app.use("/uploads", express.static(uploadDir));

// Base Check Route
app.get("/", (req, res) => {
    res.send("backend running");
});

// 🔥 MAiN IMPORT: Saare API routes ko /api prefix ke sath connect kar rahe hain
const apiRoutes = require("./endpoints/api");
app.use("/api", apiRoutes); 

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`server running on port ${PORT}`);
});