import { NavLink } from "react-router-dom";
import { useState, useEffect } from "react";
import { FaUserCircle } from "react-icons/fa";
import axios from "axios";
import styles from "./TrainerHeader.module.css";

export default function TrainerHeader({ trainer, onProfile, setTrainer }) {
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
        <NavLink to="/trainer" className={styles.logoContainer} style={{ textDecoration: 'none' }}>
          <span className={styles.specialR}>R</span>
          <span className={styles.namePart}>efit</span>
        </NavLink>
        <nav className={styles.nav}>
          <NavLink className={styles.link} to="/trainer" end>Home</NavLink>
          <NavLink className={styles.link} to="/trainer/add-class">Add Class</NavLink>
          <NavLink className={styles.link} to="/trainer/modify-class">Modify Class</NavLink>
          <NavLink className={styles.link} to="/trainer/classes">My Classes</NavLink>
        </nav>
      </div>
      <div className={styles.rightSection}>
        <div
          className={styles.profileBtn}
          onClick={() => setDropdown((v) => !v)}
        >
          <FaUserCircle size={28} style={{ marginRight: 7, verticalAlign: "middle" }} />
          <span className={styles.userName}>
            {(trainer?.FirstName || "") + " " + (trainer?.LastName || "")}
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
                setTrainer(null);
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
