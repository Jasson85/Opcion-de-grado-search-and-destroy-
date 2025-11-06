import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Icono para el marcador
const markerIcon = new L.Icon({
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MapSection = () => {
  const navigate = useNavigate();
  const [historial, setHistorial] = useState([]);
  const [user, setUser] = useState(null);
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState(false); // ON/OFF visual

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    navigate("/");
  };

  // ✅ Cargar usuario y su historial
  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    if (!userData) {
      navigate("/");
      return;
    }
    setUser(userData);

    axios
      .get(`http://localhost:8080/api/usuarios/historial/${userData.id}`)
      .then((res) => setHistorial(res.data.historial))
      .catch((err) => console.error("Error al obtener historial:", err));
  }, [navigate]);

  // ✅ Encender el dispositivo ESP32
  const encenderDispositivo = async () => {
    try {
      await axios.get(`http://localhost:8080/api/dispositivos/encender/1`);
      setMensaje("💡 Dispositivo encendido correctamente");
      setEstado(true);
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error al encender el dispositivo");
    }
  };

  // ✅ Apagar el dispositivo ESP32
  const apagarDispositivo = async () => {
    try {
      await axios.get(`http://localhost:8080/api/dispositivos/apagar/1`);
      setMensaje("💤 Dispositivo apagado correctamente");
      setEstado(false);
    } catch (error) {
      console.error(error);
      setMensaje("❌ Error al apagar el dispositivo");
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* NAVBAR */}
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-400 tracking-wide">
            Search<span className="text-white">&</span>Destroy
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-blue-400">Panel del Usuario</h1>

        {/* 🔌 BOTÓN DE CONTROL */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6 text-center">
          <h2 className="text-xl font-semibold mb-4">Control del Dispositivo</h2>
          <button
            onClick={estado ? apagarDispositivo : encenderDispositivo}
            className={`px-6 py-3 rounded-lg text-lg font-bold transition-all ${
              estado
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }`}
          >
            {estado ? "Apagar" : "Enviar Descarga"}
          </button>
          {mensaje && <p className="mt-3 text-sm">{mensaje}</p>}
        </div>

        {/* 🕓 HISTORIAL DE INGRESOS */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6">
          <h2 className="text-xl font-semibold mb-3">Historial de Ingresos</h2>
          {historial.length === 0 ? (
            <p>No hay registros de ingreso.</p>
          ) : (
            <ul className="list-disc pl-5 space-y-1">
              {historial.map((h) => (
                <li key={h.id}>
                  {new Date(h.fecha_ingreso).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 🌍 MAPA DE UBICACIÓN */}
        <div className="bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-3">Ubicación del Dispositivo</h2>
          <MapContainer
            center={[4.710989, -74.07209]}
            zoom={13}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <Marker position={[4.710989, -74.07209]} icon={markerIcon}>
              <Popup>📍 Dispositivo ESP32</Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default MapSection;
