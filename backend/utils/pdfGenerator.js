const jsPDF = require("jspdf").jsPDF;
require("jspdf-autotable");

// Company Information
const COMPANY_INFO = {
  name: "Matajar Group",
  subtitle: "Legal Review & Settlement Processing Division",
  poweredBy: "Powered by Mirage by MAG Investment LLC",
  address: "Dubai, United Arab Emirates",
  phone: "+971 X XXXX XXXX",
  email: "info@matajargroup.com",
  website: "www.matajargroup.com",
};

// Color Palette - Gold & Black
const COLORS = {
  gold: [212, 175, 55],      // #D4AF37
  black: [10, 10, 10],        // #0a0a0a
  darkGray: [17, 17, 17],     // #111111
  lightGray: [245, 245, 245], // #f5f5f5
  white: [255, 255, 255],
  tableHeader: [212, 175, 55, 0.1], // Gold with opacity
};

/**
 * Format date to readable string
 */
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/**
 * Format amount with thousand separators
 */
const formatAmount = (amount) => {
  if (!amount) return "0.00";
  return Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Generate Investment Verification Certificate PDF - Professional Single Page Design
 * @param {Object} submission - The legal submission data
 * @returns {Buffer} - The generated PDF as buffer
 */
const generateVerificationCertificate = (submission) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ===== DECORATIVE DOUBLE BORDER =====
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
  doc.setLineWidth(0.3);
  doc.rect(11, 11, pageWidth - 22, pageHeight - 22);

  // ===== HEADER - ELEGANT GOLD & BLACK =====
  let yPosition = 25;

  // Company Name - Bold Gold
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...COLORS.gold);
  doc.text(COMPANY_INFO.name, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 7;

  // Subtitle - Black
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.black);
  doc.text(COMPANY_INFO.subtitle, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 5;

  // Powered By - Gray
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(COMPANY_INFO.poweredBy, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 12;

  // Gold Decorative Divider Line
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.line(margin + 30, yPosition, pageWidth - margin - 30, yPosition);
  yPosition += 10;

  // ===== CERTIFICATE TITLE =====
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.gold);
  doc.text("INVESTMENT VERIFICATION CERTIFICATE", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 12;

  // Certificate Number & Date
  const certNumber = submission.certificateNumber || `CERT-${submission._id.toString().slice(-8).toUpperCase()}`;
  const verificationDate = formatDate(submission.certificateGeneratedAt || new Date());

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`Certificate No: ${certNumber}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 5;
  doc.text(`Verification Date: ${verificationDate}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 12;

  // ===== VERIFICATION STATEMENT - ELEGANT PARAGRAPH =====
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.black);
  doc.setFont("helvetica", "normal");

  const investorName = submission.personalInfo?.fullName || "N/A";
  const investmentAmount = formatAmount(submission.investmentDetails?.amount || 0);
  const accountNumber = submission.bankDetails?.accountNumber || "N/A";
  const bankName = submission.bankDetails?.bankName || "N/A";
  const investmentDate = formatDate(submission.investmentDetails?.investmentDate);
  const totalDividends = formatAmount(submission.dividendHistory?.totalReceived || 0);
  const amountToReturn = formatAmount((submission.investmentDetails?.amount || 0) - (submission.dividendHistory?.totalReceived || 0));

  const statement = `This certificate verifies that ${COMPANY_INFO.name} has thoroughly reviewed and confirmed the investment closure request submitted by ${investorName}. The investor's records, including investment of AED ${investmentAmount} made on ${investmentDate}, bank account ${accountNumber} (${bankName}), and total dividends received of AED ${totalDividends}, have been verified against our internal records. Following successful verification, the net settlement amount of AED ${amountToReturn} will be processed for return to the investor's designated bank account as per company policy.`;

  const splitStatement = doc.splitTextToSize(statement, pageWidth - (margin * 2) - 10);

  // Subtle background box for statement
  doc.setFillColor(252, 252, 250);
  const statementHeight = (splitStatement.length * 5.5) + 8;
  doc.roundedRect(margin + 5, yPosition - 3, pageWidth - (margin * 2) - 10, statementHeight, 3, 3, "F");

  // Statement text
  doc.setTextColor(...COLORS.black);
  doc.text(splitStatement, margin + 8, yPosition + 2);
  yPosition += statementHeight + 10;

  // ===== PROFESSIONAL TABLE WITH BETTER ALIGNMENT =====
  const tableData = [
    ["Investor Name", investorName, "Investment Amount", `AED ${investmentAmount}`],
    ["Bank Account", accountNumber, "Bank Name", bankName],
    ["Investment Date", investmentDate, "Dividends Received", `AED ${totalDividends}`],
    ["Certificate Number", certNumber, "Settlement Amount", `AED ${amountToReturn}`],
  ];

  doc.autoTable({
    startY: yPosition,
    head: [],
    body: tableData,
    theme: "grid",
    margin: { left: margin + 5, right: margin + 5 },
    styles: {
      fontSize: 9,
      cellPadding: 4,
      lineColor: COLORS.gold,
      lineWidth: 0.3,
      font: "helvetica",
    },
    columnStyles: {
      0: {
        fontStyle: "bold",
        cellWidth: 45,
        textColor: [60, 60, 60],
        halign: "left",
        fillColor: [250, 248, 245],
      },
      1: {
        cellWidth: 50,
        textColor: COLORS.black,
        halign: "left",
        fillColor: COLORS.white,
      },
      2: {
        fontStyle: "bold",
        cellWidth: 45,
        textColor: [60, 60, 60],
        halign: "left",
        fillColor: [250, 248, 245],
      },
      3: {
        cellWidth: 50,
        textColor: COLORS.black,
        halign: "left",
        fontStyle: "bold",
        fillColor: COLORS.white,
      },
    },
    headStyles: {
      fillColor: COLORS.gold,
      textColor: COLORS.white,
      fontStyle: "bold",
    },
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // ===== SIGNATURE SECTION =====
  // Gold Divider
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.8);
  doc.line(margin + 30, yPosition, pageWidth - margin - 30, yPosition);
  yPosition += 12;

  // Signature positions
  const signatureY = yPosition;
  const leftX = margin + 35;
  const rightX = pageWidth - margin - 55;

  // Left: Authorized Signature
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(leftX, signatureY, leftX + 45, signatureY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.black);
  doc.text("Authorized Signature", leftX + 22.5, signatureY + 6, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  if (submission.verifiedBy) {
    doc.text(`Verified by: ${submission.verifiedBy}`, leftX + 22.5, signatureY + 11, { align: "center" });
  }

  // Right: Company Seal
  doc.setDrawColor(...COLORS.gold);
  doc.line(rightX, signatureY, rightX + 45, signatureY);

  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.black);
  doc.text("Company Seal", rightX + 22.5, signatureY + 6, { align: "center" });

  // ===== FOOTER - ELEGANT =====
  const footerY = pageHeight - 20;

  // Gold decorative line
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.8);
  doc.line(margin + 30, footerY - 4, pageWidth - margin - 30, footerY - 4);

  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY_INFO.address, pageWidth / 2, footerY + 2, { align: "center" });
  doc.text(`${COMPANY_INFO.phone} | ${COMPANY_INFO.email} | ${COMPANY_INFO.website}`, pageWidth / 2, footerY + 7, { align: "center" });

  // Return PDF as buffer
  return Buffer.from(doc.output("arraybuffer"));
};

module.exports = {
  generateVerificationCertificate,
};
