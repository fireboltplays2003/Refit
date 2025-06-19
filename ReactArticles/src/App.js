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
        if (err.response && err.response.status === 401) {
          setUser({});
          return ""; 
        } else {
          console.error(err);
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
