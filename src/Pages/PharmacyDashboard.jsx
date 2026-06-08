import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
import axios from "axios";

const API = "https://medcare-hms-backend.onrender.com/api";

// ─────────────────────────────────────────
//  SHARED HELPERS
// ─────────────────────────────────────────
function Badge({ status }) {
  if (!status) return <span className="mc-badge">—</span>;
  const s = status.toLowerCase().replace(/\s/g, "");
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

function LoadingRow({ cols }) {
  return (
    <tr>
      <td colSpan={cols} style={{ textAlign: "center", color: "var(--text-secondary)", padding: "24px" }}>
        Loading...
      </td>
    </tr>
  );
}

function EmptyRow({ cols, message = "No records found" }) {
  return (
    <tr>
      <td colSpan={cols} style={{ textAlign: "center", color: "var(--text-secondary)", padding: "24px" }}>
        {message}
      </td>
    </tr>
  );
}

// Inline feedback message
function Msg({ text }) {
  if (!text) return null;
  const isError = text.startsWith("❌");
  const isWarn  = text.startsWith("⚠️");
  return (
    <p style={{
      margin: "0 0 14px",
      fontWeight: 500,
      color: isError ? "var(--rose, #f43f5e)" : isWarn ? "var(--amber, #f59e0b)" : "var(--teal, #14b8a6)",
    }}>
      {text}
    </p>
  );
}

// ─────────────────────────────────────────
//  CUSTOM FETCH HOOK
//  Normalises all backend shapes:
//   { medicines:[…] } | { prescriptions:[…] } |
//   { bills:[…] } | { suppliers:[…] } | { data:[…] } | [...]
// ─────────────────────────────────────────
function useFetch(url, defaultVal = []) {
  const [data, setData]       = useState(defaultVal);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
    axios.get(url)
      .then((res) => {
        const r = res.data;
        const payload =
          r?.medicines ??
          r?.prescriptions ??
          r?.bills ??
          r?.suppliers ??
          r?.data ??
          r;
        setData(Array.isArray(payload) ? payload : defaultVal);
      })
      .catch((err) => {
        console.error(`[useFetch] ${url}:`, err.message);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [url]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { refetch(); }, [refetch]);
  return { data, loading, error, refetch };
}

// ─────────────────────────────────────────
//  ADD-BOX (collapsible form panel)
// ─────────────────────────────────────────
function AddBox({ title, children, open, onToggle }) {
  return (
    <div className="mc-panel" style={{ marginBottom: 20 }}>
      <div
        className="mc-panel-header"
        style={{ cursor: "pointer", userSelect: "none" }}
        onClick={onToggle}
      >
        <h2 style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span>{open ? "▾" : "▸"}</span> {title}
        </h2>
      </div>
      {open && <div className="mc-panel-body">{children}</div>}
    </div>
  );
}

// ─────────────────────────────────────────
//  MAIN COMPONENT
// ─────────────────────────────────────────
function PharmacyDashboard() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("dashboard");

  // ── Data (correct API endpoints matching backend routes) ──
  // GET /api/pharmacy/medicines
  const { data: medicines,     loading: medLoading,   refetch: refetchMeds }  = useFetch(`${API}/pharmacy/medicines`);
  // GET /api/pharmacy/prescriptions
  const { data: prescriptions, loading: rxLoading,    refetch: refetchRx }    = useFetch(`${API}/pharmacy/prescriptions`);
  // GET /api/pharmacy/bills
  const { data: bills,         loading: billLoading,  refetch: refetchBills } = useFetch(`${API}/pharmacy/bills`);
  // GET /api/pharmacy/suppliers
  const { data: suppliers,     loading: supLoading,   refetch: refetchSup }   = useFetch(`${API}/pharmacy/suppliers`);

  const lowStockItems = medicines.filter((m) => (m.quantity ?? 0) < 20);

  // ── Open/close state for add-boxes ──
  const [openBox, setOpenBox] = useState(null);
  const toggleBox = (name) => setOpenBox((prev) => (prev === name ? null : name));

  // ─────────────────────────────────────────
  //  FORM STATES
  // ─────────────────────────────────────────

  // Dispense form
  const [dispenseForm, setDispenseForm]       = useState({ patientId: "", medicineName: "", quantity: "" });
  const [dispenseLoading, setDispenseLoading] = useState(false);
  const [dispenseMsg, setDispenseMsg]         = useState("");

  // Add medicine form
  const EMPTY_MED = { medicineName: "", category: "", quantity: "", price: "", supplier: "", expiryDate: "", batchNumber: "" };
  const [medForm, setMedForm]     = useState(EMPTY_MED);
  const [medMsg, setMedMsg]       = useState("");
  const [medSaving, setMedSaving] = useState(false);

  // Add supplier form
  const EMPTY_SUP = { name: "", email: "", phone: "", address: "", gstNumber: "" };
  const [supForm, setSupForm]     = useState(EMPTY_SUP);
  const [supMsg, setSupMsg]       = useState("");
  const [supSaving, setSupSaving] = useState(false);

  // Add bill form
  const EMPTY_BILL = { patientName: "", medicine: "", quantity: "", unitPrice: "", paymentMethod: "Cash" };
  const [billForm, setBillForm]     = useState(EMPTY_BILL);
  const [billMsg, setBillMsg]       = useState("");
  const [billSaving, setBillSaving] = useState(false);

  /* ── Edit modal states ── */
  const [editMedModal,  setEditMedModal]  = useState(false);
  const [editMedData,   setEditMedData]   = useState({});
  const [editMedMsg,    setEditMedMsg]    = useState("");

  const [editSupModal,  setEditSupModal]  = useState(false);
  const [editSupData,   setEditSupData]   = useState({});
  const [editSupMsg,    setEditSupMsg]    = useState("");

  const [editBillModal,  setEditBillModal]  = useState(false);
  const [editBillData,   setEditBillData]   = useState({});
  const [editBillMsg,    setEditBillMsg]    = useState("");

  // Add prescription form
  const EMPTY_RX = { patientName: "", doctorName: "", medicine: "", quantity: "", dosage: "", instructions: "" };
  const [rxForm, setRxForm]     = useState(EMPTY_RX);
  const [rxMsg, setRxMsg]       = useState("");
  const [rxSaving, setRxSaving] = useState(false);

  // Settings form
  const [settings, setSettings]   = useState({ deptName: "Pharmacy", email: "pharmacy@medcare.com", phone: "", address: "", lowStockThreshold: 20 });
  const [settingsMsg, setSettingsMsg] = useState("");

  const handleLogout = () => navigate("/");

  // ─────────────────────────────────────────
  //  HANDLERS
  // ─────────────────────────────────────────

  // Dispense — POST /api/pharmacy/medicines/dispense
  const handleDispenseChange = (e) =>
    setDispenseForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleDispenseSubmit = async () => {
    const { patientId, medicineName, quantity } = dispenseForm;
    if (!patientId || !medicineName || !quantity) {
      setDispenseMsg("⚠️ Please fill in all fields.");
      return;
    }
    setDispenseLoading(true);
    setDispenseMsg("");
    try {
      // POST /api/pharmacy/medicines/dispense
      await axios.post(`${API}/pharmacy/medicines/dispense`, {
        patientId,
        medicineName,
        quantity: Number(quantity),
      });
      setDispenseMsg("✅ Medicine dispensed successfully.");
      setDispenseForm({ patientId: "", medicineName: "", quantity: "" });
      refetchMeds();
    } catch (err) {
      setDispenseMsg(`❌ ${err.response?.data?.message || err.message}`);
    } finally {
      setDispenseLoading(false);
    }
  };

  // Add medicine — POST /api/pharmacy/medicines
  const handleMedChange = (e) =>
    setMedForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleMedSubmit = async () => {
    if (!medForm.medicineName || medForm.quantity === "") {
      setMedMsg("⚠️ Medicine name and quantity are required.");
      return;
    }
    setMedSaving(true);
    setMedMsg("");
    try {
      // POST /api/pharmacy/medicines
      await axios.post(`${API}/pharmacy/medicines`, {
        ...medForm,
        quantity: Number(medForm.quantity),
        price: Number(medForm.price) || 0,
      });
      setMedMsg("✅ Medicine added to inventory.");
      setMedForm(EMPTY_MED);
      refetchMeds();
      setOpenBox(null);
    } catch (err) {
      setMedMsg(`❌ ${err.response?.data?.message || err.message}`);
    } finally {
      setMedSaving(false);
    }
  };

  // Add supplier — POST /api/pharmacy/suppliers
  const handleSupChange = (e) =>
    setSupForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleSupSubmit = async () => {
    if (!supForm.name) {
      setSupMsg("⚠️ Supplier name is required.");
      return;
    }
    setSupSaving(true);
    setSupMsg("");
    try {
      // POST /api/pharmacy/suppliers
      await axios.post(`${API}/pharmacy/suppliers`, supForm);
      setSupMsg("✅ Supplier added.");
      setSupForm(EMPTY_SUP);
      refetchSup();
      setOpenBox(null);
    } catch (err) {
      setSupMsg(`❌ ${err.response?.data?.message || err.message}`);
    } finally {
      setSupSaving(false);
    }
  };

  // Add bill — POST /api/pharmacy/bills
  const handleBillChange = (e) =>
    setBillForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleBillSubmit = async () => {
    if (!billForm.patientName || !billForm.medicine || !billForm.quantity || !billForm.unitPrice) {
      setBillMsg("⚠️ All fields are required.");
      return;
    }
    setBillSaving(true);
    setBillMsg("");
    try {
      const qty   = Number(billForm.quantity);
      const price = Number(billForm.unitPrice);
      const total = qty * price;
      // POST /api/pharmacy/bills
      await axios.post(`${API}/pharmacy/bills`, {
        patientName: billForm.patientName,
        medicines: [{ name: billForm.medicine, quantity: qty, unitPrice: price }],
        totalAmount: total,
        paid: total,                      // assume full payment at counter
        paymentMethod: billForm.paymentMethod,
      });
      setBillMsg("✅ Bill created.");
      setBillForm(EMPTY_BILL);
      refetchBills();
      setOpenBox(null);
    } catch (err) {
      setBillMsg(`❌ ${err.response?.data?.message || err.message}`);
    } finally {
      setBillSaving(false);
    }
  };

  // Add prescription — POST /api/pharmacy/prescriptions
  const handleRxChange = (e) =>
    setRxForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const handleRxSubmit = async () => {
    if (!rxForm.patientName || !rxForm.medicine || !rxForm.quantity) {
      setRxMsg("⚠️ Patient, medicine and quantity are required.");
      return;
    }
    setRxSaving(true);
    setRxMsg("");
    try {
      // POST /api/pharmacy/prescriptions
      await axios.post(`${API}/pharmacy/prescriptions`, {
        ...rxForm,
        quantity: Number(rxForm.quantity),
      });
      setRxMsg("✅ Prescription added.");
      setRxForm(EMPTY_RX);
      refetchRx();
      setOpenBox(null);
    } catch (err) {
      setRxMsg(`❌ ${err.response?.data?.message || err.message}`);
    } finally {
      setRxSaving(false);
    }
  };

  // Dispense a prescription — PUT /api/pharmacy/prescriptions/:id/dispense
  const handleDispenseRx = async (id) => {
    try {
      await axios.put(`${API}/pharmacy/prescriptions/${id}/dispense`);
      refetchRx();
      refetchMeds();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to dispense");
    }
  };

  // Delete medicine — DELETE /api/pharmacy/medicines/:id
  const handleDeleteMed = async (id) => {
    if (!window.confirm("Delete this medicine?")) return;
    try {
      await axios.delete(`${API}/pharmacy/medicines/${id}`);
      refetchMeds();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  // Delete supplier — DELETE /api/pharmacy/suppliers/:id
  const handleDeleteSup = async (id) => {
    if (!window.confirm("Remove this supplier?")) return;
    try {
      await axios.delete(`${API}/pharmacy/suppliers/${id}`);
      refetchSup();
    } catch (err) {
      alert(err.response?.data?.message || "Delete failed");
    }
  };

  const sidebar = [
    { page: "dashboard",    label: "Dashboard",            icon: "📊" },
    { page: "prescription", label: "Prescription Requests", icon: "📝" },
    { page: "dispense",     label: "Dispense Medicines",    icon: "💊" },
    { page: "inventory",    label: "Inventory",             icon: "📦" },
    { page: "lowstock",     label: "Low Stock Alerts",      icon: "⚠️" },
    { page: "suppliers",    label: "Suppliers",             icon: "🏭" },
    { page: "billing",      label: "Billing Support",       icon: "💳" },
    { page: "settings",     label: "Settings",              icon: "⚙️" },
  ];

  // ─────────────────────────────────────────
  //  RENDER
  // ─────────────────────────────────────────
  return (
    <>
      <nav className="mc-nav">
        <div className="mc-nav-logo">
          <img src="/logo.png" alt="MedCare" />
          <h2>Med<span>Care</span></h2>
        </div>
        <ul className="mc-nav-links">
          <li><button onClick={() => setActivePage("dashboard")}>Home</button></li>
          <li><button onClick={() => setActivePage("profile")}>Profile</button></li>
          <li><button onClick={() => setActivePage("notifications")}>Notifications</button></li>
          <li><button className="mc-nav-logout" onClick={handleLogout}>Logout</button></li>
        </ul>
      </nav>

      <div className="mc-layout">
        <aside className="mc-sidebar">
          <div className="mc-sidebar-label">Pharmacy Panel</div>
          {sidebar.map((s) => (
            <SidebarBtn key={s.page} {...s} activePage={activePage} setActivePage={setActivePage} />
          ))}
        </aside>

        <main className="mc-content">

          {/* ══ PROFILE ══ */}
          {activePage === "profile" && (
            <>
              <div className="mc-page-header"><h1>Pharmacy Staff Profile</h1></div>
              <div className="mc-profile-card">
                <div className="mc-profile-top">
                  <div className="mc-profile-avatar">P</div>
                  <div className="mc-profile-name">Pharmacy Staff</div>
                  <div className="mc-profile-role">Pharmacy Department</div>
                </div>
                <div className="mc-profile-body">
                  <div className="mc-profile-field"><label>Email</label><span>pharmacy@medcare.com</span></div>
                  <div className="mc-profile-field"><label>Department</label><span>Pharmacy</span></div>
                </div>
              </div>
            </>
          )}

          {/* ══ NOTIFICATIONS ══ */}
          {activePage === "notifications" && (
            <>
              <div className="mc-page-header"><h1>Notifications</h1></div>
              <div className="mc-panel"><div className="mc-panel-body">
                <div className="mc-notif-list">
                  {[
                    ["New prescription received.", "Just now"],
                    ["Medicine stock updated.", "1 hour ago"],
                    ["Low stock alert generated.", "Today"],
                  ].map(([m, t], i) => (
                    <div className="mc-notif-item" key={i}>
                      <div className="mc-notif-dot" />
                      <div><p>{m}</p><time>{t}</time></div>
                    </div>
                  ))}
                </div>
              </div></div>
            </>
          )}

          {/* ══ DASHBOARD ══ */}
          {activePage === "dashboard" && (
            <>
              <div className="mc-page-header">
                <h1>Pharmacy Dashboard</h1>
                <p>Medicine and prescription overview</p>
              </div>
              <div className="mc-cards">
                <div className="mc-card teal">
                  <div className="mc-card-icon">📝</div>
                  <div className="mc-card-value">{rxLoading ? "…" : prescriptions.length}</div>
                  <div className="mc-card-label">Total Prescriptions</div>
                  <div className="mc-card-sub up">↑ Today</div>
                </div>
                <div className="mc-card green">
                  <div className="mc-card-icon">💊</div>
                  <div className="mc-card-value">{medLoading ? "…" : medicines.length}</div>
                  <div className="mc-card-label">Medicines in System</div>
                  <div className="mc-card-sub up">↑ Updated</div>
                </div>
                <div className="mc-card sky">
                  <div className="mc-card-icon">📦</div>
                  <div className="mc-card-value">
                    {medLoading ? "…" : medicines.reduce((s, m) => s + (m.quantity ?? 0), 0)}
                  </div>
                  <div className="mc-card-label">Total Units in Stock</div>
                  <div className="mc-card-sub">In stock</div>
                </div>
                <div className="mc-card rose">
                  <div className="mc-card-icon">⚠️</div>
                  <div className="mc-card-value">{medLoading ? "…" : lowStockItems.length}</div>
                  <div className="mc-card-label">Low Stock Items</div>
                  <div className="mc-card-sub down">Reorder needed</div>
                </div>
              </div>

              {/* Recent Prescriptions */}
              <div className="mc-panel">
                <div className="mc-panel-header">
                  <h2>Recent Prescriptions <span>Latest 8</span></h2>
                </div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead>
                      <tr><th>ID</th><th>Patient</th><th>Doctor</th><th>Medicine</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {rxLoading ? <LoadingRow cols={5} /> :
                       prescriptions.length === 0 ? <EmptyRow cols={5} message="No prescriptions" /> :
                       prescriptions.slice(0, 8).map((p, i) => (
                         <tr key={p._id || i}>
                           <td>{p._id ? `#${String(p._id).slice(-5).toUpperCase()}` : `#${i + 1}`}</td>
                           <td>{p.patientName || "—"}</td>
                           <td>{p.doctorName || "—"}</td>
                           <td>{p.medicine || p.medicineName || "—"}</td>
                           <td><Badge status={p.status} /></td>
                         </tr>
                       ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Recent Bills */}
              <div className="mc-panel">
                <div className="mc-panel-header">
                  <h2>Recent Bills <span>{bills.length} records</span></h2>
                </div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead>
                      <tr><th>#</th><th>Patient</th><th>Amount (₹)</th><th>Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {billLoading ? <LoadingRow cols={5} /> :
                       bills.length === 0 ? <EmptyRow cols={5} message="No bills" /> :
                       bills.slice(0, 5).map((b, i) => (
                         <tr key={b._id || i}>
                           <td>{i + 1}</td>
                           <td>{b.patientName || "—"}</td>
                           <td>₹{(b.totalAmount ?? 0).toLocaleString("en-IN")}</td>
                           <td>{b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                           <td><Badge status={b.status} /></td>
                         </tr>
                       ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ PRESCRIPTION REQUESTS ══ */}
          {activePage === "prescription" && (
            <>
              <div className="mc-page-header">
                <h1>Prescription Requests</h1>
                <p>View, add, and dispense prescriptions</p>
              </div>

              {/* ADD NEW PRESCRIPTION BOX */}
              <AddBox
                title="➕ Add New Prescription"
                open={openBox === "rx"}
                onToggle={() => toggleBox("rx")}
              >
                <div className="mc-form">
                  <div className="mc-form-row">
                    <div className="mc-form-group">
                      <label>Patient Name *</label>
                      <input name="patientName" placeholder="Patient name" value={rxForm.patientName} onChange={handleRxChange} />
                    </div>
                    <div className="mc-form-group">
                      <label>Doctor Name</label>
                      <input name="doctorName" placeholder="Prescribing doctor" value={rxForm.doctorName} onChange={handleRxChange} />
                    </div>
                  </div>
                  <div className="mc-form-row">
                    <div className="mc-form-group">
                      <label>Medicine *</label>
                      <input name="medicine" placeholder="e.g. Paracetamol" value={rxForm.medicine} onChange={handleRxChange} />
                    </div>
                    <div className="mc-form-group">
                      <label>Quantity *</label>
                      <input name="quantity" type="number" min="1" placeholder="Units" value={rxForm.quantity} onChange={handleRxChange} />
                    </div>
                  </div>
                  <div className="mc-form-row">
                    <div className="mc-form-group">
                      <label>Dosage</label>
                      <input name="dosage" placeholder="e.g. 500mg twice daily" value={rxForm.dosage} onChange={handleRxChange} />
                    </div>
                    <div className="mc-form-group">
                      <label>Instructions</label>
                      <input name="instructions" placeholder="e.g. After food" value={rxForm.instructions} onChange={handleRxChange} />
                    </div>
                  </div>
                  <Msg text={rxMsg} />
                  <button className="mc-btn" onClick={handleRxSubmit} disabled={rxSaving}>
                    {rxSaving ? "Saving..." : "📝 Add Prescription"}
                  </button>
                </div>
              </AddBox>

              {/* PRESCRIPTION TABLE */}
              <div className="mc-panel">
                <div className="mc-panel-header">
                  <h2>All Prescriptions <span>{prescriptions.length} records</span></h2>
                </div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead>
                      <tr><th>#</th><th>ID</th><th>Patient</th><th>Doctor</th><th>Medicine</th><th>Qty</th><th>Dosage</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {rxLoading ? <LoadingRow cols={9} /> :
                       prescriptions.length === 0 ? <EmptyRow cols={9} message="No prescriptions found" /> :
                       prescriptions.map((p, i) => (
                         <tr key={p._id || i}>
                           <td>{i + 1}</td>
                           <td>{p._id ? `#${String(p._id).slice(-5).toUpperCase()}` : "—"}</td>
                           <td>{p.patientName || "—"}</td>
                           <td>{p.doctorName || "—"}</td>
                           <td>{p.medicine || p.medicineName || "—"}</td>
                           <td>{p.quantity ?? "—"}</td>
                           <td>{p.dosage || "—"}</td>
                           <td><Badge status={p.status} /></td>
                           <td>
                             {p.status === "Pending" ? (
                               <button
                                 className="mc-btn"
                                 style={{ padding: "4px 10px", fontSize: 12 }}
                                 // PUT /api/pharmacy/prescriptions/:id/dispense
                                 onClick={() => handleDispenseRx(p._id)}
                               >
                                 Dispense
                               </button>
                             ) : (
                               <span style={{ color: "var(--text-secondary)", fontSize: 12 }}>
                                 {p.status === "Dispensed" ? "✅ Done" : p.status}
                               </span>
                             )}
                           </td>
                         </tr>
                       ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ DISPENSE ══ */}
          {activePage === "dispense" && (
            <>
              <div className="mc-page-header"><h1>Issue Medicine</h1><p>Dispense medicine directly by name — deducts from inventory</p></div>
              <div className="mc-panel"><div className="mc-panel-body">
                <div className="mc-form">
                  <div className="mc-form-row">
                    <div className="mc-form-group">
                      <label>Patient ID</label>
                      <input type="text" name="patientId" placeholder="Patient ID" value={dispenseForm.patientId} onChange={handleDispenseChange} />
                    </div>
                    <div className="mc-form-group">
                      <label>Medicine Name</label>
                      <input type="text" name="medicineName" placeholder="e.g. Paracetamol" value={dispenseForm.medicineName} onChange={handleDispenseChange} />
                    </div>
                  </div>
                  <div className="mc-form-group">
                    <label>Quantity</label>
                    <input type="number" name="quantity" placeholder="Number of units" min="1" value={dispenseForm.quantity} onChange={handleDispenseChange} />
                  </div>
                  <Msg text={dispenseMsg} />
                  <button className="mc-btn" onClick={handleDispenseSubmit} disabled={dispenseLoading}>
                    {dispenseLoading ? "Dispensing..." : "💊 Issue Medicine"}
                  </button>
                </div>
              </div></div>

              {/* Show current stock for quick reference */}
              <div className="mc-panel">
                <div className="mc-panel-header"><h2>Quick Stock Reference</h2></div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead><tr><th>Medicine</th><th>Available Qty</th><th>Status</th></tr></thead>
                    <tbody>
                      {medLoading ? <LoadingRow cols={3} /> :
                       medicines.length === 0 ? <EmptyRow cols={3} message="No medicines in inventory" /> :
                       medicines.map((m, i) => (
                         <tr key={m._id || i}>
                           <td>{m.medicineName || "—"}</td>
                           <td>{m.quantity ?? 0}</td>
                           <td><Badge status={(m.quantity ?? 0) < 20 ? "Low Stock" : "In Stock"} /></td>
                         </tr>
                       ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ INVENTORY ══ */}
          {activePage === "inventory" && (
            <>
              <div className="mc-page-header"><h1>Inventory</h1><p>All medicines in stock — add new entries below</p></div>

              {/* Summary cards */}
              <div className="mc-cards">
                <div className="mc-card sky">
                  <div className="mc-card-icon">📦</div>
                  <div className="mc-card-value">{medLoading ? "…" : medicines.length}</div>
                  <div className="mc-card-label">Total Medicine Types</div>
                </div>
                <div className="mc-card green">
                  <div className="mc-card-icon">📊</div>
                  <div className="mc-card-value">
                    {medLoading ? "…" : medicines.reduce((s, m) => s + (m.quantity ?? 0), 0)}
                  </div>
                  <div className="mc-card-label">Total Units Available</div>
                </div>
                <div className="mc-card rose">
                  <div className="mc-card-icon">⚠️</div>
                  <div className="mc-card-value">{medLoading ? "…" : lowStockItems.length}</div>
                  <div className="mc-card-label">Low Stock Items</div>
                </div>
              </div>

              {/* ADD MEDICINE BOX */}
              <AddBox
                title="➕ Add Medicine to Inventory"
                open={openBox === "med"}
                onToggle={() => toggleBox("med")}
              >
                <div className="mc-form">
                  <div className="mc-form-row">
                    <div className="mc-form-group">
                      <label>Medicine Name *</label>
                      <input name="medicineName" placeholder="e.g. Paracetamol" value={medForm.medicineName} onChange={handleMedChange} />
                    </div>
                    <div className="mc-form-group">
                      <label>Category</label>
                      <input name="category" placeholder="e.g. Analgesic" value={medForm.category} onChange={handleMedChange} />
                    </div>
                  </div>
                  <div className="mc-form-row">
                    <div className="mc-form-group">
                      <label>Quantity *</label>
                      <input name="quantity" type="number" min="0" placeholder="Units" value={medForm.quantity} onChange={handleMedChange} />
                    </div>
                    <div className="mc-form-group">
                      <label>Price per Unit (₹)</label>
                      <input name="price" type="number" min="0" placeholder="0.00" value={medForm.price} onChange={handleMedChange} />
                    </div>
                  </div>
                  <div className="mc-form-row">
                    <div className="mc-form-group">
                      <label>Supplier</label>
                      <input name="supplier" placeholder="Supplier name" value={medForm.supplier} onChange={handleMedChange} />
                    </div>
                    <div className="mc-form-group">
                      <label>Expiry Date</label>
                      <input name="expiryDate" type="date" value={medForm.expiryDate} onChange={handleMedChange} />
                    </div>
                  </div>
                  <div className="mc-form-group">
                    <label>Batch Number</label>
                    <input name="batchNumber" placeholder="Batch / lot number" value={medForm.batchNumber} onChange={handleMedChange} />
                  </div>
                  <Msg text={medMsg} />
                  <button className="mc-btn" onClick={handleMedSubmit} disabled={medSaving}>
                    {medSaving ? "Saving..." : "📦 Add to Inventory"}
                  </button>
                </div>
              </AddBox>

              {/* MEDICINE TABLE */}
              <div className="mc-panel">
                <div className="mc-panel-header">
                  <h2>Medicine Stock <span>{medicines.length} items</span></h2>
                </div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead>
                      <tr><th>#</th><th>Medicine</th><th>Category</th><th>Qty</th><th>Price (₹)</th><th>Supplier</th><th>Expiry</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {medLoading ? <LoadingRow cols={9} /> :
                       medicines.length === 0 ? <EmptyRow cols={9} message="No medicines found" /> :
                       medicines.map((m, i) => (
                         <tr key={m._id || i}>
                           <td>{i + 1}</td>
                           <td>{m.medicineName || "—"}</td>
                           <td>{m.category || "—"}</td>
                           <td>{m.quantity ?? 0}</td>
                           <td>{m.price ? `₹${m.price}` : "—"}</td>
                           <td>{m.supplier || "—"}</td>
                           <td>{m.expiryDate ? new Date(m.expiryDate).toLocaleDateString("en-IN") : "—"}</td>
                           <td><Badge status={(m.quantity ?? 0) < 20 ? "Low Stock" : "In Stock"} /></td>
                           <td>
                             <div style={{ display:"flex", gap:4 }}>
                               <button
                                 className="mc-btn"
                                 style={{ padding: "4px 10px", fontSize: 12, background: "#7c3aed" }}
                                 onClick={() => { setEditMedData({...m}); setEditMedMsg(""); setEditMedModal(true); }}
                               >✏️ Edit</button>
                               <button
                                 className="mc-btn"
                                 style={{ padding: "4px 10px", fontSize: 12, background: "var(--rose, #f43f5e)" }}
                                 onClick={() => handleDeleteMed(m._id)}
                               >Remove</button>
                             </div>
                           </td>
                         </tr>
                       ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ LOW STOCK ALERTS ══ */}
          {activePage === "lowstock" && (
            <>
              <div className="mc-page-header">
                <h1>Low Stock Alerts</h1>
                <p>Items with fewer than 20 units — reorder required</p>
              </div>

              {/* Summary */}
              <div className="mc-cards">
                <div className="mc-card rose">
                  <div className="mc-card-icon">🚨</div>
                  <div className="mc-card-value">{medLoading ? "…" : medicines.filter(m => (m.quantity ?? 0) < 10).length}</div>
                  <div className="mc-card-label">Critical (under 10)</div>
                  <div className="mc-card-sub down">Urgent reorder</div>
                </div>
                <div className="mc-card amber">
                  <div className="mc-card-icon">⚠️</div>
                  <div className="mc-card-value">{medLoading ? "…" : medicines.filter(m => (m.quantity ?? 0) >= 10 && (m.quantity ?? 0) < 20).length}</div>
                  <div className="mc-card-label">Warning (10–19)</div>
                  <div className="mc-card-sub">Reorder soon</div>
                </div>
                <div className="mc-card green">
                  <div className="mc-card-icon">✅</div>
                  <div className="mc-card-value">{medLoading ? "…" : medicines.filter(m => (m.quantity ?? 0) >= 20).length}</div>
                  <div className="mc-card-label">Adequate Stock</div>
                  <div className="mc-card-sub up">No action needed</div>
                </div>
              </div>

              <div className="mc-panel">
                <div className="mc-panel-header">
                  <h2>Low Stock Items <span>{lowStockItems.length} alerts</span></h2>
                </div>
                <div className="mc-panel-body">
                  {medLoading ? (
                    <p style={{ color: "var(--text-secondary)" }}>Loading...</p>
                  ) : lowStockItems.length === 0 ? (
                    <p style={{ color: "var(--text-secondary)" }}>✅ All items are sufficiently stocked.</p>
                  ) : (
                    <>
                      {/* Critical first */}
                      {lowStockItems
                        .slice()
                        .sort((a, b) => (a.quantity ?? 0) - (b.quantity ?? 0))
                        .map((m, i) => {
                          const isCritical = (m.quantity ?? 0) < 10;
                          return (
                            <div
                              className="mc-info-item"
                              key={m._id || i}
                              style={{
                                borderLeftColor: isCritical ? "var(--rose, #f43f5e)" : "var(--amber, #f59e0b)",
                                marginBottom: 10,
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                flexWrap: "wrap",
                                gap: 8,
                              }}
                            >
                              <span>
                                <span className="mc-icon">{isCritical ? "🚨" : "⚠️"}</span>
                                <b>{m.medicineName || m.name || "—"}</b>
                                {" — "}
                                <b style={{ color: isCritical ? "var(--rose, #f43f5e)" : "var(--amber, #f59e0b)" }}>
                                  {m.quantity ?? 0} units left
                                </b>
                                {m.supplier && (
                                  <span style={{ marginLeft: 8, color: "var(--text-secondary)", fontSize: 13 }}>
                                    · Supplier: {m.supplier}
                                  </span>
                                )}
                              </span>
                              <Badge status={isCritical ? "Critical" : "Low Stock"} />
                            </div>
                          );
                        })}
                    </>
                  )}
                </div>
              </div>

              {/* Quick reorder tip */}
              {lowStockItems.length > 0 && (
                <div className="mc-panel">
                  <div className="mc-panel-header"><h2>💡 Reorder Tip</h2></div>
                  <div className="mc-panel-body">
                    <p style={{ color: "var(--text-secondary)", margin: 0 }}>
                      Contact your registered suppliers from the <b>Suppliers</b> panel to reorder.
                      Add new stock directly via the <b>Inventory</b> panel → <i>Add Medicine</i>.
                    </p>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ══ SUPPLIERS ══ */}
          {activePage === "suppliers" && (
            <>
              <div className="mc-page-header"><h1>Suppliers</h1><p>Registered pharmacy suppliers — add new ones below</p></div>

              {/* ADD SUPPLIER BOX */}
              <AddBox
                title="➕ Add New Supplier"
                open={openBox === "sup"}
                onToggle={() => toggleBox("sup")}
              >
                <div className="mc-form">
                  <div className="mc-form-row">
                    <div className="mc-form-group">
                      <label>Supplier Name *</label>
                      <input name="name" placeholder="Company name" value={supForm.name} onChange={handleSupChange} />
                    </div>
                    <div className="mc-form-group">
                      <label>Email</label>
                      <input name="email" type="email" placeholder="contact@supplier.com" value={supForm.email} onChange={handleSupChange} />
                    </div>
                  </div>
                  <div className="mc-form-row">
                    <div className="mc-form-group">
                      <label>Phone</label>
                      <input name="phone" placeholder="+91 98765 43210" value={supForm.phone} onChange={handleSupChange} />
                    </div>
                    <div className="mc-form-group">
                      <label>GST Number</label>
                      <input name="gstNumber" placeholder="GST number" value={supForm.gstNumber} onChange={handleSupChange} />
                    </div>
                  </div>
                  <div className="mc-form-group">
                    <label>Address</label>
                    <input name="address" placeholder="Full address" value={supForm.address} onChange={handleSupChange} />
                  </div>
                  <Msg text={supMsg} />
                  <button className="mc-btn" onClick={handleSupSubmit} disabled={supSaving}>
                    {supSaving ? "Saving..." : "🏭 Add Supplier"}
                  </button>
                </div>
              </AddBox>

              {/* SUPPLIER TABLE */}
              <div className="mc-panel">
                <div className="mc-panel-header">
                  <h2>Supplier List <span>{suppliers.length} records</span></h2>
                </div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead>
                      <tr><th>#</th><th>Name</th><th>Phone</th><th>Email</th><th>GST</th><th>Status</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {supLoading ? <LoadingRow cols={7} /> :
                       suppliers.length === 0 ? <EmptyRow cols={7} message="No suppliers registered" /> :
                       suppliers.map((s, i) => (
                         <tr key={s._id || i}>
                           <td>{i + 1}</td>
                           <td>{s.name || "—"}</td>
                           <td>{s.phone || s.contact || "—"}</td>
                           <td>{s.email || "—"}</td>
                           <td>{s.gstNumber || "—"}</td>
                           <td><Badge status={s.status || "Active"} /></td>
                           <td>
                             <div style={{ display:"flex", gap:4 }}>
                               <button
                                 className="mc-btn"
                                 style={{ padding: "4px 10px", fontSize: 12, background: "#7c3aed" }}
                                 onClick={() => { setEditSupData({...s}); setEditSupMsg(""); setEditSupModal(true); }}
                               >✏️ Edit</button>
                               <button
                                 className="mc-btn"
                                 style={{ padding: "4px 10px", fontSize: 12, background: "var(--rose, #f43f5e)" }}
                                 onClick={() => handleDeleteSup(s._id)}
                               >Remove</button>
                             </div>
                           </td>
                         </tr>
                       ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ BILLING ══ */}
          {activePage === "billing" && (
            <>
              <div className="mc-page-header"><h1>Billing Support</h1><p>Pharmacy medicine billing records</p></div>

              {/* Summary */}
              <div className="mc-cards">
                <div className="mc-card teal">
                  <div className="mc-card-icon">💳</div>
                  <div className="mc-card-value">{billLoading ? "…" : bills.length}</div>
                  <div className="mc-card-label">Total Bills</div>
                </div>
                <div className="mc-card green">
                  <div className="mc-card-icon">✅</div>
                  <div className="mc-card-value">{billLoading ? "…" : bills.filter(b => b.status === "Paid").length}</div>
                  <div className="mc-card-label">Paid</div>
                </div>
                <div className="mc-card amber">
                  <div className="mc-card-icon">🕐</div>
                  <div className="mc-card-value">{billLoading ? "…" : bills.filter(b => b.status === "Pending" || b.status === "Partial").length}</div>
                  <div className="mc-card-label">Pending / Partial</div>
                </div>
                <div className="mc-card sky">
                  <div className="mc-card-icon">💰</div>
                  <div className="mc-card-value">
                    {billLoading ? "…" : `₹${bills.reduce((s, b) => s + (b.totalAmount ?? 0), 0).toLocaleString("en-IN")}`}
                  </div>
                  <div className="mc-card-label">Total Revenue</div>
                </div>
              </div>

              {/* ADD BILL BOX */}
              <AddBox
                title="➕ Create New Bill"
                open={openBox === "bill"}
                onToggle={() => toggleBox("bill")}
              >
                <div className="mc-form">
                  <div className="mc-form-row">
                    <div className="mc-form-group">
                      <label>Patient Name *</label>
                      <input name="patientName" placeholder="Patient name" value={billForm.patientName} onChange={handleBillChange} />
                    </div>
                    <div className="mc-form-group">
                      <label>Medicine *</label>
                      <input name="medicine" placeholder="Medicine name" value={billForm.medicine} onChange={handleBillChange} />
                    </div>
                  </div>
                  <div className="mc-form-row">
                    <div className="mc-form-group">
                      <label>Quantity *</label>
                      <input name="quantity" type="number" min="1" placeholder="Units" value={billForm.quantity} onChange={handleBillChange} />
                    </div>
                    <div className="mc-form-group">
                      <label>Unit Price (₹) *</label>
                      <input name="unitPrice" type="number" min="0" placeholder="Price per unit" value={billForm.unitPrice} onChange={handleBillChange} />
                    </div>
                  </div>
                  <div className="mc-form-group">
                    <label>Payment Method</label>
                    <select name="paymentMethod" value={billForm.paymentMethod} onChange={handleBillChange} style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--border, #e5e7eb)" }}>
                      <option>Cash</option>
                      <option>Card</option>
                      <option>UPI</option>
                      <option>Insurance</option>
                      <option>Other</option>
                    </select>
                  </div>
                  {billForm.quantity && billForm.unitPrice && (
                    <p style={{ fontWeight: 600, marginBottom: 12 }}>
                      Total: ₹{(Number(billForm.quantity) * Number(billForm.unitPrice)).toLocaleString("en-IN")}
                    </p>
                  )}
                  <Msg text={billMsg} />
                  <button className="mc-btn" onClick={handleBillSubmit} disabled={billSaving}>
                    {billSaving ? "Saving..." : "💳 Create Bill"}
                  </button>
                </div>
              </AddBox>

              {/* BILLS TABLE */}
              <div className="mc-panel">
                <div className="mc-panel-header">
                  <h2>All Bills <span>{bills.length} records</span></h2>
                </div>
                <div className="mc-table-wrap">
                  <table className="mc-table">
                    <thead>
                      <tr><th>#</th><th>Patient</th><th>Medicines</th><th>Amount (₹)</th><th>Payment</th><th>Date</th><th>Status</th></tr>
                    </thead>
                    <tbody>
                      {billLoading ? <LoadingRow cols={7} /> :
                       bills.length === 0 ? <EmptyRow cols={7} message="No billing records found" /> :
                       bills.map((b, i) => (
                         <tr key={b._id || i}>
                           <td>{i + 1}</td>
                           <td>{b.patientName || "—"}</td>
                           <td>
                             {Array.isArray(b.medicines)
                               ? b.medicines.map(m => m.name || m).join(", ")
                               : (b.medicine || "—")}
                           </td>
                           <td>₹{(b.totalAmount ?? 0).toLocaleString("en-IN")}</td>
                           <td>{b.paymentMethod || "—"}</td>
                           <td>{b.createdAt ? new Date(b.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                           <td><Badge status={b.status} /></td>
                         </tr>
                       ))
                      }
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* ══ SETTINGS ══ */}
          {activePage === "settings" && (
            <>
              <div className="mc-page-header"><h1>Settings</h1><p>Pharmacy department configuration</p></div>

              {/* Department Info */}
              <div className="mc-panel">
                <div className="mc-panel-header"><h2>Department Information</h2></div>
                <div className="mc-panel-body">
                  <div className="mc-form">
                    <div className="mc-form-row">
                      <div className="mc-form-group">
                        <label>Department Name</label>
                        <input
                          value={settings.deptName}
                          onChange={e => setSettings(p => ({ ...p, deptName: e.target.value }))}
                          placeholder="Department name"
                        />
                      </div>
                      <div className="mc-form-group">
                        <label>Contact Email</label>
                        <input
                          type="email"
                          value={settings.email}
                          onChange={e => setSettings(p => ({ ...p, email: e.target.value }))}
                          placeholder="email@medcare.com"
                        />
                      </div>
                    </div>
                    <div className="mc-form-row">
                      <div className="mc-form-group">
                        <label>Phone</label>
                        <input
                          value={settings.phone}
                          onChange={e => setSettings(p => ({ ...p, phone: e.target.value }))}
                          placeholder="+91 ..."
                        />
                      </div>
                      <div className="mc-form-group">
                        <label>Address</label>
                        <input
                          value={settings.address}
                          onChange={e => setSettings(p => ({ ...p, address: e.target.value }))}
                          placeholder="Hospital address"
                        />
                      </div>
                    </div>
                    <Msg text={settingsMsg} />
                    <button
                      className="mc-btn"
                      onClick={() => setSettingsMsg("✅ Settings saved locally.")}
                    >
                      💾 Save Changes
                    </button>
                  </div>
                </div>
              </div>

              {/* Stock Threshold */}
              <div className="mc-panel">
                <div className="mc-panel-header"><h2>Stock Alert Threshold</h2></div>
                <div className="mc-panel-body">
                  <div className="mc-form">
                    <div className="mc-form-group" style={{ maxWidth: 300 }}>
                      <label>Low Stock Alert Threshold (units)</label>
                      <input
                        type="number"
                        min="1"
                        value={settings.lowStockThreshold}
                        onChange={e => setSettings(p => ({ ...p, lowStockThreshold: e.target.value }))}
                      />
                    </div>
                    <p style={{ color: "var(--text-secondary)", marginTop: 8, marginBottom: 12, fontSize: 13 }}>
                      Medicines with quantity below this value will appear in Low Stock Alerts.
                    </p>
                    <button className="mc-btn" onClick={() => setSettingsMsg("✅ Threshold updated.")}>
                      ⚙️ Update Threshold
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Info */}
              <div className="mc-panel">
                <div className="mc-panel-header"><h2>System Info</h2></div>
                <div className="mc-panel-body">
                  <div className="mc-info-list">
                    <div className="mc-info-item"><span className="mc-icon">💊</span>Department: {settings.deptName}</div>
                    <div className="mc-info-item"><span className="mc-icon">📧</span>Email: {settings.email}</div>
                    <div className="mc-info-item"><span className="mc-icon">🌐</span>API Base: {API}</div>
                    <div className="mc-info-item"><span className="mc-icon">📦</span>Total Medicines: {medicines.length}</div>
                    <div className="mc-info-item"><span className="mc-icon">⚠️</span>Low Stock Items: {lowStockItems.length}</div>
                  </div>
                </div>
              </div>
            </>
          )}

        </main>
      </div>

      {/* ══ EDIT MEDICINE MODAL ══ */}
{editMedModal && (
  <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center" }}>
    <div style={{ background:"#fff",borderRadius:12,padding:"2rem",width:"100%",maxWidth:440,boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem" }}>
        <h3 style={{ margin:0,color:"#7c3aed" }}>✏️ Edit Medicine</h3>
        <button onClick={() => setEditMedModal(false)} style={{ background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer" }}>✕</button>
      </div>
      {editMedMsg && <div style={{ padding:"0.5rem 0.8rem",borderRadius:6,marginBottom:"0.8rem",background:editMedMsg.startsWith("✅")?"#d1fae5":"#fee2e2",color:editMedMsg.startsWith("✅")?"#065f46":"#991b1b",fontSize:"0.85rem" }}>{editMedMsg}</div>}
      <div style={{ marginBottom:"0.8rem" }}><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Medicine Name</label>
        <input style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:"0.9rem",boxSizing:"border-box" }}
          value={editMedData.medicineName||""} onChange={e => setEditMedData({...editMedData,medicineName:e.target.value})} /></div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.8rem",marginBottom:"0.8rem" }}>
        <div><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Quantity</label>
          <input type="number" style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:"0.9rem",boxSizing:"border-box" }}
            value={editMedData.quantity||0} onChange={e => setEditMedData({...editMedData,quantity:Number(e.target.value)})} /></div>
        <div><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Supplier</label>
          <input style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:"0.9rem",boxSizing:"border-box" }}
            value={editMedData.supplier||""} onChange={e => setEditMedData({...editMedData,supplier:e.target.value})} /></div>
      </div>
      <div style={{ display:"flex",gap:"0.75rem" }}>
        <button className="mc-btn" style={{ flex:1 }} onClick={handleEditMed}>💾 Save</button>
        <button onClick={() => setEditMedModal(false)} style={{ flex:1,padding:"0.6rem",border:"1px solid #d1d5db",borderRadius:8,background:"#f9fafb",cursor:"pointer" }}>Cancel</button>
      </div>
    </div>
  </div>
)}

      {/* ══ EDIT SUPPLIER MODAL ══ */}
      {editSupModal && (
  <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center" }}>
    <div style={{ background:"#fff",borderRadius:12,padding:"2rem",width:"100%",maxWidth:440,boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem" }}>
        <h3 style={{ margin:0,color:"#7c3aed" }}>✏️ Edit Supplier</h3>
        <button onClick={() => setEditSupModal(false)} style={{ background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer" }}>✕</button>
      </div>
      {editSupMsg && <div style={{ padding:"0.5rem 0.8rem",borderRadius:6,marginBottom:"0.8rem",background:editSupMsg.startsWith("✅")?"#d1fae5":"#fee2e2",color:editSupMsg.startsWith("✅")?"#065f46":"#991b1b",fontSize:"0.85rem" }}>{editSupMsg}</div>}
      <div style={{ marginBottom:"0.8rem" }}><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Supplier Name</label>
        <input style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:"0.9rem",boxSizing:"border-box" }}
          value={editSupData.name||""} onChange={e => setEditSupData({...editSupData,name:e.target.value})} /></div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.8rem",marginBottom:"0.8rem" }}>
        <div><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Phone</label>
          <input style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:"0.9rem",boxSizing:"border-box" }}
            value={editSupData.phone||""} onChange={e => setEditSupData({...editSupData,phone:e.target.value})} /></div>
        <div><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Medicine</label>
          <input style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:"0.9rem",boxSizing:"border-box" }}
            value={editSupData.medicine||""} onChange={e => setEditSupData({...editSupData,medicine:e.target.value})} /></div>
      </div>
      <div style={{ display:"flex",gap:"0.75rem" }}>
        <button className="mc-btn" style={{ flex:1 }} onClick={handleEditSup}>💾 Save</button>
        <button onClick={() => setEditSupModal(false)} style={{ flex:1,padding:"0.6rem",border:"1px solid #d1d5db",borderRadius:8,background:"#f9fafb",cursor:"pointer" }}>Cancel</button>
      </div>
    </div>
  </div>
)}

      {/* ══ EDIT BILL MODAL ══ */}
      {editBillModal && (
  <div style={{ position:"fixed",inset:0,background:"rgba(0,0,0,0.5)",zIndex:9999,display:"flex",alignItems:"center",justifyContent:"center" }}>
    <div style={{ background:"#fff",borderRadius:12,padding:"2rem",width:"100%",maxWidth:440,boxShadow:"0 20px 60px rgba(0,0,0,0.2)" }}>
      <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"1.2rem" }}>
        <h3 style={{ margin:0,color:"#7c3aed" }}>✏️ Edit Bill</h3>
        <button onClick={() => setEditBillModal(false)} style={{ background:"none",border:"none",fontSize:"1.3rem",cursor:"pointer" }}>✕</button>
      </div>
      {editBillMsg && <div style={{ padding:"0.5rem 0.8rem",borderRadius:6,marginBottom:"0.8rem",background:editBillMsg.startsWith("✅")?"#d1fae5":"#fee2e2",color:editBillMsg.startsWith("✅")?"#065f46":"#991b1b",fontSize:"0.85rem" }}>{editBillMsg}</div>}
      <div style={{ marginBottom:"0.8rem" }}><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Patient Name</label>
        <input style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:"0.9rem",boxSizing:"border-box" }}
          value={editBillData.patientName||editBillData.patient||""} onChange={e => setEditBillData({...editBillData,patientName:e.target.value,patient:e.target.value})} /></div>
      <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0.8rem",marginBottom:"0.8rem" }}>
        <div><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Amount (₹)</label>
          <input type="number" style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:"0.9rem",boxSizing:"border-box" }}
            value={editBillData.totalAmount||editBillData.amount||0} onChange={e => setEditBillData({...editBillData,totalAmount:Number(e.target.value),amount:Number(e.target.value)})} /></div>
        <div><label style={{ display:"block",fontWeight:600,fontSize:"0.82rem",marginBottom:4 }}>Status</label>
          <select style={{ width:"100%",padding:"9px 12px",borderRadius:8,border:"1.5px solid #e5e7eb",fontSize:"0.9rem",boxSizing:"border-box" }}
            value={editBillData.status||"Pending"} onChange={e => setEditBillData({...editBillData,status:e.target.value})}>
            <option>Pending</option><option>Paid</option><option>Cancelled</option>
          </select></div>
      </div>
      <div style={{ display:"flex",gap:"0.75rem" }}>
        <button className="mc-btn" style={{ flex:1 }} onClick={handleEditBill}>💾 Save</button>
        <button onClick={() => setEditBillModal(false)} style={{ flex:1,padding:"0.6rem",border:"1px solid #d1d5db",borderRadius:8,background:"#f9fafb",cursor:"pointer" }}>Cancel</button>
      </div>
    </div>
  </div>
)}

    </>
  );
}

export default PharmacyDashboard;
