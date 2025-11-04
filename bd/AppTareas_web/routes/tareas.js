import express from "express";
import connection from "../config/db.js";

const router = express.Router();

// Obtener todas las tareas
router.get("/", async (req, res) => {
  try {
    const [rows] = await connection.query("SELECT * FROM tareas");
    res.json(rows);
  } catch (error) {
    console.error("Error al obtener tareas:", error);
    res.status(500).send("Error del servidor");
  }
});

// Agregar una tarea
router.post("/", async (req, res) => {
  try {
    const { titulo, descripcion } = req.body;
    const [result] = await connection.query(
      "INSERT INTO tareas (titulo, descripcion) VALUES (?, ?)",
      [titulo, descripcion]
    );
    res.json({ id: result.insertId, titulo, descripcion });
  } catch (error) {
    console.error("Error al agregar tarea:", error);
    res.status(500).send("Error del servidor");
  }
});

export default router;
