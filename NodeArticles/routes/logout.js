const express = require("express");
const router = express.Router();

router.post("/", (req, res) => {
    // Destroy the session
    req.session.destroy(err => {
        if (err) {
            // Handle error if session could not be destroyed
            return res.status(500).json({ error: "Failed to logout. Please try again." });
        }
        // Clear the cookie (if using cookies for session)
        res.clearCookie("connect.sid");
        res.json({ message: "Logout successful" });
    });
});

module.exports = router;
