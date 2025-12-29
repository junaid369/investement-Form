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
  cream: [252, 250, 245],
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
 * Generate Consent Document PDF
 * @param {Object} submission - The legal submission data
 * @returns {Buffer} - The generated PDF as buffer
 */
const generateConsentPdf = (submission) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const contentWidth = pageWidth - (margin * 2);

  // Helper function to draw page border
  const drawPageBorder = () => {
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(1.5);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    doc.setLineWidth(0.5);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);
  };

  // Helper function to draw footer - positioned just above the gold bar
  const drawFooter = (pageNum, totalPages) => {
    // Gold bar at bottom - inside the border (6px height)
    doc.setFillColor(...COLORS.gold);
    doc.rect(12, pageHeight - 18, pageWidth - 24, 6, "F");

    // Footer text positioned just above the gold bar (no line separator)
    doc.setFontSize(6);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");

    // Address - 10mm above gold bar
    doc.text(COMPANY_INFO.address, pageWidth / 2, pageHeight - 28, { align: "center" });

    // Contact info - 5mm above gold bar
    const contactInfo = `${COMPANY_INFO.phone}  |  ${COMPANY_INFO.email}  |  ${COMPANY_INFO.website}`;
    doc.text(contactInfo, pageWidth / 2, pageHeight - 23, { align: "center" });

    // Page number - aligned with address on the right
    doc.setFontSize(6);
    doc.setTextColor(100, 100, 100);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 5, pageHeight - 28, { align: "right" });
  };

  // Draw border for first page
  drawPageBorder();

  // ===== TOP GOLD BAR =====
  doc.setFillColor(...COLORS.gold);
  doc.rect(12, 12, pageWidth - 24, 8, "F");

  // ===== HEADER =====
  let yPosition = 30;

  // Company Name
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.setTextColor(...COLORS.gold);
  doc.text(COMPANY_INFO.name.toUpperCase(), pageWidth / 2, yPosition, { align: "center" });
  yPosition += 6;

  // Subtitle
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.darkGray);
  doc.text(COMPANY_INFO.subtitle, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 8;

  // Gold Decorative Divider
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.8);
  const lineY = yPosition;
  const centerX = pageWidth / 2;
  doc.line(margin + 20, lineY, centerX - 8, lineY);
  doc.line(centerX + 8, lineY, pageWidth - margin - 20, lineY);
  doc.setFillColor(...COLORS.gold);
  doc.circle(centerX, lineY, 2, "F");
  yPosition += 10;

  // ===== DOCUMENT TITLE =====
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.black);
  doc.text("INVESTMENT CONSENT DOCUMENT", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Reference & Date Box
  const consentNumber = `CONSENT-${submission._id.toString().slice(-8).toUpperCase()}`;
  const currentDate = formatDate(new Date());

  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.setFillColor(252, 252, 250);
  doc.roundedRect(margin + 30, yPosition - 4, contentWidth - 60, 14, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkGray);
  doc.text(`Reference No: ${consentNumber}`, pageWidth / 2, yPosition + 1, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`Date of Issue: ${currentDate}`, pageWidth / 2, yPosition + 7, { align: "center" });
  yPosition += 18;

  // ===== INVESTOR INFORMATION SECTION =====
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.gold);
  doc.text("INVESTOR INFORMATION", margin, yPosition);

  // Gold underline
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition + 2, margin + 55, yPosition + 2);
  yPosition += 6;

  const investorData = [
    ["Full Name", submission.personalInfo?.fullName || "N/A"],
    ["Email Address", submission.personalInfo?.email || "N/A"],
    ["Phone Number", `${submission.personalInfo?.phoneCode || ""} ${submission.personalInfo?.phone || "N/A"}`],
    ["Country", submission.personalInfo?.country || "N/A"],
    ["Address", `${submission.personalInfo?.address || "N/A"}, ${submission.personalInfo?.city || ""}`],
  ];

  doc.autoTable({
    startY: yPosition,
    head: [],
    body: investorData,
    theme: "plain",
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 6, right: 6 },
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 45, textColor: COLORS.darkGray, fillColor: COLORS.cream },
      1: { textColor: COLORS.black, fillColor: COLORS.white },
    },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.3,
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // ===== INVESTMENT DETAILS SECTION =====
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.gold);
  doc.text("INVESTMENT DETAILS", margin, yPosition);

  // Gold underline
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition + 2, margin + 52, yPosition + 2);
  yPosition += 6;

  // Get duration value and format it correctly (avoid "6 months months")
  let durationValue = submission.investmentDetails?.duration || "N/A";
  if (durationValue !== "N/A" && !String(durationValue).toLowerCase().includes("month")) {
    durationValue = `${durationValue} months`;
  }

  const investmentData = [
    ["Court Agreement No.", submission.courtAgreementNumber || "N/A"],
    ["Investment Amount", `AED ${formatAmount(submission.investmentDetails?.amount || 0)}`],
    ["Investment Date", formatDate(submission.investmentDetails?.investmentDate)],
    ["Duration", durationValue],
    ["Annual Dividend Rate", `${submission.investmentDetails?.annualDividendPercentage || "N/A"}%`],
    ["Dividend Frequency", submission.investmentDetails?.dividendFrequency || "N/A"],
  ];

  doc.autoTable({
    startY: yPosition,
    head: [],
    body: investmentData,
    theme: "plain",
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 9,
      cellPadding: { top: 3, bottom: 3, left: 6, right: 6 },
      lineColor: [220, 220, 220],
      lineWidth: 0.3,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 55, textColor: COLORS.darkGray, fillColor: COLORS.cream },
      1: { textColor: COLORS.black, fillColor: COLORS.white },
    },
    tableLineColor: [220, 220, 220],
    tableLineWidth: 0.3,
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // ===== TERMS & CONDITIONS =====
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.gold);
  doc.text("TERMS & CONDITIONS", margin, yPosition);

  // Gold underline
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition + 2, margin + 52, yPosition + 2);
  yPosition += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);

  const terms = [
    "1. I hereby confirm that all the investment details mentioned above are true and accurate to the best of my knowledge.",
    "2. I consent to the verification and processing of my investment records by Matajar Group for settlement purposes.",
    "3. I authorize Matajar Group to share my investment data with relevant regulatory authorities if required by law.",
    "4. I acknowledge that this consent is valid for the duration of the settlement process and any subsequent proceedings.",
    "5. I understand that providing false or misleading information may result in legal consequences and rejection of my claim.",
  ];

  // Calculate total height for terms box
  let termsHeight = 8;
  terms.forEach(term => {
    const splitTerm = doc.splitTextToSize(term, contentWidth - 14);
    termsHeight += splitTerm.length * 4 + 1;
  });

  doc.setDrawColor(200, 200, 200);
  doc.setFillColor(250, 250, 248);
  doc.roundedRect(margin, yPosition, contentWidth, termsHeight, 3, 3, "FD");

  let termY = yPosition + 5;
  terms.forEach(term => {
    const splitTerm = doc.splitTextToSize(term, contentWidth - 14);
    doc.text(splitTerm, margin + 7, termY);
    termY += splitTerm.length * 4 + 1;
  });

  yPosition += termsHeight + 10;

  // ===== PAGE 2 - SIGNATURE SECTIONS =====
  doc.addPage();
  drawPageBorder();

  // Top gold bar on page 2
  doc.setFillColor(...COLORS.gold);
  doc.rect(12, 12, pageWidth - 24, 5, "F");

  yPosition = 28;

  // Page 2 header
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.gold);
  doc.text("CONSENT DOCUMENT - SIGNATURES", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 5;

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(100, 100, 100);
  doc.text(`Reference: ${consentNumber}`, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 12;

  // ===== INVESTOR DECLARATION & SIGNATURE =====
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.gold);
  doc.text("INVESTOR DECLARATION & SIGNATURE", margin, yPosition);

  // Gold underline
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition + 2, margin + 85, yPosition + 2);
  yPosition += 10;

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);

  const declaration = "I, the undersigned, confirm that I have read and understood the above details and terms. I hereby provide my consent for the verification and processing of my investment closure request.";
  const splitDeclaration = doc.splitTextToSize(declaration, contentWidth);
  doc.text(splitDeclaration, margin, yPosition);
  yPosition += splitDeclaration.length * 5 + 12;

  // Investor signature box
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, yPosition, contentWidth, 50, 3, 3, "FD");

  // Inner content
  const boxLeft = margin + 10;
  const boxMid = margin + contentWidth / 2;

  yPosition += 8;

  // Investor Name (pre-filled)
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkGray);
  doc.text("Investor Name:", boxLeft, yPosition);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.black);
  doc.text(submission.personalInfo?.fullName || "___________________________", boxLeft + 32, yPosition);

  yPosition += 16;

  // Signature line
  doc.setDrawColor(...COLORS.darkGray);
  doc.setLineWidth(0.4);
  doc.line(boxLeft, yPosition, boxLeft + 60, yPosition);
  doc.setFontSize(8);
  doc.setTextColor(80, 80, 80);
  doc.text("Investor Signature", boxLeft, yPosition + 5);

  // Date line
  doc.line(boxMid + 10, yPosition, boxMid + 55, yPosition);
  doc.text("Date", boxMid + 10, yPosition + 5);

  yPosition += 28;

  // Gold divider between sections
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1.5);
  doc.line(margin + 20, yPosition, pageWidth - margin - 20, yPosition);
  yPosition += 12;

  // ===== COMPANY AUTHORIZATION SECTION =====
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.gold);
  doc.text("COMPANY AUTHORIZATION", margin, yPosition);

  // Gold underline
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(margin, yPosition + 2, margin + 65, yPosition + 2);
  yPosition += 6;

  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text("For Official Use Only - To be completed by Matajar Group", margin, yPosition);
  yPosition += 10;

  // Company signature box - height to fit all 3 lines inside
  const companyBoxHeight = 48;
  const companyBoxY = yPosition;
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, companyBoxY, contentWidth, companyBoxHeight, 3, 3, "FD");

  // Company Seal Box on right - smaller and positioned inside
  const sealBoxWidth = 32;
  const sealBoxHeight = 32;
  const sealX = pageWidth - margin - sealBoxWidth - 8;
  const sealY = companyBoxY + 8;

  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.8);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(sealX, sealY, sealBoxWidth, sealBoxHeight, 2, 2, "FD");

  // Inner border for seal
  doc.setLineWidth(0.3);
  doc.setDrawColor(180, 180, 180);
  doc.roundedRect(sealX + 2, sealY + 2, sealBoxWidth - 4, sealBoxHeight - 4, 1, 1, "S");

  doc.setFontSize(6);
  doc.setTextColor(150, 150, 150);
  doc.setFont("helvetica", "bold");
  doc.text("COMPANY", sealX + sealBoxWidth / 2, sealY + sealBoxHeight / 2 - 2, { align: "center" });
  doc.text("SEAL", sealX + sealBoxWidth / 2, sealY + sealBoxHeight / 2 + 4, { align: "center" });

  // Signature lines - all INSIDE the box with proper spacing
  const signatureLineWidth = sealX - margin - 18;
  const lineSpacing = 14;
  let signY = companyBoxY + 10;

  // Authorized Signatory line
  doc.setDrawColor(...COLORS.darkGray);
  doc.setLineWidth(0.4);
  doc.line(boxLeft, signY, boxLeft + signatureLineWidth, signY);
  doc.setFontSize(7);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text("Authorized Signatory", boxLeft, signY + 4);

  // Designation line
  signY += lineSpacing;
  doc.line(boxLeft, signY, boxLeft + signatureLineWidth, signY);
  doc.text("Designation", boxLeft, signY + 4);

  // Date line - INSIDE the box
  signY += lineSpacing;
  doc.line(boxLeft, signY, boxLeft + signatureLineWidth, signY);
  doc.text("Date", boxLeft, signY + 4);

  // Draw footers on all pages
  const totalPages = doc.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    drawFooter(i, totalPages);
  }

  // Return PDF as buffer
  return Buffer.from(doc.output("arraybuffer"));
};

module.exports = {
  generateConsentPdf,
};
