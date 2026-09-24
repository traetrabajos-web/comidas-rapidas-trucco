import { useState, useEffect, useRef } from 'react';
import {
  LogOut, Plus, Pencil, Trash2,
  ChefHat, Search, Package, AlertTriangle, CheckCircle,
  ExternalLink, X, RefreshCw, Eye, ClipboardList, Check,
  FolderPlus, Layers, Phone, MapPin, Clock, Bell, Volume2, RotateCcw,
  Users, KeyRound, UserPlus, ShieldCheck, UserCheck, Lock,
  Sun, Moon, DollarSign, Edit3, Tag
} from 'lucide-react';
import { useAdminProducts } from '../hooks/useAdminProducts';
import { useAdminUsers } from '../hooks/useAdminUsers';
import { APPS_SCRIPT_URL } from '../hooks/useSheetProducts';
import AdminProductForm from './AdminProductForm';

export default function AdminPanel({ onLogout }) {
  const {
    products,
    categories,
    rawCategories,
    loading: loadingProducts,
    error: productError,
    addProduct,
    updateProduct,
    deleteProduct,
    addCategory,
    updateCategory,
    deleteCategory,
    refresh: refreshProducts
  } = useAdminProducts();

  const {
    users,
    currentUser,
    loading: loadingUsers,
    addUser,
    changePassword,
    deleteUser,
    refreshUsers
  } = useAdminUsers();

  // ── Tema Claro / Oscuro (Por defecto Modo Claro) ──
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem('trucco_admin_theme') || 'light';
    } catch {
      return 'light';
    }
  });

  const isDark = theme === 'dark';

  const toggleTheme = () => {
    setTheme(prev => {
      const next = prev === 'light' ? 'dark' : 'light';
      try {
        localStorage.setItem('trucco_admin_theme', next);
      } catch (e) {
        console.error(e);
      }
      return next;
    });
  };

  const [activeTab, setActiveTab] = useState('productos'); // 'productos' | 'categorias' | 'pedidos' | 'usuarios'
  const [orders, setOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  
  // Filtros de Categorías y Pedidos
  const [categorySearchQuery, setCategorySearchQuery] = useState('');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderStatusFilter, setOrderStatusFilter] = useState('all'); // 'all' | 'pending' | 'completed'

  // Modales de confirmación y edición
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleteCategoryConfirm, setDeleteCategoryConfirm] = useState(null);
  const [editingCategory, setEditingCategory] = useState(null); // { oldName: string, newName: string }
  const [deleteUserConfirm, setDeleteUserConfirm] = useState(null);
  const [deleteOrderConfirm, setDeleteOrderConfirm] = useState(null);

  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [toast, setToast] = useState(null);

  // Estados para creación y cambio de clave de usuario
  const [isChangingPassModal, setIsChangingPassModal] = useState(false);
  const [selectedUserForPass, setSelectedUserForPass] = useState(null);
  const [newPasswordVal, setNewPasswordVal] = useState('');
  const [confirmPasswordVal, setConfirmPasswordVal] = useState('');

  const [isNewUserModal, setIsNewUserModal] = useState(false);
  const [newUserForm, setNewUserForm] = useState({
    nombre: '',
    usuario: '',
    password: '',
    rol: 'admin'
  });
  
  const knownOrdersCount = useRef(0);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.35);
    } catch (e) {
      console.warn('Audio notification error:', e);
    }
  };

  useEffect(() => {
    if (productError) showToast(`Error al sincronizar: ${productError}`, 'error');
  }, [productError]);

  // Cargar pedidos desde Google Sheets y localStorage
  const loadOrders = async (silent = false) => {
    if (!silent) setLoadingOrders(true);
    try {
      const resp = await fetch(`${APPS_SCRIPT_URL}?action=getOrders&t=${Date.now()}`);
      if (resp.ok) {
        const data = await resp.json();
        if (data && Array.isArray(data.orders)) {
          if (knownOrdersCount.current > 0 && data.orders.length > knownOrdersCount.current) {
            playChime();
            showToast('🔔 ¡Nuevo pedido recibido en Google Sheets!', 'success');
          }
          knownOrdersCount.current = data.orders.length;
          setOrders(data.orders);
          localStorage.setItem('trucco_order_history', JSON.stringify(data.orders));
          if (!silent) setLoadingOrders(false);
          return;
        }
      }
    } catch (e) {
      console.warn("No se pudieron cargar pedidos de la nube, usando local:", e);
    }

    try {
      const historyStr = localStorage.getItem('trucco_order_history');
      if (historyStr) {
        const parsed = JSON.parse(historyStr);
        setOrders(Array.isArray(parsed) ? parsed : []);
      } else {
        setOrders([]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoadingOrders(false);
    }
  };

  useEffect(() => {
    loadOrders();
    const interval = setInterval(() => {
      loadOrders(true);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeTab === 'pedidos') {
      loadOrders();
    }
  }, [activeTab]);

  const markOrderStatus = async (orderId, newStatus) => {
    const updated = orders.map(o => o.id === orderId ? { ...o, status: newStatus } : o);
    setOrders(updated);
    localStorage.setItem('trucco_order_history', JSON.stringify(updated));

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'updateOrderStatus',
          orderId: String(orderId),
          status: newStatus
        })
      });
      showToast(`Pedido #${orderId} actualizado a "${newStatus === 'completed' ? 'Listo / Completado' : 'Pendiente'}".`);
    } catch (err) {
      console.warn('Error actualizando estado en Sheet:', err);
    }
  };

  const confirmDeleteOrderAction = async () => {
    if (!deleteOrderConfirm) return;
    const orderId = deleteOrderConfirm.id;
    const updated = orders.filter(o => o.id !== orderId);
    setOrders(updated);
    localStorage.setItem('trucco_order_history', JSON.stringify(updated));

    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'deleteOrder',
          orderId: String(orderId)
        })
      });
      showToast(`Pedido #${orderId} eliminado de Google Sheets.`, 'warning');
    } catch (err) {
      console.warn('Error eliminando pedido en Sheet:', err);
    } finally {
      setDeleteOrderConfirm(null);
    }
  };

  const handleSave = async (formData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        showToast(`"${formData.name}" guardado en Google Sheets.`);
      } else {
        await addProduct(formData);
        showToast(`"${formData.name}" creado en Google Sheets.`);
      }
      setView('list');
      setEditingProduct(null);
    } catch (e) {
      showToast('Hubo un error al guardar', 'error');
    }
  };

  const handleEdit = (product) => {
    setEditingProduct(product);
    setView('form');
  };

  const handleDelete = (product) => {
    setDeleteConfirm(product);
  };

  const confirmDelete = async () => {
    if (deleteConfirm) {
      try {
        await deleteProduct(deleteConfirm.id);
        showToast(`"${deleteConfirm.name}" eliminado de Google Sheets.`, 'warning');
      } catch (e) {
        showToast('Error al eliminar', 'error');
      }
      setDeleteConfirm(null);
    }
  };

  // ── GESTIÓN DE CATEGORÍAS (CRUD COMPLETO) ──
  const handleAddCategorySubmit = async (e) => {
    e.preventDefault();
    const name = newCategoryInput.trim();
    if (!name) return;
    if (rawCategories.some(c => c.toLowerCase() === name.toLowerCase())) {
      showToast(`La categoría "${name}" ya existe en el menú.`, 'warning');
      return;
    }
    try {
      await addCategory(name);
      setNewCategoryInput('');
      showToast(`Categoría "${name}" creada y guardada en Google Sheets.`);
    } catch (err) {
      showToast('Error al agregar categoría', 'error');
    }
  };

  const handleEditCategorySubmit = async (e) => {
    e.preventDefault();
    if (!editingCategory) return;
    const oldName = editingCategory.oldName.trim();
    const newName = editingCategory.newName.trim();
    if (!newName) {
      showToast('El nombre de la categoría no puede estar vacío.', 'warning');
      return;
    }
    if (oldName === newName) {
      setEditingCategory(null);
      return;
    }
    if (rawCategories.some(c => c.toLowerCase() === newName.toLowerCase() && c.toLowerCase() !== oldName.toLowerCase())) {
      showToast(`Ya existe otra categoría llamada "${newName}".`, 'warning');
      return;
    }
    try {
      await updateCategory(oldName, newName);
      showToast(`Categoría "${oldName}" renombrada a "${newName}" y actualizada en Excel.`);
      setEditingCategory(null);
    } catch (err) {
      showToast('Error al actualizar categoría', 'error');
    }
  };

  const confirmDeleteCategory = async () => {
    if (deleteCategoryConfirm) {
      const catName = deleteCategoryConfirm;
      try {
        await deleteCategory(catName);
        showToast(`Categoría "${catName}" eliminada de Google Sheets.`);
      } catch (err) {
        showToast('Error al eliminar categoría', 'error');
      }
      setDeleteCategoryConfirm(null);
    }
  };

  // Manejo de Usuarios y Claves
  const handleOpenChangePass = (user) => {
    setSelectedUserForPass(user);
    setNewPasswordVal('');
    setConfirmPasswordVal('');
    setIsChangingPassModal(true);
  };

  const handleSaveNewPassword = async (e) => {
    e.preventDefault();
    if (!selectedUserForPass) return;
    if (newPasswordVal.length < 4) {
      showToast('La contraseña debe tener mínimo 4 caracteres.', 'warning');
      return;
    }
    if (newPasswordVal !== confirmPasswordVal) {
      showToast('Las contraseñas no coinciden.', 'warning');
      return;
    }
    try {
      await changePassword(selectedUserForPass.id, newPasswordVal);
      showToast(`Contraseña de "@${selectedUserForPass.usuario}" actualizada y guardada en Excel.`);
      setIsChangingPassModal(false);
      setSelectedUserForPass(null);
      setNewPasswordVal('');
      setConfirmPasswordVal('');
    } catch (err) {
      showToast(err.message || 'Error al cambiar contraseña', 'error');
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    if (!newUserForm.usuario.trim() || !newUserForm.password.trim()) {
      showToast('Usuario y contraseña son requeridos.', 'warning');
      return;
    }
    try {
      await addUser(newUserForm);
      showToast(`Usuario "@${newUserForm.usuario}" creado y guardado en Excel.`);
      setIsNewUserModal(false);
      setNewUserForm({ nombre: '', usuario: '', password: '', rol: 'admin' });
    } catch (err) {
      showToast(err.message || 'Error al crear usuario', 'error');
    }
  };

  const confirmDeleteUser = async () => {
    if (deleteUserConfirm) {
      try {
        await deleteUser(deleteUserConfirm.id);
        showToast(`Usuario "@${deleteUserConfirm.usuario}" eliminado.`);
      } catch (err) {
        showToast(err.message || 'Error al eliminar usuario', 'error');
      }
      setDeleteUserConfirm(null);
    }
  };

  // Filtrar productos
  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCategory = filterCategory === 'Todos' || p.category === filterCategory;
    return matchSearch && matchCategory;
  });

  // Filtrar categorías
  const filteredCategories = rawCategories.filter(cat => {
    return !categorySearchQuery.trim() || cat.toLowerCase().includes(categorySearchQuery.toLowerCase().trim());
  });

  // Filtrar pedidos
  const filteredOrders = orders.filter(order => {
    const term = orderSearchQuery.toLowerCase().trim();
    const matchSearch = !term ||
      String(order.id).toLowerCase().includes(term) ||
      (order.name && order.name.toLowerCase().includes(term)) ||
      (order.phone && String(order.phone).includes(term)) ||
      (order.address && order.address.toLowerCase().includes(term)) ||
      (order.notes && order.notes.toLowerCase().includes(term));

    const isCompleted = order.status === 'completed';
    const matchStatus = 
      orderStatusFilter === 'all' ||
      (orderStatusFilter === 'pending' && !isCompleted) ||
      (orderStatusFilter === 'completed' && isCompleted);

    return matchSearch && matchStatus;
  });

  // Estadísticas globales de pedidos
  const pendingOrdersCount = orders.filter(o => o.status !== 'completed').length;
  const completedOrdersCount = orders.filter(o => o.status === 'completed').length;
  const totalSalesRevenue = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  // Estadísticas de productos / resumen
  const stats = [
    { label: 'Total productos', value: products.length, icon: Package, color: 'text-amber-500', bg: isDark ? 'bg-amber-500/10' : 'bg-amber-50' },
    { label: 'Categorías activas', value: rawCategories.length, icon: Layers, color: 'text-orange-500', bg: isDark ? 'bg-orange-500/10' : 'bg-orange-50' },
    {
      label: 'Pedidos registrados',
      value: orders.length,
      icon: ClipboardList,
      color: 'text-blue-500',
      bg: isDark ? 'bg-blue-500/10' : 'bg-blue-50',
    },
    {
      label: 'Usuarios / Admins',
      value: users.length,
      icon: Users,
      color: 'text-purple-500',
      bg: isDark ? 'bg-purple-500/10' : 'bg-purple-50',
    },
  ];

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-950 text-white' : 'bg-slate-50 text-slate-900'} flex flex-col md:flex-row font-sans transition-colors duration-200`}>
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl transition-all ${toast.type === 'success' ? 'bg-green-700 text-white border border-green-500' : toast.type === 'warning' ? 'bg-amber-600 text-white border border-amber-400' : 'bg-red-700 text-white border border-red-500'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 flex-shrink-0" />}
          <span className="text-sm font-semibold max-w-xs">{toast.message}</span>
          <button onClick={() => setToast(null)}><X className="w-4 h-4 opacity-80 hover:opacity-100" /></button>
        </div>
      )}

      {/* ── MODAL: Confirmar eliminar producto ── */}
      {deleteConfirm && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          onClick={() => setDeleteConfirm(null)}
        >
          <div 
            className={`${isDark ? 'bg-gray-900 border-red-900/60 text-white' : 'bg-white border-red-200 text-slate-900'} border rounded-3xl p-6 max-w-sm w-full shadow-2xl transition-all`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">¿Eliminar producto?</h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
              ¿Estás seguro de eliminar el producto <span className="font-bold text-amber-500">"{deleteConfirm.name}"</span> del catálogo de Google Sheets?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteConfirm(null)} 
                className={`flex-1 ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} font-bold py-2.5 rounded-xl text-sm transition`}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete} 
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg shadow-red-600/20"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Confirmar eliminar categoría ── */}
      {deleteCategoryConfirm && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          onClick={() => setDeleteCategoryConfirm(null)}
        >
          <div 
            className={`${isDark ? 'bg-gray-900 border-red-900/60 text-white' : 'bg-white border-red-200 text-slate-900'} border rounded-3xl p-6 max-w-md w-full shadow-2xl transition-all`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">¿Eliminar categoría?</h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Gestión de catálogo</p>
              </div>
            </div>

            <div className={`p-4 rounded-2xl mb-5 border ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex items-center justify-between">
                <span className="font-black text-base text-amber-500">{deleteCategoryConfirm}</span>
                <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                  products.filter(p => p.category === deleteCategoryConfirm).length > 0
                    ? 'bg-amber-400/20 text-amber-600 dark:text-amber-400'
                    : 'bg-gray-500/10 text-gray-500'
                }`}>
                  {products.filter(p => p.category === deleteCategoryConfirm).length} producto(s)
                </span>
              </div>
              {products.filter(p => p.category === deleteCategoryConfirm).length > 0 && (
                <p className={`text-xs ${isDark ? 'text-amber-400/80' : 'text-amber-700'} mt-2`}>
                  💡 Los productos vinculados a esta categoría se reasignarán automáticamente para evitar que se pierdan o queden huérfanos.
                </p>
              )}
            </div>

            <p className={`text-sm mb-6 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
              ¿Estás seguro de eliminar la categoría <span className="font-bold text-amber-500">"{deleteCategoryConfirm}"</span> de Google Sheets?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteCategoryConfirm(null)} 
                className={`flex-1 ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} font-bold py-2.5 rounded-xl text-sm transition`}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteCategory} 
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg shadow-red-600/20 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Editar / Renombrar Categoría (NUEVO - Solicitado por el usuario) ── */}
      {editingCategory && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          onClick={() => setEditingCategory(null)}
        >
          <div 
            className={`${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl p-6 max-w-md w-full shadow-2xl transition-all`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between mb-4 border-b ${isDark ? 'border-gray-800' : 'border-slate-200'} pb-3`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                  <Edit3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Editar Categoría</h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Renombrar en catálogo y Google Sheets</p>
                </div>
              </div>
              <button onClick={() => setEditingCategory(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditCategorySubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-1.5`}>
                  Nombre de la Categoría
                </label>
                <input
                  type="text"
                  value={editingCategory.newName}
                  onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })}
                  placeholder="Nuevo nombre de la categoría"
                  className={`w-full ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-semibold`}
                  required
                  autoFocus
                />
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'} mt-1.5`}>
                  💡 Todos los productos que actualmente pertenecen a "{editingCategory.oldName}" se actualizarán automáticamente con este nuevo nombre.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className={`flex-1 ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} font-bold py-2.5 rounded-xl text-sm transition`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={!editingCategory.newName.trim()}
                  className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-2.5 rounded-xl text-sm transition shadow-lg shadow-amber-400/20 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" /> Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Confirmar eliminar pedido ── */}
      {deleteOrderConfirm && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          onClick={() => setDeleteOrderConfirm(null)}
        >
          <div 
            className={`${isDark ? 'bg-gray-900 border-red-900/60 text-white' : 'bg-white border-red-200 text-slate-900'} border rounded-3xl p-6 max-w-md w-full shadow-2xl transition-all`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">¿Eliminar pedido?</h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Confirmación requerida</p>
              </div>
            </div>
            
            <div className={`p-4 rounded-2xl mb-5 border ${isDark ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between items-center mb-1">
                <span className="font-mono font-bold text-amber-500">#{deleteOrderConfirm.id}</span>
                <span className="font-black text-sm text-green-500">${Number(deleteOrderConfirm.total || 0).toLocaleString('es-CO')}</span>
              </div>
              <p className="font-bold text-sm">{deleteOrderConfirm.name || 'Cliente sin nombre'}</p>
              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'} mt-1`}>
                {deleteOrderConfirm.orderType === 'domicilio' ? '🛵 Domicilio' : '🏪 Recoger en local'} {deleteOrderConfirm.phone ? `• Tel: ${deleteOrderConfirm.phone}` : ''}
              </p>
            </div>

            <p className={`text-sm mb-6 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
              ¿Estás seguro de que deseas eliminar este pedido? Se removerá del historial y de la pestaña <code>pedidos</code> en Google Sheets.
            </p>

            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteOrderConfirm(null)} 
                className={`flex-1 ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} font-bold py-2.5 rounded-xl text-sm transition`}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteOrderAction} 
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg shadow-red-600/20 flex items-center justify-center gap-1.5"
              >
                <Trash2 className="w-4 h-4" /> Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Confirmar eliminar usuario ── */}
      {deleteUserConfirm && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          onClick={() => setDeleteUserConfirm(null)}
        >
          <div 
            className={`${isDark ? 'bg-gray-900 border-red-900/60 text-white' : 'bg-white border-red-200 text-slate-900'} border rounded-3xl p-6 max-w-sm w-full shadow-2xl transition-all`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold text-lg">¿Eliminar usuario?</h3>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Perderá acceso al sistema</p>
              </div>
            </div>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-300' : 'text-slate-600'}`}>
              ¿Estás seguro de eliminar al usuario <span className="font-bold text-amber-500">@{deleteUserConfirm.usuario}</span> ({deleteUserConfirm.nombre})?
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setDeleteUserConfirm(null)} 
                className={`flex-1 ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} font-bold py-2.5 rounded-xl text-sm transition`}
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDeleteUser} 
                className="flex-1 bg-red-600 hover:bg-red-500 text-white font-bold py-2.5 rounded-xl text-sm transition shadow-lg shadow-red-600/20"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: Cambiar Contraseña ── */}
      {isChangingPassModal && selectedUserForPass && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          onClick={() => setIsChangingPassModal(false)}
        >
          <div 
            className={`${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl p-6 max-w-md w-full shadow-2xl transition-all`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between mb-4 border-b ${isDark ? 'border-gray-800' : 'border-slate-200'} pb-3`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                  <KeyRound className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Cambiar Contraseña</h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Usuario: @{selectedUserForPass.usuario}</p>
                </div>
              </div>
              <button onClick={() => setIsChangingPassModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewPassword} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-1.5`}>Nueva Contraseña</label>
                <input
                  type="password"
                  value={newPasswordVal}
                  onChange={(e) => setNewPasswordVal(e.target.value)}
                  placeholder="Mínimo 4 caracteres"
                  className={`w-full ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm`}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className={`block text-xs font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-1.5`}>Confirmar Nueva Contraseña</label>
                <input
                  type="password"
                  value={confirmPasswordVal}
                  onChange={(e) => setConfirmPasswordVal(e.target.value)}
                  placeholder="Escribe la misma contraseña"
                  className={`w-full ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm`}
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsChangingPassModal(false)}
                  className={`flex-1 ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} font-bold py-2.5 rounded-xl text-sm transition`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-2.5 rounded-xl text-sm transition shadow-lg shadow-amber-400/20"
                >
                  Actualizar Clave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Crear Nuevo Usuario ── */}
      {isNewUserModal && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4"
          onClick={() => setIsNewUserModal(false)}
        >
          <div 
            className={`${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl p-6 max-w-md w-full shadow-2xl transition-all`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`flex items-center justify-between mb-4 border-b ${isDark ? 'border-gray-800' : 'border-slate-200'} pb-3`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/10 text-amber-500 rounded-xl flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Crear Nuevo Usuario</h3>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Se guardará en la pestaña <code>usuarios</code></p>
                </div>
              </div>
              <button onClick={() => setIsNewUserModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div>
                <label className={`block text-xs font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-1.5`}>Nombre Completo</label>
                <input
                  type="text"
                  value={newUserForm.nombre}
                  onChange={(e) => setNewUserForm({ ...newUserForm, nombre: e.target.value })}
                  placeholder="Ej. Juan Pérez"
                  className={`w-full ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-1.5`}>Nombre de Usuario (Login)</label>
                <input
                  type="text"
                  value={newUserForm.usuario}
                  onChange={(e) => setNewUserForm({ ...newUserForm, usuario: e.target.value })}
                  placeholder="Ej. juan o cajero1"
                  className={`w-full ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-1.5`}>Contraseña</label>
                <input
                  type="password"
                  value={newUserForm.password}
                  onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                  placeholder="Contraseña de acceso"
                  className={`w-full ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm`}
                  required
                />
              </div>

              <div>
                <label className={`block text-xs font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-1.5`}>Rol de Usuario</label>
                <select
                  value={newUserForm.rol}
                  onChange={(e) => setNewUserForm({ ...newUserForm, rol: e.target.value })}
                  className={`w-full ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-slate-50 border-slate-300 text-slate-900'} border rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm cursor-pointer`}
                >
                  <option value="admin">Administrador (Acceso Total)</option>
                  <option value="cajero">Cajero / Operador</option>
                  <option value="cocina">Cocina / Preparación</option>
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewUserModal(false)}
                  className={`flex-1 ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} font-bold py-2.5 rounded-xl text-sm transition`}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black py-2.5 rounded-xl text-sm transition shadow-lg shadow-amber-400/20"
                >
                  Guardar Usuario
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: Formulario de Producto (Agregar / Editar) ── */}
      {view === 'form' && (
        <AdminProductForm
          product={editingProduct}
          categories={categories}
          theme={theme}
          onSave={handleSave}
          onCancel={() => { setView('list'); setEditingProduct(null); }}
        />
      )}

      {/* ── MODAL: Ver Detalles de Producto ── */}
      {viewingProduct && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[70] flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setViewingProduct(null)}
        >
          <div 
            className={`${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={`relative h-64 ${isDark ? 'bg-gray-800' : 'bg-slate-100'}`}>
              {viewingProduct.image ? (
                <img src={viewingProduct.image} alt={viewingProduct.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ChefHat className="w-16 h-16 text-gray-400" />
                </div>
              )}
              <div className={`absolute inset-0 bg-gradient-to-t ${isDark ? 'from-gray-900' : 'from-white'} to-transparent`} />
              <button 
                onClick={() => setViewingProduct(null)}
                className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <span className="bg-amber-400/20 text-amber-600 dark:text-amber-400 text-xs font-black px-3 py-1 rounded-full border border-amber-400/30 uppercase tracking-wider">
                  {viewingProduct.category}
                </span>
                <h2 className="text-2xl font-black mt-3 mb-2">{viewingProduct.name}</h2>
                <p className={`${isDark ? 'text-gray-400' : 'text-slate-600'} text-sm leading-relaxed`}>{viewingProduct.description}</p>
              </div>

              <div className={`${isDark ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-200'} rounded-2xl p-4 border`}>
                <h3 className={`font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'} mb-3 text-sm flex items-center gap-2`}>
                  <Package className="w-4 h-4 text-amber-500" /> Variantes y Precios
                </h3>
                <div className="space-y-2">
                  {viewingProduct.variants.map((v, i) => (
                    <div key={i} className={`flex justify-between items-center py-2 border-b ${isDark ? 'border-gray-800' : 'border-slate-200'} last:border-0 last:pb-0`}>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>{v.label}</span>
                      <span className="font-bold text-amber-500">${v.price.toLocaleString('es-CO')}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button 
                onClick={() => setViewingProduct(null)}
                className={`w-full mt-6 ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'} font-bold py-3 rounded-xl transition text-sm`}
              >
                Cerrar detalles
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ BARRA LATERAL (SIDEBAR DESKTOP) ══════════════ */}
      <aside className={`hidden md:flex w-64 flex-col ${isDark ? 'bg-gray-900 border-gray-800 text-gray-200' : 'bg-white border-slate-200 text-slate-800'} border-r transition-colors duration-200`}>
        <div className={`p-6 border-b ${isDark ? 'border-gray-800' : 'border-slate-200'} flex flex-col items-center justify-center gap-2`}>
          <img src="/logo.png" alt="Comidas Rápidas Trucco" className="h-16 w-auto object-contain drop-shadow-md" />
          <p className="text-xs text-amber-500 font-extrabold tracking-wider">TRUCCO ADMIN PANEL</p>
          {currentUser && (
            <span className={`text-[11px] ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-slate-100 text-slate-600 border-slate-200'} px-2.5 py-0.5 rounded-full border font-medium`}>
              👤 @{currentUser.usuario}
            </span>
          )}
        </div>

        <div className="flex-1 py-6 px-4 space-y-2">
          {/* Botón selector de Modo Claro / Oscuro */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition text-xs ${
              isDark 
                ? 'bg-gray-800 hover:bg-gray-700 text-gray-200 border border-gray-700' 
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
            }`}
            title="Haz clic para alternar entre Modo Claro y Modo Oscuro"
          >
            <div className="flex items-center gap-2.5">
              {isDark ? <Moon className="w-4 h-4 text-amber-400" /> : <Sun className="w-4 h-4 text-amber-500" />}
              <span>{isDark ? 'Modo Oscuro' : 'Modo Claro'}</span>
            </div>
            <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-black ${
              isDark ? 'bg-amber-400/20 text-amber-400' : 'bg-amber-400 text-slate-950 shadow-sm'
            }`}>
              Cambiar
            </span>
          </button>

          <div className={`h-px ${isDark ? 'bg-gray-800' : 'bg-slate-200'} my-2`}></div>

          {/* Navegación por tabs */}
          <button 
            onClick={() => setActiveTab('productos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition text-sm ${
              activeTab === 'productos' 
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' 
                : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Package className="w-5 h-5" /> Productos ({products.length})
          </button>

          <button 
            onClick={() => setActiveTab('categorias')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition text-sm ${
              activeTab === 'categorias' 
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' 
                : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="w-5 h-5" /> Categorías ({rawCategories.length})
          </button>
          
          <button 
            onClick={() => setActiveTab('pedidos')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-bold transition text-sm ${
              activeTab === 'pedidos' 
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' 
                : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5" /> Pedidos
            </div>
            {pendingOrdersCount > 0 && (
              <span className={`text-xs font-black px-2 py-0.5 rounded-full ${
                activeTab === 'pedidos' ? 'bg-slate-950 text-amber-400' : 'bg-amber-400 text-slate-950 animate-bounce'
              }`}>
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('usuarios')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition text-sm ${
              activeTab === 'usuarios' 
                ? 'bg-amber-400 text-slate-950 shadow-md shadow-amber-400/20' 
                : isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Users className="w-5 h-5" /> Usuarios / Claves ({users.length})
          </button>

          <a 
            href="/" 
            target="_blank" 
            rel="noreferrer" 
            className={`w-full flex items-center gap-3 px-4 py-3 ${isDark ? 'text-gray-400 hover:text-white hover:bg-gray-800 border-gray-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200'} rounded-xl font-semibold transition mt-4 border-t pt-4 text-sm`}
          >
            <ExternalLink className="w-5 h-5 text-amber-500" /> Ver Menú Público
          </a>
        </div>

        <div className={`p-4 border-t ${isDark ? 'border-gray-800' : 'border-slate-200'}`}>
          <button 
            onClick={onLogout} 
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-500 hover:text-red-600 hover:bg-red-500/10 rounded-xl transition font-bold text-sm"
          >
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ══════════════ HEADER MÓVIL ══════════════ */}
      <div className={`md:hidden ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} border-b sticky top-0 z-10 flex flex-col transition-colors duration-200`}>
        <div className={`px-4 py-3 flex items-center justify-between border-b ${isDark ? 'border-gray-800' : 'border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Trucco" className="h-8 w-auto object-contain drop-shadow-sm" />
            <h1 className="font-bold text-sm">Admin Panel</h1>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={toggleTheme}
              className={`p-2 rounded-xl transition ${isDark ? 'bg-gray-800 text-amber-400' : 'bg-slate-100 text-amber-600'}`}
              title="Cambiar tema"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button onClick={onLogout} className="text-red-500 p-2 hover:bg-red-500/10 rounded-xl transition">
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex overflow-x-auto scrollbar-none">
          <button 
            onClick={() => setActiveTab('productos')}
            className={`flex-1 min-w-[90px] py-3 text-xs font-bold border-b-2 transition ${activeTab === 'productos' ? 'border-amber-400 text-amber-500 font-black' : isDark ? 'border-transparent text-gray-400' : 'border-transparent text-slate-500'}`}
          >
            Platos ({products.length})
          </button>
          <button 
            onClick={() => setActiveTab('categorias')}
            className={`flex-1 min-w-[90px] py-3 text-xs font-bold border-b-2 transition ${activeTab === 'categorias' ? 'border-amber-400 text-amber-500 font-black' : isDark ? 'border-transparent text-gray-400' : 'border-transparent text-slate-500'}`}
          >
            Categorías
          </button>
          <button 
            onClick={() => setActiveTab('pedidos')}
            className={`flex-1 min-w-[90px] py-3 text-xs font-bold border-b-2 transition ${activeTab === 'pedidos' ? 'border-amber-400 text-amber-500 font-black' : isDark ? 'border-transparent text-gray-400' : 'border-transparent text-slate-500'}`}
          >
            Pedidos ({orders.length})
          </button>
          <button 
            onClick={() => setActiveTab('usuarios')}
            className={`flex-1 min-w-[90px] py-3 text-xs font-bold border-b-2 transition ${activeTab === 'usuarios' ? 'border-amber-400 text-amber-500 font-black' : isDark ? 'border-transparent text-gray-400' : 'border-transparent text-slate-500'}`}
          >
            Usuarios ({users.length})
          </button>
        </div>
      </div>

      {/* ══════════════ CONTENIDO PRINCIPAL (FLUIDO COMPLETO) ══════════════ */}
      <main className={`flex-1 flex flex-col h-screen overflow-y-auto ${isDark ? 'bg-gray-950/60' : 'bg-slate-100/60'} w-full transition-colors duration-200`}>
        
        {/* ══════════════ TAB DE PRODUCTOS ══════════════ */}
        {activeTab === 'productos' && (
        <div className="p-4 sm:p-6 md:p-8 xl:p-10 space-y-6 md:space-y-8 w-full max-w-[1920px] mx-auto">
          
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h2 className={`text-2xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Menú de Productos</h2>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Administra el catálogo y los precios de Comidas Rápidas Trucco</p>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  localStorage.removeItem('trucco_sheet_cache');
                  localStorage.removeItem('trucco_categories_cache');
                  localStorage.removeItem('trucco_sheet_cache_time');
                  refreshProducts();
                  showToast('Actualizando datos desde Google Sheets...', 'success');
                }}
                className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm'} font-bold p-3 md:px-4 rounded-xl transition flex items-center justify-center gap-2`}
                title="Forzar actualización desde Excel"
              >
                <RefreshCw className={`w-5 h-5 ${loadingProducts ? 'animate-spin text-amber-500' : ''}`} />
                <span className="hidden md:inline text-sm">Actualizar</span>
              </button>
              <button 
                onClick={() => { setEditingProduct(null); setView('form'); }}
                className="bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black py-3 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 text-sm"
              >
                <Plus className="w-5 h-5" /> Agregar producto
              </button>
            </div>
          </div>

          {loadingProducts && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm bg-amber-400/10 px-4 py-3 rounded-xl border border-amber-400/20 font-medium">
              <RefreshCw className="w-4 h-4 animate-spin" />
              Sincronizando cambios con Google Sheets...
            </div>
          )}

          {/* Estadísticas */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
            {stats.map((stat, i) => (
              <div key={i} className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-2xl p-5 hover:shadow-md transition`}>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                </div>
                <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                <div className={`text-sm font-semibold ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Buscador y filtro */}
          <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} border p-2 rounded-2xl flex flex-col md:flex-row gap-2 w-full`}>
            <div className="flex-1 relative">
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar por nombre o categoría..."
                className={`w-full bg-transparent ${isDark ? 'text-white placeholder-gray-500' : 'text-slate-900 placeholder-slate-400'} rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-sm font-medium`}
              />
            </div>
            <div className={`w-full md:w-72 border-t md:border-t-0 md:border-l ${isDark ? 'border-gray-800' : 'border-slate-200'} p-1`}>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className={`w-full bg-transparent ${isDark ? 'text-gray-300' : 'text-slate-700'} rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-400/50 text-sm font-medium cursor-pointer`}
              >
                <option value="Todos" className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-slate-900'}>Todas las categorías ({products.length})</option>
                {rawCategories.map(cat => {
                  const count = products.filter(p => p.category === cat).length;
                  return (
                    <option key={cat} value={cat} className={isDark ? 'bg-gray-900 text-white' : 'bg-white text-slate-900'}>
                      {cat} ({count})
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          {/* Grid de productos adaptativo a todo el ancho */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[2100px]:grid-cols-6 gap-5 w-full">
            {filteredProducts.length === 0 ? (
              <div className={`col-span-full text-center py-16 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} border rounded-3xl`}>
                <ChefHat className={`w-16 h-16 ${isDark ? 'text-gray-700' : 'text-slate-300'} mx-auto mb-4`} />
                <h3 className={`text-xl font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>No se encontraron productos</h3>
                <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>Prueba cambiando los términos de búsqueda o agrega un nuevo producto.</p>
              </div>
            ) : (
              filteredProducts.map((product) => (
                <div key={product.id} className={`${isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'} border rounded-3xl flex flex-col transition hover:shadow-xl overflow-hidden relative`}>
                  <div className={`relative h-48 ${isDark ? 'bg-gray-800' : 'bg-slate-100'} flex items-center justify-center overflow-hidden shrink-0`}>
                    <img 
                      src={product.image} 
                      alt={product.name} 
                      className="w-full h-full object-cover"
                      loading="lazy"
                      onError={(e) => { e.target.src = ''; e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-5xl">🍔</div>'; }}
                    />
                    <div className="absolute top-3 left-3 bg-amber-400 text-slate-950 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                      {product.category}
                    </div>
                  </div>

                  <div className="p-5 flex flex-col flex-1">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg leading-snug mb-2 min-h-[3rem] flex items-center">{product.name}</h3>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'} mb-4 line-clamp-2 min-h-[2.5rem]`}>{product.description}</p>
                    </div>

                    <div className={`flex items-center justify-between mt-auto pt-4 border-t ${isDark ? 'border-gray-800' : 'border-slate-100'} mb-4 h-14`}>
                      <div className="flex flex-col">
                        {product.variants.length === 1 ? (
                          <span className="text-green-600 dark:text-green-400 font-black text-lg">
                            ${product.variants[0].price.toLocaleString('es-CO')}
                          </span>
                        ) : (
                          <span className="text-green-600 dark:text-green-400 font-black text-lg">
                            ${Math.min(...product.variants.map(v => v.price)).toLocaleString('es-CO')} +
                          </span>
                        )}
                        {product.variants.length > 1 && (
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'} font-medium`}>{product.variants.length} opciones</span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      <button
                        onClick={() => setViewingProduct(product)}
                        className={`flex items-center justify-center p-2.5 ${isDark ? 'text-green-400 hover:text-green-300 bg-green-900/20 hover:bg-green-900/40' : 'text-green-700 hover:text-green-800 bg-green-50 hover:bg-green-100 border border-green-200'} rounded-xl transition font-bold`}
                        title="Ver detalles"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className={`flex items-center justify-center p-2.5 ${isDark ? 'text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/40' : 'text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 border border-blue-200'} rounded-xl transition font-bold`}
                        title="Editar producto"
                      >
                        <Pencil className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(product)}
                        className={`flex items-center justify-center p-2.5 ${isDark ? 'text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40' : 'text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200'} rounded-xl transition font-bold`}
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          
        </div>
        )}

        {/* ══════════════ TAB DE CATEGORÍAS (CRUD COMPLETO Y MEJORADO) ══════════════ */}
        {activeTab === 'categorias' && (
          <div className="p-4 sm:p-6 md:p-8 xl:p-10 space-y-6 md:space-y-8 w-full max-w-[1920px] mx-auto">
            {/* Cabecera */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className={`text-2xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-3`}>
                  <Layers className="text-amber-500" /> Categorías del Menú
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Crea, edita, renombra o elimina categorías sincronizadas directamente con Google Sheets (pestaña <code>categorias</code>).
                </p>
              </div>

              <button 
                onClick={() => {
                  localStorage.removeItem('trucco_categories_cache');
                  localStorage.removeItem('trucco_sheet_cache');
                  refreshProducts();
                  showToast('Actualizando categorías desde Google Sheets...', 'success');
                }}
                className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm'} font-bold p-3 md:px-4 rounded-xl transition flex items-center justify-center gap-2 self-start md:self-auto text-sm`}
              >
                <RefreshCw className={`w-5 h-5 ${loadingProducts ? 'animate-spin text-amber-500' : ''}`} />
                <span>Actualizar</span>
              </button>
            </div>

            {/* Formulario de Crear Categoría */}
            <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} border p-6 rounded-3xl w-full`}>
              <h3 className="text-base sm:text-lg font-black mb-3 flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-amber-500" /> Crear Nueva Categoría
              </h3>
              <form onSubmit={handleAddCategorySubmit} className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  value={newCategoryInput}
                  onChange={(e) => setNewCategoryInput(e.target.value)}
                  placeholder="Nombre de la nueva categoría (Ej. Bebidas, Desgranados, Combos Especiales...)"
                  className={`flex-1 ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'} border rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-amber-400 text-sm font-semibold`}
                />
                <button
                  type="submit"
                  disabled={!newCategoryInput.trim() || loadingProducts}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-6 py-3 rounded-xl transition flex items-center justify-center gap-2 disabled:opacity-50 text-sm shadow-md shadow-amber-400/20"
                >
                  <Plus className="w-5 h-5" /> Guardar Categoría
                </button>
              </form>
              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-slate-400'} mt-2`}>
                Esta categoría aparecerá de inmediato en los filtros de la carta, en el formulario de creación de productos y en la página web pública.
              </p>
            </div>

            {/* Buscador de categorías si hay muchas */}
            {rawCategories.length > 6 && (
              <div className="relative max-w-md">
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={categorySearchQuery}
                  onChange={(e) => setCategorySearchQuery(e.target.value)}
                  placeholder="Buscar categoría..."
                  className={`w-full ${isDark ? 'bg-gray-900 border-gray-800 text-white' : 'bg-white border-slate-200 text-slate-900'} border rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400`}
                />
              </div>
            )}

            {/* Grilla de Categorías con botones de Editar y Eliminar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 w-full">
              {filteredCategories.map((cat, idx) => {
                const prodCount = products.filter(p => p.category === cat).length;
                return (
                  <div key={cat} className={`${isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'} border p-5 rounded-3xl flex flex-col justify-between transition group hover:shadow-md`}>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-2xl ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'} flex items-center justify-center font-black text-sm shrink-0`}>
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-black text-base leading-snug">{cat}</h4>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                            {prodCount} {prodCount === 1 ? 'producto' : 'productos'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center gap-2 pt-3 border-t ${isDark ? 'border-gray-800' : 'border-slate-100'}`}>
                      {/* Botón Editar / Renombrar */}
                      <button
                        onClick={() => setEditingCategory({ oldName: cat, newName: cat })}
                        className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-bold transition ${
                          isDark 
                            ? 'bg-blue-900/20 text-blue-400 hover:bg-blue-900/40' 
                            : 'bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200'
                        }`}
                        title={`Editar / Renombrar categoría "${cat}"`}
                      >
                        <Pencil className="w-3.5 h-3.5" /> Editar
                      </button>

                      {/* Botón Eliminar */}
                      <button
                        onClick={() => setDeleteCategoryConfirm(cat)}
                        className={`p-2 rounded-xl text-xs transition ${
                          isDark 
                            ? 'text-red-400 hover:bg-red-900/30' 
                            : 'text-red-600 hover:bg-red-50 border border-red-200'
                        }`}
                        title={`Eliminar categoría "${cat}"`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════ TAB DE PEDIDOS (MEJORADO & OPTIMIZADO) ══════════════ */}
        {activeTab === 'pedidos' && (
          <div className="p-4 sm:p-6 md:p-8 xl:p-10 space-y-6 md:space-y-8 w-full max-w-[1920px] mx-auto">
            {/* Header de pedidos */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h1 className={`text-2xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-3`}>
                  <ClipboardList className="text-amber-500" /> Pedidos en Tiempo Real
                </h1>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Pedidos recibidos automáticamente desde WhatsApp y registrados en la pestaña <code>pedidos</code>.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={() => {
                    playChime();
                    showToast('Prueba de sonido ejecutada con éxito 🔔');
                  }}
                  className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 shadow-sm'} p-3 rounded-xl transition flex items-center gap-2 text-sm font-semibold`}
                  title="Probar sonido de notificación"
                >
                  <Volume2 className="w-4 h-4 text-amber-500" />
                  <span className="hidden sm:inline">Probar timbre</span>
                </button>

                <button 
                  onClick={() => loadOrders(false)}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 text-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingOrders ? 'animate-spin' : ''}`} />
                  <span>Refrescar Pedidos</span>
                </button>
              </div>
            </div>

            {/* Tarjetas de Resumen de Pedidos */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 w-full">
              <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-2xl p-4 sm:p-5 flex items-center justify-between`}>
                <div>
                  <p className={`text-xs font-bold uppercase ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Total Pedidos</p>
                  <h3 className="text-2xl font-black mt-1">{orders.length}</h3>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${isDark ? 'bg-blue-500/10 text-blue-400' : 'bg-blue-50 text-blue-600'} flex items-center justify-center font-bold`}>
                  <ClipboardList className="w-6 h-6" />
                </div>
              </div>

              <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-2xl p-4 sm:p-5 flex items-center justify-between`}>
                <div>
                  <p className={`text-xs font-bold uppercase ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Pendientes</p>
                  <h3 className="text-2xl font-black text-amber-500 mt-1">{pendingOrdersCount}</h3>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${isDark ? 'bg-amber-500/10 text-amber-400' : 'bg-amber-50 text-amber-600'} flex items-center justify-center font-bold relative`}>
                  {pendingOrdersCount > 0 && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />}
                  <Bell className="w-6 h-6" />
                </div>
              </div>

              <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-2xl p-4 sm:p-5 flex items-center justify-between`}>
                <div>
                  <p className={`text-xs font-bold uppercase ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Completados</p>
                  <h3 className="text-2xl font-black text-green-500 mt-1">{completedOrdersCount}</h3>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${isDark ? 'bg-green-500/10 text-green-400' : 'bg-green-50 text-green-600'} flex items-center justify-center font-bold`}>
                  <CheckCircle className="w-6 h-6" />
                </div>
              </div>

              <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} border rounded-2xl p-4 sm:p-5 flex items-center justify-between`}>
                <div>
                  <p className={`text-xs font-bold uppercase ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Ventas Totales</p>
                  <h3 className="text-2xl font-black text-amber-500 mt-1">${totalSalesRevenue.toLocaleString('es-CO')}</h3>
                </div>
                <div className={`w-12 h-12 rounded-2xl ${isDark ? 'bg-purple-500/10 text-purple-400' : 'bg-purple-50 text-purple-600'} flex items-center justify-center font-bold`}>
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
            </div>

            {/* Barra de Filtros y Búsqueda de Pedidos */}
            <div className={`${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200 shadow-sm'} border p-3 rounded-2xl flex flex-col md:flex-row gap-3 w-full items-center justify-between`}>
              {/* Buscador */}
              <div className="relative w-full md:w-96">
                <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={orderSearchQuery}
                  onChange={(e) => setOrderSearchQuery(e.target.value)}
                  placeholder="Buscar por #ID, cliente, celular o dirección..."
                  className={`w-full ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-slate-50 border-slate-300 text-slate-900 placeholder-slate-400'} border rounded-xl pl-10 pr-4 py-2 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 font-semibold`}
                />
              </div>

              {/* Botones de Filtro de Estado */}
              <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto">
                <button
                  onClick={() => setOrderStatusFilter('all')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    orderStatusFilter === 'all'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                      : isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Todos ({orders.length})
                </button>

                <button
                  onClick={() => setOrderStatusFilter('pending')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    orderStatusFilter === 'pending'
                      ? 'bg-amber-400 text-slate-950 font-black shadow-sm'
                      : isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  🔔 Pendientes ({pendingOrdersCount})
                </button>

                <button
                  onClick={() => setOrderStatusFilter('completed')}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    orderStatusFilter === 'completed'
                      ? 'bg-green-600 text-white font-black shadow-sm'
                      : isDark ? 'bg-gray-800 text-gray-400 hover:text-white' : 'bg-slate-100 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ✅ Completados ({completedOrdersCount})
                </button>
              </div>
            </div>

            {/* Grid de Pedidos Responsivo */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 min-[1900px]:grid-cols-5 gap-5 w-full">
              {filteredOrders.length === 0 ? (
                <div className={`col-span-full text-center py-16 ${isDark ? 'bg-gray-900 border-gray-800' : 'bg-white border-slate-200'} rounded-3xl border shadow-sm`}>
                  <ClipboardList className={`w-16 h-16 ${isDark ? 'text-gray-700' : 'text-slate-300'} mx-auto mb-4`} />
                  <h3 className={`text-xl font-bold ${isDark ? 'text-gray-300' : 'text-slate-700'}`}>No se encontraron pedidos</h3>
                  <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-slate-400'}`}>
                    {orders.length === 0 
                      ? 'Cuando un cliente envíe un pedido por WhatsApp, aparecerá aquí automáticamente.' 
                      : 'No hay pedidos que coincidan con los filtros de búsqueda aplicados.'}
                  </p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isCompleted = order.status === 'completed';
                  return (
                    <div 
                      key={order.id} 
                      className={`flex flex-col ${
                        isDark 
                          ? isCompleted ? 'bg-gray-900/80 border-green-800/30 opacity-80' : 'bg-gray-900 border-amber-500/40 shadow-xl shadow-amber-500/5' 
                          : isCompleted ? 'bg-white border-slate-200 opacity-90' : 'bg-white border-amber-400 shadow-md ring-1 ring-amber-400/20'
                      } border rounded-3xl p-5 md:p-6 transition hover:shadow-lg`}
                    >
                      {/* Cabecera de la tarjeta */}
                      <div className="flex justify-between items-start mb-4 gap-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-mono font-black text-amber-500 text-sm">
                              #{order.id}
                            </span>
                            {isCompleted ? (
                              <span className="bg-green-500/10 text-green-600 dark:text-green-400 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-green-500/20 font-bold">
                                <Check className="w-3 h-3"/> Listo
                              </span>
                            ) : (
                              <span className="bg-amber-400/20 text-amber-600 dark:text-amber-400 text-xs px-2.5 py-0.5 rounded-full flex items-center gap-1 border border-amber-400/40 font-black animate-pulse">
                                🔔 Pendiente
                              </span>
                            )}
                          </div>
                          <h3 className="text-base sm:text-lg font-black leading-snug">
                            {order.name || 'Cliente'}
                          </h3>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-slate-500'} mt-0.5 flex items-center gap-1`}>
                            <Clock className="w-3.5 h-3.5" /> {order.date} {order.time ? `• ${order.time}` : ''}
                          </p>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="font-black text-xl text-green-600 dark:text-green-400">
                            ${Number(order.total || 0).toLocaleString('es-CO')}
                          </span>
                        </div>
                      </div>
                      
                      {/* Información de entrega y contacto */}
                      <div className={`space-y-3 text-sm mb-4 ${isDark ? 'bg-gray-950 border-gray-800 text-gray-300' : 'bg-slate-50 border-slate-200 text-slate-700'} p-4 rounded-2xl border`}>
                        <div className="flex flex-col gap-1.5 text-xs sm:text-sm">
                          <p className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-green-500 shrink-0" />
                            <strong>Teléfono:</strong> 
                            {order.phone ? (
                              <a 
                                href={`https://wa.me/57${String(order.phone).replace(/\D/g, '')}`} 
                                target="_blank" 
                                rel="noreferrer" 
                                className="text-green-600 dark:text-green-400 font-bold hover:underline"
                              >
                                {order.phone}
                              </a>
                            ) : (
                              <span className="text-gray-400 italic">No especificado</span>
                            )}
                          </p>
                          <p className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-amber-500 shrink-0" />
                            <strong>Modalidad:</strong> {order.orderType === 'domicilio' ? '🛵 Domicilio' : '🏪 Recoger en local'}
                          </p>
                          {order.address && (
                            <p className="ml-6 text-xs leading-relaxed">
                              <strong>Dirección:</strong> {order.address}
                            </p>
                          )}
                          {order.notes && (
                            <p className={`ml-6 text-xs italic ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                              <strong>Notas:</strong> {order.notes}
                            </p>
                          )}
                        </div>

                        {/* Detalle de platos */}
                        <div className={`border-t ${isDark ? 'border-gray-800' : 'border-slate-200'} pt-3`}>
                          <strong className={`block ${isDark ? 'text-gray-400' : 'text-slate-500'} text-[11px] uppercase tracking-wider mb-2`}>
                            Detalle de platos:
                          </strong>
                          {Array.isArray(order.items) && order.items.length > 0 ? (
                            <ul className="space-y-1.5 text-xs">
                              {order.items.map((item, i) => (
                                <li key={i} className={`flex justify-between border-b ${isDark ? 'border-gray-800/60' : 'border-slate-200/60'} pb-1 last:border-0`}>
                                  <span className="font-medium"><strong className="text-amber-500">{item.quantity}x</strong> {item.name} {item.variantLabel && item.variantLabel !== item.name ? `(${item.variantLabel})` : ''}</span>
                                  <span className="font-semibold text-gray-500 dark:text-gray-400">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                                </li>
                              ))}
                            </ul>
                          ) : (
                            <p className="text-xs text-amber-600 dark:text-amber-300 font-medium">{order.itemsSummary || 'Ver detalle en mensaje de WhatsApp'}</p>
                          )}
                        </div>
                      </div>

                      {/* Botones de acción del pedido */}
                      <div className={`flex gap-2 justify-end mt-auto pt-3 border-t ${isDark ? 'border-gray-800' : 'border-slate-100'}`}>
                        {!isCompleted ? (
                          <button
                            onClick={() => markOrderStatus(order.id, 'completed')}
                            className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition text-xs shadow-md shadow-green-600/20"
                          >
                            <Check className="w-4 h-4" /> Marcar Listo
                          </button>
                        ) : (
                          <button
                            onClick={() => markOrderStatus(order.id, 'pending')}
                            className={`flex items-center gap-1.5 px-3 py-2 ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-300' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'} font-semibold rounded-xl transition text-xs`}
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reabrir
                          </button>
                        )}
                        <button
                          onClick={() => setDeleteOrderConfirm(order)}
                          className={`flex items-center gap-1.5 px-3 py-2 ${isDark ? 'bg-red-900/20 text-red-400 hover:bg-red-900/40' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'} rounded-xl transition text-xs font-bold`}
                          title="Eliminar pedido con confirmación"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Eliminar
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ══════════════ TAB DE USUARIOS Y CLAVES ══════════════ */}
        {activeTab === 'usuarios' && (
          <div className="p-4 sm:p-6 md:p-8 xl:p-10 space-y-6 md:space-y-8 w-full max-w-[1920px] mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className={`text-2xl md:text-3xl font-black ${isDark ? 'text-white' : 'text-slate-900'} flex items-center gap-3`}>
                  <ShieldCheck className="text-amber-500" /> Usuarios y Contraseñas
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                  Administra las cuentas de acceso y cambia contraseñas sincronizadas directamente con Google Sheets (pestaña <code>usuarios</code>).
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => {
                    localStorage.removeItem('trucco_users_cache');
                    refreshUsers();
                    showToast('Actualizando usuarios desde Google Sheets...', 'success');
                  }}
                  className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 text-white' : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 shadow-sm'} font-bold p-3 md:px-4 rounded-xl transition flex items-center justify-center gap-2 text-sm`}
                >
                  <RefreshCw className={`w-4 h-4 ${loadingUsers ? 'animate-spin text-amber-500' : ''}`} />
                  <span>Actualizar</span>
                </button>

                <button 
                  onClick={() => setIsNewUserModal(true)}
                  className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black px-4 py-3 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 text-sm"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Nuevo Usuario</span>
                </button>
              </div>
            </div>

            {/* Tarjeta de Sesión Actual */}
            {currentUser && (
              <div className={`${isDark ? 'bg-gradient-to-r from-amber-950/30 via-gray-900 to-gray-900 border-amber-500/30' : 'bg-gradient-to-r from-amber-50 via-white to-white border-amber-300 shadow-md'} border p-6 rounded-3xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 w-full`}>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-400/20 shrink-0">
                    {currentUser.nombre ? currentUser.nombre[0].toUpperCase() : 'A'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black">{currentUser.nombre}</h3>
                      <span className="bg-amber-400/20 text-amber-600 dark:text-amber-400 text-xs px-2.5 py-0.5 rounded-full border border-amber-400/30 font-black uppercase">
                        {currentUser.rol}
                      </span>
                    </div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>Sesión activa como: <strong className={isDark ? 'text-white' : 'text-slate-900'}>@{currentUser.usuario}</strong></p>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenChangePass(currentUser)}
                  className={`${isDark ? 'bg-gray-800 hover:bg-gray-700 text-amber-400 border-gray-700' : 'bg-white hover:bg-slate-100 text-amber-700 border-amber-300 shadow-sm'} border px-5 py-2.5 rounded-xl font-bold text-sm transition flex items-center justify-center gap-2`}
                >
                  <KeyRound className="w-4 h-4 text-amber-500" /> Cambiar mi contraseña
                </button>
              </div>
            )}

            {/* Grid de todos los usuarios registrados */}
            <div className="w-full">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-amber-500" /> Cuentas Registradas en el Sistema ({users.length})
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 min-[1900px]:grid-cols-6 gap-4 w-full">
                {users.map((u) => {
                  const isCurrent = currentUser && currentUser.id === u.id;
                  return (
                    <div 
                      key={u.id} 
                      className={`${isDark ? 'bg-gray-900 border-gray-800 hover:border-gray-700' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm'} ${isCurrent ? 'ring-2 ring-amber-400' : ''} border p-5 rounded-3xl flex flex-col justify-between transition`}
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-xl ${isDark ? 'bg-gray-800 text-amber-400' : 'bg-slate-100 text-amber-600'} flex items-center justify-center font-bold`}>
                            <UserCheck className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-bold text-base leading-tight">{u.nombre || u.usuario}</h4>
                            <span className="text-xs text-amber-500 font-mono font-bold">@{u.usuario}</span>
                          </div>
                        </div>
                        <span className={`text-[10px] ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-slate-100 text-slate-600 border-slate-200'} uppercase px-2 py-0.5 rounded-md border font-semibold`}>
                          {u.rol || 'admin'}
                        </span>
                      </div>

                      <div className={`${isDark ? 'bg-gray-950 border-gray-800' : 'bg-slate-50 border-slate-200'} p-3 rounded-xl border mb-4 flex items-center justify-between text-xs`}>
                        <span className={`flex items-center gap-1.5 ${isDark ? 'text-gray-400' : 'text-slate-500'}`}>
                          <Lock className="w-3.5 h-3.5 opacity-60" /> Clave:
                        </span>
                        <span className="font-mono opacity-60">••••••••</span>
                      </div>

                      <div className={`flex items-center gap-2 pt-2 border-t ${isDark ? 'border-gray-800' : 'border-slate-100'}`}>
                        <button
                          onClick={() => handleOpenChangePass(u)}
                          className={`flex-1 ${isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-slate-100 hover:bg-slate-200 text-slate-800'} py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5`}
                        >
                          <KeyRound className="w-3.5 h-3.5 text-amber-500" /> Cambiar clave
                        </button>
                        
                        {users.length > 1 && (
                          <button
                            onClick={() => setDeleteUserConfirm(u)}
                            className={`p-2 ${isDark ? 'text-gray-500 hover:text-red-400 hover:bg-red-900/20' : 'text-slate-400 hover:text-red-600 hover:bg-red-50'} rounded-xl transition`}
                            title={`Eliminar usuario @${u.usuario}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Nota de ayuda */}
            <div className={`${isDark ? 'bg-gray-900/50 border-gray-800 text-gray-400' : 'bg-white border-slate-200 text-slate-600 shadow-sm'} border rounded-2xl p-5 text-xs space-y-1.5 w-full`}>
              <p><strong className="text-amber-500">💡 ¿Cómo funciona la tabla de usuarios?</strong></p>
              <p>1. Los usuarios y contraseñas se leen de la pestaña <strong><code>usuarios</code></strong> en tu Google Sheet.</p>
              <p>2. Al cambiar la clave o crear un usuario desde este panel, se sincroniza en vivo con tu hoja de cálculo.</p>
              <p>3. Puedes usar tu usuario (ej. <code>admin</code> u <code>olga</code>) con su respectiva contraseña para iniciar sesión en cualquier dispositivo.</p>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
