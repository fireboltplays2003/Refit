import React, { useEffect, useState, useRef } from "react";
import { FaBell } from "react-icons/fa";
import styles from "./NotificationBell.module.css";
import axios from "axios";
export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [open, setOpen] = useState(false);
  const bellRef = useRef();

  useEffect(() => {
    axios.get("/notifications/my-notifications", { withCredentials: true })
      .then(res => setNotifications(res.data))
      .catch(() => setNotifications([]));
  }, []);

  // Close dropdown if clicked outside
  useEffect(() => {
    function handleClick(e) {
      if (bellRef.current && !bellRef.current.contains(e.target)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const unreadCount = notifications.length;

  return (
    <div className={styles.bellContainer} ref={bellRef}>
      <button className={styles.bellBtn} onClick={() => setOpen((o) => !o)}>
        <FaBell />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount}</span>}
      </button>
      {open && (
        <div className={styles.dropdown}>
          <h4>Notifications</h4>
          {notifications.length === 0 ? (
            <div className={styles.empty}>No notifications.</div>
          ) : (
            notifications.map((n, idx) => (
              <div key={idx} className={styles.notification}>
                <div className={styles.nMessage}>{n.MessageContent}</div>
                <div className={styles.nDate}>{n.NotificationDate}</div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
