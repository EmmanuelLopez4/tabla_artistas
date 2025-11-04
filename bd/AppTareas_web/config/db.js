import mysql from "mysql2/promise";

const connection = await mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "BUCK099lol",
  database: "tareas_db"
});

try {
  await connection.connect();
  console.log("✅ Conectado a MySQL correctamente");
} catch (error) {
  console.error("❌ Error al conectar con MySQL:", error);
}

export default connection;
