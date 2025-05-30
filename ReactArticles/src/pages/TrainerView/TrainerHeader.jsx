import { NavLink, useNavigate } from "react-router-dom";
import styles from "./TrainerHeader.module.css";

export default function TrainerHeader() {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Optionally clear session or localStorage here
    navigate('/login');
  };

  return (
    <div className={styles.trainerHeader}>
      {/* Logo on the left */}
      <div className={styles.logoContainer}>
        <span className={styles.websiteName}>
          <span className={styles.specialR}>R</span>
          <span className={styles.namePart}>efit</span>
        </span>
      </div>

      {/* Centered dashboard title and nav */}
      <div className={styles.headerCenter}>
        <h2 className={styles.headerTitle}>Trainer Dashboard</h2>
        <nav className={styles.nav}>
          <NavLink 
            to="/trainer"
            end
            className={({ isActive }) =>
              isActive ? styles.activeNavLink : styles.navLink
            }
          >
            Home
          </NavLink>
          <NavLink 
            to="/trainer/add-class"
            className={({ isActive }) =>
              isActive ? styles.activeNavLink : styles.navLink
            }
          >
            Add Class
          </NavLink>
          <NavLink 
            to="/trainer/modify-class"
            className={({ isActive }) =>
              isActive ? styles.activeNavLink : styles.navLink
            }
          >
            Modify Class
          </NavLink>
          <button
            onClick={handleLogout}
            className={styles.navLink}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}
          >
            Logout
          </button>
        </nav>
      </div>
    </div>
  );
}
