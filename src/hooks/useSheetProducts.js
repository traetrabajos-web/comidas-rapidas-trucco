// ═══════════════════════════════════════════════════
// Hook para cargar productos Y categorías desde Google Sheets
// El admin edita el Sheet y los cambios aparecen
// automáticamente en la página para todos.
// ═══════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { products as fallbackProducts, categories as fallbackCategories } from '../data/products';

// ▶ ID del Google Sheet de Comidas Rápidas Trucco
const SHEET_ID = '15Ba4vVjMyNbmPhk_obKKbkUGa0oJr9r-ANuI_G-TzHk';
// GID 434772837 = pestaña "productos_trucco"
const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=434772837`;
// GID 1947904445 = pestaña "categorias"
const CATEGORIES_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=1947904445`;
// Apps Script para escribir desde el panel de admin
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxEPuHcr7MrQeElzbgeeYDTdqnw9uww66SypR0izc8ktIgaTZZNI4dWfqr4Cs6wEG00/exec';

// Cuánto tiempo guardar el caché (5 minutos)
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_KEY = 'trucco_sheet_cache';
const CACHE_TIME_KEY = 'trucco_sheet_cache_time';
const CACHE_CATS_KEY = 'trucco_cats_cache';
const CACHE_CATS_TIME_KEY = 'trucco_cats_cache_time';

/**
 * Parsea una línea CSV respetando celdas con comillas y comas internas.
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Convierte el CSV del Google Sheet a un array de productos
 * con el mismo formato que products.js
 */
function csvToProducts(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return null;

  // Saltar fila de encabezados
  const dataLines = lines.slice(1);

  const products = dataLines
    .map(line => {
      const cols = parseCSVLine(line);
      const [
        id, name, description, category, image,
        p1label, p1price,
        p2label, p2price,
        p3label, p3price,
      ] = cols;

      if (!id || !name || !category) return null;

      const variants = [];
      if (p1label && p1price) variants.push({ label: p1label, price: Number(p1price) });
      if (p2label && p2price) variants.push({ label: p2label, price: Number(p2price) });
      if (p3label && p3price) variants.push({ label: p3label, price: Number(p3price) });
      if (variants.length === 0) return null;

      return {
        id: Number(id),
        name,
        description,
        category,
        image,
        variants,
      };
    })
    .filter(Boolean);

  return products.length > 0 ? products : null;
}

/**
 * Convierte el CSV de la pestaña categorias a un array de strings
 * con la forma ["Todos", "Hamburguesas", "Bebidas", ...]
 */
function csvToCategories(csvText) {
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return null;

  // Saltar fila de encabezados (id, nombre)
  const dataLines = lines.slice(1);
  const cats = ['Todos'];

  dataLines.forEach(line => {
    const cols = parseCSVLine(line);
    const [id, nombre] = cols;
    if (id && nombre && nombre.trim()) {
      cats.push(nombre.trim());
    }
  });

  return cats.length > 1 ? cats : null;
}

/**
 * Extrae las categorías únicas de la lista de productos
 * — usado como fallback si la pestaña categorías está vacía.
 */
function extractCategories(products) {
  const seen = new Set();
  const cats = ['Todos'];
  products.forEach(p => {
    if (!seen.has(p.category)) {
      seen.add(p.category);
      cats.push(p.category);
    }
  });
  return cats;
}

/**
 * Hook principal — úsalo en App.jsx en lugar de importar
 * products y categories directamente de data/products.js
 *
 * Retorna: { products, categories, loading, error, refresh, refreshCategories }
 */
export function useSheetProducts() {
  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      if (cached && cachedTime && Date.now() - Number(cachedTime) < CACHE_TTL) {
        return JSON.parse(cached);
      }
    } catch {}
    return fallbackProducts;
  });

  const [categories, setCategories] = useState(() => {
    // Primero intentar caché de categorías dedicado
    try {
      const cachedCats = localStorage.getItem(CACHE_CATS_KEY);
      const cachedCatsTime = localStorage.getItem(CACHE_CATS_TIME_KEY);
      if (cachedCats && cachedCatsTime && Date.now() - Number(cachedCatsTime) < CACHE_TTL) {
        return JSON.parse(cachedCats);
      }
    } catch {}
    // Fallback: derivar de productos cacheados
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      if (cached && cachedTime && Date.now() - Number(cachedTime) < CACHE_TTL) {
        const prods = JSON.parse(cached);
        return extractCategories(prods);
      }
    } catch {}
    return fallbackCategories;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Carga productos desde Sheet
  const fetchFromSheet = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(SHEET_CSV_URL + '&t=' + Date.now());
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const csv = await resp.text();
      const parsed = csvToProducts(csv);
      if (parsed) {
        setProducts(parsed);
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsed));
        localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
      }
    } catch (err) {
      console.warn('No se pudo cargar el Sheet de productos, usando datos locales:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Carga categorías desde Sheet
  const fetchCategoriesFromSheet = async () => {
    try {
      const resp = await fetch(CATEGORIES_CSV_URL + '&t=' + Date.now());
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const csv = await resp.text();
      const parsed = csvToCategories(csv);
      if (parsed) {
        setCategories(parsed);
        localStorage.setItem(CACHE_CATS_KEY, JSON.stringify(parsed));
        localStorage.setItem(CACHE_CATS_TIME_KEY, String(Date.now()));
      }
    } catch (err) {
      console.warn('No se pudo cargar categorías del Sheet:', err.message);
      // Silently fall back to product-derived categories
    }
  };

  const refresh = async () => {
    await Promise.all([fetchFromSheet(), fetchCategoriesFromSheet()]);
  };

  const refreshCategories = () => {
    localStorage.removeItem(CACHE_CATS_KEY);
    localStorage.removeItem(CACHE_CATS_TIME_KEY);
    return fetchCategoriesFromSheet();
  };

  useEffect(() => {
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    const cacheExpired = !cachedTime || Date.now() - Number(cachedTime) > CACHE_TTL;
    if (cacheExpired) fetchFromSheet();

    const cachedCatsTime = localStorage.getItem(CACHE_CATS_TIME_KEY);
    const catsCacheExpired = !cachedCatsTime || Date.now() - Number(cachedCatsTime) > CACHE_TTL;
    if (catsCacheExpired) fetchCategoriesFromSheet();
  }, []);

  return { products, categories, loading, error, refresh, refreshCategories };
}
