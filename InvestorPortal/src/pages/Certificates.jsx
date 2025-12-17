import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatAmount = (amount) => {
  if (!amount) return "0";
  return Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const Certificates = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);

  console.log("Certificates component mounted, user:", user);

  useEffect(() => {
    console.log("useEffect triggered, user:", user);
    const userId = user?._id || user?.id;
    if (userId) {
      console.log("User has ID, calling fetchCertificates");
      fetchCertificates();
    } else {
      console.log("No user ID, setting loading to false");
      setLoading(false);
    }
  }, [user]);

  const fetchCertificates = async () => {
    console.log("Fetching certificates for user:", user);
    const userId = user?._id || user?.id;
    if (!userId) {
      console.log("No user ID found, stopping fetch");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5050';
      console.log("API URL:", API_URL);
      const url = `${API_URL}/api/user/${userId}/certificates`;
      console.log("Fetching from:", url);

      const response = await fetch(url);
      console.log("Response status:", response.status);

      const data = await response.json();
      console.log("Response data:", data);

      if (data.success) {
        setCertificates(data.data);
        console.log("Certificates loaded:", data.data.length);
      } else {
        console.error("API returned success: false", data);
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = (submission) => {
    try {
      if (submission.certificatePdfUrl) {
        // Download from S3
        const link = document.createElement("a");
        link.href = submission.certificatePdfUrl;
        link.download = `Investment_Verification_${submission.certificateNumber}.pdf`;
        link.target = "_blank";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } else {
        alert("Certificate PDF not available. Please contact support.");
      }
    } catch (error) {
      console.error("Error downloading certificate:", error);
      alert("Failed to download certificate");
    }
  };

  const handleViewCertificate = (submission) => {
    try {
      console.log("Certificate URL:", submission.certificatePdfUrl);
      console.log("Full submission:", submission);
      if (submission.certificatePdfUrl) {
        // Open S3 URL in new tab
        const opened = window.open(submission.certificatePdfUrl, "_blank", "noopener,noreferrer");
        if (!opened || opened.closed || typeof opened.closed === "undefined") {
          alert("Popup blocked. Please allow popups for this site and try again.");
        }
      } else {
        alert("Certificate PDF not available. Please contact support.");
      }
    } catch (error) {
      console.error("Error viewing certificate:", error);
      alert("Failed to view certificate");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "400px" }}>
        <div style={{ textAlign: "center" }}>
          <div className="spinner"></div>
          <p>Loading certificates...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <button
          onClick={() => navigate("/dashboard")}
          style={{
            padding: "0.5rem 1rem",
            background: "#64748b",
            color: "white",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
            marginBottom: "1rem",
          }}
        >
          ← Back to Dashboard
        </button>
        <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "0.5rem" }}>
          My Verification Certificates
        </h1>
        <p style={{ color: "#64748b" }}>
          Download your verified investment closure certificates
        </p>
      </div>

      {certificates.length === 0 ? (
        <div
          style={{
            background: "white",
            borderRadius: "12px",
            padding: "3rem",
            textAlign: "center",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          }}
        >
          <div
            style={{
              width: "80px",
              height: "80px",
              background: "#f1f5f9",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 1rem",
            }}
          >
            <svg style={{ width: "40px", height: "40px", color: "#94a3b8" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "600", marginBottom: "0.5rem" }}>
            No Certificates Available
          </h3>
          <p style={{ color: "#64748b", marginBottom: "1.5rem" }}>
            You don't have any verified investment closure certificates yet.
          </p>
          <button
            onClick={() => navigate("/investment-form")}
            style={{
              padding: "0.75rem 1.5rem",
              background: "#3b82f6",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "500",
            }}
          >
            Submit Investment Closure Request
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(350px, 1fr))", gap: "1.5rem" }}>
          {certificates.map((cert) => (
            <div
              key={cert._id}
              style={{
                background: "white",
                borderRadius: "12px",
                padding: "1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                border: "1px solid #e2e8f0",
                transition: "all 0.2s",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginRight: "1rem",
                  }}
                >
                  <svg style={{ width: "24px", height: "24px", color: "white" }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      background: "#dcfce7",
                      color: "#166534",
                      padding: "0.25rem 0.75rem",
                      borderRadius: "999px",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      display: "inline-block",
                    }}
                  >
                    VERIFIED
                  </div>
                </div>
              </div>

              <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                {cert.personalInfo?.fullName}
              </h3>

              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem", marginBottom: "1rem" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", fontSize: "0.875rem" }}>
                  <div>
                    <span style={{ color: "#64748b" }}>Cert No:</span>
                    <br />
                    <strong>{cert.certificateNumber}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Amount:</span>
                    <br />
                    <strong>AED {formatAmount(cert.investmentDetails?.amount)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Generated:</span>
                    <br />
                    <strong>{formatDate(cert.certificateGeneratedAt)}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Verified By:</span>
                    <br />
                    <strong>{cert.verifiedBy || "System"}</strong>
                  </div>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  onClick={() => handleViewCertificate(cert)}
                  style={{
                    flex: 1,
                    padding: "0.625rem",
                    background: "#f1f5f9",
                    color: "#475569",
                    border: "1px solid #cbd5e1",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "0.875rem",
                  }}
                >
                  View
                </button>
                <button
                  onClick={() => handleDownloadCertificate(cert)}
                  style={{
                    flex: 1,
                    padding: "0.625rem",
                    background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)",
                    color: "white",
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontWeight: "500",
                    fontSize: "0.875rem",
                  }}
                >
                  Download
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Certificates;
