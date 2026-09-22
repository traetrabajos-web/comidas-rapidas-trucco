import { useState, useEffect } from 'react';
import { useSheetProducts, APPS_SCRIPT_URL } from './useSheetProducts';

export function useAdminProducts() {
  const { products: sheetProducts, categories: sheetCategories, loading: loadingSheet, refresh, refreshCategories } = useSheetProducts();
  
  const [products, setProducts] = useState(sheetProducts);
  const [categories, setCategories] = useState(sheetCategories);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    setProducts(sheetProducts);
  }, [sheetProducts]);

  useEffect(() => {
    setCategories(sheetCategories);
  }, [sheetCategories]);

  // ─── Sync productos al Sheet ────────────────────────
  const syncToSheet = async (newProducts) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveProducts', products: newProducts })
      });
      localStorage.setItem('trucco_sheet_cache', JSON.stringify(newProducts));
      localStorage.setItem('trucco_sheet_cache_time', String(Date.now()));
    } catch (err) {
      console.error('Error guardando productos en Google Sheets:', err);
      setSaveError(err.message);
      setProducts(sheetProducts);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Sync categorías al Sheet ───────────────────────
  const syncCategoriesToSheet = async (newCategories) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      // newCategories es un array de strings (sin "Todos")
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveCategories', categories: newCategories })
      });
      // Actualizar caché local
      const withTodos = ['Todos', ...newCategories];
      localStorage.setItem('trucco_cats_cache', JSON.stringify(withTodos));
      localStorage.setItem('trucco_cats_cache_time', String(Date.now()));
      setCategories(withTodos);
    } catch (err) {
      console.error('Error guardando categorías en Google Sheets:', err);
      setSaveError(err.message);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // ─── CRUD Productos ────────────────────────────────
  const addProduct = async (productData) => {
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    const newProduct = { ...productData, id: newId };
    const newProducts = [...products, newProduct];
    setProducts(newProducts);
    await syncToSheet(newProducts);
    return newProduct;
  };

  const updateProduct = async (id, productData) => {
    const newProducts = products.map(p => p.id === id ? { ...p, ...productData, id } : p);
    setProducts(newProducts);
    await syncToSheet(newProducts);
  };

  const deleteProduct = async (id) => {
    const newProducts = products.filter(p => p.id !== id);
    setProducts(newProducts);
    await syncToSheet(newProducts);
  };

  // ─── CRUD Categorías ───────────────────────────────
  // rawCategories = array sin "Todos", ej: ["Hamburguesas", "Bebidas"]
  const getRawCategories = () => categories.filter(c => c !== 'Todos');

  const addCategory = async (nombre) => {
    const raw = getRawCategories();
    if (raw.includes(nombre.trim())) throw new Error('Ya existe esa categoría');
    const newRaw = [...raw, nombre.trim()];
    await syncCategoriesToSheet(newRaw);
  };

  const updateCategory = async (oldNombre, newNombre) => {
    const raw = getRawCategories();
    if (raw.includes(newNombre.trim()) && newNombre.trim() !== oldNombre) {
      throw new Error('Ya existe una categoría con ese nombre');
    }
    const newRaw = raw.map(c => c === oldNombre ? newNombre.trim() : c);
    // También actualizar los productos que usen esa categoría
    const updatedProducts = products.map(p =>
      p.category === oldNombre ? { ...p, category: newNombre.trim() } : p
    );
    setProducts(updatedProducts);
    localStorage.setItem('trucco_sheet_cache', JSON.stringify(updatedProducts));
    await syncCategoriesToSheet(newRaw);
    await syncToSheet(updatedProducts);
  };

  const deleteCategory = async (nombre) => {
    const raw = getRawCategories().filter(c => c !== nombre);
    await syncCategoriesToSheet(raw);
  };

  const resetToOriginal = async () => {
    throw new Error('Resetting to original not supported with Google Sheets. Please edit the Sheet directly.');
  };

  const exportProducts = () => {
    alert('Exportar ya no es necesario. Los cambios se guardan directamente en Google Sheets.');
  };

  return {
    products,
    categories,
    loading: loadingSheet || isSaving,
    isSaving,
    error: saveError,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    resetToOriginal,
    exportProducts,
    refresh,
    refreshCategories,
  };
}

// Hook público para el menú
export function useProducts() {
  return useSheetProducts();
}
