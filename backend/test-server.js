const express = require("express");

const app = express();
const PORT = 5000;

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Test server working",
  });
});

const server = app.listen(PORT, "127.0.0.1", () => {
  console.log("=================================");
  console.log("✅ TEST SERVER RUNNING");
  console.log(`🌐 http://127.0.0.1:${PORT}`);
  console.log("=================================");
});

server.on("error", (error) => {
  console.error("❌ SERVER ERROR:", error);
});

process.on("exit", (code) => {
  console.log("⚠️ Node process exited with code:", code);
});

process.on("SIGINT", () => {
  console.log("🛑 Server stopped");
  process.exit(0);
});