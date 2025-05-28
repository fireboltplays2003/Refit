import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import MemberHeader from "../MemberView/MemberHeader";
import Footer from "../../components/Footer";

export default function MemberView() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    axios.get("/whoami", { withCredentials: true })
      .then(res => {
        setName(res.data.FirstName + " " + res.data.LastName);
        if (res.data.Role !== "member") {
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
      <MemberHeader />
      <div>
        <h2>Member Dashboard</h2>
        <div>Welcome, {name}!</div>
      </div>
      <Footer />
    </>
  );
}
