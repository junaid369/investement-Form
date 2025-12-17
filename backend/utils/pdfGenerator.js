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
  const margin = 20;

  // ===== ELEGANT DOUBLE BORDER WITH GOLD ACCENTS =====
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(1.5);
  doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
  doc.setLineWidth(0.5);
  doc.rect(12, 12, pageWidth - 24, pageHeight - 24);

  // ===== TOP GOLD BAR =====
  doc.setFillColor(...COLORS.gold);
  doc.rect(12, 12, pageWidth - 24, 8, "F");

  // ===== HEADER - REFINED PROFESSIONAL STYLE =====
  let yPosition = 30;

  // Company Name - Bold Gold with Shadow Effect
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(...COLORS.gold);
  doc.text(COMPANY_INFO.name.toUpperCase(), pageWidth / 2, yPosition, { align: "center" });
  yPosition += 8;

  // Subtitle - Smaller Black
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.darkGray);
  doc.text(COMPANY_INFO.subtitle, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 5;

  // Powered By - Small Gray
  doc.setFontSize(7);
  doc.setTextColor(120, 120, 120);
  doc.text(COMPANY_INFO.poweredBy, pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Gold Decorative Divider with Diamond
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.8);
  const lineY = yPosition;
  const centerX = pageWidth / 2;
  doc.line(margin + 20, lineY, centerX - 8, lineY);
  doc.line(centerX + 8, lineY, pageWidth - margin - 20, lineY);

  // Small diamond in center
  doc.setFillColor(...COLORS.gold);
  doc.circle(centerX, lineY, 2, "F");
  yPosition += 8;

  // ===== CERTIFICATE TITLE - BOLD & PROMINENT =====
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.black);
  doc.text("INVESTMENT VERIFICATION", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 6;
  doc.text("CERTIFICATE", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Certificate Number & Date with Box
  const certNumber = submission.certificateNumber || `CERT-${submission._id.toString().slice(-8).toUpperCase()}`;
  const verificationDate = formatDate(submission.certificateGeneratedAt || new Date());

  // Certificate info box with gold border
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.setFillColor(252, 252, 250);
  doc.roundedRect(margin + 30, yPosition - 3, pageWidth - (margin * 2) - 60, 14, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkGray);
  doc.text(`Certificate No: ${certNumber}`, pageWidth / 2, yPosition + 3, { align: "center" });
  yPosition += 7;
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);
  doc.text(`Verification Date: ${verificationDate}`, pageWidth / 2, yPosition + 3, { align: "center" });
  yPosition += 12;

  // ===== VERIFICATION STATEMENT - FORMAL & ELEGANT =====
  const investorName = submission.personalInfo?.fullName || "N/A";
  const investmentAmount = formatAmount(submission.investmentDetails?.amount || 0);
  const accountNumber = submission.bankDetails?.accountNumber || "N/A";
  const bankName = submission.bankDetails?.bankName || "N/A";
  const investmentDate = formatDate(submission.investmentDetails?.investmentDate);
  const totalDividends = formatAmount(submission.dividendHistory?.totalReceived || 0);
  const amountToReturn = formatAmount((submission.investmentDetails?.amount || 0) - (submission.dividendHistory?.totalReceived || 0));

  // Formal heading
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.gold);
  doc.text("TO WHOM IT MAY CONCERN", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 10;

  // Statement paragraphs - properly formatted with good spacing
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.black);

  const para1 = `This is to certify that ${COMPANY_INFO.name} has conducted a comprehensive review and verification of the investment closure request submitted by ${investorName}. Our thorough examination of records confirms the following:`;
  const para2 = `The investor made an initial investment of AED ${investmentAmount} on ${investmentDate}. The designated bank account ${accountNumber} maintained with ${bankName} has been verified and confirmed. Total dividends of AED ${totalDividends} have been distributed to the investor during the investment period.`;
  const para3 = `Following successful verification of all documentation and records against our internal systems, we hereby confirm that the net settlement amount of AED ${amountToReturn} has been approved for processing and will be transferred to the investor's verified bank account in accordance with our company policies and procedures.`;

  const boxWidth = pageWidth - (margin * 2) - 12;
  const boxStartX = margin + 6;
  const splitPara1 = doc.splitTextToSize(para1, boxWidth - 12);
  const splitPara2 = doc.splitTextToSize(para2, boxWidth - 12);
  const splitPara3 = doc.splitTextToSize(para3, boxWidth - 12);

  // Calculate total height needed
  const totalLines = splitPara1.length + splitPara2.length + splitPara3.length;
  const statementHeight = (totalLines * 4.5) + 18;

  // Draw statement box with gold border
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.8);
  doc.setFillColor(255, 253, 248);
  doc.roundedRect(boxStartX, yPosition - 5, boxWidth, statementHeight, 3, 3, "FD");

  // Write paragraphs with proper spacing
  let textY = yPosition;
  doc.setTextColor(50, 50, 50);
  doc.text(splitPara1, boxStartX + 6, textY);
  textY += (splitPara1.length * 4.5) + 3;

  doc.text(splitPara2, boxStartX + 6, textY);
  textY += (splitPara2.length * 4.5) + 3;

  doc.text(splitPara3, boxStartX + 6, textY);

  yPosition += statementHeight + 6;

  // ===== INVESTMENT DETAILS TABLE - PROFESSIONAL LAYOUT =====
  // Table heading
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.gold);
  doc.text("VERIFIED INVESTMENT DETAILS", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 8;

  const tableData = [
    ["Investor Name", investorName, "Investment Amount", `AED ${investmentAmount}`],
    ["Bank Account Number", accountNumber, "Bank Name", bankName],
    ["Investment Date", investmentDate, "Total Dividends Paid", `AED ${totalDividends}`],
    ["Certificate Number", certNumber, "Net Settlement Amount", `AED ${amountToReturn}`],
  ];

  doc.autoTable({
    startY: yPosition,
    head: [],
    body: tableData,
    theme: "grid",
    margin: { left: margin + 5, right: margin + 5 },
    tableWidth: "auto",
    styles: {
      fontSize: 9,
      cellPadding: { top: 3, right: 5, bottom: 3, left: 5 },
      lineColor: COLORS.gold,
      lineWidth: 0.5,
      font: "helvetica",
      textColor: COLORS.darkGray,
      halign: "left",
      valign: "middle",
      minCellHeight: 8,
    },
    columnStyles: {
      0: {
        fontStyle: "bold",
        cellWidth: 45,
        fillColor: [252, 250, 245],
        textColor: [40, 40, 40],
      },
      1: {
        cellWidth: 40,
        fillColor: COLORS.white,
        fontStyle: "normal",
        textColor: COLORS.black,
      },
      2: {
        fontStyle: "bold",
        cellWidth: 45,
        fillColor: [252, 250, 245],
        textColor: [40, 40, 40],
      },
      3: {
        cellWidth: 40,
        fillColor: COLORS.white,
        fontStyle: "bold",
        textColor: COLORS.black,
      },
    },
    didDrawCell: (data) => {
      // Add thicker gold border to last row (settlement amount)
      if (data.row.index === 3 && data.section === "body") {
        doc.setDrawColor(...COLORS.gold);
        doc.setLineWidth(1.2);
        doc.line(
          data.cell.x,
          data.cell.y + data.cell.height,
          data.cell.x + data.cell.width,
          data.cell.y + data.cell.height
        );
      }
    },
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // ===== AUTHENTICITY & SIGNATURE SECTION =====
  // Authenticity statement
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(110, 110, 110);
  const authText = "This certificate has been electronically generated and verified. It serves as official confirmation of the investment closure verification process.";
  const splitAuth = doc.splitTextToSize(authText, pageWidth - (margin * 2) - 30);
  doc.text(splitAuth, pageWidth / 2, yPosition, { align: "center" });
  yPosition += (splitAuth.length * 3.5) + 8;

  // Gold divider line
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.8);
  doc.line(margin + 25, yPosition, pageWidth - margin - 25, yPosition);
  yPosition += 10;

  // Signature section - side by side layout
  const signatureY = yPosition;
  const sigBoxWidth = 55;
  const sigBoxHeight = 16;
  const spacing = (pageWidth - (margin * 2) - (sigBoxWidth * 2)) / 3;
  const leftSigX = margin + spacing;
  const rightSigX = pageWidth - margin - spacing - sigBoxWidth;

  // Left: Authorized Signature
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.7);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(leftSigX, signatureY, sigBoxWidth, sigBoxHeight, 2, 2, "FD");

  // Signature line inside box
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(leftSigX + 6, signatureY + 8, leftSigX + sigBoxWidth - 6, signatureY + 8);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.black);
  doc.text("AUTHORIZED BY", leftSigX + sigBoxWidth / 2, signatureY + 12, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(90, 90, 90);
  doc.text(verificationDate, leftSigX + sigBoxWidth / 2, signatureY + sigBoxHeight - 1, { align: "center" });

  // Right: Company Seal
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.7);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(rightSigX, signatureY, sigBoxWidth, sigBoxHeight, 2, 2, "FD");

  // Signature line inside box
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(rightSigX + 6, signatureY + 8, rightSigX + sigBoxWidth - 6, signatureY + 8);

  doc.setFontSize(7.5);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.black);
  doc.text("COMPANY SEAL", rightSigX + sigBoxWidth / 2, signatureY + 12, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...COLORS.gold);
  doc.text("Dubai, UAE", rightSigX + sigBoxWidth / 2, signatureY + sigBoxHeight - 1, { align: "center" });

  yPosition = signatureY + sigBoxHeight + 6;

  // ===== FOOTER - CLEAN & PROFESSIONAL =====
  // Bottom gold bar FIRST (at the very bottom)
  doc.setFillColor(...COLORS.gold);
  doc.rect(12, pageHeight - 20, pageWidth - 24, 8, "F");

  // Gold divider line ABOVE the bottom bar
  const footerStartY = pageHeight - 28;
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.6);
  doc.line(margin + 25, footerStartY, pageWidth - margin - 25, footerStartY);

  // Footer text - positioned safely above the gold bar
  doc.setFontSize(6.5);
  doc.setTextColor(90, 90, 90);
  doc.setFont("helvetica", "normal");
  const footerText = `${COMPANY_INFO.address}  •  ${COMPANY_INFO.phone}  •  ${COMPANY_INFO.email}  •  ${COMPANY_INFO.website}`;
  doc.text(footerText, pageWidth / 2, footerStartY + 4, { align: "center" });

  // Return PDF as buffer
  return Buffer.from(doc.output("arraybuffer"));
};

module.exports = {
  generateVerificationCertificate,
};
