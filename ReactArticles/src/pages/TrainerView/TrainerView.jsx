import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";
import styles from "./TrainerView.module.css";

export default function TrainerView() {
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(false);
  const [name, setName] = useState("");
  const [upcomingClasses, setUpcomingClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalClasses: 0,
    upcomingToday: 0,
    totalParticipants: 0
  });

  useEffect(() => {
    axios.get("/whoami", { withCredentials: true })
      .then((res) => {
        if (res.data.Role === "trainer") {
          setAuthorized(true);
          setName(res.data.FirstName + " " + res.data.LastName);
        } else {
          navigate("/login");
        }
      })
      .catch((err) => {
        console.error("Not logged in:", err);
        navigate("/login");
      });
  }, [navigate]);

  useEffect(() => {
    if (authorized) {
      setLoading(true);
      axios.get("/trainer/classes", { withCredentials: true })
        .then(res => {
          const classes = res.data || [];
          setUpcomingClasses(classes);
          
          // Calculate stats
          const today = new Date().toISOString().split('T')[0];
          const upcomingToday = classes.filter(cls => 
            cls.Schedule && new Date(cls.Schedule).toISOString().split('T')[0] === today
          ).length;
          
          const totalParticipants = classes.reduce((sum, cls) => sum + (parseInt(cls.MaxParticipants) || 0), 0);
          
          setStats({
            totalClasses: classes.length,
            upcomingToday,
            totalParticipants
          });
        })
        .finally(() => setLoading(false));
    }
  }, [authorized]);

  if (!authorized) return null;

  return (
    <>
      <TrainerHeader />
      <main className={styles.trainerDashboard}>
        <div className={styles.dashboardHeader}>
          <h1>Welcome back, {name}!</h1>
          <p>Here's your schedule and quick stats for today. Use the menu to add or modify classes.</p>
        </div>
        
        <div className={styles.dashboardStats}>
          <div className={styles.statCard}>
            <h3>Total Classes</h3>
            <p>{stats.totalClasses}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Today's Classes</h3>
            <p>{stats.upcomingToday}</p>
          </div>
          <div className={styles.statCard}>
            <h3>Total Participants</h3>
            <p>{stats.totalParticipants}</p>
          </div>
        </div>

        <div className={styles.upcomingClasses}>
          <h2>Upcoming Classes</h2>
          {loading ? (
            <div className={styles.noClasses}>Loading your classes...</div>
          ) : upcomingClasses.length === 0 ? (
            <div className={styles.noClasses}>
              <p>You have no upcoming classes scheduled.</p>
              <p>Use the "Add Class" button to schedule a new class.</p>
            </div>
          ) : (
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Class Type</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Max Participants</th>
                </tr>
              </thead>
              <tbody>
                {upcomingClasses.map(cls => (
                  <tr key={cls.ClassID}>
                    <td>{cls.ClassTypeName || `Type ${cls.ClassType}`}</td>
                    <td>{cls.Schedule ? cls.Schedule.slice(0, 10) : ""}</td>
                    <td>{cls.time ? cls.time.slice(0, 5) : ""}</td>
                    <td>{cls.MaxParticipants}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}