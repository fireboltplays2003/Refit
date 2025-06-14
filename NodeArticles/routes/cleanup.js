// routes/cleanup.js
const express = require("express");
const router = express.Router();
const db = require("../dbSingleton").getConnection();

// --- CLEANUP FUNCTION (exported) ---
function cleanupOutdatedClasses(callback = () => {}) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  db.query(
    `SELECT ClassID FROM classes WHERE Schedule < ?`,
    [today],
    (err, results) => {
      if (err) {
        console.error("[CLEANUP] Error fetching outdated classes:", err);
        return callback(err);
      }
      if (!results.length) {
        console.log("[CLEANUP] No outdated classes found.");
        return callback(null, 0);
      }
      const outdatedIds = results.map(row => row.ClassID);
      // Remove member bookings for these classes
      db.query(
        `DELETE FROM members_classes WHERE ClassID IN (?)`,
        [outdatedIds],
        (err2) => {
          if (err2) console.error("[CLEANUP] Failed to remove member bookings:", err2);
          // Remove the classes themselves
          db.query(
            `DELETE FROM classes WHERE ClassID IN (?)`,
            [outdatedIds],
            (err3, result) => {
              if (err3) {
                console.error("[CLEANUP] Failed to remove outdated classes:", err3);
                return callback(err3);
              }
              console.log(`[CLEANUP] Removed ${outdatedIds.length} outdated classes.`);
              callback(null, outdatedIds.length);
            }
          );
        }
      );
    }
  );
}

// --- API Route remains ---
router.post("/cleanup-outdated-classes", async (req, res) => {
  cleanupOutdatedClasses((err, removedCount) => {
    if (err) return res.status(500).json({ error: "Cleanup failed" });
    res.json({ removed: removedCount });
  });
});

module.exports = router;
module.exports.cleanupOutdatedClasses = cleanupOutdatedClasses;
