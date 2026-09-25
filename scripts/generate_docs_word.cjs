const fs = require('fs');
const path = require('path');
const {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  HeadingLevel,
  AlignmentType,
  WidthType,
  ShadingType,
  BorderStyle,
  Header,
  Footer,
  PageBreak,
  ImageRun,
  PageNumber,
  NumberFormat
} = require('docx');

const rootDir = path.resolve(__dirname, '..');
const docsDir = path.join(rootDir, 'docs');
const wordFileRoot = path.join(rootDir, 'MANUAL_DE_USUARIO_Y_ADMINISTRADOR_TRUCCO.docx');
const wordFileDocs = path.join(docsDir, 'MANUAL_DE_USUARIO_Y_ADMINISTRADOR_TRUCCO.docx');

const mirrorDir = 'C:\\Users\\DESINTEGRACION\\Downloads\\comidas-rapidas-trucco';
const mirrorDocsDir = path.join(mirrorDir, 'docs');
const mirrorWordRoot = path.join(mirrorDir, 'MANUAL_DE_USUARIO_Y_ADMINISTRADOR_TRUCCO.docx');
const mirrorWordDocs = path.join(mirrorDocsDir, 'MANUAL_DE_USUARIO_Y_ADMINISTRADOR_TRUCCO.docx');

// Check logo
let logoBuffer = null;
const logoPath = path.join(rootDir, 'public', 'logo.png');
if (fs.existsSync(logoPath)) {
  logoBuffer = fs.readFileSync(logoPath);
}

// Colors
const COLOR_PRIMARY = "0F172A"; // Dark Slate
const COLOR_SECONDARY = "D97706"; // Amber / Gold
const COLOR_DARK = "1E293B";
const COLOR_MUTED = "64748B";
const COLOR_LIGHT_BG = "F8FAFC";
const COLOR_CALLOUT_BG = "EFF6FF";
const COLOR_BORDER = "CBD5E1";
const FONT_PRIMARY = "Segoe UI";
const FONT_CODE = "Consolas";

// Helper functions for Word building
function createHeading1(title, chapterNum) {
  return new Paragraph({
    text: chapterNum ? `${chapterNum}. ${title}` : title,
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 180 },
    run: {
      font: FONT_PRIMARY,
      size: 32, // 16pt
      bold: true,
      color: COLOR_PRIMARY
    }
  });
}

function createHeading2(title) {
  return new Paragraph({
    text: title,
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120 },
    run: {
      font: FONT_PRIMARY,
      size: 26, // 13pt
      bold: true,
      color: COLOR_SECONDARY
    }
  });
}

function createHeading3(title) {
  return new Paragraph({
    text: title,
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 80 },
    run: {
      font: FONT_PRIMARY,
      size: 22, // 11pt
      bold: true,
      color: COLOR_DARK
    }
  });
}

function createParagraph(text, options = {}) {
  return new Paragraph({
    spacing: { before: options.before || 60, after: options.after || 100 },
    alignment: options.alignment || AlignmentType.LEFT,
    children: [
      new TextRun({
        text: text,
        font: FONT_PRIMARY,
        size: options.size || 20, // 10pt
        color: options.color || COLOR_DARK,
        bold: options.bold || false,
        italics: options.italics || false
      })
    ]
  });
}

function createRichParagraph(runs, options = {}) {
  return new Paragraph({
    spacing: { before: options.before || 60, after: options.after || 100 },
    alignment: options.alignment || AlignmentType.LEFT,
    children: runs.map(r => new TextRun({
      text: r.text,
      font: r.font || FONT_PRIMARY,
      size: r.size || 20,
      color: r.color || COLOR_DARK,
      bold: r.bold || false,
      italics: r.italics || false
    }))
  });
}

function createBulletItem(boldPrefix, text) {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { before: 40, after: 60 },
    children: [
      new TextRun({
        text: boldPrefix ? `${boldPrefix}: ` : "",
        font: FONT_PRIMARY,
        size: 20,
        bold: true,
        color: COLOR_PRIMARY
      }),
      new TextRun({
        text: text,
        font: FONT_PRIMARY,
        size: 20,
        color: COLOR_DARK
      })
    ]
  });
}

function createCalloutBox(title, text, bgColor = COLOR_CALLOUT_BG, borderColor = "3B82F6") {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.NONE },
      right: { style: BorderStyle.NONE },
      bottom: { style: BorderStyle.NONE },
      left: { style: BorderStyle.SINGLE, size: 24, color: borderColor }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: bgColor },
            margins: { top: 140, bottom: 140, left: 200, right: 200 },
            children: [
              new Paragraph({
                spacing: { after: 40 },
                children: [
                  new TextRun({
                    text: `📌 ${title}`,
                    font: FONT_PRIMARY,
                    size: 21,
                    bold: true,
                    color: COLOR_PRIMARY
                  })
                ]
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: text,
                    font: FONT_PRIMARY,
                    size: 19,
                    color: COLOR_DARK
                  })
                ]
              })
            ]
          })
        ]
      })
    ]
  });
}

function createCodeBlock(codeText) {
  const lines = codeText.split('\\n');
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: {
      top: { style: BorderStyle.SINGLE, size: 6, color: "334155" },
      right: { style: BorderStyle.SINGLE, size: 6, color: "334155" },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "334155" },
      left: { style: BorderStyle.SINGLE, size: 6, color: "334155" }
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            shading: { type: ShadingType.CLEAR, fill: "0F172A" },
            margins: { top: 120, bottom: 120, left: 160, right: 160 },
            children: lines.map(l => new Paragraph({
              spacing: { before: 10, after: 10 },
              children: [
                new TextRun({
                  text: l,
                  font: FONT_CODE,
                  size: 16, // 8pt
                  color: "E2E8F0"
                })
              ]
            }))
          })
        ]
      })
    ]
  });
}

function createStyledTable(headers, rowsData) {
  const tableRows = [];

  // Header Row
  tableRows.push(
    new TableRow({
      tableHeader: true,
      children: headers.map(h => new TableCell({
        shading: { type: ShadingType.CLEAR, fill: COLOR_PRIMARY },
        margins: { top: 100, bottom: 100, left: 120, right: 120 },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 6, color: "334155" },
          bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR_SECONDARY },
          left: { style: BorderStyle.SINGLE, size: 6, color: "334155" },
          right: { style: BorderStyle.SINGLE, size: 6, color: "334155" }
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.LEFT,
            children: [
              new TextRun({
                text: h,
                font: FONT_PRIMARY,
                size: 18,
                bold: true,
                color: "FFFFFF"
              })
            ]
          })
        ]
      }))
    })
  );

  // Data Rows
  rowsData.forEach((row, rowIndex) => {
    const bgFill = rowIndex % 2 === 0 ? "FFFFFF" : COLOR_LIGHT_BG;
    tableRows.push(
      new TableRow({
        children: row.map((cellText, cellIndex) => new TableCell({
          shading: { type: ShadingType.CLEAR, fill: bgFill },
          margins: { top: 80, bottom: 80, left: 120, right: 120 },
          borders: {
            top: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            bottom: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            left: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER },
            right: { style: BorderStyle.SINGLE, size: 4, color: COLOR_BORDER }
          },
          children: [
            new Paragraph({
              alignment: AlignmentType.LEFT,
              children: [
                new TextRun({
                  text: cellText,
                  font: cellIndex === 0 ? FONT_PRIMARY : FONT_PRIMARY,
                  size: 18,
                  bold: cellIndex === 0,
                  color: COLOR_DARK
                })
              ]
            })
          ]
        }))
      })
    );
  });

  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: tableRows
  });
}

// -------------------------------------------------------------
// BUILD DOCUMENT CONTENT
// -------------------------------------------------------------

const doc = new Document({
  styles: {
    default: {
      document: {
        run: {
          font: FONT_PRIMARY,
          size: 20,
          color: COLOR_DARK
        }
      }
    }
  },
  sections: [
    {
      properties: {
        page: {
          margin: { top: 1440, bottom: 1440, left: 1440, right: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: "Comidas Rápidas Trucco • Manual del Sistema v3.0",
                  font: FONT_PRIMARY,
                  size: 16,
                  color: COLOR_MUTED,
                  italics: true
                })
              ]
            })
          ]
        })
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              alignment: AlignmentType.RIGHT,
              children: [
                new TextRun({
                  text: "Página ",
                  font: FONT_PRIMARY,
                  size: 16,
                  color: COLOR_MUTED
                }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: FONT_PRIMARY,
                  size: 16,
                  color: COLOR_MUTED,
                  bold: true
                }),
                new TextRun({
                  text: " de ",
                  font: FONT_PRIMARY,
                  size: 16,
                  color: COLOR_MUTED
                }),
                new TextRun({
                  children: [PageNumber.TOTAL_PAGES],
                  font: FONT_PRIMARY,
                  size: 16,
                  color: COLOR_MUTED
                })
              ]
            })
          ]
        })
      },
      children: [
        // COVER / PORTADA
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 400, after: 200 },
          children: [
            new TextRun({
              text: "🍔 COMIDAS RÁPIDAS TRUCCO",
              font: FONT_PRIMARY,
              size: 40, // 20pt
              bold: true,
              color: COLOR_SECONDARY
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 400 },
          children: [
            new TextRun({
              text: "SISTEMA WEB INTEGRAL, CARTA DIGITAL & GESTIÓN ADMINISTRATIVA",
              font: FONT_PRIMARY,
              size: 22,
              bold: true,
              color: COLOR_PRIMARY
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 300 },
          children: [
            new TextRun({
              text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
              color: COLOR_SECONDARY
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 100, after: 200 },
          children: [
            new TextRun({
              text: "MANUAL DE USUARIO, PANEL DE ADMINISTRADOR & GUÍA TÉCNICA",
              font: FONT_PRIMARY,
              size: 30, // 15pt
              bold: true,
              color: COLOR_PRIMARY
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 0, after: 500 },
          children: [
            new TextRun({
              text: "Documentación oficial detallada con flujo de pedidos por WhatsApp, gestión de carta y categorías, control de usuarios con copiado de credenciales, y arquitectura Google Sheets en tiempo real.",
              font: FONT_PRIMARY,
              size: 20,
              color: COLOR_MUTED,
              italics: true
            })
          ]
        }),

        createStyledTable(
          ["Parámetro del Sistema", "Detalle / Valor de Producción"],
          [
            ["Dominio Web Público", "https://comidasrapidastrucco.online"],
            ["Panel de Administración", "https://comidasrapidastrucco.online/admin"],
            ["Canal Oficial de WhatsApp", "+57 317 1922866 (573171922866)"],
            ["Base de Datos en Tiempo Real", "Google Sheets Cloud Database (Spreadsheet ID: 15Ba4vVjMyNbmPhk_obKKbkUGa0oJr9r-ANuI_G-TzHk)"],
            ["Motor Backend Serverless", "Google Apps Script Webhook API v3.0"],
            ["Versión del Software", "v3.0.0 (Edición Producción 2026)"]
          ]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ÍNDICE
        createHeading1("ÍNDICE GENERAL DEL SISTEMA", null),
        createBulletItem("Capítulo 1", "Arquitectura y Funcionamiento General del Sistema"),
        createBulletItem("Capítulo 2", "Manual de Usuario (Cliente / Carta Digital & Proceso de Pedido)"),
        createBulletItem("Capítulo 3", "Manual de Administrador (Panel de Control /admin)"),
        createBulletItem("Capítulo 4", "Estructura y Gestión de la Base de Datos en Google Sheets"),
        createBulletItem("Capítulo 5", "Código Backend Google Apps Script v3.0 y Despliegue"),
        createBulletItem("Capítulo 6", "Preguntas Frecuentes, Seguridad y Mantenimiento"),

        new Paragraph({ spacing: { before: 200, after: 200 } }),

        // ==================== CAPÍTULO 1 ====================
        createHeading1("Arquitectura y Funcionamiento General", 1),
        createParagraph(
          "El sistema web de Comidas Rápidas Trucco es una solución tecnológica integral de comercio gastronómico, desarrollada bajo un enfoque desacoplado y sin servidor (Serverless Cloud Architecture). Este diseño elimina los costos de mantenimiento de servidores tradicionales y garantiza una disponibilidad del 99.99% con sincronización de datos en tiempo real."
        ),

        createHeading2("1.1 Componentes del Ecosistema"),
        createBulletItem("Frontend Web de Alto Rendimiento", "Desarrollado en React 18, Vite 8 y TailwindCSS. Ofrece renderizado ultra veloz, animaciones fluidas y una experiencia totalmente responsive que se adapta automáticamente a teléfonos móviles, tabletas, portátiles y pantallas 4K."),
        createBulletItem("Base de Datos en la Nube (Google Sheets)", "Utiliza una hoja de cálculo en la nube como base de datos relacional y colaborativa. El equipo administrativo puede consultar, editar y respaldar la información directamente."),
        createBulletItem("API & Webhook en Google Apps Script", "Actúa como backend intermediario procesando peticiones HTTP POST y GET. Sincroniza productos, categorías, pedidos y usuarios de forma instantánea."),
        createBulletItem("Recepción de Pedidos por WhatsApp", "Integra la API oficial Click-to-Chat de WhatsApp para despachar pedidos estructurados y formateados directamente a la línea telefónica de atención del restaurante (+57 317 1922866)."),
        createBulletItem("Gestor Multimedia Cloudinary / HTTPS", "Asegura la carga de imágenes optimizadas de la carta gastronómica sin sobrecargar la base de datos."),

        createHeading2("1.2 Flujo de Datos y Conectividad"),
        createCalloutBox(
          "Ciclo de Procesamiento de un Pedido",
          "1. El cliente entra a la web, elige sus platos favoritos y configura adiciones.\n2. Al confirmar el pedido, el sistema ejecuta una petición POST en segundo plano hacia Google Apps Script, registrando la comanda con ID único, fecha, hora, productos y total en la hoja 'pedidos'.\n3. De forma simultánea, se abre WhatsApp con el mensaje estructurado listo para enviar al local.\n4. El panel de administración detecta la nueva orden, emite una alerta sonora en cocina y permite cambiar su estado a 'Completado' o gestionarlo según el flujo de despacho."
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ==================== CAPÍTULO 2 ====================
        createHeading1("Manual de Usuario (Cliente / Carta Digital)", 2),
        createParagraph(
          "La experiencia de usuario está optimizada para ser directa, atractiva y libre de obstáculos. Los comensales pueden explorar la carta y ordenar en menos de un minuto sin necesidad de registrarse."
        ),

        createHeading2("2.1 Acceso a la Carta"),
        createParagraph("Los clientes pueden ingresar mediante enlace web o escaneo de código QR en mesas o material publicitario:"),
        createBulletItem("Enlace oficial", "https://comidasrapidastrucco.online"),
        createBulletItem("Dispositivos compatibles", "Smartphones (Android / iPhone), tablets, computadores de escritorio y smart TVs."),

        createHeading2("2.2 Exploración y Búsqueda en la Carta"),
        createBulletItem("Filtros por Categorías Dinámicas", "Permite navegar entre las categorías creadas por el restaurante (ej. Hamburguesas, Perros Calientes, Salchipapas, Picadas, Bebidas). Al pulsar una categoría, la carta se filtra instantáneamente."),
        createBulletItem("Buscador Interactivo", "Permite buscar por nombre de plato o ingrediente clave (ej. 'tocineta', 'pollo', 'queso'). Los resultados se filtran en tiempo real mientras se escribe."),

        createHeading2("2.3 Selección de Variantes y Personalización"),
        createParagraph("Al seleccionar un producto se despliega la ventana de personalización:"),
        createBulletItem("Selección de Tamaño / Porción", "Permite elegir entre opciones como Sencilla, Doble, Mega o Especial con su respectivo precio."),
        createBulletItem("Salsas y Acompañamientos", "Marcación de salsas preferidas o exclusiones específicas (ej. 'Sin cebolla', 'Salsa de piña aparte')."),
        createBulletItem("Notas para Cocina", "Campo de texto para instrucciones especiales del cliente."),

        createHeading2("2.4 Carrito de Compras y Finalización"),
        createBulletItem("Control de Cantidades", "Modificación ágil de cantidades (+ / -) y cálculo automático del subtotal."),
        createBulletItem("Datos de Entrega", "Ingreso de Nombre, Teléfono y selección de modalidad: Domicilio (con dirección exacta y barrio) o Recoger en Local."),
        createBulletItem("Envío a WhatsApp", "Al pulsar 'Pedir por WhatsApp', el pedido se guarda en la base de datos y se abre la aplicación con el mensaje redactado para el local."),

        new Paragraph({ children: [new PageBreak()] }),

        // ==================== CAPÍTULO 3 ====================
        createHeading1("Manual de Administrador (Panel de Control)", 3),
        createParagraph(
          "El Panel de Administración permite la gestión integral del restaurante en tiempo real. Se accede de forma segura mediante credenciales autorizadas."
        ),

        createHeading2("3.1 Acceso y Seguridad"),
        createBulletItem("Ruta de Acceso", "https://comidasrapidastrucco.online/admin"),
        createBulletItem("Autenticación", "Ingreso con Usuario y Contraseña validados directamente contra la pestaña 'usuarios' de Google Sheets."),
        createBulletItem("Cierre de Sesión", "Botón de desconexión segura en la esquina superior para proteger el acceso al terminar el turno."),

        createHeading2("3.2 Modo Claro y Modo Oscuro"),
        createParagraph("El panel incluye un selector de tema ubicado en la cabecera:"),
        createBulletItem("Modo Claro (Por Defecto ☀️)", "Configurado como vista predeterminada para máxima legibilidad durante turnos de día."),
        createBulletItem("Modo Oscuro (🌙)", "Optimizado con tonos oscuros para evitar el cansancio visual durante el servicio nocturno."),
        createBulletItem("Persistencia", "El tema seleccionado se guarda en la memoria del navegador y se mantiene al recargar."),

        createHeading2("3.3 Módulo de Pedidos en Vivo"),
        createBulletItem("Recepción y Alerta Sonora", "Cada nuevo pedido emite un sonido de campana y se coloca en la cima de la lista con estado 'Pendiente' (naranja)."),
        createBulletItem("Cambio de Estado", "Un clic cambia el estado a 'Completado' (verde) reflejándose en Google Sheets."),
        createBulletItem("Eliminación con Confirmación de Seguridad", "Al pulsar el botón de eliminar pedido, se abre un modal de confirmación que muestra el ID, nombre del cliente y total para evitar borrados accidentales."),

        createHeading2("3.4 Módulo de Productos (CRUD)"),
        createBulletItem("Crear Producto", "Formulario completo con nombre, categoría dinámica, descripción, foto (URL o Cloudinary) y hasta 3 opciones de tamaño y precio."),
        createBulletItem("Editar Producto", "Modificación inmediata de cualquier dato con actualización instantánea en la carta digital."),
        createBulletItem("Eliminar Producto", "Retiro seguro de productos con confirmación previa."),

        createHeading2("3.5 Módulo de Categorías (CRUD Dinámico)"),
        createBulletItem("Crear Categoría", "Añade una nueva categoría a la hoja 'categorias' y la activa inmediatamente en los selectores de productos."),
        createBulletItem("Renombrar con Reclasificación Automática", "Al cambiar el nombre de una categoría, el sistema actualiza automáticamente todos los productos asociados en Google Sheets para no perder su asignación."),
        createBulletItem("Eliminar Categoría", "Verifica cuántos productos pertenecen a la categoría antes de permitir su eliminación."),

        createHeading2("3.6 Módulo de Usuarios y Seguridad de Claves"),
        createCalloutBox(
          "Novedades en el Módulo de Usuarios",
          "• Botón 'Copiar credenciales': Presente en cada tarjeta de usuario. Al hacer clic, copia automáticamente el usuario y la contraseña al portapapeles en formato listo para pegar con notificación visual de éxito.\n• Mostrar / Ocultar Contraseña (👁️): Permite visualizar la clave en texto claro o enmascarada para mayor privacidad.\n• Cambio de Clave en Tiempo Real: Permite actualizar la contraseña de cualquier usuario sincronizándose al instante en Google Sheets.\n• Protección Antiborrado: Impide eliminar el último usuario registrado para evitar bloqueos del sistema."
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ==================== CAPÍTULO 4 ====================
        createHeading1("Estructura de la Base de Datos (Google Sheets)", 4),
        createParagraph(
          "La base de datos reside en la hoja de cálculo de Google Sheets (ID: 15Ba4vVjMyNbmPhk_obKKbkUGa0oJr9r-ANuI_G-TzHk). Consta de 4 hojas principales:"
        ),

        createHeading2("4.1 Hoja 'productos_trucco'"),
        createStyledTable(
          ["Columna", "Campo", "Tipo", "Descripción y Ejemplo"],
          [
            ["A", "id", "Texto", "Identificador único (ej. hamb-trucco-especial)"],
            ["B", "name", "Texto", "Nombre comercial (ej. Hamburguesa Trucco Especial)"],
            ["C", "description", "Texto", "Descripción de ingredientes"],
            ["D", "category", "Texto", "Categoría asignada (ej. Hamburguesas)"],
            ["E", "image", "URL HTTPS", "Enlace a la fotografía del plato"],
            ["F / G", "price1_label / price1", "Texto / Número", "Variante 1 (ej. Sencilla / 28000)"],
            ["H / I", "price2_label / price2", "Texto / Número", "Variante 2 (ej. Doble / 35000)"],
            ["J / K", "price3_label / price3", "Texto / Número", "Variante 3 (ej. Especial / 42000)"]
          ]
        ),

        createHeading2("4.2 Hoja 'categorias'"),
        createStyledTable(
          ["Columna", "Campo", "Ejemplo de Contenido"],
          [
            ["A", "id", "1, 2, 3, 4, 5..."],
            ["B", "nombre", "Hamburguesas, Perros Calientes, Salchipapas, Picadas, Bebidas"]
          ]
        ),

        createHeading2("4.3 Hoja 'usuarios'"),
        createStyledTable(
          ["Columna", "Campo", "Descripción"],
          [
            ["A", "id", "Identificador numérico correlativo"],
            ["B", "usuario", "Nombre de usuario para login (ej. admin, olga)"],
            ["C", "password", "Contraseña de acceso"],
            ["D", "nombre", "Nombre del colaborador (ej. Administrador Principal)"],
            ["E", "rol", "Nivel de permisos (ej. admin)"]
          ]
        ),

        createHeading2("4.4 Hoja 'pedidos'"),
        createStyledTable(
          ["Columna", "Campo", "Descripción"],
          [
            ["A", "ID", "Identificador numérico timestamp"],
            ["B / C", "Fecha / Hora", "Momento exacto de la orden"],
            ["D / E", "Cliente / Teléfono", "Datos de contacto del cliente"],
            ["F", "Tipo", "Domicilio o Recoger"],
            ["G / H", "Dirección / Notas", "Dirección de despacho y observaciones"],
            ["I / J", "Productos / Total", "Resumen de platos ordenados y valor total en $ COP"],
            ["K", "Estado", "Pendiente o Completado"]
          ]
        ),

        new Paragraph({ children: [new PageBreak()] }),

        // ==================== CAPÍTULO 5 ====================
        createHeading1("Código Backend Google Apps Script v3.0 & Despliegue", 5),
        createParagraph(
          "El backend en Google Apps Script procesa todas las solicitudes del frontend. A continuación se presenta el código completo listo para desplegar:"
        ),

        createCalloutBox(
          "Pasos para Desplegar en Google Apps Script",
          "1. Abra su Google Sheet 'Menú Trucco' ➔ Extensiones ➔ Apps Script.\n2. Borre el código anterior y pegue el script completo de abajo.\n3. Presione Ctrl + S para guardar.\n4. Clic en Desplegar ➔ Administrar implementaciones ➔ Editar (✏️).\n5. En Versión seleccione 'Nueva versión' y haga clic en Desplegar.\n6. Asegúrese de que el acceso esté en: 'Cualquier persona' (Anyone)."
        ),

        new Paragraph({ spacing: { before: 100, after: 60 } }),

        createCodeBlock(`// GOOGLE APPS SCRIPT - COMIDAS RAPIDAS TRUCCO v3.0
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
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // 2. GUARDAR CATEGORIAS
    if (action === 'saveCategories') {
      var categories = data.categories;
      var sheet = ss.getSheetByName('categorias') || ss.insertSheet('categorias');
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 2).clearContent();
      if (categories && Array.isArray(categories) && categories.length > 0) {
        var rows = categories.map(function(cat, i) { return [i + 1, cat]; });
        sheet.getRange(2, 1, rows.length, 2).setValues(rows);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // 3. GUARDAR USUARIOS Y CLAVES
    if (action === 'saveUsers') {
      var users = data.users;
      var sheet = ss.getSheetByName('usuarios') || ss.insertSheet('usuarios');
      var lastRow = sheet.getLastRow();
      if (lastRow > 1) sheet.getRange(2, 1, lastRow - 1, 5).clearContent();
      if (users && Array.isArray(users) && users.length > 0) {
        var rows = users.map(function(u, i) {
          return [i + 1, u.usuario || '', u.password || '', u.nombre || '', u.rol || 'admin'];
        });
        sheet.getRange(2, 1, rows.length, 5).setValues(rows);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true })).setMimeType(ContentService.MimeType.JSON);
    }

    // 4. GUARDAR NUEVO PEDIDO
    if (action === 'saveOrder') {
      var order = data.order;
      if (order) {
        var sheet = ss.getSheetByName('pedidos') || ss.insertSheet('pedidos');
        var tipoFormateado = (order.orderType === 'domicilio') ? 'Domicilio' : 'Recoger';
        var resumenProd = order.itemsSummary || (Array.isArray(order.items) ? order.items.map(function(i){ return i.quantity + 'x ' + i.name; }).join(', ') : '');
        sheet.appendRow([
          String(order.id), order.date || '', order.time || '', order.name || '',
          "'" + String(order.phone || ''), tipoFormateado, order.address || '-', order.notes || '-',
          resumenProd, Number(order.total) || 0, order.status === 'completed' ? 'Completado' : 'Pendiente'
        ]);
      }
      return ContentService.createTextOutput(JSON.stringify({ success: true, orderId: order ? order.id : null })).setMimeType(ContentService.MimeType.JSON);
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

    return ContentService.createTextOutput(JSON.stringify({ success: false })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}

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
    return ContentService.createTextOutput(JSON.stringify({ status: 'ok' })).setMimeType(ContentService.MimeType.JSON);
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() })).setMimeType(ContentService.MimeType.JSON);
  }
}`),

        new Paragraph({ children: [new PageBreak()] }),

        // ==================== CAPÍTULO 6 ====================
        createHeading1("Preguntas Frecuentes, Seguridad y Mantenimiento", 6),

        createHeading2("6.1 Preguntas Frecuentes (FAQ)"),
        createBulletItem("¿Cómo actualizar el número de WhatsApp oficial?", "El número configurado es 573171922866 (+57 317 1922866). Está centralizado en src/App.jsx y src/components/CartSidebar.jsx."),
        createBulletItem("¿Qué pasa si un cliente no abre WhatsApp?", "El pedido queda guardado de todas formas en la hoja 'pedidos' de Google Sheets. El administrador puede consultar el panel y contactar al cliente por teléfono."),
        createBulletItem("¿Cómo hacer copias de seguridad?", "En Google Drive, abra la hoja 'Menú Trucco' y vaya a: Archivo ➔ Descargar ➔ Microsoft Excel (.xlsx)."),

        createHeading2("6.2 Comandos Útiles de Mantenimiento"),
        createBulletItem("Compilación de Producción", "npm run build"),
        createBulletItem("Regenerar Documentación en PDF", "npm run docs:pdf"),
        createBulletItem("Regenerar Documentación en Word (.docx)", "npm run docs:word"),

        new Paragraph({ spacing: { before: 300, after: 100 } }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━",
              color: COLOR_SECONDARY
            })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({
              text: "Comidas Rápidas Trucco • Documentación Oficial Generada en Microsoft Word (.docx) • © 2026",
              font: FONT_PRIMARY,
              size: 16,
              color: COLOR_MUTED,
              italics: true
            })
          ]
        })
      ]
    }
  ]
});

// Write to files
async function buildDocx() {
  const buffer = await Packer.toBuffer(doc);

  if (!fs.existsSync(docsDir)) fs.mkdirSync(docsDir, { recursive: true });
  if (!fs.existsSync(mirrorDocsDir)) fs.mkdirSync(mirrorDocsDir, { recursive: true });

  fs.writeFileSync(wordFileRoot, buffer);
  console.log('✅ Archivo Word generado en raíz:', wordFileRoot);

  fs.writeFileSync(wordFileDocs, buffer);
  console.log('✅ Archivo Word generado en docs:', wordFileDocs);

  if (fs.existsSync(mirrorDir)) {
    fs.writeFileSync(mirrorWordRoot, buffer);
    fs.writeFileSync(mirrorWordDocs, buffer);
    console.log('✅ Archivo Word sincronizado en mirror:', mirrorWordRoot);
  }

  const stats = fs.statSync(wordFileRoot);
  console.log(`🎉 ¡Documento Word (.docx) creado con éxito! Tamaño: ${(stats.size / 1024).toFixed(2)} KB`);
}

buildDocx().catch(err => {
  console.error('❌ Error al generar Word:', err);
  process.exit(1);
});
