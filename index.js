require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/admin", require("./routes/admin"));
app.use("/api/cliente", require("./routes/client"));
app.use("/webhook", require("./routes/webhook"));

// Serve o PWA (front-end) como arquivos estáticos
app.use(express.static(path.join(__dirname, "..", "public")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando em http://localhost:${PORT}`));
