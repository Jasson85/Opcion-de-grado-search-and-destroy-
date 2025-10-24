import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Icono para el marker
const markerIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const MapSection = () => {
  const navigate = useNavigate();
  const [historial, setHistorial] = useState([]);
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    navigate('/');
  };

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem('userData'));
    if (!userData) {
      navigate('/');
      return;
    }
    setUser(userData);

    // Traer historial de ingresos
    axios.get(`http://localhost:8080/api/usuarios/historial/${userData.id}`)
      .then(res => setHistorial(res.data.historial))
      .catch(err => console.error('Error al obtener historial:', err));
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-800">
      <nav className="bg-gray-700 border-b border-gray-600">
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

      <div className="p-6">
        <h1 className="text-3xl font-bold text-white mb-6">Mapa Principal</h1>

        {/* Horarios de ingreso */}
        <div className="bg-gray-700 rounded-lg p-6 text-white mb-6">
          <h2 className="text-xl font-semibold mb-2">Historial de Ingresos</h2>
          {historial.length === 0 ? (
            <p>No hay registros de ingreso.</p>
          ) : (
            <ul className="list-disc pl-5">
              {historial.map((h) => (
                <li key={h.id}>
                  {new Date(h.fecha_ingreso).toLocaleString()}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Mapa de ejemplo */}
        <div className="bg-gray-700 rounded-lg p-6 text-white">
          <h2 className="text-xl font-semibold mb-2">Ubicación del dispositivo</h2>
          <MapContainer center={[4.710989, -74.072090]} zoom={13} style={{ height: '400px', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; OpenStreetMap contributors"
            />
            <Marker position={[4.710989, -74.072090]} icon={markerIcon}>
              <Popup>Dispositivo de ejemplo</Popup>
            </Marker>
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default MapSection;
