import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Import PDF generator utility
const COMPANY_INFO = {
  name: "MAG Financial Services LLC",
  address: "Dubai, United Arab Emirates",
  phone: "+971 X XXXX XXXX",
  email: "info@magfinancial.com",
  website: "www.magfinancial.com",
};

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

const generateVerificationCertificate = (submission) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 20;

  // Header
  doc.setFillColor(41, 128, 185);
  doc.rect(0, 0, pageWidth, 40, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont(undefined, "bold");
  doc.text(COMPANY_INFO.name, pageWidth / 2, 18, { align: "center" });
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.text("Investment Management & Financial Services", pageWidth / 2, 28, { align: "center" });

  yPosition = 50;

  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text("INVESTMENT CLOSURE VERIFICATION CERTIFICATE", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 15;

  // Certificate Number
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.setTextColor(100, 100, 100);
  const certNumber = submission.certificateNumber || `CERT-${submission._id?.slice(-8).toUpperCase()}`;
  const verificationDate = formatDate(submission.certificateGeneratedAt || new Date());
  doc.text(`Certificate No: ${certNumber}`, margin, yPosition);
  doc.text(`Verification Date: ${verificationDate}`, pageWidth - margin, yPosition, { align: "right" });

  yPosition += 15;

  // Verification Statement
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition, pageWidth - margin, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setTextColor(0, 0, 0);
  doc.setFont(undefined, "normal");

  const verificationText = `This is to certify that ${COMPANY_INFO.name} has reviewed and verified the investment closure request submitted by the investor listed below. All documentation has been examined and found to be in order.`;
  const splitText = doc.splitTextToSize(verificationText, pageWidth - (margin * 2));
  doc.text(splitText, margin, yPosition);
  yPosition += (splitText.length * 6) + 10;

  // Investor Information
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, pageWidth - (margin * 2), 8, "F");
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.setTextColor(41, 128, 185);
  doc.text("INVESTOR INFORMATION", margin + 3, yPosition + 5.5);
  yPosition += 12;

  const investorInfo = [
    ["Full Name", submission.personalInfo?.fullName || "N/A"],
    ["Email Address", submission.personalInfo?.email || "N/A"],
    ["Phone Number", submission.personalInfo?.phone || submission.personalInfo?.mobile || "N/A"],
    ["Country", submission.personalInfo?.country || "N/A"],
    ["City", submission.personalInfo?.city || "N/A"],
  ];

  doc.autoTable({
    startY: yPosition,
    head: [],
    body: investorInfo,
    theme: "plain",
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50, textColor: [80, 80, 80] },
      1: { cellWidth: "auto", textColor: [0, 0, 0] },
    },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // Bank Details
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, pageWidth - (margin * 2), 8, "F");
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.setTextColor(41, 128, 185);
  doc.text("BANK ACCOUNT DETAILS", margin + 3, yPosition + 5.5);
  yPosition += 12;

  const bankInfo = [
    ["Bank Name", submission.bankDetails?.bankName || "N/A"],
    ["Account Holder", submission.bankDetails?.accountHolderName || "N/A"],
    ["Account Number", submission.bankDetails?.accountNumber || "N/A"],
    ["IBAN", submission.bankDetails?.iban || "N/A"],
  ];

  doc.autoTable({
    startY: yPosition,
    head: [],
    body: bankInfo,
    theme: "plain",
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50, textColor: [80, 80, 80] },
      1: { cellWidth: "auto", textColor: [0, 0, 0] },
    },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // Investment Details
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, yPosition, pageWidth - (margin * 2), 8, "F");
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.setTextColor(41, 128, 185);
  doc.text("INVESTMENT DETAILS", margin + 3, yPosition + 5.5);
  yPosition += 12;

  const investmentInfo = [
    ["Reference Number", submission.investmentDetails?.referenceNumber || "N/A"],
    ["Court Agreement Number", submission.courtAgreementNumber || "N/A"],
    ["Investment Amount", `AED ${formatAmount(submission.investmentDetails?.amount)}`],
    ["Investment Date", formatDate(submission.investmentDetails?.investmentDate)],
    ["Duration", `${submission.investmentDetails?.duration || 0} months`],
  ];

  doc.autoTable({
    startY: yPosition,
    head: [],
    body: investmentInfo,
    theme: "plain",
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50, textColor: [80, 80, 80] },
      1: { cellWidth: "auto", textColor: [0, 0, 0] },
    },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // Payment Summary
  doc.setFillColor(46, 204, 113);
  doc.rect(margin, yPosition, pageWidth - (margin * 2), 8, "F");
  doc.setFontSize(12);
  doc.setFont(undefined, "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("PAYMENT SUMMARY", margin + 3, yPosition + 5.5);
  yPosition += 12;

  const totalReceived = submission.dividendHistory?.totalReceived || 0;
  const investmentAmount = submission.investmentDetails?.amount || 0;
  const amountToReturn = investmentAmount - totalReceived;

  const paymentSummary = [
    ["Total Investment Amount", `AED ${formatAmount(investmentAmount)}`],
    ["Total Dividends Received", `AED ${formatAmount(totalReceived)}`],
    ["Amount to be Returned", `AED ${formatAmount(amountToReturn)}`],
  ];

  doc.autoTable({
    startY: yPosition,
    head: [],
    body: paymentSummary,
    theme: "striped",
    margin: { left: margin, right: margin },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 70, textColor: [80, 80, 80] },
      1: { cellWidth: "auto", textColor: [22, 101, 52], fontStyle: "bold", fontSize: 11 },
    },
    styles: { fontSize: 10, cellPadding: 4 },
    headStyles: { fillColor: [240, 240, 240] },
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // Signature Section
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  const signatureY = yPosition + 15;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);
  doc.line(margin, signatureY, margin + 60, signatureY);
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Authorized Signature", margin, signatureY + 5);
  doc.setFont(undefined, "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(COMPANY_INFO.name, margin, signatureY + 10);

  doc.line(pageWidth - margin - 60, signatureY, pageWidth - margin, signatureY);
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Company Stamp", pageWidth - margin - 30, signatureY + 5, { align: "center" });

  // Footer
  const footerY = pageHeight - 15;
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, "normal");
  doc.text(COMPANY_INFO.address, pageWidth / 2, footerY, { align: "center" });
  doc.text(`${COMPANY_INFO.phone} | ${COMPANY_INFO.email} | ${COMPANY_INFO.website}`, pageWidth / 2, footerY + 4, { align: "center" });

  return doc;
};

const Certificates = () => {
  const navigate = useNavigate();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const user = JSON.parse(localStorage.getItem("user") || "{}");

  useEffect(() => {
    fetchCertificates();
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:5050/api/user/${user._id}/certificates`);
      const data = await response.json();
      if (data.success) {
        setCertificates(data.data);
      }
    } catch (error) {
      console.error("Error fetching certificates:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadCertificate = (submission) => {
    try {
      const doc = generateVerificationCertificate(submission);
      const fileName = `Investment_Verification_${submission.personalInfo?.fullName?.replace(/\s+/g, "_")}_${new Date().toISOString().split("T")[0]}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error("Error generating certificate:", error);
      alert("Failed to generate certificate");
    }
  };

  const handleViewCertificate = (submission) => {
    try {
      const doc = generateVerificationCertificate(submission);
      const pdfBlob = doc.output("blob");
      const pdfUrl = URL.createObjectURL(pdfBlob);
      window.open(pdfUrl, "_blank");
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
