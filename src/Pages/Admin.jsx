import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import "../index.css";

const API = "https://medcare-hms-backend.onrender.com/api";

/* ── helpers ── */
function Badge({ status }) {
  const s = (status || "active").toLowerCase().replace(/\s/g, "");
  return <span className={`mc-badge ${s}`}>{status}</span>;
}
function SidebarBtn({ page, label, icon, activePage, setActivePage }) {
  return (
    <button className={`mc-sidebar-btn ${activePage === page ? "active" : ""}`} onClick={() => setActivePage(page)}>
      {icon && <span className="mc-icon">{icon}</span>}{label}
    </button>
  );
}
function EmptyRow({ cols, message }) {
  return <tr><td colSpan={cols} style={{ textAlign: "center", padding: "2rem", color: "#888" }}>{message}</td></tr>;
}
function LoadingRow({ cols }) {
  return <tr><td colSpan={cols} style={{ textAlign: "center", padding: "2rem", color: "#888" }}>Loading…</td></tr>;
}
function Msg({ text }) {
  if (!text) return null;
  const ok = text.startsWith("✅");
  return (
    <div style={{ padding: "0.6rem 1rem", marginBottom: "1rem", borderRadius: 6,
      background: ok ? "#d1fae5" : "#fee2e2", color: ok ? "#065f46" : "#991b1b", fontSize: "0.875rem" }}>
      {text}
    </div>
  );
}

/* ── useFetch hook ── */
function useFetch(url, defaultVal = []) {
  const [data,    setData]    = useState(defaultVal);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    axios.get(url)
      .then((res) => {
        const r = res.data;
        const payload = r?.data ?? r?.doctors ?? r?.patients ?? r?.appointments ?? r?.staff ?? r?.activities ?? r;
        setData(Array.isArray(payload) ? payload : (typeof payload === "object" && payload !== null ? payload : defaultVal));
      })
      .catch((err) => { console.error(`[useFetch] ${url}:`, err.message); setError(err.message); })
      .finally(() => setLoading(false));
  }, [url]); // eslint-disable-line

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, error, refetch };
}

/* ═══════════ ADMIN COMPONENT ═══════════ */
function Admin() {
  const [activePage, setActivePage] = useState("dashboard");

  /* ── API data ── */
  const { data: stats,           loading: statsLoading,   refetch: refetchStats }       = useFetch(`${API}/admin/stats`, {});
  const { data: doctors,         loading: doctorsLoading, refetch: refetchDoctors }     = useFetch(`${API}/admin/doctors`, []);
  const { data: patients,        loading: patientsLoading }                             = useFetch(`${API}/admin/patients`, []);
  const { data: appointments,    loading: appointmentsLoading }                         = useFetch(`${API}/admin/appointments`, []);
  const { data: recentActivities,loading: activitiesLoading }                           = useFetch(`${API}/admin/recent-activities`, []);
  const { data: staff,           loading: staffLoading,   refetch: refetchStaff }       = useFetch(`${API}/admin/staff`, []);
  const { data: bills,           loading: billsLoading }                                 = useFetch(`${API}/pharmacy/bills`, []);
  const { data: allReports,      loading: reportsLoading }                               = useFetch(`${API}/report/all`, []);
  const { data: labTestsAdmin,   loading: labLoading }                                   = useFetch(`${API}/labtest/tests`, []);

  /* ── Doctor CRUD state ── */
  const blankDoc  = { firstname: "", lastname: "", email: "", phone: "", department: "", password: "" };
  const [docForm, setDocForm]   = useState(blankDoc);
  const [docMsg,  setDocMsg]    = useState("");
  const [docSaving, setDocSaving] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);

  /* ── Staff CRUD state ── */
  const blankStaff  = { firstname: "", lastname: "", email: "", phone: "", role: "labstaff", password: "" };
  const [staffForm, setStaffForm]   = useState(blankStaff);
  const [staffMsg,  setStaffMsg]    = useState("");
  const [staffSaving, setStaffSaving] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);

  /* ── Edit state ── */
  const [editDocModal,  setEditDocModal]  = useState(false);
  const [editDocData,   setEditDocData]   = useState({});
  const [editDocMsg,    setEditDocMsg]    = useState("");
  const [editDocSaving, setEditDocSaving] = useState(false);
  const [doctorsOverride, setDoctorsOverride] = useState(null);

  const [editStaffModal,  setEditStaffModal]  = useState(false);
  const [editStaffData,   setEditStaffData]   = useState({});
  const [editStaffMsg,    setEditStaffMsg]    = useState("");
  const [editStaffSaving, setEditStaffSaving] = useState(false);

  /* ── Sync override when fresh data arrives ── */
  React.useEffect(() => {
    if (Array.isArray(doctors) && doctors.length >= 0) setDoctorsOverride(doctors);
  }, [doctors]);

  const logout = () => { localStorage.removeItem("loginData"); window.location.href = "/"; };
  const formatRevenue = (val) => {
    if (!val && val !== 0) return "—";
    if (typeof val === "string") return val;
    return `₹${Number(val).toLocaleString("en-IN")}`;
  };

  const doctorList     = doctorsOverride !== null ? doctorsOverride : (Array.isArray(doctors) ? doctors : []);
  const patientList    = Array.isArray(patients)         ? patients         : [];
  const appointmentList= Array.isArray(appointments)     ? appointments     : [];
  const activityList   = Array.isArray(recentActivities) ? recentActivities : [];
  const staffList      = Array.isArray(staff)            ? staff            : [];
  const billsList      = Array.isArray(bills)            ? bills            : [];
  const reportsList    = Array.isArray(allReports?.reports || allReports) ? (allReports?.reports || allReports) : [];
  const labAdminList   = Array.isArray(labTestsAdmin)    ? labTestsAdmin    : [];

  const totalBillAmount = billsList.reduce((s, b) => s + Number(b.totalAmount || b.amount || 0), 0);

  const DEPARTMENTS = [
    { name: "General Medicine",    head: "Available on assignment", beds: 40, status: "Active" },
    { name: "Cardiology",          head: "Available on assignment", beds: 20, status: "Active" },
    { name: "Neurology",           head: "Available on assignment", beds: 15, status: "Active" },
    { name: "Orthopedics",         head: "Available on assignment", beds: 25, status: "Active" },
    { name: "Pediatrics",          head: "Available on assignment", beds: 30, status: "Active" },
    { name: "Dermatology",         head: "Available on assignment", beds: 10, status: "Active" },
    { name: "Ophthalmology",       head: "Available on assignment", beds: 8,  status: "Active" },
    { name: "ENT",                 head: "Available on assignment", beds: 12, status: "Active" },
    { name: "Gynecology",          head: "Available on assignment", beds: 20, status: "Active" },
    { name: "Radiology",           head: "Available on assignment", beds: 5,  status: "Active" },
    { name: "Oncology",            head: "Available on assignment", beds: 18, status: "Active" },
    { name: "Laboratory",          head: "Available on assignment", beds: 0,  status: "Active" },
    { name: "Pharmacy",            head: "Available on assignment", beds: 0,  status: "Active" },
    { name: "Emergency",           head: "Available on assignment", beds: 10, status: "Active" },
  ];

  /* ── Doctor handlers ── */
  const handleAddDoctor = async () => {
    const { firstname, lastname, email, phone, department, password } = docForm;
    if (!firstname || !lastname || !email || !phone || !department || !password) {
      setDocMsg("⚠️ All fields are required."); return;
    }
    setDocSaving(true); setDocMsg("");
    try {
      await axios.post(`${API}/admin/doctors`, docForm);
      setDocMsg("✅ Doctor added successfully!");
      setDocForm(blankDoc);
      setShowDocForm(false);
      refetchDoctors();
      refetchStats();
    } catch (err) {
      setDocMsg("❌ " + (err.response?.data?.message || err.message));
    }
    setDocSaving(false);
  };

  const handleDeleteDoctor = async (id, name) => {
    if (!window.confirm(`Delete Dr. ${name}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/admin/doctors/${id}`);
      refetchDoctors(); refetchStats();
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  /* ── Staff handlers ── */
  const handleAddStaff = async () => {
    const { firstname, lastname, email, phone, role } = staffForm;
    if (!firstname || !lastname || !email || !phone || !role) {
      setStaffMsg("⚠️ All fields are required."); return;
    }
    setStaffSaving(true); setStaffMsg("");
    try {
      await axios.post(`${API}/admin/staff`, staffForm);
      setStaffMsg("✅ Staff added successfully!");
      setStaffForm(blankStaff);
      setShowStaffForm(false);
      refetchStaff(); refetchStats();
    } catch (err) {
      setStaffMsg("❌ " + (err.response?.data?.message || err.message));
    }
    setStaffSaving(false);
  };

  const handleDeleteStaff = async (id, name) => {
    if (!window.confirm(`Remove staff ${name}? This cannot be undone.`)) return;
    try {
      await axios.delete(`${API}/admin/staff/${id}`);
      refetchStaff(); refetchStats();
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  /* ── Edit handlers ── */
  const openEditDoc = (doc) => {
    setEditDocData({ ...doc });
    setEditDocMsg("");
    setEditDocModal(true);
  };

  const handleEditDoctor = async () => {
    const { _id, firstname, lastname, email, phone, department } = editDocData;
    if (!firstname || !lastname || !email || !phone || !department) {
      setEditDocMsg("⚠️ All fields are required."); return;
    }
    setEditDocSaving(true); setEditDocMsg("");
    try {
      const res = await axios.put(`${API}/admin/doctors/${_id}`, { firstname, lastname, email, phone, department });
      const updated = res.data?.data || { ...editDocData, firstname, lastname, email, phone, department };
      // Immediately patch the table row without waiting for refetch
      setDoctorsOverride(prev =>
        Array.isArray(prev)
          ? prev.map(d => d._id === _id ? { ...d, ...updated } : d)
          : Array.isArray(doctors) ? doctors.map(d => d._id === _id ? { ...d, ...updated } : d) : [updated]
      );
      setEditDocMsg("✅ Doctor updated!");
      setEditDocSaving(false);
      setEditDocModal(false);
      refetchDoctors();
    } catch (err) {
      setEditDocMsg("❌ " + (err.response?.data?.message || err.message));
      setEditDocSaving(false);
    }
  };

  const openEditStaff = (s) => {
    setEditStaffData({ ...s });
    setEditStaffMsg("");
    setEditStaffModal(true);
  };

  const handleEditStaff = async () => {
    const { _id, firstname, lastname, email, phone, role } = editStaffData;
    if (!firstname || !lastname || !email || !phone || !role) {
      setEditStaffMsg("⚠️ All fields are required."); return;
    }
    setEditStaffSaving(true); setEditStaffMsg("");
    try {
      await axios.put(`${API}/admin/staff/${_id}`, { firstname, lastname, email, phone, role });
      setEditStaffMsg("✅ Staff updated!");
      refetchStaff();
      setTimeout(() => setEditStaffModal(false), 800);
    } catch (err) {
      setEditStaffMsg("❌ " + (err.response?.data?.message || err.message));
    }
    setEditStaffSaving(false);
  };

  const inputStyle = { width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid #d1d5db", marginBottom: 0, fontSize: "0.9rem" };
  const formRow = { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem", marginBottom: "1rem" };

  return (
    <>
      <nav className="mc-nav">
        <div className="mc-nav-logo">
          <img src="/logo.png" alt="MedCare" />
          <h2>Med<span>Care</span></h2>
        </div>
        <ul className="mc-nav-links">
          <li><button onClick={() => setActivePage("dashboard")}>Home</button></li>
          <li><button onClick={() => setActivePage("adminprofile")} > Profile</button></li>
          <li><button onClick={() => setActivePage("adminnotif")}>Notifications</button></li>
          <li><button className="mc-nav-logout" onClick={logout}>Logout</button></li>
        </ul>
      </nav>

      <div className="mc-layout">
        <aside className="mc-sidebar">
          <div className="mc-sidebar-label">Admin Panel</div>
          <SidebarBtn page="dashboard"    label="Dashboard"        icon="📊" activePage={activePage} setActivePage={setActivePage} />
          <div className="mc-sidebar-label">Management</div>
          <SidebarBtn page="doctors"      label="Manage Doctors"   icon="🩺" activePage={activePage} setActivePage={setActivePage} />
          <SidebarBtn page="staff"        label="Manage Staff"     icon="👥" activePage={activePage} setActivePage={setActivePage} />
          <SidebarBtn page="patients"     label="Manage Patients"  icon="🧑‍⚕️" activePage={activePage} setActivePage={setActivePage} />
          <SidebarBtn page="appointments" label="Appointments"     icon="📅" activePage={activePage} setActivePage={setActivePage} />
          <div className="mc-sidebar-label">Finance & Reports</div>
          <SidebarBtn page="adminbills"  label="Bills"            icon="💳" activePage={activePage} setActivePage={setActivePage} />
          <SidebarBtn page="admindepts"  label="Departments"      icon="🏥" activePage={activePage} setActivePage={setActivePage} />
          <SidebarBtn page="adminreports"label="Reports"          icon="📋" activePage={activePage} setActivePage={setActivePage} />
        </aside>

        <main className="mc-content">

          {/* ══ DASHBOARD ══ */}
          {activePage === "dashboard" && (
            <>
              <div className="mc-page-header">
                <h1>Admin Dashboard</h1>
                <p>Overview of hospital operations</p>
              </div>

              <div className="mc-cards">
                <div className="mc-card purple">
                  <div className="mc-card-icon">🩺</div>
                  <div className="mc-card-value">{statsLoading ? "…" : (stats.doctors ?? "0")}</div>
                  <div className="mc-card-label">Total Doctors</div>
                  <div className="mc-card-sub">{stats.doctors ? `${stats.doctors} Registered` : "—"}</div>
                </div>
                <div className="mc-card teal">
                  <div className="mc-card-icon">🧑‍⚕️</div>
                  <div className="mc-card-value">{statsLoading ? "…" : (stats.patients ?? "0")}</div>
                  <div className="mc-card-label">Total Patients</div>
                  <div className="mc-card-sub">{stats.patients ? `${stats.patients} Registered` : "—"}</div>
                </div>
                <div className="mc-card sky">
                  <div className="mc-card-icon">👥</div>
                  <div className="mc-card-value">{statsLoading ? "…" : (stats.staff ?? "0")}</div>
                  <div className="mc-card-label">Total Staff</div>
                  <div className="mc-card-sub">{stats.staff ? `${stats.staff} Members` : "—"}</div>
                </div>
                <div className="mc-card amber">
                  <div className="mc-card-icon">💳</div>
                  <div className="mc-card-value">{statsLoading ? "…" : formatRevenue(stats.revenue)}</div>
                  <div className="mc-card-label">Total Revenue</div>
                  <div className="mc-card-sub up">↑ This Month</div>
                </div>
              </div>

              <div className="mc-panel" style={{ marginTop: "1.5rem" }}>
                <div className="mc-panel-header"><h2>Recent Appointments <span>Latest from DB</span></h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead><tr><th>Patient</th><th>Doctor</th><th>Date</th><th>Status</th></tr></thead>
                    <tbody>
                      {appointmentsLoading ? <LoadingRow cols={4} /> :
                        appointmentList.length === 0 ? <EmptyRow cols={4} message="No appointments found" /> :
                        appointmentList.slice(0, 5).map((a, i) => (
                          <tr key={a._id || i}>
                            <td>{a.patientId?.firstname || a.patientName || "—"} {a.patientId?.lastname || ""}</td>
                            <td>{a.doctorId?.firstname ? `Dr. ${a.doctorId.firstname} ${a.doctorId.lastname || ""}` : a.doctorName || "—"}</td>
                            <td>{a.date || "—"}</td>
                            <td><Badge status={a.status || "Pending"} /></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mc-panel" style={{ marginTop: "1.5rem" }}>
                <div className="mc-panel-header"><h2>Recent Activities <span>Last 24 hours</span></h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead><tr><th>User</th><th>Activity</th><th>Status</th></tr></thead>
                    <tbody>
                      {activitiesLoading ? <LoadingRow cols={3} /> :
                        activityList.length === 0 ? <EmptyRow cols={3} message="No recent activities" /> :
                        activityList.map((a, i) => (
                          <tr key={i}>
                            <td>{a.user || "—"}</td>
                            <td>{a.activity || "—"}</td>
                            <td><Badge status={a.status || "Completed"} /></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ MANAGE DOCTORS ══ */}
          {activePage === "doctors" && (
            <>
              <div className="mc-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1>Manage Doctors</h1>
                  <p>Add, view and remove doctors</p>
                </div>
                <button className="mc-btn" onClick={() => { setShowDocForm((p) => !p); setDocMsg(""); }}>
                  {showDocForm ? "✕ Cancel" : "➕ Add Doctor"}
                </button>
              </div>

              {showDocForm && (
                <div className="mc-panel" style={{ marginBottom: "1.5rem" }}>
                  <div className="mc-panel-header"><h2>New Doctor</h2></div>
                  <div className="mc-panel-body">
                    <Msg text={docMsg} />
                    <div style={formRow}>
                      <div><label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: "0.85rem" }}>First Name *</label>
                        <input style={inputStyle} placeholder="First name" value={docForm.firstname} onChange={(e) => setDocForm({ ...docForm, firstname: e.target.value })} /></div>
                      <div><label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: "0.85rem" }}>Last Name *</label>
                        <input style={inputStyle} placeholder="Last name" value={docForm.lastname} onChange={(e) => setDocForm({ ...docForm, lastname: e.target.value })} /></div>
                    </div>
                    <div style={formRow}>
                      <div><label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: "0.85rem" }}>Email *</label>
                        <input style={inputStyle} type="email" placeholder="doctor@hospital.com" value={docForm.email} onChange={(e) => setDocForm({ ...docForm, email: e.target.value })} /></div>
                      <div><label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: "0.85rem" }}>Phone *</label>
                        <input style={inputStyle} placeholder="Phone number" value={docForm.phone} onChange={(e) => setDocForm({ ...docForm, phone: e.target.value })} /></div>
                    </div>
                    <div style={formRow}>
                      <div><label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: "0.85rem" }}>Department *</label>
                        <select style={inputStyle} value={docForm.department} onChange={(e) => setDocForm({ ...docForm, department: e.target.value })}>
                          <option value="">-- Select --</option>
                          {["General","Cardiology","Neurology","Orthopedics","Pediatrics","Dermatology","Ophthalmology","ENT","Gynecology","Radiology","Oncology"].map(d => <option key={d} value={d}>{d}</option>)}
                        </select></div>
                      <div><label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: "0.85rem" }}>Password *</label>
                        <input style={inputStyle} type="password" placeholder="Temporary password" value={docForm.password} onChange={(e) => setDocForm({ ...docForm, password: e.target.value })} /></div>
                    </div>
                    <button className="mc-btn" onClick={handleAddDoctor} disabled={docSaving}>
                      {docSaving ? "Saving…" : "💾 Add Doctor"}
                    </button>
                  </div>
                </div>
              )}

              <div className="mc-panel">
                <div className="mc-panel-header"><h2>Doctor List <span>{doctorList.length} records</span></h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead><tr><th>#</th><th>Name</th><th>Department</th><th>Email</th><th>Phone</th><th>Action</th></tr></thead>
                    <tbody>
                      {doctorsLoading ? <LoadingRow cols={6} /> :
                        doctorList.length === 0 ? <EmptyRow cols={6} message="No doctors found. Add one above." /> :
                        doctorList.map((doc, i) => (
                          <tr key={doc._id || i}>
                            <td>{i + 1}</td>
                            <td>Dr. {doc.firstname || "—"} {doc.lastname || ""}</td>
                            <td>{doc.department || "—"}</td>
                            <td>{doc.email || "—"}</td>
                            <td>{doc.phone || "—"}</td>
                            <td style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => openEditDoc(doc)}
                                style={{ background: "#ede9fe", color: "#7c3aed", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: "0.8rem" }}>
                                ✏️ Edit
                              </button>
                              <button onClick={() => handleDeleteDoctor(doc._id, `${doc.firstname} ${doc.lastname}`)}
                                style={{ background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: "0.8rem" }}>
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

          {/* ══ MANAGE STAFF ══ */}
          {activePage === "staff" && (
            <>
              <div className="mc-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h1>Manage Staff</h1>
                  <p>Add, view and remove staff members</p>
                </div>
                <button className="mc-btn" onClick={() => { setShowStaffForm((p) => !p); setStaffMsg(""); }}>
                  {showStaffForm ? "✕ Cancel" : "➕ Add Staff"}
                </button>
              </div>

              {showStaffForm && (
                <div className="mc-panel" style={{ marginBottom: "1.5rem" }}>
                  <div className="mc-panel-header"><h2>New Staff Member</h2></div>
                  <div className="mc-panel-body">
                    <Msg text={staffMsg} />
                    <div style={formRow}>
                      <div><label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: "0.85rem" }}>First Name *</label>
                        <input style={inputStyle} placeholder="First name" value={staffForm.firstname} onChange={(e) => setStaffForm({ ...staffForm, firstname: e.target.value })} /></div>
                      <div><label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: "0.85rem" }}>Last Name *</label>
                        <input style={inputStyle} placeholder="Last name" value={staffForm.lastname} onChange={(e) => setStaffForm({ ...staffForm, lastname: e.target.value })} /></div>
                    </div>
                    <div style={formRow}>
                      <div><label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: "0.85rem" }}>Email *</label>
                        <input style={inputStyle} type="email" placeholder="staff@hospital.com" value={staffForm.email} onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })} /></div>
                      <div><label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: "0.85rem" }}>Phone *</label>
                        <input style={inputStyle} placeholder="Phone number" value={staffForm.phone} onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })} /></div>
                    </div>
                    <div style={formRow}>
                      <div><label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: "0.85rem" }}>Role *</label>
                        <select style={inputStyle} value={staffForm.role} onChange={(e) => setStaffForm({ ...staffForm, role: e.target.value })}>
                          <option value="labstaff">Lab Staff</option>
                          <option value="pharmacystaff">Pharmacy Staff</option>
                          <option value="billingstaff">Billing Staff</option>
                        </select></div>
                      <div><label style={{ display: "block", marginBottom: 4, fontWeight: 600, fontSize: "0.85rem" }}>Default Password</label>
                        <input style={inputStyle} type="password" placeholder="Leave blank for Staff@123" value={staffForm.password} onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })} /></div>
                    </div>
                    <button className="mc-btn" onClick={handleAddStaff} disabled={staffSaving}>
                      {staffSaving ? "Saving…" : "💾 Add Staff"}
                    </button>
                  </div>
                </div>
              )}

              <div className="mc-panel">
                <div className="mc-panel-header"><h2>Staff List <span>{staffList.length} members</span></h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead><tr><th>#</th><th>Name</th><th>Role</th><th>Email</th><th>Phone</th><th>Action</th></tr></thead>
                    <tbody>
                      {staffLoading ? <LoadingRow cols={6} /> :
                        staffList.length === 0 ? <EmptyRow cols={6} message="No staff found. Add one above." /> :
                        staffList.map((s, i) => (
                          <tr key={s._id || i}>
                            <td>{i + 1}</td>
                            <td>{s.firstname || "—"} {s.lastname || ""}</td>
                            <td><Badge status={s.role || "staff"} /></td>
                            <td>{s.email || "—"}</td>
                            <td>{s.phone || "—"}</td>
                            <td style={{ display: "flex", gap: 6 }}>
                              <button onClick={() => openEditStaff(s)}
                                style={{ background: "#ede9fe", color: "#7c3aed", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: "0.8rem" }}>
                                ✏️ Edit
                              </button>
                              <button onClick={() => handleDeleteStaff(s._id, `${s.firstname} ${s.lastname}`)}
                                style={{ background: "#fee2e2", color: "#991b1b", border: "none", borderRadius: 6, padding: "4px 10px", cursor: "pointer", fontSize: "0.8rem" }}>
                                🗑️ Remove
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

          {/* ══ MANAGE PATIENTS ══ */}
          {activePage === "patients" && (
            <>
              <div className="mc-page-header">
                <h1>Manage Patients</h1>
                <p>All registered patients from database</p>
              </div>
              <div className="mc-panel">
                <div className="mc-panel-header"><h2>Patient List <span>{patientList.length} records</span></h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead><tr><th>#</th><th>Name</th><th>Email</th><th>Phone</th><th>Registered</th></tr></thead>
                    <tbody>
                      {patientsLoading ? <LoadingRow cols={5} /> :
                        patientList.length === 0 ? <EmptyRow cols={5} message="No patients registered yet." /> :
                        patientList.map((p, i) => (
                          <tr key={p._id || i}>
                            <td>{i + 1}</td>
                            <td>{p.firstname || "—"} {p.lastname || ""}</td>
                            <td>{p.email || "—"}</td>
                            <td>{p.phone || "—"}</td>
                            <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ APPOINTMENTS ══ */}
          {activePage === "appointments" && (
            <>
              <div className="mc-page-header">
                <h1>All Appointments</h1>
                <p>All appointments across the hospital</p>
              </div>
              <div className="mc-panel">
                <div className="mc-panel-header"><h2>Appointment List <span>{appointmentList.length} records</span></h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead><tr><th>#</th><th>Patient</th><th>Doctor</th><th>Department</th><th>Date</th><th>Time</th><th>Status</th></tr></thead>
                    <tbody>
                      {appointmentsLoading ? <LoadingRow cols={7} /> :
                        appointmentList.length === 0 ? <EmptyRow cols={7} message="No appointments found." /> :
                        appointmentList.map((a, i) => (
                          <tr key={a._id || i}>
                            <td>{i + 1}</td>
                            <td>{a.patientId?.firstname || a.patientName || "—"} {a.patientId?.lastname || ""}</td>
                            <td>{a.doctorId?.firstname ? `Dr. ${a.doctorId.firstname} ${a.doctorId.lastname || ""}` : a.doctorName || "—"}</td>
                            <td>{a.department || "—"}</td>
                            <td>{a.date || "—"}</td>
                            <td>{a.time || "—"}</td>
                            <td><Badge status={a.status || "Pending"} /></td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}


          {/* ══ BILLS ══ */}
          {activePage === "adminbills" && (
            <>
              <div className="mc-page-header">
                <h1>Billing Overview</h1>
                <p>All pharmacy bills and revenue details</p>
              </div>

              {/* Summary cards */}
              <div className="mc-cards" style={{ marginBottom: "1.5rem" }}>
                <div className="mc-card purple">
                  <div className="mc-card-icon">💳</div>
                  <div className="mc-card-value">{billsList.length}</div>
                  <div className="mc-card-label">Total Bills</div>
                </div>
                <div className="mc-card teal">
                  <div className="mc-card-icon">💰</div>
                  <div className="mc-card-value">₹{totalBillAmount.toLocaleString("en-IN")}</div>
                  <div className="mc-card-label">Total Revenue</div>
                </div>
                <div className="mc-card amber">
                  <div className="mc-card-icon">✅</div>
                  <div className="mc-card-value">{billsList.filter(b => (b.status || "").toLowerCase() === "paid").length}</div>
                  <div className="mc-card-label">Paid Bills</div>
                </div>
                <div className="mc-card sky">
                  <div className="mc-card-icon">⏳</div>
                  <div className="mc-card-value">{billsList.filter(b => (b.status || "").toLowerCase() !== "paid").length}</div>
                  <div className="mc-card-label">Pending Bills</div>
                </div>
              </div>

              <div className="mc-panel">
                <div className="mc-panel-header"><h2>Bill Records <span>{billsList.length} entries</span></h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead><tr><th>#</th><th>Patient</th><th>Medicine</th><th>Amount (₹)</th><th>Payment Method</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                      {billsLoading ? <LoadingRow cols={7} /> :
                        billsList.length === 0 ? <EmptyRow cols={7} message="No bills found. Bills created in Pharmacy will appear here." /> :
                        billsList.map((b, i) => (
                          <tr key={b._id || i}>
                            <td>{i + 1}</td>
                            <td>{b.patientName || b.patient || "—"}</td>
                            <td>{b.medicine || "—"}</td>
                            <td style={{ fontWeight: 600, color: "#7c3aed" }}>₹{Number(b.totalAmount || b.amount || 0).toLocaleString("en-IN")}</td>
                            <td>{b.paymentMethod || "Cash"}</td>
                            <td><Badge status={b.status || "Pending"} /></td>
                            <td>{b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ DEPARTMENTS ══ */}
          {activePage === "admindepts" && (
            <>
              <div className="mc-page-header">
                <h1>Departments</h1>
                <p>All hospital departments and their status</p>
              </div>

              <div className="mc-cards" style={{ marginBottom: "1.5rem" }}>
                <div className="mc-card teal">
                  <div className="mc-card-icon">🏥</div>
                  <div className="mc-card-value">{DEPARTMENTS.length}</div>
                  <div className="mc-card-label">Total Departments</div>
                </div>
                <div className="mc-card sky">
                  <div className="mc-card-icon">🛏️</div>
                  <div className="mc-card-value">{DEPARTMENTS.reduce((s, d) => s + d.beds, 0)}</div>
                  <div className="mc-card-label">Total Beds</div>
                </div>
                <div className="mc-card purple">
                  <div className="mc-card-icon">🩺</div>
                  <div className="mc-card-value">{doctorList.length}</div>
                  <div className="mc-card-label">Doctors Assigned</div>
                </div>
                <div className="mc-card amber">
                  <div className="mc-card-icon">✅</div>
                  <div className="mc-card-value">{DEPARTMENTS.filter(d => d.status === "Active").length}</div>
                  <div className="mc-card-label">Active Departments</div>
                </div>
              </div>

              <div className="mc-panel">
                <div className="mc-panel-header"><h2>Department List</h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead><tr><th>#</th><th>Department</th><th>Doctors</th><th>Beds</th><th>Status</th></tr></thead>
                    <tbody>
                      {DEPARTMENTS.map((dept, i) => {
                        const deptDoctors = doctorList.filter(d =>
                          (d.department || "").toLowerCase() === dept.name.toLowerCase()
                        );
                        return (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td style={{ fontWeight: 600 }}>{dept.name}</td>
                            <td>
                              {deptDoctors.length > 0
                                ? deptDoctors.map(d => `Dr. ${d.firstname} ${d.lastname}`).join(", ")
                                : <span style={{ color: "#aaa" }}>No doctor assigned</span>}
                            </td>
                            <td>{dept.beds > 0 ? dept.beds : "—"}</td>
                            <td><Badge status={dept.status} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ REPORTS ══ */}
          {activePage === "adminreports" && (
            <>
              <div className="mc-page-header">
                <h1>Reports Overview</h1>
                <p>Doctor reports and lab test results</p>
              </div>

              <div className="mc-panel" style={{ marginBottom: "1.5rem" }}>
                <div className="mc-panel-header"><h2>Doctor Reports ({reportsList.length})</h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead><tr><th>#</th><th>Patient</th><th>Doctor</th><th>Diagnosis</th><th>Notes</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                      {reportsLoading ? <LoadingRow cols={7} /> :
                        reportsList.length === 0 ? <EmptyRow cols={7} message="No reports found. Doctors create reports from Doctor Dashboard." /> :
                        reportsList.map((r, i) => (
                          <tr key={r._id || i}>
                            <td>{i + 1}</td>
                            <td>{r.patient || "—"}</td>
                            <td>{r.doctor || "—"}</td>
                            <td>{r.diagnosis || "—"}</td>
                            <td style={{ maxWidth: 150, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.notes || "—"}</td>
                            <td><Badge status={r.status || "Active"} /></td>
                            <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="mc-panel">
                <div className="mc-panel-header"><h2>Lab Test Reports ({labAdminList.length})</h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead><tr><th>#</th><th>Patient</th><th>Test</th><th>Result</th><th>Priority</th><th>Status</th><th>Date</th></tr></thead>
                    <tbody>
                      {labLoading ? <LoadingRow cols={7} /> :
                        labAdminList.length === 0 ? <EmptyRow cols={7} message="No lab tests found." /> :
                        labAdminList.map((t, i) => (
                          <tr key={t._id || i}>
                            <td>{i + 1}</td>
                            <td>{t.patientName || (t.patientId?.firstname ? `${t.patientId.firstname} ${t.patientId.lastname || ""}` : "—")}</td>
                            <td>{t.testName || "—"}</td>
                            <td style={{ maxWidth: 140, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.report || "—"}</td>
                            <td>{t.priority || "Normal"}</td>
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

          {/* ══ ADMIN PROFILE ══ */}
          {activePage === "adminprofile" && (
            <>
              <div className="mc-page-header">
                <h1>Admin Profile</h1>
                <p>Your account information</p>
              </div>
              <div className="mc-panel">
                <div className="mc-panel-body">
                  <div style={{ background: "#f5f3ff", padding: "1.5rem", borderRadius: 12 }}>
                    <div style={{ fontSize: "3rem", textAlign: "center", marginBottom: "0.5rem" }}>👤</div>
                    <h2 style={{ textAlign: "center", margin: 0 }}>Administrator</h2>
                    <p style={{ textAlign: "center", color: "#666", margin: "0.3rem 0 1.5rem" }}>Hospital Management System Admin</p>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      {[
                        { label: "Total Doctors",  val: doctorList.length },
                        { label: "Total Patients", val: patientList.length },
                        { label: "Total Staff",    val: staffList.length },
                        { label: "Total Bills",    val: billsList.length },
                      ].map(({ label, val }) => (
                        <div key={label} style={{ background: "#fff", padding: "1rem", borderRadius: 8, textAlign: "center" }}>
                          <p style={{ margin: 0, fontSize: "1.5rem", fontWeight: 700, color: "#7c3aed" }}>{val}</p>
                          <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>{label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ══ ADMIN NOTIFICATIONS ══ */}
          {activePage === "adminnotif" && (
            <>
              <div className="mc-page-header">
                <h1>Notifications</h1>
                <p>Hospital system alerts</p>
              </div>
              <div className="mc-panel">
                <div className="mc-panel-body">
                  {[
                    { icon: "🩺", msg: `${doctorList.length} doctor(s) registered in the system.` },
                    { icon: "🧑‍⚕️", msg: `${patientList.length} patient(s) registered.` },
                    { icon: "👥", msg: `${staffList.length} staff member(s) active.` },
                    { icon: "📅", msg: `${appointmentList.length} appointment(s) recorded.` },
                    { icon: "💳", msg: `Total billing revenue: ₹${totalBillAmount.toLocaleString("en-IN")}.` },
                    { icon: "📋", msg: `${reportsList.length} doctor report(s) in database.` },
                    { icon: "🧪", msg: `${labAdminList.length} lab test(s) in system.` },
                  ].map((n, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.9rem 0", borderBottom: "1px solid #f0f0f0" }}>
                      <span style={{ fontSize: "1.5rem" }}>{n.icon}</span>
                      <p style={{ margin: 0, fontWeight: 500 }}>{n.msg}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

        </main>
      </div>

      {/* ══ EDIT DOCTOR MODAL ══ */}
      {editDocModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:12, padding:"2rem", width:"100%", maxWidth:480, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
              <h2 style={{ margin:0, color:"#7c3aed" }}>✏️ Edit Doctor</h2>
              <button onClick={() => setEditDocModal(false)} style={{ background:"none", border:"none", fontSize:"1.4rem", cursor:"pointer", color:"#666" }}>✕</button>
            </div>
            <Msg text={editDocMsg} />
            <div style={formRow}>
              <div><label style={{ display:"block", marginBottom:4, fontWeight:600, fontSize:"0.85rem" }}>First Name *</label>
                <input style={inputStyle} value={editDocData.firstname || ""} onChange={(e) => setEditDocData({...editDocData, firstname: e.target.value})} /></div>
              <div><label style={{ display:"block", marginBottom:4, fontWeight:600, fontSize:"0.85rem" }}>Last Name *</label>
                <input style={inputStyle} value={editDocData.lastname || ""} onChange={(e) => setEditDocData({...editDocData, lastname: e.target.value})} /></div>
            </div>
            <div style={formRow}>
              <div><label style={{ display:"block", marginBottom:4, fontWeight:600, fontSize:"0.85rem" }}>Email *</label>
                <input style={inputStyle} type="email" value={editDocData.email || ""} onChange={(e) => setEditDocData({...editDocData, email: e.target.value})} /></div>
              <div><label style={{ display:"block", marginBottom:4, fontWeight:600, fontSize:"0.85rem" }}>Phone *</label>
                <input style={inputStyle} value={editDocData.phone || ""} onChange={(e) => setEditDocData({...editDocData, phone: e.target.value})} /></div>
            </div>
            <div style={{ marginBottom:"1rem" }}>
              <label style={{ display:"block", marginBottom:4, fontWeight:600, fontSize:"0.85rem" }}>Department *</label>
              <select style={inputStyle} value={editDocData.department || ""} onChange={(e) => setEditDocData({...editDocData, department: e.target.value})}>
                <option value="">-- Select --</option>
                {["General","Cardiology","Neurology","Orthopedics","Pediatrics","Dermatology","Ophthalmology","ENT","Gynecology","Radiology","Oncology"].map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div style={{ display:"flex", gap:"0.75rem" }}>
              <button className="mc-btn" onClick={handleEditDoctor} disabled={editDocSaving} style={{ flex:1 }}>
                {editDocSaving ? "Saving…" : "💾 Save Changes"}
              </button>
              <button onClick={() => setEditDocModal(false)} style={{ flex:1, padding:"0.6rem", border:"1px solid #d1d5db", borderRadius:8, background:"#f9fafb", cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT STAFF MODAL ══ */}
      {editStaffModal && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:12, padding:"2rem", width:"100%", maxWidth:480, boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1.5rem" }}>
              <h2 style={{ margin:0, color:"#7c3aed" }}>✏️ Edit Staff</h2>
              <button onClick={() => setEditStaffModal(false)} style={{ background:"none", border:"none", fontSize:"1.4rem", cursor:"pointer", color:"#666" }}>✕</button>
            </div>
            <Msg text={editStaffMsg} />
            <div style={formRow}>
              <div><label style={{ display:"block", marginBottom:4, fontWeight:600, fontSize:"0.85rem" }}>First Name *</label>
                <input style={inputStyle} value={editStaffData.firstname || ""} onChange={(e) => setEditStaffData({...editStaffData, firstname: e.target.value})} /></div>
              <div><label style={{ display:"block", marginBottom:4, fontWeight:600, fontSize:"0.85rem" }}>Last Name *</label>
                <input style={inputStyle} value={editStaffData.lastname || ""} onChange={(e) => setEditStaffData({...editStaffData, lastname: e.target.value})} /></div>
            </div>
            <div style={formRow}>
              <div><label style={{ display:"block", marginBottom:4, fontWeight:600, fontSize:"0.85rem" }}>Email *</label>
                <input style={inputStyle} type="email" value={editStaffData.email || ""} onChange={(e) => setEditStaffData({...editStaffData, email: e.target.value})} /></div>
              <div><label style={{ display:"block", marginBottom:4, fontWeight:600, fontSize:"0.85rem" }}>Phone *</label>
                <input style={inputStyle} value={editStaffData.phone || ""} onChange={(e) => setEditStaffData({...editStaffData, phone: e.target.value})} /></div>
            </div>
            <div style={{ marginBottom:"1rem" }}>
              <label style={{ display:"block", marginBottom:4, fontWeight:600, fontSize:"0.85rem" }}>Role *</label>
              <select style={inputStyle} value={editStaffData.role || ""} onChange={(e) => setEditStaffData({...editStaffData, role: e.target.value})}>
                <option value="labstaff">Lab Staff</option>
                <option value="pharmacystaff">Pharmacy Staff</option>
              </select>
            </div>
            <div style={{ display:"flex", gap:"0.75rem" }}>
              <button className="mc-btn" onClick={handleEditStaff} disabled={editStaffSaving} style={{ flex:1 }}>
                {editStaffSaving ? "Saving…" : "💾 Save Changes"}
              </button>
              <button onClick={() => setEditStaffModal(false)} style={{ flex:1, padding:"0.6rem", border:"1px solid #d1d5db", borderRadius:8, background:"#f9fafb", cursor:"pointer" }}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default Admin;
