const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const bcrypt = require('bcrypt');
const multer = require("multer");
const upload = multer(); 
const db = dbSingleton.getConnection();
router.post("/", (req, res) => {
    const { firstName, lastName, phone, email, dateOfBirth, role, password } = req.body;

bcrypt.genSalt(10, (err, salt) => {
	if (err) throw err;
	
	bcrypt.hash(password, salt, (err, hashedPassword) => {
		if (err) throw err; 
    const query = "INSERT INTO users (firstName, lastName, phone, email, dateOfBirth, role, password) VALUES (?, ?, ?, ?, ?, ?, ?)";
    db.query(query, [firstName, lastName, phone, email, dateOfBirth, role, hashedPassword], (err, results) => {
        if (err) {
            res.status(500).json({ error: "Database error" });
        }
        else{
            res.json({message:"User registered successfully"});
        }
    });
	});
})
});
// Register Trainer (with clear error handling)
router.post("/register-trainer", upload.single("certifications"), (req, res) => {
    const { firstName, lastName, phone, email, dateOfBirth, password, availability } = req.body;
    const certifications = req.file ? req.file.buffer : null;

    // 1. Validate all fields present
    if (!firstName || !lastName || !phone || !email || !dateOfBirth || !password || !availability || !certifications) {
        return res.status(400).json({ error: "All fields including certifications are required." });
    }

    // 2. Check email or phone already in use
    db.query("SELECT * FROM users WHERE email = ? OR phone = ?", [email, phone], (err, results) => {
        if (err) {
            console.error("Database error (check email/phone):", err);
            return res.status(500).json({ error: "Internal server error. Please try again later." });
        }
        if (results.some(u => u.email === email)) return res.status(400).json({ error: "Email already exists." });
        if (results.some(u => u.phone === phone)) return res.status(400).json({ error: "Phone number already exists." });

        // 3. Hash the password
        bcrypt.genSalt(10, (err, salt) => {
            if (err) return res.status(500).json({ error: "Failed to secure password." });

            bcrypt.hash(password, salt, (err, hashedPassword) => {
                if (err) return res.status(500).json({ error: "Failed to secure password." });

                // 4. Insert into users table
                const userQuery = "INSERT INTO users (firstName, lastName, phone, email, dateOfBirth, role, password) VALUES (?, ?, ?, ?, ?, ?, ?)";
                db.query(userQuery, [firstName, lastName, phone, email, dateOfBirth, 'onhold', hashedPassword], (err, userResult) => {
                    if (err) {
                        console.error("Database error (insert user):", err);
                        return res.status(500).json({ error: "Failed to create user account. Try again." });
                    }
                    const userId = userResult.insertId;
                    
                    // 5. Insert into trainer table
                    const trainerQuery = "INSERT INTO trainers (UserID, Certifications, Availability) VALUES (?, ?, ?)";
                    db.query(trainerQuery, [userId, certifications, availability], (err) => {
                        if (err) {
                            // Rollback? You may want to delete the user here if this fails!
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



module.exports = router;