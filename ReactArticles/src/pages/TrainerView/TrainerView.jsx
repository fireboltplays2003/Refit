import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";

export default function TrainerView() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [name, setName] = useState("");

  useEffect(() => {
    axios.get("/whoami", { withCredentials: true })
      .then(res => {
        setName(res.data.FirstName + " " + res.data.LastName);
        if (res.data.Role !== "trainer") {
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
      <TrainerHeader />
      <div>
        <h1>Trainer View</h1>
        <div>Welcome, {name}!</div>
      </div>
      <Footer />
    </>
  );
}
