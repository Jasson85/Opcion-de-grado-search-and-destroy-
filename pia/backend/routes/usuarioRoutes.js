import express from "express";
import bcrypt from "bcryptjs";
import axios from "axios";
import db from "../db.js";
import jwt from "jsonwebtoken";
import verifyToken from "../middleware/verifyToken.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta_segura_aqui";

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

router.post('/login', (req, res) => {
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

        db.query('CALL sp_registrar_historial_ingreso(?)', [usuario.id], (histErr) => {
            if (histErr) console.error('Error al registrar historial:', histErr);
        });

        const token = jwt.sign(
            { id: usuario.id, rol: usuario.rol, correo: usuario.correo }, 
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(200).json({
            token,
            usuario: { id: usuario.id, correo: usuario.correo, rol: usuario.rol }
        });
    });
});

router.post('/create-admin', async (req, res) => {
  const { creatorId, correo, contraseña, pinRecuperacion } = req.body;
  if (!creatorId || !correo || !contraseña || !pinRecuperacion) {
    return res.status(400).json({ message: "Faltan datos para crear admin" });
  }
  try {
    db.query('SELECT rol FROM usuario WHERE id = ?', [creatorId], async (err, results) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Error en el servidor' });
      }
      const row = results[0];
      if (!row || row.rol !== 'admin') return res.status(403).json({ message: 'No autorizado: se requiere rol admin' });

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

router.get('/historial/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { userRol, userId } = req;

  if (userRol !== 'admin' && userId !== parseInt(id)) {
    return res.status(403).json({ message: 'No autorizado para ver este historial' });
  }

  db.query('CALL sp_obtener_historial_usuario(?)', [id], (err, result) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }
    res.status(200).json({ historial: result[0] });
  });
});

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

router.put('/update/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { correo, contraseña, pinRecuperacion } = req.body;
  const { userRol, userId } = req;

  if (userRol !== 'admin' && userId !== parseInt(id)) {
    return res.status(403).json({ message: 'No autorizado para actualizar este usuario' });
  }

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

router.get('/dispositivos/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { userRol, userId } = req;

  if (userRol !== 'admin' && userId !== parseInt(id)) {
    return res.status(403).json({ message: 'No autorizado para ver estos dispositivos' });
  }

  db.query('SELECT * FROM dispositivos WHERE usuario_id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener dispositivos:', err);
      return res.status(500).json({ message: 'Error en el servidor' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'No tiene dispositivos agregados' });
    }

    res.status(200).json({ dispositivos: results });
  });
});

router.delete('/delete/:id', verifyToken, (req, res) => {
  const { id } = req.params;
  const { userRol } = req;

  if (userRol !== 'admin') {
    return res.status(403).json({ message: 'No autorizado. Se requiere rol admin' });
  }

  db.query('CALL sp_eliminar_usuario(?)', [id], (err) => {
    if (err) return res.status(500).json({ message: 'Error en el servidor' });
    res.status(200).json({ message: 'Usuario eliminado exitosamente' });
  });
});

router.get('/test', (req, res) => res.json({ message: 'API funcionando correctamente' }));

router.get('/listar', verifyToken, (req, res) => {
  const { userRol } = req;

  if (userRol !== 'admin') {
    return res.status(403).json({ message: 'No autorizado. Se requiere rol admin' });
  }

  db.query('SELECT id, correo, rol FROM usuario', (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ message: 'Error al obtener usuarios' });
    }
    res.status(200).json({ usuarios: results });
  });
});

export default router;