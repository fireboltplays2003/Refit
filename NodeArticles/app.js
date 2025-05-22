const express = require('express');
const app = express();
const cors = require("cors");
const loginRoute = require('./routes/login');
const registerRoute = require('./routes/register');
const port = 8801;
app.use(cors());
app.use(express.json());

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
