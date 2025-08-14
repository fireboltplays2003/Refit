import { useState, useEffect, useRef } from "react";
import styles from "./ProfileModal.module.css";
import { FaTimes } from "react-icons/fa";
import axios from "axios";

export default function ProfileModal({ show, onClose, userData = {}, onUpdate }) {
  // Refs for uncontrolled inputs
  const firstNameRef = useRef(null);
  const lastNameRef  = useRef(null);
  const emailRef     = useRef(null);
  const phoneRef     = useRef(null);

  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [statusMsg, setStatusMsg] = useState("");

  // allow Hebrew/Arabic
  const nameRe  = /^[A-Za-z\u0590-\u05FF\u0600-\u06FF'’\- ]{2,30}$/;
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
  const phoneRe = /^[+()\d\s-]{7,20}$/;

  const validateField = (name, valueRaw) => {
    const value = (valueRaw ?? "").trim();
    switch (name) {
      case "FirstName":
        if (!value) return "First name is required.";
        if (!nameRe.test(value)) return "2–30 letters (spaces, - or ' allowed).";
        return "";
      case "LastName":
        if (!value) return "Last name is required.";
        if (!nameRe.test(value)) return "2–30 letters (spaces, - or ' allowed).";
        return "";
      case "Email":
        if (!value) return "Email is required.";
        if (!emailRe.test(value)) return "Enter a valid email address.";
        return "";
      case "Phone":
        if (!value) return "Phone is required.";
        if (!phoneRe.test(value)) return "7–20 digits; + ( ) - and spaces allowed.";
        return "";
      default:
        return "";
    }
  };

  const validateAll = () => {
    const vals = {
      FirstName: firstNameRef.current?.value ?? "",
      LastName:  lastNameRef.current?.value ?? "",
      Email:     emailRef.current?.value ?? "",
      Phone:     phoneRef.current?.value ?? "",
    };
    return {
      FirstName: validateField("FirstName", vals.FirstName),
      LastName:  validateField("LastName",  vals.LastName),
      Email:     validateField("Email",     vals.Email),
      Phone:     validateField("Phone",     vals.Phone),
    };
  };

  // Initialize field values when modal opens
  useEffect(() => {
    if (show) {
      // set default values into inputs without state (uncontrolled)
      if (firstNameRef.current) firstNameRef.current.value = userData.FirstName || "";
      if (lastNameRef.current)  lastNameRef.current.value  = userData.LastName  || "";
      if (emailRef.current)     emailRef.current.value     = userData.Email     || "";
      if (phoneRef.current)     phoneRef.current.value     = userData.Phone     || "";

      setErrors(validateAll());
      setTouched({});
      setStatusMsg("");
    }
  }, [show, userData]);

  const onBlur = (e) => {
    const { name, value } = e.target;
    setTouched((t) => ({ ...t, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg("");

    // mark all touched and validate
    setTouched({ FirstName: true, LastName: true, Email: true, Phone: true });
    const allErrs = validateAll();
    setErrors(allErrs);

    if (Object.values(allErrs).some(Boolean)) {
      setStatusMsg("Please fix the highlighted fields.");
      return;
    }

    const clean = {
      FirstName: (firstNameRef.current?.value || "").trim(),
      LastName:  (lastNameRef.current?.value  || "").trim(),
      Email:     (emailRef.current?.value     || "").trim(),
      Phone:     (phoneRef.current?.value     || "").trim(),
    };

    try {
      const res = await axios.put("/profile/update", clean, { withCredentials: true });
      if (res.data?.success) {
        const updated = res.data.updatedUser || clean;
        onUpdate?.(updated);
        setStatusMsg("Profile updated!");
        setTimeout(onClose, 1200);
      } else {
        setStatusMsg("Failed to update profile.");
      }
    } catch {
      setStatusMsg("Failed to update profile.");
    }
  };

  if (!show) return null;

  // ---------- constant inline styles (no mutations while typing) ----------
  const errorColor = "#ff5c5c";
  const okColor    = "#2ee6a6";
  const baseBorder = "#3b404c";

  const baseInputStyle = {
    width: "min(720px, 92vw)",
    height: 60,
    padding: "14px 18px",
    fontSize: "1.06rem",
    borderRadius: 16,
    background: "#1f232b",
    border: `1px solid ${baseBorder}`,
    color: "#e9eef9",
    outline: "none",
    transition: "box-shadow 140ms, border-color 140ms, background 140ms",
  };

  const invalidRing = { border: `1px solid ${errorColor}`, boxShadow: "0 0 0 3px rgba(255,92,92,0.25)" };
  const labelStyle  = { color: "#dbe7ff", fontSize: "1.15rem", fontWeight: 700, marginBottom: 10, display: "block" };
  const errorText   = { color: errorColor, fontSize: "0.92rem", marginTop: 8 };
  const statusStyle = { marginTop: 14, fontSize: "0.95rem", color: /fail|fix/i.test(statusMsg) ? errorColor : okColor };
  const modalWiden  = { width: "min(820px, 96vw)" };

  const invalid = (name) => Boolean(touched[name] && errors[name]);

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modalContent} style={modalWiden}>
        <button className={styles.closeBtn} onClick={onClose}>
          <FaTimes size={24} />
        </button>
        <h2 className={styles.title}>Edit Profile</h2>
        <div className={styles.underline} />
        <form className={styles.form} onSubmit={handleSubmit}>
          <label className={styles.label} style={labelStyle}>
            First Name
            <input
              ref={firstNameRef}
              name="FirstName"
              autoComplete="given-name"
              className={styles.input}
              style={{ ...baseInputStyle, ...(invalid("FirstName") ? invalidRing : {}) }}
              onBlur={onBlur}
            />
            {invalid("FirstName") && <div style={errorText}>{errors.FirstName}</div>}
          </label>

          <label className={styles.label} style={labelStyle}>
            Last Name
            <input
              ref={lastNameRef}
              name="LastName"
              autoComplete="family-name"
              className={styles.input}
              style={{ ...baseInputStyle, ...(invalid("LastName") ? invalidRing : {}) }}
              onBlur={onBlur}
            />
            {invalid("LastName") && <div style={errorText}>{errors.LastName}</div>}
          </label>

          <label className={styles.label} style={labelStyle}>
            Email
            <input
              ref={emailRef}
              name="Email"
              autoComplete="email"
              inputMode="email"
              type="email"
              className={styles.input}
              style={{ ...baseInputStyle, ...(invalid("Email") ? invalidRing : {}) }}
              onBlur={onBlur}
            />
            {invalid("Email") && <div style={errorText}>{errors.Email}</div>}
          </label>

          <label className={styles.label} style={labelStyle}>
            Phone
            <input
              ref={phoneRef}
              name="Phone"
              autoComplete="tel"
              inputMode="tel"
              type="tel"
              className={styles.input}
              style={{ ...baseInputStyle, ...(invalid("Phone") ? invalidRing : {}) }}
              onBlur={onBlur}
            />
            {invalid("Phone") && <div style={errorText}>{errors.Phone}</div>}
          </label>

          <button className={styles.saveBtn} type="submit">
            Save Changes
          </button>

          {statusMsg && <div className={styles.statusMsg} style={statusStyle}>{statusMsg}</div>}
        </form>
      </div>
    </div>
  );
}
