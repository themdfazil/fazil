const express = require("express");
const router = express.Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const pool = require("../db"); // Ek folder bahar se db.js import kar rahe hain

const uploadDir = path.join(__dirname, "../uploads");

// MULTER SETUP
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith("audio/")) {
        cb(null, true);
    } else {
        cb(new Error("Only audio files are allowed!"), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// ==========================================
// 1. AUTHENTICATION (LOGIN/REGISTER) ROUTES
// ==========================================

// POST http://localhost:5000/api/
router.post("/", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const userCheck = await pool.query("SELECT * FROM users WHERE email = $1", [email]);
        if (userCheck.rows.length > 0) {
            return res.json({
                success: true,
                user: {
                    id: userCheck.rows[0].id,
                    name: userCheck.rows[0].name,
                    email: userCheck.rows[0].email
                }
            });
        }
        const newUser = await pool.query(
            "INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING id, name, email",
            [name, email, password]
        );
        res.json({ success: true, user: newUser.rows[0] });
    } catch (err) {
        console.error(err);
        res.status(500).send("database error");
    }
});

// GET http://localhost:5000/api/users
router.get("/users", async (req, res) => {
    try {
        const allUsers = await pool.query("SELECT id, name, email FROM users");
        res.json(allUsers.rows);
    } catch (err) {
        console.error(err);
        res.status(500).send("Database error");
    }
});

// ==========================================
// 2. FILE UPLOAD ROUTE
// ==========================================

// POST http://localhost:5000/api/uploads
router.post("/uploads", upload.single("image"), async (req, res) => {
    try {
        const { songName, artist, userId } = req.body;
        
        if (!req.file) {
            return res.status(400).send("Audio file missing!");
        }

        const songUrl = req.file.filename;

        await pool.query(
            "INSERT INTO songs (title, artist, song_url, user_id) VALUES ($1, $2, $3, $4)",
            [songName, artist, songUrl, userId]
        );

        res.send("Uploaded successfully!");
    } catch (err) {
        console.error("Upload Route Error:", err);
        if (req.file) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).send("Upload Failed. Please check database.");
    }
});

// ==========================================
// 3. SONGS DASHBOARD & DELETE ROUTES
// ==========================================

// GET http://localhost:5000/api/songs
router.get("/songs", async (req, res) => {
    const { userId } = req.query;
    if (!userId) {
        return res.status(400).json({ success: false, message: "User ID is required" });
    }
    try {
        const userSongs = await pool.query(
            "SELECT id, title, artist, song_url, user_id FROM songs WHERE user_id = $1 ORDER BY id DESC",
            [userId]
        );
        res.json(userSongs.rows);
    } catch (err) {
        console.error("Fetch Songs Error:", err);
        res.status(500).send("database error");
    }
});

// DELETE http://localhost:5000/api/songs/:id
router.delete("/songs/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const songData = await pool.query("SELECT song_url FROM songs WHERE id = $1", [id]);
        
        if (songData.rows.length === 0) {
            return res.status(404).json({ success: false, message: "Song not found" });
        }

        const fileName = songData.rows[0].song_url;
        const filePath = path.join(uploadDir, fileName);

        await pool.query("DELETE FROM songs WHERE id = $1", [id]);

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }

        res.json({ success: true, message: "Song deleted successfully" });
    } catch (err) {
        console.error("Delete Song Error:", err);
        res.status(500).send("database error");
    }
});

module.exports = router; // router ko export kar rahe hain server.js ke liye