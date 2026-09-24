import { useState, useEffect } from 'react';
import { useSheetProducts, APPS_SCRIPT_URL } from './useSheetProducts';

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

  // ── 1. CREAR CATEGORÍA ──
  const addCategory = async (categoryName) => {
    const trimmed = categoryName.trim();
    if (!trimmed || trimmed === 'Todos') return;
    const currentRaw = categories.filter(c => c !== 'Todos');
    if (currentRaw.includes(trimmed)) return;

    const newRaw = [...currentRaw, trimmed];
    const fullList = ['Todos', ...newRaw];
    setCategories(fullList);
    localStorage.setItem('trucco_categories_cache', JSON.stringify(fullList));
    
    await syncCategoriesToSheet(newRaw);
  };

  // ── 2. EDITAR / RENOMBRAR CATEGORÍA ──
  const updateCategory = async (oldCategoryName, newCategoryName) => {
    const trimmedOld = oldCategoryName.trim();
    const trimmedNew = newCategoryName.trim();
    if (!trimmedNew || trimmedNew === 'Todos' || trimmedOld === trimmedNew) return;

    const currentRaw = categories.filter(c => c !== 'Todos');
    const updatedRaw = currentRaw.map(c => c === trimmedOld ? trimmedNew : c);
    if (!updatedRaw.includes(trimmedNew)) {
      updatedRaw.push(trimmedNew);
    }

    // Actualizar también los productos que pertenecen a la categoría renombrada
    const updatedProducts = products.map(p => {
      if (p.category === trimmedOld) {
        return { ...p, category: trimmedNew };
      }
      return p;
    });

    const fullList = ['Todos', ...updatedRaw];
    setCategories(fullList);
    setProducts(updatedProducts);

    localStorage.setItem('trucco_categories_cache', JSON.stringify(fullList));
    localStorage.setItem('trucco_sheet_cache', JSON.stringify(updatedProducts));

    await Promise.all([
      syncCategoriesToSheet(updatedRaw),
      syncToSheet(updatedProducts)
    ]);
  };

  // ── 3. ELIMINAR CATEGORÍA ──
  const deleteCategory = async (categoryName) => {
    const trimmed = categoryName.trim();
    if (!trimmed || trimmed === 'Todos') return;
    const currentRaw = categories.filter(c => c !== 'Todos');
    const newRaw = currentRaw.filter(c => c !== trimmed);
    
    // Si habían productos en la categoría eliminada, reasignarlos a otra categoría disponible o General
    const fallbackCategory = newRaw.length > 0 ? newRaw[0] : 'General';
    const updatedProducts = products.map(p => {
      if (p.category === trimmed) {
        return { ...p, category: fallbackCategory };
      }
      return p;
    });

    const fullList = ['Todos', ...newRaw];
    setCategories(fullList);
    setProducts(updatedProducts);

    localStorage.setItem('trucco_categories_cache', JSON.stringify(fullList));
    localStorage.setItem('trucco_sheet_cache', JSON.stringify(updatedProducts));

    await Promise.all([
      syncCategoriesToSheet(newRaw),
      syncToSheet(updatedProducts)
    ]);
  };

  // ── PRODUCTOS CRUD ──
  const addProduct = async (productData) => {
    const newId = Math.max(...products.map(p => p.id), 0) + 1;
    const newProduct = { ...productData, id: newId };
    const newProducts = [...products, newProduct];
    setProducts(newProducts);
    
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
    throw new Error("Resetting to original not supported with Google Sheets.");
  };

  const exportProducts = () => {
    alert("Los cambios se guardan directamente en Google Sheets.");
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
    updateCategory,
    deleteCategory,
    resetToOriginal,
    exportProducts,
    refresh,
  };
}

export function useProducts() {
  return useSheetProducts();
}
