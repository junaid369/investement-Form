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
  lightGray: [240, 240, 240], // #f0f0f0
  white: [255, 255, 255],
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
 * Generate Investment Verification Certificate PDF - Single Page Elegant Design
 * @param {Object} submission - The legal submission data
 * @returns {Buffer} - The generated PDF as buffer
 */
const generateVerificationCertificate = (submission) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;

  // ===== DECORATIVE BORDER =====
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.rect(8, 8, pageWidth - 16, pageHeight - 16);
  doc.setLineWidth(0.2);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);

  // ===== HEADER - ELEGANT BLACK & GOLD =====
  let yPosition = 20;

  // Company Name - Gold
  doc.setFont(undefined, "bold");
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.gold);
  doc.text(COMPANY_INFO.name, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 6;

  // Subtitle
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.setTextColor(...COLORS.black);
  doc.text(COMPANY_INFO.subtitle, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 4;

  // Powered By
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(COMPANY_INFO.poweredBy, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Gold Divider Line
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.8);
  doc.line(margin + 20, yPosition, pageWidth - margin - 20, yPosition);
  yPosition += 8;

  // ===== CERTIFICATE TITLE =====
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...COLORS.gold);
  doc.text("INVESTMENT VERIFICATION CERTIFICATE", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Certificate Number & Date - Small elegant line
  const certNumber = submission.certificateNumber || `CERT-${submission._id.toString().slice(-8).toUpperCase()}`;
  const verificationDate = formatDate(submission.certificateGeneratedAt || new Date());

  doc.setFontSize(9);
  doc.setFont(undefined, "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`Certificate No: ${certNumber}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 4;
  doc.text(`Verification Date: ${verificationDate}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // ===== MAIN VERIFICATION STATEMENT - ELEGANT PARAGRAPH =====
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.black);
  doc.setFont(undefined, "normal");

  const investorName = submission.personalInfo?.fullName || "N/A";
  const investmentAmount = formatAmount(submission.investmentDetails?.amount || 0);
  const accountNumber = submission.bankDetails?.accountNumber || "N/A";
  const bankName = submission.bankDetails?.bankName || "N/A";
  const investmentDate = formatDate(submission.investmentDetails?.investmentDate);
  const totalDividends = formatAmount(submission.dividendHistory?.totalReceived || 0);
  const amountToReturn = formatAmount((submission.investmentDetails?.amount || 0) - (submission.dividendHistory?.totalReceived || 0));

  const statement = `This certificate verifies that ${COMPANY_INFO.name} has thoroughly reviewed and confirmed the investment closure request submitted by ${investorName}. The investor's records, including investment of AED ${investmentAmount} made on ${investmentDate}, bank account ${accountNumber} (${bankName}), and total dividends received of AED ${totalDividends}, have been verified against our internal records. Following successful verification, the net settlement amount of AED ${amountToReturn} will be processed for return to the investor's designated bank account as per company policy.`;

  const splitStatement = doc.splitTextToSize(statement, pageWidth - (margin * 2) - 10);

  // Add subtle background for statement
  doc.setFillColor(250, 250, 250);
  const statementHeight = (splitStatement.length * 5) + 8;
  doc.roundedRect(margin + 5, yPosition - 3, pageWidth - (margin * 2) - 10, statementHeight, 2, 2, "F");

  doc.setTextColor(...COLORS.black);
  doc.text(splitStatement, margin + 8, yPosition + 2);
  yPosition += statementHeight + 8;

  // ===== KEY DETAILS IN ELEGANT TABLE =====
  const keyDetails = [
    ["Investor Name", investorName, "Investment Amount", `AED ${investmentAmount}`],
    ["Bank Account", accountNumber, "Bank Name", bankName],
    ["Investment Date", investmentDate, "Dividends Received", `AED ${totalDividends}`],
    ["Certificate Number", certNumber, "Settlement Amount", `AED ${amountToReturn}`],
  ];

  doc.autoTable({
    startY: yPosition,
    head: [],
    body: keyDetails,
    theme: "plain",
    margin: { left: margin + 5, right: margin + 5 },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45, textColor: [80, 80, 80], fontSize: 9 },
      1: { cellWidth: 50, textColor: COLORS.black, fontSize: 9 },
      2: { fontStyle: "bold", cellWidth: 45, textColor: [80, 80, 80], fontSize: 9 },
      3: { cellWidth: 50, textColor: COLORS.black, fontSize: 9, fontStyle: "bold" },
    },
    styles: {
      cellPadding: 2.5,
      lineColor: COLORS.gold,
      lineWidth: 0.1,
    },
    alternateRowStyles: {
      fillColor: [252, 252, 252],
    },
  });

  yPosition = doc.lastAutoTable.finalY + 12;

  // ===== SIGNATURE SECTION - ELEGANT =====
  // Gold divider line
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(margin + 20, yPosition, pageWidth - margin - 20, yPosition);
  yPosition += 10;

  // Signature and Stamp side by side
  const signatureY = yPosition;
  const leftX = margin + 30;
  const rightX = pageWidth - margin - 50;

  // Left: Authorized Signature
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.3);
  doc.line(leftX, signatureY, leftX + 40, signatureY);
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...COLORS.black);
  doc.text("Authorized Signature", leftX + 20, signatureY + 5, { align: "center" });
  doc.setFont(undefined, "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  if (submission.verifiedBy) {
    doc.text(`Verified by: ${submission.verifiedBy}`, leftX + 20, signatureY + 9, { align: "center" });
  }

  // Right: Company Stamp
  doc.line(rightX, signatureY, rightX + 40, signatureY);
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.setTextColor(...COLORS.black);
  doc.text("Company Seal", rightX + 20, signatureY + 5, { align: "center" });

  // ===== FOOTER - ELEGANT =====
  const footerY = pageHeight - 18;

  // Gold divider line
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(margin + 20, footerY - 3, pageWidth - margin - 20, footerY - 3);

  // Footer text
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, "normal");
  doc.text(COMPANY_INFO.address, pageWidth / 2, footerY + 2, { align: "center" });
  doc.text(`${COMPANY_INFO.phone} | ${COMPANY_INFO.email} | ${COMPANY_INFO.website}`, pageWidth / 2, footerY + 6, { align: "center" });

  // Return PDF as buffer
  return Buffer.from(doc.output("arraybuffer"));
};

module.exports = {
  generateVerificationCertificate,
};
