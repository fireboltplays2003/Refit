// routes/classes.js
const express = require("express");
const router = express.Router();
const db = require("../dbSingleton").getConnection();

router.get("/class-types", (req, res) => {
  const sql = `SELECT id, type FROM class_types`;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error fetching class types:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results); // [{ id: 1, type: 'legs' }, ...]
  });
});


router.post("/classes", (req, res) => {
  const { typeId, date } = req.body;

  let sql = `
    SELECT 
      c.ClassID,
      c.ClassType,
      c.Schedule,
      c.time,
      c.MaxParticipants,
      c.TrainerID,
      u.FirstName AS TrainerFirstName,
      u.LastName AS TrainerLastName,
      u.Email AS TrainerEmail
    FROM classes c
    JOIN users u ON c.TrainerID = u.UserID
    WHERE u.Role = 'trainer'
  `;
  let params = [];

  // Add filters dynamically
  if (typeId && date) {
    sql += " AND c.ClassType = ? AND c.Schedule = ?";
    params = [typeId, date];
  } else if (typeId) {
    sql += " AND c.ClassType = ?";
    params = [typeId];
  } else if (date) {
    sql += " AND c.Schedule = ?";
    params = [date];
  }

  db.query(sql, params, (err, results) => {
    if (err) {
      console.error("Error fetching classes:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});

router.get("/class-amount", (req, res) => {
  const userId = req.session.user.UserID;
  const sql = "SELECT ClassAmount FROM membership WHERE UserID = ? LIMIT 1";
  db.query(sql, [userId], (err, results) => {
    if (err) {
      console.error("Error fetching class amount:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (results.length === 0) return res.json({ classAmount: 0 });
    res.json({ classAmount: results[0].ClassAmount });
  });
});

router.post("/use-class", (req, res) => {
  const userId = req.session.user.UserID;
  const sqlCheck = "SELECT ClassAmount FROM membership WHERE UserID = ? LIMIT 1";
  db.query(sqlCheck, [userId], (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0 || results[0].ClassAmount <= 0) {
      return res.status(400).json({ error: "No class credits left." });
    }
    const sqlUpdate = "UPDATE membership SET ClassAmount = ClassAmount - 1 WHERE UserID = ? AND ClassAmount > 0";
    db.query(sqlUpdate, [userId], (err2) => {
      if (err2) return res.status(500).json({ error: "Failed to use class." });
      res.json({ success: true });
    });
  });
});

module.exports = router;
