import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import AdminHeader from "./AdminHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import styles from "./AdminView.module.css";
import axios from "axios";

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png",
];

function toDisplayDate(isoDate) {
  if (!isoDate) return "";
  try {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "Invalid date";
  }
}

function getUpcomingLabel(classDate, classTime) {
  const now = new Date();
  const classDateTime = new Date(classDate + "T" + (classTime || "00:00"));
  const daysDiff = Math.floor((classDateTime - now) / (1000 * 60 * 60 * 24));
  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    return Math.ceil((((d - yearStart) / 86400000) + 1)/7);
  }
  const nowWeek = getWeekNumber(now);
  const classWeek = getWeekNumber(classDateTime);

  if (
    now.getFullYear() === classDateTime.getFullYear() &&
    now.getMonth() === classDateTime.getMonth() &&
    now.getDate() === classDateTime.getDate()
  ) {
    return "Today";
  } else if (
    classDateTime > now &&
    classWeek === nowWeek &&
    classDateTime.getFullYear() === now.getFullYear()
  ) {
    return "This Week";
  } else if (
    daysDiff > 0 && daysDiff <= 30
  ) {
    return "This Month";
  }
  return null;
}

export default function AdminView({ user, setUser }) {
  const navigate = useNavigate();
  const [bgIndex, setBgIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [allClasses, setAllClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  // NEW: Previous month
  const [prevMonthClasses, setPrevMonthClasses] = useState([]);
  const [loadingPrev, setLoadingPrev] = useState(true);

  useEffect(() => {
    if (!user || !user.Role) {
      navigate("/login");
    } else if (user.Role !== "admin") {
      navigate("/" + user.Role);
    }
  }, [user, navigate]);

  useEffect(() => {
    const interval = setInterval(() => {
      setBgIndex(prev => (prev + 1) % images.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Upcoming 30 days
  useEffect(() => {
    setLoading(true);
    axios
      .get("/admin/all-upcoming-classes-with-count", { withCredentials: true })
      .then((res) => {
        const now = new Date();
        const thirtyDaysLater = new Date(now);
        thirtyDaysLater.setDate(now.getDate() + 30);

        const filtered = (res.data || []).filter(cls => {
          const classDateTime = new Date(cls.Schedule + "T" + (cls.time || "00:00"));
          return classDateTime >= now && classDateTime <= thirtyDaysLater;
        });

        // Sort by soonest
        filtered.sort((a, b) =>
          new Date(a.Schedule + "T" + (a.time || "00:00")) -
          new Date(b.Schedule + "T" + (b.time || "00:00"))
        );
        setAllClasses(filtered);
        setLoading(false);
      })
      .catch(() => {
        setAllClasses([]);
        setLoading(false);
      });
  }, []);

  // Previous month section
  useEffect(() => {
    setLoadingPrev(true);
    axios
      .get("/admin/all-previous-30days-classes-with-count", { withCredentials: true })
      .then((res) => {
        setPrevMonthClasses(res.data || []);
        setLoadingPrev(false);
      })
      .catch(() => {
        setPrevMonthClasses([]);
        setLoadingPrev(false);
      });
  }, []);

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
      <AdminHeader user={user} setUser={setUser} onProfile={() => setShowProfile(true)} />
      <main className={styles.mainContent}>
        {/* Upcoming 30 days */}
        <div className={styles.classSectionContainer}>
          <section className={styles.classesSection}>
            <h2 className={styles.sectionTitle}>Upcoming Classes (Next 30 Days)</h2>
            <div className={styles.sectionDivider} />
            {loading ? (
              <div className={styles.loadingMsg}>Loading classes...</div>
            ) : allClasses.length === 0 ? (
              <div className={styles.noClassesMsg}>
                No classes scheduled in the next 30 days.
              </div>
            ) : (
              <div className={styles.classListHorizontal}>
                {allClasses.map(cls => (
                  <div className={styles.classCard} key={cls.ClassID}>
                    <div className={styles.classMainInfo}>
                      <span className={styles.classType}>
                        {cls.ClassTypeName || cls.ClassType || "Class"}
                      </span>
                      <span className={styles.classDateTime}>
                        {toDisplayDate(cls.Schedule)} at {cls.time?.slice(0, 5)}
                      </span>
                    </div>
                    <div className={styles.classTrainer}>
                      Trainer: {cls.TrainerFirstName} {cls.TrainerLastName}
                    </div>
                    <div className={styles.bookedCountRow}>
                      <span className={styles.bookedCountNum}>
                        {cls.bookedCount}/{cls.MaxParticipants} booked
                      </span>
                    </div>
                    {(() => {
                      const lbl = getUpcomingLabel(cls.Schedule, cls.time);
                      if (!lbl) return null;
                      return <span className={styles.upcomingLabel}>{lbl}</span>;
                    })()}
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
        {/* Previous month */}
        <div className={styles.classSectionContainer}>
          <section className={styles.classesSection}>
            <h2 className={styles.sectionTitle}>Previous Month's Classes</h2>
            <div className={styles.sectionDivider} />
            {loadingPrev ? (
              <div className={styles.loadingMsg}>Loading classes...</div>
            ) : prevMonthClasses.length === 0 ? (
              <div className={styles.noClassesMsg}>
                No classes found for previous month.
              </div>
            ) : (
              <div className={styles.classListHorizontal}>
                {prevMonthClasses.map(cls => (
                  <div className={styles.classCard} key={cls.ClassID}>
                    <div className={styles.classMainInfo}>
                      <span className={styles.classType}>
                        {cls.ClassTypeName || cls.ClassType || "Class"}
                      </span>
                      <span className={styles.classDateTime}>
                        {toDisplayDate(cls.Schedule)} at {cls.time?.slice(0, 5)}
                      </span>
                    </div>
                    <div className={styles.classTrainer}>
                      Trainer: {cls.TrainerFirstName} {cls.TrainerLastName}
                    </div>
                    <div className={styles.bookedCountRow}>
                      <span className={styles.bookedCountNum}>
                        {cls.bookedCount}/{cls.MaxParticipants} booked
                      </span>
                    </div>
                    {/* Optionally: do NOT show the 'This Week/Month' label here */}
                  </div>
                ))}
              </div>
            )}
          </section>
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
