// Importar las dependencias necesarias
require('dotenv').config({ path: '../.env' }); // Ruta relativa al archivo .env

const express = require('express');
const multer = require('multer');
const nodemailer = require('nodemailer');
const sql = require('mssql');
const cors = require('cors');
const fs = require('fs');
const mime = require('mime-types'); // Añadido para detectar el tipo MIME de los archivos

// Crear una instancia de Express
const app = express();

// Configurar Multer para manejar la subida de archivos
const upload = multer({ dest: 'uploads/' });

// Habilitar CORS para permitir solicitudes desde el frontend
app.use(cors());

// Configuración de SQL Server
const config = {
  user: process.env.DB_USER, // Reemplaza con tu usuario de SQL Server
  password: process.env.DB_PASSWORD, // Reemplaza con tu contraseña de SQL Server
  server: process.env.DB_SERVER, // Reemplaza con la dirección de tu servidor SQL
  database: process.env.DB_NAME, // Reemplaza con el nombre de tu base de datos
  options: {
    encrypt: false, // Usar encriptación (necesario para Azure)
    trustServerCertificate: true, // Confiar en el certificado del servidor (si es necesario)
  },
};

// Configuración de Nodemailer para enviar correos electrónicos
const transporter = nodemailer.createTransport({
  service: 'gmail', // Usar el servicio de Gmail
  auth: {
    user: process.env.EMAIL_USER, // Tu correo
    pass: process.env.EMAIL_PASSWORD, // Tu contraseña
  },
});

// Función para generar un folio único
const generarFolio = () => {
  return Math.floor(100000 + Math.random() * 900000); // Número aleatorio de 6 dígitos
};

// Función para enviar el correo electrónico
const sendEmail = (nombre, email, folio, files) => {
  // Preparar archivos adjuntos para el correo del administrador
  const attachments = Object.keys(files).map((key) => {
    const file = files[key][0];
    return {
      filename: file.originalname,
      path: file.path,
      contentType: mime.lookup(file.path) || 'application/octet-stream',
    };
  });

  // Correo para el administrador (con archivos adjuntos)
  const mailOptionsAdmin = {
    from: 'desarrollopruebasfge@gmail.com',
    to: 'desarrollopruebasfge@gmail.com', // Correo del administrador
    subject: `Solicitud recibida con Folio: ${folio}`,
    text: `Se ha recibido una nueva solicitud:\n\nNombre: ${nombre}\nEmail: ${email}\nFolio: ${folio}`,
    html: `
      <h1>Solicitud recibida con Folio: ${folio}</h1>
      <p><strong>Nombre:</strong> ${nombre}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Folio:</strong> ${folio}</p>
      <p>Archivos adjuntos:</p>
      <ul>
        <li>Fotografía (selfie): ${files.fotoSelfie[0].originalname}</li>
        <li>Identificación: ${files.identificacion[0].originalname}</li>
        <li>Acta de nacimiento: ${files.actaNacimiento[0].originalname}</li>
        <li>Oficio de solicitud: ${files.oficioSolicitud[0].originalname}</li>
      </ul>
    `,
    attachments, // Adjuntar archivos
  };

  // Correo para el usuario (sin archivos adjuntos)
  const mailOptionsUser = {
    from: 'desarrollopruebasfge@gmail.com',
    to: email, // Correo del usuario
    subject: `Tu solicitud ha sido recibida con el Folio: ${folio}`,
    text: `Estimado ${nombre},\n\nHemos recibido su solicitud. Su folio es: ${folio}. Le recordamos que dicha solicitud será atendida a la brevedad posible.\n\nGracias por su paciencia.`,
    html: `
      <h1>Tu solicitud ha sido recibida</h1>
      <p>Estimado ${nombre},</p>
      <p>Hemos recibido su solicitud. Su folio es: <strong>${folio}</strong>.</p>
      <p>Le recordamos que dicha solicitud será atendida a la brevedad posible.</p>
      <p>Gracias por su paciencia.</p>
    `,
  };

  // Enviar correos y manejar errores
  return new Promise((resolve, reject) => {
    // Enviar correo al administrador
    transporter.sendMail(mailOptionsAdmin, (errorAdmin, infoAdmin) => {
      if (errorAdmin) {
        console.error('Error al enviar el correo al administrador:', errorAdmin);
        reject(errorAdmin);
      } else {
        console.log('Correo enviado al administrador:', infoAdmin.response);

        // Enviar correo al usuario
        transporter.sendMail(mailOptionsUser, (errorUser, infoUser) => {
          if (errorUser) {
            console.error('Error al enviar el correo al usuario:', errorUser);
            reject(errorUser);
          } else {
            console.log('Correo enviado al usuario:', infoUser.response);

            // Eliminar archivos temporales después de enviar ambos correos
            Object.keys(files).forEach((key) => {
              if (fs.existsSync(files[key][0].path)) {
                fs.unlinkSync(files[key][0].path);
              }
            });

            resolve(); // Indicar que todo salió bien
          }
        });
      }
    });
  });
};

// Ruta para manejar el envío del formulario
app.post('/submit', upload.fields([
  { name: 'fotoSelfie', maxCount: 1 },
  { name: 'identificacion', maxCount: 1 },
  { name: 'actaNacimiento', maxCount: 1 },
  { name: 'oficioSolicitud', maxCount: 1 },
]), async (req, res) => {
  const { nombre, email } = req.body; // Obtener datos del formulario
  const files = req.files; // Obtener archivos subidos

  // Validar que todos los campos estén presentes
  if (!nombre || !email || !files.fotoSelfie || !files.identificacion || !files.actaNacimiento || !files.oficioSolicitud) {
    return res.status(400).json({ success: false, message: 'Todos los campos son obligatorios' });
  }

  // Validar tipos de archivo
  const validImageTypes = ['image/jpeg', 'image/png'];
  const validPdfTypes = ['application/pdf'];

  if (
    !validImageTypes.includes(files.fotoSelfie[0].mimetype) ||
    !validImageTypes.includes(files.identificacion[0].mimetype)
  ) {
    return res.status(400).json({ success: false, message: 'Las fotografías deben ser imágenes (JPEG o PNG)' });
  }

  if (
    !validPdfTypes.includes(files.actaNacimiento[0].mimetype) ||
    !validPdfTypes.includes(files.oficioSolicitud[0].mimetype)
  ) {
    return res.status(400).json({ success: false, message: 'El acta de nacimiento y el oficio de solicitud deben ser archivos PDF' });
  }

  try {
    // Conectar a SQL Server
    await sql.connect(config);
    console.log('Conexión a SQL Server exitosa');

    // Generar un folio único
    const folio = generarFolio();

    // Enviar correo electrónico con el folio y los archivos
    await sendEmail(nombre, email, folio, files);

    // Guardar en la base de datos
    const request = new sql.Request();
    await request.query(`
      INSERT INTO Solicitudes (Nombre, Email, Foto1, Identificacion, ActaNacimiento, OficioSolicitud, Folio)
      VALUES ('${nombre}', '${email}', '${files.fotoSelfie[0].path}', '${files.identificacion[0].path}', '${files.actaNacimiento[0].path}', '${files.oficioSolicitud[0].path}', ${folio})
    `);

    // Responder al frontend con el folio
    res.json({ success: true, folio });
  } catch (err) {
    console.error('Error en el servidor:', err);

    // Eliminar archivos temporales en caso de error
    Object.keys(files).forEach((key) => {
      if (fs.existsSync(files[key][0].path)) {
        fs.unlinkSync(files[key][0].path);
      }
    });

    // Responder con un mensaje de error descriptivo
    if (err.code === 'ETIMEOUT' || err.code === 'ESOCKET') {
      res.status(500).json({ success: false, message: 'Error de conexión con la base de datos. Inténtelo de nuevo más tarde.' });
    } else {
      res.status(500).json({ success: false, message: 'Error interno del servidor' });
    }
  }
});

// Iniciar el servidor en el puerto asignado por Render o 3001 por defecto
const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`Servidor backend corriendo en http://localhost:${port}`);
});
// Iniciar el servidor en el puerto 3001
//app.listen(3001, () => {
//  console.log('Servidor backend corriendo en http://localhost:3001');
//});