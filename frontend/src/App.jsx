import React, { useEffect, useState } from "react";
import axios from "axios";

const App = () => {
  const [domains, setDomains] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState("");
  const [emails, setEmails] = useState([]);
  const [newEmail, setNewEmail] = useState("");

  useEffect(() => {
    axios.get("http://localhost:8000/domains").then(res => {
      setDomains(res.data);
      if (res.data.length > 0) setSelected(res.data[0]);
    });
  }, []);

  useEffect(() => {
    if (selected)
      axios.get(`http://localhost:8000/emails/${selected}`).then(res => {
        setEmails(res.data);
      });
  }, [selected]);

  const addEmail = () => {
    if (!newEmail.trim()) return;
    axios
      .post(`http://localhost:8000/emails/${selected}/add`, { email: newEmail })
      .then(() => {
        setNewEmail("");
        return axios.get(`http://localhost:8000/emails/${selected}`);
      })
      .then(res => setEmails(res.data))
      .catch(err => alert(err.response?.data?.detail || "Failed to add email"));
  };

  const handleDelete = email => {
    axios
      .post(`http://localhost:8000/emails/${selected}/delete`, { email })
      .then(() => {
        setEmails(emails.filter(e => e !== email));
      })
      .catch(err => alert(err.response?.data?.detail || "Delete failed"));
  };

  const downloadCSV = () => {
    window.open("http://localhost:8000/download_csv", "_blank");
  };

  const filteredDomains = domains.filter(d =>
    d.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1>
          <span role="img" aria-label="email">📧</span> Wesley George's Recruiters Email
        </h1>
        <button
          onClick={downloadCSV}
          style={{
            backgroundColor: "#6c757d",
            color: "white",
            padding: "0.5rem 1rem",
            fontSize: "0.9rem",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}>
          📥 Download CSV
        </button>
      </div>

      <input
        placeholder="Search domain..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        style={{
          padding: "0.5rem",
          width: "100%",
          marginBottom: "0.75rem",
          fontSize: "1rem"
        }}
      />

      <select
        value={selected}
        onChange={e => setSelected(e.target.value)}
        style={{
          padding: "0.5rem",
          fontSize: "1rem",
          width: "100%",
          marginBottom: "1rem"
        }}
      >
        {filteredDomains.map(d => (
          <option key={d} value={d}>
            {d}
          </option>
        ))}
      </select>

      <h2>
        Emails under <strong>{selected}</strong>
      </h2>

      <div style={{
        maxHeight: "300px",
        overflowY: "auto",
        border: "1px solid #ccc",
        padding: "1rem",
        borderRadius: "5px",
        marginBottom: "1.5rem"
      }}>
        {emails.length === 0 ? (
          <p>No emails found under <strong>{selected}</strong>.</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
            {emails.map(e => (
              <li key={e} style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                borderBottom: "1px solid #eee",
                padding: "0.5rem 0"
              }}>
                <span style={{ wordBreak: "break-all" }}>{e}</span>
                <button
                  onClick={() => handleDelete(e)}
                  style={{
                    backgroundColor: "#dc3545",
                    color: "white",
                    border: "none",
                    padding: "0.3rem 0.6rem",
                    borderRadius: "4px",
                    cursor: "pointer",
                    fontSize: "0.9rem"
                  }}
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <input
          value={newEmail}
          onChange={e => setNewEmail(e.target.value)}
          placeholder="Add new email"
          style={{ flex: 1, padding: "0.5rem", fontSize: "1rem" }}
        />
        <button
          onClick={addEmail}
          style={{
            backgroundColor: "#28a745",
            color: "white",
            padding: "0.5rem 1rem",
            fontSize: "1rem",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer"
          }}
        >
          + Add Email
        </button>
      </div>
    </div>
  );
};

export default App;
