import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../index.css";
import axios from "axios";

const API = "https://medcare-hms-backend.onrender.com/api";

/* ═══════════════════════════════════════════════════════════════════
   HELPER — extracts userId no matter how localStorage saved the object
═══════════════════════════════════════════════════════════════════ */
function extractUserId(patient) {
  if (!patient) return null;
  return (
    patient._id       ||
    patient.id        ||
    patient.userId    ||
    patient.user?._id ||
    patient.user?.id  ||
    null
  );
}

/* ═══════════════════════════════════════════════════════════════════
   BADGE
═══════════════════════════════════════════════════════════════════ */
function Badge({ status }) {
  const s = (status || "").toLowerCase().replace(/\s/g, "");
  return <span className={`mc-badge ${s}`}>{status}</span>;
}

/* ═══════════════════════════════════════════════════════════════════
   SIDEBAR BUTTON
═══════════════════════════════════════════════════════════════════ */
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

/* ═══════════════════════════════════════════════════════════════════
   EDIT PROFILE
═══════════════════════════════════════════════════════════════════ */
function EditProfile({ patient, onProfileUpdate }) {
  const userId = extractUserId(patient);

  const seed = {
    firstname:        patient?.firstname        || "",
    lastname:         patient?.lastname         || "",
    email:            patient?.email            || "",
    phone:            patient?.phone            || "",
    age:              patient?.age              || "",
    gender:           patient?.gender           || "",
    bloodGroup:       patient?.bloodGroup       || "",
    address:          patient?.address          || "",
    emergencyContact: patient?.emergencyContact || "",
  };

  const [form,     setForm]     = useState(seed);
  const [original, setOriginal] = useState(seed);
  const [editMode, setEditMode] = useState(false);
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    if (!userId) return;
    axios
      .get(`${API}/patient/profile/${userId}`)
      .then(({ data }) => {
        if (data.success) {
          const d = data.data;
          const filled = {
            firstname:        d.firstname        || "",
            lastname:         d.lastname         || "",
            email:            d.email            || "",
            phone:            d.phone            || "",
            age:              d.age              || "",
            gender:           d.gender           || "",
            bloodGroup:       d.bloodGroup       || "",
            address:          d.address          || "",
            emergencyContact: d.emergencyContact || "",
          };
          setForm(filled);
          setOriginal(filled);
        }
      })
      .catch(() => {});
  }, [userId]);

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleCancel = () => {
    setForm(original);
    setEditMode(false);
    setError(null);
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);
    try {
      const { data } = await axios.put(`${API}/patient/profile/${userId}`, form);
      if (data.success) {
        setOriginal(form);
        setSuccess(true);
        setEditMode(false);
        const stored = JSON.parse(localStorage.getItem("loginData") || "{}");
        const updated = { ...stored, ...form };
        localStorage.setItem("loginData", JSON.stringify(updated));
        if (onProfileUpdate) onProfileUpdate(updated);
      } else {
        setError(data.message || "Update failed.");
      }
    } catch {
      setError("Server error. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const initials =
    `${form.firstname?.charAt(0) || ""}${form.lastname?.charAt(0) || ""}`.toUpperCase() || "P";

  const bloodGroups = ["A+", "A−", "B+", "B−", "AB+", "AB−", "O+", "O−"];

  return (
    <div>
      <div className="mc-page-header">
        <h1>My Profile</h1>
        <p>Manage your personal information</p>
      </div>

      {success && (
        <div className="mc-alert success">
          <span>✅</span>
          <p>Profile updated successfully!</p>
          <button className="mc-alert-close" onClick={() => setSuccess(false)}>✕</button>
        </div>
      )}
      {error && (
        <div className="mc-alert error">
          <span>⚠️</span>
          <p>{error}</p>
          <button className="mc-alert-close" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <div className="mc-ep-layout">
        <div className="mc-panel mc-ep-avatar-panel">
          <div className="mc-panel-body" style={{ textAlign: "center" }}>
            <div className="mc-ep-avatar">{initials}</div>
            <div className="mc-ep-name">{form.firstname} {form.lastname}</div>
            <div className="mc-ep-role">{patient?.role || "Patient"}</div>
            <div className="mc-ep-meta">
              {form.bloodGroup && <span className="mc-ep-tag blood">🩸 {form.bloodGroup}</span>}
              {form.gender     && <span className="mc-ep-tag">👤 {form.gender}</span>}
              {form.age        && <span className="mc-ep-tag">🎂 {form.age} yrs</span>}
            </div>
            {!editMode && (
              <button className="mc-edit-toggle-btn" onClick={() => setEditMode(true)}>
                ✏️ Edit Profile
              </button>
            )}
          </div>
        </div>

        <div className="mc-panel mc-ep-form-panel">
          <div className="mc-panel-header">
            <h2>{editMode ? "✏️ Edit Information" : "📋 Personal Information"}</h2>
            {editMode && (
              <button className="mc-btn-ghost" onClick={handleCancel}>Cancel</button>
            )}
          </div>
          <div className="mc-panel-body">
            <form onSubmit={handleSubmit} className="mc-form">
              <div className="mc-form-row two-col">
                <div className="mc-form-group">
                  <label>First Name</label>
                  {editMode
                    ? <input name="firstname" value={form.firstname} onChange={handleChange} className="mc-input" placeholder="First name" />
                    : <div className="mc-view-field">{form.firstname || "—"}</div>}
                </div>
                <div className="mc-form-group">
                  <label>Last Name</label>
                  {editMode
                    ? <input name="lastname" value={form.lastname} onChange={handleChange} className="mc-input" placeholder="Last name" />
                    : <div className="mc-view-field">{form.lastname || "—"}</div>}
                </div>
              </div>

              <div className="mc-form-row two-col">
                <div className="mc-form-group">
                  <label>Email</label>
                  {editMode
                    ? <input name="email" type="email" value={form.email} onChange={handleChange} className="mc-input" placeholder="Email" />
                    : <div className="mc-view-field">{form.email || "—"}</div>}
                </div>
                <div className="mc-form-group">
                  <label>Phone</label>
                  {editMode
                    ? <input name="phone" value={form.phone} onChange={handleChange} className="mc-input" placeholder="Phone number" />
                    : <div className="mc-view-field">{form.phone || "—"}</div>}
                </div>
              </div>

              <div className="mc-form-row two-col">
                <div className="mc-form-group">
                  <label>Age</label>
                  {editMode
                    ? <input name="age" type="number" min="0" max="120" value={form.age} onChange={handleChange} className="mc-input" placeholder="Age" />
                    : <div className="mc-view-field">{form.age ? `${form.age} years` : "—"}</div>}
                </div>
                <div className="mc-form-group">
                  <label>Gender</label>
                  {editMode
                    ? (
                      <select name="gender" value={form.gender} onChange={handleChange} className="mc-input">
                        <option value="">Select gender</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                        <option value="Prefer not to say">Prefer not to say</option>
                      </select>
                    )
                    : <div className="mc-view-field">{form.gender || "—"}</div>}
                </div>
              </div>

              <div className="mc-form-row two-col">
                <div className="mc-form-group">
                  <label>Blood Group</label>
                  {editMode
                    ? (
                      <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange} className="mc-input">
                        <option value="">Select blood group</option>
                        {bloodGroups.map((bg) => <option key={bg} value={bg}>{bg}</option>)}
                      </select>
                    )
                    : <div className="mc-view-field">{form.bloodGroup || "—"}</div>}
                </div>
                <div className="mc-form-group">
                  <label>Emergency Contact</label>
                  {editMode
                    ? <input name="emergencyContact" value={form.emergencyContact} onChange={handleChange} className="mc-input" placeholder="Emergency contact" />
                    : <div className="mc-view-field">{form.emergencyContact || "—"}</div>}
                </div>
              </div>

              <div className="mc-form-group">
                <label>Address</label>
                {editMode
                  ? <textarea name="address" value={form.address} onChange={handleChange} className="mc-input mc-textarea" rows={2} placeholder="Full address" />
                  : <div className="mc-view-field">{form.address || "—"}</div>}
              </div>

              {editMode && (
                <div className="mc-form-actions">
                  <button type="button" className="mc-btn-ghost" onClick={handleCancel}>Cancel</button>
                  <button type="submit" className="mc-submit-btn" disabled={saving}>
                    {saving ? <><span className="mc-spinner" /> Saving...</> : "💾 Save Changes"}
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   APPOINTMENT PAGE
═══════════════════════════════════════════════════════════════════ */
function AppointmentPage({ patient }) {
  const userId = extractUserId(patient);

  const [tab, setTab] = useState("book");

  const [doctors,    setDoctors]    = useState([]);
  const [loadDoc,    setLoadDoc]    = useState(true);
  const [docError,   setDocError]   = useState(null);
  const [form, setForm] = useState({
    doctorId: "", doctorName: "", department: "", date: "", time: "", notes: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [success,    setSuccess]    = useState(false);
  const [submitErr,  setSubmitErr]  = useState(null);

  const [appointments, setAppointments] = useState([]);
  const [loadAppt,     setLoadAppt]     = useState(false);
  const [apptError,    setApptError]    = useState(null);

  useEffect(() => {
    axios
      .get(`${API}/user/doctors`)
      .then(({ data }) => {
        if (data.success) setDoctors(data.data);
        else setDocError("Could not load doctors.");
      })
      .catch(() => setDocError("Failed to fetch doctors. Please try again."))
      .finally(() => setLoadDoc(false));
  }, []);

  useEffect(() => {
    if (tab !== "previous" || !userId) return;
    setLoadAppt(true);
    setApptError(null);
    axios
      .get(`${API}/patient/appointments/${userId}`)
      .then(({ data }) => {
        if (data.success) setAppointments(data.data || []);
        else setApptError("Could not load appointments.");
      })
      .catch(() => setApptError("Failed to fetch appointments."))
      .finally(() => setLoadAppt(false));
  }, [tab, userId]);

  const pickDoctor = (id) => {
    const doc = doctors.find((d) => d._id === id);
    setForm((f) => ({
      ...f,
      doctorId:   doc?._id   || "",
      doctorName: doc ? `${doc.firstname} ${doc.lastname}` : "",
      department: doc?.department || "",
    }));
  };

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!userId) {
      setSubmitErr("Session expired. Please log in again.");
      return;
    }
    if (!form.doctorId || !form.date || !form.time) {
      setSubmitErr("Please select a Doctor, Date and Time.");
      return;
    }

    setSubmitting(true);
    setSubmitErr(null);

    try {
      const { data } = await axios.post(`${API}/patient/appointments/book`, {
        patientId:  userId,
        doctorId:   form.doctorId,
        doctorName: form.doctorName,
        department: form.department,
        date:       form.date,
        time:       form.time,
        notes:      form.notes,
      });

      if (data.success) {
        setSuccess(true);
        setForm({ doctorId: "", doctorName: "", department: "", date: "", time: "", notes: "" });
      } else {
        setSubmitErr(data.message || "Booking failed.");
      }
    } catch (err) {
      const msg = err?.response?.data?.message || "Server error. Please try again.";
      setSubmitErr(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="mc-ba-wrapper">
      <div className="mc-page-header">
        <h1>Appointments</h1>
        <p>Book a new appointment or view previous ones</p>
      </div>

      {!userId && (
        <div className="mc-alert error" style={{ marginBottom: 16 }}>
          <span>⚠️</span>
          <div>
            <strong>Session not found.</strong>
            <p>Your login session is missing. Please <strong>log out and log in again</strong> to book appointments.</p>
          </div>
        </div>
      )}

      <div className="mc-tab-bar">
        <button className={`mc-tab-btn ${tab === "book"     ? "active" : ""}`} onClick={() => setTab("book")}>📅 Book Appointment</button>
        <button className={`mc-tab-btn ${tab === "previous" ? "active" : ""}`} onClick={() => setTab("previous")}>📋 Previous Appointments</button>
      </div>

      {tab === "book" && (
        <>
          {success && (
            <div className="mc-alert success">
              <span>✅</span>
              <div>
                <strong>Appointment Booked!</strong>
                <p>Your request has been submitted. You'll be notified once confirmed.</p>
              </div>
              <button className="mc-alert-close" onClick={() => setSuccess(false)}>✕</button>
            </div>
          )}
          {submitErr && (
            <div className="mc-alert error">
              <span>⚠️</span><p>{submitErr}</p>
              <button className="mc-alert-close" onClick={() => setSubmitErr(null)}>✕</button>
            </div>
          )}

          <div className="mc-ba-layout">
            <div className="mc-panel mc-ba-doctor-panel">
              <div className="mc-panel-header"><h2>👨‍⚕️ Select Doctor</h2></div>
              <div className="mc-panel-body">
                {loadDoc ? (
                  <div className="mc-doctor-grid">
                    {[1, 2, 3].map((i) => (
                      <div className="mc-doctor-card skeleton" key={i}>
                        <div className="mc-skeleton mc-doctor-avatar-sk" />
                        <div className="mc-skeleton" style={{ height: 14, width: "70%", margin: "8px auto 4px" }} />
                        <div className="mc-skeleton" style={{ height: 12, width: "50%", margin: "0 auto" }} />
                      </div>
                    ))}
                  </div>
                ) : docError ? (
                  <div className="mc-empty-state"><span>⚠️</span><p>{docError}</p></div>
                ) : doctors.length === 0 ? (
                  <div className="mc-empty-state"><span>🩺</span><p>No doctors available.</p></div>
                ) : (
                  <div className="mc-doctor-grid">
                    {doctors.map((doc) => {
                      const isSelected = form.doctorId === doc._id;
                      return (
                        <div
                          key={doc._id}
                          className={`mc-doctor-card ${isSelected ? "selected" : ""}`}
                          onClick={() => pickDoctor(doc._id)}
                        >
                          <div className="mc-doctor-avatar">
                            {doc.firstname?.charAt(0)}{doc.lastname?.charAt(0)}
                          </div>
                          <div className="mc-doctor-name">Dr. {doc.firstname} {doc.lastname}</div>
                          <div className="mc-doctor-dept">{doc.department || "General"}</div>
                          {isSelected && <div className="mc-doctor-check">✓</div>}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            <div className="mc-panel mc-ba-form-panel">
              <div className="mc-panel-header"><h2>📅 Appointment Details</h2></div>
              <div className="mc-panel-body">
                <form onSubmit={handleSubmit} className="mc-form">
                  {form.doctorId && (
                    <div className="mc-selected-doctor-preview">
                      <span className="mc-sdp-icon">👨‍⚕️</span>
                      <div>
                        <strong>Dr. {form.doctorName}</strong>
                        <span>{form.department || "General"}</span>
                      </div>
                    </div>
                  )}

                  <div className="mc-form-row">
                    <div className="mc-form-group">
                      <label>Department</label>
                      <input
                        type="text"
                        name="department"
                        value={form.department}
                        onChange={handleChange}
                        placeholder="Auto-filled on doctor select"
                        className="mc-input"
                      />
                    </div>
                  </div>

                  <div className="mc-form-row two-col">
                    <div className="mc-form-group">
                      <label>Preferred Date <span className="req">*</span></label>
                      <input type="date" name="date" value={form.date} min={today} onChange={handleChange} required className="mc-input" />
                    </div>
                    <div className="mc-form-group">
                      <label>Preferred Time <span className="req">*</span></label>
                      <input type="time" name="time" value={form.time} onChange={handleChange} required className="mc-input" />
                    </div>
                  </div>

                  <div className="mc-form-group">
                    <label>Notes / Reason for Visit</label>
                    <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Describe your symptoms..." className="mc-input mc-textarea" rows={3} />
                  </div>

                  <button type="submit" className="mc-submit-btn" disabled={submitting || !userId}>
                    {submitting ? <><span className="mc-spinner" /> Booking...</> : "📅 Book Appointment"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "previous" && (
        <div className="mc-panel">
          <div className="mc-panel-header"><h2>My Appointments</h2></div>
          <div className="mc-panel-body">
            {loadAppt ? (
              <div className="mc-loading-state"><span className="mc-spinner" /> Loading appointments...</div>
            ) : apptError ? (
              <div className="mc-empty-state"><span>⚠️</span><p>{apptError}</p></div>
            ) : appointments.length === 0 ? (
              <div className="mc-empty-state"><span>📅</span><p>No appointments found.</p></div>
            ) : (
              <div className="mc-table-wrap">
                <table className="mc-table">
                  <thead>
                    <tr>
                      <th>#</th><th>Doctor</th><th>Department</th>
                      <th>Date</th><th>Time</th><th>Notes</th><th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appointments.map((appt, i) => (
                      <tr key={appt._id || i}>
                        <td>{i + 1}</td>
                        <td>Dr. {appt.doctorName || "—"}</td>
                        <td>{appt.department || "—"}</td>
                        <td>{appt.date ? new Date(appt.date).toLocaleDateString() : "—"}</td>
                        <td>{appt.time || "—"}</td>
                        <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {appt.notes || "—"}
                        </td>
                        <td><Badge status={appt.status || "Pending"} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════════════ */
function Dashboard({ patient }) {
  const userId = extractUserId(patient);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState({ upcomingCount: 0, reportsCount: 0, prescriptionsCount: 0, doctorsCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) { setLoading(false); return; }
    axios
      .get(`${API}/patient/appointments/${userId}`)
      .then(({ data }) => {
        if (data.success) {
          const all = data.data || [];
          setAppointments(all.slice(0, 5));
          const upcoming = all.filter((a) =>
            ["upcoming", "pending", "confirmed"].includes((a.status || "").toLowerCase())
          );
          setStats((s) => ({
            ...s,
            upcomingCount: upcoming.length,
            doctorsCount: new Set(all.map((a) => String(a.doctorId))).size,
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [userId]);

  return (
    <>
      <div className="mc-page-header">
        <h1>Patient Dashboard</h1>
        <p>Your health overview</p>
      </div>
      <div className="mc-cards">
        <div className="mc-card teal">
          <div className="mc-card-icon">📅</div>
          <div className="mc-card-value">{loading ? "—" : stats.upcomingCount}</div>
          <div className="mc-card-label">Upcoming Appointments</div>
        </div>
        <div className="mc-card sky">
          <div className="mc-card-icon">📋</div>
          <div className="mc-card-value">{loading ? "—" : stats.reportsCount}</div>
          <div className="mc-card-label">Medical Reports</div>
        </div>
        <div className="mc-card purple">
          <div className="mc-card-icon">💊</div>
          <div className="mc-card-value">{loading ? "—" : stats.prescriptionsCount}</div>
          <div className="mc-card-label">Prescriptions</div>
        </div>
        <div className="mc-card amber">
          <div className="mc-card-icon">🩺</div>
          <div className="mc-card-value">{loading ? "—" : stats.doctorsCount}</div>
          <div className="mc-card-label">Doctors Consulted</div>
        </div>
      </div>

      <div className="mc-panel">
        <div className="mc-panel-header"><h2>My Recent Appointments</h2></div>
        {loading ? (
          <div className="mc-panel-body">
            <div className="mc-loading-state"><span className="mc-spinner" /> Loading...</div>
          </div>
        ) : appointments.length === 0 ? (
          <div className="mc-panel-body">
            <div className="mc-empty-state"><span>📅</span><p>No appointments yet. Book your first appointment!</p></div>
          </div>
        ) : (
          <div className="mc-table-wrap">
            <table className="mc-table">
              <thead>
                <tr><th>#</th><th>Doctor</th><th>Department</th><th>Date</th><th>Time</th><th>Status</th></tr>
              </thead>
              <tbody>
                {appointments.map((appt, i) => (
                  <tr key={appt._id || i}>
                    <td>{i + 1}</td>
                    <td>Dr. {appt.doctorName || "—"}</td>
                    <td>{appt.department || "—"}</td>
                    <td>{appt.date ? new Date(appt.date).toLocaleDateString() : "—"}</td>
                    <td>{appt.time || "—"}</td>
                    <td><Badge status={appt.status || "Pending"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PATIENT REPORTS
═══════════════════════════════════════════════════════════════════ */
function PatientReports({ patient }) {
  const [reports,  setReports]  = useState([]);
  const [labTests, setLabTests] = useState([]);
  const [loading,  setLoading]  = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const firstname = (patient?.firstname || "").toLowerCase();
        const phone     = patient?.phone || "";

        const rRes = await axios.get(`${API}/report/all`).catch(() => null);
        if (rRes) {
          const arr = rRes.data?.reports || rRes.data?.data || (Array.isArray(rRes.data) ? rRes.data : []);
          if (arr.length === 0) {
            setReports([]);
          } else {
            const matched = firstname
              ? arr.filter(r =>
                  (r.patient || "").toLowerCase().includes(firstname) ||
                  (phone && (r.phone || "").includes(phone))
                )
              : arr;
            setReports(matched.length > 0 ? matched : arr);
          }
        }

        const lRes = await axios.get(`${API}/labtest/tests`).catch(() => null);
        if (lRes) {
          const arr = Array.isArray(lRes.data) ? lRes.data : [];
          if (arr.length === 0) {
            setLabTests([]);
          } else {
            const matched = firstname
              ? arr.filter(t =>
                  (t.patientName || "").toLowerCase().includes(firstname) ||
                  (t.patientId?.firstname || "").toLowerCase().includes(firstname)
                )
              : arr;
            setLabTests(matched.length > 0 ? matched : arr);
          }
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    };
    fetchAll();
  }, [patient]);

  if (loading) return <div className="mc-panel"><div className="mc-panel-body"><p>Loading reports…</p></div></div>;

  return (
    <>
      <div className="mc-page-header">
        <h1>My Medical Reports</h1>
        <p>Doctor reports and lab test results for you</p>
      </div>

      <div className="mc-panel" style={{ marginBottom: "1.5rem" }}>
        <div className="mc-panel-header"><h2>📋 Doctor Reports ({reports.length})</h2></div>
        {reports.length === 0 ? (
          <div className="mc-panel-body">
            <div className="mc-empty-state"><span>📋</span><p>No doctor reports found for your name. Reports will appear here after a doctor creates one for you.</p></div>
          </div>
        ) : (
          <div className="mc-table-wrap">
            <table className="mc-table">
              <thead><tr><th>#</th><th>Doctor</th><th>Diagnosis</th><th>Notes</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {reports.map((r, i) => (
                  <tr key={r._id || i}>
                    <td>{i + 1}</td>
                    <td>{r.doctor || "—"}</td>
                    <td>{r.diagnosis || "—"}</td>
                    <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.notes || "—"}</td>
                    <td>{r.createdAt ? new Date(r.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                    <td><Badge status={r.status || "Active"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="mc-panel">
        <div className="mc-panel-header"><h2>🧪 Lab Test Reports ({labTests.length})</h2></div>
        {labTests.length === 0 ? (
          <div className="mc-panel-body">
            <div className="mc-empty-state"><span>🧪</span><p>No lab test reports found. Results will appear here after lab staff processes your tests.</p></div>
          </div>
        ) : (
          <div className="mc-table-wrap">
            <table className="mc-table">
              <thead><tr><th>#</th><th>Test Name</th><th>Result</th><th>Remarks</th><th>Priority</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {labTests.map((t, i) => (
                  <tr key={t._id || i}>
                    <td>{i + 1}</td>
                    <td>{t.testName || "—"}</td>
                    <td style={{ maxWidth: 160, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{t.report || (t.status === "Completed" ? "—" : "Pending")}</td>
                    <td>{t.remarks || "—"}</td>
                    <td>{t.priority || "Normal"}</td>
                    <td><Badge status={t.status || "Pending"} /></td>
                    <td>{t.createdAt ? new Date(t.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PATIENT PRESCRIPTIONS
═══════════════════════════════════════════════════════════════════ */
function PatientPrescriptions({ patient }) {
  const [prescriptions, setPrescriptions] = useState([]);
  const [loading,       setLoading]       = useState(true);

  useEffect(() => {
    const firstname = (patient?.firstname || "").toLowerCase();
    const phone     = patient?.phone || "";

    axios.get(`${API}/prescription/all`)
      .then(res => {
        const arr = res.data?.prescriptions || res.data?.data || (Array.isArray(res.data) ? res.data : []);
        const matched = firstname
          ? arr.filter(p =>
              (p.patient || "").toLowerCase().includes(firstname) ||
              (phone && (p.phone || "").includes(phone))
            )
          : arr;
        setPrescriptions(matched.length > 0 ? matched : arr);
      })
      .catch(() => setPrescriptions([]))
      .finally(() => setLoading(false));
  }, [patient]);

  if (loading) return <div className="mc-panel"><div className="mc-panel-body"><p>Loading prescriptions…</p></div></div>;

  return (
    <>
      <div className="mc-page-header">
        <h1>My Prescriptions</h1>
        <p>Prescriptions issued by your doctor</p>
      </div>
      <div className="mc-panel">
        <div className="mc-panel-header"><h2>💊 Prescriptions ({prescriptions.length})</h2></div>
        {prescriptions.length === 0 ? (
          <div className="mc-panel-body">
            <div className="mc-empty-state"><span>💊</span><p>No prescriptions found for your name. Prescriptions will appear here after a doctor issues one for you.</p></div>
          </div>
        ) : (
          <div className="mc-table-wrap">
            <table className="mc-table">
              <thead><tr><th>#</th><th>Doctor</th><th>Medicine / Diagnosis</th><th>Notes</th><th>Date</th><th>Status</th></tr></thead>
              <tbody>
                {prescriptions.map((p, i) => (
                  <tr key={p._id || i}>
                    <td>{i + 1}</td>
                    <td>{p.doctor || "—"}</td>
                    <td>{p.medicine || "—"}</td>
                    <td style={{ maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.notes || "—"}</td>
                    <td>{p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN") : "—"}</td>
                    <td><Badge status={p.status || "Active"} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   PATIENT BILLING
═══════════════════════════════════════════════════════════════════ */
function PatientBilling({ patient }) {
  const [bills,   setBills]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const firstname = (patient?.firstname || "").toLowerCase();

    axios.get(`${API}/pharmacy/bills`)
      .then(res => {
        const arr = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        const matched = firstname
          ? arr.filter(b =>
              (b.patientName || b.patient || "").toLowerCase().includes(firstname)
            )
          : arr;
        setBills(matched.length > 0 ? matched : arr);
      })
      .catch(() => setBills([]))
      .finally(() => setLoading(false));
  }, [patient]);

  const total = bills.reduce((s, b) => s + Number(b.totalAmount || b.amount || 0), 0);

  if (loading) return <div className="mc-panel"><div className="mc-panel-body"><p>Loading billing records…</p></div></div>;

  return (
    <>
      <div className="mc-page-header">
        <h1>My Billing</h1>
        <p>Pharmacy bills and payment records</p>
      </div>

      {bills.length > 0 && (
        <div className="mc-cards" style={{ marginBottom: "1.5rem" }}>
          <div className="mc-card teal">
            <div className="mc-card-icon">💳</div>
            <div className="mc-card-value">{bills.length}</div>
            <div className="mc-card-label">Total Bills</div>
          </div>
          <div className="mc-card purple">
            <div className="mc-card-icon">💰</div>
            <div className="mc-card-value">₹{total.toLocaleString("en-IN")}</div>
            <div className="mc-card-label">Total Spent</div>
          </div>
          <div className="mc-card amber">
            <div className="mc-card-icon">✅</div>
            <div className="mc-card-value">{bills.filter(b => (b.status||"").toLowerCase() === "paid").length}</div>
            <div className="mc-card-label">Paid</div>
          </div>
          <div className="mc-card sky">
            <div className="mc-card-icon">⏳</div>
            <div className="mc-card-value">{bills.filter(b => (b.status||"").toLowerCase() !== "paid").length}</div>
            <div className="mc-card-label">Pending</div>
          </div>
        </div>
      )}

      <div className="mc-panel">
        <div className="mc-panel-header"><h2>💳 Bill Records ({bills.length})</h2></div>
        {bills.length === 0 ? (
          <div className="mc-panel-body">
            <div className="mc-empty-state"><span>💳</span><p>No billing records found for your name. Bills created at the pharmacy will appear here.</p></div>
          </div>
        ) : (
          <div className="mc-table-wrap">
            <table className="mc-table">
              <thead><tr><th>#</th><th>Medicine</th><th>Amount (₹)</th><th>Payment Method</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {bills.map((b, i) => (
                  <tr key={b._id || i}>
                    <td>{i + 1}</td>
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
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN PATIENT COMPONENT
═══════════════════════════════════════════════════════════════════ */
function Patient() {
  const navigate = useNavigate();
  const [activePage, setActivePage] = useState("dashboard");
  const [patient, setPatient] = useState(
    JSON.parse(localStorage.getItem("loginData")) || {}
  );

  const handleProfileUpdate = (updated) => setPatient(updated);

  const logout = () => {
    localStorage.removeItem("loginData");
    sessionStorage.removeItem("loginData");
    navigate("/");
  };

  const sidebar = [
    { page: "dashboard",    label: "Dashboard",      icon: "📊" },
    { page: "history",      label: "Medical History", icon: "📁" },
    { page: "appointment",  label: "Appointment",     icon: "📅" },
    { page: "reports",      label: "Medical Report",  icon: "📋" },
    { page: "prescription", label: "Prescription",    icon: "💊" },
    { page: "billing",      label: "Billing",         icon: "💳" },
  ];

  return (
    <>
      <nav className="mc-nav">
        <div className="mc-nav-logo">
          <img src="/logo.png" alt="MedCare" />
          <h2>Med<span>Care</span></h2>
        </div>
        <ul className="mc-nav-links">
          <li><button onClick={() => setActivePage("home")}>Home</button></li>
          <li><button onClick={() => setActivePage("profile")}>Profile</button></li>
          <li><button onClick={() => setActivePage("notifications")}>Notifications</button></li>
          <li><button className="mc-nav-logout" onClick={logout}>Logout</button></li>
        </ul>
      </nav>

      <div className="mc-layout">
        <aside className="mc-sidebar">
          <div className="mc-sidebar-label">Patient Panel</div>
          {sidebar.map((s) => (
            <SidebarBtn key={s.page} {...s} activePage={activePage} setActivePage={setActivePage} />
          ))}
        </aside>

        <main className="mc-content">

          {activePage === "home" && (
            <div className="mc-welcome">
              <h2>
                💙 Welcome, {patient?.firstname
                  ? `${patient.firstname} ${patient.lastname || ""}`.trim()
                  : "Patient"}!
              </h2>
              <p>View appointments, reports, prescriptions and billing details from MedCare Hospital.</p>
            </div>
          )}

          {activePage === "profile" && (
            <EditProfile patient={patient} onProfileUpdate={handleProfileUpdate} />
          )}

          {activePage === "notifications" && (
            <>
              <div className="mc-page-header"><h1>Notifications</h1></div>
              <div className="mc-panel">
                <div className="mc-panel-body">
                  <div className="mc-notif-list">
                    {[
                      ["Upcoming appointment tomorrow.", "Today"],
                      ["Medical report uploaded.", "Yesterday"],
                      ["Prescription updated.", "2 days ago"],
                    ].map(([m, t], i) => (
                      <div className="mc-notif-item" key={i}>
                        <div className="mc-notif-dot" />
                        <div><p>{m}</p><time>{t}</time></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {activePage === "dashboard"   && <Dashboard patient={patient} />}
          {activePage === "appointment" && <AppointmentPage patient={patient} />}

          {activePage === "history" && (
            <>
              <div className="mc-page-header"><h1>Medical History</h1></div>
              <div className="mc-panel">
                <div className="mc-panel-body">
                  <div className="mc-empty-state"><span>📁</span><p>No medical history records found.</p></div>
                </div>
              </div>
            </>
          )}

          {activePage === "reports"      && <PatientReports      patient={patient} />}
          {activePage === "prescription" && <PatientPrescriptions patient={patient} />}
          {activePage === "billing"      && <PatientBilling       patient={patient} />}

        </main>
      </div>
    </>
  );
}

export default Patient;
export { AppointmentPage, EditProfile };
