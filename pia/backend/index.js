// server.js
import express from "express";
import cors from "cors";
import usuarioRoutes from "./routes/usuarioRoutes.js";

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/usuarios", usuarioRoutes);

const PORT = 8080;
app.listen(PORT, () => console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`));
