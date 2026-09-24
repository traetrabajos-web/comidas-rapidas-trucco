import { useState, useEffect } from 'react';
import { useSheetProducts, APPS_SCRIPT_URL, mergeCategories } from './useSheetProducts';

export function useAdminProducts() {
  const {
    products: sheetProducts,
    categories: sheetCategories,
    rawCategories: sheetRawCategories,
    loading: loadingSheet,
    refresh
  } = useSheetProducts();
  
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

  // Sincronizar productos con Google Sheets
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
        body: JSON.stringify({ 
          action: 'saveProducts',
          products: newProducts 
        })
      });
      
      // Actualizar caché local de inmediato
      localStorage.setItem('trucco_sheet_cache', JSON.stringify(newProducts));
      localStorage.setItem('trucco_sheet_cache_time', String(Date.now()));
    } catch (err) {
      console.error("Error guardando productos en Google Sheets:", err);
      setSaveError(err.message);
      setProducts(sheetProducts);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // Sincronizar categorías con Google Sheets (pestaña 'categorias')
  const syncCategoriesToSheet = async (newCategoriesList) => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const cleanList = newCategoriesList.filter(c => c && c !== 'Todos');
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action: 'saveCategories',
          categories: cleanList
        })
      });

      const fullList = ['Todos', ...cleanList];
      setCategories(fullList);
      localStorage.setItem('trucco_categories_cache', JSON.stringify(fullList));
      localStorage.setItem('trucco_sheet_cache_time', String(Date.now()));
    } catch (err) {
      console.error("Error guardando categorías en Google Sheets:", err);
      setSaveError(err.message);
      setCategories(sheetCategories);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  const addCategory = async (categoryName) => {
    const trimmed = categoryName.trim();
    if (!trimmed || trimmed === 'Todos') return;
    const currentRaw = categories.filter(c => c !== 'Todos');
    if (currentRaw.includes(trimmed)) return;

    const newRaw = [...currentRaw, trimmed];
    const fullList = ['Todos', ...newRaw];
    setCategories(fullList);
    await syncCategoriesToSheet(newRaw);
  };

  const deleteCategory = async (categoryName) => {
    const trimmed = categoryName.trim();
    if (!trimmed || trimmed === 'Todos') return;
    const currentRaw = categories.filter(c => c !== 'Todos');
    const newRaw = currentRaw.filter(c => c !== trimmed);
    const fullList = ['Todos', ...newRaw];
    setCategories(fullList);
    await syncCategoriesToSheet(newRaw);
  };

  const addProduct = async (productData) => {
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    const newProduct = { ...productData, id: newId };
    const newProducts = [...products, newProduct];
    setProducts(newProducts);
    
    // Si la categoría del nuevo producto no está en la lista de categorías, incluirla
    if (newProduct.category && !categories.includes(newProduct.category)) {
      const updatedCats = [...categories, newProduct.category];
      setCategories(updatedCats);
      localStorage.setItem('trucco_categories_cache', JSON.stringify(updatedCats));
    }

    await syncToSheet(newProducts);
    return newProduct;
  };

  const updateProduct = async (id, productData) => {
    const newProducts = products.map(p => p.id === id ? { ...p, ...productData, id } : p);
    setProducts(newProducts);

    if (productData.category && !categories.includes(productData.category)) {
      const updatedCats = [...categories, productData.category];
      setCategories(updatedCats);
      localStorage.setItem('trucco_categories_cache', JSON.stringify(updatedCats));
    }

    await syncToSheet(newProducts);
  };

  const deleteProduct = async (id) => {
    const newProducts = products.filter(p => p.id !== id);
    setProducts(newProducts);
    await syncToSheet(newProducts);
  };

  const resetToOriginal = async () => {
    throw new Error("Resetting to original not supported with Google Sheets. Please edit the Sheet directly.");
  };

  const exportProducts = () => {
    alert("Exportar ya no es necesario. Los cambios se guardan directamente en Google Sheets.");
  };

  return {
    products,
    categories,
    rawCategories: categories.filter(c => c !== 'Todos'),
    loading: loadingSheet || isSaving,
    error: saveError,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    deleteCategory,
    resetToOriginal,
    exportProducts,
    refresh,
  };
}

export function useProducts() {
  return useSheetProducts();
}
