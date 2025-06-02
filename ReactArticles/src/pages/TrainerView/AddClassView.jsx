import { useState, useEffect } from "react";
import axios from "axios";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";
import styles from "./AddClassView.module.css";

export default function AddClassView() {
  const [classTypes, setClassTypes] = useState([]);
  const [classTypeId, setClassTypeId] = useState("");
  const [schedule, setSchedule] = useState("");
  const [time, setTime] = useState("");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [trainerId, setTrainerId] = useState(null);

  useEffect(() => {
    axios.get("http://localhost:8801/trainer/class-types", { withCredentials: true })
      .then((res) => setClassTypes(res.data))
      .catch((err) => console.error("Error fetching class types:", err));

    axios.get("http://localhost:8801/whoami", { withCredentials: true })
      .then((res) => {
        if (res.data.Role === "trainer") {
          setTrainerId(res.data.UserID);
        } else {
          alert("Only trainers can create classes.");
        }
      })
      .catch((err) => {
        console.error("Not logged in:", err);
        alert("Please log in as a trainer.");
      });
  }, []);

  function handleSubmit(e) {
    e.preventDefault();

    if (!trainerId) {
      alert("Trainer ID not found. Please log in again.");
      return;
    }

    axios.post("http://localhost:8801/trainer/create-class", {
      trainerId,
      classTypeId,
      schedule,
      time,
      maxParticipants
    }, { withCredentials: true })
      .then(() => {
        alert("Class created successfully!");
        setClassTypeId("");
        setSchedule("");
        setTime("");
        setMaxParticipants("");
      })
      .catch((err) => {
        console.error("Error creating class:", err);
        alert("Failed to create class.");
      });
  }

  return (
    <div>
      <TrainerHeader />
      <div className={styles.addClassContainer}>
        <h2 className={styles.addClassHeader}>Add New Class</h2>
        <form className={styles.addClassForm} onSubmit={handleSubmit}>
          <div>
            <label>Class Type:</label>
            <select value={classTypeId} onChange={(e) => setClassTypeId(e.target.value)}>
              <option value="">-- Select Class Type --</option>
              {classTypes.map((type) => (
                <option key={type.id} value={type.id}>{type.type}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Class Date:</label>
            <input
              type="date"
              value={schedule}
              min={(() => {
                const date = new Date();
                date.setHours(date.getHours() + 24);
                return date.toISOString().slice(0, 16);
              })()}
              onChange={(e) => setSchedule(e.target.value)}
            />
          </div>

          <div>
            <label>Class Time:</label>
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
            />
          </div>

          <div>
            <label>Max Participants:</label>
            <input
              type="number"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
            />
          </div>
          <div>
            <button type="submit">Confirm</button>
          </div>
        </form>
      </div>
      <Footer />
    </div>
  );
}
