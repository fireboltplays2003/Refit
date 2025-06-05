import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Footer from "../../components/Footer";
import UserHeader from "./UserHeader";
import styles from "./UserView.module.css";
import ProfileModal from "../../components/ProfileModal";

const images = ["/img/img1.jpg","/img/img2.jpg","/img/img3.jpg","/img/img4.jpg","/img/img5.jpg"];

export default function UserView() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [user, setUser] = useState({});
  const [bgIndex, setBgIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  useEffect(() => {
    axios.get("/whoami", { withCredentials: true })
      .then(res => {
        setUser(res.data);
        if (res.data.Role !== "user") {
          navigate("/" + res.data.Role);
        } else {
          setAuthorized(true);
        }
      })
      .catch(() => {
        navigate("/login");
      });
  }, [navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!authorized) return null;

  return (
    <div className={styles.bgWrapper}>
      {/* Animated background images */}
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
      {/* UserHeader: triggers profile modal */}
      <UserHeader onProfile={() => setShowProfile(true)} />
      <main className={styles.mainContent}>
        <div className={styles.welcomeContainer}>
          <h1 className={styles.welcomeTitle}>
            Welcome Back, <span className={styles.highlight}>{user.FirstName + " " + user.LastName}</span>!
          </h1>
          <p className={styles.welcomeText}>
            Your fitness journey continues. Explore your progress and discover new ways to achieve your goals.
          </p>
        </div>
      </main>
      <Footer />
      {/* Profile Modal */}
      <ProfileModal
        show={showProfile}
        onClose={() => setShowProfile(false)}
        userData={user}
        onUpdate={u => setUser(v => ({ ...v, ...u }))}
      />
    </div>
  );
}
