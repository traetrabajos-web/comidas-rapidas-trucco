const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');
const htmlFile = path.join(docsDir, 'MANUAL_DE_USUARIO_Y_ADMINISTRADOR_TRUCCO.html');
const pdfFileRoot = path.join(rootDir, 'MANUAL_DE_USUARIO_Y_ADMINISTRADOR_TRUCCO.pdf');
const pdfFileDocs = path.join(docsDir, 'MANUAL_DE_USUARIO_Y_ADMINISTRADOR_TRUCCO.pdf');

// Mirror destination
const mirrorDir = 'C:\\Users\\DESINTEGRACION\\Downloads\\comidas-rapidas-trucco';
const mirrorDocsDir = path.join(mirrorDir, 'docs');
const mirrorPdfRoot = path.join(mirrorDir, 'MANUAL_DE_USUARIO_Y_ADMINISTRADOR_TRUCCO.pdf');
const mirrorPdfDocs = path.join(mirrorDocsDir, 'MANUAL_DE_USUARIO_Y_ADMINISTRADOR_TRUCCO.pdf');

// Read logo as base64 if available
let logoBase64 = '';
const logoPath = path.join(rootDir, 'public', 'logo.png');
if (fs.existsSync(logoPath)) {
  const logoBuffer = fs.readFileSync(logoPath);
  logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
}

const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Manual de Usuario y Administrador - Comidas Rápidas Trucco</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap');

    @page {
      size: A4 portrait;
      margin: 18mm 15mm 20mm 15mm;
      @bottom-right {
        content: "Página " counter(page);
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
      @bottom-left {
        content: "Comidas Rápidas Trucco • Manual del Sistema v3.0";
        font-family: 'Plus Jakarta Sans', sans-serif;
        font-size: 8pt;
        color: #64748b;
      }
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      color: #1e293b;
      background: #ffffff;
      line-height: 1.55;
      font-size: 9.8pt;
    }

    h1, h2, h3, h4, h5 {
      color: #0f172a;
      font-weight: 700;
      line-height: 1.25;
    }

    p {
      margin-bottom: 0.75em;
    }

    .page-break {
      page-break-before: always;
    }

    .avoid-break {
      page-break-inside: avoid;
    }

    /* COVER PAGE */
    .cover {
      min-height: 92vh;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      border: 2px solid #e2e8f0;
      border-radius: 20px;
      padding: 40px;
      background: linear-gradient(135deg, #ffffff 0%, #fffbeb 50%, #fef3c7 100%);
      position: relative;
      overflow: hidden;
    }

    .cover::before {
      content: "";
      position: absolute;
      top: -50px;
      right: -50px;
      width: 250px;
      height: 250px;
      background: radial-gradient(circle, rgba(245, 158, 11, 0.2) 0%, rgba(245, 158, 11, 0) 70%);
      border-radius: 50%;
    }

    .cover-header {
      display: flex;
      align-items: center;
      gap: 20px;
    }

    .cover-logo {
      width: 75px;
      height: 75px;
      object-fit: contain;
      border-radius: 16px;
      background: #0f172a;
      padding: 6px;
      box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.3);
    }

    .cover-brand {
      display: flex;
      flex-direction: column;
    }

    .cover-brand-title {
      font-size: 22pt;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: -0.5px;
      text-transform: uppercase;
    }

    .cover-brand-sub {
      font-size: 10pt;
      font-weight: 600;
      color: #d97706;
      letter-spacing: 1.5px;
      text-transform: uppercase;
    }

    .cover-body {
      margin: 40px 0;
    }

    .cover-badge {
      display: inline-block;
      padding: 6px 14px;
      background: #0f172a;
      color: #f59e0b;
      font-size: 9pt;
      font-weight: 700;
      border-radius: 9999px;
      margin-bottom: 15px;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .cover-title {
      font-size: 28pt;
      font-weight: 800;
      color: #0f172a;
      line-height: 1.15;
      margin-bottom: 15px;
      letter-spacing: -0.8px;
    }

    .cover-desc {
      font-size: 12pt;
      color: #475569;
      max-width: 600px;
      line-height: 1.5;
    }

    .cover-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
      margin-top: 30px;
    }

    .cover-card {
      background: rgba(255, 255, 255, 0.85);
      border: 1px solid #fde68a;
      border-radius: 12px;
      padding: 14px 18px;
      backdrop-filter: blur(10px);
    }

    .cover-card-label {
      font-size: 8pt;
      font-weight: 600;
      text-transform: uppercase;
      color: #b45309;
      letter-spacing: 0.5px;
    }

    .cover-card-value {
      font-size: 10.5pt;
      font-weight: 700;
      color: #0f172a;
      margin-top: 3px;
    }

    .cover-footer {
      border-top: 1px solid #e2e8f0;
      padding-top: 20px;
      display: flex;
      justify-content: space-between;
      align-items: flex-end;
      font-size: 8.5pt;
      color: #64748b;
    }

    /* GENERAL STYLES */
    .section-header {
      border-bottom: 2.5px solid #f59e0b;
      padding-bottom: 8px;
      margin-top: 25px;
      margin-bottom: 16px;
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .section-title {
      font-size: 16pt;
      color: #0f172a;
      font-weight: 800;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .section-number {
      background: #f59e0b;
      color: #000000;
      padding: 2px 10px;
      border-radius: 8px;
      font-size: 12pt;
      font-weight: 800;
    }

    .sub-section-title {
      font-size: 12.5pt;
      color: #1e293b;
      font-weight: 700;
      margin-top: 18px;
      margin-bottom: 8px;
      border-left: 4px solid #f59e0b;
      padding-left: 10px;
    }

    .sub-sub-title {
      font-size: 10.5pt;
      color: #334155;
      font-weight: 700;
      margin-top: 12px;
      margin-bottom: 6px;
    }

    /* CARDS & BOXES */
    .card {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 14px 16px;
      margin-bottom: 12px;
    }

    .callout {
      border-radius: 10px;
      padding: 12px 16px;
      margin: 12px 0;
      font-size: 9.2pt;
    }

    .callout-info {
      background: #eff6ff;
      border-left: 4px solid #3b82f6;
      color: #1e40af;
    }

    .callout-success {
      background: #ecfdf5;
      border-left: 4px solid #10b981;
      color: #065f46;
    }

    .callout-warning {
      background: #fffbeb;
      border-left: 4px solid #f59e0b;
      color: #92400e;
    }

    .callout-danger {
      background: #fef2f2;
      border-left: 4px solid #ef4444;
      color: #991b1b;
    }

    .callout-title {
      font-weight: 700;
      font-size: 9.8pt;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    /* GRID & STEPS */
    .grid-2 {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin: 10px 0;
    }

    .grid-3 {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin: 10px 0;
    }

    .step-box {
      background: #ffffff;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 12px;
      position: relative;
    }

    .step-badge {
      width: 24px;
      height: 24px;
      background: #f59e0b;
      color: #000;
      font-weight: 800;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 9pt;
      margin-bottom: 6px;
    }

    .step-title {
      font-weight: 700;
      font-size: 9.8pt;
      color: #0f172a;
      margin-bottom: 4px;
    }

    .step-desc {
      font-size: 8.8pt;
      color: #64748b;
      line-height: 1.4;
    }

    /* TABLES */
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 9pt;
    }

    th {
      background: #0f172a;
      color: #f8fafc;
      font-weight: 700;
      text-align: left;
      padding: 8px 12px;
      border: 1px solid #334155;
      font-size: 8.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    td {
      padding: 8px 12px;
      border: 1px solid #e2e8f0;
      color: #334155;
    }

    tr:nth-child(even) {
      background: #f8fafc;
    }

    /* CODE & MONO */
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8.5pt;
      background: #f1f5f9;
      color: #0f172a;
      padding: 2px 6px;
      border-radius: 4px;
      border: 1px solid #e2e8f0;
    }

    pre {
      font-family: 'JetBrains Mono', monospace;
      font-size: 8pt;
      background: #0f172a;
      color: #e2e8f0;
      padding: 14px;
      border-radius: 10px;
      overflow-x: hidden;
      white-space: pre-wrap;
      word-wrap: break-word;
      margin: 10px 0;
      border: 1px solid #334155;
      line-height: 1.4;
    }

    /* BADGES */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      font-size: 7.5pt;
      font-weight: 700;
      border-radius: 9999px;
      text-transform: uppercase;
    }

    .badge-amber {
      background: #fef3c7;
      color: #92400e;
      border: 1px solid #fde68a;
    }

    .badge-green {
      background: #dcfce7;
      color: #166534;
      border: 1px solid #bbf7d0;
    }

    .badge-blue {
      background: #dbeafe;
      color: #1e40af;
      border: 1px solid #bfdbfe;
    }

    .badge-purple {
      background: #f3e8ff;
      color: #6b21a8;
      border: 1px solid #e9d5ff;
    }

    /* TOC */
    .toc {
      background: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 12px;
      padding: 20px;
      margin: 20px 0;
    }

    .toc-title {
      font-size: 13pt;
      font-weight: 800;
      color: #0f172a;
      margin-bottom: 12px;
      border-bottom: 2px solid #f59e0b;
      padding-bottom: 4px;
    }

    .toc-list {
      list-style: none;
    }

    .toc-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 9.5pt;
    }

    .toc-item-title {
      font-weight: 600;
      color: #334155;
    }

    .toc-item-number {
      font-weight: 700;
      color: #d97706;
      margin-right: 8px;
    }

    /* FOOTER */
    .footer-note {
      text-align: center;
      font-size: 8pt;
      color: #94a3b8;
      margin-top: 25px;
      border-top: 1px solid #e2e8f0;
      padding-top: 10px;
    }
  </style>
</head>
<body>

  <!-- ==================== PORTADA ==================== -->
  <div class="cover">
    <div class="cover-header">
      ${logoBase64 ? `<img src="${logoBase64}" alt="Logo Trucco" class="cover-logo">` : `<div class="cover-logo" style="display:flex;align-items:center;justify-content:center;color:#f59e0b;font-weight:800;font-size:24pt;">T</div>`}
      <div class="cover-brand">
        <span class="cover-brand-title">Comidas Rápidas Trucco</span>
        <span class="cover-brand-sub">Sistema Web & Gestión Digital v3.0</span>
      </div>
    </div>

    <div class="cover-body">
      <div class="cover-badge">Documentación Oficial de Producción</div>
      <h1 class="cover-title">Manual de Usuario,<br>Panel de Administrador<br>& Guía Técnica Integral</h1>
      <p class="cover-desc">
        Guía completa y exhaustiva para clientes, personal de atención, administradores y desarrolladores. Incluye flujo de pedidos por WhatsApp, gestión de productos, categorías dinámicas, usuarios con copia de credenciales y arquitectura Google Sheets en la nube.
      </p>

      <div class="cover-grid">
        <div class="cover-card">
          <div class="cover-card-label">🌐 Aplicación Web Cliente</div>
          <div class="cover-card-value">comidasrapidastrucco.online</div>
        </div>
        <div class="cover-card">
          <div class="cover-card-label">🔐 Panel de Administración</div>
          <div class="cover-card-value">comidasrapidastrucco.online/admin</div>
        </div>
        <div class="cover-card">
          <div class="cover-card-label">📱 Canal WhatsApp Oficial</div>
          <div class="cover-card-value">+57 317 1922866</div>
        </div>
        <div class="cover-card">
          <div class="cover-card-label">⚡ Base de Datos en Tiempo Real</div>
          <div class="cover-card-value">Google Sheets Cloud Database</div>
        </div>
      </div>
    </div>

    <div class="cover-footer">
      <div>
        <strong>Comidas Rápidas Trucco</strong> • Restaurante & Delivery<br>
        Documento técnico generado para soporte operativo y mantenimiento continuo.
      </div>
      <div style="text-align: right;">
        <strong>Versión:</strong> 3.0.0 Production<br>
        <strong>Emisión:</strong> Septiembre 2026
      </div>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ==================== TABLA DE CONTENIDO ==================== -->
  <div class="toc">
    <div class="toc-title">📖 Índice General del Documento</div>
    <ul class="toc-list">
      <li class="toc-item">
        <span><span class="toc-item-number">1.</span> <span class="toc-item-title">Arquitectura y Funcionamiento General del Sistema</span></span>
        <span class="badge badge-amber">Capítulo 1</span>
      </li>
      <li class="toc-item">
        <span><span class="toc-item-number">2.</span> <span class="toc-item-title">Manual de Usuario (Cliente / Carta Digital & Pedidos)</span></span>
        <span class="badge badge-amber">Capítulo 2</span>
      </li>
      <li class="toc-item">
        <span><span class="toc-item-number">3.</span> <span class="toc-item-title">Manual de Administrador (Panel de Control /admin)</span></span>
        <span class="badge badge-amber">Capítulo 3</span>
      </li>
      <li class="toc-item">
        <span><span class="toc-item-number">4.</span> <span class="toc-item-title">Estructura y Gestión de la Base de Datos (Google Sheets)</span></span>
        <span class="badge badge-amber">Capítulo 4</span>
      </li>
      <li class="toc-item">
        <span><span class="toc-item-number">5.</span> <span class="toc-item-title">Código Backend Google Apps Script v3.0 & Despliegue</span></span>
        <span class="badge badge-amber">Capítulo 5</span>
      </li>
      <li class="toc-item">
        <span><span class="toc-item-number">6.</span> <span class="toc-item-title">Preguntas Frecuentes, Seguridad y Mantenimiento</span></span>
        <span class="badge badge-amber">Capítulo 6</span>
      </li>
    </ul>
  </div>

  <!-- ==================== CAPÍTULO 1 ==================== -->
  <div class="section-header">
    <div class="section-title">
      <span class="section-number">1</span>
      <span>Arquitectura y Funcionamiento General</span>
    </div>
    <span class="badge badge-blue">Ecosistema Cloud</span>
  </div>

  <p>
    El sistema web de <strong>Comidas Rápidas Trucco</strong> es una plataforma moderna desarrollada bajo un modelo de arquitectura desacoplada y sin servidor (Serverless Cloud Architecture), diseñada para garantizar máxima velocidad de carga, alta disponibilidad (99.99%) y cero costos fijos mensuales en servidores de base de datos.
  </p>

  <div class="grid-3 avoid-break">
    <div class="card">
      <div style="font-weight:700; color:#0f172a; margin-bottom:4px;">💻 Frontend React 18</div>
      <p style="font-size:8.5pt; color:#64748b; margin:0;">
        Construido con React, Vite y TailwindCSS. Carga ultra rápida, interfaz fluida, diseño responsive adaptado a celulares, tablets y monitores 4K.
      </p>
    </div>
    <div class="card">
      <div style="font-weight:700; color:#0f172a; margin-bottom:4px;">📊 Google Sheets DB</div>
      <p style="font-size:8.5pt; color:#64748b; margin:0;">
        Base de datos 100% editable en la nube. Gestiona productos, categorías, pedidos y usuarios autorizados de forma colaborativa y segura.
      </p>
    </div>
    <div class="card">
      <div style="font-weight:700; color:#0f172a; margin-bottom:4px;">⚡ Webhook Apps Script</div>
      <p style="font-size:8.5pt; color:#64748b; margin:0;">
        API RESTful intermedia en Google Apps Script que procesa solicitudes POST/GET para guardar y actualizar datos al instante.
      </p>
    </div>
  </div>

  <div class="sub-section-title">Flujo Integral de Datos</div>
  <p>
    El siguiente diagrama describe el ciclo de vida de la información entre el cliente, el panel de administración, la base de datos en Google Sheets y el canal de WhatsApp:
  </p>

  <div class="callout callout-info avoid-break">
    <div class="callout-title">🔄 Ciclo de Comunicación del Sistema</div>
    <p style="margin:0; font-size:8.8pt;">
      <strong>1. Cliente:</strong> Ingresa a la web ➔ Selecciona productos y variantes ➔ Llena datos de entrega ➔ Envía pedido.<br>
      <strong>2. Backend Apps Script:</strong> Guarda el pedido automáticamente en la hoja <code>pedidos</code> con fecha, hora, cliente y total.<br>
      <strong>3. WhatsApp:</strong> Se abre la aplicación con el mensaje detallado listo para enviar al número del restaurante (<code>+57 317 1922866</code>).<br>
      <strong>4. Panel Admin:</strong> El panel consulta periódicamente los pedidos, emite una alerta sonora y permite cambiar su estado a "Completado" o eliminarlo.
    </p>
  </div>

  <table class="avoid-break">
    <thead>
      <tr>
        <th>Componente</th>
        <th>Tecnología / Plataforma</th>
        <th>Rol en el Sistema</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Frontend Web</strong></td>
        <td>React 18 + Vite + Tailwind CSS</td>
        <td>Experiencia interactiva del cliente y del administrador.</td>
      </tr>
      <tr>
        <td><strong>Base de Datos</strong></td>
        <td>Google Sheets Cloud Spreadsheet</td>
        <td>Almacenamiento permanente de productos, usuarios, categorías y pedidos.</td>
      </tr>
      <tr>
        <td><strong>API & Webhook</strong></td>
        <td>Google Apps Script (V8 Engine)</td>
        <td>Endpoints <code>doPost</code> y <code>doGet</code> para operaciones CRUD.</td>
      </tr>
      <tr>
        <td><strong>Mensajería</strong></td>
        <td>WhatsApp API (Click to Chat)</td>
        <td>Notificación inmediata y directa a la línea de despacho del local.</td>
      </tr>
      <tr>
        <td><strong>Imágenes</strong></td>
        <td>Cloudinary / URLs HTTPS</td>
        <td>Hospedaje optimizado de fotografías de la carta gastronómica.</td>
      </tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== CAPÍTULO 2 ==================== -->
  <div class="section-header">
    <div class="section-title">
      <span class="section-number">2</span>
      <span>Manual de Usuario (Cliente / Carta Digital)</span>
    </div>
    <span class="badge badge-green">Guía del Cliente</span>
  </div>

  <p>
    La interfaz de usuario está diseñada para ser extremadamente intuitiva, rápida y sin fricción. No requiere que el cliente instale ninguna aplicación ni cree cuentas previas para realizar un pedido.
  </p>

  <div class="sub-section-title">2.1 Acceso a la Carta Digital</div>
  <p>
    El cliente puede acceder desde cualquier dispositivo móvil o computador ingresando directamente al enlace oficial o escaneando los códigos QR disponibles en el establecimiento:
  </p>
  <div class="card avoid-break">
    <p style="margin:0;">
      🔗 <strong>Enlace directo:</strong> <code>https://comidasrapidastrucco.online</code><br>
      📱 <strong>Compatibilidad:</strong> Android, iOS (iPhone/iPad), Windows, macOS y Linux en cualquier navegador moderno (Chrome, Safari, Edge, Firefox).
    </p>
  </div>

  <div class="sub-section-title">2.2 Navegación y Búsqueda de Productos</div>
  <div class="grid-2 avoid-break">
    <div class="step-box">
      <div class="step-badge">1</div>
      <div class="step-title">Filtro por Categorías Dinámicas</div>
      <div class="step-desc">
        En la parte superior de la carta se encuentran las pestañas de categorías (Hamburguesas, Perros, Salchipapas, Picadas, etc.). Al hacer clic, la vista se desplaza o filtra instantáneamente mostrando solo los platos correspondientes.
      </div>
    </div>
    <div class="step-box">
      <div class="step-badge">2</div>
      <div class="step-title">Buscador en Vivo</div>
      <div class="step-desc">
        La barra de búsqueda permite escribir el nombre de un producto o ingrediente (ej. "tocineta", "pollo", "mixta"). Los resultados se actualizan en tiempo real a medida que se escribe.
      </div>
    </div>
  </div>

  <div class="sub-section-title">2.3 Selección de Variantes y Personalización</div>
  <p>
    Al hacer clic en cualquier producto de la carta, se abre la ventana de configuración:
  </p>
  <ul style="margin-left: 20px; margin-bottom: 12px; font-size: 9.2pt;">
    <li><strong>Selección de Tamaño / Tipo:</strong> Si el producto tiene múltiples opciones de precio (ej. Sencillo, Doble, Especial), el cliente selecciona la variante deseada.</li>
    <li><strong>Salsas y Acompañamientos:</strong> Opciones para marcar salsas de preferencia o solicitar exclusión de ingredientes (ej. "Sin cebolla", "Salsa tártara aparte").</li>
    <li><strong>Notas especiales:</strong> Campo de texto abierto para indicaciones específicas a la cocina.</li>
    <li><strong>Botón Agregar al Carrito:</strong> Actualiza el subtotal y suma el ítem al carrito de compras.</li>
  </ul>

  <div class="sub-section-title">2.4 Carrito de Compras y Checkout</div>
  <div class="grid-3 avoid-break">
    <div class="step-box">
      <div class="step-badge">🛒</div>
      <div class="step-title">Revisión de Ítems</div>
      <div class="step-desc">
        El cliente puede aumentar o disminuir cantidades (+ / -) o eliminar productos con un solo toque.
      </div>
    </div>
    <div class="step-box">
      <div class="step-badge">📝</div>
      <div class="step-title">Datos del Pedido</div>
      <div class="step-desc">
        Ingreso de Nombre, Teléfono, y selección de modalidad: <strong>Domicilio</strong> (con dirección exacta) o <strong>Recoger en Local</strong>.
      </div>
    </div>
    <div class="step-box">
      <div class="step-badge">🚀</div>
      <div class="step-title">Envío a WhatsApp</div>
      <div class="step-desc">
        Al hacer clic en "Pedir por WhatsApp", el pedido se guarda en la base de datos y se abre WhatsApp con el mensaje formateado.
      </div>
    </div>
  </div>

  <div class="callout callout-success avoid-break">
    <div class="callout-title">📱 Ejemplo de Mensaje Generado Automáticamente para WhatsApp</div>
    <pre style="margin: 4px 0 0 0; background:#064e3b; color:#a7f3d0;">
*🍔 ¡NUEVO PEDIDO - COMIDAS RÁPIDAS TRUCCO! 🍔*
----------------------------------------
*Cliente:* Juan Pérez
*Teléfono:* 3101234567
*Tipo de Entrega:* Domicilio 🛵
*Dirección:* Carrera 15 # 24-10 Barrio El Centro
*Notas:* Timbrar al apto 201

*DETALLE DEL PEDIDO:*
- 2x Hamburguesa Trucco Especial (Doble Carne) - $56.000
- 1x Salchipapa Mega Suprema - $28.000
- 2x Gaseosa Postobón 400ml - $10.000

----------------------------------------
*TOTAL A PAGAR:* $94.000 COP
----------------------------------------
¡Muchas gracias por su preferencia! Quedamos atentos a su confirmación.</pre>
  </div>

  <div class="page-break"></div>

  <!-- ==================== CAPÍTULO 3 ==================== -->
  <div class="section-header">
    <div class="section-title">
      <span class="section-number">3</span>
      <span>Manual de Administrador (Panel /admin)</span>
    </div>
    <span class="badge badge-purple">Control Total</span>
  </div>

  <p>
    El Panel de Administración es el centro neurálgico del negocio. Permite al propietario y a los administradores gestionar pedidos en tiempo real, actualizar precios, añadir productos, gestionar categorías y administrar usuarios y claves.
  </p>

  <div class="sub-section-title">3.1 Acceso y Autenticación</div>
  <div class="card avoid-break">
    <p>
      📍 <strong>Ruta de Acceso:</strong> <code>https://comidasrapidastrucco.online/admin</code>
    </p>
    <div class="grid-2">
      <div>
        <strong>Campos requeridos:</strong>
        <ul style="margin-left: 18px; margin-top: 4px; font-size: 8.8pt;">
          <li><strong>Usuario:</strong> Nombre de usuario registrado en la hoja <code>usuarios</code> (ej. <code>admin</code> u <code>olga</code>).</li>
          <li><strong>Contraseña:</strong> Clave asignada a dicho usuario.</li>
        </ul>
      </div>
      <div>
        <strong>Seguridad:</strong>
        <p style="font-size: 8.8pt; color: #64748b; margin-top: 4px;">
          La sesión se mantiene activa de forma persistente y segura en el navegador local. Al finalizar el turno de trabajo, se debe hacer clic en <strong>"Cerrar Sesión"</strong>.
        </p>
      </div>
    </div>
  </div>

  <div class="sub-section-title">3.2 Modo Oscuro y Modo Claro (Theme Switcher)</div>
  <p>
    El panel cuenta con un interruptor visual ubicado en la barra superior:
  </p>
  <ul style="margin-left: 20px; margin-bottom: 12px; font-size: 9.2pt;">
    <li><strong>Modo Claro (Por Defecto ☀️):</strong> Máximo contraste y nitidez para ambientes de oficina o turnos diurnos.</li>
    <li><strong>Modo Oscuro (🌙):</strong> Diseñado con tonos oscuros para evitar fatiga visual durante turnos nocturnos de cocina.</li>
    <li><strong>Persistencia:</strong> La preferencia se guarda automáticamente en el navegador y se recuerda en futuros inicios de sesión.</li>
  </ul>

  <div class="sub-section-title">3.3 Módulo de Pedidos en Vivo (Monitoreo de Cocina)</div>
  <div class="grid-2 avoid-break">
    <div class="step-box">
      <div class="step-badge">🔔</div>
      <div class="step-title">Alertas Sonoras y Visuales</div>
      <div class="step-desc">
        El panel emite una alerta acústica automática cada vez que ingresa un nuevo pedido desde la web, alertando al personal de cocina inmediatamente.
      </div>
    </div>
    <div class="step-box">
      <div class="step-badge">✅</div>
      <div class="step-title">Control de Estados</div>
      <div class="step-desc">
        Cada pedido puede alternarse entre <strong>"Pendiente"</strong> (naranja) y <strong>"Completado"</strong> (verde) con un solo clic. El cambio se sincroniza en Google Sheets.
      </div>
    </div>
  </div>

  <div class="callout callout-warning avoid-break">
    <div class="callout-title">🗑️ Eliminación Segura de Pedidos con Confirmación</div>
    <p style="margin:0; font-size:8.8pt;">
      Para evitar el borrado accidental de comandas activas, al presionar el icono de basura se despliega una ventana modal de seguridad que muestra el número de pedido, el nombre del cliente y el total, solicitando confirmación explícita antes de eliminar el registro en Google Sheets.
    </p>
  </div>

  <div class="sub-section-title">3.4 Módulo de Productos (CRUD Completo)</div>
  <table class="avoid-break">
    <thead>
      <tr>
        <th>Operación</th>
        <th>Descripción y Comportamiento</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Crear Producto</strong></td>
        <td>Añade un nuevo ítem a la carta especificando nombre, categoría dinámica, descripción detallada, imagen (vía URL o subida Cloudinary) y hasta 3 opciones de tamaño/precio.</td>
      </tr>
      <tr>
        <td><strong>Editar Producto</strong></td>
        <td>Permite modificar precios, descripciones o fotos en tiempo real. Los cambios se reflejan inmediatamente en la carta de los clientes.</td>
      </tr>
      <tr>
        <td><strong>Eliminar Producto</strong></td>
        <td>Retira de forma permanente o temporal el producto de la carta con confirmación previa.</td>
      </tr>
    </tbody>
  </table>

  <div class="sub-section-title">3.5 Módulo de Categorías (CRUD Inteligente)</div>
  <p>
    El sistema cuenta con un gestor dinámico de categorías que mantiene la integridad de la carta:
  </p>
  <div class="grid-3 avoid-break">
    <div class="card">
      <div style="font-weight:700; color:#0f172a; margin-bottom:4px;">➕ Crear Categoría</div>
      <p style="font-size:8.5pt; color:#64748b; margin:0;">
        Añade la categoría a la pestaña <code>categorias</code> de Google Sheets y la hace disponible de inmediato en todos los selectores de productos y filtros.
      </p>
    </div>
    <div class="card">
      <div style="font-weight:700; color:#0f172a; margin-bottom:4px;">✏️ Renombrar con Reclasificación</div>
      <p style="font-size:8.5pt; color:#64748b; margin:0;">
        Al renombrar una categoría, el sistema actualiza automáticamente todos los productos asociados en la base de datos para no perder su asignación.
      </p>
    </div>
    <div class="card">
      <div style="font-weight:700; color:#0f172a; margin-bottom:4px;">🗑️ Eliminación Segura</div>
      <p style="font-size:8.5pt; color:#64748b; margin:0;">
        Alerta cuántos productos pertenecen a la categoría y permite reasignarlos antes de proceder con el borrado.
      </p>
    </div>
  </div>

  <div class="sub-section-title">3.6 Módulo de Usuarios y Seguridad (Gestión de Claves)</div>
  <p>
    Diseñado para que el administrador gestione fácilmente los accesos sin requerir conocimientos técnicos:
  </p>

  <div class="callout callout-info avoid-break">
    <div class="callout-title">📋 Funciones Clave de la Sección de Usuarios</div>
    <ul style="margin-left: 18px; margin-top: 4px; font-size: 8.8pt;">
      <li><strong>Botón "Copiar credenciales":</strong> En cada tarjeta de usuario, al pulsar este botón se copia automáticamente al portapapeles tanto el usuario como la clave en formato listo para pegar (ej. <code>Usuario: admin \n Contraseña: 123456</code>).</li>
      <li><strong>Mostrar / Ocultar Contraseña (👁️):</strong> Permite revelar la contraseña en texto legible o enmascararla con puntos para mayor privacidad frente a otras personas.</li>
      <li><strong>Cambiar Contraseña:</strong> Ventana modal para asignar una nueva clave a cualquier usuario, sincronizándose al instante en la hoja <code>usuarios</code> de Google Sheets.</li>
      <li><strong>Crear Nuevo Administrador:</strong> Permite registrar nuevos empleados con credenciales individuales.</li>
      <li><strong>Protección Antiborrado:</strong> El sistema bloquea la eliminación si solo queda un usuario, evitando que el restaurante quede bloqueado fuera del sistema.</li>
    </ul>
  </div>

  <div class="page-break"></div>

  <!-- ==================== CAPÍTULO 4 ==================== -->
  <div class="section-header">
    <div class="section-title">
      <span class="section-number">4</span>
      <span>Estructura de la Base de Datos (Google Sheets)</span>
    </div>
    <span class="badge badge-amber">Modelo de Datos</span>
  </div>

  <p>
    El libro de cálculo de Google Sheets está identificado con el ID: <code>15Ba4vVjMyNbmPhk_obKKbkUGa0oJr9r-ANuI_G-TzHk</code>. Cuenta con 4 pestañas especializadas:
  </p>

  <div class="sub-section-title">4.1 Pestaña <code>productos_trucco</code></div>
  <table class="avoid-break">
    <thead>
      <tr>
        <th>Columna</th>
        <th>Encabezado</th>
        <th>Tipo</th>
        <th>Descripción y Ejemplo</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>A</td><td><strong>id</strong></td><td>Texto / Numérico</td><td>Identificador único del producto (ej. <code>hamb-trucco-especial</code>).</td></tr>
      <tr><td>B</td><td><strong>name</strong></td><td>Texto</td><td>Nombre comercial del plato (ej. <code>Hamburguesa Trucco Especial</code>).</td></tr>
      <tr><td>C</td><td><strong>description</strong></td><td>Texto</td><td>Ingredientes y descripción (ej. <code>Doble carne 150g, tocineta ahumada, queso...</code>).</td></tr>
      <tr><td>D</td><td><strong>category</strong></td><td>Texto</td><td>Nombre de la categoría asignada (ej. <code>Hamburguesas</code>).</td></tr>
      <tr><td>E</td><td><strong>image</strong></td><td>URL HTTPS</td><td>Enlace directo a la fotografía del plato en Cloudinary o web.</td></tr>
      <tr><td>F / G</td><td><strong>price1_label / price1</strong></td><td>Texto / Número</td><td>Etiqueta y valor de la variante 1 (ej. <code>Sencilla</code> / <code>28000</code>).</td></tr>
      <tr><td>H / I</td><td><strong>price2_label / price2</strong></td><td>Texto / Número</td><td>Etiqueta y valor de la variante 2 (ej. <code>Doble</code> / <code>35000</code>).</td></tr>
      <tr><td>J / K</td><td><strong>price3_label / price3</strong></td><td>Texto / Número</td><td>Etiqueta y valor de la variante 3 (ej. <code>Especial</code> / <code>42000</code>).</td></tr>
    </tbody>
  </table>

  <div class="sub-section-title">4.2 Pestaña <code>categorias</code></div>
  <table class="avoid-break">
    <thead>
      <tr>
        <th>Columna</th>
        <th>Encabezado</th>
        <th>Ejemplo de Contenido</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>A</td><td><strong>id</strong></td><td><code>1</code>, <code>2</code>, <code>3</code></td></tr>
      <tr><td>B</td><td><strong>nombre</strong></td><td><code>Hamburguesas</code>, <code>Perros Calientes</code>, <code>Salchipapas</code>, <code>Picadas</code>, <code>Bebidas</code></td></tr>
    </tbody>
  </table>

  <div class="sub-section-title">4.3 Pestaña <code>usuarios</code></div>
  <table class="avoid-break">
    <thead>
      <tr>
        <th>Columna</th>
        <th>Encabezado</th>
        <th>Descripción</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>A</td><td><strong>id</strong></td><td>Número identificador (1, 2, 3...)</td></tr>
      <tr><td>B</td><td><strong>usuario</strong></td><td>Nombre de usuario para login (ej. <code>admin</code>, <code>olga</code>).</td></tr>
      <tr><td>C</td><td><strong>password</strong></td><td>Contraseña de acceso para el panel.</td></tr>
      <tr><td>D</td><td><strong>nombre</strong></td><td>Nombre real del colaborador (ej. <code>Administrador Principal</code>).</td></tr>
      <tr><td>E</td><td><strong>rol</strong></td><td>Nivel de privilegios (ej. <code>admin</code>).</td></tr>
    </tbody>
  </table>

  <div class="sub-section-title">4.4 Pestaña <code>pedidos</code></div>
  <table class="avoid-break">
    <thead>
      <tr>
        <th>Columna</th>
        <th>Encabezado</th>
        <th>Descripción</th>
      </tr>
    </thead>
    <tbody>
      <tr><td>A</td><td><strong>ID</strong></td><td>Identificador único del pedido (timestamp numérico).</td></tr>
      <tr><td>B / C</td><td><strong>Fecha / Hora</strong></td><td>Fecha y hora exacta en que el cliente realizó el pedido.</td></tr>
      <tr><td>D / E</td><td><strong>Cliente / Teléfono</strong></td><td>Nombre del cliente y teléfono celular registrado.</td></tr>
      <tr><td>F</td><td><strong>Tipo</strong></td><td>Modalidad: <code>Domicilio</code> o <code>Recoger</code>.</td></tr>
      <tr><td>G / H</td><td><strong>Dirección / Notas</strong></td><td>Dirección de entrega y observaciones para cocina.</td></tr>
      <tr><td>I / J</td><td><strong>Productos / Total</strong></td><td>Resumen de platos ordenados y total liquidado en pesos colombianos ($).</td></tr>
      <tr><td>K</td><td><strong>Estado</strong></td><td>Estado actual: <code>Pendiente</code> o <code>Completado</code>.</td></tr>
    </tbody>
  </table>

  <div class="page-break"></div>

  <!-- ==================== CAPÍTULO 5 ==================== -->
  <div class="section-header">
    <div class="section-title">
      <span class="section-number">5</span>
      <span>Código Backend Google Apps Script v3.0</span>
    </div>
    <span class="badge badge-purple">Guía Técnica</span>
  </div>

  <p>
    El siguiente código fuente corresponde a la versión 3.0 completa que se debe mantener desplegada en <strong>Extensiones ➔ Apps Script</strong> dentro de la hoja de cálculo de Google Sheets:
  </p>

  <div class="callout callout-info avoid-break">
    <div class="callout-title">⚙️ Instrucciones de Despliegue en Apps Script</div>
    <ol style="margin-left: 18px; margin-top: 4px; font-size: 8.8pt;">
      <li>Abrir Google Sheets ➔ Menú superior: <strong>Extensiones ➔ Apps Script</strong>.</li>
      <li>Pegar el código de abajo reemplazando cualquier contenido previo. Guardar con <code>Ctrl + S</code>.</li>
      <li>Clic en <strong>Desplegar ➔ Administrar implementaciones</strong> ➔ Clic en el lápiz ✏️.</li>
      <li>En <strong>Versión</strong> seleccionar <strong>"Nueva versión"</strong> y dar clic en <strong>Desplegar</strong>.</li>
      <li>Asegurar que el acceso esté configurado en: <em>"Cualquier persona" (Anyone)</em>.</li>
    </ol>
  </div>

  <pre class="avoid-break">
// ═══════════════════════════════════════════════════════════════
// GOOGLE APPS SCRIPT - COMIDAS RÁPIDAS TRUCCO (SISTEMA COMPLETO v3.0)
// Maneja: Productos, Categorías, Usuarios, Pedidos y Estados
// ═══════════════════════════════════════════════════════════════

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var action = data.action;
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // 1. GUARDAR PRODUCTOS
    if (action === 'saveProducts' || (data.products && !action)) {
      var products = data.products;
      if (products && Array.isArray(products) && products.length > 0) {
        var sheet = ss.getSheetByName('productos_trucco');
        if (!sheet) {
          sheet = ss.insertSheet('productos_trucco');
          sheet.getRange(1, 1, 1, 11).setValues([[
            'id', 'name', 'description', 'category', 'image',
            'price1_label', 'price1', 'price2_label', 'price2', 'price3_label', 'price3'
          ]]);
        }
        var lastRow = sheet.getLastRow();
        if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).clearContent();
        var rows = products.map(function(p) {
          var v = p.variants || [];
          return [
            p.id, p.name || '', p.description || '', p.category || '', p.image || '',
            v[0] ? v[0].label : '', v[0] ? v[0].price : '',
            v[1] ? v[1].label : '', v[1] ? v[1].price : '',
            v[2] ? v[2].label : '', v[2] ? v[2].price : ''
          ];
        });
        sheet.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, count: products ? products.length : 0 }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 2. GUARDAR CATEGORÍAS
    if (action === 'saveCategories') {
      var categories = data.categories;
      var sheet = ss.getSheetByName('categorias');
      if (!sheet) {
        sheet = ss.insertSheet('categorias');
        sheet.getRange(1, 1, 1, 2).setValues([['id', 'nombre']]);
      }
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 2).clearContent();
      if (categories && Array.isArray(categories) && categories.length > 0) {
        var rows = categories.map(function(cat, i) { return [i + 1, cat]; });
        sheet.getRange(2, 1, rows.length, 2).setValues(rows);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, count: categories ? categories.length : 0 }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 3. GUARDAR USUARIOS Y CLAVES
    if (action === 'saveUsers') {
      var users = data.users;
      var sheet = ss.getSheetByName('usuarios');
      if (!sheet) {
        sheet = ss.insertSheet('usuarios');
        sheet.getRange(1, 1, 1, 5).setValues([['id', 'usuario', 'password', 'nombre', 'rol']]);
      }
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
      if (users && Array.isArray(users) && users.length > 0) {
        var rows = users.map(function(u, i) {
          return [i + 1, u.usuario || '', u.password || '', u.nombre || '', u.rol || 'admin'];
        });
        sheet.getRange(2, 1, rows.length, 5).setValues(rows);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, count: users ? users.length : 0 }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 4. GUARDAR NUEVO PEDIDO
    if (action === 'saveOrder') {
      var order = data.order;
      if (order) {
        var sheet = ss.getSheetByName('pedidos');
        if (!sheet) {
          sheet = ss.insertSheet('pedidos');
          sheet.getRange(1, 1, 1, 11).setValues([[
            'ID', 'Fecha', 'Hora', 'Cliente', 'Teléfono', 'Tipo', 'Dirección', 'Notas', 'Productos', 'Total', 'Estado'
          ]]);
          sheet.getRange(1, 1, 1, 11).setFontWeight('bold').setBackground('#FACC15').setFontColor('#000000');
        }
        var tipoFormateado = (order.orderType === 'domicilio') ? 'Domicilio' : 'Recoger';
        var resumenProd = order.itemsSummary || (Array.isArray(order.items) ? order.items.map(function(i){ return i.quantity + 'x ' + i.name; }).join(', ') : '');
        sheet.appendRow([
          String(order.id), order.date || '', order.time || '', order.name || '',
          "'" + String(order.phone || ''), tipoFormateado, order.address || '-', order.notes || '-',
          resumenProd, Number(order.total) || 0, order.status === 'completed' ? 'Completado' : 'Pendiente'
        ]);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, orderId: order ? order.id : null }))
        .setMimeType(ContentService.MimeType.JSON);
    }

    // 5. ACTUALIZAR ESTADO DE PEDIDO
    if (action === 'updateOrderStatus') {
      var orderId = String(data.orderId);
      var newStatus = data.status === 'completed' ? 'Completado' : 'Pendiente';
      var sheet = ss.getSheetByName('pedidos');
      if (sheet) {
        var values = sheet.getDataRange().getValues();
        for (var i = 1; i < values.length; i++) {
          if (String(values[i][0]) === orderId) {
            sheet.getRange(i + 1, 11).setValue(newStatus);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // 6. ELIMINAR PEDIDO
    if (action === 'deleteOrder') {
      var orderId = String(data.orderId);
      var sheet = ss.getSheetByName('pedidos');
      if (sheet) {
        var values = sheet.getDataRange().getValues();
        for (var i = 1; i < values.length; i++) {
          if (String(values[i][0]) === orderId) {
            sheet.deleteRow(i + 1);
            break;
          }
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    return ContentService.createTextOutput(JSON.stringify({ success: false, message: 'Acción no válida' }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

// LECTURA DE PEDIDOS (GET)
function doGet(e) {
  try {
    var action = (e && e.parameter) ? e.parameter.action : '';
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    if (action === 'getOrders') {
      var sheet = ss.getSheetByName('pedidos');
      if (!sheet) return ContentService.createTextOutput(JSON.stringify({ orders: [] })).setMimeType(ContentService.MimeType.JSON);
      var data = sheet.getDataRange().getValues();
      if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify({ orders: [] })).setMimeType(ContentService.MimeType.JSON);
      var rows = data.slice(1);
      var orders = rows.map(function(r) {
        return {
          id: String(r[0]), date: String(r[1] || ''), time: String(r[2] || ''),
          name: String(r[3] || ''), phone: String(r[4] || '').replace(/^'/, ''),
          orderType: (String(r[5]).toLowerCase() === 'domicilio') ? 'domicilio' : 'recoger',
          address: String(r[6] === '-' ? '' : r[6]), notes: String(r[7] === '-' ? '' : r[7]),
          itemsSummary: String(r[8] || ''), total: Number(r[9]) || 0,
          status: (String(r[10]).toLowerCase() === 'completado') ? 'completed' : 'pending'
        };
      });
      orders.reverse();
      return ContentService.createTextOutput(JSON.stringify({ orders: orders })).setMimeType(ContentService.MimeType.JSON);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok', message: 'Trucco API activa v3.0' })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}
  </pre>

  <div class="page-break"></div>

  <!-- ==================== CAPÍTULO 6 ==================== -->
  <div class="section-header">
    <div class="section-title">
      <span class="section-number">6</span>
      <span>Preguntas Frecuentes, Seguridad y Mantenimiento</span>
    </div>
    <span class="badge badge-green">Soporte & FAQ</span>
  </div>

  <div class="sub-section-title">6.1 Preguntas Frecuentes (FAQ)</div>
  <div class="card avoid-break">
    <strong>¿Cómo cambio el número de WhatsApp receptor de pedidos?</strong>
    <p style="font-size:8.8pt; color:#64748b; margin-top:4px;">
      El número oficial configurado en todo el sistema es <code>573171922866</code> (+57 317 1922866). Se encuentra parametrizado en <code>src/App.jsx</code> y <code>src/components/CartSidebar.jsx</code>. Cualquier cambio futuro se aplica en dichos componentes y se sube con <code>git push</code>.
    </p>
  </div>

  <div class="card avoid-break">
    <strong>¿Qué sucede si un cliente hace un pedido y se cae su internet antes de abrir WhatsApp?</strong>
    <p style="font-size:8.8pt; color:#64748b; margin-top:4px;">
      ¡No se pierde la información! El sistema realiza primero la llamada al Webhook de Google Apps Script y registra el pedido en la pestaña <code>pedidos</code>. El administrador puede ver el pedido en el panel y llamar al cliente directamente al número telefónico registrado.
    </p>
  </div>

  <div class="card avoid-break">
    <strong>¿Cómo respaldar la información de ventas y productos?</strong>
    <p style="font-size:8.8pt; color:#64748b; margin-top:4px;">
      Basta con ingresar a Google Drive, abrir la hoja de cálculo y seleccionar: <strong>Archivo ➔ Descargar ➔ Microsoft Excel (.xlsx)</strong>. Esto generará una copia de seguridad local instantánea de todos los productos, usuarios, categorías y pedidos históricos.
    </p>
  </div>

  <div class="sub-section-title">6.2 Mejores Prácticas de Seguridad Operativa</div>
  <div class="grid-2 avoid-break">
    <div class="callout callout-info" style="margin:0;">
      <div class="callout-title">🔐 Gestión de Claves</div>
      <p style="margin:0; font-size:8.5pt;">
        Utilice contraseñas que combinen letras, números y símbolos. Utilice el botón <strong>"Copiar credenciales"</strong> del panel para transferir accesos a personal autorizado de manera segura.
      </p>
    </div>
    <div class="callout callout-success" style="margin:0;">
      <div class="callout-title">🛡️ Acceso de Google Sheet</div>
      <p style="margin:0; font-size:8.5pt;">
        Mantenga la hoja de Google Sheets compartida únicamente con las cuentas de Google de los propietarios del negocio para evitar modificaciones no deseadas fuera del panel web.
      </p>
    </div>
  </div>

  <div class="footer-note">
    Documentación Técnica Oficial • Comidas Rápidas Trucco • Generado automáticamente para el equipo de trabajo • Todos los derechos reservados © 2026
  </div>

</body>
</html>
`;

// 1. Ensure directories exist
if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
if (!fs.existsSync(mirrorDocsDir)) fs.mkdirSync(mirrorDocsDir, { recursive: true });

// 2. Write HTML
fs.writeFileSync(htmlFile, htmlContent, 'utf8');
console.log('✅ Archivo HTML generado exitosamente en:', htmlFile);

// Also copy HTML to mirror
fs.copyFileSync(htmlFile, path.join(mirrorDocsDir, 'MANUAL_DE_USUARIO_Y_ADMINISTRADOR_TRUCCO.html'));
console.log('✅ Archivo HTML sincronizado en mirror.');

// 3. Convert HTML to PDF using Chrome Headless
const chromePaths = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe'
];

let browserPath = chromePaths.find(p => fs.existsSync(p));
if (!browserPath) {
  console.error('❌ No se encontró Google Chrome ni Microsoft Edge en las rutas estándar.');
  process.exit(1);
}

console.log(`🚀 Generando PDF con: ${browserPath}...`);

try {
  const printCmd = `"${browserPath}" --headless --disable-gpu --no-pdf-header-footer --print-to-pdf="${pdfFileRoot}" "${htmlFile}"`;
  execSync(printCmd, { stdio: 'inherit' });
  console.log('✅ PDF generado en raíz:', pdfFileRoot);

  // Copy to docs and mirror
  fs.copyFileSync(pdfFileRoot, pdfFileDocs);
  console.log('✅ PDF guardado en docs:', pdfFileDocs);

  if (fs.existsSync(mirrorDir)) {
    fs.copyFileSync(pdfFileRoot, mirrorPdfRoot);
    fs.copyFileSync(pdfFileRoot, mirrorPdfDocs);
    console.log('✅ PDF sincronizado en espejo:', mirrorPdfRoot);
  }

  const stats = fs.statSync(pdfFileRoot);
  console.log(`🎉 ¡PDF creado con éxito! Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
} catch (err) {
  console.error('❌ Error al exportar PDF:', err.message);
  process.exit(1);
}
