import { useState, useEffect, useCallback } from 'react';
import { useSheetProducts, APPS_SCRIPT_URL } from './useSheetProducts';

export function useAdminProducts() {
  const { products: sheetProducts, categories: sheetCategories, loading: loadingSheet, refresh, refreshCategories } = useSheetProducts();

  const [products, setProducts] = useState(sheetProducts);
  const [categories, setCategories] = useState(sheetCategories);
  const [orders, setOrders] = useState(() => {
    try {
      const saved = localStorage.getItem('trucco_order_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  useEffect(() => { setProducts(sheetProducts); }, [sheetProducts]);
  useEffect(() => { setCategories(sheetCategories); }, [sheetCategories]);

  // ─── Sync productos al Sheet ─────────────────────────────
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
      console.error('Error guardando productos:', err);
      setSaveError(err.message);
      setProducts(sheetProducts);
      throw err;
    } finally {
      setIsSaving(false);
    }
  };

  // ─── Sync categorías al Sheet ────────────────────────────
  const syncCategoriesToSheet = async (newRawCategories) => {
    const withTodos = ['Todos', ...newRawCategories];
    setCategories(withTodos);
    localStorage.setItem('trucco_cats_cache', JSON.stringify(withTodos));
    localStorage.setItem('trucco_cats_cache_time', String(Date.now()));

    setIsSaving(true);
    setSaveError(null);
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'saveCategories', categories: newRawCategories })
      });
    } catch (err) {
      console.error('Error guardando categorías en Google Sheets:', err);
      setSaveError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ─── CRUD Productos ──────────────────────────────────────
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

  // ─── CRUD Categorías ─────────────────────────────────────
  const getRawCategories = () => categories.filter(c => c !== 'Todos');

  const addCategory = async (nombre) => {
    const raw = getRawCategories();
    if (raw.map(c => c.toLowerCase()).includes(nombre.trim().toLowerCase())) {
      throw new Error('Ya existe una categoría con ese nombre');
    }
    const newRaw = [...raw, nombre.trim()];
    await syncCategoriesToSheet(newRaw);
  };

  const updateCategory = async (oldNombre, newNombre) => {
    const raw = getRawCategories();
    if (
      raw.map(c => c.toLowerCase()).includes(newNombre.trim().toLowerCase()) &&
      newNombre.trim().toLowerCase() !== oldNombre.toLowerCase()
    ) {
      throw new Error('Ya existe una categoría con ese nombre');
    }
    const newRaw = raw.map(c => c === oldNombre ? newNombre.trim() : c);
    const updatedProducts = products.map(p =>
      p.category === oldNombre ? { ...p, category: newNombre.trim() } : p
    );
    setProducts(updatedProducts);
    localStorage.setItem('trucco_sheet_cache', JSON.stringify(updatedProducts));
    await Promise.all([
      syncCategoriesToSheet(newRaw),
      syncToSheet(updatedProducts),
    ]);
  };

  const deleteCategory = async (nombre) => {
    const newRaw = getRawCategories().filter(c => c !== nombre);
    await syncCategoriesToSheet(newRaw);
  };

  // ─── GESTIÓN DE PEDIDOS DESDE GOOGLE SHEETS ──────────────
  const fetchOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const resp = await fetch(`${APPS_SCRIPT_URL}?action=getOrders&t=${Date.now()}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data && Array.isArray(data.orders)) {
          setOrders(data.orders);
          localStorage.setItem('trucco_order_history', JSON.stringify(data.orders));
          return data.orders;
        }
      }
    } catch (err) {
      console.warn('No se pudieron obtener pedidos del servidor, usando copia local:', err);
    } finally {
      setLoadingOrders(false);
    }
    return null;
  }, []);

  const updateOrderStatus = async (orderId, newStatus) => {
    const stringId = String(orderId);
    const updated = orders.map(o => String(o.id) === stringId ? { ...o, status: newStatus } : o);
    setOrders(updated);
    localStorage.setItem('trucco_order_history', JSON.stringify(updated));

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'updateOrderStatus', orderId: stringId, status: newStatus })
      });
    } catch (err) {
      console.error('Error actualizando estado del pedido en Sheet:', err);
    }
  };

  const deleteOrder = async (orderId) => {
    const stringId = String(orderId);
    const updated = orders.filter(o => String(o.id) !== stringId);
    setOrders(updated);
    localStorage.setItem('trucco_order_history', JSON.stringify(updated));

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action: 'deleteOrder', orderId: stringId })
      });
    } catch (err) {
      console.error('Error eliminando pedido en Sheet:', err);
    }
  };

  return {
    products,
    categories,
    orders,
    loadingOrders,
    loading: loadingSheet || isSaving,
    isSaving,
    error: saveError,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    fetchOrders,
    updateOrderStatus,
    deleteOrder,
    refresh,
    refreshCategories,
  };
}

// Hook público para el menú
export function useProducts() {
  return useSheetProducts();
}
