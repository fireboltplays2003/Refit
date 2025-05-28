import { useState } from "react";
import axios from "axios";
import classes from "./Register.module.css";
import { NavLink } from "react-router-dom";
export default function Register() {

    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        phone: "",
        email: "",
        dateOfBirth: "",
        role: "user",
        password: "",
        confirmPassword: ""
    });

    const[success, setSuccess] = useState("");
    const [error, setError] = useState("");

    const{firstName, lastName, phone, email, dateOfBirth, role, password, confirmPassword} = formData

    function checkValues(){
        if (!firstName || !lastName || !phone || !email || !dateOfBirth || !password || !confirmPassword) {
            setError("One Field or more is missing");
            return;
        }
        
        if(new Date().getFullYear() - new Date(dateOfBirth).getFullYear() > 100 || new Date().getFullYear() - new Date(dateOfBirth).getFullYear() <13){
            setError("Invalid date of birth");
            return;
        }
        if(phone.length !== 10 || isNaN(phone)){
            setError("Incorrect phone number");
            return;
        }
        
        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }
        
        fetchData();
    }
    function fetchData(){
        axios.post("register", { firstName, lastName, phone, email, dateOfBirth, role, password })
            .then((response) => {
                setSuccess("Account created successfully");
                setError("");
            })
            .catch((error) => {
                setError("Account already exists");
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
                onSubmit={(e) => {
                    e.preventDefault();
                    checkValues();
                }} 
                className={classes.form}
            >
                <div className={classes.formGroup}>
                    <label className={classes.label} htmlFor="firstName">First Name</label>
                    <input 
                        className={classes.input}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})} 
                        type="text" 
                        id="firstName" 
                        name="firstName" 
                        value={firstName} 
                        placeholder="Enter your first name"
                    />
                </div>
                
                <div className={classes.formGroup}>
                    <label className={classes.label} htmlFor="lastName">Last Name</label>
                    <input 
                        className={classes.input}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})} 
                        type="text" 
                        id="lastName" 
                        name="lastName" 
                        value={lastName} 
                        placeholder="Enter your last name"
                    />
                </div>
                
                <div className={classes.formGroup}>
                    <label className={classes.label} htmlFor="phone">Phone Number</label>
                    <input 
                        className={classes.input}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})} 
                        type="tel" 
                        id="phone" 
                        name="phone" 
                        value={phone} 
                        placeholder="Enter your phone number"
                    />
                </div>
                
                <div className={classes.formGroup}>
                    <label className={classes.label} htmlFor="email">Email</label>
                    <input 
                        className={classes.input}
                        onChange={(e) => setFormData({...formData, email: e.target.value})} 
                        type="email" 
                        id="email" 
                        name="email" 
                        value={email} 
                        placeholder="Enter your email"
                    />
                </div>
                
                <div className={classes.formGroup}>
                    <label className={classes.label} htmlFor="dateOfBirth">Date of Birth</label>
                    <input 
                        className={classes.input}
                        onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})} 
                        type="date" 
                        id="dateOfBirth" 
                        name="dateOfBirth" 
                        value={dateOfBirth} 
                    />
                </div>
                
                <div className={classes.formGroup}>
                <label className={classes.label} htmlFor="password">Password</label>
                <input 
                    className={classes.input}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })} 
                    type="password" 
                    id="password" 
                    name="password" 
                    value={password} 
                    placeholder="Create a password"
                    required
                    minLength={8}
                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
                    title="Password must be at least 8 characters and include uppercase, lowercase, number, and special character."
                />
            </div>

            <div className={classes.formGroup}>
                <label className={classes.label} htmlFor="confirmPassword">Confirm Password</label>
                <input 
                    className={classes.input}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })} 
                    type="password" 
                    id="confirmPassword" 
                    name="confirmPassword" 
                    value={confirmPassword} 
                    placeholder="Confirm your password"
                    required
                    minLength={8}
                    pattern="^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$"
                    title="Password must match the rules: at least 8 characters, uppercase, lowercase, number, and special character."
                />
            </div>

                
                {success ==="" &&<div style={{color:"red", fontSize:"20px", textAlign:"center"}}>{error}</div>}
                {error==="" &&<div style={{color:"green", fontSize:"20px", textAlign:"center"}}>{success}</div>}
                
                <button type="submit" className={classes.loginButton}>Create Account</button>
                <div className={classes.registerLinkContainer}>
                Want to become a trainer? <NavLink to="/register-trainer" className={classes.registerLink}>Sign up as a Trainer</NavLink>
                </div>
                <div className={classes.registerLinkContainer}>
                    Already have an account? <NavLink to="/login" className={classes.registerLink}>Sign in</NavLink>
                </div>
            </form>
        </div>
    );
}