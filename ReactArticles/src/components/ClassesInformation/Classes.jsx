import React, { useState } from "react";
import styles from "./Classes.module.css";
import ProfileModal from "../../components/ProfileModal";
import Footer from "../../components/Footer";
import UserHeader from "../../pages/UserView/UserHeader";
import { useNavigate } from "react-router-dom";

const classes = [
  {
    name: "Legs",
    img: "/img/legs.png",
    description: "Leg day is the foundation! Build muscle, power, and stability with professional trainer-led workouts targeting all the lower body."
  },
  {
    name: "Chest",
    img: "/img/chest.png",
    description: "Grow and define your chest with effective bench, dumbbell, and cable routines in a supportive environment."
  },
  {
    name: "Back",
    img: "/img/back.png",
    description: "Unlock strength and posture with our back-focused classes. Pull-ups, rows, and more for all levels."
  },
  {
    name: "Pilates",
    img: "/img/pilates.png",
    description: "Improve core strength, flexibility, and balance with our Pilates classes. Perfect for all ages and fitness backgrounds."
  }
];

export default function Classes({ user, setUser }) {
  const [showProfile, setShowProfile] = useState(false);
  const navigate = useNavigate();

  // Redirect if not user or not logged in
  if (!user || !user.Role) return null;
  if (user.Role !== 'user') {
    navigate("/" + user.Role);
    return null;
  }

  return (
    <>
      <UserHeader user={user} setUser={setUser} onProfile={() => setShowProfile(true)} />
      <div className={styles.classesBg}>
        <h1 className={styles.title}>
          <span>Our</span> Classes
        </h1>
        <div className={styles.welcomeBox}>
          <h2>Discover Your Strength, Find Your Balance</h2>
          <p>
            At REFiT, we believe fitness is for everyone—whether you’re building muscle, improving endurance, or seeking a more balanced, flexible body. Our certified trainers lead a range of classes designed for all levels:
          </p>
          <ul>
            <li><b>Legs:</b> Boost power and stability for a solid foundation.</li>
            <li><b>Chest:</b> Sculpt and strengthen with targeted routines.</li>
            <li><b>Back:</b> Improve posture and unlock upper body strength.</li>
            <li><b>Pilates:</b> Elevate your core strength, flexibility, and mind-body connection.</li>
          </ul>
          <p>
            Every membership includes access to our modern gym, expert-led classes, and personalized support. With our flexible plans, you choose what fits your lifestyle—plus, track your progress and unlock new challenges each month!
          </p>
          <b>Ready to start your journey? Join REFiT today and experience a new level of health and community.</b>
        </div>
        <p className={styles.subtitle}>
          Explore our popular class types led by certified trainers.<br />
          Find what fits your fitness journey.
        </p>
        <div className={styles.cardsGrid}>
          {classes.map((cls) => (
            <div key={cls.name} className={styles.card}>
              <img src={cls.img} alt={cls.name} className={styles.cardImg} />
              <h2 className={styles.cardTitle}>{cls.name}</h2>
              <p className={styles.cardDesc}>{cls.description}</p>
            </div>
          ))}
        </div>
        <Footer />
        <ProfileModal
          show={showProfile}
          onClose={() => setShowProfile(false)}
          userData={user}
          onUpdate={setUser}
        />
      </div>
    </>
  );
}
