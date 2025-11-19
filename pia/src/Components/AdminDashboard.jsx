import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

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
  const [dispositivos, setDispositivos] = useState([]);
  const [loading, setLoading] = useState(true);

  const userToken = localStorage.getItem("userToken");
  const userData = JSON.parse(localStorage.getItem("userData"));

  const config = {
    headers: {
      Authorization: `Bearer ${userToken}`
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    navigate("/");
  };

  useEffect(() => {
    if (!userData || !userToken) {
      navigate("/");
      return;
    }
    setUser(userData);

    if (userData.rol === "admin") {
      axios
        .get("http://localhost:8080/api/dispositivos", config)
        .then((res) => {
          const dispositivosConEstado = res.data.dispositivos.map(d => ({
            ...d,
            estado: d.estado === "encendido",
          }));
          setDispositivos(dispositivosConEstado);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    } else {
      setLoading(true);

      axios
        .get(`http://localhost:8080/api/usuarios/historial/${userData.id}`, config)
        .then((res) => setHistorial(res.data.historial))
        .catch((err) => console.error(err));

      axios
        .get(`http://localhost:8080/api/dispositivos/${userData.id}`, config)
        .then((res) => {
          const dispositivosConEstado = res.data.dispositivos.map(d => ({
            ...d,
            estado: d.estado === "encendido",
          }));
          setDispositivos(dispositivosConEstado);
        })
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [navigate, userToken, userData]);

  const actualizarEstadoDispositivo = async (id) => {
    try {
      const res = await axios.get(`http://localhost:8080/api/dispositivos/estado/${id}`, config);
      setDispositivos(prev =>
        prev.map(d => (d.id === id ? { ...d, estado: res.data.estado === "encendido" } : d))
      );
    } catch (err) {
      console.error("No se pudo obtener estado real:", err);
    }
  };

  const encenderDispositivo = async (id) => {
    try {
      await axios.get(`http://localhost:8080/api/dispositivos/encender/${id}`, config);
      actualizarEstadoDispositivo(id);
      setMensaje("Dispositivo encendido correctamente");
    } catch (err) {
      console.error(err);
      setMensaje("Error al encender el dispositivo");
    }
  };

  const apagarDispositivo = async (id) => {
    try {
      await axios.get(`http://localhost:8080/api/dispositivos/apagar/${id}`, config);
      actualizarEstadoDispositivo(id);
      setMensaje("Dispositivo apagado correctamente");
    } catch (err) {
      console.error(err);
      setMensaje("Error al apagar el dispositivo");
    }
  };

  const enviarDescarga = async (id) => {
    try {
      await axios.get(`http://localhost:8080/api/dispositivos/descargar/${id}`, config);
      actualizarEstadoDispositivo(id);
      setMensaje("Descarga enviada correctamente");
    } catch (err) {
      console.error(err);
      setMensaje("No se pudo enviar la descarga");
    }
  };

  if (loading) return <p className="text-center mt-10">Cargando...</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
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
        <h1 className="text-3xl font-bold mb-6 text-blue-400">
          {user?.rol === "admin" ? "Panel del Administrador" : "Panel del Usuario"}
        </h1>

        {user?.rol !== "admin" && dispositivos.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6 text-center">
            <h2 className="text-xl font-semibold mb-4">Control del Dispositivo</h2>
            <button
              onClick={() => enviarDescarga(dispositivos[0].id)}
              className={`px-6 py-3 rounded-lg text-lg font-bold transition-all ${
                dispositivos[0].estado ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"
              }`}
            >
              {dispositivos[0].estado ? "Apagar" : "Enviar Descarga"}
            </button>
            {mensaje && <p className="mt-3 text-sm">{mensaje}</p>}
          </div>
        )}

        {user?.rol !== "admin" && (
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
        )}

        {user?.rol === "admin" && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Dispositivos Registrados</h2>
            {dispositivos.length === 0 ? (
              <p>No hay dispositivos registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-gray-300">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="p-2">ID</th>
                      <th className="p-2">Nombre</th>
                      <th className="p-2">IP</th>
                      <th className="p-2">Estado</th>
                      <th className="p-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispositivos.map((d) => (
                      <tr key={d.id} className="border-b border-gray-700">
                        <td className="p-2">{d.id}</td>
                        <td className="p-2">{d.nombre}</td>
                        <td className="p-2">{d.ip}</td>
                        <td className={`p-2 font-semibold ${d.estado ? "text-green-400" : "text-red-400"}`}>
                          {d.estado ? "encendido" : "apagado"}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => (d.estado ? apagarDispositivo(d.id) : encenderDispositivo(d.id))}
                            className={`px-4 py-2 rounded-lg font-semibold transition-all ${d.estado ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                          >
                            {d.estado ? "Apagar" : "Encender"}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

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
            {dispositivos.map(d => (
              <Marker key={d.id} position={[parseFloat(d.latitud), parseFloat(d.longitud)]} icon={markerIcon}>
                <Popup> {d.nombre}</Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default MapSection;