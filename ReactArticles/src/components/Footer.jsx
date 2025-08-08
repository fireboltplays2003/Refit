import styles from "./Footer.module.css";
import { NavLink } from "react-router-dom";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContent}>
        <div className={styles.brand}>
          <span className={styles.logoR}>R</span>efit
        </div>
        <div className={styles.contactInfo}>
          <div className={styles.contactTitle}>Contact Us</div>
          <div className={styles.contactEmails}>
            <a href="mailto:refitgym.app@gmail.com" className={styles.footerLink}>refitgym.app@gmail.com</a>
          </div>
        </div>
        <div className={styles.footerLinksRow}>
          <NavLink to="/about" className={styles.footerLink}>
            About
          </NavLink>
        </div>
        <div className={styles.copyright}>
          &copy; {new Date().getFullYear()} Refit. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
