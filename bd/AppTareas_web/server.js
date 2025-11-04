import express from "express";
import path from "path";
import { fileURLToPath } from "url";
import tareasRouter from "./routes/tareas.js";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Permitir JSON
app.use(express.json());

// Servir el frontend
app.use(express.static(path.join(__dirname, "public")));

// Rutas API
app.use("/tareas", tareasRouter);

// Ruta raíz (para abrir index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Iniciar servidor
app.listen(3000, () => {
  console.log("🚀 Servidor corriendo en http://localhost:3000");
});
