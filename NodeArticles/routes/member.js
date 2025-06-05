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
  const { classTypeName, date } = req.body;

  let sql = `
  SELECT
    c.ClassID,            
    ct.type AS ClassType,
    c.Schedule,
    c.time,
    c.MaxParticipants,
    u.FirstName AS TrainerFirstName,
    u.LastName AS TrainerLastName
  FROM classes c
  JOIN class_types ct ON c.ClassType = ct.id
  JOIN users u ON c.TrainerID = u.UserID
  WHERE u.Role = 'trainer'
`;
  let params = [];

  if (classTypeName && date) {
    sql += " AND ct.type = ? AND DATE(c.Schedule) = ?";
    params = [classTypeName, date];
  } else if (classTypeName) {
    sql += " AND ct.type = ?";
    params = [classTypeName];
  } else if (date) {
    sql += " AND DATE(c.Schedule) = ?";
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
  if (!req.session.user || !req.session.user.UserID) {
    return res.status(401).json({ error: "Unauthorized: Not logged in" });
  }

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
router.post("/save-booking", (req, res) => {
  const userId = req.session.user.UserID;
  const { classId } = req.body;

  if (!classId) return res.status(400).json({ error: "Class ID missing" });

  const sql = "INSERT INTO members_classes (ClassID, MemberID) VALUES (?, ?)";
  db.query(sql, [classId, userId], (err, result) => {
    if (err) {
      console.error("Error saving booking:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true });
  });
});

module.exports = router;
