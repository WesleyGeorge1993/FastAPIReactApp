import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const API_BASE_URL = process.env.REACT_APP_API_URL;

const AuthPage = () => {
  const [mode, setMode] = useState("login"); // "login" or "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleAuth = async () => {
    try {
      if (mode === "register") {
        await axios.post(`${API_BASE_URL}/register`, { email, password });
        alert("Registered successfully. Please login.");
        setMode("login");
        return;
      }

      const form = new URLSearchParams();
      form.append("username", email);
      form.append("password", password);

      const res = await axios.post(`${API_BASE_URL}/token`, form);
      localStorage.setItem("token", res.data.access_token);
      localStorage.setItem("user", email);
      navigate("/dashboard");
    } catch (err) {
      alert(err.response?.data?.detail || "Authentication failed.");
    }
  };

  return (
    <div style={{
      display: "flex",
      minHeight: "100vh",
      fontFamily: "sans-serif",
      background: "linear-gradient(to right, #f8fafc, #e2e8f0)"
    }}>
      {/* LEFT: PROFILE + APP INTRO */}
      <div style={{
        flex: 1,
        backgroundColor: "#ffffff",
        padding: "3rem",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "center",
        boxShadow: "2px 0 10px rgba(0,0,0,0.05)"
      }}>
        <img
          src="/profile.jpg"
          alt="Wesley George"
          style={{
            width: "180px",
            height: "180px",
            borderRadius: "50%",
            objectFit: "cover",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            marginBottom: "1.5rem"
          }}
        />
        <h2 style={{ margin: "0 0 0.5rem 0", fontWeight: "bold" }}>Wesley George</h2>
        <p style={{ fontSize: "0.95rem", marginBottom: "1rem", color: "#333" }}>
          <strong>DevOps Architect | SRE | Cloud Engineer</strong>
        </p>
        <p style={{ fontSize: "0.9rem", lineHeight: 1.5, textAlign: "center", color: "#555" }}>
          Hi, I’m Wesley — a DevOps & SRE engineer with 10+ years of experience in architecting secure, scalable infrastructure
          across AWS, Azure, GCP & on-prem. This app is a reflection of my journey — built to simplify, automate, and deliver
          real value through clean engineering.
        </p>

        <p style={{ fontSize: "0.9rem", lineHeight: 1.5, textAlign: "center", marginTop: "1rem", color: "#444" }}>
        <strong>About this App:</strong><br />
        <em>Email Group Viewer</em> is a smart, DevOps-inspired tool built to help you organize recruiter emails by domain, manage contacts efficiently, and download structured CSV reports — all within a secure, modern interface.
        </p>

      </div>

      {/* RIGHT: FORM SECTION */}
      <div style={{
        flex: 1,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: "4rem"
      }}>
        <div style={{
          width: "100%",
          maxWidth: "400px",
          background: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          padding: "2rem"
        }}>
          <h2 style={{ textAlign: "center", marginBottom: "1rem" }}>
            {mode === "login" ? "🔐 Login" : "✍️ Register"}
          </h2>

          <input
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            style={inputStyle}
          />
          <input
            placeholder="Password"
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            style={inputStyle}
          />
          <button onClick={handleAuth} style={buttonStyle}>
            {mode === "login" ? "Login" : "Register"}
          </button>

          <p style={{ textAlign: "center", marginTop: "1rem", fontSize: "0.9rem" }}>
            {mode === "login" ? "Don't have an account?" : "Already have an account?"}{" "}
            <span
              style={{ color: "#007bff", cursor: "pointer", fontWeight: "bold" }}
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Register here" : "Login instead"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

const inputStyle = {
  width: "100%",
  padding: "0.75rem",
  fontSize: "1rem",
  marginBottom: "1rem",
  borderRadius: "6px",
  border: "1px solid #ccc"
};

const buttonStyle = {
  width: "100%",
  padding: "0.75rem",
  fontSize: "1rem",
  backgroundColor: "#007bff",
  color: "white",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer"
};

export default AuthPage;
