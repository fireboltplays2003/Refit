import { NavLink, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import styles from "./MemberHeader.module.css";
import axios from "axios";

export default function MemberHeader({ user, onProfile, setUser }) {
  const [dropdown, setDropdown] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    function close(e) {
      if (!e.target.closest(`.${styles.profileBtn}`)) setDropdown(false);
    }
    if (dropdown) window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [dropdown]);

  // LOGOUT handler (no separate component needed)
  async function handleLogout() {
    try {
      await axios.post("/logout", {}, { withCredentials: true });
      setUser({}); // Clear global user state
      navigate("/login");
    } catch {
      // Optionally, show error message
      setUser({});
      navigate("/login");
    }
  }

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <NavLink to="/member" className={styles.logoContainer} style={{ textDecoration: 'none' }}>
          <span className={styles.specialR}>R</span>
          <span className={styles.namePart}>efit</span>
        </NavLink>
        <nav className={styles.nav}>
          <NavLink className={styles.link} to="/member">Home</NavLink>
          <NavLink className={styles.link} to="/membership">My Membership</NavLink>
          <NavLink className={styles.link} to="/renew-membership">Renew Membership</NavLink>
          <NavLink className={styles.link} to="/book-class">Book Class</NavLink>
        </nav>
      </div>
      <div className={styles.rightSection}>
        <div
          className={styles.profileBtn}
          onClick={() => setDropdown((v) => !v)}
        >
          <FaUserCircle size={28} style={{ marginRight: 7, verticalAlign: "middle" }} />
          <span className={styles.userName}>
            {(user?.FirstName || "") + " " + (user?.LastName || "")}
          </span>
          <div className={dropdown ? styles.dropdownActive : styles.dropdown}>
            <div
              className={styles.dropLink}
              onClick={() => {
                setDropdown(false);
                if (onProfile) onProfile();
              }}
            >
              Profile
            </div>
            <div
              className={styles.dropLink}
              onClick={() => {
                setDropdown(false);
                handleLogout();
              }}
            >
              Logout
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
