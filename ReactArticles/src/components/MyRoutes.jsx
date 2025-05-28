import React from "react";
import { Routes, Route } from "react-router-dom";
import {Navigate} from "react-router-dom";
import Login from "../pages/Login/Login";
import AdminView from "../pages/AdminView/AdminView"
import TrainerView from "../pages/TrainerView/TrainerView";
import MemberView from "../pages/MemberView/MemberView";
import Register from "../pages/Register/Register";
import NotFound from "../pages/NotFound";
import RegisterMembership from "../pages/RegisterMembershipView/RegisterMembership";
import BookView from "../pages/BookView/BookView";
import MemberShipView from "../pages/MembershipView/MemberShipView";
import RegisterTrainer from "../pages/ReigsterTrainer/RegisterTrainer";
import UserView from "../pages/UserView/UserView";

function MyRoutes() {
 
  
  return (
    <Routes>
    <Route path="/" element={<Navigate to="/login" />} />
    <Route path="/login" element={<Login />} />
    <Route path="/register" element={<Register />} />
    <Route path="/admin" element={<AdminView />} />
    <Route path="/trainer" element={<TrainerView />} />
    <Route path="/member" element={<MemberView />} />
    <Route path="/user" element={<UserView />} />
    <Route path="/logout" element={<Navigate to="/login" />} />
    <Route path="/register-membership" element={<RegisterMembership />} />
    <Route path="/book" element={<BookView />} />
    <Route path="/membership" element={<MemberShipView />} />
    <Route path="/register-trainer" element={<RegisterTrainer />} />
    <Route path="/logout" element={<Navigate to="/login" />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
  );
}

export default MyRoutes;
