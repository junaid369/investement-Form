const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if not exists
const uploadsDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Serve uploaded files
app.use("/uploads", express.static(uploadsDir));

// Multer config for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "-" + file.originalname);
  },
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpg, png) and documents (pdf, doc) are allowed"));
  },
});

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Investor Form Schema
const investorFormSchema = new mongoose.Schema(
  {
    // Section 1: Personal Information
    personalInfo: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      mobile: { type: String },
      country: { type: String, required: true },
      address: { type: String, required: true },
      city: { type: String, required: true },
      state: { type: String },
      pincode: { type: String },
    },

    // Section 2: Bank Details
    bankDetails: {
      bankName: { type: String, required: true },
      accountNumber: { type: String, required: true },
      accountHolderName: { type: String, required: true },
      branchName: { type: String },
      iban: { type: String },
    },

    // Section 3: Investment History
    investmentHistory: {
      totalInvestments: { type: Number, required: true },
      totalAmount: { type: Number, required: true },
      firstInvestmentDate: { type: Date, required: true },
      latestInvestmentDate: { type: Date },
    },

    // Section 4: Investment Records
    investmentRecords: {
      referenceNumber: { type: String },
      amount: { type: Number, required: true },
      investmentDate: { type: Date, required: true },
      duration: { type: String, required: true },
      dividendPercentage: { type: Number, required: true },
      dividendFrequency: { type: String, required: true },
      status: { type: String, required: true },
    },

    // Section 5: Dividend History
    dividendHistory: {
      totalReceived: { type: Number, required: true },
      lastReceivedDate: { type: Date },
      lastAmount: { type: Number },
      hasPending: { type: Boolean, required: true },
      pendingAmount: { type: Number },
    },

    // Section 6: Payment Method
    paymentMethod: {
      method: { type: String, required: true },
      paidByCheque: { type: Boolean, required: true },
      chequeNumber: { type: String },
      chequeDate: { type: Date },
      chequeBankName: { type: String },
    },

    // Section 7: Documents
    documents: {
      agreementCopy: { type: String },
      paymentProof: { type: String },
      dividendReceipts: { type: String },
      otherDocuments: { type: String },
    },

    // Section 8: Remarks
    remarks: {
      discrepancies: { type: String },
      additionalDetails: { type: String },
      contactPerson: { type: String },
    },

    // Section 9: Declaration
    declaration: {
      confirmed: { type: Boolean, required: true },
      signature: { type: String, required: true },
    },

    // Meta
    submittedAt: { type: Date, default: Date.now },
    status: { type: String, default: "pending", enum: ["pending", "verified", "rejected"] },
  },
  { timestamps: true }
);

const InvestorForm = mongoose.model("InvestorForm", investorFormSchema);

// Routes

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Investor Form API is running!" });
});

// Submit form with file uploads
app.post(
  "/api/submit",
  upload.fields([
    { name: "agreementCopy", maxCount: 1 },
    { name: "paymentProof", maxCount: 1 },
    { name: "dividendReceipts", maxCount: 1 },
    { name: "otherDocuments", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const formData = JSON.parse(req.body.formData);

      // Add file paths to documents
      if (req.files) {
        formData.documents = {
          agreementCopy: req.files.agreementCopy ? `/uploads/${req.files.agreementCopy[0].filename}` : null,
          paymentProof: req.files.paymentProof ? `/uploads/${req.files.paymentProof[0].filename}` : null,
          dividendReceipts: req.files.dividendReceipts ? `/uploads/${req.files.dividendReceipts[0].filename}` : null,
          otherDocuments: req.files.otherDocuments ? `/uploads/${req.files.otherDocuments[0].filename}` : null,
        };
      }

      const newForm = new InvestorForm(formData);
      await newForm.save();

      res.status(201).json({
        success: true,
        message: "Form submitted successfully!",
        data: newForm,
      });
    } catch (error) {
      console.error("Submit Error:", error);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to submit form",
      });
    }
  }
);

// Get all submissions
app.get("/api/submissions", async (req, res) => {
  try {
    const submissions = await InvestorForm.find().sort({ createdAt: -1 });
    res.json({ success: true, data: submissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single submission
app.get("/api/submissions/:id", async (req, res) => {
  try {
    const submission = await InvestorForm.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }
    res.json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update submission status
app.patch("/api/submissions/:id/status", async (req, res) => {
  try {
    const { status } = req.body;
    const submission = await InvestorForm.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }
    res.json({ success: true, data: submission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Start server
const PORT = process.env.PORT || 5050;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
