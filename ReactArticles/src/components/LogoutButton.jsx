import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function LogoutButton({ setUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await axios.post("/logout", {}, { withCredentials: true });
    } catch (e) {
      // Optional: show error or ignore if logout fails
    } finally {
      setUser({}); // clear user in frontend
      navigate("/login");
    }
  };

  return (
    <button onClick={handleLogout}>
      Logout
    </button>
  );
}
