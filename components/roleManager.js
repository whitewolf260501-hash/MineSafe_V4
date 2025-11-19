// ================================================
// roleManager.js — Sistema de roles unificado
// ================================================
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { firestore } from "../firebaseConfig.js";

// ------------------------------------------------
// OBTENER ROL REAL DEL USUARIO
// ------------------------------------------------
export async function getUserRole(uid) {
  try {
    const ref = doc(firestore, "users", uid);
    const snap = await getDoc(ref);

    if (!snap.exists()) return "usuario";
    const data = snap.data();

    // NORMALIZACIÓN DE TODAS LAS VARIANTES
    if (data.isSuperUser || data.tipoUsuario === "superAdmin") return "superAdmin";
    if (data.isAdmin || data.tipoUsuario === "admin") return "admin";

    return data.tipoUsuario || "usuario";

  } catch (e) {
    console.error("Error al obtener rol:", e);
    return "usuario";
  }
}

// ------------------------------------------------
// VALIDAR PERMISOS
// ------------------------------------------------
export function canPerform(role, action) {

  const permissions = {
    superAdmin: ["create", "edit", "delete", "view"],
    admin: ["create", "edit", "view"],
    usuario: ["view"]
  };

  return permissions[role]?.includes(action);
}
