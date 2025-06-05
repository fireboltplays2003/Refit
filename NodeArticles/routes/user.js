const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const bcrypt = require('bcrypt');
const multer = require("multer");
const upload = multer(); 
const fileType = require('file-type');
const db = dbSingleton.getConnection();

router.post("/register-membership", (req, res) => {
    const { userId, membershipTypeId, months } = req.body;
  
    const sql = `
      INSERT INTO membership (UserID, MemberShipType, StartDate, EndDate)
      VALUES (?, ?, NOW(), DATE_ADD(NOW(), INTERVAL ? MONTH))`;
  
    db.query(sql, [userId, membershipTypeId, months], (err, result) => {
      if (err) {
        console.error("DB insert error:", err);
        return res.status(500).json({ error: "DB insert failed" });
      }
      res.status(201).json({ message: "Membership added" });
    });
  });
  
router.post("/update-role", (req, res) => {
    const { userId, newRole } = req.body;
  
    const sql = `UPDATE users SET Role = ? WHERE UserID = ?`;
    db.query(sql, [newRole, userId], (err, result) => {
      if (err) {
        console.error("Role update error:", err);
        return res.status(500).json({ error: "Role update failed" });
      }
      res.json({ message: "Role updated" });
    });
  });
  
module.exports = router;