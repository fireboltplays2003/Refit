import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";
import ProfileModal from "../../components/ProfileModal";
import styles from "./TrainerView.module.css";
import axios from "axios";

const images = [
  "/img/img1.jpg",
  "/img/img2.jpg",
  "/img/img3.jpg",
  "/img/img4.jpg",
  "/img/img5.jpg",
  "/img/membershipImage.png"
];

function toDateStringISO(date) {
  return date.toISOString().slice(0, 10);
}

function formatDateTime(isoDate, time) {
  if (!isoDate) return "";
  const d = new Date(isoDate);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  let hour = "00", min = "00";
  if (time && time.length >= 5) [hour, min] = time.split(":");
  return `${day}/${month}/${year} ${hour}:${min}`;
}

function toDisplayDate(isoDate) {
  if (!isoDate) return "";
  try {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return "Invalid date";
  }
}

function getUpcomingLabel(classDate, classTime) {
  const now = new Date();
  const todayY = now.getFullYear();
  const todayM = now.getMonth();
  const todayD = now.getDate();

  const classDateTime = new Date(classDate + "T" + (classTime || "00:00"));
  const classY = classDateTime.getFullYear();
  const classM = classDateTime.getMonth();
  const classD = classDateTime.getDate();

  function getWeekNumber(d) {
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay()||7));
    var yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    var weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    return weekNo;
  }
  const nowWeek = getWeekNumber(now);
  const classWeek = getWeekNumber(classDateTime);

  if (todayY === classY && todayM === classM && todayD === classD) {
    return "Today";
  } else if (
    classY === todayY &&
    classWeek === nowWeek &&
    classDateTime > now
  ) {
    return "This Week";
  } else if (
    (classY === todayY && classWeek === nowWeek + 1) ||
    (classY === todayY + 1 && nowWeek === 52 && classWeek === 1)
  ) {
    return "Next Week";
  }
  return null;
}

export default function TrainerView({ user, setUser }) {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [bgIndex, setBgIndex] = useState(0);
  const [showProfile, setShowProfile] = useState(false);
  const [upcomingClasses, setUpcomingClasses] = useState([]); // For "Next 3 Days"
  const [allUpcomingClasses, setAllUpcomingClasses] = useState([]); // For MemberView-style
  const [loading, setLoading] = useState(true);
  const [fetchingAll, setFetchingAll] = useState(true);

  useEffect(() => {
    if (!user || !user.UserID || user.Role !== "trainer") {
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

  // Fetch "Upcoming Classes (Next 3 Days)" — Only this trainer's classes
  useEffect(() => {
    if (!user || !user.UserID) return;
    setLoading(true);
    axios
      .get("/trainer/classes-with-members", { withCredentials: true })
      .then((res) => {
        const now = new Date();
        const todayISO = toDateStringISO(now);

        const dateStrings = [];
        for (let i = 0; i <= 3; i++) {
          const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() + i);
          dateStrings.push(toDateStringISO(d));
        }

        const filtered = (res.data || []).filter(cls => {
          const isInDateRange = dateStrings.includes(cls.Schedule);
          let passesFilter = false;

          if (!isInDateRange) {
            // out of next 3 days
          } else if (cls.Schedule === todayISO) {
            if (!cls.time) {
              // skip if missing time
            } else {
              const [clsHour, clsMin] = cls.time.split(":").map(Number);
              const nowHour = now.getHours();
              const nowMin = now.getMinutes();

              passesFilter =
                clsHour > nowHour || (clsHour === nowHour && clsMin >= nowMin);
            }
          } else {
            passesFilter = true;
          }
          return passesFilter;
        });

        filtered.sort((a, b) => {
          const aDate = new Date(`${a.Schedule}T${a.time || "00:00"}`);
          const bDate = new Date(`${b.Schedule}T${b.time || "00:00"}`);
          return aDate - bDate;
        });

        setUpcomingClasses(filtered);
        setLoading(false);
      })
      .catch(() => {
        setUpcomingClasses([]);
        setLoading(false);
      });
  }, [user]);

  // Fetch "All Upcoming Classes" in system WITH COUNT
  useEffect(() => {
    if (!user || !user.UserID) return;
    setFetchingAll(true);
    axios
      .get("/trainer/all-upcoming-classes-with-count", { withCredentials: true })
      .then((res) => {
        // Only classes in the future or today
        const now = new Date();
        const upcoming = (res.data || []).filter(cls => {
          const classDateTime = new Date(cls.Schedule + "T" + (cls.time || "00:00"));
          return classDateTime >= now;
        });
        // Sort by soonest
        upcoming.sort((a, b) =>
          new Date(a.Schedule + "T" + (a.time || "00:00")) -
          new Date(b.Schedule + "T" + (b.time || "00:00"))
        );
        setAllUpcomingClasses(upcoming);
        setFetchingAll(false);
      })
      .catch(() => {
        setAllUpcomingClasses([]);
        setFetchingAll(false);
      });
  }, [user]);

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
        {/* -- FLEX CONTAINER: Welcome Left, Classes Card Right -- */}
        <div className={styles.flexRow}>
          <div className={styles.welcomeContainer}>
            <h1 className={styles.welcomeTitle}>
              Welcome Back, <span className={styles.highlight}>{`${user?.FirstName || ""} ${user?.LastName || ""}`}</span>!
            </h1>
            <p className={styles.welcomeText}>
              Here is your dashboard. You can manage your classes, and more.
            </p>
          </div>
          <div className={styles.upcomingCard}>
            <div className={styles.upcomingTitle}>UpComing Classes (Next 3 Days)</div>
            <div className={styles.upcomingUnderline}></div>
            {loading ? (
              <div className={styles.upcomingMsg}>Loading…</div>
            ) : upcomingClasses.length === 0 ? (
              <div className={styles.upcomingMsg}>No upcoming classes in the next 3 days.</div>
            ) : (
              <ul className={styles.upcomingList}>
                {upcomingClasses.map(cls => (
                  <li key={cls.ClassID} className={styles.upcomingItem}>
                    <div>
                      <span className={styles.upcomingType}>{cls.ClassTypeName || "Class"}</span>
                      <span className={styles.upcomingDate}>
                        {formatDateTime(cls.Schedule, cls.time)}
                      </span>
                    </div>
                    <div className={styles.upcomingMembers}>
                      {cls.Members?.length || 0} booked
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* -- Existing Classes List as before -- */}
        <div className={styles.classSectionContainer}>
          <section className={styles.classesSection}>
            <h2 className={styles.sectionTitle}>Existing Classes</h2>
            {fetchingAll ? (
              <div className={styles.loadingMsg}>Loading classes...</div>
            ) : allUpcomingClasses.length === 0 ? (
              <div className={styles.noClassesMsg}>
                No upcoming classes
              </div>
            ) : (
              <div className={styles.classListHorizontal}>
                {allUpcomingClasses.map(cls => (
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
                    <div className={styles.classCountBox}>
                      {/* Strict mapping! Show booked/max or fallback "?" */}
                      {(typeof cls.bookedCount !== "undefined" && typeof cls.MaxParticipants !== "undefined")
                        ? (
                          <span>
                            {cls.bookedCount}/{cls.MaxParticipants > 0 ? cls.MaxParticipants : "?"} booked
                          </span>
                        ) : (
                          <span>?</span>
                        )
                      }
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
