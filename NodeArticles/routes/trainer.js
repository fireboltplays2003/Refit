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
  
// GET /trainer/classes
router.get("/classes", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "trainer") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const trainerId = user.UserID;
  const query = `
    SELECT c.ClassID, c.ClassType, ct.type AS ClassTypeName, c.Schedule, c.MaxParticipants
    FROM classes c
    JOIN class_types ct ON c.ClassType = ct.id
    WHERE c.TrainerID = ?
    ORDER BY c.Schedule DESC
  `;
  db.query(query, [trainerId], (err, results) => {
    if (err) {
      console.error("SQL error:", err); // <- ADD THIS LINE FOR DEBUG
      return res.status(500).json({ error: "Database error" });
    }
    res.json(results);
  });
});


// PUT /trainer/class/:classId
router.put("/class/:classId", (req, res) => {
  const user = req.session.user;
  if (!user || user.Role !== "trainer") {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const trainerId = user.UserID;
  const { classTypeId, schedule, maxParticipants } = req.body;
  const classId = req.params.classId;

  // Column names must match your DB schema!
  const query = `
    UPDATE classes 
    SET ClassType = ?, Schedule = ?, MaxParticipants = ?
    WHERE ClassID = ? AND TrainerID = ?
  `;
  db.query(query, [classTypeId, schedule, maxParticipants, classId, trainerId], (err, result) => {
    if (err) {
      console.error("DB Update Error:", err); // Print real error for debugging!
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Class not found or not owned by trainer" });
    }
    res.json({ message: "Class updated successfully" });
  });
});
// DELETE /trainer/class/:id
router.delete('/class/:id', (req, res) => {
  const user = req.session.user;
  const classId = req.params.id;

  if (!user || user.Role !== "trainer") {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // Only allow deleting classes that belong to the trainer
  const sql = 'DELETE FROM classes WHERE ClassID = ? AND TrainerID = ?';
  db.query(sql, [classId, user.UserID], (err, result) => {
    if (err) {
      console.error("Delete class error:", err);
      return res.status(500).json({ error: "Database error" });
    }
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: "Class not found or not yours" });
    }
    res.json({ message: "Class deleted successfully" });
  });
});


module.exports = router;
  