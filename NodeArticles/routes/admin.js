const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const db = dbSingleton.getConnection();

// --- Make sure /uploads exists ---
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

// Multer disk storage for file uploads (store as original name)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // <-- Just use the original file name
  }
});
const upload = multer({ storage });

router.post("/register-trainer", upload.single("certifications"), (req, res) => {
  const { firstName, lastName, phone, email, dateOfBirth, password } = req.body;
  const certifications = req.file ? req.file.filename : null;

  if (!firstName || !lastName || !phone || !email || !dateOfBirth || !password || !certifications) {
    return res.status(400).json({ error: "All fields including certifications are required." });
  }

  db.query("SELECT * FROM users WHERE email = ? OR phone = ?", [email, phone], (err, results) => {
    if (err) return res.status(500).json({ error: "Internal server error." });
    if (results.some(u => u.email === email)) return res.status(400).json({ error: "Email already exists." });
    if (results.some(u => u.phone === phone)) return res.status(400).json({ error: "Phone already exists." });

    bcrypt.genSalt(10, (err, salt) => {
      if (err) return res.status(500).json({ error: "Failed to secure password." });

      bcrypt.hash(password, salt, (err, hashedPassword) => {
        if (err) return res.status(500).json({ error: "Failed to secure password." });

        const userQuery = "INSERT INTO users (firstName, lastName, phone, email, dateOfBirth, role, password) VALUES (?, ?, ?, ?, ?, ?, ?)";
        db.query(userQuery, [firstName, lastName, phone, email, dateOfBirth, 'onHold', hashedPassword], (err, userResult) => {
          if (err) return res.status(500).json({ error: "Failed to create user account. Try again." });
          const userId = userResult.insertId;

          // Save only the file name in Certifications (varchar)
          const trainerQuery = "INSERT INTO trainers (UserID, Certifications) VALUES (?, ?)";
          db.query(trainerQuery, [userId, certifications], (err) => {
            if (err) return res.status(500).json({ error: "Failed to register trainer info." });
            res.json({ message: "Trainer registration submitted. Await admin approval." });
          });
        });
      });
    });
  });
});

/**
 * GET /trainer-cert/:userId
 * Returns the certificate file by file name from /uploads for download
 */
router.get("/trainer-cert/:userId", (req, res) => {
    const userId = req.params.userId;
    const sql = "SELECT Certifications FROM trainers WHERE UserID = ?";
    db.query(sql, [userId], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).send("Certification not found.");
        }
        const filename = results[0].Certifications;
        if (!filename) return res.status(404).send("Certification not found.");

        const filePath = path.join(__dirname, '..', 'uploads', filename);
        res.download(filePath, filename, (err) => {
            if (err) {
                res.status(404).send("File not found on server.");
            }
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
            t.Certifications
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

// Get all class types with max participants
router.get("/class-types", (req, res) => {
    db.query("SELECT id, type, MaxParticipants FROM class_types", (err, results) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json(results);
    });
});

// Update max participants for a class type
// Update max participants for a specific class type
router.put("/class-type/:id/max", (req, res) => {
    const { id } = req.params;
    const { MaxParticipants } = req.body;
    
    if (typeof MaxParticipants !== "number") {
      return res.status(400).json({ error: "MaxParticipants must be a number" });
    }
  
    db.query(
      "UPDATE class_types SET MaxParticipants = ? WHERE id = ?",
      [MaxParticipants, id],
      (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ success: true });
      }
    );
  });
  
// Add a new class type
router.post("/class-types", (req, res) => {
    const { type, MaxParticipants } = req.body;
    if (!type || typeof MaxParticipants !== "number") {
      return res.status(400).json({ error: "Missing type or MaxParticipants." });
    }
    db.query(
      "INSERT INTO class_types (type, MaxParticipants) VALUES (?, ?)",
      [type, MaxParticipants],
      (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ success: true, id: result.insertId });
      }
    );
  });
  
// Dashboard stats for admin
router.get("/dashboard-stats", async (req, res) => {
    try {
      // Total users with 'member', 'trainer', 'onHold' roles
      const [users, trainers, classes, memberships, pending] = await Promise.all([
        new Promise((resolve, reject) => db.query("SELECT COUNT(*) as count FROM users WHERE Role = 'member'", (e, r) => e ? reject(e) : resolve(r[0].count))),
        new Promise((resolve, reject) => db.query("SELECT COUNT(*) as count FROM users WHERE Role = 'trainer'", (e, r) => e ? reject(e) : resolve(r[0].count))),
        new Promise((resolve, reject) => db.query("SELECT COUNT(*) as count FROM classes", (e, r) => e ? reject(e) : resolve(r[0].count))),
        new Promise((resolve, reject) => db.query("SELECT COUNT(*) as count FROM membership WHERE EndDate >= CURDATE()", (e, r) => e ? reject(e) : resolve(r[0].count))),
        new Promise((resolve, reject) => db.query("SELECT COUNT(*) as count FROM users WHERE Role = 'onHold'", (e, r) => e ? reject(e) : resolve(r[0].count))),
      ]);
      res.json({
        members: users,
        trainers,
        classes,
        activeMemberships: memberships,
        pendingTrainers: pending,
      });
    } catch (e) {
      res.status(500).json({ error: "Stats error" });
    }
  });


// ====================================
// ADMIN CLASS TYPES CONTROL STARTS HERE
// ====================================

// ADD class type
router.post("/class-types", (req, res) => {
    const { type, MaxParticipants } = req.body;
    if (!type || typeof MaxParticipants !== "number") {
        return res.status(400).json({ error: "Missing type or MaxParticipants." });
    }
    db.query(
        "INSERT INTO class_types (type, MaxParticipants) VALUES (?, ?)",
        [type, MaxParticipants],
        (err, result) => {
            if (err) return res.status(500).json({ error: "Database error" });
            res.json({ success: true, id: result.insertId });
        }
    );
});

// DELETE class type
// Delete a class type
router.delete("/class-types/:id", (req, res) => {
    const { id } = req.params;
    db.query(
      "DELETE FROM class_types WHERE id = ?",
      [id],
      (err, result) => {
        if (err) return res.status(500).json({ error: "Database error" });
        res.json({ success: true });
      }
    );
  });
  

// BULK SET ALL MaxParticipants
router.put("/class-types/set-max", (req, res) => {
    const { max } = req.body;
    if (typeof max !== "number") {
        return res.status(400).json({ error: "Missing max value." });
    }
    db.query(
        "UPDATE class_types SET MaxParticipants = ?",
        [max],
        (err, result) => {
            if (err) return res.status(500).json({ error: "Database error" });
            res.json({ success: true });
        }
    );
});

// ====================================
// ADMIN CLASS TYPES CONTROL ENDS HERE
// ====================================

module.exports = router;
