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

  // ===== FOOTER - CLEAN & PROFESSIONAL =====
  // Bottom gold bar FIRST (at the very bottom)
  doc.setFillColor(...COLORS.gold);
  doc.rect(12, pageHeight - 20, pageWidth - 24, 8, "F");

  // Calculate footer position - fixed from bottom
  const footerDividerY = pageHeight - 30;
  const footerTextY = pageHeight - 25;

  // Gold divider line
  doc.setDrawColor(...COLORS.gold);
  doc.setLineWidth(0.5);
  doc.line(margin + 20, footerDividerY, pageWidth - margin - 20, footerDividerY);

  // Footer text on TWO lines for better readability
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.setFont("helvetica", "normal");

  // Line 1: Address
  doc.text(COMPANY_INFO.address, pageWidth / 2, footerTextY, { align: "center" });

  // Line 2: Contact details
  const contactInfo = `${COMPANY_INFO.phone}  •  ${COMPANY_INFO.email}  •  ${COMPANY_INFO.website}`;
  doc.text(contactInfo, pageWidth / 2, footerTextY + 3.5, { align: "center" });

  // Return PDF as buffer
  return Buffer.from(doc.output("arraybuffer"));
};

/**
 * Generate Discrepancy Report PDF
 * @param {Object} submission - The submission data
 * @param {Object} erpData - The ERP data (portfolios, dividends, etc.)
 * @param {Object} discrepancyDetails - The discrepancy details
 * @returns {Buffer} - The generated PDF as buffer
 */
const generateDiscrepancyReport = (submission, erpData, discrepancyDetails) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;

  // ===== HEADER - Warning Style =====
  doc.setFillColor(254, 243, 199); // Light yellow background
  doc.rect(0, 0, pageWidth, 40, "F");

  // Warning icon (triangle) - simplified
  doc.setFillColor(245, 158, 11);
  doc.triangle(pageWidth / 2 - 8, 12, pageWidth / 2 + 8, 12, pageWidth / 2, 28, "F");
  doc.setFillColor(254, 243, 199);
  doc.setFontSize(14);
  doc.setTextColor(120, 53, 15);
  doc.text("!", pageWidth / 2, 23, { align: "center" });

  // Title
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(146, 64, 14);
  doc.text("DISCREPANCY REPORT", pageWidth / 2, 38, { align: "center" });

  let yPosition = 50;

  // ===== Report Info Box =====
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(margin, yPosition, pageWidth - margin * 2, 25, 2, 2, "FD");

  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(80, 80, 80);

  const reportNumber = `DISC-${submission._id.toString().slice(-8).toUpperCase()}`;
  const reportDate = formatDate(new Date());
  const investorName = submission.personalInfo?.fullName || "N/A";

  doc.text(`Report Number: ${reportNumber}`, margin + 5, yPosition + 8);
  doc.text(`Date: ${reportDate}`, margin + 5, yPosition + 15);
  doc.text(`Investor: ${investorName}`, pageWidth / 2, yPosition + 8);
  doc.text(`Court Agreement: ${submission.courtAgreementNumber || "N/A"}`, pageWidth / 2, yPosition + 15);

  yPosition += 35;

  // ===== Discrepancy Notice =====
  doc.setFillColor(254, 243, 199);
  doc.roundedRect(margin, yPosition, pageWidth - margin * 2, 18, 2, 2, "F");

  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(146, 64, 14);
  const noticeText = "The following discrepancies have been identified between the investor's claimed information and our official records. Please review carefully.";
  const splitNotice = doc.splitTextToSize(noticeText, pageWidth - margin * 2 - 10);
  doc.text(splitNotice, margin + 5, yPosition + 7);

  yPosition += 28;

  // ===== Discrepancy Details Table =====
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(120, 53, 15);
  doc.text("Discrepancy Details", margin, yPosition);
  yPosition += 8;

  // Build table data
  const tableData = [];

  if (discrepancyDetails.investmentAmount) {
    tableData.push([
      "Investment Amount",
      `AED ${formatAmount(discrepancyDetails.investmentAmount.claimed)}`,
      `AED ${formatAmount(discrepancyDetails.investmentAmount.actual)}`,
      `AED ${formatAmount(discrepancyDetails.investmentAmount.difference)}`
    ]);
  }

  if (discrepancyDetails.investmentDate) {
    tableData.push([
      "Investment Date",
      formatDate(discrepancyDetails.investmentDate.claimed),
      formatDate(discrepancyDetails.investmentDate.actual),
      "-"
    ]);
  }

  if (discrepancyDetails.dividendAmount) {
    tableData.push([
      "Total Dividends",
      `AED ${formatAmount(discrepancyDetails.dividendAmount.claimed)}`,
      `AED ${formatAmount(discrepancyDetails.dividendAmount.actual)}`,
      `AED ${formatAmount(discrepancyDetails.dividendAmount.difference)}`
    ]);
  }

  if (discrepancyDetails.duration) {
    tableData.push([
      "Duration",
      `${discrepancyDetails.duration.claimed} months`,
      `${discrepancyDetails.duration.actual} months`,
      "-"
    ]);
  }

  if (discrepancyDetails.referenceNumber) {
    tableData.push([
      "Reference Number",
      discrepancyDetails.referenceNumber.claimed || "Not provided",
      discrepancyDetails.referenceNumber.actual || "N/A",
      "-"
    ]);
  }

  if (tableData.length > 0) {
    doc.autoTable({
      startY: yPosition,
      head: [["Field", "Investor Claim", "Our Records", "Difference"]],
      body: tableData,
      theme: "grid",
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [245, 158, 11],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [50, 50, 50],
      },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [254, 252, 232] },
        1: { fillColor: [224, 242, 254], textColor: [3, 105, 161] },
        2: { fillColor: [220, 252, 231], textColor: [22, 101, 52] },
        3: { fillColor: [254, 226, 226], textColor: [153, 27, 27] },
      },
    });

    yPosition = doc.lastAutoTable.finalY + 15;
  }

  // ===== Admin Notes =====
  if (discrepancyDetails.adminNotes) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 53, 15);
    doc.text("Reviewer Notes", margin, yPosition);
    yPosition += 6;

    doc.setDrawColor(245, 158, 11);
    doc.setFillColor(255, 255, 255);
    doc.roundedRect(margin, yPosition, pageWidth - margin * 2, 20, 2, 2, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(55, 65, 81);
    const splitNotes = doc.splitTextToSize(discrepancyDetails.adminNotes, pageWidth - margin * 2 - 10);
    doc.text(splitNotes, margin + 5, yPosition + 7);

    yPosition += 28;
  }

  // ===== ERP Portfolio Summary (if available) =====
  if (erpData && erpData.matchedPortfolio) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(22, 101, 52);
    doc.text("Matched Portfolio from ERP System", margin, yPosition);
    yPosition += 8;

    const portfolio = erpData.matchedPortfolio;
    const portfolioData = [
      ["Portfolio Ref", portfolio.portfolioRefNo || "N/A"],
      ["Investment Amount", `AED ${formatAmount(portfolio.dblInvestmentAmount)}`],
      ["Investment Date", formatDate(portfolio.dtInvestmentDate)],
      ["Duration", `${portfolio.intDuration || 0} months`],
      ["ROI %", `${portfolio.dblROI || 0}%`],
    ];

    doc.autoTable({
      startY: yPosition,
      head: [],
      body: portfolioData,
      theme: "plain",
      margin: { left: margin, right: margin },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
      columnStyles: {
        0: { fontStyle: "bold", cellWidth: 50, textColor: [75, 85, 99] },
        1: { textColor: [22, 101, 52] },
      },
    });

    yPosition = doc.lastAutoTable.finalY + 10;
  }

  // ===== Footer =====
  const footerY = doc.internal.pageSize.getHeight() - 25;

  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY, pageWidth - margin, footerY);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(107, 114, 128);
  doc.text("This report is generated by Matajar Group Legal Review System.", pageWidth / 2, footerY + 8, { align: "center" });
  doc.text(`Generated on: ${formatDate(new Date())}`, pageWidth / 2, footerY + 14, { align: "center" });

  // Return PDF as buffer
  return Buffer.from(doc.output("arraybuffer"));
};

module.exports = {
  generateVerificationCertificate,
  generateDiscrepancyReport,
};
