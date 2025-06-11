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
import MyMemberShip from "../pages/MembershipView/MyMemberShip";
import RegisterTrainer from "../pages/RegisterTrainer/RegisterTrainer";
import UserView from "../pages/UserView/UserView";
import ReportsPage from "../pages/AdminView/ReportsPage";
import MembersPage from "../pages/AdminView/MembersPage";
import ClassesPage from "../pages/AdminView/ClassesPage";
import AddClassView from "../pages/TrainerView/AddClassView";
import ModifyClassView from "../pages/TrainerView/ModifyClassView";
import Classes from "../components/ClassesInformation/Classes";
import RenewMembership from "../pages/RenewMembership/RenewMembership";
function MyRoutes({ user, setUser }) {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" />} />
      <Route path="/login" element={<Login setUser={setUser} />} />
      <Route path="/register" element={<Register />} />
      <Route path="/trainer" element={<TrainerView />} />
      <Route path="/member" element={<MemberView user={user} setUser={setUser} />} />
      <Route path="/user" element={<UserView user={user} setUser={setUser} />} />
      <Route path="/classes" element={<Classes user={user} setUser={setUser} />} />
      <Route path="/register-membership" element={<RegisterMembership user={user} setUser={setUser} />} />
      <Route path="/book-class" element={<BookView user={user} setUser={setUser} />} />
      <Route path="/membership" element={<MyMemberShip user={user} setUser={setUser} />} /> 
      <Route path="/renew-membership" element={<RenewMembership user={user} setUser={setUser} />} />
      <Route path="/register-trainer" element={<RegisterTrainer />} />
      <Route path="/admin" element={<AdminView />} />
      <Route path="/admin/reports" element={<ReportsPage />} />
      <Route path="/admin/members" element={<MembersPage />} />
      <Route path="/admin/classes" element={<ClassesPage />} />
      <Route path="/trainer/add-class" element={<AddClassView />} />
      <Route path="/trainer/modify-class" element={<ModifyClassView />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default MyRoutes;
