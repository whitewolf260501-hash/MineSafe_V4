//identifier: functions/index.js
/**
 * Firebase Functions — Usuarios:
 * ✔ Registro automático en Firestore + Realtime DB
 * ✔ Correo de bienvenida
 * ✔ Correo al activar/desactivar
 * ✔ Crear usuarios desde admin con enlace de contraseña
 * Compatible con funciones.config() (Plan Spark ☑)
 */

//identifier: functions/index.js
/**
 * Firebase Functions — Usuarios:
 * ✔ Registro automático en Firestore + Realtime DB
 * ✔ Correo de bienvenida
 * ✔ Correo al activar/desactivar
 * ✔ Crear usuarios desde admin con enlace de contraseña
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
const gmailEmail = functions.config().gmail.email;
const gmailPass = functions.config().gmail.pass;

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: { user: gmailEmail, pass: gmailPass },
});

// =======================================================
// 🔹 Helper: ID consistente a partir del email
const sanitizeId = (email) => String(email || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "_");

// =======================================================
// 1️⃣ Usuario creado en Firebase Auth
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const uid = user.uid;
  const email = user.email || "";

  console.log("Nuevo usuario Auth:", uid);

  // Firestore
  await admin.firestore().collection("users").doc(uid).set({
    uid,
    email,
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

  // Realtime DB
  await admin.database().ref(`users/${uid}`).set({
    uid,
    email,
    nombre: "",
    telefono: "",
    empresa: "",
    cargo: "",
    tipoUsuario: "usuario",
    isActive: true,
    createdAt: Date.now(),
  });

  // Correo de bienvenida
  await sendWelcomeEmail(email);

  console.log("✔ Usuario sincronizado y correo enviado");
  return true;
});

// =======================================================
// 2️⃣ Detectar activación/desactivación del usuario
exports.onUserStatusChange = functions.firestore
  .document("users/{uid}")
  .onUpdate(async (change) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.isActive === after.isActive) return null;

    const email = after.email;
    const nombre = after.nombre;
    const estado = after.isActive ? "ACTIVADA" : "DESACTIVADA";

    await sendStatusEmail(email, estado, nombre);
    console.log(`✔ Correo enviado por cambio de estado (${estado})`);
    return true;
  });

// =======================================================
// 3️⃣ Crear usuario desde Admin (HTTPS Callable)
exports.createUserAdmin = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Debe iniciar sesión');

  const callerUid = context.auth.uid;
  const callerDoc = await admin.firestore().collection('users').doc(callerUid).get();
  const callerData = callerDoc.data();
  if (!callerData?.isAdmin && !callerData?.isSuperUser) {
    throw new functions.https.HttpsError('permission-denied', 'No tienes permisos para crear usuarios');
  }

  const { email, displayName = '', tipoUsuario = 'usuario', telefono = '', cargo = '', empresa = '' } = data;
  const userId = sanitizeId(email);

  try {
    const password = Math.random().toString(36).slice(-8);

    const userRecord = await admin.auth().createUser({ uid: userId, email, displayName, password });

    await admin.auth().setCustomUserClaims(userRecord.uid, {
      isAdmin: tipoUsuario === 'admin',
      isSuperUser: tipoUsuario === 'superAdmin'
    });

    // Firestore
    await admin.firestore().collection('users').doc(userRecord.uid).set({
      uid: userRecord.uid,
      email,
      nombre: displayName,
      telefono,
      cargo,
      empresa,
      tipoUsuario,
      isAdmin: tipoUsuario === 'admin',
      isSuperUser: tipoUsuario === 'superAdmin',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });

    // Realtime DB
    await admin.database().ref(`users/${userRecord.uid}`).set({
      uid: userRecord.uid,
      email,
      nombre: displayName,
      telefono,
      cargo,
      empresa,
      tipoUsuario,
      isAdmin: tipoUsuario === 'admin',
      isSuperUser: tipoUsuario === 'superAdmin',
      isActive: true,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Link para establecer contraseña
    const link = await admin.auth().generatePasswordResetLink(email, {
      url: "https://TU_DOMINIO/login", // reemplazar con URL de login
      handleCodeInApp: true
    });

    // Correo
    await sendWelcomeEmailWithLink(email, displayName, link);

    return { success: true, email, resetLink: link };

  } catch (err) {
    console.error("Error creando usuario:", err);
    throw new functions.https.HttpsError('internal', err.message);
  }
});

// =======================================================
// Correo de bienvenida simple
async function sendWelcomeEmail(email) {
  if (!email) return;
  const mailOptions = {
    from: `"Minesafe" <${gmailEmail}>`,
    to: email,
    subject: "¡Bienvenido a Minesafe!",
    html: `<div style="font-family: Arial; padding:20px; background:#f4f4f4;">
      <div style="max-width:500px; margin:auto; background:white; padding:25px; border-radius:8px;">
        <h2 style="color:#0077cc;">Bienvenido a Minesafe</h2>
        <p>Tu cuenta ha sido creada exitosamente.</p>
        <p>Ya puedes iniciar sesión y comenzar a usar la plataforma.</p>
        <br><p>Saludos,<br>Minesafe Team</p>
      </div>
    </div>`,
  };
  await transporter.sendMail(mailOptions);
}

// Correo de bienvenida con link de contraseña
async function sendWelcomeEmailWithLink(email, nombre, link) {
  if (!email) return;
  const mailOptions = {
    from: `"Minesafe" <${gmailEmail}>`,
    to: email,
    subject: "Tu cuenta en Minesafe ha sido creada",
    html: `<div style="font-family: Arial; padding:20px; background:#f4f4f4;">
      <div style="max-width:500px; margin:auto; background:white; padding:25px; border-radius:8px;">
        <h2 style="color:#0077cc;">Bienvenido a Minesafe</h2>
        <p>Hola ${nombre || 'usuario'}, tu cuenta ha sido creada por un administrador.</p>
        <p>Para establecer tu contraseña y activar tu cuenta, haz clic en el siguiente enlace:</p>
        <p><a href="${link}">Configurar contraseña</a></p>
        <br><p>Saludos,<br>Minesafe Team</p>
      </div>
    </div>`,
  };
  await transporter.sendMail(mailOptions);
}

// Correo al activar/desactivar usuario
async function sendStatusEmail(email, status, nombre = "") {
  if (!email) return;
  const mensajeExtra = status === "ACTIVADA"
    ? "<p>Ya puedes volver a iniciar sesión en la plataforma.</p>"
    : "<p>No podrás acceder hasta que un administrador reactive tu cuenta.</p>";
  const mailOptions = {
    from: `"Minesafe" <${gmailEmail}>`,
    to: email,
    subject: `Tu cuenta ha sido ${status}`,
    html: `<div style="font-family: Arial; padding:20px; background:#f4f4f4;">
      <div style="max-width:500px; margin:auto; background:white; padding:25px; border-radius:8px;">
        <h2 style="color:#0077cc;">Estado de tu cuenta en Minesafe</h2>
        <p>Hola ${nombre || 'usuario'},</p>
        <p>Tu cuenta ha sido <strong>${status}</strong>.</p>
        ${mensajeExtra}
        <br><p>Saludos,<br>Minesafe Team</p>
      </div>
    </div>`,
  };
  await transporter.sendMail(mailOptions);

  console.log(`✔ Correo de estado enviado a: ${email}`);
}
