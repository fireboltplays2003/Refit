import { useState, useEffect } from "react";
import axios from "axios";
import TrainerHeader from "./TrainerHeader";
import Footer from "../../components/Footer";
import styles from "./ModifyClassView.module.css"; // Import your CSS module

export default function ModifyClassView() {
  const [classes, setClasses] = useState([]);
  const [classTypes, setClassTypes] = useState([]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [form, setForm] = useState({
    classTypeId: "",
    schedule: "",
    time: "",
    maxParticipants: ""
  });
  const [error, setError] = useState("");

  // Fetch trainer's classes and class types
  useEffect(() => {
    fetchClasses();
    axios.get("http://localhost:8801/trainer/class-types", { withCredentials: true })
      .then((res) => setClassTypes(res.data))
      .catch(() => setError("Could not fetch class types."));
  }, []);

  function fetchClasses() {
    axios.get("http://localhost:8801/trainer/classes", { withCredentials: true })
      .then((res) => setClasses(res.data))
      .catch(() => setError("Could not fetch classes."));
  }

  // When user picks a class, fill form fields
  useEffect(() => {
    if (!selectedClassId) {
      setForm({ classTypeId: "", schedule: "", time: "", maxParticipants: "" });
      return;
    }
    const selected = classes.find(c => c.ClassID === Number(selectedClassId));
    if (selected) {
      setForm({
        classTypeId: selected.ClassType,
        schedule: selected.Schedule ? selected.Schedule.slice(0, 16) : "",
        time: selected.time ? selected.time.slice(0, 5) : "",
        maxParticipants: selected.MaxParticipants
      });
    }
  }, [selectedClassId, classes]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!selectedClassId) return;
    await axios.put(
      `http://localhost:8801/trainer/class/${selectedClassId}`,
      {
        classTypeId: form.classTypeId,
        schedule: form.schedule,
        time: form.time,
        maxParticipants: form.maxParticipants
      },
      { withCredentials: true }
    )
      .then(() => alert("Class updated!"))
      .catch((err) => {
        setError("Failed to update class: " + (err.response?.data?.error || err.message));
      });
  }

  // DELETE handler
  async function handleDelete() {
    if (!selectedClassId) return;
    if (!window.confirm("Are you sure you want to delete this class? This action cannot be undone.")) return;
    setError("");
    await axios.delete(`http://localhost:8801/trainer/class/${selectedClassId}`, { withCredentials: true })
      .then(() => {
        alert("Class deleted!");
        setSelectedClassId(""); // clear selection
        fetchClasses(); // refresh the list
      })
      .catch((err) => {
        setError("Failed to delete class: " + (err.response?.data?.error || err.message));
      });
  }

  return (
    <div>
      <TrainerHeader />
      <div className={styles.modifyClassContainer}>
        <h2 className={styles.modifyClassHeader}>Modify Existing Class</h2>
        {error && <div className={styles.errorMsg}>{error}</div>}
        <div>
          <label className={styles.formLabel}>Pick a Class:</label>
          <select
            className={styles.formInput}
            value={selectedClassId}
            onChange={e => setSelectedClassId(e.target.value)}
          >
            <option value="">-- Select Class --</option>
            {classes.map(cls => (
              <option key={cls.ClassID} value={cls.ClassID}>
                {cls.ClassTypeName || `TypeID ${cls.ClassType}`} - {cls.Schedule ? new Date(cls.Schedule).toLocaleDateString() : ""}{" "} {cls.time ? cls.time : ""}
              </option>
            ))}
          </select>
        </div>
        {selectedClassId && (
          <form className={styles.modifyClassForm} onSubmit={handleSubmit}>
            <div>
              <label className={styles.formLabel}>Class Type:</label>
              <select
                className={styles.formInput}
                name="classTypeId"
                value={form.classTypeId}
                onChange={handleChange}
              >
                <option value="">-- Select Class Type --</option>
                {classTypes.map(type => (
                  <option key={type.id} value={type.id}>{type.type}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={styles.formLabel}>Class Date:</label>
              <input
                className={styles.formInput}
                type="date"
                name="schedule"
                value={form.schedule}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={styles.formLabel}>Class Time:</label>
              <input
                className={styles.formInput}
                type="time"
                name="time"
                value={form.time}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className={styles.formLabel}>Max Participants:</label>
              <input
                className={styles.formInput}
                type="number"
                name="maxParticipants"
                value={form.maxParticipants}
                onChange={handleChange}
              />
            </div>
            <div className={styles.formBtnRow}>
              <button type="submit" className={styles.updateBtn}>Update Class</button>
              <button
                type="button"
                onClick={handleDelete}
                className={styles.deleteBtn}
              >
                Delete Class
              </button>
            </div>
          </form>
        )}
      </div>
      <Footer />
    </div>
  );
}
