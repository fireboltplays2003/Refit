const express = require("express");
const router = express.Router();
const dbSingleton = require("../dbSingleton");
const bcrypt = require('bcrypt');
const db = dbSingleton.getConnection();

router.post("/", (req, res) => {
    const { email, password } = req.body;
    console.log(req.body);
   
    const query = "SELECT * FROM users WHERE email = ?";
    db.query(query, [email], (err, results) => {
        if (err) {
            res.status(500).json({ error: "Database error" });
            return;
        }
        if (results.length === 0) {
            res.status(401).json({ message: "Invalid credentials" });
            return;
        }

    
        const user = results[0];
        console.log(user);
        bcrypt.compare(password, user.Password, (err, isMatch) => {
            if (err) {
                res.status(500).json({ error: "Error comparing passwords" });
                return;
            }
            if (!isMatch) {
                res.status(401).json({ message: "Invalid credentials" });
                return;
            }

            req.session.user = user;
            res.json(req.session.user);
        });
    });
});

module.exports = router;
