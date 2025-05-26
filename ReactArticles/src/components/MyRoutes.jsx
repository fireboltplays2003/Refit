import React from "react";
import { Routes, Route } from "react-router-dom";
import MemberHeader from "../pages/MemberView/MemberHeader";
import Footer from "./Footer";
import {Navigate} from "react-router-dom";
import { useState } from "react";
import Login from "../pages/Login/Login";
import AdminView from "../pages/AdminView/AdminView"
import TrainerView from "../pages/TrainerView/TrainerView";
import MemberView from "../pages/MemberView/MemberView";
import Register from "../pages/Register/Register";
import NotFound from "../pages/NotFound";
import RegisterMembership from "../pages/RegisterMembershipView/RegisterMembership";
import BookView from "../pages/BookView/BookView";
import MemberShipView from "../pages/MembershipView/MemberShipView";
function MyRoutes() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />
        <Route path="/login" element={
          <>
            <Login setIsLoggedIn={setIsLoggedIn} />
          </>
        } />
        <Route path="/register" element={
          <>
            <Register />
          </>
        } />
        <Route path="/admin" element={ isLoggedIn ?
          <>
     
            <AdminView />
            <Footer />
          </>
          : <Navigate to="/login" />
        } />
        <Route path="/trainer" element={ isLoggedIn ?
          <>
       
            <TrainerView />
            <Footer />
          </>
          : <Navigate to="/login" />
        } />
        <Route path="/member" element={ isLoggedIn ?
          <>
            <MemberHeader />
            <MemberView />
            <Footer />
          </>
          : <Navigate to="/login" />
        } />
        <Route path="/logout" element={
          <>
            <Navigate to="/login" />
          </>
        } /> 

        <Route path="/registerMembership" element={<RegisterMembership />} />
        <Route path="/bookView" element={<BookView />} />
        <Route path="/membershipView" element={<MemberShipView />} />

        <Route path="*" element={<NotFound />} />

      </Routes>
    </>
  );
}

export default MyRoutes;
