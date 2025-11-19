import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const markerIcon = new L.Icon({
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

const MapSection = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [historial, setHistorial] = useState([]);
  const [dispositivos, setDispositivos] = useState([]);
  const [estados, setEstados] = useState({});
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(true);

  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newDeviceData, setNewDeviceData] = useState({
    marca: '',
    imei: '',
    serial: '',
    ip: '',
    latitud: '',
    longitud: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewDeviceData(prev => ({ ...prev, [name]: value }));
  };

  const getTokenConfig = () => {
    const userToken = localStorage.getItem("userToken");
    if (!userToken) {
      navigate("/");
      return {};
    }
    return {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    };
  };

  const handleLogout = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userData");
    navigate("/");
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("userData"));
    const userToken = localStorage.getItem("userToken");

    if (!userData || !userToken) {
      navigate("/");
      return;
    }

    setUser(userData);
    const role = (userData.rol || "").toString().toLowerCase();

    axios.get("http://localhost:8080/api/dispositivos", getTokenConfig())
      .then(res => {
        const arr = res.data.dispositivos || [];
        setDispositivos(arr);

        const st = arr.reduce((acc, dispositivo) => {
          acc[dispositivo.id] = dispositivo.estado === "encendido" || dispositivo.estado === true;
          return acc;
        }, {});
        setEstados(st);
        setLoading(false);
      })
      .catch(err => {
        console.error("Error al cargar dispositivos:", err.response || err);
        const status = err.response?.status;
        if (status === 401) {
          setTimeout(handleLogout, 100);
          setMensaje("Sesión expirada. Inicia sesión nuevamente.");
        } else if (status === 403) {
          setMensaje("No tienes permiso para ver estos dispositivos.");
        } else {
          setMensaje(role === "admin" ?
            "Error al cargar dispositivos (admin)." :
            "No tienes dispositivos asignados."
          );
        }
        setLoading(false);
      });

    if (role !== "admin") {
      axios.get(`http://localhost:8080/api/usuarios/historial/${userData.id}`, getTokenConfig())
        .then(res => {
          setHistorial(res.data.historial || []);
        })
        .catch(err => {
          console.error("Error al cargar historial:", err);
        });
    }

  }, [navigate]);

  const handleRegisterDevice = async (e) => {
    e.preventDefault();
    if (!newDeviceData.marca || !newDeviceData.imei || !newDeviceData.serial ||!newDeviceData.ip) {
      alert("Marca, IMEI, Serial e IP son obligatorios.");
      return;
    }

    try {
      const payload = { 
        marca: newDeviceData.marca,
        imei: newDeviceData.imei,
        serial: newDeviceData.serial,
        ip: newDeviceData.ip,
        latitud: newDeviceData.latitud || '0',
        longitud: newDeviceData.longitud || '0'
      };

      await axios.post(
        "http://localhost:8080/api/dispositivos",
         payload,
        getTokenConfig()
      );

      alert(`Dispositivo registrado correctamente.`);
      setNewDeviceData({ marca: '', imei: '', serial: '', ip: '', latitud: '', longitud: '' });
      setShowRegisterForm(false);

      const res = await axios.get("http://localhost:8080/api/dispositivos", getTokenConfig());
      const arr = res.data.dispositivos || [];
      setDispositivos(arr);

      const st = {};
      arr.forEach(d => st[d.id] = (d.estado === "encendido" || d.estado === true));
      setEstados(st);

    } catch (error) {
      console.error("Error al registrar:", error);
      alert(`Error: ${error.response?.data?.message || "No se pudo registrar"}`);
    }
  };

  const refrescarEstado = async (id) => {
    try {
      const res = await axios.get(
        `http://localhost:8080/api/dispositivos/estado/${id}`,
        getTokenConfig()
      );
      const estado = res.data.estado === "encendido";
      setEstados(prev => ({ ...prev, [id]: estado }));
      setMensaje(`Estado refrescado: ${estado ? "encendido" : "apagado"}`);
      setTimeout(() => setMensaje(""), 3000);
    } catch (err) {
      console.error("Error al refrescar estado:", err);
      setMensaje("Error al refrescar estado.");
      setTimeout(() => setMensaje(""), 3000);
    }
  };

  const enviarDescarga = async (id) => {
    try {
      await axios.get(
        `http://localhost:8080/api/dispositivos/descargar/${id}`,
        getTokenConfig()
      );
      setMensaje("Descarga enviada correctamente");
      setTimeout(() => setMensaje(""), 3000);
      setTimeout(() => refrescarEstado(id), 800);
    } catch (err) {
      console.error("Error al enviar descarga:", err);
      if (err.response?.status === 403) {
        setMensaje("No tienes permiso para este dispositivo");
      } else {
        setMensaje("Error al enviar descarga");
      }
      setTimeout(() => setMensaje(""), 3000);
    }
  };

  const encenderDispositivo = async (id) => {
    try {
      await axios.get(
        `http://localhost:8080/api/dispositivos/encender/${id}`,
        getTokenConfig()
      );
      setMensaje("Dispositivo encendido");
      setTimeout(() => setMensaje(""), 3000);
      setTimeout(() => refrescarEstado(id), 800);
    } catch (err) {
      console.error(err);
      setMensaje("Error al encender");
      setTimeout(() => setMensaje(""), 3000);
    }
  };

  const eliminarDispositivo = async (id) => {
  if (!window.confirm("¿Estás seguro de que deseas eliminar este dispositivo?")) {
    return;
  }

  try {
    await axios.delete(
      `http://localhost:8080/api/dispositivos/${id}`,
      getTokenConfig()
    );
    setMensaje("Dispositivo eliminado correctamente");
    setTimeout(() => setMensaje(""), 3000);

    // Recargar dispositivos
    const res = await axios.get("http://localhost:8080/api/dispositivos", getTokenConfig());
    const arr = res.data.dispositivos || [];
    setDispositivos(arr);

    const st = {};
    arr.forEach(d => st[d.id] = (d.estado === "encendido" || d.estado === true));
    setEstados(st);

  } catch (err) {
    console.error("Error al eliminar dispositivo:", err);
    setMensaje("Error al eliminar dispositivo");
    setTimeout(() => setMensaje(""), 3000);
  }
};

  const apagarDispositivo = async (id) => {
    try {
      await axios.get(
        `http://localhost:8080/api/dispositivos/apagar/${id}`,
        getTokenConfig()
      );
      setMensaje("Dispositivo apagado");
      setTimeout(() => setMensaje(""), 3000);
      setTimeout(() => refrescarEstado(id), 800);
    } catch (err) {
      console.error(err);
      setMensaje("Error al apagar");
      setTimeout(() => setMensaje(""), 3000);
    }
  };

  if (loading) return <p className="text-center mt-10 text-white">Cargando...</p>;

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <nav className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="text-2xl font-bold text-blue-400 tracking-wide">
            Search<span className="text-white">&</span>Destroy
          </div>
          <button onClick={handleLogout} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg">
            Cerrar Sesión
          </button>
        </div>
      </nav>

      <div className="p-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-blue-400">
          {(user?.rol || "").toString().toLowerCase() === "admin" ? "Panel del Administrador" : "Panel del Usuario"}
        </h1>

        {mensaje && (
          <div className="bg-blue-900 border border-blue-700 p-4 rounded-lg mb-6 text-center">
            <p className="text-lg font-semibold">{mensaje}</p>
          </div>
        )}

        {(user?.rol || "").toString().toLowerCase() !== "admin" && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Gestión de Dispositivos</h2>

            <button
              onClick={() => setShowRegisterForm(!showRegisterForm)}
              className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mb-4"
            >
              {showRegisterForm ? "Cancelar" : "Registrar Dispositivo"}
            </button>

            {showRegisterForm && (
              <form onSubmit={handleRegisterDevice} className="mt-4 p-4 border border-gray-700 rounded-lg bg-gray-900 mb-6">
                <h4 className="text-lg font-medium mb-3">Nuevo Dispositivo</h4>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-400">Marca</label>
                  <input type="text" name="marca" value={newDeviceData.marca} onChange={handleInputChange} className="w-full mt-1 p-2 border border-gray-600 rounded-md bg-gray-700 text-white" required />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-400">IMEI</label>
                  <input type="text" name="imei" value={newDeviceData.imei} onChange={handleInputChange} maxLength="15" className="w-full mt-1 p-2 border border-gray-600 rounded-md bg-gray-700 text-white" required />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-400">Serial</label>
                  <input type="text" name="serial" value={newDeviceData.serial} onChange={handleInputChange} className="w-full mt-1 p-2 border border-gray-600 rounded-md bg-gray-700 text-white" required />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-400">IP</label>
                  <input type="text" name="ip" value={newDeviceData.ip} onChange={handleInputChange} className="w-full mt-1 p-2 border border-gray-600 rounded-md bg-gray-700 text-white" required />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-400">Latitud</label>
                  <input type="number" name="latitud" value={newDeviceData.latitud} onChange={handleInputChange} className="w-full mt-1 p-2 border border-gray-600 rounded-md bg-gray-700 text-white" step="0.000001" />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-400">Longitud</label>
                  <input type="number" name="longitud" value={newDeviceData.longitud} onChange={handleInputChange} className="w-full mt-1 p-2 border border-gray-600 rounded-md bg-gray-700 text-white" step="0.000001" />
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                  Registrar
                </button>
              </form>
            )}

            <h3 className="text-xl font-semibold mb-4">Mis Dispositivos</h3>
            {dispositivos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dispositivos.map(d => (
                  <div key={d.id} className="bg-gray-700 rounded-lg p-4 border border-gray-600 hover:border-blue-500 transition-all shadow-lg">
                    <div className="mb-3">
                      <h4 className="font-bold text-lg text-blue-400 mb-2">Marca: {d.marca}</h4>
                      <p className="text-sm text-gray-400 mb-1">IMEI: {d.imei}</p>
                      <p className="text-sm text-gray-400 mb-1">Serial: {d.serial}</p>
                      <p className="text-sm text-gray-400 mb-2">IP: {d.ip}</p>
                    </div>
                    <div className="mb-3">
                      <p className={`text-sm font-semibold ${estados[d.id] ? "text-green-400" : "text-red-400"}`}>
                        Estado: {estados[d.id] ? "Encendido" : "Apagado"}
                      </p>
                    </div>
                    <button
                      onClick={() => enviarDescarga(d.id)}
                      className="w-full px-4 py-3 rounded-lg text-base font-bold bg-red-600 hover:bg-red-700 transition-colors"
                    >
                      ⚡ Enviar Descarga
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center">No tienes dispositivos asignados.</p>
            )}
          </div>
        )}

        {(user?.rol || "").toString().toLowerCase() !== "admin" && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-3">Historial de Ingresos</h2>
            {historial.length === 0 ? (
              <p>No hay registros.</p>
            ) : (
              <ul className="list-disc pl-5 space-y-1">
                {historial.map((h, index) => (
                  <li key={h.id || index}>{new Date(h.fecha_ingreso).toLocaleString()}</li>
                ))}
              </ul>
            )}
          </div>
        )}

        {(user?.rol || "").toString().toLowerCase() === "admin" && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md mb-6">
            <h2 className="text-xl font-semibold mb-4">Todos los Dispositivos</h2>
            {dispositivos.length === 0 ? (
              <p>No hay dispositivos registrados.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-gray-300">
                  <thead className="bg-gray-700">
                    <tr>
                      <th className="p-2">ID</th>
                      <th className="p-2">Usuario</th>
                      <th className="p-2">Marca</th>
                      <th className="p-2">IMEI</th>
                      <th className="p-2">Serial</th>
                      <th className="p-2">IP</th>
                      <th className="p-2">Estado</th>
                      <th className="p-2 text-center">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dispositivos.map(d => (
                      <tr key={d.id} className="border-b border-gray-700">
                        <td className="p-2">{d.id}</td>
                        <td className="p-2">{d.usuario_id}</td>
                        <td className="p-2">{d.marca}</td>
                        <td className="p-2">{d.imei}</td>
                        <td className="p-2">{d.serial}</td>
                        <td className="p-2">{d.ip}</td>
                        <td className={`p-2 font-semibold ${estados[d.id] ? "text-green-400" : "text-red-400"}`}>
                          {estados[d.id] ? "Encendido" : "Apagado"}
                        </td>
                        <td className="p-2 text-center">
                          <button
                            onClick={() => estados[d.id] ? apagarDispositivo(d.id) : encenderDispositivo(d.id)}
                            className={`px-4 py-2 mr-2 rounded-lg font-semibold ${estados[d.id] ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700"}`}
                          >
                            {estados[d.id] ? "Apagar" : "Enviar Descarga"}
                          </button>
                          <button onClick={() => refrescarEstado(d.id)} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700">
                            🔄
                          </button>
                          <button onClick={() => eliminarDispositivo(d.id)} className="px-4 py-2 rounded-lg bg-red-700 hover:bg-red-800 font-semibold">
                            Eliminar
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

        {dispositivos.length > 0 && (
          <div className="bg-gray-800 p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-3">Ubicación de Dispositivos</h2>
            <MapContainer
              center={[
                parseFloat(dispositivos[0]?.latitud || 4.710989),
                parseFloat(dispositivos[0]?.longitud || -74.07209)
              ]}
              zoom={13}
              style={{ height: "400px", width: "100%" }}
              key={dispositivos.length}
            >
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              {dispositivos.map(d => (
                <Marker
                  key={d.id}
                  position={[
                    parseFloat(d.latitud || 4.710989),
                    parseFloat(d.longitud || -74.07209)
                  ]}
                  icon={markerIcon}
                >
                  <Popup>  {d.marca}<br /> IMEI: {d.imei}<br /> IP: {d.ip}</Popup>
                </Marker>
              ))}
            </MapContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapSection;