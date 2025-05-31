import { NavLink } from "react-router-dom";

export default function UserHeader() {
    return (
        <div>
            <NavLink
            to="/register-membership">
                Register Membership
            </NavLink>
            <NavLink to="/login">
                Login
            </NavLink>
        </div>
    );
}