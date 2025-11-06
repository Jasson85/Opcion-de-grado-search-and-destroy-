import express from "express";
import axios from "axios";
import db from "../db.js";

const router = express.Router();

/**
 * 🔹 Encender dispositivo
 * Endpoint: GET /api/dispositivos/encender/:id
 */
router.get("/encender/:id", async (req, res) => {
  const { id } = req.params;

  try {
    // Buscar el dispositivo en la base de datos
    db.query("SELECT ip FROM dispositivos WHERE id = ?", [id], async (err, results) => {
      if (err) {
        console.error("Error al consultar el dispositivo:", err);
        return res.status(500).json({ message: "Error en el servidor" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Dispositivo no encontrado" });
      }

      const ip = results[0].ip;

      try {
        // Enviar orden ON al ESP32
        await axios.get(`http://${ip}/on`);
        console.log(`Dispositivo ${id} encendido (${ip})`);

        // Actualizar estado en la base de datos
        db.query("CALL sp_actualizar_estado_dispositivo(?, 'encendido')", [id]);

        res.json({ message: `Dispositivo ${id} encendido correctamente` });
      } catch (error) {
        console.error("Error al encender el dispositivo:", error.message);
        res.status(500).json({ message: "No se pudo comunicar con el dispositivo" });
      }
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/**
 * 🔹 Apagar dispositivo
 * Endpoint: GET /api/dispositivos/apagar/:id
 */
router.get("/apagar/:id", async (req, res) => {
  const { id } = req.params;

  try {
    db.query("SELECT ip FROM dispositivos WHERE id = ?", [id], async (err, results) => {
      if (err) {
        console.error("Error al consultar el dispositivo:", err);
        return res.status(500).json({ message: "Error en el servidor" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Dispositivo no encontrado" });
      }

      const ip = results[0].ip;

      try {
        // Enviar orden OFF al ESP32
        await axios.get(`http://${ip}/off`);
        console.log(`Dispositivo ${id} apagado (${ip})`);

        // Actualizar estado en la base de datos
        db.query("CALL sp_actualizar_estado_dispositivo(?, 'apagado')", [id]);

        res.json({ message: `Dispositivo ${id} apagado correctamente` });
      } catch (error) {
        console.error("Error al apagar el dispositivo:", error.message);
        res.status(500).json({ message: "No se pudo comunicar con el dispositivo" });
      }
    });
  } catch (error) {
    console.error("Error general:", error);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

/**
 * 🔹 Listar todos los dispositivos registrados en la base de datos
 * Endpoint: GET /api/dispositivos/listar
 */
router.get("/listar", (req, res) => {
  db.query("SELECT id, nombre, ip, estado, latitud, longitud FROM dispositivos", (err, results) => {
    if (err) {
      console.error("Error al obtener dispositivos:", err);
      return res.status(500).json({ message: "Error al obtener la lista de dispositivos" });
    }

    res.status(200).json({ dispositivos: results });
  });
});

/**
 * 🔹 Actualizar ubicación (desde el ESP32)
 * Endpoint: GET /api/dispositivos/actualizarUbicacion/:id?latitud=...&longitud=...
 */
router.get("/actualizarUbicacion/:id", (req, res) => {
  const { id } = req.params;
  const { latitud, longitud } = req.query;

  if (!latitud || !longitud) {
    return res.status(400).json({ message: "Faltan coordenadas de ubicación" });
  }

  db.query("CALL sp_actualizar_ubicacion_dispositivo(?, ?, ?)", [id, latitud, longitud], (err) => {
    if (err) {
      console.error("Error al actualizar ubicación:", err);
      return res.status(500).json({ message: "Error al actualizar ubicación" });
    }

    res.status(200).json({ message: "Ubicación actualizada correctamente" });
  });
});

/**
 * 🔹 Obtener ubicación actual de un dispositivo
 * Endpoint: GET /api/dispositivos/ubicacion/:id
 */
router.get("/ubicacion/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    "SELECT nombre, ip, latitud, longitud, estado FROM dispositivos WHERE id = ?",
    [id],
    (err, results) => {
      if (err) {
        console.error("Error al obtener ubicación:", err);
        return res.status(500).json({ message: "Error al obtener la ubicación" });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: "Dispositivo no encontrado" });
      }

      res.status(200).json({ dispositivo: results[0] });
    }
  );
});

export default router;
