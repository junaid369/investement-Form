const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const jwt = require("jsonwebtoken");
const axios = require("axios");
const https = require("https");
const nodemailer = require("nodemailer");
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

// Investor Form Schema - Updated Structure (fields not required to support drafts)
const investorFormSchema = new mongoose.Schema(
  {
    // Link to user who created this submission
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Court Agreement Number
    courtAgreementNumber: { type: String },

    // Section 1: Personal Information
    personalInfo: {
      fullName: { type: String },
      email: { type: String },
      phone: { type: String },
      phoneCode: { type: String },
      mobile: { type: String },
      mobileCode: { type: String },
      country: { type: String },
      address: { type: String },
      city: { type: String },
      state: { type: String },
      pincode: { type: String },
    },

    // Section 2: Bank Details
    bankDetails: {
      bankName: { type: String },
      accountNumber: { type: String },
      accountHolderName: { type: String },
      branchName: { type: String },
      iban: { type: String },
    },

    // Section 3: Investment Details
    investmentDetails: {
      referenceNumber: { type: String },
      amount: { type: Number },
      investmentDate: { type: Date },
      duration: { type: String },
      annualDividendPercentage: { type: Number },
      dividendFrequency: { type: String },
      status: { type: String },
    },

    // Payment Method
    paymentMethod: {
      method: { type: String },
      paidByCheque: { type: Boolean },
      chequeNumber: { type: String },
      chequeDate: { type: Date },
      chequeBankName: { type: String },
    },

    // Section 4: Dividend History
    dividendHistory: {
      totalReceived: { type: Number },
      lastReceivedDate: { type: Date },
      lastAmount: { type: Number },
      hasPending: { type: Boolean },
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
      confirmed: { type: Boolean },
      signature: { type: String },
    },

    // Track completed sections (1-7)
    completedSections: [{ type: Number }],

    // Meta
    submittedAt: { type: Date, default: Date.now },
    // draft = incomplete form, pending = complete form awaiting review
    status: { type: String, default: "draft", enum: ["draft", "pending", "verified", "rejected"] },
  },
  { timestamps: true }
);

const InvestorForm = mongoose.model("InvestorForm", investorFormSchema);

// User Schema for Portal Authentication
const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    phone: { type: String, required: true, unique: true },
    isVerified: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

// OTP Schema - Separate collection for OTP management
const otpSchema = new mongoose.Schema(
  {
    phone: { type: String, required: true, index: true },
    email: { type: String, index: true }, // Store email for international users
    otp: { type: String, required: true },
    isVerified: { type: Boolean, default: false },
    expiresAt: { type: Date, required: true },
    purpose: { type: String, enum: ["register", "login"], required: true },
    otpMethod: { type: String, enum: ["sms", "email"], default: "sms" }, // Track how OTP was sent
    // Store registration data temporarily until OTP is verified
    tempUserData: {
      fullName: { type: String },
      email: { type: String },
    },
  },
  { timestamps: true }
);

// Auto-delete expired OTPs after 1 hour
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 3600 });

const OTP = mongoose.model("OTP", otpSchema);

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || "matajar-investor-portal-secret-key-2024";

// Generate OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Email Transporter Configuration
const emailTransporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT) || 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Check if phone is UAE number (+971)
function isUAENumber(phone) {
  // Remove all non-digit characters except +
  const cleanPhone = phone.replace(/[^\d+]/g, "");
  return cleanPhone.startsWith("+971") || cleanPhone.startsWith("971") || cleanPhone.startsWith("00971");
}

// Send SMS OTP via MessageKnot (for UAE numbers only)
async function sendSmsOtp(otp, userNumber) {
  try {
    const username = process.env.SMS_USERNAME;
    const password = process.env.SMS_PASSWORD;
    const senderId = process.env.SMS_SENDER_ID;

    if (!username || !password || !senderId) {
      console.log("SMS credentials not configured, OTP:", otp);
      return true; // For testing without SMS
    }

    const SMS = `Your Matajar Group verification OTP code is ${otp}. Code valid for 10 minutes only, for one time use.`;
    const reqUrl = `https://sms.messageknot.com:1443/cgi-bin/sendsms?username=${username}&password=${password}&from=${senderId}&to=${userNumber}&text=${encodeURIComponent(SMS)}`;

    const response = await axios.get(reqUrl, {
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
    });

    console.log("SMS sent:", response.data);
    return true;
  } catch (error) {
    console.error("SMS Error:", error.message);
    return false;
  }
}

// Send Email OTP (for international numbers)
async function sendEmailOtp(otp, email, userName = "Investor") {
  try {
    console.log("Preparing to send Email OTP to:", email);
    console.log("Using SMTP User:", process.env.SMTP_USER);
    console.log("Using SMTP Pass:", process.env.SMTP_PASS ? "Configured" : "Not Configured");
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      console.log("Email credentials not configured, OTP:", otp, "Email:", email);
      return true; // For testing without email
    }
    console.log("Email transporter verified", process.env.SMTP_USER,process.env.SMTP_PASS);

    const mailOptions = {
      from: `"Matajar Group" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "Matajar Group - Your Verification Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #1a3a2a 0%, #2d5a3d 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
            <h1 style="color: #d4af37; margin: 0; font-size: 28px;">Matajar Group</h1>
            <p style="color: #fff; margin: 10px 0 0 0; font-size: 14px;">Investor Portal</p>
          </div>
          <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px;">
            <p style="color: #333; font-size: 16px;">Dear ${userName},</p>
            <p style="color: #555; font-size: 14px;">Your verification code for Matajar Group Investor Portal is:</p>
            <div style="background: #1a3a2a; padding: 20px; text-align: center; border-radius: 8px; margin: 20px 0;">
              <span style="color: #d4af37; font-size: 32px; font-weight: bold; letter-spacing: 8px;">${otp}</span>
            </div>
            <p style="color: #555; font-size: 14px;">This code is valid for <strong>10 minutes</strong> only.</p>
            <p style="color: #888; font-size: 12px; margin-top: 30px;">If you did not request this code, please ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #ddd; margin: 20px 0;">
            <p style="color: #888; font-size: 11px; text-align: center;">
              Matajar Group - Investor Portal<br>
              This is an automated message. Please do not reply.
            </p>
          </div>
        </div>
      `,
    };

    await emailTransporter.sendMail(mailOptions);
    console.log("Email OTP sent to:", email);
    return true;
  } catch (error) {
    console.error("Email Error:", error.message);
    return false;
  }
}

// Send OTP based on phone number (UAE = SMS, International = Email)
async function sendOtp(otp, phone, email, userName = "Investor") {
  if (isUAENumber(phone)) {
    // UAE number - send SMS
    await sendSmsOtp(otp, phone);
    return { method: "sms", destination: phone };
  } else {
    // International number - send Email
    await sendEmailOtp(otp, email, userName);
    return { method: "email", destination: email };
  }
}

// Helper: Get or create OTP for a phone number
async function getOrCreateOTP(phone, purpose, tempUserData = null) {
  // Check if there's an existing valid, unused OTP for this phone
  const existingOtp = await OTP.findOne({
    phone,
    isVerified: false,
    expiresAt: { $gt: new Date() },
    purpose,
  });

  if (existingOtp) {
    // Reuse existing OTP - don't send new SMS
    return { otp: existingOtp.otp, isExisting: true };
  }

  // Create new OTP
  const newOtpCode = generateOTP();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

  const otpDoc = new OTP({
    phone,
    otp: newOtpCode,
    isVerified: false,
    expiresAt,
    purpose,
    tempUserData,
  });
  await otpDoc.save();

  return { otp: newOtpCode, isExisting: false };
}

// JWT Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ success: false, message: "Access token required" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ success: false, message: "Invalid or expired token" });
    }
    req.user = user;
    next();
  });
};

// Routes

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Investor Form API is running!", storage: "AWS S3" });
});

// ==================== AUTH ROUTES ====================


//  SENDER_EMAIL="hr.momsandwives@gmail.com"
//     SOURCE="info@momsandwives.com"
//     APP_PASSWD="hfdl zasy euul jipr"
// Register new user - Step 1: Send OTP (user created after verification)
app.post("/api/auth/register", async (req, res) => {
  try {
    const { fullName, email, phone } = req.body;

    // Validate required fields
    if (!fullName || !email || !phone) {
      return res.status(400).json({ success: false, message: "Full name, email, and phone are required" });
    }

    // Normalize email to lowercase for comparison
    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists (check both email and phone separately for clear error messages)
    const existingEmailUser = await User.findOne({ email: { $regex: new RegExp(`^${normalizedEmail}$`, 'i') } });
    if (existingEmailUser) {
      return res.status(400).json({ success: false, message: "This email is already registered. Please use a different email or login." });
    }

    const existingPhoneUser = await User.findOne({ phone });
    if (existingPhoneUser) {
      return res.status(400).json({ success: false, message: "This phone number is already registered. Please use a different number or login." });
    }

    // Check for existing valid OTP
    const existingOtp = await OTP.findOne({
      phone,
      isVerified: false,
      expiresAt: { $gt: new Date() },
      purpose: "register",
    });

    if (existingOtp) {
      // Return existing OTP method info
      const isUAE = isUAENumber(phone);
      return res.json({
        success: true,
        message: isUAE
          ? "OTP already sent to your phone. Please enter the OTP to verify."
          : `OTP already sent to your email (${normalizedEmail}). Please check your inbox.`,
        otpMethod: isUAE ? "sms" : "email",
        destination: isUAE ? phone : normalizedEmail,
      });
    }

    // Create new OTP
    const newOtpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const isUAE = isUAENumber(phone);

    const otpDoc = new OTP({
      phone,
      email: normalizedEmail,
      otp: newOtpCode,
      isVerified: false,
      expiresAt,
      purpose: "register",
      otpMethod: isUAE ? "sms" : "email",
      tempUserData: { fullName, email: normalizedEmail },
    });
    await otpDoc.save();

    // Send OTP based on location
    const otpResult = await sendOtp(newOtpCode, phone, normalizedEmail, fullName);

    res.json({
      success: true,
      message: otpResult.method === "sms"
        ? "OTP sent to your phone via SMS. Please verify to complete registration."
        : `OTP sent to your email (${normalizedEmail}). Please check your inbox and spam folder.`,
      otpMethod: otpResult.method,
      destination: otpResult.destination,
    });
  } catch (error) {
    console.error("Register Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Login - Send OTP
app.post("/api/auth/login", async (req, res) => {
  try {
    const { phone } = req.body;

    const user = await User.findOne({ phone });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found. Please register first." });
    }

    // Check for existing valid OTP
    const existingOtp = await OTP.findOne({
      phone,
      isVerified: false,
      expiresAt: { $gt: new Date() },
      purpose: "login",
    });

    if (existingOtp) {
      // Return existing OTP method info
      const isUAE = isUAENumber(phone);
      return res.json({
        success: true,
        message: isUAE
          ? "OTP already sent to your phone. Please enter the OTP to verify."
          : `OTP already sent to your email (${user.email}). Please check your inbox.`,
        otpMethod: isUAE ? "sms" : "email",
        destination: isUAE ? phone : user.email,
      });
    }

    // Create new OTP
    const newOtpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const isUAE = isUAENumber(phone);

    const otpDoc = new OTP({
      phone,
      email: user.email,
      otp: newOtpCode,
      isVerified: false,
      expiresAt,
      purpose: "login",
      otpMethod: isUAE ? "sms" : "email",
    });
    await otpDoc.save();

    // Send OTP based on location
    const otpResult = await sendOtp(newOtpCode, phone, user.email, user.fullName);

    res.json({
      success: true,
      message: otpResult.method === "sms"
        ? "OTP sent to your phone via SMS."
        : `OTP sent to your email (${user.email}). Please check your inbox and spam folder.`,
      otpMethod: otpResult.method,
      destination: otpResult.destination,
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Send OTP (for resend) - forces new OTP creation
app.post("/api/auth/send-otp", async (req, res) => {
  try {
    const { phone, purpose = "login" } = req.body;

    let userEmail = null;
    let userName = "Investor";

    // For login purpose, check if user exists and get email
    if (purpose === "login") {
      const user = await User.findOne({ phone });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
      userEmail = user.email;
      userName = user.fullName;
    }

    // Get temp user data from old OTP if it's for registration
    let tempUserData = null;
    if (purpose === "register") {
      const oldOtp = await OTP.findOne({ phone, purpose: "register" }).sort({ createdAt: -1 });
      if (oldOtp && oldOtp.tempUserData) {
        tempUserData = oldOtp.tempUserData;
        userEmail = oldOtp.tempUserData.email;
        userName = oldOtp.tempUserData.fullName;
      }
    }

    // For international users, email is required
    const isUAE = isUAENumber(phone);
    if (!isUAE && !userEmail) {
      return res.status(400).json({ success: false, message: "Email is required for international users. Please register again." });
    }

    // Invalidate any existing OTPs for this phone and purpose
    await OTP.updateMany(
      { phone, purpose, isVerified: false },
      { $set: { expiresAt: new Date() } }
    );

    // Create new OTP
    const newOtpCode = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    const otpDoc = new OTP({
      phone,
      email: userEmail,
      otp: newOtpCode,
      isVerified: false,
      expiresAt,
      purpose,
      otpMethod: isUAE ? "sms" : "email",
      tempUserData,
    });
    await otpDoc.save();

    // Send OTP based on location
    const otpResult = await sendOtp(newOtpCode, phone, userEmail, userName);

    res.json({
      success: true,
      message: otpResult.method === "sms"
        ? "New OTP sent to your phone via SMS."
        : `New OTP sent to your email (${userEmail}). Please check your inbox and spam folder.`,
      otpMethod: otpResult.method,
      destination: otpResult.destination,
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Verify OTP - validates from OTP collection, creates user for registration
app.post("/api/auth/verify-otp", async (req, res) => {
  try {
    const { phone, otp } = req.body;

    // Find valid OTP in collection
    const otpDoc = await OTP.findOne({
      phone,
      otp,
      isVerified: false,
      expiresAt: { $gt: new Date() },
    });

    if (!otpDoc) {
      // Check if OTP exists but expired
      const expiredOtp = await OTP.findOne({ phone, otp, isVerified: false });
      if (expiredOtp) {
        return res.status(400).json({ success: false, message: "OTP has expired" });
      }
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    // Mark OTP as verified
    otpDoc.isVerified = true;
    await otpDoc.save();

    let user;

    if (otpDoc.purpose === "register") {
      // For registration, create the user now
      const { fullName, email } = otpDoc.tempUserData || {};
      if (!fullName || !email) {
        return res.status(400).json({ success: false, message: "Registration data not found. Please register again." });
      }

      // Double check user doesn't exist
      const existingUser = await User.findOne({ $or: [{ email }, { phone }] });
      if (existingUser) {
        return res.status(400).json({ success: false, message: "User already exists. Please login instead." });
      }

      // Create user
      user = new User({
        fullName,
        email,
        phone,
        isVerified: true,
      });
      await user.save();
    } else {
      // For login, find existing user
      user = await User.findOne({ phone });
      if (!user) {
        return res.status(404).json({ success: false, message: "User not found" });
      }
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, phone: user.phone, email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: otpDoc.purpose === "register"
        ? "Registration completed successfully"
        : "OTP verified successfully",
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ==================== USER SUBMISSION ROUTES ====================

// Get user's submissions
app.get("/api/user/submissions", authenticateToken, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = "" } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;
console.log("Fetching submissions for user:", req.user.userId);
    // Get user's phone/email for filtering
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Build query - filter by userId OR user's phone/email (for backwards compatibility)
    // Also check if phone contains the user's phone number (without country code matching issues)
    const phoneDigits = user.phone ? user.phone.replace(/\D/g, '').slice(-9) : '';
    let query = {
      $or: [
        { userId: user._id },
        { "personalInfo.phone": user.phone },
        { "personalInfo.email": user.email },
        ...(user.email ? [{ "personalInfo.email": { $regex: new RegExp(`^${user.email}$`, 'i') } }] : []),
        ...(phoneDigits ? [{ "personalInfo.phone": { $regex: phoneDigits } }] : []),
      ],
    };

    // Add search filter
    if (search) {
      query.$and = [
        {
          $or: [
            { "personalInfo.fullName": { $regex: search, $options: "i" } },
            { courtAgreementNumber: { $regex: search, $options: "i" } },
          ],
        },
      ];
    }

    const totalCount = await InvestorForm.countDocuments(query);
    const totalPages = Math.ceil(totalCount / limitNum);

    const submissions = await InvestorForm.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Get all submissions for stats (check userId OR matching phone/email for backwards compatibility)
    const allSubmissions = await InvestorForm.find({
      $or: [
        { userId: user._id },
        { "personalInfo.phone": user.phone },
        { "personalInfo.email": user.email },
        ...(user.email ? [{ "personalInfo.email": { $regex: new RegExp(`^${user.email}$`, 'i') } }] : []),
        ...(phoneDigits ? [{ "personalInfo.phone": { $regex: phoneDigits } }] : []),
      ],
    });

    res.json({
      success: true,
      submissions,
      allSubmissions,
      total: totalCount,
      totalPages,
      currentPage: pageNum,
    });
  } catch (error) {
    console.error("Get User Submissions Error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get single user submission
app.get("/api/user/submissions/:id", authenticateToken, async (req, res) => {
  try {
    const submission = await InvestorForm.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    // Verify ownership - check userId first, then fall back to phone/email matching
    const user = await User.findById(req.user.userId);
    const phoneDigits = user.phone ? user.phone.replace(/\D/g, '').slice(-9) : '';
    const submissionPhoneDigits = submission.personalInfo?.phone ? submission.personalInfo.phone.replace(/\D/g, '').slice(-9) : '';

    const isOwner =
      (submission.userId && submission.userId.toString() === user._id.toString()) ||
      (submission.personalInfo?.phone === user.phone) ||
      (submission.personalInfo?.email === user.email) ||
      (submission.personalInfo?.email && user.email && submission.personalInfo.email.toLowerCase() === user.email.toLowerCase()) ||
      (phoneDigits && submissionPhoneDigits && phoneDigits === submissionPhoneDigits);

    if (!isOwner) {
      console.log("Access denied for user:", user._id, "submission userId:", submission.userId);
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    res.json({ success: true, submission });
  } catch (error) {
    console.error("Get submission error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Delete user submission (only pending/draft)
app.delete("/api/user/submissions/:id", authenticateToken, async (req, res) => {
  try {
    const submission = await InvestorForm.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    // Verify ownership - check userId first, then fall back to phone/email matching
    const user = await User.findById(req.user.userId);
    const phoneDigits = user.phone ? user.phone.replace(/\D/g, '').slice(-9) : '';
    const submissionPhoneDigits = submission.personalInfo?.phone ? submission.personalInfo.phone.replace(/\D/g, '').slice(-9) : '';

    const isOwner =
      (submission.userId && submission.userId.toString() === user._id.toString()) ||
      (submission.personalInfo?.phone === user.phone) ||
      (submission.personalInfo?.email === user.email) ||
      (submission.personalInfo?.email && user.email && submission.personalInfo.email.toLowerCase() === user.email.toLowerCase()) ||
      (phoneDigits && submissionPhoneDigits && phoneDigits === submissionPhoneDigits);

    if (!isOwner) {
      return res.status(403).json({ success: false, message: "Access denied" });
    }

    // Only allow deleting pending/draft submissions
    if (submission.status === "verified") {
      return res.status(400).json({ success: false, message: "Cannot delete verified submissions" });
    }

    await InvestorForm.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Submission deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Save draft
app.post("/api/user/submissions/draft", authenticateToken, async (req, res) => {
  try {
    const formData = req.body;
    formData.status = "draft";
    formData.userId = req.user.userId; // Link draft to authenticated user
    console.log("Saving draft with userId:", req.user.userId);

    const newForm = new InvestorForm(formData);
    await newForm.save();
    console.log("Draft saved with _id:", newForm._id, "userId:", newForm.userId);

    res.json({ success: true, message: "Draft saved", submission: newForm });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update draft
app.put("/api/user/submissions/draft/:id", authenticateToken, async (req, res) => {
  try {
    const submission = await InvestorForm.findById(req.params.id);
    if (!submission) {
      return res.status(404).json({ success: false, message: "Submission not found" });
    }

    // Only update drafts or pending
    if (submission.status === "verified") {
      return res.status(400).json({ success: false, message: "Cannot edit verified submissions" });
    }

    console.log("Updating draft", req.params.id, "with userId:", req.user.userId);
    const updatedSubmission = await InvestorForm.findByIdAndUpdate(
      req.params.id,
      { ...req.body, status: "draft", userId: req.user.userId },
      { new: true }
    );
    console.log("Draft updated, userId:", updatedSubmission.userId);

    res.json({ success: true, message: "Draft updated", submission: updatedSubmission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Submit form with file uploads to S3 (authenticated user)
app.post(
  "/api/user/submit",
  authenticateToken,
  upload.fields([
    { name: "agreementCopy", maxCount: 1 },
    { name: "paymentProof", maxCount: 1 },
    { name: "dividendReceipts", maxCount: 1 },
    { name: "otherDocuments", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const formData = JSON.parse(req.body.formData);
      formData.userId = req.user.userId; // Link submission to authenticated user
      console.log("Submitting form with userId:", req.user.userId, "existing _id:", formData._id);

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

      let submission;

      // Check if we're updating an existing submission (editing a draft)
      if (formData._id) {
        const existingSubmission = await InvestorForm.findById(formData._id);
        if (existingSubmission && existingSubmission.status !== "verified") {
          // Update existing submission
          delete formData._id; // Remove _id from update data
          submission = await InvestorForm.findByIdAndUpdate(
            existingSubmission._id,
            formData,
            { new: true }
          );
        } else {
          // Create new if not found or verified
          const newForm = new InvestorForm(formData);
          submission = await newForm.save();
        }
      } else {
        // Create new submission
        const newForm = new InvestorForm(formData);
        submission = await newForm.save();
      }

      res.status(201).json({
        success: true,
        message: "Form submitted successfully!",
        submission,
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

// Submit form with file uploads to S3 (legacy unauthenticated - kept for backwards compatibility)
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
