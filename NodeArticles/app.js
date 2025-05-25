const express = require('express');
const app = express();
const cors = require("cors");
const loginRoute = require('./routes/login');
const registerRoute = require('./routes/register');
//const session = require("express-session");
const port = 8801;

app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true                
}));


//app.use(cors());
app.use(express.json());

app.use(session({
  secret: 'your_secret_key',       
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,               
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24    
  }
}));



app.use('/login', loginRoute);
app.use('/register', registerRoute);
app.use((err, req, res, next) => {
  console.error(err); // Log error
  res.status(500).json({
    error: 'Internal Server Error',
    message: err.message,
  });
});

app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
