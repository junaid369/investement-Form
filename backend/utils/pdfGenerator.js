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
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.gold);
  doc.text("TO WHOM IT MAY CONCERN", pageWidth / 2, yPosition, { align: "center" });
  yPosition += 8;

  // Statement paragraph with better formatting
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...COLORS.black);
  doc.setLineHeightFactor(1.4);

  const statement = `This is to certify that ${COMPANY_INFO.name} has conducted a comprehensive review and verification of the investment closure request submitted by ${investorName}. Our thorough examination of records confirms the following:\n\nThe investor made an initial investment of AED ${investmentAmount} on ${investmentDate}. The designated bank account ${accountNumber} maintained with ${bankName} has been verified and confirmed. Total dividends of AED ${totalDividends} have been distributed to the investor during the investment period.\n\nFollowing successful verification of all documentation and records against our internal systems, we hereby confirm that the net settlement amount of AED ${amountToReturn} has been approved for processing and will be transferred to the investor's verified bank account in accordance with our company policies and procedures.`;

  const splitStatement = doc.splitTextToSize(statement, pageWidth - (margin * 2) - 16);

  // Elegant statement box with gold border
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.setFillColor(250, 248, 245);
  const statementHeight = (splitStatement.length * 5) + 10;
  doc.roundedRect(margin + 8, yPosition - 4, pageWidth - (margin * 2) - 16, statementHeight, 2, 2, "FD");

  // Statement text with padding
  doc.setTextColor(...COLORS.darkGray);
  doc.text(splitStatement, margin + 12, yPosition + 1);
  yPosition += statementHeight + 8;

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
    margin: { left: margin + 8, right: margin + 8 },
    styles: {
      fontSize: 8.5,
      cellPadding: 4,
      lineColor: COLORS.gold,
      lineWidth: 0.5,
      font: "helvetica",
      textColor: COLORS.darkGray,
      overflow: "linebreak",
      cellWidth: "wrap",
    },
    columnStyles: {
      0: {
        fontStyle: "bold",
        cellWidth: 44,
        halign: "left",
        valign: "middle",
        fillColor: [250, 248, 245],
        textColor: [60, 60, 60],
      },
      1: {
        cellWidth: 46,
        halign: "left",
        valign: "middle",
        fillColor: COLORS.white,
        fontStyle: "normal",
        textColor: COLORS.black,
      },
      2: {
        fontStyle: "bold",
        cellWidth: 44,
        halign: "left",
        valign: "middle",
        fillColor: [250, 248, 245],
        textColor: [60, 60, 60],
      },
      3: {
        cellWidth: 46,
        halign: "left",
        valign: "middle",
        fillColor: COLORS.white,
        fontStyle: "bold",
        textColor: COLORS.black,
      },
    },
    didDrawCell: (data) => {
      // Add extra gold border to last row (settlement amount)
      if (data.row.index === 3 && data.section === "body") {
        doc.setDrawColor(...COLORS.gold);
        doc.setLineWidth(1.5);
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
  doc.setFontSize(8);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  const authText = "This certificate has been electronically generated and verified. It serves as official confirmation of the investment closure verification process.";
  const splitAuth = doc.splitTextToSize(authText, pageWidth - (margin * 2) - 20);
  doc.text(splitAuth, pageWidth / 2, yPosition, { align: "center" });
  yPosition += (splitAuth.length * 3.5) + 8;

  // Gold divider before signatures
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  const dividerY = yPosition;
  doc.line(margin + 35, dividerY, pageWidth - margin - 35, dividerY);
  yPosition += 10;

  // Signature boxes with gold accents
  const signatureY = yPosition;
  const leftX = margin + 25;
  const rightX = pageWidth - margin - 70;
  const boxWidth = 45;

  // Left: Authorized Signature Box
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.setFillColor(250, 248, 245);
  doc.roundedRect(leftX - 2, signatureY - 2, boxWidth + 4, 20, 1, 1, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkGray);
  doc.text("AUTHORIZED BY", leftX + boxWidth / 2, signatureY + 5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  if (submission.verifiedBy) {
    doc.text(submission.verifiedBy, leftX + boxWidth / 2, signatureY + 10, { align: "center" });
  }
  doc.text(verificationDate, leftX + boxWidth / 2, signatureY + 14, { align: "center" });

  // Right: Company Seal Box
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.setFillColor(250, 248, 245);
  doc.roundedRect(rightX - 2, signatureY - 2, boxWidth + 4, 20, 1, 1, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...COLORS.darkGray);
  doc.text("COMPANY SEAL", rightX + boxWidth / 2, signatureY + 5, { align: "center" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...COLORS.gold);
  doc.text(COMPANY_INFO.name, rightX + boxWidth / 2, signatureY + 10, { align: "center" });
  doc.setTextColor(100, 100, 100);
  doc.text("Dubai, UAE", rightX + boxWidth / 2, signatureY + 14, { align: "center" });

  // ===== FOOTER - PROFESSIONAL & REFINED =====
  const footerY = pageHeight - 22;

  // Gold decorative divider with corner accents
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.8);
  const footerLineY = footerY - 5;
  doc.line(margin + 25, footerLineY, pageWidth - margin - 25, footerLineY);

  // Small gold corners
  doc.setFillColor(...COLORS.gold);
  doc.circle(margin + 25, footerLineY, 1, "F");
  doc.circle(pageWidth - margin - 25, footerLineY, 1, "F");

  // Footer contact information
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");
  doc.text(COMPANY_INFO.address, pageWidth / 2, footerY, { align: "center" });

  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  const contactLine = `${COMPANY_INFO.phone}  •  ${COMPANY_INFO.email}  •  ${COMPANY_INFO.website}`;
  doc.text(contactLine, pageWidth / 2, footerY + 4, { align: "center" });

  // Confidentiality notice
  doc.setFontSize(6);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(140, 140, 140);
  doc.text("This document is confidential and intended solely for the addressee.", pageWidth / 2, footerY + 8, { align: "center" });

  // Bottom gold bar
  doc.setFillColor(...COLORS.gold);
  doc.rect(12, pageHeight - 20, pageWidth - 24, 8, "F");

  // Return PDF as buffer
  return Buffer.from(doc.output("arraybuffer"));
};

module.exports = {
  generateVerificationCertificate,
};
