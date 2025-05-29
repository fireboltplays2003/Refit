const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const db = dbSingleton.getConnection();
// GET /class-types
router.get("/class-types", (req, res) => {
    const query = "SELECT * FROM class_types";
    db.query(query, (err, results) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json(results);
    });
  });

router.post("/create-class", (req, res) => {
    console.log("sssssadadada");
    const user = req.session.user;
    
    if (!user || user.Role !== "trainer") {
      return res.status(401).json({ error: "Unauthorized" });
    }
  
    const trainerId = user.UserID; // update based on your session
    const { classTypeId, schedule, maxParticipants } = req.body;
  
    if (!classTypeId || !schedule || !maxParticipants) {
      return res.status(400).json({ error: "Missing class data" });
    }
  
    const query = `
      INSERT INTO classes (ClassType, TrainerID, Schedule, MaxParticipants)
      VALUES (?, ?, ?, ?)
    `;
  
    db.query(query, [classTypeId, trainerId, schedule, maxParticipants], (err, results) => {
      if (err) {
        console.error("DB Insert Error:", err);
        return res.status(500).json({ error: "Database error" });
      }
      res.status(200).json({ message: "Class created successfully", classId: results.insertId });
    });
  });
  

module.exports = router;
  