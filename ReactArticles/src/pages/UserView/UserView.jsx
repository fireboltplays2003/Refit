import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./UserView.module.css";
import UserHeader from "./UserHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png"
];

export default function UserView({ user, setUser }) {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  // Redirect if not user
  useEffect(() => {
    if (!user || !user.Role) return;
    if (user.Role !== "user") {
      navigate("/" + user.Role);
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
      <UserHeader user={user} setUser={setUser} onProfile={() => setShowProfile(true)} />
      <main className={styles.mainContent}>
        <div className={styles.welcomeContainer}>
          <h1 className={styles.welcomeTitle}>
            Welcome Back, <span className={styles.highlight}>{(user.FirstName || "") + " " + (user.LastName || "")}</span>!
          </h1>
          <p className={styles.welcomeText}>
            Your fitness journey continues. Explore your progress and discover new ways to achieve your goals.
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
