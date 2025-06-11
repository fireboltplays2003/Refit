const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const db = dbSingleton.getConnection();

router.get('/my-notifications', (req, res) => {
    const userId = req.session.user?.UserID || req.query.userId;
    if (!userId) return res.status(401).json({ error: "Unauthorized" });
  
    db.query(`
      SELECT n.*
      FROM notifications n
      WHERE n.UserID = ? AND n.Status = 'unread'
      ORDER BY n.NotificationDate DESC
    `, [userId], (err, rows) => {
      if (err) return res.status(500).json({ error: "DB error" });
      res.json(rows);
    });
  });
  
  module.exports = router;