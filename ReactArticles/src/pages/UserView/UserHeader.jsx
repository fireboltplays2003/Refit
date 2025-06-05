import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import styles from "./UserHeader.module.css";
import axios from "axios";

export default function UserHeader({ onProfile }) {
  const [dropdown, setDropdown] = useState(false);
  const [name, setName] = useState("YourName");
  const navigate = useNavigate();
  
  useEffect(() => {
    axios.get("/whoami", { withCredentials: true })
      .then(res => {
        // Truncate name if too long for header
        const n = (res.data.FirstName + " " + res.data.LastName).trim();
        setName(n.length > 16 ? n.slice(0, 14) + "…" : n);
      })
      .catch(() => {
        setName("User");
      });
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function close(e) {
      if (!e.target.closest(`.${styles.profileBtn}`)) setDropdown(false);
    }
    if (dropdown) window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [dropdown]);

  return (
    <header className={styles.header}>
      <NavLink to="/user" className={styles.logoContainer} style={{ textDecoration: 'none' }}>
        <span className={styles.specialR}>R</span>
        <span className={styles.namePart}>efit</span>
      </NavLink>
      <nav className={styles.nav}>
        <NavLink className={styles.link} to="/user">Home</NavLink>
        <NavLink className={styles.link} to="/register-membership">Register Membership</NavLink>
        <div
          className={styles.profileBtn}
          onClick={() => setDropdown((v) => !v)}
        >
          <FaUserCircle size={28} style={{ marginRight: 7, verticalAlign: "middle" }} />
          <span className={styles.userName}>{name}</span>
          <div className={dropdown ? styles.dropdownActive : styles.dropdown}>
            <div
              className={styles.dropLink}
              onClick={() => {
                setDropdown(false);
                if (onProfile) onProfile(); // Trigger modal
              }}
            >
              Profile
            </div>
            <div
              className={styles.dropLink}
              onClick={() => {
                setDropdown(false);
                navigate("/logout");
              }}
            >
              Logout
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
