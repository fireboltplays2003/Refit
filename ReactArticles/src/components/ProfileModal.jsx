import { useState, useEffect } from "react";
import styles from "./ProfileModal.module.css";
import { FaTimes } from "react-icons/fa";
import axios from "axios";

export default function ProfileModal({ show, onClose, userData = {}, onUpdate }) {
  const [form, setForm] = useState({
    FirstName: "",
    LastName: "",
    Email: "",
    Phone: ""
  });
  const [statusMsg, setStatusMsg] = useState("");

  useEffect(() => {
    if (show && userData) {
      setForm({
        FirstName: userData.FirstName || "",
        LastName: userData.LastName || "",
        Email: userData.Email || "",
        Phone: userData.Phone || ""
      });
      setStatusMsg("");
    }
  }, [show, userData]);

  const handleChange = (e) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg("");
    try {
      const res = await axios.put("/profile/update", form, { withCredentials: true });
      // Accept both: (1) updatedUser, (2) fallback to form
      if (res.data.success) {
        const updated = res.data.updatedUser || form;
        if (onUpdate) onUpdate(updated);
        setStatusMsg("Profile updated!");
        setTimeout(onClose, 1200);
      } else {
        setStatusMsg("Failed to update profile.");
      }
    } catch (err) {
      setStatusMsg("Failed to update profile.");
    }
  };

  if (!show) return null;

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent}>
        <button className={styles.closeBtn} onClick={onClose}>
          <FaTimes size={24} />
        </button>
        <h2 className={styles.title}>Edit Profile</h2>
        <div className={styles.underline} />
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label}>
            First Name
            <input
              name="FirstName"
              value={form.FirstName}
              onChange={handleChange}
              className={styles.input}
              autoComplete="given-name"
            />
          </label>
          <label className={styles.label}>
            Last Name
            <input
              name="LastName"
              value={form.LastName}
              onChange={handleChange}
              className={styles.input}
              autoComplete="family-name"
            />
          </label>
          <label className={styles.label}>
            Email
            <input
              name="Email"
              value={form.Email}
              onChange={handleChange}
              className={styles.input}
              autoComplete="email"
            />
          </label>
          <label className={styles.label}>
            Phone
            <input
              name="Phone"
              value={form.Phone}
              onChange={handleChange}
              className={styles.input}
              autoComplete="tel"
            />
          </label>
          <button className={styles.saveBtn} type="submit">
            Save Changes
          </button>
          {statusMsg && (
            <div className={styles.statusMsg}>{statusMsg}</div>
          )}
        </form>
      </div>
    </div>
  );
}
