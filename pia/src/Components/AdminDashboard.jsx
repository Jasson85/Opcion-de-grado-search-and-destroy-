import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const AdminDashboard = () => {
  const [admins, setAdmins] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [historial, setHistorial] = useState({});
  const [message, setMessage] = useState(null);
  const navigate = useNavigate();

  const API_URL = "http://localhost:8080/api/usuarios";

  const showMessage = (msg, type = "success") => {
    setMessage({ text: msg, type });
    setTimeout(() => setMessage(null), 3000);
  };

  const fetchAdmins = async () => {
    try {
      const res = await axios.get(`${API_URL}/listar`);
      setAdmins(res.data.usuarios || []);
    } catch (err) {
      console.error(err);
      showMessage("Error al cargar administradores", "error");
    }
  };

  useEffect(() => {
    fetchAdmins();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    navigate("/");
  };

  // 🔍 Mostrar últimos 3 ingresos
  const toggleHistorial = async (id) => {
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }

    setExpandedId(id);

    if (!historial[id]) {
      try {
        const res = await axios.get(`${API_URL}/historial/${id}`);
        const registros = res.data.historial || [];
        const ultimosTres = registros.slice(-3).reverse(); // Solo los 3 más recientes
        setHistorial((prev) => ({ ...prev, [id]: ultimosTres }));
      } catch (err) {
        console.error(err);
        showMessage("Error al obtener historial del usuario", "error");
      }
    }
  };

  const ubicaciones = [
    { id: 1, nombre: "Sede Principal (Bogotá)", lat: 4.60971, lng: -74.08175 },
    { id: 2, nombre: "Sucursal Norte (Medellín)", lat: 6.25184, lng: -75.56359 },
    { id: 3, nombre: "Sucursal Occidente (Cali)", lat: 3.45164, lng: -76.53198 },
  ];

  return (
    <div className="min-h-screen bg-[#0D1117] text-gray-200 font-sans">
      {/* Navbar */}
      <nav className="bg-[#161B22] border-b border-blue-800/30">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-400 tracking-wide">
            Admin<span className="text-white">Panel</span>
          </div>
          <button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
          >
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-blue-400">
          Lista de Administradores
        </h1>

        {message && (
          <div
            className={`p-3 mb-4 rounded-lg text-center ${
              message.type === "error" ? "bg-red-700" : "bg-green-700"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Lista de administradores */}
        <div className="bg-[#161B22] rounded-lg p-6 shadow-lg border border-blue-800/30">
          {admins.length === 0 ? (
            <p className="text-gray-400">No hay administradores registrados.</p>
          ) : (
            <div className="divide-y divide-gray-700">
              {admins.map((admin) => (
                <div key={admin.id} className="py-3">
                  <button
                    onClick={() => toggleHistorial(admin.id)}
                    className="flex justify-between items-center w-full text-left px-3 py-2 hover:bg-[#1E2633] rounded-md transition-all"
                  >
                    <div>
                      <span className="font-semibold text-lg text-white">
                        {admin.correo}
                      </span>
                      <span className="ml-3 text-sm text-blue-400">
                        ({admin.rol})
                      </span>
                    </div>
                    <span
                      className={`text-sm ${
                        expandedId === admin.id
                          ? "text-blue-400"
                          : "text-gray-400"
                      }`}
                    >
                      {expandedId === admin.id ? "▲ Ocultar" : "▼ Ver historial"}
                    </span>
                  </button>

                  {/* Sección desplegable con los últimos 3 ingresos */}
                  <div
                    className={`transition-all duration-500 overflow-hidden ${
                      expandedId === admin.id
                        ? "max-h-96 opacity-100"
                        : "max-h-0 opacity-0"
                    }`}
                  >
                    <div className="mt-3 bg-[#1C2128] rounded-md p-4">
                      <h3 className="font-semibold text-blue-400 mb-2">
                        Últimos ingresos
                      </h3>

                      {!historial[admin.id] ? (
                        <p className="text-gray-400">Cargando...</p>
                      ) : historial[admin.id].length === 0 ? (
                        <p className="text-gray-400">Sin registros recientes.</p>
                      ) : (
                        <ul className="list-disc list-inside text-gray-200 space-y-1 max-h-40 overflow-y-auto">
                          {historial[admin.id].map((h) => (
                            <li key={h.id}>
                              {new Date(h.fecha_ingreso).toLocaleString()}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 🌍 Mapa claro debajo del listado */}
        <div className="mt-10 bg-[#161B22] rounded-lg p-5 shadow-lg border border-blue-800/30">
          <h3 className="text-xl font-semibold mb-4 text-blue-300">
            Ubicaciones de las Sedes
          </h3>
          <div className="overflow-hidden rounded-xl border border-blue-800/30">
            <MapContainer
              center={[4.65, -74.1]}
              zoom={6}
              style={{ height: "400px", width: "100%" }}
            >
              {/* Fondo CLARO */}
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
                attribution="&copy; OpenStreetMap contributors, &copy; CartoDB"
              />
              {ubicaciones.map((ubi) => (
                <Marker key={ubi.id} position={[ubi.lat, ubi.lng]} icon={markerIcon}>
                  <Popup>
                    <strong>{ubi.nombre}</strong>
                    <br />
                    Lat: {ubi.lat}, Lng: {ubi.lng}
                  </Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
