import React from "react";
import { Routes, Route } from "react-router-dom";
import MemberHeader from "../pages/MemberView/MemberHeader";
import Footer from "./Footer";
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
function MyRoutes() {
  
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={
          <>
            <Login/>
          </>
        } />
        <Route path="/register" element={
          <>
            <Register />
          </>
        } />
        <Route path="/admin" element={
          <>
     
            <AdminView />
            <Footer />
          </>
         
        } />
        <Route path="/trainer" element={
          <>
       
            <TrainerView />
            <Footer />
          </>
         
        } />
        <Route path="/member" element={
          <>
            <MemberHeader />
            <MemberView />
            <Footer />
          </>
         
        } />
        <Route path="/logout" element={
          <>
            <Navigate to="/login" />
          </>
        } /> 

        <Route path="/registerMembership" element={<RegisterMembership />}
         />
        <Route path="/bookView" element={<BookView />} />
        <Route path="/membershipView" element={<MemberShipView />} />
        <Route path="/registerTrainer" element={<RegisterTrainer />} />
        <Route path="*" element={<NotFound />} />

      </Routes>
    </>
  );
}

export default MyRoutes;
