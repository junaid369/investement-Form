const { jsPDF } = require("jspdf");
require("jspdf-autotable");

// Company Information
const COMPANY_INFO = {
  name: "MAG Financial Services LLC",
  address: "Dubai, United Arab Emirates",
  phone: "+971 X XXXX XXXX",
  email: "info@magfinancial.com",
  website: "www.magfinancial.com",
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
 * Generate Investment Verification Certificate PDF
 * @param {Object} submission - The legal submission data
 * @returns {Buffer} - The generated PDF as buffer
 */
const generateVerificationCertificate = (submission) => {
  const doc = new jsPDF();

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPosition = 20;

  // ===== HEADER SECTION =====
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

  // ===== TITLE SECTION =====
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(18);
  doc.setFont(undefined, "bold");
  doc.text("INVESTMENT CLOSURE VERIFICATION CERTIFICATE", pageWidth / 2, yPosition, { align: "center" });

  yPosition += 15;

  // Certificate Number and Date
  doc.setFontSize(10);
  doc.setFont(undefined, "normal");
  doc.setTextColor(100, 100, 100);
  const certNumber = submission.certificateNumber || `CERT-${submission._id.toString().slice(-8).toUpperCase()}`;
  const verificationDate = formatDate(submission.certificateGeneratedAt || new Date());
  doc.text(`Certificate No: ${certNumber}`, margin, yPosition);
  doc.text(`Verification Date: ${verificationDate}`, pageWidth - margin, yPosition, { align: "right" });

  yPosition += 15;

  // ===== VERIFICATION STATEMENT =====
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

  // ===== INVESTOR INFORMATION SECTION =====
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
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // ===== BANK DETAILS SECTION =====
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
    ["Branch", submission.bankDetails?.branchName || "N/A"],
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
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // ===== INVESTMENT DETAILS SECTION =====
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
    ["Annual Dividend Rate", `${submission.investmentDetails?.annualDividendPercentage || 0}%`],
    ["Dividend Frequency", submission.investmentDetails?.dividendFrequency || "N/A"],
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
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
  });

  yPosition = doc.lastAutoTable.finalY + 10;

  // ===== PAYMENT SUMMARY SECTION =====
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
      1: {
        cellWidth: "auto",
        textColor: [22, 101, 52],
        fontStyle: "bold",
        fontSize: 11,
      },
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    headStyles: {
      fillColor: [240, 240, 240],
    },
  });

  yPosition = doc.lastAutoTable.finalY + 15;

  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  // ===== DECLARATION SECTION =====
  doc.setFontSize(9);
  doc.setTextColor(80, 80, 80);
  doc.setFont(undefined, "italic");

  const declarationText = `This certificate confirms that the investment closure request has been verified by ${COMPANY_INFO.name}. The information provided has been cross-referenced with our internal records and found to be accurate. The amount stated above will be processed for return to the investor's designated bank account within the stipulated timeframe as per our company policy.`;

  const splitDeclaration = doc.splitTextToSize(declarationText, pageWidth - (margin * 2));
  doc.text(splitDeclaration, margin, yPosition);
  yPosition += (splitDeclaration.length * 5) + 15;

  // ===== SIGNATURE SECTION =====
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.3);

  const signatureY = yPosition + 15;
  doc.line(margin, signatureY, margin + 60, signatureY);
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Authorized Signature", margin, signatureY + 5);
  doc.setFont(undefined, "normal");
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text(COMPANY_INFO.name, margin, signatureY + 10);
  if (submission.verifiedBy) {
    doc.text(`Verified by: ${submission.verifiedBy}`, margin, signatureY + 14);
  }

  doc.line(pageWidth - margin - 60, signatureY, pageWidth - margin, signatureY);
  doc.setFontSize(9);
  doc.setFont(undefined, "bold");
  doc.setTextColor(0, 0, 0);
  doc.text("Company Stamp", pageWidth - margin - 30, signatureY + 5, { align: "center" });

  // ===== FOOTER SECTION =====
  const footerY = pageHeight - 15;
  doc.setDrawColor(41, 128, 185);
  doc.setLineWidth(0.5);
  doc.line(margin, footerY - 5, pageWidth - margin, footerY - 5);

  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.setFont(undefined, "normal");
  doc.text(COMPANY_INFO.address, pageWidth / 2, footerY, { align: "center" });
  doc.text(`${COMPANY_INFO.phone} | ${COMPANY_INFO.email} | ${COMPANY_INFO.website}`, pageWidth / 2, footerY + 4, { align: "center" });

  // Return PDF as buffer
  return Buffer.from(doc.output("arraybuffer"));
};

module.exports = {
  generateVerificationCertificate,
};
