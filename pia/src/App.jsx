import "./App.css";
import Navbar from "./Components/Navbar.jsx";
import Fondo from "../src/assets/Fondo.png";
import { useState } from "react";

const Inicio = () => {
  const scrollToServicios = () => {
    const section = document.getElementById("servicios");
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <section
      id="inicio"
      className="flex flex-col items-center justify-center text-center text-white min-h-screen px-6"
      style={{
        backgroundImage: `url(${Fondo})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="bg-black/50 p-10 rounded-2xl shadow-xl max-w-3xl">
        <h1 className="text-5xl font-extrabold mb-3 drop-shadow-lg">
          Search And Destroy
        </h1>
        <h3 className="text-2xl mb-6 drop-shadow-md italic">
          Busca y destruye
        </h3>

        <p className="text-lg mb-4 leading-relaxed">
          <strong>Search And Destroy</strong> es una iniciativa pensada para
          proteger a los ciudadanos en caso de robo o pérdida de su dispositivo
          móvil. Localiza tu equipo en tiempo real y protege tu información
          personal con solo unos clics.
        </p>

        <p className="text-lg mb-4 leading-relaxed">
          Nuestro sistema te permite acceder de forma segura, iniciar sesión y
          tomar acciones remotas, como bloquear o eliminar los datos del
          teléfono, asegurando tu privacidad y tranquilidad.
        </p>

        <p className="text-lg mb-8 leading-relaxed">
          Con <strong>Search And Destroy</strong> mantienes el control incluso
          en situaciones de emergencia. Nuestro objetivo es ofrecerte una
          herramienta rápida, confiable y al alcance de todos.
        </p>
      </div>
    </section>
  );
};

const Servicios = () => {
  const servicios = [
    {
      icono: "📍",
      titulo: "Localización GPS",
      descripcion:
        "Ubica tu dispositivo en tiempo real mediante GPS con total precisión.",
    },
    {
      icono: "🔒",
      titulo: "Bloqueo remoto",
      descripcion:
        "Bloquea tu teléfono de forma remota para mantener tus datos a salvo.",
    },
    {
      icono: "💣",
      titulo: "Eliminación segura",
      descripcion:
        "Elimina toda la información personal de tu dispositivo en caso de robo.",
    },
    {
      icono: "📱",
      titulo: "Historial de ubicaciones",
      descripcion:
        "Consulta los lugares donde tu dispositivo estuvo recientemente.",
    },
    {
      icono: "🚨",
      titulo: "Alertas inmediatas",
      descripcion:
        "Recibe notificaciones instantáneas ante actividades sospechosas.",
    },
    {
      icono: "🛰️",
      titulo: "Modo rastreo continuo",
      descripcion:
        "Activa el modo rastreo y obtén actualizaciones automáticas de ubicación.",
    },
  ];

  return (
    <section
      id="servicios"
      className="py-40 px-8 bg-gray-50 text-gray-800 flex flex-col items-center"
    >
      <h2 className="text-4xl font-bold mb-6 text-blue-600">
        Nuestros Servicios
      </h2>
      <p className="max-w-2xl text-center text-lg mb-10 text-gray-600">
        Contamos con herramientas avanzadas para proteger tu dispositivo y tus
        datos sin importar dónde estés.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl">
        {servicios.map((servicio, index) => (
          <div
            key={index}
            className="bg-white shadow-lg rounded-lg p-6 hover:shadow-2xl transition duration-300 flex flex-col items-center text-center"
          >
            <div className="text-5xl mb-4">{servicio.icono}</div>
            <h3 className="text-xl font-semibold mb-2 text-blue-600">
              {servicio.titulo}
            </h3>
            <p className="text-gray-700">{servicio.descripcion}</p>
          </div>
        ))}
      </div>
    </section>
  );
};

const Contacto = () => {
  const [nombre, setNombre] = useState("");
  const [correo, setCorreo] = useState("");
  const [mensaje, setMensaje] = useState("");

  const enviarMensaje = (e) => {
    e.preventDefault();
    if (!nombre || !correo || !mensaje) {
      alert("Por favor completa todos los campos.");
      return;
    }

    const numeroWhatsApp = "573001234567"; // Reemplaza con tu número real
    const texto = `Hola, soy ${nombre} (${correo}).\n\n${mensaje}`;
    const url = `https://wa.me/${numeroWhatsApp}?text=${encodeURIComponent(
      texto
    )}`;
    window.open(url, "_blank");

    setNombre("");
    setCorreo("");
    setMensaje("");
  };

  return (
    <section id="contacto" className="py-20 bg-gray-800 text-center">
      <h2 className="text-4xl font-bold mb-6 text-blue-600">Contáctanos</h2>
      <p className="max-w-2xl mx-auto text-lg leading-relaxed text-gray-200 mb-6">
        ¿Tienes alguna duda o sugerencia? Escríbenos y nuestro equipo te ayudará
        lo antes posible.
      </p>

      <form
        onSubmit={enviarMensaje}
        className="max-w-md mx-auto bg-white p-6 rounded-xl shadow-lg space-y-4"
      >
        <input
          type="text"
          placeholder="Tu nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          className="w-full border text-black  border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <input
          type="email"
          placeholder="Tu correo"
          value={correo}
          onChange={(e) => setCorreo(e.target.value)}
          className="w-full border text-black border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <textarea
          placeholder="Escribe tu mensaje..."
          rows="4"
          value={mensaje}
          onChange={(e) => setMensaje(e.target.value)}
          className="w-full border text-black border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        ></textarea>
        <button
          type="submit"
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg transition duration-300"
        >
          Enviar mensaje
        </button>
      </form>
    </section>
  );
};

function App() {
  return (
    <>
      <Navbar />
      <Inicio />
      <Servicios />
      <Contacto />
    </>
  );
}

export default App;
