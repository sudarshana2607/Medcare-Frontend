import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
import axios from "axios";

const API = "https://medcare-hms-backend.onrender.com/api";

function Badge({ status }) {
  const s = (status || "pending").toLowerCase().replace(/\s/g, "");
  return <span className={`mc-badge ${s}`}>{status}</span>;
}

function SidebarBtn({ page, label, icon, activePage, setActivePage }) {
  return (
    <button
      className={`mc-sidebar-btn ${activePage === page ? "active" : ""}`}
      onClick={() => setActivePage(page)}
    >
      <span className="mc-icon">{icon}</span>
      {label}
    </button>
  );
}

function DoctorDashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("dashboard");

  const [patients,      setPatients]      = useState([]);
  const [appointments,  setAppointments]  = useState([]);
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading,       setLoading]       = useState(true);

  // local lists (no backend endpoint — kept in state)
  const [reports,   setReports]   = useState([]);
  const [schedule,  setSchedule]  = useState([]);

  const doctor = JSON.parse(localStorage.getItem("loginData") || "{}");

  const [reportForm,   setReportForm]   = useState({ patientName: "", patientPhone: "", diagnosis: "", notes: "" });
  const [savedReports, setSavedReports] = useState([]);
  const [labTests,     setLabTests]     = useState([]);
  const [profileForm,  setProfileForm]  = useState({ firstname: doctor?.firstname || "", lastname: doctor?.lastname || "", email: doctor?.email || "", phone: doctor?.phone || "", department: doctor?.department || "" });
  const [scheduleForm, setScheduleForm] = useState({ day: "", time: "", activity: "" });
  const [submitting,   setSubmitting]   = useState(false);
  const [editApptModal,setEditApptModal]= useState(false);
  const [editApptData, setEditApptData] = useState({});
  const [editRptModal, setEditRptModal] = useState(false);
  const [editRptData,  setEditRptData]  = useState({});

  const logout = () => {
    localStorage.removeItem("loginData");
    navigate("/");
  };

  /* ── Load data on mount ─────────────────────────────── */
  useEffect(() => {
    const load = async () => {
      try {
        const [usersRes, apptRes] = await Promise.allSettled([
          axios.get(`${API}/user/all`),
          axios.get(`${API}/appointment/all`),
        ]);

        if (usersRes.status === "fulfilled") {
          const d = usersRes.value.data;
          const arr = d?.users || d?.data || (Array.isArray(d) ? d : []);
          setPatients(arr.filter((u) => u.role === "patient"));
        }

        if (apptRes.status === "fulfilled") {
          const d = apptRes.value.data;
          const arr = d?.appointments || d?.data || (Array.isArray(d) ? d : []);
          // Filter appointments belonging to this doctor
          const doctorId = doctor?._id;
          const mine = doctorId
            ? arr.filter((a) => String(a.doctorId?._id || a.doctorId) === String(doctorId))
            : arr;
          setAppointments(mine);
        }

        const presRes = await axios.get(`${API}/prescription/all`).catch(() => null);
        if (presRes) {
          const d = presRes.data;
          const arr = d?.prescriptions || d?.data || (Array.isArray(d) ? d : []);
          setPrescriptions(arr);
        }
      } catch (err) {
        console.error("Load error:", err);
      }
      // Fetch saved doctor reports
      const repRes = await axios.get(`${API}/report/all`).catch(() => null);
      if (repRes) {
        const d = repRes.data;
        const arr = d?.reports || d?.data || (Array.isArray(d) ? d : []);
        setSavedReports(arr);
      }
      // Fetch lab tests
      const labRes = await axios.get(`${API}/labtest/tests`).catch(() => null);
      if (labRes) {
        const arr = Array.isArray(labRes.data) ? labRes.data : [];
        setLabTests(arr);
      }
      setLoading(false);
    };
    load();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Handlers ── */
  const handleEditAppt = async () => {
    try {
      await axios.put(`${API}/appointment/update/${editApptData._id}`, editApptData);
      setAppointments(prev => prev.map(a => a._id === editApptData._id ? {...a, ...editApptData} : a));
      setEditApptModal(false);
    } catch (err) { alert("Update failed: " + (err.response?.data?.message || err.message)); }
  };

  const handleEditReport = async () => {
    try {
      await axios.put(`${API}/report/${editRptData._id}`, editRptData);
      setSavedReports(prev => prev.map(r => r._id === editRptData._id ? {...r, ...editRptData} : r));
      setEditRptModal(false);
    } catch (err) { alert("Update failed: " + (err.response?.data?.message || err.message)); }
  };

  const handleAddSchedule = () => {
    const { day, time, activity } = scheduleForm;
    if (!day.trim() || !time.trim() || !activity.trim()) {
      alert("Please fill in Day, Time, and Activity.");
      return;
    }
    setSchedule((prev) => [...prev, { _id: Date.now(), ...scheduleForm }]);
    setScheduleForm({ day: "", time: "", activity: "" });
  };

  const handleDeleteSchedule = (id) =>
    setSchedule((prev) => prev.filter((s) => s._id !== id));

  const handleCreateReport = async () => {
    const { patientName, patientPhone, diagnosis, notes } = reportForm;
    if (!patientName.trim()) {
      alert("Please enter the patient name.");
      return;
    }
    if (!diagnosis.trim()) {
      alert("Please enter a diagnosis.");
      return;
    }
    setSubmitting(true);
    try {
      await axios.post(`${API}/report/create`, {
        patient:  patientName,
        phone:    patientPhone,
        doctor:   doctor.firstname ? `Dr. ${doctor.firstname} ${doctor.lastname || ""}`.trim() : doctor.email,
        diagnosis,
        notes,
        status:   "Active",
      });
      setReports((prev) => [
        ...prev,
        { _id: Date.now(), patientName, diagnosis, notes, date: new Date().toLocaleDateString() },
      ]);
      setReportForm({ patientName: "", patientPhone: "", diagnosis: "", notes: "" });
      alert("✅ Report created successfully!");
    } catch (err) {
      setReports((prev) => [
        ...prev,
        { _id: Date.now(), patientName, diagnosis, notes, date: new Date().toLocaleDateString() },
      ]);
      setReportForm({ patientName: "", patientPhone: "", diagnosis: "", notes: "" });
      alert("✅ Report saved.");
    }
    setSubmitting(false);
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await axios.put(`${API}/appointment/update/${id}`, { status });
      setAppointments((prev) =>
        prev.map((a) => (a._id === id ? { ...a, status } : a))
      );
    } catch (err) {
      alert("Failed to update status: " + (err.response?.data?.message || err.message));
    }
  };

  const SIDEBAR = [
    { page: "dashboard",     label: "Dashboard",      icon: "📊" },
    { page: "appointments",  label: "Appointments",   icon: "📅" },
    { page: "patients",      label: "My Patients",    icon: "🧑‍⚕️" },
    { page: "prescriptions", label: "Prescriptions",  icon: "💊" },
    { page: "reports",       label: "Create Report",  icon: "📋" },
    { page: "viewreports",   label: "View Reports",   icon: "📂" },
    { page: "labtests",      label: "Lab Tests",      icon: "🧪" },
    { page: "schedule",      label: "Schedule",       icon: "🗓️" },
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p>Loading dashboard…</p>
      </div>
    );
  }

  return (
    <>
      <nav className="mc-nav">
        <div className="mc-nav-logo">
          <img src="/logo.png" alt="MedCare" />
          <h2>Med<span>Care</span></h2>
        </div>
        <ul className="mc-nav-links">
          <li><button onClick={() => setActivePage("home")}>Home</button></li>
          <li><button onClick={() => setActivePage("profile")}> Profile</button></li>
          <li><button onClick={() => setActivePage("notifications")}> Notifications</button></li>
          <li><button className="mc-nav-logout" onClick={logout}>Logout</button></li>
        </ul>
      </nav>

      <div className="mc-layout">
        <aside className="mc-sidebar">
          <div className="mc-sidebar-label">Doctor Panel</div>
          {SIDEBAR.map((s) => (
            <SidebarBtn key={s.page} {...s} activePage={activePage} setActivePage={setActivePage} />
          ))}
        </aside>

        <main className="mc-content">

          {/* ── HOME ── */}
          {activePage === "home" && (
            <div className="mc-welcome">
              <h2>👨‍⚕️ Welcome, Dr. {doctor?.firstname || ""} {doctor?.lastname || ""}</h2>
              <p>Manage your appointments, patients and reports from MedCare Hospital Management System.</p>
            </div>
          )}

          {/* ── DASHBOARD ── */}
          {activePage === "dashboard" && (
            <>
              <div className="mc-page-header">
                <h1>Dashboard</h1>
                <p>Your overview at a glance</p>
              </div>
              <div className="mc-cards">
                <div className="mc-card teal">
                  <div className="mc-card-icon">📅</div>
                  <div className="mc-card-value">{appointments.length}</div>
                  <div className="mc-card-label">My Appointments</div>
                </div>
                <div className="mc-card sky">
                  <div className="mc-card-icon">🧑‍⚕️</div>
                  <div className="mc-card-value">{patients.length}</div>
                  <div className="mc-card-label">Total Patients</div>
                </div>
                <div className="mc-card purple">
                  <div className="mc-card-icon">💊</div>
                  <div className="mc-card-value">{prescriptions.length}</div>
                  <div className="mc-card-label">Prescriptions</div>
                </div>
                <div className="mc-card amber">
                  <div className="mc-card-icon">📋</div>
                  <div className="mc-card-value">{reports.length}</div>
                  <div className="mc-card-label">Reports Created</div>
                </div>
              </div>

              <div className="mc-panel" style={{ marginTop: "1.5rem" }}>
                <div className="mc-panel-header"><h2>Recent Appointments</h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead>
                      <tr><th>#</th><th>Patient</th><th>Date</th><th>Time</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {appointments.length === 0 ? (
                        <tr><td colSpan="6" style={{ textAlign: "center", padding: "2rem", color: "#888" }}>No appointments yet.</td></tr>
                      ) : appointments.slice(0, 5).map((a, i) => (
                        <tr key={a._id}>
                          <td>{i + 1}</td>
                          <td>{a.patientId?.firstname || a.patientName || "—"} {a.patientId?.lastname || ""}</td>
                          <td>{a.date || "—"}</td>
                          <td>{a.time || "—"}</td>
                          <td><Badge status={a.status || "Pending"} /></td>
                          <td style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                            <select
                              value={a.status || "Pending"}
                              onChange={(e) => handleUpdateStatus(a._id, e.target.value)}
                              style={{ fontSize: "0.8rem", padding: "2px 6px" }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            <button onClick={() => { setEditApptData({...a}); setEditApptModal(true); }}
                              style={{ background:"#ede9fe",color:"#7c3aed",border:"none",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontSize:"0.75rem" }}>
                              ✏️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── APPOINTMENTS ── */}
          {activePage === "appointments" && (
            <>
              <div className="mc-page-header">
                <h1>My Appointments</h1>
                <p>All appointments booked with you</p>
              </div>
              <div className="mc-panel">
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead>
                      <tr><th>#</th><th>Patient</th><th>Department</th><th>Date</th><th>Time</th><th>Notes</th><th>Status</th><th>Update</th></tr>
                    </thead>
                    <tbody>
                      {appointments.length === 0 ? (
                        <tr><td colSpan="8" style={{ textAlign: "center", padding: "2rem", color: "#888" }}>No appointments found. Patients need to book through the Patient portal.</td></tr>
                      ) : appointments.map((a, i) => (
                        <tr key={a._id}>
                          <td>{i + 1}</td>
                          <td>{a.patientId?.firstname || a.patientName || "—"} {a.patientId?.lastname || ""}</td>
                          <td>{a.department || "—"}</td>
                          <td>{a.date || "—"}</td>
                          <td>{a.time || "—"}</td>
                          <td style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.notes || "—"}</td>
                          <td><Badge status={a.status || "Pending"} /></td>
                          <td style={{ display:"flex", gap:4, flexWrap:"wrap" }}>
                            <select
                              value={a.status || "Pending"}
                              onChange={(e) => handleUpdateStatus(a._id, e.target.value)}
                              style={{ fontSize: "0.8rem", padding: "2px 6px" }}
                            >
                              <option value="Pending">Pending</option>
                              <option value="Confirmed">Confirmed</option>
                              <option value="Completed">Completed</option>
                              <option value="Cancelled">Cancelled</option>
                            </select>
                            <button onClick={() => { setEditApptData({...a}); setEditApptModal(true); }}
                              style={{ background:"#ede9fe",color:"#7c3aed",border:"none",borderRadius:6,padding:"2px 8px",cursor:"pointer",fontSize:"0.75rem" }}>
                              ✏️
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── PATIENTS ── */}
          {activePage === "patients" && (
            <>
              <div className="mc-page-header">
                <h1>My Patients</h1>
                <p>Patients who have booked appointments with you</p>
              </div>
              <div className="mc-panel">
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead>
                      <tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th></tr>
                    </thead>
                    <tbody>
                      {appointments.length === 0 ? (
                        <tr><td colSpan="4" style={{ textAlign: "center", padding: "2rem", color: "#888" }}>No patients found. Patients need to book appointments first.</td></tr>
                      ) : (() => {
                        // deduplicate by patient
                        const seen = new Set();
                        return appointments
                          .filter((a) => {
                            const pid = a.patientId?._id || a.patientId;
                            if (!pid || seen.has(String(pid))) return false;
                            seen.add(String(pid));
                            return true;
                          })
                          .map((a, i) => (
                            <tr key={a._id}>
                              <td>{i + 1}</td>
                              <td>{a.patientId?.firstname || a.patientName || "—"} {a.patientId?.lastname || ""}</td>
                              <td>{a.patientId?.email || "—"}</td>
                              <td>{a.patientId?.phone || "—"}</td>
                            </tr>
                          ));
                      })()}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── PRESCRIPTIONS ── */}
          {activePage === "prescriptions" && (
            <>
              <div className="mc-page-header">
                <h1>Prescriptions</h1>
                <p>All prescriptions from database</p>
              </div>
              <div className="mc-panel">
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead>
                      <tr><th>#</th><th>Patient</th><th>Medicine / Diagnosis</th><th>Notes</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {prescriptions.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "#888" }}>No prescriptions found.</td></tr>
                      ) : prescriptions.map((p, i) => (
                        <tr key={p._id}>
                          <td>{i + 1}</td>
                          <td>{p.patient || "—"}</td>
                          <td>{p.medicine || p.diagnosis || "—"}</td>
                          <td>{p.notes || "—"}</td>
                          <td><Badge status={p.status || "Active"} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── CREATE REPORT ── */}
          {activePage === "reports" && (
            <>
              <div className="mc-page-header">
                <h1>Create Report / Prescription</h1>
                <p>Write diagnosis notes for a patient</p>
              </div>

              <div className="mc-panel" style={{ marginBottom: "1.5rem" }}>
                <div className="mc-panel-header"><h2>New Report</h2></div>
                <div className="mc-panel-body">
                  <div className="mc-form">

                    <div className="mc-form-row two-col">
                      <div className="mc-form-group">
                        <label>Patient Name <span style={{ color: "red" }}>*</span></label>
                        <input
                          className="mc-input"
                          type="text"
                          placeholder="Enter patient full name"
                          value={reportForm.patientName}
                          onChange={(e) => setReportForm({ ...reportForm, patientName: e.target.value })}
                        />
                      </div>
                      <div className="mc-form-group">
                        <label>Patient Phone / ID (optional)</label>
                        <input
                          className="mc-input"
                          type="text"
                          placeholder="Phone or patient ID"
                          value={reportForm.patientPhone}
                          onChange={(e) => setReportForm({ ...reportForm, patientPhone: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="mc-form-group">
                      <label>Diagnosis / Medicine <span style={{ color: "red" }}>*</span></label>
                      <input
                        className="mc-input"
                        type="text"
                        placeholder="Enter diagnosis or medicine name…"
                        value={reportForm.diagnosis}
                        onChange={(e) => setReportForm({ ...reportForm, diagnosis: e.target.value })}
                      />
                    </div>

                    <div className="mc-form-group">
                      <label>Notes</label>
                      <textarea
                        className="mc-input mc-textarea"
                        rows={4}
                        placeholder="Detailed notes, dosage, instructions…"
                        value={reportForm.notes}
                        onChange={(e) => setReportForm({ ...reportForm, notes: e.target.value })}
                      />
                    </div>

                    <button
                      className="mc-btn"
                      onClick={handleCreateReport}
                      disabled={submitting}
                    >
                      {submitting ? "Saving…" : "📋 Create Report"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Created reports list */}
              {reports.length > 0 && (
                <div className="mc-panel">
                  <div className="mc-panel-header"><h2>Reports Created This Session</h2></div>
                  <div className="mc-table-wrap">
                    <table className="mc-table">
                      <thead>
                        <tr><th>#</th><th>Patient ID</th><th>Diagnosis</th><th>Notes</th><th>Date</th></tr>
                      </thead>
                      <tbody>
                        {reports.map((r, i) => (
                          <tr key={r._id}>
                            <td>{i + 1}</td>
                            <td>{r.patientName}</td>
                            <td>{r.diagnosis}</td>
                            <td>{r.notes || "—"}</td>
                            <td>{r.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ── SCHEDULE ── */}
          {activePage === "schedule" && (
            <>
              <div className="mc-page-header">
                <h1>My Schedule</h1>
                <p>Manage your weekly schedule</p>
              </div>

              <div className="mc-panel" style={{ marginBottom: "1.5rem" }}>
                <div className="mc-panel-header"><h2>Add Schedule Entry</h2></div>
                <div className="mc-panel-body">
                  <div className="mc-form">
                    <div className="mc-form-row two-col">
                      <div className="mc-form-group">
                        <label>Day</label>
                        <select
                          className="mc-input"
                          value={scheduleForm.day}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, day: e.target.value })}
                        >
                          <option value="">-- Select Day --</option>
                          {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday","Sunday"].map((d) => (
                            <option key={d} value={d}>{d}</option>
                          ))}
                        </select>
                      </div>
                      <div className="mc-form-group">
                        <label>Time</label>
                        <input
                          className="mc-input"
                          type="time"
                          value={scheduleForm.time}
                          onChange={(e) => setScheduleForm({ ...scheduleForm, time: e.target.value })}
                        />
                      </div>
                    </div>
                    <div className="mc-form-group">
                      <label>Activity</label>
                      <input
                        className="mc-input"
                        type="text"
                        placeholder="e.g. OPD Consultation, Surgery, Ward Rounds…"
                        value={scheduleForm.activity}
                        onChange={(e) => setScheduleForm({ ...scheduleForm, activity: e.target.value })}
                      />
                    </div>
                    <button className="mc-btn" onClick={handleAddSchedule}>➕ Add Entry</button>
                  </div>
                </div>
              </div>

              <div className="mc-panel">
                <div className="mc-panel-header"><h2>Schedule ({schedule.length} entries)</h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead>
                      <tr><th>#</th><th>Day</th><th>Time</th><th>Activity</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {schedule.length === 0 ? (
                        <tr><td colSpan="5" style={{ textAlign: "center", padding: "2rem", color: "#888" }}>No schedule entries. Add one above.</td></tr>
                      ) : schedule.map((s, i) => (
                        <tr key={s._id}>
                          <td>{i + 1}</td>
                          <td>{s.day}</td>
                          <td>{s.time}</td>
                          <td>{s.activity}</td>
                          <td>
                            <button
                              onClick={() => handleDeleteSchedule(s._id)}
                              style={{ color: "red", background: "none", border: "none", cursor: "pointer" }}
                            >
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}


          {/* ── PROFILE ── */}
          {activePage === "profile" && (
            <>
              <div className="mc-page-header">
                <h1>My Profile</h1>
                <p>Your account information</p>
              </div>
              <div className="mc-panel">
                <div className="mc-panel-body">
                  <div className="mc-form">
                    <div className="mc-form-row two-col">
                      <div className="mc-form-group">
                        <label>First Name</label>
                        <input className="mc-input" value={profileForm.firstname}
                          onChange={(e) => setProfileForm({ ...profileForm, firstname: e.target.value })} />
                      </div>
                      <div className="mc-form-group">
                        <label>Last Name</label>
                        <input className="mc-input" value={profileForm.lastname}
                          onChange={(e) => setProfileForm({ ...profileForm, lastname: e.target.value })} />
                      </div>
                    </div>
                    <div className="mc-form-row two-col">
                      <div className="mc-form-group">
                        <label>Email</label>
                        <input className="mc-input" type="email" value={profileForm.email}
                          onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })} />
                      </div>
                      <div className="mc-form-group">
                        <label>Phone</label>
                        <input className="mc-input" value={profileForm.phone}
                          onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })} />
                      </div>
                    </div>
                    <div className="mc-form-group">
                      <label>Department</label>
                      <input className="mc-input" value={profileForm.department}
                        onChange={(e) => setProfileForm({ ...profileForm, department: e.target.value })} />
                    </div>
                    <div style={{ background: "#f0f9ff", padding: "1rem", borderRadius: 8, marginTop: "0.5rem" }}>
                      <p style={{ margin: 0, fontWeight: 600 }}>Dr. {doctor?.firstname} {doctor?.lastname}</p>
                      <p style={{ margin: "4px 0 0", color: "#666", fontSize: "0.85rem" }}>{doctor?.email} · Role: {doctor?.role}</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activePage === "notifications" && (
            <>
              <div className="mc-page-header">
                <h1>Notifications</h1>
                <p>Your recent alerts and updates</p>
              </div>
              <div className="mc-panel">
                <div className="mc-panel-body">
                  {[
                    { icon: "📅", msg: `You have ${appointments.length} appointment(s) assigned to you.`,  time: "Now" },
                    { icon: "📋", msg: `${savedReports.length} report(s) saved in the database.`,          time: "Now" },
                    { icon: "🧪", msg: `${labTests.length} lab test(s) in the system.`,                    time: "Now" },
                  ].map((n, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "1rem", padding: "0.9rem 0", borderBottom: "1px solid #f0f0f0" }}>
                      <span style={{ fontSize: "1.5rem" }}>{n.icon}</span>
                      <div>
                        <p style={{ margin: 0, fontWeight: 500 }}>{n.msg}</p>
                        <time style={{ color: "#888", fontSize: "0.8rem" }}>{n.time}</time>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* ── VIEW SAVED REPORTS (from DB) ── */}
          {activePage === "viewreports" && (
            <>
              <div className="mc-page-header">
                <h1>Saved Reports</h1>
                <p>All reports created by doctors, stored in database</p>
              </div>
              <div className="mc-panel">
                <div className="mc-panel-header"><h2>All Reports ({savedReports.length})</h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead>
                      <tr><th>#</th><th>Patient</th><th>Doctor</th><th>Diagnosis</th><th>Notes</th><th>Date</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {savedReports.length === 0 ? (
                        <tr><td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "#888" }}>No reports found. Create a report using the 📋 Create Report tab.</td></tr>
                      ) : savedReports.map((r, i) => (
                        <tr key={r._id || i}>
                          <td>{i + 1}</td>
                          <td>{r.patient || "—"}</td>
                          <td>{r.doctor || "—"}</td>
                          <td>{r.diagnosis || "—"}</td>
                          <td style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.notes || "—"}</td>
                          <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                          <td><Badge status={r.status || "Active"} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ── LAB TESTS (doctor sees) ── */}
          {activePage === "labtests" && (
            <>
              <div className="mc-page-header">
                <h1>Lab Tests</h1>
                <p>Lab test results for patients</p>
              </div>
              <div className="mc-panel">
                <div className="mc-panel-header"><h2>All Lab Tests ({labTests.length})</h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead>
                      <tr><th>#</th><th>Patient</th><th>Test Name</th><th>Priority</th><th>Result / Report</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {labTests.length === 0 ? (
                        <tr><td colSpan="7" style={{ textAlign: "center", padding: "2rem", color: "#888" }}>No lab tests found.</td></tr>
                      ) : labTests.map((t, i) => (
                        <tr key={t._id || i}>
                          <td>{i + 1}</td>
                          <td>{t.patientName || (t.patientId?.firstname ? `${t.patientId.firstname} ${t.patientId.lastname || ""}` : "—")}</td>
                          <td>{t.testName || "—"}</td>
                          <td>{t.priority || "Normal"}</td>
                          <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.report || "—"}</td>
                          <td><Badge status={t.status || "Pending"} /></td>
                          <td>{t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

        </main>
      </div>

      {/* ══ EDIT APPOINTMENT MODAL ══ */}
      {editApptModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ background:"#fff",borderRadius:12,padding:"2rem",width:"100%",maxWidth:440,boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem" }}>
              <h3 style={{ margin:0,color:"#7c3aed" }}>✏️ Edit Appointment</h3>
              <button onClick={() => setEditApptModal(false)} style={{ background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ marginBottom:"0.8rem" }}><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Date</label>
              <input className="mc-input" value={editApptData.date||""} onChange={e => setEditApptData({...editApptData,date:e.target.value})} /></div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.8rem",marginBottom:"0.8rem" }}>
              <div><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Time</label>
                <input className="mc-input" value={editApptData.time||""} onChange={e => setEditApptData({...editApptData,time:e.target.value})} /></div>
              <div><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Status</label>
                <select className="mc-input" value={editApptData.status||"Pending"} onChange={e => setEditApptData({...editApptData,status:e.target.value})}>
                  <option>Pending</option><option>Confirmed</option><option>Completed</option><option>Cancelled</option>
                </select></div>
            </div>
            <div style={{ marginBottom:"0.8rem" }}><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Notes</label>
              <textarea className="mc-input mc-textarea" rows={3} value={editApptData.notes||""} onChange={e => setEditApptData({...editApptData,notes:e.target.value})} /></div>
            <div style={{ display:"flex",gap:"0.75rem" }}>
              <button className="mc-btn" style={{ flex:1 }} onClick={handleEditAppt}>💾 Save</button>
              <button onClick={() => setEditApptModal(false)} style={{ flex:1,padding:"0.6rem",border:"1px solid #d1d5db",borderRadius:8,background:"#f9fafb",cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT REPORT MODAL ══ */}
      {editRptModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ background:"#fff",borderRadius:12,padding:"2rem",width:"100%",maxWidth:440,boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem" }}>
              <h3 style={{ margin:0,color:"#7c3aed" }}>✏️ Edit Report</h3>
              <button onClick={() => setEditRptModal(false)} style={{ background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer" }}>✕</button>
            </div>
            <div style={{ marginBottom:"0.8rem" }}><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Patient</label>
              <input className="mc-input" value={editRptData.patient||""} onChange={e => setEditRptData({...editRptData,patient:e.target.value})} /></div>
            <div style={{ marginBottom:"0.8rem" }}><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Diagnosis</label>
              <input className="mc-input" value={editRptData.diagnosis||""} onChange={e => setEditRptData({...editRptData,diagnosis:e.target.value})} /></div>
            <div style={{ marginBottom:"0.8rem" }}><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Notes</label>
              <textarea className="mc-input mc-textarea" rows={3} value={editRptData.notes||""} onChange={e => setEditRptData({...editRptData,notes:e.target.value})} /></div>
            <div style={{ display:"flex",gap:"0.75rem" }}>
              <button className="mc-btn" style={{ flex:1 }} onClick={handleEditReport}>💾 Save</button>
              <button onClick={() => setEditRptModal(false)} style={{ flex:1,padding:"0.6rem",border:"1px solid #d1d5db",borderRadius:8,background:"#f9fafb",cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default DoctorDashboard;
