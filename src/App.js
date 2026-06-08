import "./App.css";
import Homepage from "./Homepage";

import { BrowserRouter, Routes, Route } from "react-router-dom";

import Admin from "./Pages/Admin";
import Login from "./Pages/Login";
import Signin from "./Pages/Signin";
import DoctorDashboard from "./Pages/DoctorDashboard";
import LabStaff from "./Pages/LabStaff";
import PharmacyDashboard from "./Pages/PharmacyDashboard";
import Patient from "./Pages/Patient";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signin" element={<Signin />} />

        <Route path="/doctor" element={<DoctorDashboard />} />
        <Route path="/patient" element={<Patient />} />
        <Route path="/labstaff" element={<LabStaff />} />
        
        
        <Route path="/pharmacystaff" element={<PharmacyDashboard />} />
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;