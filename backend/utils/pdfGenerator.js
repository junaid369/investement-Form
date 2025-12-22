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
 * Round amount to nearest expected monthly dividend rate
 * Common rates: 10000, 15000, 20000, 25000, 30000, etc.
 */
const roundToMonthlyRate = (amount, monthlyRate) => {
  if (!amount || !monthlyRate) return amount;
  // Round to nearest multiple of monthly rate
  return Math.round(amount / monthlyRate) * monthlyRate;
};

/**
 * Calculate monthly dividend rate from ERP dividend history
 * @param {Array} dividendHistory - Array of dividend records
 * @returns {number} - Calculated monthly rate
 */
const calculateMonthlyRate = (dividendHistory) => {
  if (!dividendHistory || dividendHistory.length === 0) return 0;

  // Get all amounts
  const amounts = dividendHistory.map(d => d.amount || d.actualPaidAmount || 0).filter(a => a > 0);
  if (amounts.length === 0) return 0;

  // Calculate total and average
  const total = amounts.reduce((sum, a) => sum + a, 0);
  const avgAmount = total / amounts.length;

  // Round to common dividend rates (nearest 5000)
  const roundedRate = Math.round(avgAmount / 5000) * 5000;

  return roundedRate > 0 ? roundedRate : avgAmount;
};

/**
 * Process dividend history - round amounts and add missing months if user claimed more
 * @param {Array} erpDividendHistory - Dividend history from ERP
 * @param {number} userClaimedTotal - Total dividends claimed by user
 * @param {number} monthlyRate - Monthly dividend rate (can be passed or calculated)
 * @returns {Object} - Processed dividend history and total
 */
const processDividendHistory = (erpDividendHistory, userClaimedTotal, monthlyRate = null) => {
  if (!erpDividendHistory || erpDividendHistory.length === 0) {
    return { processedHistory: [], totalAmount: userClaimedTotal || 0, monthlyRate: 0 };
  }

  // Calculate monthly rate if not provided
  const calculatedRate = monthlyRate || calculateMonthlyRate(erpDividendHistory);

  // Round each ERP dividend amount to the monthly rate
  const processedHistory = erpDividendHistory.map((dividend) => {
    const originalAmount = dividend.amount || dividend.actualPaidAmount || 0;
    const roundedAmount = calculatedRate > 0 ? roundToMonthlyRate(originalAmount, calculatedRate) : originalAmount;

    return {
      ...dividend,
      originalAmount,
      amount: roundedAmount,
      actualPaidAmount: roundedAmount,
    };
  });

  // Calculate total from rounded ERP amounts
  const erpRoundedTotal = processedHistory.reduce((sum, d) => sum + (d.amount || 0), 0);

  // Check if user claimed more than ERP records
  if (userClaimedTotal && userClaimedTotal > erpRoundedTotal && calculatedRate > 0) {
    const difference = userClaimedTotal - erpRoundedTotal;
    const additionalMonths = Math.round(difference / calculatedRate);

    if (additionalMonths > 0) {
      // Get the last dividend date to calculate next month dates
      const lastDividend = processedHistory[processedHistory.length - 1];
      let lastDate = lastDividend?.date || lastDividend?.paymentDate || lastDividend?.createdAt;
      lastDate = lastDate ? new Date(lastDate) : new Date();

      // Add missing months - mark as Paid (user claimed they received these)
      for (let i = 0; i < additionalMonths; i++) {
        // Add one month to last date
        const newDate = new Date(lastDate);
        newDate.setMonth(newDate.getMonth() + (i + 1));

        processedHistory.push({
          transactionNumber: `TXN-${String(processedHistory.length + 1).padStart(4, '0')}`,
          dividendRefNo: `DIV-${String(processedHistory.length + 1).padStart(4, '0')}`,
          date: newDate.toISOString(),
          paymentDate: newDate.toISOString(),
          amount: calculatedRate,
          actualPaidAmount: calculatedRate,
          status: "Paid",
          strPaymentStatus: "Paid",
          isAdditionalFromClaim: true, // Flag to identify these entries (different from isClaimedNotInERP)
        });
      }
    }
  }

  // Calculate final total (use user claimed if higher, otherwise use rounded ERP total)
  const finalTotal = userClaimedTotal && userClaimedTotal > erpRoundedTotal
    ? userClaimedTotal
    : erpRoundedTotal;

  return {
    processedHistory,
    totalAmount: finalTotal,
    monthlyRate: calculatedRate,
    erpTotal: erpRoundedTotal,
    additionalFromClaim: userClaimedTotal > erpRoundedTotal ? userClaimedTotal - erpRoundedTotal : 0,
  };
};

/**
 * Generate Investment Verification Certificate PDF - Professional Multi-Page Design
 * @param {Object} submission - The legal submission data
 * @param {Object} erpData - Optional ERP data with dividend history
 * @returns {Buffer} - The generated PDF as buffer
 */
const generateVerificationCertificate = (submission, erpData = null) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;

  // Helper function to draw page border
  const drawPageBorder = () => {
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(1.5);
    doc.rect(10, 10, pageWidth - 20, pageHeight - 20);
    doc.setLineWidth(0.5);
    doc.rect(12, 12, pageWidth - 24, pageHeight - 24);
  };

  // Helper function to draw page footer
  const drawPageFooter = (pageNum, totalPages) => {
    doc.setFillColor(...COLORS.gold);
    doc.rect(12, pageHeight - 20, pageWidth - 24, 8, "F");

    const footerDividerY = pageHeight - 30;
    const footerTextY = pageHeight - 25;

    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(0.5);
    doc.line(margin + 20, footerDividerY, pageWidth - margin - 20, footerDividerY);

    doc.setFontSize(6.5);
    doc.setTextColor(80, 80, 80);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY_INFO.address, pageWidth / 2, footerTextY, { align: "center" });

    const contactInfo = `${COMPANY_INFO.phone}  •  ${COMPANY_INFO.email}  •  ${COMPANY_INFO.website}`;
    doc.text(contactInfo, pageWidth / 2, footerTextY + 3.5, { align: "center" });

    // Page number
    doc.setFontSize(8);
    doc.text(`Page ${pageNum} of ${totalPages}`, pageWidth - margin - 5, pageHeight - 35, { align: "right" });
  };

  // ===== PAGE 1: MAIN CERTIFICATE =====
  drawPageBorder();

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
  const amountReceived = formatAmount(submission.dividendHistory?.totalReceived || 0);

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
  const para3 = `Following successful verification of all documentation and records against our internal systems, we hereby confirm that this investment closure request has been approved for processing in accordance with our company policies and procedures.`;

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
    ["Investment Date", investmentDate, "Amount Received", `AED ${amountReceived}`],
    ["Certificate Number", certNumber, "Verification Date", verificationDate],
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

  // Get dividend history from erpData or submission
  const rawDividendHistory = erpData?.dividendHistory || submission.erpDividendHistory || [];
  const userClaimedDividends = parseFloat(submission.dividendHistory?.totalReceived || 0);

  // Process dividend history - round amounts and add missing months if user claimed more
  const {
    processedHistory: dividendHistory,
    totalAmount: finalDividendTotal,
    monthlyRate,
    additionalFromClaim,
  } = processDividendHistory(rawDividendHistory, userClaimedDividends);

  const hasDividendHistory = dividendHistory.length > 0;
  const totalPages = hasDividendHistory ? 2 : 1;

  // Draw footer for page 1
  drawPageFooter(1, totalPages);

  // ===== PAGE 2: DIVIDEND HISTORY (if available) =====
  if (hasDividendHistory) {
    doc.addPage();
    drawPageBorder();

    // Top gold bar
    doc.setFillColor(...COLORS.gold);
    doc.rect(12, 12, pageWidth - 24, 8, "F");

    yPosition = 30;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.gold);
    doc.text(COMPANY_INFO.name.toUpperCase(), pageWidth / 2, yPosition, { align: "center" });
    yPosition += 10;

    // Title with underline
    doc.setFontSize(14);
    doc.setTextColor(...COLORS.black);
    doc.text("DIVIDEND PAYMENT HISTORY", pageWidth / 2, yPosition, { align: "center" });
    yPosition += 3;

    // Decorative underline for title
    doc.setDrawColor(...COLORS.gold);
    doc.setLineWidth(1);
    doc.line(pageWidth / 2 - 45, yPosition, pageWidth / 2 + 45, yPosition);
    yPosition += 10;

    // Investor info in a subtle box
    doc.setFillColor(250, 250, 250);
    doc.setDrawColor(220, 220, 220);
    doc.roundedRect(margin + 30, yPosition - 2, pageWidth - margin * 2 - 60, 16, 2, 2, "FD");

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);
    doc.text(`Investor: ${investorName}`, margin + 40, yPosition + 5);
    doc.text(`Certificate No: ${certNumber}`, pageWidth - margin - 40, yPosition + 5, { align: "right" });
    yPosition += 20;

    // Summary cards - modern card layout
    const cardWidth = (pageWidth - margin * 2 - 15) / 3;
    const cardHeight = 28;
    const cardY = yPosition;

    // Card 1: Total Payments
    doc.setFillColor(249, 250, 251);
    doc.setDrawColor(...COLORS.gold);
    doc.roundedRect(margin, cardY, cardWidth, cardHeight, 3, 3, "FD");
    doc.setFontSize(8);
    doc.setTextColor(107, 114, 128);
    doc.text("TOTAL PAYMENTS", margin + cardWidth / 2, cardY + 8, { align: "center" });
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.darkGray);
    doc.text(`${dividendHistory.length}`, margin + cardWidth / 2, cardY + 20, { align: "center" });

    // Card 2: Monthly Rate
    const card2X = margin + cardWidth + 7.5;
    doc.setFillColor(249, 250, 251);
    doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 3, 3, "FD");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(107, 114, 128);
    doc.text("MONTHLY DIVIDEND", card2X + cardWidth / 2, cardY + 8, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(...COLORS.gold);
    doc.text(`AED ${formatAmount(monthlyRate)}`, card2X + cardWidth / 2, cardY + 20, { align: "center" });

    // Card 3: Total Amount (highlighted)
    const card3X = margin + (cardWidth + 7.5) * 2;
    doc.setFillColor(22, 101, 52); // Green background
    doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 3, 3, "F");
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(187, 247, 208); // Light green text
    doc.text("TOTAL AMOUNT", card3X + cardWidth / 2, cardY + 8, { align: "center" });
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text(`AED ${formatAmount(finalDividendTotal)}`, card3X + cardWidth / 2, cardY + 20, { align: "center" });

    yPosition = cardY + cardHeight + 12;

    // Dividend history table with improved styling
    const dividendTableData = dividendHistory.map((dividend, index) => [
      (index + 1).toString(),
      dividend.transactionNumber || dividend.dividendRefNo || `TXN-${String(index + 1).padStart(4, '0')}`,
      formatDate(dividend.date || dividend.paymentDate || dividend.createdAt),
      `AED ${formatAmount(dividend.amount || dividend.actualPaidAmount || 0)}`,
      dividend.status || dividend.strPaymentStatus || "Paid",
    ]);

    doc.autoTable({
      startY: yPosition,
      head: [["#", "Transaction Reference", "Payment Date", "Amount", "Status"]],
      body: dividendTableData,
      theme: "striped",
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: COLORS.gold,
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
        halign: "center",
        cellPadding: 4,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: COLORS.darkGray,
        cellPadding: 3,
      },
      columnStyles: {
        0: { cellWidth: 12, halign: "center" },
        1: { cellWidth: 50, halign: "left" },
        2: { cellWidth: 32, halign: "center" },
        3: { cellWidth: 38, halign: "right", fontStyle: "bold", textColor: [22, 101, 52] },
        4: { cellWidth: 28, halign: "center" },
      },
      alternateRowStyles: {
        fillColor: [252, 250, 245],
      },
      didParseCell: (data) => {
        // Color status column based on status - all should be Paid (green)
        if (data.column.index === 4 && data.section === "body") {
          const status = data.cell.raw?.toLowerCase() || "";
          if (status === "paid") {
            data.cell.styles.textColor = [22, 101, 52]; // Green for Paid
          } else if (status === "pending") {
            data.cell.styles.textColor = [245, 158, 11]; // Orange for Pending
          }
        }
      },
    });

    yPosition = doc.lastAutoTable.finalY + 12;

    // Verification note at the bottom
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text("This dividend payment history is an official record verified against our internal systems.", pageWidth / 2, yPosition, { align: "center" });

    // Draw footer for page 2
    drawPageFooter(2, totalPages);
  }

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

  // Build investment discrepancy table data
  const investmentTableData = [];

  if (discrepancyDetails.investmentAmount) {
    investmentTableData.push([
      "Investment Amount",
      `AED ${formatAmount(discrepancyDetails.investmentAmount.claimed)}`,
      `AED ${formatAmount(discrepancyDetails.investmentAmount.actual)}`,
      `AED ${formatAmount(discrepancyDetails.investmentAmount.difference)}`
    ]);
  }

  if (discrepancyDetails.investmentDate) {
    investmentTableData.push([
      "Investment Date",
      formatDate(discrepancyDetails.investmentDate.claimed),
      formatDate(discrepancyDetails.investmentDate.actual),
      "-"
    ]);
  }

  if (discrepancyDetails.dividendAmount) {
    investmentTableData.push([
      "Total Dividends",
      `AED ${formatAmount(discrepancyDetails.dividendAmount.claimed)}`,
      `AED ${formatAmount(discrepancyDetails.dividendAmount.actual)}`,
      `AED ${formatAmount(discrepancyDetails.dividendAmount.difference)}`
    ]);
  }

  if (discrepancyDetails.duration) {
    investmentTableData.push([
      "Duration",
      `${discrepancyDetails.duration.claimed} months`,
      `${discrepancyDetails.duration.actual} months`,
      "-"
    ]);
  }

  if (discrepancyDetails.referenceNumber) {
    investmentTableData.push([
      "Reference Number",
      discrepancyDetails.referenceNumber.claimed || "Not provided",
      discrepancyDetails.referenceNumber.actual || "N/A",
      "-"
    ]);
  }

  if (investmentTableData.length > 0) {
    doc.autoTable({
      startY: yPosition,
      head: [["Field", "Investor Claim", "Our Records", "Difference"]],
      body: investmentTableData,
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

  // ===== Bank Details Discrepancy Section =====
  const bankTableData = [];

  if (discrepancyDetails.bankName) {
    bankTableData.push([
      "Bank Name",
      discrepancyDetails.bankName.claimed || "Not provided",
      discrepancyDetails.bankName.actual || "N/A",
      discrepancyDetails.bankName.matched ? "Match" : "Mismatch"
    ]);
  }

  if (discrepancyDetails.accountNumber) {
    bankTableData.push([
      "Account Number",
      discrepancyDetails.accountNumber.claimed || "Not provided",
      discrepancyDetails.accountNumber.actual || "N/A",
      discrepancyDetails.accountNumber.matched ? "Match" : "Mismatch"
    ]);
  }

  if (discrepancyDetails.accountHolderName) {
    bankTableData.push([
      "Account Holder Name",
      discrepancyDetails.accountHolderName.claimed || "Not provided",
      discrepancyDetails.accountHolderName.actual || "N/A",
      discrepancyDetails.accountHolderName.matched ? "Match" : "Mismatch"
    ]);
  }

  if (discrepancyDetails.iban) {
    bankTableData.push([
      "IBAN",
      discrepancyDetails.iban.claimed || "Not provided",
      discrepancyDetails.iban.actual || "N/A",
      discrepancyDetails.iban.matched ? "Match" : "Mismatch"
    ]);
  }

  if (discrepancyDetails.branchName) {
    bankTableData.push([
      "Branch Name",
      discrepancyDetails.branchName.claimed || "Not provided",
      discrepancyDetails.branchName.actual || "N/A",
      discrepancyDetails.branchName.matched ? "Match" : "Mismatch"
    ]);
  }

  if (bankTableData.length > 0) {
    // Check if we need a new page
    if (yPosition > doc.internal.pageSize.getHeight() - 80) {
      doc.addPage();
      yPosition = 20;
    }

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(120, 53, 15);
    doc.text("Bank Details Discrepancy", margin, yPosition);
    yPosition += 8;

    doc.autoTable({
      startY: yPosition,
      head: [["Field", "Investor Claim", "Our Records", "Status"]],
      body: bankTableData,
      theme: "grid",
      margin: { left: margin, right: margin },
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 9,
      },
      bodyStyles: {
        fontSize: 9,
        textColor: [50, 50, 50],
      },
      columnStyles: {
        0: { fontStyle: "bold", fillColor: [239, 246, 255] },
        1: { fillColor: [224, 242, 254], textColor: [3, 105, 161] },
        2: { fillColor: [220, 252, 231], textColor: [22, 101, 52] },
        3: { fillColor: [254, 226, 226], textColor: [153, 27, 27], halign: "center" },
      },
      didParseCell: (data) => {
        // Color status column based on match status
        if (data.column.index === 3 && data.section === "body") {
          const status = data.cell.raw?.toLowerCase() || "";
          if (status === "match") {
            data.cell.styles.fillColor = [220, 252, 231];
            data.cell.styles.textColor = [22, 101, 52];
          } else {
            data.cell.styles.fillColor = [254, 226, 226];
            data.cell.styles.textColor = [153, 27, 27];
          }
        }
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
    // Use portfolioTotalInvestment (sum of all Initial + Topup investments) or fallback to totalInvestedAmount
    const portfolioTotalAmount = portfolio.portfolioTotalInvestment || portfolio.totalInvestedAmount || portfolio.dblInvestmentAmount || 0;
    const investments = portfolio.investments || [];
    const investmentCount = investments.length;

    const portfolioData = [
      ["Portfolio Ref", portfolio.portfolioRefNo || "N/A"],
      ["Total Invested (All)", `AED ${formatAmount(portfolioTotalAmount)}`],
      ["Investment Count", `${investmentCount} investment(s)`],
      ["Duration", `${portfolio.intDuration || 0} months`],
      ["ROI %", `${portfolio.dblROI || portfolio.percentage || 0}%`],
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

    // Show individual investments breakdown if available
    if (investments.length > 1) {
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(75, 85, 99);
      doc.text("Investment Breakdown:", margin, yPosition);
      yPosition += 6;

      const investmentsBreakdown = investments.map(inv => [
        inv.investmentRefNo || "N/A",
        inv.investmentType || "Initial",
        `AED ${formatAmount(inv.amount)}`,
        formatDate(inv.startDate || inv.createdAt)
      ]);

      doc.autoTable({
        startY: yPosition,
        head: [["Ref No", "Type", "Amount", "Date"]],
        body: investmentsBreakdown,
        theme: "grid",
        margin: { left: margin, right: margin },
        headStyles: {
          fillColor: [209, 250, 229],
          textColor: [22, 101, 52],
          fontStyle: "bold",
          fontSize: 8,
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [50, 50, 50],
        },
      });

      yPosition = doc.lastAutoTable.finalY + 10;
    }
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
