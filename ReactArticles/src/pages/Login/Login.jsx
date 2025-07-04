import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useState } from "react";
import classes from "./Login.module.css";
import { NavLink } from "react-router-dom";

export default function Login({ setUser }) { // <-- add setUser here!
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    function checkValues() {
        if (!email || !password) {
            setError("Please fill in all fields");
            return;
        }
        fetchData();
    }

    function fetchData() {
        setLoading(true);
        axios.post("login", { email, password })
            .then(res => {
                setUser(res.data); // Set user from /login response
                if (res.data.Role === "admin") {
                    navigate("/admin");
                } else if (res.data.Role === "trainer") {
                    navigate("/trainer");
                } else if (res.data.Role === "user") {
                    navigate("/user");
                } else {
                    navigate("/member");
                }
            })
            .catch(() => {
                setLoading(false);
                setError("Invalid credentials");
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
                onSubmit={(e) => {
                    e.preventDefault();
                    checkValues();
                }}
                className={classes.form}
            >
                <div className={classes.formGroup}>
                    <label htmlFor="email" className={classes.label}>Email</label>
                    <input
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        id="email"
                        name="email"
                        value={email}
                        className={classes.input}
                        placeholder="Enter your email"
                        disabled={loading}
                    />
                </div>
                <div className={classes.formGroup}>
                    <label htmlFor="password" className={classes.label}>Password</label>
                    <input
                        onChange={(e) => setPassword(e.target.value)}
                        type="password"
                        id="password"
                        name="password"
                        value={password}
                        className={classes.input}
                        placeholder="Enter your password"
                        disabled={loading}
                    />
                </div>
                {loading && (
                    <div className={classes.loadingMessage}>
                        <div className={classes.loadingSpinner}></div>
                        <span>Logging you in...</span>
                    </div>
                )}
                {error && !loading && <p className={classes.errorMessage}>{error}</p>}
               
                <button type="submit" className={classes.loginButton} disabled={loading}>
                    {loading ? "Logging in..." : "Login"}
                </button>
                <div className={classes.registerPrompt}>
                    Don't have an account?
                    <NavLink to="/register" className={classes.registerLink}>
                        Register
                    </NavLink>
                </div>
            </form>
        </div>
    );
}
