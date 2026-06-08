import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
import axios from "axios";

const API = "https://medcare-hms-backend.onrender.com/api";

function Badge({ status }) {
  const s = (status || "").toLowerCase().replace(/\s/g, "");
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

function EmptyState({ message }) {
  return (
    <tr>
      <td colSpan="10" style={{ textAlign: "center", color: "var(--text-secondary)", padding: "2rem" }}>
        {message}
      </td>
    </tr>
  );
}

const SIDEBAR = [
  { page: "dashboard", label: "Dashboard",    icon: "📊" },
  { page: "create",    label: "Create Test",  icon: "➕" },
  { page: "reports",   label: "Upload Report", icon: "📋" },
  { page: "equipment", label: "Equipment",    icon: "🔧" },
];

function LabStaff() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("dashboard");

  /* ── Dashboard state ── */
  const [dashStats,   setDashStats]   = useState(null);
  const [dashTests,   setDashTests]   = useState([]);
  const [dashLoading, setDashLoading] = useState(true);

  /* ── Create Test state ── */
  const blankCreate = { patientId: "", patientName: "", testName: "", priority: "Normal", emergency: false };
  const [createForm,   setCreateForm]   = useState(blankCreate);
  const [createMsg,    setCreateMsg]    = useState("");
  const [creating,     setCreating]     = useState(false);

  /* ── Report state ── */
  const [reportTests,  setReportTests]  = useState([]);
  const [reportLoading,setReportLoading]= useState(true);
  const blankReport = { testId: "", patientId: "", patientName: "", testName: "", result: "", remarks: "" };
  const [reportForm,   setReportForm]   = useState(blankReport);
  const [reportMsg,    setReportMsg]    = useState("");
  const [uploading,    setUploading]    = useState(false);

  /* ── Equipment state ── */
  const [equipment,    setEquipment]    = useState([]);
  const [equipLoading, setEquipLoading] = useState(true);
  const blankEquip = { name: "", status: "Operational", lastMaintenance: "" };
  const [equipForm,    setEquipForm]    = useState(blankEquip);
  const [equipMsg,     setEquipMsg]     = useState("");
  const [editEqModal,  setEditEqModal]  = useState(false);
  const [editEqData,   setEditEqData]   = useState({});
  const [editEqMsg,    setEditEqMsg]    = useState("");
  const [editTestModal,setEditTestModal]= useState(false);
  const [editTestData, setEditTestData] = useState({});
  const [editTestMsg,  setEditTestMsg]  = useState("");
  const labStaff = JSON.parse(localStorage.getItem("loginData") || "{}");

  const logout = () => navigate("/");

  /* ── Fetchers ── */
  const handleEditEq = async () => {
    try {
      const res = await axios.put(`${API}/labtest/equipment/${editEqData._id}`, editEqData);
      setEquipment(prev => prev.map(e => e._id === editEqData._id ? (res.data.equipment || editEqData) : e));
      setEditEqMsg("✅ Updated!"); setTimeout(() => setEditEqModal(false), 700);
    } catch (err) { setEditEqMsg("❌ " + (err.response?.data?.message || err.message)); }
  };

  const handleEditTest = async () => {
    try {
      const res = await axios.put(`${API}/labtest/tests/${editTestData._id}`, editTestData);
      setDashTests(prev => prev.map(t => t._id === editTestData._id ? (res.data.test || editTestData) : t));
      setEditTestMsg("✅ Updated!"); setTimeout(() => setEditTestModal(false), 700);
    } catch (err) { setEditTestMsg("❌ " + (err.response?.data?.message || err.message)); }
  };

  const fetchDashboard = async () => {
    setDashLoading(true);
    try {
      const [statsRes, testsRes] = await Promise.all([
        axios.get(`${API}/labtest/dashboard`),
        axios.get(`${API}/labtest/tests`),
      ]);
      setDashStats(statsRes.data);
      setDashTests(Array.isArray(testsRes.data) ? testsRes.data.slice(0, 10) : []);
    } catch (err) { console.error(err); }
    setDashLoading(false);
  };

  const fetchReportTests = async () => {
    setReportLoading(true);
    try {
      const res = await axios.get(`${API}/labtest/tests`);
      const arr = Array.isArray(res.data) ? res.data : [];
      setReportTests(arr.filter((t) => t.status !== "Completed"));
    } catch (err) { console.error(err); }
    setReportLoading(false);
  };

  const fetchEquipment = async () => {
    setEquipLoading(true);
    try {
      const res = await axios.get(`${API}/labtest/equipment`);
      setEquipment(Array.isArray(res.data) ? res.data : []);
    } catch (err) { console.error(err); }
    setEquipLoading(false);
  };

  useEffect(() => {
    if (activePage === "dashboard") fetchDashboard();
    if (activePage === "reports")   fetchReportTests();
    if (activePage === "equipment") fetchEquipment();
  }, [activePage]); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Create Test handler ── */
  const handleCreateTest = async () => {
    if (!createForm.patientName.trim() || !createForm.testName.trim()) {
      setCreateMsg("⚠️ Enter patient name and test name.");
      return;
    }
    setCreating(true);
    setCreateMsg("");
    try {
      await axios.post(`${API}/labtest/tests`, {
        patientName: createForm.patientName.trim(),
        patientRef:  createForm.patientId || "",
        testName:    createForm.testName.trim(),
        priority:    createForm.priority,
        emergency:   createForm.emergency,
        status:      "Pending",
      });
      setCreateMsg("✅ Test created successfully!");
      setCreateForm(blankCreate);
    } catch (err) {
      setCreateMsg("❌ Failed to create test. " + (err.response?.data?.message || err.message));
    }
    setCreating(false);
  };

  /* ── Report handlers ── */
  const handleTestSelect = (e) => {
    const selectedId = e.target.value;
    const selected   = reportTests.find((t) => t._id === selectedId);
    if (!selectedId) { setReportForm(blankReport); return; }
    setReportForm({
      ...blankReport,
      testId:      selectedId,
      patientId:   selected?.patientId?._id || selected?.patientId || "",
      patientName: selected?.patientName ||
        `${selected?.patientId?.firstname || ""} ${selected?.patientId?.lastname || ""}`.trim(),
      testName:    selected?.testName || "",
    });
    setReportMsg("");
  };

  const handleUploadReport = async () => {
    if (!reportForm.patientName.trim()) {
      setReportMsg("⚠️ Please enter patient name.");
      return;
    }
    if (!reportForm.result.trim()) {
      setReportMsg("⚠️ Please enter the test result.");
      return;
    }
    setUploading(true);
    setReportMsg("");
    try {
      if (reportForm.testId) {
        await axios.put(`${API}/labtest/report/${reportForm.testId}`, {
          report:  reportForm.result,
          remarks: reportForm.remarks,
        });
      } else {
        await axios.post(`${API}/labtest/tests`, {
          patientName: reportForm.patientName,
          testName:    reportForm.testName || "General Test",
          status:      "Completed",
          report:      reportForm.result,
          remarks:     reportForm.remarks,
        });
      }
      setReportMsg("✅ Report uploaded successfully!");
      setReportForm(blankReport);
      fetchReportTests();
      fetchDashboard();
    } catch (err) {
      setReportMsg("❌ Failed to upload report. " + (err.response?.data?.message || "Please try again."));
      console.error(err);
    }
    setUploading(false);
  };

  const msgStyle = (msg) => ({
    padding: "0.75rem 1rem",
    marginBottom: "1rem",
    borderRadius: "6px",
    background: msg.startsWith("✅") ? "#d1fae5" : "#fee2e2",
    color:      msg.startsWith("✅") ? "#065f46" : "#991b1b",
    fontSize:   "0.875rem",
  });

  return (
    <>
      <nav className="mc-nav">
        <div className="mc-nav-logo">
          <img src="/logo.png" alt="MedCare" />
          <h2>Med<span>Care</span></h2>
        </div>
        <ul className="mc-nav-links">
          <li><button onClick={() => setActivePage("home")}>Home</button></li>
          <li><button onClick={() => setActivePage("labprofile")}>Profile</button></li>
          <li><button onClick={() => setActivePage("labnotif")}>Notifications</button></li>
          <li><button className="mc-nav-logout" onClick={logout}>Logout</button></li>
        </ul>
      </nav>

      <div className="mc-layout">
        <aside className="mc-sidebar">
          <div className="mc-sidebar-label">Lab Panel</div>
          {SIDEBAR.map((s) => (
            <SidebarBtn key={s.page} {...s} activePage={activePage} setActivePage={setActivePage} />
          ))}
        </aside>

        <main className="mc-content">

          {/* ════ HOME ════ */}
          {activePage === "home" && (
            <div className="mc-welcome">
              <h2>🔬 Welcome, Lab Staff</h2>
              <p>Create test orders, upload reports and manage equipment from MedCare Laboratory.</p>
            </div>
          )}

          {/* ════ DASHBOARD ════ */}
          {activePage === "dashboard" && (
            <>
              <div className="mc-page-header">
                <h1>Lab Dashboard</h1>
                <p>Overview of all laboratory tests</p>
              </div>

              <div className="mc-cards" style={{ marginBottom: "1.5rem" }}>
                <div className="mc-card teal">
                  <div className="mc-card-icon">🧪</div>
                  <div className="mc-card-value">{dashLoading ? "…" : (dashStats?.totalTests ?? 0)}</div>
                  <div className="mc-card-label">Total Tests</div>
                </div>
                <div className="mc-card sky">
                  <div className="mc-card-icon">⏳</div>
                  <div className="mc-card-value">{dashLoading ? "…" : (dashStats?.pendingTests ?? 0)}</div>
                  <div className="mc-card-label">Pending</div>
                </div>
                <div className="mc-card purple">
                  <div className="mc-card-icon">✅</div>
                  <div className="mc-card-value">{dashLoading ? "…" : (dashStats?.completedTests ?? 0)}</div>
                  <div className="mc-card-label">Completed</div>
                </div>
                <div className="mc-card amber">
                  <div className="mc-card-icon">🚨</div>
                  <div className="mc-card-value">{dashLoading ? "…" : (dashStats?.emergencyTests ?? 0)}</div>
                  <div className="mc-card-label">Emergency</div>
                </div>
              </div>

              <div className="mc-panel">
                <div className="mc-panel-header"><h2>Recent Test Requests</h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Test Name</th>
                        <th>Priority</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashLoading
                        ? <EmptyState message="Loading…" />
                        : dashTests.length === 0
                          ? <EmptyState message="No test requests found. Create a test using the ➕ Create Test tab." />
                          : dashTests.map((t, i) => (
                            <tr key={t._id}>
                              <td>{i + 1}</td>
                              <td>{t.patientName || ((t.patientId?.firstname ?? "—") + " " + (t.patientId?.lastname ?? ""))}</td>
                              <td>{t.doctorId?.firstname ? `Dr. ${t.doctorId.firstname}` : "—"}</td>
                              <td>{t.testName}</td>
                              <td>{t.priority ?? "Normal"}</td>
                              <td><Badge status={t.status} /></td>
                              <td>
                                <button onClick={() => { setEditTestData({...t}); setEditTestMsg(""); setEditTestModal(true); }}
                                  style={{ background:"#ede9fe",color:"#7c3aed",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:"0.78rem" }}>
                                  ✏️ Edit
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

          {/* ════ CREATE TEST ════ */}
          {activePage === "create" && (
            <>
              <div className="mc-page-header">
                <h1>Create Lab Test</h1>
                <p>Add a new test request for a patient</p>
              </div>

              <div className="mc-panel">
                <div className="mc-panel-header"><h2>New Test Order</h2></div>
                <div className="mc-panel-body">
                  {createMsg && <div style={msgStyle(createMsg)}>{createMsg}</div>}

                  <div className="mc-form">
                    <div className="mc-form-row two-col">
                      <div className="mc-form-group">
                        <label>Patient Name <span style={{ color: "red" }}>*</span></label>
                        <input
                          className="mc-input"
                          type="text"
                          placeholder="Enter patient name"
                          value={createForm.patientName}
                          onChange={(e) => setCreateForm({ ...createForm, patientName: e.target.value })}
                        />
                      </div>
                      <div className="mc-form-group">
                        <label>Patient ID / Phone</label>
                        <input
                          className="mc-input"
                          type="text"
                          placeholder="Optional ID or phone"
                          value={createForm.patientId}
                          onChange={(e) => setCreateForm({ ...createForm, patientId: e.target.value })}
                        />
                      </div>
                    </div>

                    <div className="mc-form-group">
                      <label>Test Name <span style={{ color: "red" }}>*</span></label>
                      <input
                        className="mc-input"
                        type="text"
                        placeholder="e.g. Complete Blood Count, Urine Analysis…"
                        value={createForm.testName}
                        onChange={(e) => setCreateForm({ ...createForm, testName: e.target.value })}
                      />
                    </div>

                    <div className="mc-form-row two-col">
                      <div className="mc-form-group">
                        <label>Priority</label>
                        <select
                          className="mc-input"
                          value={createForm.priority}
                          onChange={(e) => setCreateForm({ ...createForm, priority: e.target.value })}
                        >
                          <option value="Normal">Normal</option>
                          <option value="Urgent">Urgent</option>
                          <option value="Critical">Critical</option>
                        </select>
                      </div>
                      <div className="mc-form-group" style={{ display: "flex", alignItems: "center", gap: 10, paddingTop: 22 }}>
                        <input
                          type="checkbox"
                          id="emergency"
                          checked={createForm.emergency}
                          onChange={(e) => setCreateForm({ ...createForm, emergency: e.target.checked })}
                        />
                        <label htmlFor="emergency" style={{ marginBottom: 0 }}>Mark as Emergency</label>
                      </div>
                    </div>

                    <button
                      className="mc-btn"
                      onClick={handleCreateTest}
                      disabled={creating}
                    >
                      {creating ? "Creating…" : "➕ Create Test Order"}
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ════ TEST REPORTS (Upload) ════ */}
          {activePage === "reports" && (
            <>
              <div className="mc-page-header">
                <h1>Upload Lab Report</h1>
                <p>Enter results for tests and mark them as completed</p>
              </div>

              <div className="mc-panel" style={{ marginBottom: "1.5rem" }}>
                <div className="mc-panel-header"><h2>Generate Report</h2></div>
                <div className="mc-panel-body">
                  {reportMsg && <div style={msgStyle(reportMsg)}>{reportMsg}</div>}

                  <div className="mc-form">
                    <div className="mc-form-group">
                      <label>Select Existing Test (optional)</label>
                      <select className="mc-input" value={reportForm.testId} onChange={handleTestSelect}>
                        <option value="">-- Select from existing tests or enter manually below --</option>
                        {reportTests.map((t) => (
                          <option key={t._id} value={t._id}>
                            {t.testName} — {t.patientName || (t.patientId?.firstname ?? "") + " " + (t.patientId?.lastname ?? "")} ({t.status})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mc-form-row two-col">
                      <div className="mc-form-group">
                        <label>Patient Name <span style={{ color: "red" }}>*</span></label>
                        <input className="mc-input" type="text" placeholder="Enter patient name"
                          value={reportForm.patientName}
                          onChange={(e) => setReportForm({ ...reportForm, patientName: e.target.value })} />
                      </div>
                      <div className="mc-form-group">
                        <label>Test Name <span style={{ color: "red" }}>*</span></label>
                        <input className="mc-input" type="text" placeholder="e.g. Blood Test, CBC"
                          value={reportForm.testName || ""}
                          onChange={(e) => setReportForm({ ...reportForm, testName: e.target.value })} />
                      </div>
                    </div>

                    <div className="mc-form-group">
                      <label>Test Result <span style={{ color: "red" }}>*</span></label>
                      <input
                        className="mc-input"
                        type="text"
                        placeholder="e.g. Hemoglobin: 13.5 g/dL — Normal"
                        value={reportForm.result}
                        onChange={(e) => setReportForm({ ...reportForm, result: e.target.value })}
                      />
                    </div>

                    <div className="mc-form-group">
                      <label>Remarks</label>
                      <textarea
                        className="mc-input mc-textarea"
                        rows={3}
                        placeholder="Additional remarks or notes…"
                        value={reportForm.remarks}
                        onChange={(e) => setReportForm({ ...reportForm, remarks: e.target.value })}
                      />
                    </div>

                    <button
                      className="mc-btn"
                      onClick={handleUploadReport}
                      disabled={uploading}
                    >
                      {uploading ? "Uploading…" : "📤 Upload Report"}
                    </button>
                  </div>
                </div>
              </div>

              <div className="mc-panel">
                <div className="mc-panel-header"><h2>Tests Awaiting Report ({reportTests.length})</h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Patient Name</th>
                        <th>Test Name</th>
                        <th>Priority</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportLoading
                        ? <EmptyState message="Loading…" />
                        : reportTests.length === 0
                          ? <EmptyState message="No tests awaiting report. All tests completed or none created yet." />
                          : reportTests.map((t, i) => (
                            <tr key={t._id}>
                              <td>{i + 1}</td>
                              <td>{t.patientId?.firstname ?? "—"} {t.patientId?.lastname ?? ""}</td>
                              <td>{t.testName}</td>
                              <td>{t.priority ?? "Normal"}</td>
                              <td><Badge status={t.status} /></td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ════ EQUIPMENT ════ */}
          {activePage === "equipment" && (
            <>
              <div className="mc-page-header">
                <h1>Equipment Status</h1>
                <p>Manage and track all lab equipment</p>
              </div>

              <div className="mc-panel" style={{ marginBottom: "1.5rem" }}>
                <div className="mc-panel-header"><h2>➕ Add Equipment</h2></div>
                <div className="mc-panel-body">
                  {equipMsg && (
                    <div style={{ padding: "0.6rem 1rem", marginBottom: "1rem", borderRadius: 6,
                      background: equipMsg.startsWith("✅") ? "#d1fae5" : "#fee2e2",
                      color: equipMsg.startsWith("✅") ? "#065f46" : "#991b1b", fontSize: "0.875rem" }}>
                      {equipMsg}
                    </div>
                  )}
                  <div className="mc-form">
                    <div className="mc-form-row two-col">
                      <div className="mc-form-group">
                        <label>Equipment Name <span style={{ color: "red" }}>*</span></label>
                        <input className="mc-input" type="text" placeholder="e.g. Hematology Analyzer"
                          value={equipForm.name}
                          onChange={(e) => setEquipForm({ ...equipForm, name: e.target.value })} />
                      </div>
                      <div className="mc-form-group">
                        <label>Status</label>
                        <select className="mc-input" value={equipForm.status}
                          onChange={(e) => setEquipForm({ ...equipForm, status: e.target.value })}>
                          <option value="Operational">Operational</option>
                          <option value="Maintenance">Maintenance</option>
                          <option value="Out of Service">Out of Service</option>
                        </select>
                      </div>
                    </div>
                    <div className="mc-form-group">
                      <label>Last Maintenance Date</label>
                      <input className="mc-input" type="date" value={equipForm.lastMaintenance}
                        onChange={(e) => setEquipForm({ ...equipForm, lastMaintenance: e.target.value })} />
                    </div>
                    <button className="mc-btn" onClick={async () => {
                      if (!equipForm.name.trim()) { setEquipMsg("⚠️ Equipment name is required."); return; }
                      try {
                        const res = await axios.post(`${API}/labtest/equipment`, equipForm);
                        const saved = res.data?.equipment || {};
                        setEquipment((prev) => [saved, ...prev]);
                        setEquipMsg("✅ Equipment saved to database!");
                        setEquipForm(blankEquip);
                        setTimeout(() => setEquipMsg(""), 3000);
                      } catch (err) {
                        setEquipMsg("❌ Failed to save: " + (err.response?.data?.message || err.message));
                      }
                    }}>
                      ➕ Add Equipment
                    </button>
                  </div>
                </div>
              </div>

              <div className="mc-panel">
                <div className="mc-panel-header"><h2>Equipment List ({equipment.length} items)</h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Equipment Name</th>
                        <th>Status</th>
                        <th>Last Maintenance</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {equipLoading
                        ? <EmptyState message="Loading…" />
                        : equipment.length === 0
                          ? <EmptyState message="No equipment records. Add one above." />
                          : equipment.map((eq, i) => (
                            <tr key={eq._id || i}>
                              <td>{i + 1}</td>
                              <td>{eq.name}</td>
                              <td><Badge status={eq.status} /></td>
                              <td>{eq.lastMaintenance ? new Date(eq.lastMaintenance).toLocaleDateString("en-IN") : "—"}</td>
                              <td>
                                <div style={{ display:"flex", gap:4 }}>
                                  <button onClick={() => { setEditEqData({...eq}); setEditEqMsg(""); setEditEqModal(true); }}
                                    style={{ background:"#ede9fe",color:"#7c3aed",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:"0.78rem" }}>
                                    ✏️ Edit
                                  </button>
                                  <button onClick={async () => {
                                    if (!window.confirm("Remove this equipment?")) return;
                                    try {
                                      await axios.delete(`${API}/labtest/equipment/${eq._id}`);
                                      setEquipment((prev) => prev.filter(e => e._id !== eq._id));
                                    } catch (err) {
                                      alert("Delete failed: " + (err.response?.data?.message || err.message));
                                    }
                                  }} style={{ background:"#fee2e2",color:"#991b1b",border:"none",borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:"0.78rem" }}>
                                    🗑️ Remove
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ════ PROFILE ════ */}
          {activePage === "labprofile" && (
            <>
              <div className="mc-page-header">
                <h1>My Profile</h1>
                <p>Your lab staff account details</p>
              </div>
              <div className="mc-panel">
                <div className="mc-panel-body">
                  <div style={{ background: "#f0fdf4", padding: "1.5rem", borderRadius: 12 }}>
                    <div style={{ fontSize: "3rem", textAlign: "center", marginBottom: "0.5rem" }}>🔬</div>
                    <h2 style={{ textAlign: "center", margin: 0 }}>{labStaff.firstname || "Lab"} {labStaff.lastname || "Staff"}</h2>
                    <p style={{ textAlign: "center", color: "#666", margin: "0.3rem 0 1rem" }}>{labStaff.email || "—"}</p>
                    <div style={{ background: "#fff", padding: "1rem", borderRadius: 8 }}>
                      <p style={{ margin: "0 0 4px", fontWeight: 600 }}>Role: <span style={{ color: "#059669" }}>{labStaff.role || "labstaff"}</span></p>
                      <p style={{ margin: 0, color: "#666", fontSize: "0.85rem" }}>MedCare Hospital Laboratory Department</p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* ════ NOTIFICATIONS ════ */}
          {activePage === "labnotif" && (
            <>
              <div className="mc-page-header">
                <h1>Notifications</h1>
                <p>Lab department alerts and updates</p>
              </div>
              <div className="mc-panel">
                <div className="mc-panel-body">
                  {[
                    { icon: "🧪", msg: "Lab test orders are available in the Dashboard." },
                    { icon: "➕", msg: "You can create new test orders from the Create Test tab." },
                    { icon: "📤", msg: "Upload results for pending tests from the Upload Report tab." },
                    { icon: "🔧", msg: "Check equipment status and add new equipment in the Equipment tab." },
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

      {/* ══ EDIT EQUIPMENT MODAL ══ */}
      {editEqModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ background:"#fff",borderRadius:12,padding:"2rem",width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem" }}>
              <h3 style={{ margin:0,color:"#7c3aed" }}>✏️ Edit Equipment</h3>
              <button onClick={() => setEditEqModal(false)} style={{ background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer" }}>✕</button>
            </div>
            {editEqMsg && <div style={{ padding:"0.5rem 0.8rem",borderRadius:6,marginBottom:"0.8rem",background:editEqMsg.startsWith("✅")?"#d1fae5":"#fee2e2",color:editEqMsg.startsWith("✅")?"#065f46":"#991b1b",fontSize:"0.85rem" }}>{editEqMsg}</div>}
            <div style={{ marginBottom:"0.8rem" }}><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Equipment Name</label>
              <input className="mc-input" value={editEqData.name||""} onChange={e => setEditEqData({...editEqData,name:e.target.value})} /></div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.8rem",marginBottom:"0.8rem" }}>
              <div><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Status</label>
                <select className="mc-input" value={editEqData.status||"Operational"} onChange={e => setEditEqData({...editEqData,status:e.target.value})}>
                  <option>Operational</option><option>Maintenance</option><option>Out of Service</option>
                </select></div>
              <div><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Last Maintenance</label>
                <input className="mc-input" type="date" value={editEqData.lastMaintenance||""} onChange={e => setEditEqData({...editEqData,lastMaintenance:e.target.value})} /></div>
            </div>
            <div style={{ display:"flex",gap:"0.75rem" }}>
              <button className="mc-btn" style={{ flex:1 }} onClick={handleEditEq}>💾 Save</button>
              <button onClick={() => setEditEqModal(false)} style={{ flex:1,padding:"0.6rem",border:"1px solid #d1d5db",borderRadius:8,background:"#f9fafb",cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* ══ EDIT TEST MODAL ══ */}
      {editTestModal && (
        <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center" }}>
          <div style={{ background:"#fff",borderRadius:12,padding:"2rem",width:"100%",maxWidth:420,boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
            <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem" }}>
              <h3 style={{ margin:0,color:"#7c3aed" }}>✏️ Edit Test</h3>
              <button onClick={() => setEditTestModal(false)} style={{ background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer" }}>✕</button>
            </div>
            {editTestMsg && <div style={{ padding:"0.5rem 0.8rem",borderRadius:6,marginBottom:"0.8rem",background:editTestMsg.startsWith("✅")?"#d1fae5":"#fee2e2",color:editTestMsg.startsWith("✅")?"#065f46":"#991b1b",fontSize:"0.85rem" }}>{editTestMsg}</div>}
            <div style={{ marginBottom:"0.8rem" }}><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Patient Name</label>
              <input className="mc-input" value={editTestData.patientName||""} onChange={e => setEditTestData({...editTestData,patientName:e.target.value})} /></div>
            <div style={{ marginBottom:"0.8rem" }}><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Test Name</label>
              <input className="mc-input" value={editTestData.testName||""} onChange={e => setEditTestData({...editTestData,testName:e.target.value})} /></div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.8rem",marginBottom:"0.8rem" }}>
              <div><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Priority</label>
                <select className="mc-input" value={editTestData.priority||"Normal"} onChange={e => setEditTestData({...editTestData,priority:e.target.value})}>
                  <option>Normal</option><option>Urgent</option><option>Critical</option>
                </select></div>
              <div><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Status</label>
                <select className="mc-input" value={editTestData.status||"Pending"} onChange={e => setEditTestData({...editTestData,status:e.target.value})}>
                  <option>Pending</option><option>Completed</option>
                </select></div>
            </div>
            <div style={{ display:"flex",gap:"0.75rem" }}>
              <button className="mc-btn" style={{ flex:1 }} onClick={handleEditTest}>💾 Save</button>
              <button onClick={() => setEditTestModal(false)} style={{ flex:1,padding:"0.6rem",border:"1px solid #d1d5db",borderRadius:8,background:"#f9fafb",cursor:"pointer" }}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default LabStaff;
