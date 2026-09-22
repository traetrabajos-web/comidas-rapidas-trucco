import { useState, useEffect } from 'react';
import { useSheetProducts, APPS_SCRIPT_URL } from './useSheetProducts';

export function useAdminProducts() {
  const { products: sheetProducts, categories, loading: loadingSheet, refresh } = useSheetProducts();
  
  const [products, setProducts] = useState(sheetProducts);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => {
    setProducts(sheetProducts);
  }, [sheetProducts]);

  const syncToSheet = async (newProducts) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({ products: newProducts })
      });
      
      // Como usamos no-cors, no podemos leer la respuesta JSON, 
      // así que asumimos éxito si la red no falló.
      
      // Update local cache so refresh is immediate for this device
      localStorage.setItem('trucco_sheet_cache', JSON.stringify(newProducts));
      localStorage.setItem('trucco_sheet_cache_time', String(Date.now()));
      
      // No necesitamos hacer refresh desde la red inmediatamente porque ya 
      // actualizamos la caché y el estado local.
      // await refresh(); 
    } catch (err) {
      console.error("Error guardando en Google Sheets:", err);
      setSaveError(err.message);
      // Revert to sheet products on failure
      setProducts(sheetProducts);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

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

  const resetToOriginal = async () => {
    // We could implement this, but maybe better not to wipe the sheet accidentally.
    // For now, throw error or leave unimplemented since we don't want to break the Google Sheet.
    throw new Error("Resetting to original not supported with Google Sheets. Please edit the Sheet directly.");
  };

  const exportProducts = () => {
    // Deprecated for Google Sheets flow, but keep for compatibility if needed.
    alert("Exportar ya no es necesario. Los cambios se guardan directamente en Google Sheets.");
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
    resetToOriginal,
    exportProducts,
    refresh,
  };
}

// Hook público para el menú
// Ahora el App principal ya usa useSheetProducts, esto es solo por si algo más lo requiere.
export function useProducts() {
  return useSheetProducts();
}

