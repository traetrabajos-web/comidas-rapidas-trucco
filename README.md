# Comidas Rápidas Trucco 🍔🍟

Este es el repositorio oficial de la página web de **Comidas Rápidas Trucco**. Un restaurante de comidas rápidas que ofrece hamburguesas, salchipapas, perros calientes, burritos, patacones y picadas.

## 🚀 Características Principales

- **Menú Interactivo**: Visualización completa de todos los productos disponibles categorizados.
- **Variantes de Precios**: Selección de opciones y tamaños directamente desde cada producto.
- **Carrito de Compras**: Gestión de pedidos en tiempo real con una barra lateral dinámica.
- **Integración con WhatsApp**: Generación automática de un mensaje detallado con los productos seleccionados, los datos del cliente y el tipo de pedido (Domicilio o Recoger en tienda).
- **Indicador de Horario**: Sistema automatizado que indica si el local está abierto o cerrado según la hora actual (Abierto todos los días de 5:00 PM a 12:00 AM).
- **Diseño Responsive**: Interfaz moderna y adaptable a cualquier dispositivo móvil o de escritorio, creada con **Tailwind CSS v4** y animaciones con **Framer Motion**.

## 🛠️ Tecnologías Utilizadas

- **React 19**
- **Vite**
- **Tailwind CSS v4** (Nuevo motor `@tailwindcss/vite`)
- **Framer Motion** (Animaciones fluidas)
- **Lucide React** (Iconografía)

## 📋 Información del Restaurante

- **Nombre**: Comidas Rápidas Trucco
- **Especialidades**: Perro Todas las Carnes, Mega Picada, Burrito Especial, Hamburguesas.
- **Dirección**: La Urbanización Emmanuel, Barrio 20 de Julio. Cartagena, Bolívar.
- **Horario de Atención**: Lunes a Domingo, de 5:00 PM a 12:00 AM.
- **Contacto de Domicilios**: +57 3171922866

## 💻 Instalación y Uso Local

Para correr este proyecto en tu entorno local:

1. Clona este repositorio:
   ```bash
   git clone https://github.com/programmerfullstack581/comidas-rapidas-trucco.git
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```
4. Abre tu navegador en `http://localhost:5173`

*Nota para usuarios de Windows PowerShell: Si tienes problemas de permisos, recuerda usar `cmd /c "npm run dev"`*.

## 🌐 Despliegue en Netlify

El proyecto ya está completamente configurado para Netlify a través de `netlify.toml` y `public/_redirects`:

- **Build command**: `npm run build`
- **Publish directory**: `dist`

### Pasos para desplegar:
1. Inicia sesión en [Netlify](https://app.netlify.com/).
2. Haz clic en **"Add new site"** > **"Import an existing project"**.
3. Conéctate con **GitHub** y selecciona el repositorio: `comidas-rapidas-trucco`.
4. Netlify detectará automáticamente la configuración de `netlify.toml`.
5. Haz clic en **"Deploy comidas-rapidas-trucco"** ¡y listo! Tu sitio estará en línea con dominio SSL gratuito.

## 📂 Estructura del Proyecto

Los datos reales de la carta (productos, descripciones, precios y categorías) se encuentran en el archivo `src/data/products.js`. Para modificar algún precio o producto, basta con actualizar ese archivo.
