import express from "express";
import axios from "axios";
import db from "../db.js";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

router.get("/descargar/:id", verifyToken, (req, res) => {
    const dispositivo_id = req.params.id;
    const { userId: usuario_id_token, userRol: rol } = req;

    let sql = "SELECT ip, usuario_id FROM dispositivos WHERE id = ?";
    
    db.query(sql, [dispositivo_id], async (err, results) => {
        if (err) {
            console.error('Error al buscar dispositivo:', err);
            return res.status(500).json({ message: "Error interno del servidor" });
        }
        if (results.length === 0) {
            return res.status(404).json({ message: "Dispositivo no encontrado." });
        }

        const dispositivo = results[0];

        if (rol !== 'admin' && dispositivo.usuario_id !== usuario_id_token) {
            return res.status(403).json({ message: "No autorizado para controlar este dispositivo." });
        }

        const ip = dispositivo.ip;
        try {
            await axios.get(`http://${ip}/descarga`, { timeout: 8000 });
            console.log(`Descarga ejecutada en dispositivo ID ${dispositivo_id} (${ip})`);
            
            db.query("CALL sp_actualizar_estado_dispositivo(?, 'apagado')", [dispositivo_id]); 
            
            return res.json({ message: `Comando 'Descarga' enviado al dispositivo ${dispositivo_id}` });
        } catch (error) {
            console.error(`Error al comunicarse con el dispositivo ${dispositivo_id}:`, error.message);
            return res.status(500).json({ message: "Error al enviar el comando al dispositivo (revisa que el ESP32 esté activo)." });
        }
    });
});

router.get("/encender/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { userId: usuario_id_token, userRol: rol } = req;

  db.query("SELECT ip, usuario_id FROM dispositivos WHERE id = ?", [id], async (err, results) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    if (results.length === 0) return res.status(404).json({ message: "Dispositivo no encontrado" });

    const dispositivo = results[0];

    if (rol !== 'admin' && dispositivo.usuario_id !== usuario_id_token) {
      return res.status(403).json({ message: "No autorizado para encender este dispositivo." });
    }

    const ip = dispositivo.ip;
    try {
      await axios.get(`http://${ip}/on`, { timeout: 4000 });
      console.log(`Dispositivo ${id} encendido (${ip})`);
      db.query("CALL sp_actualizar_estado_dispositivo(?, 'encendido')", [id]);
      return res.json({ message: `Dispositivo ${id} encendido correctamente` });
    } catch (error) {
      console.error("Error al encender:", error.message || error);
      return res.status(500).json({ message: "No se pudo comunicar con el dispositivo" });
    }
  });
});

router.get("/apagar/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { userId: usuario_id_token, userRol: rol } = req;

  db.query("SELECT ip, usuario_id FROM dispositivos WHERE id = ?", [id], async (err, results) => {
    if (err) return res.status(500).json({ message: "Error en el servidor" });
    if (results.length === 0) return res.status(404).json({ message: "Dispositivo no encontrado" });

    const dispositivo = results[0];

    if (rol !== 'admin' && dispositivo.usuario_id !== usuario_id_token) {
      return res.status(403).json({ message: "No autorizado para apagar este dispositivo." });
    }

    const ip = dispositivo.ip;
    try {
      await axios.get(`http://${ip}/off`, { timeout: 4000 });
      console.log(`Dispositivo ${id} apagado (${ip})`);
      db.query("CALL sp_actualizar_estado_dispositivo(?, 'apagado')", [id]);
      return res.json({ message: `Dispositivo ${id} apagado correctamente` });
    } catch (error) {
      console.error("Error al apagar:", error.message || error);
      return res.status(500).json({ message: "No se pudo comunicar con el dispositivo" });
    }
  });
});

router.get("/estado/:id", verifyToken, (req, res) => {
  const { id } = req.params;
  const { userId: usuario_id_token, userRol: rol } = req;

  db.query("SELECT ip, usuario_id FROM dispositivos WHERE id = ?", [id], async (err, results) => {
    if (err) return res.status(500).json({ estado: "error", message: "Error en el servidor" });
    if (results.length === 0) return res.status(404).json({ estado: "desconocido", message: "Dispositivo no encontrado" });

    const dispositivo = results[0];

    if (rol !== 'admin' && dispositivo.usuario_id !== usuario_id_token) {
      return res.status(403).json({ estado: "error", message: "No autorizado para consultar este dispositivo." });
    }

    const ip = dispositivo.ip;
    try {
      const response = await axios.get(`http://${ip}/status`, { timeout: 3000 });
      const body = typeof response.data === "string" ? response.data : JSON.stringify(response.data);
      const estado = body.includes("ON") ? "encendido" : "apagado";
      return res.status(200).json({ estado });
    } catch (error) {
      console.error("Error al conectar con el dispositivo:", error.message || error);
      return res.status(500).json({ estado: "error", message: "Error al conectar con el dispositivo" });
    }
  });
});

router.get("/", verifyToken, (req, res) => {
    const { userRol: rol, userId: usuarioId } = req;

    let sql;
    let params = [];

    if (rol === "usuario") {
        sql = "SELECT id, marca, imei, serial, ip, estado, latitud, longitud FROM dispositivos WHERE usuario_id = ?";
        params = [usuarioId];
    } else if (rol === "admin") {
        sql = "SELECT id, marca, imei, serial, ip, estado, latitud, longitud, usuario_id FROM dispositivos";
    } else {
        return res.status(403).json({ message: "Rol inválido" });
    }
    
    db.query(sql, params, (err, results) => {
        if (err) {
            console.error("Error al obtener dispositivos:", err);
            return res.status(500).json({ message: "Error al obtener dispositivos" });
        }
        return res.status(200).json({ dispositivos: results });
    });
});

router.get("/:userId", verifyToken, (req, res) => {
    const { userId } = req.params;
    const { userRol: rol, userId: usuarioIdToken } = req;

    if (rol !== 'admin' && parseInt(userId) !== usuarioIdToken) {
        return res.status(403).json({ message: "No autorizado para ver dispositivos de otro usuario." });
    }

    db.query("SELECT id, marca, imei, serial, ip, estado, latitud, longitud FROM dispositivos WHERE usuario_id = ?", [userId], (err, results) => {
        if (err) {
            console.error("Error al obtener dispositivos:", err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        if (!results || results.length === 0) {
            return res.status(404).json({ message: "No tiene dispositivos agregados" });
        }
        return res.status(200).json({ dispositivos: results });
    });
});

router.post("/", verifyToken, async (req, res) => {
    const { marca, imei, serial, ip, latitud, longitud } = req.body;

    try {
        if (!marca || !imei || !serial || !ip || !latitud || !longitud) {
            return res.status(400).json({ 
                error: "Todos los campos son requeridos: marca, imei, serial, ip, latitud, longitud" 
            });
        }

        let usuarioId;
        if (req.userRol === "admin" && req.body.usuario_id) {
            usuarioId = req.body.usuario_id;
        } else {
            usuarioId = req.userId;
        }

        db.query(
            `INSERT INTO dispositivos (marca, imei, serial, ip, latitud, longitud, usuario_id, estado) 
             VALUES (?, ?, ?, ?, ?, ?, ?, 'apagado')`,
            [marca, imei, serial, ip, latitud, longitud, usuarioId],
            (err, resultado) => {
                if (err) {
                    console.error("Error al registrar dispositivo:", err);
                    return res.status(500).json({ 
                        error: "Error al registrar dispositivo" 
                    });
                }

                res.status(201).json({
                    mensaje: "Dispositivo registrado exitosamente",
                    dispositivoId: resultado.insertId
                });
            }
        );

    } catch (error) {
        console.error("Error al registrar dispositivo:", error);
        res.status(500).json({ 
            error: "Error al registrar dispositivo" 
        });
    }
});

router.delete("/:id", verifyToken, (req, res) => {
    const { id } = req.params;
    const { userRol: rol, userId: usuarioId } = req;

    // Verificar permisos
    db.query("SELECT usuario_id FROM dispositivos WHERE id = ?", [id], (err, results) => {
        if (err) {
            console.error("Error al buscar dispositivo:", err);
            return res.status(500).json({ message: "Error en el servidor" });
        }
        
        if (results.length === 0) {
            return res.status(404).json({ message: "Dispositivo no encontrado" });
        }

        const dispositivo = results[0];

        // Solo el admin o el dueño pueden eliminar
        if (rol !== 'admin' && dispositivo.usuario_id !== usuarioId) {
            return res.status(403).json({ message: "No autorizado para eliminar este dispositivo" });
        }

        // Eliminar dispositivo
        db.query("DELETE FROM dispositivos WHERE id = ?", [id], (deleteErr) => {
            if (deleteErr) {
                console.error("Error al eliminar dispositivo:", deleteErr);
                return res.status(500).json({ message: "Error al eliminar dispositivo" });
            }

            res.json({ message: "Dispositivo eliminado correctamente" });
        });
    });
});

export default router;
