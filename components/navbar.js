// =====================================================
// Navbar.js — Barra de navegación Minesafe 2
// Estilo Profesional + Neon
// =====================================================

import { navigate } from "../app.js";

export function renderNavbar() {
  const nav = document.createElement("nav");
  nav.className = "main-navbar neon-shadow"; // 🔥 efecto neon

  nav.innerHTML = `
    <div class="navbar-header d-flex align-items-center justify-content-between px-3 py-2">
      <div class="navbar-brand d-flex align-items-center gap-2">
        <img src="./assets/images/logo.svg" alt="Minesafe Logo" class="logo-svg" id="logoHome">
        <span class="brand-text">Minesafe 2</span>
      </div>

      <button class="navbar-toggler text-light border-0 fs-3" id="navbarToggle">
        ☰
      </button>
    </div>

    <ul class="navbar-links" id="navbarLinks">
      <li><a href="#" id="dashboardLink">Inicio</a></li>
      <li><a href="#" id="empresaLink">GeoMina Empresa</a></li>
      <li><a href="#" id="devicesLink">Dispositivos</a></li>
      <li><a href="#" id="logoutLink" class="logout">Cerrar sesión</a></li>
    </ul>
  `;

  // ============================
  // 🔗 Eventos de navegación
  // ============================

  nav.querySelector("#dashboardLink").addEventListener("click", () => navigate("user"));
  nav.querySelector("#empresaLink").addEventListener("click", () => navigate("empresa"));
  nav.querySelector("#devicesLink").addEventListener("click", () => navigate("devices"));
  nav.querySelector("#logoutLink").addEventListener("click", () => navigate("login"));

  // Logo clickeable
  const logo = nav.querySelector("#logoHome");
  if (logo) {
    logo.style.cursor = "pointer";
    logo.addEventListener("click", () => navigate("user"));
  }

  // Menú móvil
  const toggle = nav.querySelector("#navbarToggle");
  const links = nav.querySelector("#navbarLinks");

  toggle.addEventListener("click", () => {
    links.classList.toggle("show");
  });

  return nav;
}
