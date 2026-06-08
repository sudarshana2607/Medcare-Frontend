import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "axios";

const API = "https://medcare-hms-backend.onrender.com/api";

const S = {
  page: {
    minHeight: "100vh",
    display: "flex",
    fontFamily: "'Segoe UI', sans-serif",
    background: "linear-gradient(135deg, #f5f3ff 0%, #ede9fe 50%, #ddd6fe 100%)",
  },
  left: {
    flex: "0 0 42%",
    background: "linear-gradient(160deg, #7c3aed 0%, #6d28d9 50%, #4c1d95 100%)",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "3rem 2.5rem",
    color: "#fff",
    position: "relative",
    overflow: "hidden",
  },
  leftOverlay: {
    position: "absolute", inset: 0,
    background: "radial-gradient(circle at 30% 70%, rgba(255,255,255,0.08) 0%, transparent 60%)",
    pointerEvents: "none",
  },
  logoRow: { display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2.5rem" },
  logoImg: { width: 52, height: 52, borderRadius: 12, background: "#fff", padding: 4 },
  logoText: { fontSize: "1.8rem", fontWeight: 800, letterSpacing: "-0.5px" },
  tagline: { fontSize: "0.95rem", opacity: 0.75, margin: "0 0 2.5rem", textAlign: "center" },
  featureList: { listStyle: "none", padding: 0, margin: 0, width: "100%" },
  featureItem: {
    display: "flex", alignItems: "center", gap: "0.75rem",
    padding: "0.75rem 1rem", marginBottom: "0.6rem",
    background: "rgba(255,255,255,0.1)", borderRadius: 10,
    fontSize: "0.9rem",
  },
  featureIcon: { fontSize: "1.25rem", flexShrink: 0 },
  right: {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    padding: "2rem",
    overflowY: "auto",
  },
  card: {
    width: "100%",
    maxWidth: 440,
    background: "#fff",
    borderRadius: 20,
    padding: "2.5rem 2.2rem",
    boxShadow: "0 8px 40px rgba(124,58,237,0.12)",
  },
  cardTitle: { fontSize: "1.6rem", fontWeight: 800, color: "#1e1b4b", margin: "0 0 0.35rem" },
  cardSub: { fontSize: "0.88rem", color: "#6b7280", margin: "0 0 1.8rem" },
  label: { display: "block", fontSize: "0.8rem", fontWeight: 600, color: "#374151", marginBottom: 5 },
  input: {
    width: "100%", padding: "10px 14px", borderRadius: 10,
    border: "1.5px solid #e5e7eb", fontSize: "0.9rem",
    outline: "none", boxSizing: "border-box", transition: "border-color 0.2s",
  },
  row: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "1rem" },
  group: { marginBottom: "1rem" },
  errText: { fontSize: "0.78rem", color: "#ef4444", marginTop: 3 },
  loginErrBox: {
    background: "#fef2f2", border: "1px solid #fecaca", borderRadius: 8,
    padding: "0.7rem 1rem", fontSize: "0.85rem", color: "#dc2626",
    marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem",
  },
  successBox: {
    background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 8,
    padding: "0.7rem 1rem", fontSize: "0.85rem", color: "#16a34a",
    marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem",
  },
  submitBtn: {
    width: "100%", padding: "12px", borderRadius: 10, border: "none",
    background: "linear-gradient(135deg, #7c3aed, #6d28d9)",
    color: "#fff", fontSize: "1rem", fontWeight: 700,
    cursor: "pointer", transition: "opacity 0.2s", marginTop: "0.5rem",
  },
  bottomRow: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    marginTop: "1rem", fontSize: "0.83rem",
  },
  checkLabel: { display: "flex", alignItems: "center", gap: "0.4rem", color: "#374151", cursor: "pointer" },
  forgotBtn: { background: "none", border: "none", color: "#7c3aed", fontSize: "0.83rem", cursor: "pointer", fontWeight: 600 },
  forgotBox: {
    marginTop: "1.2rem", background: "#f5f3ff", borderRadius: 12,
    padding: "1.25rem", border: "1px solid #ddd6fe",
  },
  forgotTitle: { fontSize: "0.95rem", fontWeight: 700, color: "#4c1d95", margin: "0 0 1rem" },
  forgotInput: {
    width: "100%", padding: "9px 12px", borderRadius: 8,
    border: "1.5px solid #ddd6fe", fontSize: "0.88rem",
    outline: "none", boxSizing: "border-box", marginBottom: "0.6rem",
  },
  forgotSubmit: {
    width: "100%", padding: "9px", borderRadius: 8,
    background: "#7c3aed", color: "#fff", border: "none",
    fontWeight: 700, fontSize: "0.9rem", cursor: "pointer",
  },
  divider: { display: "flex", alignItems: "center", gap: "0.75rem", margin: "1.2rem 0", color: "#9ca3af", fontSize: "0.8rem" },
  divLine: { flex: 1, height: 1, background: "#e5e7eb" },
  signupRow: { textAlign: "center", marginTop: "1.5rem", fontSize: "0.85rem", color: "#6b7280" },
  signupLink: { color: "#7c3aed", fontWeight: 700, textDecoration: "none" },
  adminBadge: {
    display: "inline-flex", alignItems: "center", gap: "0.4rem",
    background: "#ede9fe", color: "#7c3aed",
    padding: "4px 14px", borderRadius: 20, fontSize: "0.8rem",
    fontWeight: 700, marginBottom: "1rem",
  },
  toggleRow: {
    display: "flex", gap: "0.5rem", marginBottom: "1.5rem",
  },
  toggleBtn: (active) => ({
    flex: 1, padding: "9px", borderRadius: 10, fontSize: "0.85rem", fontWeight: 700,
    border: active ? "2px solid #7c3aed" : "2px solid #e5e7eb",
    background: active ? "#ede9fe" : "#f9fafb",
    color: active ? "#7c3aed" : "#6b7280",
    cursor: "pointer", transition: "all 0.15s",
  }),
};

const ROLE_ICONS = {
  doctor: "🩺",
  patient: "🧑‍⚕️",
  labstaff: "🔬",
  pharmacystaff: "💊",
};

// Non-admin roles only
const OTHER_ROLES = [
  ["doctor", "Doctor"],
  ["patient", "Patient"],
  ["labstaff", "Lab Staff"],
  ["pharmacystaff", "Pharmacy"],
];

function Login() {
  const navigate = useNavigate();

  // "admin" or "other" — controls which form shows
  const [loginType, setLoginType] = useState("other");

  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    email: "",
    password: "",
    role: "patient",   // default for non-admin
    remember: false,
  });

  const [errors, setErrors]          = useState({});
  const [successMessage, setSuccess] = useState("");
  const [loginError, setLoginError]  = useState("");
  const [forgotMode, setForgotMode]  = useState(false);
  const [newPwd, setNewPwd]          = useState("");
  const [confirmPwd, setConfirmPwd]  = useState("");
  const [showPwd, setShowPwd]        = useState(false);

  const handleChange = (e) => {
    const { name, value, checked, type } = e.target;
    setFormData((p) => ({ ...p, [name]: type === "checkbox" ? checked : value }));
    setErrors((p) => ({ ...p, [name]: "" }));
    setLoginError("");
  };

  const handleToggle = (type) => {
    setLoginType(type);
    setErrors({});
    setLoginError("");
    setSuccess("");
    // Reset role to sensible default when switching
    setFormData((p) => ({ ...p, role: type === "admin" ? "admin" : "patient" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};
    if (!formData.email)    newErrors.email    = "Email required";
    if (!formData.password) newErrors.password = "Password required";
    setErrors(newErrors);
    if (Object.keys(newErrors).length) return;

    // Role: hardcoded "admin" for admin tab, selected role for others
    const role = loginType === "admin" ? "admin" : formData.role;

    try {
      const response = await axios.post(`${API}/user/login`, {
        email:    formData.email,
        password: formData.password,
        role,
      });

      const user = response.data.user;

      const savedUser = {
        _id:       user._id,
        firstname: user.firstname,
        lastname:  user.lastname,
        phone:     user.phone || "",
        email:     user.email,
        role:      user.role || role,
      };

      if (formData.remember) {
        localStorage.setItem("loginData", JSON.stringify(savedUser));
      } else {
        sessionStorage.setItem("loginData", JSON.stringify(savedUser));
        localStorage.setItem("loginData", JSON.stringify(savedUser));
      }

      setSuccess("Login Successful… Redirecting…");

      setTimeout(() => {
        const r = (user.role || role).trim().toLowerCase();
        if      (r === "admin")         navigate("/admin");
        else if (r === "doctor")        navigate("/doctor");
        else if (r === "patient")       navigate("/patient");
        else if (r === "labstaff")      navigate("/labstaff");
        else if (r === "pharmacystaff") navigate("/pharmacystaff");
        else                            navigate("/");
      }, 900);

    } catch (err) {
      setLoginError(err.response?.data?.message || "Login failed. Check your credentials.");
    }
  };

  const handleForgot = () => {
    if (!newPwd)               { alert("Enter new password");     return; }
    if (newPwd !== confirmPwd) { alert("Passwords do not match"); return; }
    alert("Password changed successfully");
    setForgotMode(false); setNewPwd(""); setConfirmPwd("");
  };

  const isAdmin = loginType === "admin";

  return (
    <div style={S.page}>

      {/* ── LEFT PANEL ── */}
      <div style={S.left}>
        <div style={S.leftOverlay} />
        <div style={S.logoRow}>
          <img src="/logo.png" alt="MedCare" style={S.logoImg} />
          <span style={S.logoText}>MedCare</span>
        </div>
        <p style={S.tagline}>Hospital Management System</p>
        <ul style={S.featureList}>
          {[
            ["📅", "Book & manage appointments"],
            ["🩺", "Doctor & patient records"],
            ["🔬", "Lab test & report tracking"],
            ["💊", "Pharmacy & billing system"],
            ["📊", "Admin analytics dashboard"],
            ["🔒", "Secure role-based access"],
          ].map(([icon, text]) => (
            <li key={text} style={S.featureItem}>
              <span style={S.featureIcon}>{icon}</span>
              {text}
            </li>
          ))}
        </ul>
        <p style={{ ...S.tagline, marginTop: "2rem", marginBottom: 0, fontSize: "0.8rem" }}>
          © 2026 MedCare Hospital. All rights reserved.
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={S.right}>
        <div style={S.card}>

          <h1 style={S.cardTitle}>Welcome back 👋</h1>
          <p style={S.cardSub}>Log in to your MedCare account</p>

          {/* ── Toggle: Admin / Staff & Patients ── */}
          <div style={S.toggleRow}>
            <button style={S.toggleBtn(!isAdmin)} onClick={() => handleToggle("other")}>
              👥 Staff & Patients
            </button>
            <button style={S.toggleBtn(isAdmin)} onClick={() => handleToggle("admin")}>
              🛡️ Admin
            </button>
          </div>

          {/* ── Role pills — only for non-admin ── */}
          {!isAdmin && (
            <div style={S.group}>
              <label style={S.label}>Select Your Role</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                {OTHER_ROLES.map(([val, lbl]) => (
                  <button key={val} type="button"
                    onClick={() => setFormData(p => ({ ...p, role: val }))}
                    style={{
                      padding: "6px 14px", borderRadius: 20, fontSize: "0.82rem", fontWeight: 600,
                      border: formData.role === val ? "2px solid #7c3aed" : "2px solid #e5e7eb",
                      background: formData.role === val ? "#ede9fe" : "#f9fafb",
                      color: formData.role === val ? "#7c3aed" : "#374151",
                      cursor: "pointer", transition: "all 0.15s",
                    }}>
                    {ROLE_ICONS[val]} {lbl}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ── Admin badge — only for admin ── */}
          {isAdmin && (
            <div style={S.adminBadge}>🛡️ Admin Portal — Restricted Access</div>
          )}

          {/* Name row */}
          <div style={S.row}>
            <div>
              <label style={S.label}>First Name</label>
              <input style={S.input} name="firstname" placeholder="First name"
                value={formData.firstname} onChange={handleChange} />
            </div>
            <div>
              <label style={S.label}>Last Name</label>
              <input style={S.input} name="lastname" placeholder="Last name"
                value={formData.lastname} onChange={handleChange} />
            </div>
          </div>

          {/* Email */}
          <div style={S.group}>
            <label style={S.label}>Email Address *</label>
            <input style={S.input} type="email" name="email" placeholder="you@example.com"
              value={formData.email} onChange={handleChange} />
            {errors.email && <p style={S.errText}>⚠️ {errors.email}</p>}
          </div>

          {/* Password */}
          <div style={S.group}>
            <label style={S.label}>Password *</label>
            <div style={{ position: "relative" }}>
              <input
                style={{ ...S.input, paddingRight: 44 }}
                type={showPwd ? "text" : "password"}
                name="password" placeholder="Enter password"
                value={formData.password} onChange={handleChange}
              />
              <button type="button" onClick={() => setShowPwd(p => !p)}
                style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)",
                  background: "none", border: "none", cursor: "pointer", fontSize: "1rem", color: "#6b7280" }}>
                {showPwd ? "🙈" : "👁️"}
              </button>
            </div>
            {errors.password && <p style={S.errText}>⚠️ {errors.password}</p>}
          </div>

          {/* Error / Success */}
          {loginError     && <div style={S.loginErrBox}>⚠️ {loginError}</div>}
          {successMessage && <div style={S.successBox}>✅ {successMessage}</div>}

          {/* Submit */}
          <button style={S.submitBtn} onClick={handleSubmit}>
            {isAdmin ? "Log In as Admin →" : "Log In →"}
          </button>

          {/* Remember + Forgot */}
          <div style={S.bottomRow}>
            <label style={S.checkLabel}>
              <input type="checkbox" name="remember" checked={formData.remember} onChange={handleChange} />
              Remember me
            </label>
            <button type="button" style={S.forgotBtn} onClick={() => setForgotMode(p => !p)}>
              Forgot Password?
            </button>
          </div>

          {/* Forgot password box */}
          {forgotMode && (
            <div style={S.forgotBox}>
              <p style={S.forgotTitle}>🔑 Reset Password</p>
              <input style={S.forgotInput} type="password" placeholder="New Password"
                value={newPwd} onChange={(e) => setNewPwd(e.target.value)} />
              <input style={S.forgotInput} type="password" placeholder="Confirm Password"
                value={confirmPwd} onChange={(e) => setConfirmPwd(e.target.value)} />
              <button style={S.forgotSubmit} onClick={handleForgot}>Change Password</button>
            </div>
          )}

          <div style={S.divider}>
            <span style={S.divLine} />
            <span>or</span>
            <span style={S.divLine} />
          </div>

          <div style={S.signupRow}>
            Don't have an account?{" "}
            <Link to="/signin" style={S.signupLink}>Create Account</Link>
          </div>

        </div>
      </div>

    </div>
  );
}

export default Login;
