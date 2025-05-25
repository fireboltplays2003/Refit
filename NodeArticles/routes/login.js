const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const db = dbSingleton.getConnection();


router.post("/", (req, res) => {
const { email, password } = req.body;
   const query = "SELECT * FROM users WHERE email = ? AND password = ?";
    db.query(query, [email, password], (err, results) => {
    if (err) {
        res.status(500).json({ error: "Database error" });
    }
   else if (results.length > 0) {
        res.json(results);
    } else {
        res.status(401).json({ message: "Invalid credentials" });
    }
    });
});
module.exports = router
