import { useState, useEffect } from "react";
import axios from "axios";

const BotonEncendido = ({ dispositivo, onEstadoActualizado }) => {
  const [estado, setEstado] = useState(dispositivo.estado || "apagado");
  const [cargando, setCargando] = useState(false);
  const [mensaje, setMensaje] = useState("");

  const userToken = localStorage.getItem("userToken");
  const config = {
    headers: {
      Authorization: `Bearer ${userToken}`
    }
  };

  useEffect(() => {
    if (dispositivo && dispositivo.estado) setEstado(dispositivo.estado);
  }, [dispositivo]);

  const toggleDispositivo = async () => {
    setCargando(true);
    try {
      const accion = estado === "encendido" ? "apagar" : "descargar";
      const url = `http://localhost:8080/api/dispositivos/${accion}/${dispositivo.id}`;

      const respuesta = await axios.get(url, config);

      const nuevoEstado = respuesta.data?.estado
        ? respuesta.data.estado
        : accion === "descargar"
        ? "apagado"
        : "apagado";

      setEstado(nuevoEstado);

      setMensaje(`Dispositivo ${dispositivo.nombre || dispositivo.id} ${nuevoEstado}`);

      if (onEstadoActualizado) onEstadoActualizado(dispositivo.id, nuevoEstado);
    } catch (error) {
      console.error("Error al cambiar el estado del dispositivo:", error);
      setMensaje("No se pudo cambiar el estado. Revisa la conexión con el ESP32.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="text-center p-4 bg-gray-800 rounded-lg shadow-md">
      <button
        onClick={toggleDispositivo}
        disabled={cargando}
        className={`px-6 py-3 rounded-lg text-white font-semibold transition-all ${
          estado === "encendido" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
        } ${cargando ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        {cargando ? "Procesando..." : (estado === "encendido" ? "Apagar" : "Enviar Descarga")}
      </button>

      {mensaje && <p className="mt-2 text-sm text-gray-400">{mensaje}</p>}
    </div>
  );
};

export default BotonEncendido;