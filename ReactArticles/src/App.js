import { BrowserRouter } from "react-router-dom";
import MyRoutes from "./components/MyRoutes";
import "./App.css";
import React, { useEffect, useState } from "react";
import axios from "axios";
function App() {
  const [user, setUser] = useState(null); // null = not checked yet
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get("/whoami", { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser({})) // {} = not logged in
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>; // Show loading spinner

  return (
    <div className="App">
      <BrowserRouter>
        <MyRoutes user={user} setUser={setUser} />
      </BrowserRouter>
    </div>
  );
}
export default App;
