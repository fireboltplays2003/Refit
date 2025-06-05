const express = require('express');
const app = express();
const cors = require("cors");
const loginRoute = require('./routes/login');
const registerRoute = require('./routes/register');
const session = require("express-session");
const roleAuth = require("./routes/RoleAuth");
const adminRoute = require("./routes/admin");
const logoutRoute = require("./routes/logout");
const trainerRoute = require("./routes/trainer");
const paypalRoutes = require('./routes/paypal');
const port = 8801;
const classesRoute = require("./routes/member");
const userRoute = require("./routes/user");

app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true
}));

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

app.use('/whoami', roleAuth);

app.use('/user', userRoute);

app.use('/admin', adminRoute);

app.use('/logout', logoutRoute);

app.use('/trainer', trainerRoute);

app.use('/member', classesRoute);

app.use('/api/paypal', paypalRoutes);

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
