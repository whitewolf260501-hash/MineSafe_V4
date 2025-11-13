// ================================================
// roleManager.js — Control centralizado de roles
// ================================================
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import { firestore } from "../firebaseConfig.js";

// 🔹 Carga el rol del usuario actual
export async function getUserRole(uid) {
  try {
    const ref = doc(firestore, "users", uid);
    const snap = await getDoc(ref);
    if (!snap.exists()) return "usuario";
    const data = snap.data();
    if (data.isSuperUser || data.tipoUsuario === "superuser") return "superuser";
    if (data.isAdmin || data.tipoUsuario === "admin") return "admin";
    return data.tipoUsuario || "usuario";
  } catch (e) {
    console.error("Error al obtener rol:", e);
    return "usuario";
  }
}

// 🔹 Verifica si el usuario tiene permisos para una acción
export function canPerform(role, action) {
  const permissions = {
    superuser: ["create", "edit", "delete", "view"],
    admin: ["create", "edit", "view"],
    usuario: ["view"],
  };
  return permissions[role]?.includes(action);
}
