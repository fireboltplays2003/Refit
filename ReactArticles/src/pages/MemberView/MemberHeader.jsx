import { NavLink } from "react-router-dom";

export default function MemberHeader() {
  return (
    <header style={{ background: "#f8f8f8", padding: "10px" }}>
      <nav>
        <NavLink to="/home" style={{ marginRight: 15 }}>Home</NavLink>
        <NavLink to="/membership" style={{ marginRight: 15 }}>My Membership</NavLink>
        <NavLink to="/book" style={{ marginRight: 15 }}>Book Class</NavLink>
        <NavLink to="/profile" style={{ marginRight: 15 }}>Profile</NavLink>
        <NavLink to="/logout">Logout</NavLink>
      </nav>
    </header>
  );
}
