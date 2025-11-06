// server.js
import express from "express";
import cors from "cors";
import usuarioRoutes from "./routes/usuarioRoutes.js";
import dispositivosRoutes from "./routes/dispositivosRoutes.js";


const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/usuarios", usuarioRoutes);
app.use("/api/dispositivos", dispositivosRoutes);

console.log("✅ Rutas cargadas correctamente: /api/usuarios y /api/dispositivos");

const PORT = 8080;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));

