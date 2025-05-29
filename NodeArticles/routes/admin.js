const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const bcrypt = require('bcrypt');
const multer = require("multer");
const upload = multer(); 
const fileType = require('file-type');
const db = dbSingleton.getConnection();

// Register Trainer (with clear error handling)
router.post("/register-trainer", upload.single("certifications"), (req, res) => {
    const { firstName, lastName, phone, email, dateOfBirth, password, availability } = req.body;
    const certifications = req.file ? req.file.buffer : null;

    if (!firstName || !lastName || !phone || !email || !dateOfBirth || !password || !availability || !certifications) {
        return res.status(400).json({ error: "All fields including certifications are required." });
    }

    db.query("SELECT * FROM users WHERE email = ? OR phone = ?", [email, phone], (err, results) => {
        if (err) {
            console.error("Database error (check email/phone):", err);
            return res.status(500).json({ error: "Internal server error. Please try again later." });
        }
        if (results.some(u => u.email === email)) return res.status(400).json({ error: "Email already exists." });
        if (results.some(u => u.phone === phone)) return res.status(400).json({ error: "Phone number already exists." });

        bcrypt.genSalt(10, (err, salt) => {
            if (err) return res.status(500).json({ error: "Failed to secure password." });

            bcrypt.hash(password, salt, (err, hashedPassword) => {
                if (err) return res.status(500).json({ error: "Failed to secure password." });

                const userQuery = "INSERT INTO users (firstName, lastName, phone, email, dateOfBirth, role, password) VALUES (?, ?, ?, ?, ?, ?, ?)";
                db.query(userQuery, [firstName, lastName, phone, email, dateOfBirth, 'onHold', hashedPassword], (err, userResult) => {
                    if (err) {
                        console.error("Database error (insert user):", err);
                        return res.status(500).json({ error: "Failed to create user account. Try again." });
                    }
                    const userId = userResult.insertId;

                    const trainerQuery = "INSERT INTO trainers (UserID, Certifications, Availability) VALUES (?, ?, ?)";
                    db.query(trainerQuery, [userId, certifications, availability], (err) => {
                        if (err) {
                            console.error("Database error (insert trainer info):", err);
                            if (err.code === 'ER_NO_SUCH_TABLE') {
                                return res.status(500).json({ error: "Trainer table does not exist. Contact admin." });
                            }
                            return res.status(500).json({ error: "Failed to register trainer info. Contact admin." });
                        }
                        res.json({ message: "Trainer registration submitted. Await admin approval." });
                    });
                });
            });
        });
    });
});

// ----------------------
// Fetch pending trainers
// ----------------------
router.get("/pending-trainers", (req, res) => {
    const sql = `
        SELECT 
            u.UserID, u.FirstName, u.LastName, u.Phone, u.Email, u.DateOfBirth, u.Role,
            t.Availability
        FROM users u
        JOIN trainers t ON u.UserID = t.UserID
        WHERE u.Role = 'onHold'
    `;
    db.query(sql, (err, results) => {
        if (err) {
            console.error("DB error (pending trainers):", err);
            return res.status(500).json({ error: "Failed to fetch pending trainers." });
        }
        res.json(results);
    });
});

// ----------------------
// Download/view trainer certification by UserID
// ----------------------
router.get("/trainer-cert/:userId", (req, res) => {
    const userId = req.params.userId;
    const sql = "SELECT Certifications FROM trainers WHERE UserID = ?";
    db.query(sql, [userId], async (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).send("Certification not found.");
        }
        const buffer = results[0].Certifications;

        // Use file-type to guess mime and extension
        const ft = await fileType.fromBuffer(buffer);

        let mime = 'application/octet-stream';
        let ext = 'file';

        if (ft) {
            mime = ft.mime;
            ext = ft.ext;
        }

        res.setHeader('Content-Disposition', `attachment; filename=certification.${ext}`);
        res.setHeader('Content-Type', mime);
        res.send(buffer);
    });
});
// ----------------------
// Approve trainer
// ----------------------
router.post("/approve-trainer", (req, res) => {
    const { UserID } = req.body;
    const sql = "UPDATE users SET role = 'trainer' WHERE UserID = ?";
    db.query(sql, [UserID], (err, result) => {
        if (err) {
            return res.status(500).json({ error: "Failed to approve trainer." });
        }
        res.json({ message: "Trainer approved successfully." });
    });
});

// ----------------------
// Reject trainer
// ----------------------
router.post("/reject-trainer", (req, res) => {
    const { UserID } = req.body;
    // Remove from users and trainers
    db.query("DELETE FROM trainers WHERE UserID = ?", [UserID], (err) => {
        if (err) return res.status(500).json({ error: "Failed to delete trainer info." });
        db.query("DELETE FROM users WHERE UserID = ?", [UserID], (err2) => {
            if (err2) return res.status(500).json({ error: "Failed to delete user." });
            res.json({ message: "Trainer rejected and removed." });
        });
    });
});

module.exports = router;
