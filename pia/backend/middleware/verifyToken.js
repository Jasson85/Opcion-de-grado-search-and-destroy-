import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "tu_clave_secreta_segura_aqui";

const verifyToken = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({ 
                error: "Token no proporcionado. Acceso denegado." 
            });
        }

        const token = authHeader.split(" ")[1];
        
        if (!token) {
            return res.status(401).json({ 
                error: "Formato de token inválido. Use: Bearer <token>" 
            });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        
        req.userId = decoded.id;
        req.userRol = decoded.rol;
        req.userCorreo = decoded.correo;
        
        next();
        
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return res.status(401).json({ 
                error: "Token expirado. Inicie sesión nuevamente." 
            });
        }
        
        if (error.name === "JsonWebTokenError") {
            return res.status(401).json({ 
                error: "Token inválido. Acceso denegado." 
            });
        }
        
        console.error("Error en verificación de token:", error);
        return res.status(500).json({ 
            error: "Error al verificar el token." 
        });
    }
};

export default verifyToken;