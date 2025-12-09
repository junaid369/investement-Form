// API Base URL - Change this to your server URL
const API_URL = "http://localhost:5050";

// Current section tracking
let currentSection = 1;
const totalSections = 9;

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  updateProgress();
  setupConditionalFields();
  setupFormSubmission();
});

// Section Navigation
function nextSection() {
  const currentSectionEl = document.querySelector(`.form-section[data-section="${currentSection}"]`);

  // Validate current section
  if (!validateSection(currentSectionEl)) {
    return;
  }

  if (currentSection < totalSections) {
    currentSectionEl.classList.remove("active");
    currentSection++;
    document.querySelector(`.form-section[data-section="${currentSection}"]`).classList.add("active");
    updateProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function prevSection() {
  if (currentSection > 1) {
    document.querySelector(`.form-section[data-section="${currentSection}"]`).classList.remove("active");
    currentSection--;
    document.querySelector(`.form-section[data-section="${currentSection}"]`).classList.add("active");
    updateProgress();
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

// Update Progress Bar
function updateProgress() {
  const progress = (currentSection / totalSections) * 100;
  document.getElementById("progressBar").style.setProperty("--progress", `${progress}%`);
  document.getElementById("progressText").textContent = `Step ${currentSection} of ${totalSections}`;
}

// Validate Section
function validateSection(sectionEl) {
  const requiredFields = sectionEl.querySelectorAll("[required]");
  let isValid = true;

  requiredFields.forEach((field) => {
    if (!field.value || (field.type === "checkbox" && !field.checked)) {
      field.classList.add("error");
      isValid = false;

      // Show validation message
      field.reportValidity();
    } else {
      field.classList.remove("error");
    }
  });

  // Check radio buttons
  const radioGroups = sectionEl.querySelectorAll('.radio-group');
  radioGroups.forEach((group) => {
    const radios = group.querySelectorAll('input[type="radio"]');
    const isChecked = Array.from(radios).some(r => r.checked);
    if (radios[0]?.required && !isChecked) {
      isValid = false;
      alert('Please select an option');
    }
  });

  return isValid;
}

// Setup Conditional Fields
function setupConditionalFields() {
  // Pending Dividends
  const pendingRadios = document.querySelectorAll('input[name="hasPendingDividends"]');
  pendingRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const pendingGroup = document.getElementById("pendingAmountGroup");
      pendingGroup.style.display = e.target.value === "yes" ? "block" : "none";
    });
  });

  // Cheque Details
  const chequeRadios = document.querySelectorAll('input[name="paidByCheque"]');
  chequeRadios.forEach((radio) => {
    radio.addEventListener("change", (e) => {
      const chequeDetails = document.getElementById("chequeDetails");
      chequeDetails.style.display = e.target.value === "yes" ? "block" : "none";
    });
  });
}

// Setup Form Submission
function setupFormSubmission() {
  const form = document.getElementById("investorForm");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const submitBtn = document.getElementById("submitBtn");
    const originalText = submitBtn.innerHTML;

    // Disable button and show loading
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="spinner"></span> Submitting...';

    try {
      // Collect form data
      const formData = collectFormData();

      // Create FormData for file uploads
      const submitData = new FormData();
      submitData.append("formData", JSON.stringify(formData));

      // Add files
      const fileFields = ["agreementCopy", "paymentProof", "dividendReceipts", "otherDocuments"];
      fileFields.forEach((field) => {
        const fileInput = document.getElementById(field);
        if (fileInput.files[0]) {
          submitData.append(field, fileInput.files[0]);
        }
      });

      // Submit to API
      const response = await fetch(`${API_URL}/api/submit`, {
        method: "POST",
        body: submitData,
      });

      const result = await response.json();

      if (result.success) {
        showSuccessModal();
        form.reset();
        currentSection = 1;
        document.querySelectorAll(".form-section").forEach((s) => s.classList.remove("active"));
        document.querySelector('.form-section[data-section="1"]').classList.add("active");
        updateProgress();
      } else {
        showErrorModal(result.message || "Failed to submit form");
      }
    } catch (error) {
      console.error("Submit error:", error);
      showErrorModal("Network error. Please check your connection and try again.");
    } finally {
      submitBtn.disabled = false;
      submitBtn.innerHTML = originalText;
    }
  });
}

// Collect Form Data
function collectFormData() {
  return {
    personalInfo: {
      fullName: document.getElementById("fullName").value,
      email: document.getElementById("email").value,
      phone: document.getElementById("phone").value,
      mobile: document.getElementById("mobile").value,
      country: document.getElementById("country").value,
      address: document.getElementById("address").value,
      city: document.getElementById("city").value,
      state: document.getElementById("state").value,
      pincode: document.getElementById("pincode").value,
    },
    bankDetails: {
      bankName: document.getElementById("bankName").value,
      accountNumber: document.getElementById("accountNumber").value,
      accountHolderName: document.getElementById("accountHolderName").value,
      branchName: document.getElementById("branchName").value,
      iban: document.getElementById("iban").value,
    },
    investmentHistory: {
      totalInvestments: parseInt(document.getElementById("totalInvestments").value) || 0,
      totalAmount: parseFloat(document.getElementById("totalAmount").value) || 0,
      firstInvestmentDate: document.getElementById("firstInvestmentDate").value,
      latestInvestmentDate: document.getElementById("latestInvestmentDate").value || null,
    },
    investmentRecords: {
      referenceNumber: document.getElementById("referenceNumber").value,
      amount: parseFloat(document.getElementById("investmentAmount").value) || 0,
      investmentDate: document.getElementById("investmentDate").value,
      duration: document.getElementById("duration").value,
      dividendPercentage: parseFloat(document.getElementById("dividendPercentage").value) || 0,
      dividendFrequency: document.getElementById("dividendFrequency").value,
      status: document.getElementById("investmentStatus").value,
    },
    dividendHistory: {
      totalReceived: parseFloat(document.getElementById("totalDividendsReceived").value) || 0,
      lastReceivedDate: document.getElementById("lastDividendDate").value || null,
      lastAmount: parseFloat(document.getElementById("lastDividendAmount").value) || null,
      hasPending: document.querySelector('input[name="hasPendingDividends"]:checked')?.value === "yes",
      pendingAmount: parseFloat(document.getElementById("pendingDividendAmount").value) || null,
    },
    paymentMethod: {
      method: document.getElementById("paymentMethod").value,
      paidByCheque: document.querySelector('input[name="paidByCheque"]:checked')?.value === "yes",
      chequeNumber: document.getElementById("chequeNumber").value || null,
      chequeDate: document.getElementById("chequeDate").value || null,
      chequeBankName: document.getElementById("chequeBankName").value || null,
    },
    remarks: {
      discrepancies: document.getElementById("discrepancies").value,
      additionalDetails: document.getElementById("additionalDetails").value,
      contactPerson: document.getElementById("contactPerson").value,
    },
    declaration: {
      confirmed: document.getElementById("confirmAccuracy").checked,
      signature: document.getElementById("signature").value,
    },
  };
}

// Modals
function showSuccessModal() {
  document.getElementById("successModal").classList.add("show");
}

function closeModal() {
  document.getElementById("successModal").classList.remove("show");
}

function showErrorModal(message) {
  document.getElementById("errorMessage").textContent = message;
  document.getElementById("errorModal").classList.add("show");
}

function closeErrorModal() {
  document.getElementById("errorModal").classList.remove("show");
}

// Close modal on outside click
document.querySelectorAll(".modal").forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) {
      modal.classList.remove("show");
    }
  });
});
