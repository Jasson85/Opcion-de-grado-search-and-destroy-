    import mysql from "mysql2";

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  port: 3306,
  password: "",
  database: "destroy",
});

db.connect((err) => {
  if (err) {
    console.error("Error al conectar a la base de datos:", err);
    return;
  } else {
    console.log("Conectado a la base de datos 'destroy'.");
  }
});

export default db;