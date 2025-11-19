//identifier: functions/index.js
/**
 * Firebase Functions — Usuarios:
 * ✔ Registro automático en Firestore + Realtime DB
 * ✔ Correo de bienvenida
 * ✔ Correo al activar/desactivar
 * Compatible con funciones.config() (Plan Spark ☑)
 */

const { setGlobalOptions } = require("firebase-functions");
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

// =======================================================
// Inicialización
// =======================================================
admin.initializeApp();
setGlobalOptions({ maxInstances: 10 });

// =======================================================
// Configuración Nodemailer (desde functions.config())
// =======================================================
const gmailEmail = functions.config().gmail.email;
const gmailPass = functions.config().gmail.pass;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailEmail,
    pass: gmailPass,
  },
});

// =======================================================
// ⭐ 1️⃣ CUANDO UN USUARIO SE CREA EN FIREBASE AUTH
// =======================================================
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const email = user.email || "";

  console.log("Nuevo usuario:", uid);

  // 1️⃣ Guardar en Firestore
  await admin.firestore().collection("users").doc(uid).set({
    uid: uid,
    email: email,
    nombre: "",
    telefono: "",
    empresa: "",
    cargo: "",
    tipoUsuario: "usuario",
    isActive: true,
    isAdmin: false,
    isSuperUser: false,
    createdAt: new Date().toISOString(),
  });

  // 2️⃣ Guardar en Realtime Database
  await admin.database().ref(`users/${uid}`).set({
    email: email,
    nombre: "",
    telefono: "",
    empresa: "",
    cargo: "",
    tipoUsuario: "usuario",
    isActive: true,
    createdAt: Date.now(),
  });

  // 3️⃣ Enviar correo de bienvenida
  await sendWelcomeEmail(email);

  console.log("✔ Usuario creado + sincronizado + correo enviado");
  return true;
});

// =======================================================
// ⭐ 2️⃣ DETECTAR ACTIVACIÓN/DESACTIVACIÓN DEL USUARIO
// Firestore → users/{uid}.isActive
// =======================================================
exports.onUserStatusChange = functions.firestore
  .document("users/{uid}")
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // No cambió el estado → salir
    if (before.isActive === after.isActive) return null;

    const email = after.email;
    const nombre = after.nombre;
    const estado = after.isActive ? "ACTIVADA" : "DESACTIVADA";

    await sendStatusEmail(email, estado, nombre);

    console.log(`✔ Correo enviado por cambio de estado (${estado})`);
    return true;
  });

// =======================================================
// 📧 FUNCIÓN: CORREO DE BIENVENIDA
// =======================================================
async function sendWelcomeEmail(email) {
  if (!email) return;

  const mailOptions = {
    from: `"Minesafe" <${gmailEmail}>`,
    to: email,
    subject: "¡Bienvenido a Minesafe!",
    html: `
      <div style="font-family: Arial; padding: 20px; background: #f4f4f4;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 25px; border-radius: 8px;">
          <h2 style="color: #0077cc;">Bienvenido a Minesafe</h2>
          <p>Tu cuenta ha sido creada exitosamente.</p>
          <p>Ya puedes iniciar sesión y comenzar a usar la plataforma.</p>
          <br>
          <p>Saludos,<br>Minesafe Team</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log("✔ Correo de bienvenida enviado a:", email);
}

// =======================================================
// 📧 FUNCIÓN: CORREO AL ACTIVAR O DESACTIVAR
// =======================================================
async function sendStatusEmail(email, status, nombre = "") {
  if (!email) return;

  const mensajeExtra =
    status === "ACTIVADA"
      ? "<p>Ya puedes volver a iniciar sesión en la plataforma.</p>"
      : "<p>No podrás acceder hasta que un administrador reactive tu cuenta.</p>";

  const mailOptions = {
    from: `"Minesafe" <${gmailEmail}>`,
    to: email,
    subject: `Tu cuenta ha sido ${status}`,
    html: `
      <div style="font-family: Arial; padding: 20px; background: #f4f4f4;">
        <div style="max-width: 500px; margin: auto; background: white; padding: 25px; border-radius: 8px;">
          <h2 style="color: #0077cc;">Estado de tu cuenta en Minesafe</h2>

          <p>Hola ${nombre || "usuario"},</p>
          <p>Tu cuenta ha sido <strong>${status}</strong>.</p>

          ${mensajeExtra}

          <br>
          <p>Saludos,<br>Minesafe Team</p>
        </div>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
  console.log(`✔ Correo de estado enviado a: ${email}`);
}
