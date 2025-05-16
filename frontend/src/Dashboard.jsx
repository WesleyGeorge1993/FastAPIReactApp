import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaTrashAlt } from "react-icons/fa"; // 🔥 Added icon import

const API_BASE_URL = process.env.REACT_APP_API_URL;

const Dashboard = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");

  const [domains, setDomains] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    axios.get(`${API_BASE_URL}/domains`).then((res) => {
      setDomains(res.data);
      if (res.data.length > 0) setSelected(res.data[0]);
    });
  }, []);

  useEffect(() => {
    if (selected) {
      axios.get(`${API_BASE_URL}/emails/${selected}`).then((res) => {
        setEmails(res.data);
      });
    }
  }, [selected]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    navigate("/");
  };

  const addEmail = () => {
    setError("");
    if (!newEmail.trim()) return;
    if (emails.includes(newEmail.trim().toLowerCase())) {
      setError("Email already exists under this domain.");
      return;
    }
    axios
      .post(`${API_BASE_URL}/emails/${selected}/add`, { email: newEmail })
      .then(() => {
        setNewEmail("");
        return axios.get(`${API_BASE_URL}/emails/${selected}`);
      })
      .then((res) => setEmails(res.data))
      .catch((err) => alert(err.response?.data?.detail || "Failed to add email"));
  };

  const handleDelete = (email) => {
    axios
      .post(`${API_BASE_URL}/emails/${selected}/delete`, { email })
      .then(() => {
        setEmails(emails.filter((e) => e !== email));
      })
      .catch((err) => alert(err.response?.data?.detail || "Delete failed"));
  };

  const handleDeleteDomain = (domainToDelete) => {
    const confirmation = prompt(`Type "${domainToDelete}" to confirm deletion:`);

    if (confirmation !== domainToDelete) {
      alert("Confirmation does not match. Domain not deleted.");
      return;
    }

    axios
      .post(`${API_BASE_URL}/domains/delete`, {
        domain: domainToDelete,
        confirm: confirmation
      })
      .then(() => {
        alert(`Domain "${domainToDelete}" deleted successfully.`);
        setDomains(domains.filter((d) => d !== domainToDelete));
        if (selected === domainToDelete) setSelected("");
      })
      .catch((err) => {
        alert(err.response?.data?.detail || "Domain deletion failed.");
      });
  };

  const downloadCSV = () => {
    axios
      .get(`${API_BASE_URL}/download_csv`, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: "blob",
      })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement("a");
        link.href = url;
        link.setAttribute("download", "emails.csv");
        document.body.appendChild(link);
        link.click();
      })
      .catch(() => alert("Download failed or unauthorized."));
  };

  const filteredDomains = domains.filter((d) =>
    d.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ background: "#f8fafc", minHeight: "100vh", padding: "2rem", display: "flex" }}>
      
      {/* Sidebar */}
      <div
        style={{
          width: "250px",
          maxHeight: "600px",
          overflowY: "auto",
          border: "1px solid #ccc",
          borderRadius: "10px",
          padding: "1rem",
          marginRight: "2rem",
          backgroundColor: "#ffffff",
        }}
      >
        <h3>📁 <strong>Domains</strong></h3>
        <input
          placeholder="Search domain..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem",
            marginBottom: "1rem",
            borderRadius: "6px",
            border: "1px solid #ccc"
          }}
        />
        {filteredDomains.map((d) => (
          <div
            key={d}
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              padding: "0.25rem 0",
              backgroundColor: d === selected ? "#e6f0ff" : "transparent",
              borderRadius: "4px"
            }}
          >
            <span
              onClick={() => setSelected(d)}
              style={{
                cursor: "pointer",
                color: d === selected ? "#0d6efd" : "#333",
                fontWeight: d === selected ? "bold" : "normal",
                flex: 1,
                paddingRight: "0.5rem"
              }}
            >
              {d}
            </span>
            <button
              style={{
                backgroundColor: "#dc3545",
                color: "white",
                border: "none",
                padding: "0.25rem",
                borderRadius: "4px",
                cursor: "pointer",
              }}
              onClick={() => handleDeleteDomain(d)}
            >
              <FaTrashAlt size={14} />
            </button>
          </div>
        ))}
      </div>

      {/* Main Panel */}
      <div
        style={{
          flex: 1,
          background: "#ffffff",
          borderRadius: "12px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          padding: "2rem",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "2rem",
          }}
        >
          <h2>👋 Welcome, <strong>{user}</strong></h2>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <button
              onClick={downloadCSV}
              style={{
                backgroundColor: "#007bff",
                color: "white",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              📥 Download CSV
            </button>
            <button
              onClick={logout}
              style={{
                backgroundColor: "#dc3545",
                color: "white",
                padding: "0.5rem 1rem",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          </div>
        </div>

        <h3>📧 Emails under <strong>{selected}</strong></h3>
        

        <div
          style={{
            maxHeight: "300px",
            overflowY: "auto",
            border: "1px solid #eee",
            borderRadius: "8px",
            backgroundColor: "#fdfdfd",
            padding: "1rem",
            marginBottom: "2rem",
          }}
        >
          {emails.length === 0 ? (
            <p style={{ color: "#777" }}>No emails found under <strong>{selected}</strong>.</p>
          ) : (
            emails.map((email) => (
              <div
                key={email}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "0.5rem 0",
                  borderBottom: "1px solid #f1f1f1",
                }}
              >
                <span>{email}</span>
                <button
                  onClick={() => handleDelete(email)}
                  style={{
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                  }}
                >
                  <FaTrashAlt size={12} />
                </button>
              </div>
            ))
          )}
        </div>

        {error && <p style={{ color: "red", marginBottom: "1rem" }}>{error}</p>}

        <div style={{ display: "flex", gap: "0.5rem" }}>
          <input
            value={newEmail}
            onChange={(e) => setNewEmail(e.target.value)}
            placeholder="Add new email"
            style={{
              flex: 1,
              padding: "0.75rem",
              fontSize: "1rem",
              borderRadius: "6px",
              border: "1px solid #ccc",
            }}
          />
          <button
            onClick={addEmail}
            style={{
              backgroundColor: "#28a745",
              color: "white",
              padding: "0.75rem 1rem",
              fontSize: "1rem",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            + Add Email
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
