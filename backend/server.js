const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// AWS S3 Configuration
const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});

const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME;
const CLOUDFRONT_URL = process.env.CLOUDFRONT_URL;

// Multer config for memory storage (for S3 upload)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|pdf|doc|docx/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname || mimetype) {
      return cb(null, true);
    }
    cb(new Error("Only images (jpg, png) and documents (pdf, doc) are allowed"));
  },
});

// Upload file to S3
async function uploadToS3(file, folder = "investor-forms") {
  const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
  const fileName = `${folder}/${uniqueSuffix}-${file.originalname}`;

  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: file.buffer,
    ContentType: file.mimetype,
  };

  await s3Client.send(new PutObjectCommand(params));

  // Return CloudFront URL
  return `${CLOUDFRONT_URL}/${fileName}`;
}

// MongoDB Connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("MongoDB Connection Error:", err));

// Investor Form Schema - Updated Structure
const investorFormSchema = new mongoose.Schema(
  {
    // Court Agreement Number
    courtAgreementNumber: { type: String, required: true },

    // Section 1: Personal Information
    personalInfo: {
      fullName: { type: String, required: true },
      email: { type: String, required: true },
      phone: { type: String, required: true },
      phoneCode: { type: String },
      mobile: { type: String },
      mobileCode: { type: String },
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

    // Section 3: Investment Details (Combined - replaces investmentHistory and investmentRecords)
    investmentDetails: {
      referenceNumber: { type: String },
      amount: { type: Number, required: true },
      investmentDate: { type: Date, required: true },
      duration: { type: String, required: true },
      annualDividendPercentage: { type: Number, required: true },
      dividendFrequency: { type: String, required: true },
      status: { type: String, required: true },
    },

    // Payment Method (now part of investment section in frontend)
    paymentMethod: {
      method: { type: String, required: true },
      paidByCheque: { type: Boolean, required: true },
      chequeNumber: { type: String },
      chequeDate: { type: Date },
      chequeBankName: { type: String },
    },

    // Section 4: Dividend History
    dividendHistory: {
      totalReceived: { type: Number, required: true },
      lastReceivedDate: { type: Date },
      lastAmount: { type: Number },
      hasPending: { type: Boolean, required: true },
      pendingAmount: { type: Number },
    },

    // Section 5: Documents (S3 URLs)
    documents: {
      agreementCopy: { type: String },
      paymentProof: { type: String },
      dividendReceipts: { type: String },
      otherDocuments: { type: String },
    },

    // Section 6: Remarks
    remarks: {
      discrepancies: { type: String },
      additionalDetails: { type: String },
      contactPerson: { type: String },
    },

    // Section 7: Declaration
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
  res.json({ message: "Investor Form API is running!", storage: "AWS S3" });
});

// Submit form with file uploads to S3
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

      // Upload files to S3 and get URLs
      const documents = {};

      if (req.files) {
        if (req.files.agreementCopy) {
          documents.agreementCopy = await uploadToS3(req.files.agreementCopy[0]);
        }
        if (req.files.paymentProof) {
          documents.paymentProof = await uploadToS3(req.files.paymentProof[0]);
        }
        if (req.files.dividendReceipts) {
          documents.dividendReceipts = await uploadToS3(req.files.dividendReceipts[0]);
        }
        if (req.files.otherDocuments) {
          documents.otherDocuments = await uploadToS3(req.files.otherDocuments[0]);
        }
      }

      formData.documents = documents;

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

// Get all submissions with pagination and search
app.get("/api/submissions", async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      search = "",
      status = "",
      sortBy = "createdAt",
      sortOrder = "desc",
    } = req.query;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = {};

    // Search filter
    if (search) {
      query.$or = [
        { "personalInfo.fullName": { $regex: search, $options: "i" } },
        { "personalInfo.email": { $regex: search, $options: "i" } },
        { "personalInfo.phone": { $regex: search, $options: "i" } },
        { courtAgreementNumber: { $regex: search, $options: "i" } },
        { "investmentDetails.referenceNumber": { $regex: search, $options: "i" } },
      ];
    }

    // Status filter
    if (status && status !== "all") {
      query.status = status;
    }

    // Sort
    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === "asc" ? 1 : -1;

    // Get total count
    const totalCount = await InvestorForm.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    // Get paginated data
    const submissions = await InvestorForm.find(query)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    res.json({
      success: true,
      data: submissions,
      pagination: {
        currentPage: pageNum,
        totalPages,
        totalCount,
        limit: limitNum,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    });
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
  console.log(`Files will be stored in S3 bucket: ${BUCKET_NAME}`);
});
