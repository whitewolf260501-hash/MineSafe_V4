// ================================================
// GeoMinaEmpresaForm.js — Ventana Mina & Empresa (vacía por ahora)
// ================================================
export function showGeoMinaEmpresaForm() {
  const root = document.getElementById("root");
  root.innerHTML = `
    <div class="ms-dashboard">
      <aside class="ms-sidebar">
        <div class="ms-brand">
          <img src="assets/images/logo.svg" alt="Minesafe" class="ms-logo"/>
          <h1>Minesafe 2</h1>
        </div>
        <nav class="ms-nav">
          <button onclick="window.history.back()" class="btn btn-ghost">⬅️ Volver</button>
        </nav>
      </aside>

      <main class="ms-main">
        <header class="ms-header">
          <div class="ms-header-left">
            <h2>🏭 Mina & Empresa</h2>
            <p class="ms-sub">Página vacía, lista para registrar datos</p>
          </div>
        </header>

        <section class="ms-grid">
          <article class="ms-card form-card glass">
            <h3>Formulario Mina & Empresa</h3>
            <p>Aquí se podrán agregar los campos de empresa y mina más adelante.</p>
          </article>
        </section>
      </main>
    </div>
  `;
}
