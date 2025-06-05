const express = require("express");
const router = express.Router();
const db = require("../dbSingleton").getConnection();

router.put("/update", (req, res) => {
  // Check for session user
  const userId = req.session.user?.UserID;
  if (!userId) return res.status(401).json({ error: "Not logged in" });

  const { FirstName, LastName, Email, Phone } = req.body;
  if (!FirstName || !LastName || !Email || !Phone) {
    return res.status(400).json({ error: "Missing fields" });
  }

  const sql = `
    UPDATE users
    SET FirstName = ?, LastName = ?, Email = ?, Phone = ?
    WHERE UserID = ?
  `;

  db.query(sql, [FirstName, LastName, Email, Phone, userId], (err, result) => {
    if (err) {
      console.error("Error updating profile:", err);
      return res.status(500).json({ error: "Database error" });
    }
    res.json({ success: true });
  });
});

module.exports = router;
