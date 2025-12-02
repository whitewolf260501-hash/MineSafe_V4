// ================================================
// Navbar.js — Barra de navegación global con logo Minesafe
// ================================================
import { navigate } from "../app.js";

export function renderNavbar() {
  const nav = document.createElement("nav");
  nav.className = "main-navbar";

  nav.innerHTML = `
    <div class="navbar-header d-flex align-items-center justify-content-between px-3 py-2">
      <div class="navbar-brand">
        <img src="../assets/images/logo.svg" alt="Minesafe Logo" class="logo-svg" id="logoHome">
        <span>Minesafe 2</span>
      </div>
      <button class="navbar-toggler text-light border-0 fs-4" id="navbarToggle">☰</button>
    </div>

    <ul class="navbar-links" id="navbarLinks">
      <li><a href="#" id="dashboardLink">Inicio</a></li>
      <li><a href="#" id="empresaLink">GeoMina Empresa</a></li>
      <li><a href="#" id="devicesLink">Dispositivos</a></li>
      <li><a href="#" id="logoutLink">Cerrar sesión</a></li>
    </ul>
  `;

  // ---- Eventos de navegación ----
  nav.querySelector("#dashboardLink").addEventListener("click", () => navigate("user"));
  nav.querySelector("#empresaLink").addEventListener("click", () => navigate("empresa"));
  nav.querySelector("#devicesLink").addEventListener("click", () => navigate("devices"));
  nav.querySelector("#logoutLink").addEventListener("click", () => navigate("login"));

  // Logo clickeable (volver al panel)
  const logo = nav.querySelector("#logoHome");
  if (logo) {
    logo.style.cursor = "pointer";
    logo.addEventListener("click", () => navigate("user"));
  }

  // ---- Toggle móvil ----
  const toggle = nav.querySelector("#navbarToggle");
  const links = nav.querySelector("#navbarLinks");
  toggle.addEventListener("click", () => {
    links.classList.toggle("show");
  });

  return nav;
}
