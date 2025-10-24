import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleScrollTo = (id) => {
    const section = document.getElementById(id);
    if (section) {
      section.scrollIntoView({ behavior: "smooth" });
      setMenuOpen(false);
    }
  };

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
        isScrolled
          ? "bg-gray-900/90 backdrop-blur-md shadow-lg"
          : "bg-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo - Link a la página principal */}
        <Link 
          to="/" 
          className="text-2xl font-bold text-blue-400 cursor-pointer tracking-wide hover:text-blue-300 transition duration-300"
        >
          Search<span className="text-white">&</span>Destroy
        </Link>

        {/* Desktop Menu */}
        <ul className="hidden md:flex gap-10 text-white font-medium">
          <li
            onClick={() => handleScrollTo("inicio")}
            className="cursor-pointer hover:text-blue-400 transition duration-300"
          >
            Inicio
          </li>
          <li
            onClick={() => handleScrollTo("servicios")}
            className="cursor-pointer hover:text-blue-400 transition duration-300"
          >
            Servicios
          </li>
          <li
            onClick={() => handleScrollTo("contacto")}
            className="cursor-pointer hover:text-blue-400 transition duration-300"
          >
            Contacto
          </li>
          {/* Link al login */}
          <li>
            <Link 
              to="/login" 
              className="hover:text-blue-400 transition duration-300"
            >
              Login
            </Link>
          </li>
        </ul>

        {/* Mobile Menu Button */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="md:hidden text-white focus:outline-none"
        >
          {menuOpen ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-7 w-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-gray-900/95 backdrop-blur-md py-4 space-y-4 text-center text-white">
          <p
            onClick={() => handleScrollTo("inicio")}
            className="cursor-pointer hover:text-blue-400 transition duration-300"
          >
            Inicio
          </p>
          <p
            onClick={() => handleScrollTo("servicios")}
            className="cursor-pointer hover:text-blue-400 transition duration-300"
          >
            Servicios
          </p>
          <p
            onClick={() => handleScrollTo("contacto")}
            className="cursor-pointer hover:text-blue-400 transition duration-300"
          >
            Contacto
          </p>
          {/* Link al login en mobile */}
          <Link 
            to="/login" 
            className="block hover:text-blue-400 transition duration-300"
            onClick={() => setMenuOpen(false)}
          >
            Login
          </Link>
        </div>
      )}
    </nav>
  );
};

export default Navbar;