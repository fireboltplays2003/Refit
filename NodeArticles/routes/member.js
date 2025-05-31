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

router.post("/classes-with-trainers", (req, res) => {
  const { typeId, date } = req.body;

  if (!typeId || !date) {
    return res.status(400).json({ error: "Missing typeId or date in request." });
  }

  const sql = `
    SELECT 
      c.ClassID,
      c.ClassType,
      c.Schedule,
      c.time,
      c.MaxParticipants,
      t.UserID,
      t.Reviews,
      t.Ratings
    FROM classes c
    JOIN trainers t ON c.TrainerID = t.UserID
    WHERE c.ClassType = ? AND DATE(c.Schedule) = ?
  `;

  db.query(sql, [typeId, date], (err, results) => {
    if (err) {
      console.error("Error fetching class-trainer info:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});


module.exports = router;
