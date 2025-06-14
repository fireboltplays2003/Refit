import React, { useEffect, useState } from "react";
import axios from "axios";
import { BrowserRouter } from "react-router-dom";
import MyRoutes from "./components/MyRoutes";
import "./App.css";

function App() {
  const [user, setUser] = useState(null); // null = not checked yet
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/whoami", { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(err => {
        // Only suppress the error if it is 401 Unauthorized
        if (err.response && err.response.status === 401) {
          setUser({});
          // Suppress error: do nothing, do not log anything
          return ""; // just return, do not log
        } else {
          // For other errors, you can still log them if you want
          // console.error(err); // (comment out or remove this line)
        }
      })
      .finally(() => setLoading(false));
  }, []);
  if (loading) return <div>Loading...</div>;

  return (
    <div className="App">
      <BrowserRouter>
        <MyRoutes user={user} setUser={setUser} />
      </BrowserRouter>
    </div>
  );
}

export default App;
