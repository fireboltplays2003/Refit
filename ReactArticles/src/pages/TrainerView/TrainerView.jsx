import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import styles from "./TrainerView.module.css";

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png"
];

export default function TrainerView({ user, setUser }) {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  // This ensures trainer data is present and user is authorized
  useEffect(() => {
    if (!user || user.Role !== "trainer") {
      navigate("/login");
    } else {
      setAuthorized(true);
    }
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!authorized) return null;

  return (
    <div className={styles.bgWrapper}>
      {images.map((img, idx) => (
        <div
          key={idx}
          className={styles.bgImg}
          style={{
            backgroundImage: `url(${img})`,
            opacity: bgIndex === idx ? 1 : 0,
            zIndex: 1,
            transition: "opacity 1.2s"
          }}
        />
      ))}
      <div className={styles.overlay} />
      <TrainerHeader
        trainer={user}
        setTrainer={setUser}
        onProfile={() => setShowProfile(true)}
      />
      <main className={styles.mainContent}>
        <div className={styles.welcomeContainer}>
          <h1 className={styles.welcomeTitle}>
            Welcome Back, <span className={styles.highlight}>{(user?.FirstName || "") + " " + (user?.LastName || "")}</span>!
          </h1>
          <p className={styles.welcomeText}>
            Here is your dashboard. You can manage your classes, and more.
          </p>
        </div>
      </main>
      <Footer />
      <ProfileModal
        show={showProfile}
        onClose={() => setShowProfile(false)}
        userData={user}
        onUpdate={setUser}
      />
    </div>
  );
}
