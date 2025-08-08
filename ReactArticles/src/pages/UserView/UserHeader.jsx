import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import axios from "axios";
import styles from "./UserHeader.module.css";

export default function UserHeader({ user, onProfile, setUser }) {
  const [dropdown, setDropdown] = useState(false);

  useEffect(() => {
    function close(e) {
      if (!e.target.closest(`.${styles.profileBtn}`)) setDropdown(false);
    }
    if (dropdown) window.addEventListener("mousedown", close);
    return () => window.removeEventListener("mousedown", close);
  }, [dropdown]);

  return (
    <header className={styles.header}>
      <div className={styles.leftSection}>
        <NavLink to="/user" className={styles.logoContainer} style={{ textDecoration: 'none' }}>
          <span className={styles.specialR}>R</span>
          <span className={styles.namePart}>efit</span>
        </NavLink>
        <nav className={styles.nav}>
          <NavLink className={styles.link} to="/user">Home</NavLink>
          <NavLink className={styles.link} to="/register-membership">Register Membership</NavLink>
          <NavLink className={styles.link} to="/classes">Classes</NavLink>
          <NavLink className={styles.link} to="/about">About</NavLink>
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
              onClick={async () => {
                try {
                  await axios.post("/logout", {}, { withCredentials: true });
                } catch (e) {}
                setUser(null);
                window.location = "/login";
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
