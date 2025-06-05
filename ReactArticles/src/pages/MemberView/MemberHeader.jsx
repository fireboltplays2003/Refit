import { NavLink } from "react-router-dom";
import styles from "./MemberHeader.module.css";

export default function MemberHeader() {
  return (
    <header className={styles.header}>
      <nav className={styles.nav}>
        <NavLink
          to="/home"
          className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
        >Home</NavLink>
        <NavLink
          to="/membership"
          className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
        >My Membership</NavLink>
        <NavLink
          to="/book-class"
          className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
        >Book Class</NavLink>
        <NavLink
          to="/profile"
          className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
        >Profile</NavLink>
        <NavLink
          to="/logout"
          className={({ isActive }) => isActive ? `${styles.link} ${styles.active}` : styles.link}
        >Logout</NavLink>
      </nav>
    </header>
  );
}
