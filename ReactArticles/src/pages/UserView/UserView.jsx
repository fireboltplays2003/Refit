import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Footer from "../../components/Footer";
import UserHeader from "./UserHeader";

export default function UserView() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    axios.get("/whoami", { withCredentials: true })
      .then(res => {
        setName(res.data.FirstName + " " + res.data.LastName);
        if (res.data.Role !== "user") {
          navigate("/" + res.data.Role);
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  if (!authorized) return null;

  return (
    <>
      <UserHeader />
      <div>
        <h2>User Dashboard</h2>
        <div>Welcome, {name}!</div>
      </div>
      <Footer />
    </>
  );
}
