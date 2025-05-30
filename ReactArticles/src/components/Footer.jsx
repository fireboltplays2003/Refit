import styles from "./Footer.module.css";

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
            <a href="mailto:Stephan042003@gmail.com">Stephan042003@gmail.com</a>
            <span>|</span>
            <a href="mailto:eliasthedab17@gmail.com">eliasthedab17@gmail.com</a>
          </div>
        </div>
        <div className={styles.copyright}>
          &copy; {new Date().getFullYear()} Refit. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
