import React, { useState, useRef, useEffect } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';
import cartaImage from './assets/carta.png'; // Imagen de la carta
import escudoImage from './assets/Escudo.jpg'; // Logo Escudo
import fgecamImage from './assets/FGECAM.jpg'; // Logo FGECAM
import gobiernoImage from './assets/Gobierno de Todos.jpg'; // Logo Gobierno de Todos

function App() {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [fotoSelfie, setFotoSelfie] = useState(null);
  const [identificacion, setIdentificacion] = useState(null);
  const [actaNacimiento, setActaNacimiento] = useState(null);
  const [oficioSolicitud, setOficioSolicitud] = useState(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const fotoSelfieRef = useRef(null);
  const identificacionRef = useRef(null);
  const actaNacimientoRef = useRef(null);
  const oficioSolicitudRef = useRef(null);

  const handleFileChange = (setFile) => (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append('nombre', nombre);
    formData.append('email', email);
    if (fotoSelfie) formData.append('fotoSelfie', fotoSelfie);
    if (identificacion) formData.append('identificacion', identificacion);
    if (actaNacimiento) formData.append('actaNacimiento', actaNacimiento);
    if (oficioSolicitud) formData.append('oficioSolicitud', oficioSolicitud);

    try {
      const response = await fetch('http://localhost:3001/submit', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Solicitud enviada con éxito. Tu folio es: ${data.folio}`);
        setNombre('');
        setEmail('');
        setFotoSelfie(null);
        setIdentificacion(null);
        setActaNacimiento(null);
        setOficioSolicitud(null);

        fotoSelfieRef.current.value = '';
        identificacionRef.current.value = '';
        actaNacimientoRef.current.value = '';
        oficioSolicitudRef.current.value = '';
      } else {
        setMessage('Error al enviar la solicitud.');
      }
    } catch (error) {
      setMessage('Error de conexión con el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="app-container">
      {showInstructions && (
        <div className="instructions-modal">
          <div className="instructions-content">
            <h2>¡Bienvenido/a!</h2>
            <p>Gracias por utilizar nuestra plataforma. Para agilizar tu solicitud, te pedimos que al llenar el formulario y subir tus documentos consideres lo siguiente:</p>
            <ul>
              <li><strong>Nombre completo:</strong> Asegúrate de escribir tu nombre completo y verificarlo antes de enviar. Este dato será utilizado en tu carta.</li>
              <li><strong>Correo electrónico válido:</strong> Proporciona un correo electrónico válido, ya que será el medio por el cual recibirás tu carta.</li>
              <li><strong>Fotografía personal (selfie):</strong> Debe ser clara y tomada a la altura de los hombros. Asegúrate de que tu rostro esté despejado y bien iluminado.</li>
              <li><strong>Fotografía de identificación:</strong> Debe ser clara y legible. Asegúrate de que los datos del frente de tu identificación sean visibles.</li>
              <li><strong>Acta de nacimiento:</strong> Sube el archivo en formato PDF. Procura que sea la versión más reciente.</li>
              <li><strong>Oficio de solicitud (Carta):</strong> Dirigida a la Mtra. Dora Cecilia Nuñez Gongora, Directora del Instituto de Servicios Periciales. Explica los motivos por los cuales solicitas la carta. Asegúrate de que esté debidamente firmada.</li>
            </ul>
            <p>Nota: Revisa que todos los documentos estén completos y cumplan con los requisitos antes de enviarlos. Esto nos ayudará a procesar tu solicitud de manera más eficiente.</p>
            <p>Si tienes alguna duda, no dudes en contactarnos. ¡Estamos aquí para ayudarte!</p>
            <button onClick={() => setShowInstructions(false)}>Cerrar</button>
          </div>
        </div>
      )}

      {/* Logos en la parte superior */}
      <div className="logos-container">
        <img src={escudoImage} alt="Escudo" className="logo" />
        <img src={fgecamImage} alt="FGECAM" className="logo" />
        <img src={gobiernoImage} alt="Gobierno de Todos" className="logo" />
      </div>

      {/* Título centrado sobre las columnas */}
      <div className="title-container">
        <h1>Solicitud para la Carta de Antecedentes No Penales</h1>
      </div>

      {/* Contenedor principal con dos columnas */}
      <div className="main-container">
        {/* Columna izquierda: Imagen de la carta */}
        <div className="image-column">
          <img src={cartaImage} alt="Carta" className="carta-image" />
        </div>

        {/* Columna derecha: Formulario */}
        <div className="form-column">
          {message && <div className={`alert ${message.includes('éxito') ? 'alert-success' : 'alert-danger'}`}>{message}</div>}
          <form onSubmit={handleSubmit}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label>Correo electrónico:</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Fotografía (selfie):</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange(setFotoSelfie)}
                  ref={fotoSelfieRef}
                  required
                />
              </div>
              <div className="form-group">
                <label>Fotografía de identificación:</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange(setIdentificacion)}
                  ref={identificacionRef}
                  required
                />
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Acta de nacimiento:</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange(setActaNacimiento)}
                  ref={actaNacimientoRef}
                  required
                />
              </div>
              <div className="form-group">
                <label>Oficio de solicitud:</label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileChange(setOficioSolicitud)}
                  ref={oficioSolicitudRef}
                  required
                />
              </div>
            </div>
            <div className="form-row button-row">
              <button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default App;