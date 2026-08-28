const express = require("express");
const cors = require("cors");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const mammoth = require("mammoth");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");
require("dotenv").config();

const app = express();

const PORT = process.env.PORT || 5000;

// ==========================================
// MIDDLEWARE
// ==========================================

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
    credentials: true,
  })
);

app.use(express.json());

// ==========================================
// MONGODB
// ==========================================

if (!process.env.MONGO_URI) {
  console.log("⚠️ MONGO_URI is missing in .env");
} else {
  mongoose
    .connect(process.env.MONGO_URI)
    .then(() => {
      console.log("=================================");
      console.log("✅ MongoDB Connected Successfully");
      console.log("=================================");
    })
    .catch((error) => {
      console.error("❌ MongoDB Connection Error:");
      console.error(error.message);
    });
}

// ==========================================
// USER MODEL
// ==========================================

const User = require("./models/User");

// ==========================================
// FILE UPLOAD
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only PDF and DOCX files are supported."));
    }
  },
});

// ==========================================
// HOME
// ==========================================

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ResumeAI Backend Running 🚀",
  });
});

// ==========================================
// API TEST
// ==========================================

app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working ✅",
  });
});

// ==========================================
// SIGNUP
// ==========================================

app.post("/api/auth/signup", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database is not connected.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const existingUser = await User.findOne({
      email: cleanEmail,
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "An account with this email already exists.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name: name.trim(),
      email: cleanEmail,
      password: hashedPassword,
    });

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    console.log("✅ New user registered:", user.email);

    res.status(201).json({
      success: true,
      message: "Account created successfully.",
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Signup Error:", error);

    res.status(500).json({
      success: false,
      message: "Signup failed.",
    });
  }
});

// ==========================================
// LOGIN
// ==========================================

app.post("/api/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required.",
      });
    }

    if (mongoose.connection.readyState !== 1) {
      return res.status(503).json({
        success: false,
        message: "Database is not connected.",
      });
    }

    const cleanEmail = email.trim().toLowerCase();

    const user = await User.findOne({
      email: cleanEmail,
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password.",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
        email: user.email,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "7d",
      }
    );

    console.log("✅ User logged in:", user.email);

    res.json({
      success: true,
      message: "Login successful.",
      token,

      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("❌ Login Error:", error);

    res.status(500).json({
      success: false,
      message: "Login failed.",
    });
  }
});

// ==========================================
// CHECK LOGIN USER
// ==========================================

app.get("/api/auth/me", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "No authentication token.",
      });
    }

    const token = authHeader.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    const user = await User.findById(
      decoded.userId
    ).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    res.json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
});

// ==========================================
// RESUME ANALYZER
// ==========================================

app.post(
  "/api/analyze",
  upload.single("resume"),

  async (req, res) => {
    try {
      console.log("");
      console.log("=================================");
      console.log("📄 Resume analysis started");
      console.log("=================================");

      if (!req.file) {
        return res.status(400).json({
          success: false,
          message: "Please upload a resume.",
        });
      }

      console.log(
        "📁 File:",
        req.file.originalname
      );

      console.log(
        "📦 Size:",
        req.file.size,
        "bytes"
      );

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          success: false,
          message:
            "GEMINI_API_KEY is missing in .env",
        });
      }

      const extension = req.file.originalname
        .split(".")
        .pop()
        .toLowerCase();

      let resumeText = "";

      // PDF

      if (extension === "pdf") {
        console.log("📕 Reading PDF...");

        const data = await pdfParse(
          req.file.buffer
        );

        resumeText = data.text;
      }

      // DOCX

      else if (extension === "docx") {
        console.log("📘 Reading DOCX...");

        const data =
          await mammoth.extractRawText({
            buffer: req.file.buffer,
          });

        resumeText = data.value;
      }

      else {
        return res.status(400).json({
          success: false,
          message:
            "Only PDF and DOCX files are supported.",
        });
      }

      resumeText = resumeText
        .replace(/\s+/g, " ")
        .trim();

      console.log(
        "📝 Extracted characters:",
        resumeText.length
      );

      if (resumeText.length < 30) {
        return res.status(400).json({
          success: false,
          message:
            "Could not read enough text from this resume.",
        });
      }

      const jobDescription =
        req.body.jobDescription?.trim() ||
        "Not provided";

      console.log("🤖 Connecting to Gemini...");

      const genAI =
        new GoogleGenerativeAI(
          process.env.GEMINI_API_KEY
        );

      const model =
        genAI.getGenerativeModel({
          model: "gemini-3.6-flash",
        });

      const prompt = `
You are a professional ATS Resume Analyzer.

Analyze the resume based ONLY on actual resume content.

Return ONLY valid JSON.

Do not use markdown.

Return exactly:

{
  "atsScore": 0,
  "skillsMatch": 0,
  "keywords": 0,
  "format": 0,
  "experience": 0,
  "education": 0,
  "summary": "",
  "strengths": [],
  "missingSkills": [],
  "suggestions": []
}

Scores must be realistic and based on the resume.

Provide:

3 to 5 strengths.

3 to 8 missing skills or keywords.

3 to 5 useful suggestions.

JOB DESCRIPTION:

${jobDescription}

RESUME:

${resumeText}
`;

      console.log(
        "🚀 Sending resume to Gemini..."
      );

      const result =
        await model.generateContent(prompt);

      const response =
        await result.response;

      let aiText = response.text();

      console.log(
        "✅ Gemini response received"
      );

      aiText = aiText
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      let analysis;

      try {
        analysis = JSON.parse(aiText);
      } catch (error) {
        console.error(
          "❌ Invalid Gemini JSON:"
        );

        console.error(aiText);

        return res.status(500).json({
          success: false,
          message:
            "Gemini returned invalid JSON.",
        });
      }

      const scoreFields = [
        "atsScore",
        "skillsMatch",
        "keywords",
        "format",
        "experience",
        "education",
      ];

      scoreFields.forEach((field) => {
        let value = Number(
          analysis[field]
        );

        if (isNaN(value)) {
          value = 0;
        }

        value = Math.max(
          0,
          Math.min(100, value)
        );

        analysis[field] =
          Math.round(value);
      });

      if (!Array.isArray(analysis.strengths)) {
        analysis.strengths = [];
      }

      if (
        !Array.isArray(
          analysis.missingSkills
        )
      ) {
        analysis.missingSkills = [];
      }

      if (
        !Array.isArray(
          analysis.suggestions
        )
      ) {
        analysis.suggestions = [];
      }

      console.log(
        "🎯 ATS Score:",
        analysis.atsScore
      );

      console.log(
        "💻 Skills:",
        analysis.skillsMatch
      );

      console.log(
        "🔑 Keywords:",
        analysis.keywords
      );

      console.log(
        "📐 Format:",
        analysis.format
      );

      console.log(
        "================================="
      );

      console.log(
        "✅ Analysis completed"
      );

      console.log(
        "================================="
      );

      res.json({
        success: true,
        fileName:
          req.file.originalname,
        analysis,
      });
    } catch (error) {
      console.error(
        "❌ ANALYSIS ERROR:",
        error
      );

      res.status(500).json({
        success: false,
        message:
          error.message ||
          "Resume analysis failed.",
      });
    }
  }
);

// ==========================================
// ERROR HANDLER
// ==========================================

app.use(
  (error, req, res, next) => {
    console.error(
      "❌ Server error:",
      error
    );

    if (
      error instanceof multer.MulterError
    ) {
      if (
        error.code ===
        "LIMIT_FILE_SIZE"
      ) {
        return res.status(400).json({
          success: false,
          message:
            "File size must be less than 5 MB.",
        });
      }
    }

    if (
      error.message ===
      "Only PDF and DOCX files are supported."
    ) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    res.status(500).json({
      success: false,
      message:
        error.message ||
        "Server error.",
    });
  }
);

// ==========================================
// 404
// ==========================================

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "API route not found.",
    path: req.originalUrl,
  });
});

// ==========================================
// START SERVER
// ==========================================

app.listen(PORT, () => {
  console.log("");
  console.log("=================================");
  console.log("🚀 ResumeAI Backend Running");
  console.log(`🌐 http://localhost:${PORT}`);
  console.log(
    `🧪 http://localhost:${PORT}/api/test`
  );
  console.log(
    "🔐 POST /api/auth/signup"
  );
  console.log(
    "🔑 POST /api/auth/login"
  );
  console.log(
    "📄 POST /api/analyze"
  );
  console.log("=================================");
  console.log("");
});