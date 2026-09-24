// ═══════════════════════════════════════════════════
// Hook para cargar productos y categorías desde Google Sheets
// El admin edita el Sheet y los cambios aparecen
// automáticamente en la página para todos.
// ═══════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { products as fallbackProducts, categories as fallbackCategories } from '../data/products';

// ▶ ID del Google Sheet de Comidas Rápidas Trucco
export const SHEET_ID = '15Ba4vVjMyNbmPhk_obKKbkUGa0oJr9r-ANuI_G-TzHk';
// GID 434772837 = pestaña "productos_trucco" con exportación directa en tiempo real
export const SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=434772837`;
// Pestaña "categorias" con exportación directa
export const SHEET_CATEGORIES_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=categorias`;

// Apps Script v2.0 para escribir desde el panel de admin y registrar pedidos
export const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwAmwqHiaZ1ttSU-AblYS25gbhyxRQvEtHyVNhfY4abZGZxNiarHRp4eaIb7RmgWLKf/exec';

// Cuánto tiempo guardar el caché (5 minutos)
const CACHE_TTL = 5 * 60 * 1000;
const CACHE_KEY = 'trucco_sheet_cache';
const CACHE_CATEGORIES_KEY = 'trucco_categories_cache';
const CACHE_TIME_KEY = 'trucco_sheet_cache_time';

/**
 * Parsea una línea CSV respetando celdas con comillas y comas internas.
 */
export function parseCSVLine(line) {
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
export function csvToProducts(csvText) {
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
 * Parsea el CSV de la pestaña 'categorias' de Google Sheets
 */
export function parseCategoriesCSV(csvText) {
  if (!csvText) return [];
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const cats = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const raw = (cols.length > 1 ? cols[1] : cols[0]) || '';
    const clean = raw.replace(/^["']|["']$/g, '').trim();
    if (clean && clean.toLowerCase() !== 'nombre' && clean.toLowerCase() !== 'id' && !cats.includes(clean)) {
      cats.push(clean);
    }
  }
  return cats;
}

/**
 * Une categorías de la pestaña 'categorias' con las encontradas en productos
 */
export function mergeCategories(sheetCategories = [], products = []) {
  const seen = new Set();
  const result = ['Todos'];

  // 1. Agregar las categorías oficiales de la pestaña categorias
  sheetCategories.forEach(cat => {
    const trimmed = (cat || '').trim();
    if (trimmed && trimmed !== 'Todos' && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  });

  // 2. Agregar cualquier categoría que aparezca en los productos
  products.forEach(p => {
    const trimmed = (p.category || '').trim();
    if (trimmed && trimmed !== 'Todos' && !seen.has(trimmed)) {
      seen.add(trimmed);
      result.push(trimmed);
    }
  });

  // 3. Si no hay categorías, fallback a las categorías por defecto
  if (result.length === 1) {
    fallbackCategories.forEach(cat => {
      if (!seen.has(cat) && cat !== 'Todos') {
        seen.add(cat);
        result.push(cat);
      }
    });
  }

  return result;
}

/**
 * Hook principal — usado para cargar productos y categorías sincronizados
 * Retorna: { products, categories, rawCategories, loading, error, refresh }
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
    try {
      const cachedCats = localStorage.getItem(CACHE_CATEGORIES_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      if (cachedCats && cachedTime && Date.now() - Number(cachedTime) < CACHE_TTL) {
        return JSON.parse(cachedCats);
      }
      const cachedProds = localStorage.getItem(CACHE_KEY);
      if (cachedProds) {
        return mergeCategories([], JSON.parse(cachedProds));
      }
    } catch {}
    return fallbackCategories;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFromSheet = async () => {
    setLoading(true);
    setError(null);
    try {
      // Peticiones paralelas: productos_trucco y categorias
      const timestamp = Date.now();
      const [prodResp, catResp] = await Promise.allSettled([
        fetch(`${SHEET_CSV_URL}&t=${timestamp}`),
        fetch(`${SHEET_CATEGORIES_URL}&t=${timestamp}`)
      ]);

      let parsedProducts = null;
      let parsedCategories = [];

      if (prodResp.status === 'fulfilled' && prodResp.value.ok) {
        const prodCsv = await prodResp.value.text();
        parsedProducts = csvToProducts(prodCsv);
      }

      if (catResp.status === 'fulfilled' && catResp.value.ok) {
        const catCsv = await catResp.value.text();
        parsedCategories = parseCategoriesCSV(catCsv);
      }

      if (parsedProducts) {
        setProducts(parsedProducts);
        localStorage.setItem(CACHE_KEY, JSON.stringify(parsedProducts));
      }

      const activeProducts = parsedProducts || products;
      const mergedCats = mergeCategories(parsedCategories, activeProducts);
      setCategories(mergedCats);
      localStorage.setItem(CACHE_CATEGORIES_KEY, JSON.stringify(mergedCats));
      localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));

    } catch (err) {
      console.warn('No se pudo cargar el Sheet, usando datos locales:', err.message);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
    const cacheExpired = !cachedTime || Date.now() - Number(cachedTime) > CACHE_TTL;
    if (cacheExpired) {
      fetchFromSheet();
    }
  }, []);

  return {
    products,
    categories,
    rawCategories: categories.filter(c => c !== 'Todos'),
    loading,
    error,
    refresh: fetchFromSheet
  };
}
