import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({ correo: '', contraseña: '', confirmarContraseña: '', pinRecuperacion: '' });
  const [loginData, setLoginData] = useState({ correo: '', contraseña: '' });
  const [recuperacionData, setRecuperacionData] = useState({ correo: '', pin: '', nuevaContraseña: '', confirmarContraseña: '' });
  const [currentUser, setCurrentUser] = useState(null);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [showLogin, setShowLogin] = useState(true);
  const [showRecuperacion, setShowRecuperacion] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showNuevaContraseña, setShowNuevaContraseña] = useState(false);
  const [showConfirmNuevaContraseña, setShowConfirmNuevaContraseña] = useState(false);

  const API_URL = 'http://localhost:8080/api/usuarios';
  const navigate = useNavigate();

  const showMessage = (text, type = 'info') => { setMessage(text); setMessageType(type); setTimeout(() => setMessage(''), 5000); };

  const handleInputChange = e => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })); };
  const handleLoginChange = e => { const { name, value } = e.target; setLoginData(prev => ({ ...prev, [name]: value })); };
  const handleRecuperacionChange = e => { const { name, value } = e.target; setRecuperacionData(prev => ({ ...prev, [name]: value })); };

  const validateForm = () => {
    if (!formData.correo || !formData.contraseña || !formData.pinRecuperacion) { showMessage('Complete todos los campos', 'error'); return false; }
    if (formData.contraseña !== formData.confirmarContraseña) { showMessage('Contraseñas no coinciden', 'error'); return false; }
    if (formData.contraseña.length < 6) { showMessage('La contraseña debe tener al menos 6 caracteres', 'error'); return false; }
    if (formData.pinRecuperacion.length !== 6 || !/^\d+$/.test(formData.pinRecuperacion)) { showMessage('El PIN debe tener 6 dígitos', 'error'); return false; }
    return true;
  };

  const validateRecuperacionForm = () => {
    if (!recuperacionData.correo || !recuperacionData.pin || !recuperacionData.nuevaContraseña) { showMessage('Complete todos los campos', 'error'); return false; }
    if (recuperacionData.nuevaContraseña !== recuperacionData.confirmarContraseña) { showMessage('Contraseñas no coinciden', 'error'); return false; }
    if (recuperacionData.nuevaContraseña.length < 6) { showMessage('La contraseña debe tener al menos 6 caracteres', 'error'); return false; }
    if (recuperacionData.pin.length !== 6 || !/^\d+$/.test(recuperacionData.pin)) { showMessage('El PIN debe tener 6 dígitos', 'error'); return false; }
    return true;
  };

  const handleRegister = async e => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await axios.post(`${API_URL}/register`, { correo: formData.correo, contraseña: formData.contraseña, pinRecuperacion: formData.pinRecuperacion });
      showMessage('Usuario registrado exitosamente', 'success');
      resetForm(); setShowLogin(true);
    } catch (err) { showMessage(err.response?.data?.message || 'Error al registrar usuario', 'error'); }
  };

  const handleLogin = async e => {
    e.preventDefault();
    if (!loginData.correo || !loginData.contraseña) { showMessage('Ingrese correo y contraseña', 'error'); return; }

    try {
      const response = await axios.post(`${API_URL}/login`, loginData);

      const usuario = response.data.usuario;
      const token = response.data.token;

      setCurrentUser(usuario);

      localStorage.setItem('userToken', token);
      localStorage.setItem('userData', JSON.stringify(usuario));

      showMessage('Inicio de sesión exitoso', 'success');

      if (usuario.rol === 'admin') {
        navigate('/admin-dashboard');
      } else {
        navigate('/map');
      }
    } catch (err) {
      showMessage(err.response?.data?.message || 'Error en el inicio de sesión', 'error');
    }
  };

  const getTokenConfig = () => {
    const userToken = localStorage.getItem("userToken");
    if (!userToken) {
      return {};
    }
    return {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    };
  };

  const handleRecuperarContraseña = async e => {
    e.preventDefault();
    if (!validateRecuperacionForm()) return;

    try {
      const userResp = await axios.get(`${API_URL}/getByCorreo/${recuperacionData.correo}`).catch(() => null);
      if (!userResp?.data?.usuario) { showMessage('Usuario no encontrado', 'error'); return; }
      const userId = userResp.data.usuario.id;

      await axios.put(`${API_URL}/update/${userId}`,
        {
          correo: recuperacionData.correo,
          contraseña: recuperacionData.nuevaContraseña,
          pinRecuperacion: recuperacionData.pin
        },
        getTokenConfig()
      );

      showMessage('Contraseña actualizada exitosamente', 'success');
      resetRecuperacionForm(); setShowRecuperacion(false); setShowLogin(true);
    } catch (err) { showMessage(err.response?.data?.message || 'Error al recuperar contraseña', 'error'); }
  };

  const resetForm = () => setFormData({ correo: '', contraseña: '', confirmarContraseña: '', pinRecuperacion: '' });
  const resetLoginForm = () => setLoginData({ correo: '', contraseña: '' });
  const resetRecuperacionForm = () => setRecuperacionData({ correo: '', pin: '', nuevaContraseña: '', confirmarContraseña: '' });

  const flipForm = () => { setShowLogin(!showLogin); setShowRecuperacion(false); resetForm(); resetLoginForm(); resetRecuperacionForm(); };
  const showRecuperacionForm = () => { setShowRecuperacion(true); setShowLogin(false); resetForm(); resetLoginForm(); };
  const volverALogin = () => { setShowRecuperacion(false); setShowLogin(true); resetRecuperacionForm(); };

  useEffect(() => {
    const token = localStorage.getItem("userToken");
    if (token && window.location.pathname !== "/map") {
      navigate("/map", { replace: true });
    }
  }, []);

  return (
    <div className="min-h-screen from-gray-800 to-gray-900">
      <nav className="bg-gray-700 border-b border-gray-600">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <Link to="/" className="text-2xl font-bold text-blue-400 tracking-wide hover:text-blue-300 transition duration-300">
            Search<span className="text-white">&</span>Destroy
          </Link>
        </div>
      </nav>

      <div className="max-w-md mx-auto py-12 px-4">
        {message && <div className={`mb-6 p-4 rounded-lg border ${messageType === 'success' ? 'bg-green-900 border-green-700 text-green-200' : messageType === 'error' ? 'bg-red-900 border-red-700 text-red-200' : 'bg-blue-900 border-blue-700 text-blue-200'}`}>{message}</div>}

        <div className="relative">
          <div className={`bg-gray-700 rounded-2xl shadow-2xl p-8 transition-all duration-500 transform ${showLogin && !showRecuperacion ? 'opacity-100 rotate-y-0' : 'opacity-0 absolute inset-0 rotate-y-180 pointer-events-none'}`}>
            <h2 className="text-3xl font-bold text-white text-center mb-8">Iniciar Sesión</h2>
            <form onSubmit={handleLogin} className="space-y-6">
              <input type="email" name="correo" value={loginData.correo} onChange={handleLoginChange} placeholder="usuario@ejemplo.com" className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500" required />
              <div className="relative">
                <input type={showLoginPassword ? "text" : "password"} name="contraseña" value={loginData.contraseña} onChange={handleLoginChange} placeholder="••••••••" className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white placeholder-gray-400 pr-12 focus:ring-2 focus:ring-blue-500" required />
                <button type="button" onClick={() => setShowLoginPassword(!showLoginPassword)} className="absolute right-3 top-3 text-gray-400 hover:text-white">{showLoginPassword ? '👁️' : '👁️‍🗨️'}</button>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg">Iniciar Sesión</button>
            </form>
            <div className="text-center mt-6 space-y-3">
              <button onClick={flipForm} className="text-blue-400 hover:text-blue-300 block w-full">¿No tienes cuenta? Crear una</button>
              <button onClick={showRecuperacionForm} className="text-yellow-400 hover:text-yellow-300 block w-full">¿Olvidaste tu contraseña?</button>
            </div>
          </div>

          <div className={`bg-gray-700 rounded-2xl shadow-2xl p-8 transition-all duration-500 transform ${!showLogin && !showRecuperacion ? 'opacity-100 rotate-y-0' : 'opacity-0 absolute inset-0 rotate-y-180 pointer-events-none'}`}>
            <h2 className="text-3xl font-bold text-white text-center mb-8">Crear Cuenta</h2>
            <form onSubmit={handleRegister} className="space-y-6">
              <input type="email" name="correo" value={formData.correo} onChange={handleInputChange} placeholder="usuario@ejemplo.com" className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white" required />
              <input type={showPassword ? "text" : "password"} name="contraseña" value={formData.contraseña} onChange={handleInputChange} placeholder="Contraseña" className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white" required />
              <input type={showConfirmPassword ? "text" : "password"} name="confirmarContraseña" value={formData.confirmarContraseña} onChange={handleInputChange} placeholder="Confirmar Contraseña" className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white" required />
              <input type="text" name="pinRecuperacion" value={formData.pinRecuperacion} onChange={handleInputChange} placeholder="PIN 6 dígitos" className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white" maxLength={6} pattern="\d{6}" required />
              <button type="submit" className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-3 rounded-lg">Crear Cuenta</button>
            </form>
            <div className="text-center mt-6"><button onClick={flipForm} className="text-blue-400 hover:text-blue-300">¿Ya tienes cuenta? Iniciar sesión</button></div>
          </div>

          <div className={`bg-gray-700 rounded-2xl shadow-2xl p-8 transition-all duration-500 transform ${showRecuperacion ? 'opacity-100 rotate-y-0' : 'opacity-0 absolute inset-0 rotate-y-180 pointer-events-none'}`}>
            <h2 className="text-3xl font-bold text-white text-center mb-8">Recuperar Contraseña</h2>
            <form onSubmit={handleRecuperarContraseña} className="space-y-6">
              <input type="email" name="correo" value={recuperacionData.correo} onChange={handleRecuperacionChange} placeholder="usuario@ejemplo.com" className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white" required />
              <input type="text" name="pin" value={recuperacionData.pin} onChange={handleRecuperacionChange} placeholder="PIN 6 dígitos" className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white" maxLength={6} pattern="\d{6}" required />
              <input type={showNuevaContraseña ? "text" : "password"} name="nuevaContraseña" value={recuperacionData.nuevaContraseña} onChange={handleRecuperacionChange} placeholder="Nueva Contraseña" className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white" required />
              <input type={showConfirmNuevaContraseña ? "text" : "password"} name="confirmarContraseña" value={recuperacionData.confirmarContraseña} onChange={handleRecuperacionChange} placeholder="Confirmar Nueva Contraseña" className="w-full px-4 py-3 bg-gray-600 border border-gray-500 rounded-lg text-white" required />
              <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-700 text-white font-semibold py-3 rounded-lg">Recuperar Contraseña</button>
            </form>
            <div className="text-center mt-6"><button onClick={volverALogin} className="text-blue-400 hover:text-blue-300">Volver al inicio de sesión</button></div>
          </div>

        </div>
      </div>
    </div>
  );
};

export default Login;