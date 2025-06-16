import { useState } from "react";
import axios from "axios";
import classes from "./RegisterTrainer.module.css";
import { NavLink } from "react-router-dom";

export default function RegisterTrainer() {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        dateOfBirth: "",
        password: "",
        confirmPassword: ""
    });
    const [certifications, setCertifications] = useState(null); // file
    const [success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const { firstName, lastName, phone, email, dateOfBirth, password, confirmPassword } = formData;

    function checkValues() {
        if (!firstName || !lastName || !phone || !email || !dateOfBirth || !password || !confirmPassword || !certifications) {
            setError("One field or more is missing, including certifications.");
            return;
        }
        // Date of birth check: must be 18–100 years old
        const currentYear = new Date().getFullYear();
        const birthYear = new Date(dateOfBirth).getFullYear();
        const age = currentYear - birthYear;
        if (age > 100 || age < 18) {
            setError("Invalid date of birth");
            return;
        }
        // Phone number check: must be 10 digits and all numbers
        if (phone.length !== 10 || isNaN(phone)) {
            setError("Incorrect phone number");
            return;
        }
        // Password match check
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        // Password strength (same pattern as your register)
        const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
        if (!passwordPattern.test(password)) {
            setError("Password must be at least 8 characters and include uppercase, lowercase, number, and special character.");
            return;
        }

        setError("");
        fetchData();
    }

    function fetchData() {
        const trainerForm = new FormData();
        trainerForm.append("firstName", firstName);
        trainerForm.append("lastName", lastName);
        trainerForm.append("phone", phone);
        trainerForm.append("email", email);
        trainerForm.append("dateOfBirth", dateOfBirth);
        trainerForm.append("role", "onhold"); // For trainers, initial role is onhold!
        trainerForm.append("password", password);
        trainerForm.append("certifications", certifications);

        axios.post("/admin/register-trainer", trainerForm)
        .then(() => {
            setSuccess("Trainer registration submitted! Await admin approval.");
            setError("");
        })
        .catch((error) => {
            const errorMessage = error.response?.data?.error || "Registration failed. Please try again.";
            setError(`Error: ${errorMessage}`);
            setSuccess("");
        });
    }

    return (
        <div className={classes.container}>
            <div className={classes.websiteName}>
                <span className={classes.namePart}>
                    <span className={classes.specialR}>R</span>efit
                </span>
            </div>
            <form
                onSubmit={e => {
                    e.preventDefault();
                    checkValues();
                }}
                className={classes.form}
                encType="multipart/form-data"
            >
                <div className={classes.formGroup}>
                    <label htmlFor="firstName" className={classes.label}>First Name</label>
                    <input className={classes.input} type="text" id="firstName" value={firstName} onChange={e => setFormData({ ...formData, firstName: e.target.value })} />
                </div>
                <div className={classes.formGroup}>
                    <label htmlFor="lastName" className={classes.label}>Last Name</label>
                    <input className={classes.input} type="text" id="lastName" value={lastName} onChange={e => setFormData({ ...formData, lastName: e.target.value })} />
                </div>
                <div className={classes.formGroup}>
                    <label htmlFor="phone" className={classes.label}>Phone</label>
                    <input className={classes.input} type="tel" id="phone" value={phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                </div>
                <div className={classes.formGroup}>
                    <label htmlFor="email" className={classes.label}>Email</label>
                    <input className={classes.input} type="email" id="email" value={email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                </div>
                <div className={classes.formGroup}>
                    <label htmlFor="dateOfBirth" className={classes.label}>Date of Birth</label>
                    <input className={classes.input} type="date" id="dateOfBirth" value={dateOfBirth} onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })} />
                </div>
                <div className={classes.formGroup}>
                    <label htmlFor="password" className={classes.label}>Password</label>
                    <input
                        className={classes.input}
                        type="password"
                        id="password"
                        value={password}
                        onChange={e => setFormData({ ...formData, password: e.target.value })}
                        required
                        minLength={8}
                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
                        title="Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
                    />
                </div>
                <div className={classes.formGroup}>
                    <label htmlFor="confirmPassword" className={classes.label}>Confirm Password</label>
                    <input
                        className={classes.input}
                        type="password"
                        id="confirmPassword"
                        value={confirmPassword}
                        onChange={e => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        minLength={8}
                        pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
                        title="Password must match the rules: at least 8 characters, uppercase, lowercase, number, and special character."
                    />
                </div>
                <div className={classes.formGroup}>
                    <label className={classes.label}>Certifications (file upload)</label>
                    <input
                        className={classes.input}
                        type="file"
                        accept=".pdf,.jpg,.png,.jpeg"
                        onChange={e => setCertifications(e.target.files[0])}
                    />
                </div>
                {error && <div style={{ color: "red" }}>{error}</div>}
                {success && <div style={{ color: "green" }}>{success}</div>}
                <button type="submit" className={classes.loginButton}>Sign Up as Trainer</button>
                <div className={classes.registerLinkContainer}>
                    Already have an account? <NavLink to="/login" className={classes.registerLink}>Sign in</NavLink>
                </div>
            </form>
        </div>
    );
}
