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

  // Update the user
  const sqlUpdate = `
    UPDATE users
    SET FirstName = ?, LastName = ?, Email = ?, Phone = ?
    WHERE UserID = ?
  `;

  db.query(sqlUpdate, [FirstName, LastName, Email, Phone, userId], (err, result) => {
    if (err) {
      console.error("Error updating profile:", err);
      return res.status(500).json({ error: "Database error" });
    }
    // Now, fetch the updated user:
    const sqlSelect = `
      SELECT UserID, FirstName, LastName, Email, Phone, Role
      FROM users
      WHERE UserID = ?
      LIMIT 1
    `;
    db.query(sqlSelect, [userId], (err2, rows) => {
      if (err2 || !rows.length) {
        return res.status(500).json({ error: "Failed to fetch updated profile" });
      }
      // Remove sensitive fields if any
      const updatedUser = rows[0];
      res.json({ success: true, updatedUser });
    });
  });
});

module.exports = router;
