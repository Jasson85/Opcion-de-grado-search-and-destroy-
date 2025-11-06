import express from "express";
import bcrypt from "bcryptjs";
import axios from "axios";
import db from "../db.js";

const router = express.Router();

// Registro público de usuario (rol = 'usuario')
router.post("/register", async (req, res) => {
  const { correo, contraseña, pinRecuperacion } = req.body;
  if (!correo || !contraseña || !pinRecuperacion) {
    return res.status(400).json({ message: "Por favor ingrese correo, contraseña y PIN" });
  }
  if (pinRecuperacion.length !== 6 || !/^\d+$/.test(pinRecuperacion)) {
    return res.status(400).json({ message: "El PIN debe tener exactamente 6 dígitos numéricos" });
  }

  try {
    const hash = await bcrypt.hash(contraseña, 10);
    db.query("CALL sp_crear_usuario(?,?,?,?)", [correo, hash, pinRecuperacion, 'usuario'], (err) => {
      if (err) {
        console.error(err);
        if (err.code === 'ER_DUP_ENTRY' || (err.sqlMessage && err.sqlMessage.includes('Usuario ya existe'))) {
          return res.status(400).json({ message: "El correo ya está registrado" });
        }
        return res.status(500).json({ message: "Error al registrar usuario" });
      }
      res.status(201).json({ message: "Usuario registrado exitosamente" });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error en el servidor" });
  }
});

// Login
router.post('/login', (req, res) => {
    console.log("Datos recibidos en login:", req.body); // <-- AÑADE ESTO
  const { correo, contraseña } = req.body;
  if (!correo || !contraseña) return res.status(400).json({ message: "Ingrese correo y contraseña" });

  db.query('CALL sp_login_usuario(?)', [correo], async (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    const usuario = result[0][0];
    if (!usuario) return res.status(400).json({ message: 'Usuario no encontrado' });

    const match = await bcrypt.compare(contraseña, usuario.contraseña);
    if (!match) return res.status(400).json({ message: 'Contraseña incorrecta' });

    // Registrar historial de ingreso (no bloqueante)
    db.query('CALL sp_registrar_historial_ingreso(?)', [usuario.id], (histErr) => {
      if (histErr) console.error('Error al registrar historial:', histErr);
    });

    // Retornamos el rol para que el frontend redirija correctamente
    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      usuario: { id: usuario.id, correo: usuario.correo, rol: usuario.rol }
    });
  });
});

// Endpoint para que un ADMIN cree otro ADMIN
// Body: { creatorId, correo, contraseña, pinRecuperacion }
router.post('/create-admin', async (req, res) => {
  const { creatorId, correo, contraseña, pinRecuperacion } = req.body;
  if (!creatorId || !correo || !contraseña || !pinRecuperacion) {
    return res.status(400).json({ message: "Faltan datos para crear admin" });
  }
  try {
    // Verificar que creatorId sea admin
    db.query('SELECT rol FROM usuario WHERE id = ?', [creatorId], async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error en el servidor' });
      }
      const row = results[0];
      if (!row || row.rol !== 'admin') return res.status(403).json({ message: 'No autorizado: se requiere rol admin' });

      // Crear admin
      const hash = await bcrypt.hash(contraseña, 10);
      db.query("CALL sp_crear_usuario(?,?,?,?)", [correo, hash, pinRecuperacion, 'admin'], (createErr) => {
        if (createErr) {
          console.error(createErr);
          if (createErr.code === 'ER_DUP_ENTRY') return res.status(400).json({ message: "El correo ya está registrado" });
          return res.status(500).json({ message: 'Error al crear admin' });
        }
        res.status(201).json({ message: 'Administrador creado correctamente' });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Obtener historial de ingresos
router.get('/historial/:id', (req, res) => {
  const { id } = req.params;
  db.query('CALL sp_obtener_historial_usuario(?)', [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
    res.status(200).json({ historial: result[0] });
  });
});

// Obtener usuario solo por correo (para recuperación)
router.get('/getByCorreo/:correo', (req, res) => {
  const { correo } = req.params;
  db.query('CALL sp_login_usuario(?)', [correo], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
    const usuario = result[0][0];
    if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
    res.status(200).json({ usuario: { id: usuario.id, correo: usuario.correo, rol: usuario.rol } });
  });
});

// Actualizar usuario (correo, contraseña, PIN)
router.put('/update/:id', async (req, res) => {
  const { id } = req.params;
  const { correo, contraseña, pinRecuperacion } = req.body;
  try {
    db.query('CALL sp_login_usuario(?)', [correo], async (err, result) => {
      if (err) return res.status(500).json({ message: 'Error en el servidor' });
      const usuario = result[0][0];
      if (!usuario) return res.status(404).json({ message: 'Usuario no encontrado' });
      const nuevaContraseña = contraseña ? await bcrypt.hash(contraseña, 10) : usuario.contraseña;
      const nuevoPin = pinRecuperacion || usuario.pin_recuperacion;
      db.query('CALL sp_actualizar_usuario(?,?,?,?)', [usuario.id, correo, nuevaContraseña, nuevoPin], (updateErr) => {
        if (updateErr) return res.status(500).json({ message: 'Error al actualizar usuario' });
        res.status(200).json({ message: 'Usuario actualizado exitosamente' });
      });
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error en el servidor' });
  }
});

// Eliminar usuario
router.delete('/delete/:id', (req, res) => {
  const { id } = req.params;
  db.query('CALL sp_eliminar_usuario(?)', [id], (err) => {
    if (err) return res.status(500).json({ message: 'Error en el servidor' });
    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  });
});

router.get('/test', (req, res) => res.json({ message: 'API funcionando correctamente' }));

// Listar todos los usuarios (solo admin)
router.get('/listar', (req, res) => {
  db.query('SELECT id, correo, rol FROM usuario', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al obtener usuarios' });
    }
    res.status(200).json({ usuarios: results });
  });
});

// Encender dispositivo, Consultar estado
router.get('/dispositivo/estado/:id', (req, res) => {
  const { id } = req.params;
  db.query("SELECT ip FROM dispositivos WHERE id = ?", [id], async (err, results) => {
    if (err) return res.status(500).json({ estado: "error", message: "Error en el servidor" });
    if (results.length === 0) return res.status(404).json({ estado: "desconocido", message: "Dispositivo no encontrado" });

    const ip = results[0].ip;
    try {
      const response = await axios.get(`http://${ip}/status`);
      const body = response.data || "";
      // detectamos ON/ OFF según respuesta del ESP32
      const estado = (typeof body === 'string' && body.includes("ON")) ? "encendido" : "apagado";
      // devolvemos estado en una propiedad 'estado' para que el frontend lo consuma directamente
      res.status(200).json({ estado });
    } catch (error) {
      console.error("Error al conectar con el dispositivo:", error.message || error);
      res.status(500).json({ estado: "error", message: "Error al conectar con el dispositivo" });
    }
  });
});


// Apagar dispositivo
router.get('/dispositivo/apagar/:id', (req, res) => {
  const { id } = req.params;
  db.query("SELECT ip FROM dispositivos WHERE id = ?", [id], async (err, results) => {
    if (err) return res.status(500).json({ estado: "error", message: "Error en el servidor" });
    if (results.length === 0) return res.status(404).json({ estado: "desconocido", message: "Dispositivo no encontrado" });

    const ip = results[0].ip;
    try {
      const response = await axios.get(`http://${ip}/off`);
      res.status(200).json({ estado: "apagado", mensaje: response.data });
    } catch (error) {
      res.status(500).json({  estado: "error", message: "No se pudo conectar con el dispositivo" });
    }
  });
});

// Consultar estado
router.get('/dispositivo/estado/:id', (req, res) => {
  const { id } = req.params;
  db.query("SELECT ip FROM dispositivos WHERE id = ?", [id], async (err, results) => {
    if (err) return res.status(500).json({ estado: "error", message: "Error en el servidor" });
    if (results.length === 0) return res.status(404).json({ estado: "desconocido", message: "Dispositivo no encontrado" });

    const ip = results[0].ip;
    try {
      const response = await axios.get(`http://${ip}/status`);
      const estado = response.data.includes("ON") ? "encendido" : "apagado";
      res.status(200).json({ message: response.data });
    } catch (error) {
      res.status(500).json({ estado: "error", message: "Error al conectar con el dispositivo" });
    }
  });
});


export default router;
