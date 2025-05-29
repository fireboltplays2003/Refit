import { NavLink } from "react-router-dom";

export default function TrainerHeader() {
  return (
    <div>
      <h2>Trainer Dashboard</h2>
      <nav>
        <NavLink to="/trainer/add-class">Add Class</NavLink>
        <NavLink to="/trainer/modify-class">Modify Class</NavLink>
      </nav>
    </div>
  );
}
