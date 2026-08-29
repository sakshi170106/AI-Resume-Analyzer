// ==========================================
// MIDDLEWARE
// ==========================================

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  "https://ai-resume-analyzer-vci7.vercel.app",
  "https://ai-resume-analyzer-2uxk.vercel.app",
  "https://ai-resume-analyzer-axxo.vercel.app",
];

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests without origin (Postman, server-to-server, etc.)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log("Blocked CORS origin:", origin);
      return callback(null, false);
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
    ],
    credentials: true,
  })
);

app.options("*", cors());

app.use(express.json());