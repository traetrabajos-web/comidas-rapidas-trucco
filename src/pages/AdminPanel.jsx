import { useState, useEffect, useRef } from 'react';
import {
  LogOut, Plus, Pencil, Trash2,
  ChefHat, Search, Package, AlertTriangle, CheckCircle,
  ExternalLink, X, RefreshCw, Eye, ClipboardList, Check, Tag,
  Volume2, VolumeX, Phone, MessageCircle, MapPin, Bell, Clock,
  Sparkles
} from 'lucide-react';
import { useAdminProducts } from '../hooks/useAdminProducts';
import AdminProductForm from './AdminProductForm';

// ─── Generador de sonido sintetizado para alertas de nuevos pedidos ───
function playOrderChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq, start, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(0.35, start + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    // Melodía tipo campanita (Do5 -> Mi5 -> Sol5 -> Do6)
    playTone(523.25, now, 0.25);
    playTone(659.25, now + 0.12, 0.3);
    playTone(783.99, now + 0.24, 0.35);
    playTone(1046.50, now + 0.38, 0.6);
  } catch (e) {
    console.warn('Audio notification error:', e);
  }
}

export default function AdminPanel({ onLogout }) {
  const {
    products, categories, orders, loadingOrders, loading, isSaving, error,
    addProduct, updateProduct, deleteProduct,
    addCategory, updateCategory, deleteCategory,
    fetchOrders, updateOrderStatus, deleteOrder,
    refresh, refreshCategories
  } = useAdminProducts();

  const [activeTab, setActiveTab] = useState('productos'); // 'productos' | 'categorias' | 'pedidos'
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  // ─── Estado para CRUD de Categorías ───────────────
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [catName, setCatName] = useState('');
  const [deleteCatConfirm, setDeleteCatConfirm] = useState(null);

  // ─── Estado para Gestión y Notificaciones de Pedidos ───
  const [orderFilter, setOrderFilter] = useState('todos'); // 'todos' | 'pending' | 'completed' | 'domicilio' | 'recoger'
  const [orderSearch, setOrderSearch] = useState('');
  const [deleteOrderConfirm, setDeleteOrderConfirm] = useState(null);
  const [soundEnabled, setSoundEnabled] = useState(() => {
    const saved = localStorage.getItem('trucco_sound_enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const [newOrderAlert, setNewOrderAlert] = useState(null); // Último pedido entrante para banner
  const prevOrderIdsRef = useRef(new Set());
  const isFirstLoadRef = useRef(true);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    if (error) showToast(`Error al sincronizar: ${error}`, 'error');
  }, [error]);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('trucco_sound_enabled', String(next));
    if (next) {
      playOrderChime();
      showToast('🔔 Sonido de notificaciones activado', 'success');
    } else {
      showToast('🔕 Sonido de notificaciones silenciado', 'info');
    }
  };

  // ─── Sincronización en vivo y sondeo de pedidos cada 12 segundos ───
  useEffect(() => {
    const syncOrders = async () => {
      const serverOrders = await fetchOrders();
      if (serverOrders && Array.isArray(serverOrders)) {
        const currentIds = new Set(serverOrders.map(o => String(o.id)));
        
        if (!isFirstLoadRef.current) {
          // Detectar si hay nuevos pedidos que no estaban en la lista anterior
          const newlyArrived = serverOrders.filter(
            o => !prevOrderIdsRef.current.has(String(o.id)) && o.status === 'pending'
          );

          if (newlyArrived.length > 0) {
            const newest = newlyArrived[0];
            if (soundEnabled) playOrderChime();
            
            setNewOrderAlert(newest);
            showToast(`🔔 ¡NUEVO PEDIDO! De ${newest.name} por $${newest.total.toLocaleString('es-CO')}`, 'success');

            // Notificación del navegador si está permitida
            if ('Notification' in window && Notification.permission === 'granted') {
              try {
                new Notification('🍔 Comidas Rápidas Trucco - ¡Nuevo Pedido!', {
                  body: `${newest.name} (${newest.orderType === 'domicilio' ? '🛵 Domicilio' : '🏪 Recoger'}) - $${newest.total.toLocaleString('es-CO')}`,
                  icon: '/logo.png'
                });
              } catch (e) {}
            }
          }
        }

        prevOrderIdsRef.current = currentIds;
        isFirstLoadRef.current = false;
      }
    };

    // Carga inicial inmediata
    syncOrders();

    // Sondeo periódico cada 12 segundos
    const interval = setInterval(syncOrders, 12000);
    return () => clearInterval(interval);
  }, [fetchOrders, soundEnabled]);

  // Solicitar permiso de notificaciones del navegador
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      if (perm === 'granted') {
        showToast('✅ Notificaciones de escritorio activadas', 'success');
      }
    }
  };

  // ─── Handlers Productos ────────────────────────────
  const handleSave = async (formData) => {
    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, formData);
        showToast(`"${formData.name}" guardado exitosamente.`);
      } else {
        await addProduct(formData);
        showToast(`"${formData.name}" creado exitosamente.`);
      }
      setView('list');
      setEditingProduct(null);
    } catch (e) {
      showToast('Hubo un error al guardar', 'error');
    }
  };

  const handleEdit = (product) => { setEditingProduct(product); setView('form'); };
  const handleNewProduct = () => { setEditingProduct(null); setView('form'); };
  const handleDelete = (product) => setDeleteConfirm(product);
  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteProduct(deleteConfirm.id);
      showToast(`"${deleteConfirm.name}" eliminado.`);
      setDeleteConfirm(null);
    } catch (e) { showToast('Error al eliminar', 'error'); }
  };

  // ─── Handlers Categorías ───────────────────────────
  const openNewCat = () => {
    setEditingCategory(null);
    setCatName('');
    setCatModalOpen(true);
  };
  const openEditCat = (cat) => {
    setEditingCategory(cat);
    setCatName(cat);
    setCatModalOpen(true);
  };
  const handleSaveCat = async () => {
    if (!catName.trim()) return showToast('El nombre no puede estar vacío', 'error');
    try {
      if (editingCategory) {
        await updateCategory(editingCategory, catName.trim());
        showToast(`Categoría renombrada a "${catName.trim()}"`);
      } else {
        await addCategory(catName.trim());
        showToast(`Categoría "${catName.trim()}" creada.`);
      }
      setCatModalOpen(false);
      setCatName('');
      setEditingCategory(null);
    } catch (e) {
      showToast(e.message || 'Error al guardar categoría', 'error');
    }
  };
  const confirmDeleteCat = async () => {
    if (!deleteCatConfirm) return;
    try {
      await deleteCategory(deleteCatConfirm);
      showToast(`Categoría "${deleteCatConfirm}" eliminada.`);
      setDeleteCatConfirm(null);
    } catch (e) { showToast('Error al eliminar categoría', 'error'); }
  };

  // ─── Handlers Pedidos ──────────────────────────────
  const handleToggleStatus = async (order) => {
    const nextStatus = order.status === 'completed' ? 'pending' : 'completed';
    await updateOrderStatus(order.id, nextStatus);
    showToast(nextStatus === 'completed' ? `Pedido #${order.id} marcado como COMPLETADO` : `Pedido #${order.id} reabierto como PENDIENTE`);
  };

  const confirmDeleteOrder = async () => {
    if (!deleteOrderConfirm) return;
    try {
      await deleteOrder(deleteOrderConfirm);
      showToast(`Pedido eliminado correctamente.`);
      setDeleteOrderConfirm(null);
    } catch (e) {
      showToast('Error al eliminar pedido', 'error');
    }
  };

  const rawCategories = categories.filter(c => c !== 'Todos');

  const filteredProducts = products.filter((p) => {
    const matchCategory = filterCategory === 'Todos' || p.category === filterCategory;
    const matchQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
  });

  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;
  const completedOrdersCount = orders.filter(o => o.status === 'completed').length;
  const domicilioCount = orders.filter(o => o.orderType === 'domicilio').length;
  const recogerCount = orders.filter(o => o.orderType === 'recoger').length;
  const totalFacturado = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);

  const filteredOrders = orders.filter((order) => {
    if (orderFilter === 'pending' && order.status !== 'pending') return false;
    if (orderFilter === 'completed' && order.status !== 'completed') return false;
    if (orderFilter === 'domicilio' && order.orderType !== 'domicilio') return false;
    if (orderFilter === 'recoger' && order.orderType !== 'recoger') return false;

    if (orderSearch.trim()) {
      const q = orderSearch.toLowerCase();
      const matchName = String(order.name || '').toLowerCase().includes(q);
      const matchPhone = String(order.phone || '').toLowerCase().includes(q);
      const matchAddress = String(order.address || '').toLowerCase().includes(q);
      const matchNotes = String(order.notes || '').toLowerCase().includes(q);
      const matchItems = String(order.itemsSummary || '').toLowerCase().includes(q);
      const matchId = String(order.id || '').toLowerCase().includes(q);
      return matchName || matchPhone || matchAddress || matchNotes || matchItems || matchId;
    }
    return true;
  });

  const stats = [
    { label: 'Total productos', value: products.length, icon: Package, color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
    { label: 'Categorías', value: rawCategories.length, icon: Tag, color: 'text-orange-400', bg: 'bg-orange-400/10' },
    {
      label: 'Precio más alto',
      value: products.length ? `$${Math.max(...products.flatMap(p => p.variants.map(v => v.price))).toLocaleString('es-CO')}` : '$0',
      icon: CheckCircle, color: 'text-green-400', bg: 'bg-green-400/10',
    },
    {
      label: 'Precio más bajo',
      value: products.length ? `$${Math.min(...products.flatMap(p => p.variants.map(v => v.price))).toLocaleString('es-CO')}` : '$0',
      icon: CheckCircle, color: 'text-blue-400', bg: 'bg-blue-400/10',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col md:flex-row font-sans">

      {/* ── Overlay de carga ── */}
      {isSaving && (
        <div className="fixed inset-0 bg-black/85 z-[100] backdrop-blur-md flex flex-col items-center justify-center p-6 text-center animate-fade-in">
          <div className="relative mb-6">
            <div className="w-20 h-20 border-4 border-yellow-400/20 border-t-yellow-400 rounded-full animate-spin" />
            <img src="/logo.png" alt="Trucco" className="w-10 h-10 object-contain absolute inset-0 m-auto drop-shadow-md" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Guardando cambios...</h3>
          <p className="text-sm text-gray-300 max-w-sm">
            Sincronizando la información con tu menú y la hoja de cálculo. Por favor espera un momento.
          </p>
        </div>
      )}

      {/* ── Toast ── */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl transition-all ${toast.type === 'success' ? 'bg-green-800 border border-green-600' : toast.type === 'error' ? 'bg-red-800 border border-red-600' : 'bg-yellow-800 border border-yellow-600'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0" />}
          <span className="text-sm text-white max-w-xs">{toast.message}</span>
          <button onClick={() => setToast(null)}><X className="w-4 h-4 text-white/60 hover:text-white" /></button>
        </div>
      )}

      {/* ── Banner flotante de Nuevo Pedido en vivo ── */}
      {newOrderAlert && (
        <div className="fixed bottom-6 right-6 z-[80] max-w-md bg-gradient-to-r from-yellow-500 to-amber-500 text-gray-950 p-5 rounded-3xl shadow-2xl border-2 border-white/40 flex items-start gap-4 animate-bounce">
          <div className="w-12 h-12 bg-black/20 rounded-2xl flex items-center justify-center shrink-0">
            <Bell className="w-7 h-7 text-gray-950 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs uppercase font-black tracking-wider bg-black/20 px-2.5 py-0.5 rounded-full">
                ¡NUEVO PEDIDO RECIBIDO!
              </span>
              <button onClick={() => setNewOrderAlert(null)} className="p-1 hover:bg-black/10 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h4 className="font-black text-lg mt-1 truncate">{newOrderAlert.name}</h4>
            <p className="text-xs font-semibold text-gray-900/90 mt-0.5">
              {newOrderAlert.orderType === 'domicilio' ? '🛵 Domicilio' : '🏪 Recoger'} • ${newOrderAlert.total.toLocaleString('es-CO')}
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => {
                  setActiveTab('pedidos');
                  setNewOrderAlert(null);
                }}
                className="bg-black text-white text-xs font-black px-4 py-2 rounded-xl hover:bg-gray-900 transition flex items-center gap-1.5"
              >
                <ClipboardList className="w-3.5 h-3.5" /> Ver en Pedidos
              </button>
              {newOrderAlert.phone && (
                <a
                  href={`https://wa.me/57${newOrderAlert.phone.replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noreferrer"
                  className="bg-green-600 text-white text-xs font-black px-3 py-2 rounded-xl hover:bg-green-500 transition flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmar eliminar producto ── */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-gray-900 border border-red-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">¿Eliminar producto?</h3>
                <p className="text-xs text-gray-400">Esta acción no se puede deshacer</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-5">
              ¿Estás seguro de eliminar <span className="font-semibold text-white">"{deleteConfirm.name}"</span> del menú?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl text-sm transition">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmar eliminar categoría ── */}
      {deleteCatConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={() => setDeleteCatConfirm(null)}>
          <div className="bg-gray-900 border border-red-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center">
                <Tag className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">¿Eliminar categoría?</h3>
                <p className="text-xs text-gray-400">Los productos con esta categoría no se borrarán</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-5">
              ¿Eliminar la categoría <span className="font-semibold text-white">"{deleteCatConfirm}"</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteCatConfirm(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition">Cancelar</button>
              <button onClick={confirmDeleteCat} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl text-sm transition">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal confirmar eliminar pedido ── */}
      {deleteOrderConfirm && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={() => setDeleteOrderConfirm(null)}>
          <div className="bg-gray-900 border border-red-800 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-900/50 rounded-full flex items-center justify-center">
                <Trash2 className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <h3 className="font-bold text-white">¿Eliminar pedido?</h3>
                <p className="text-xs text-gray-400">Se eliminará del historial y de Google Sheets</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-5">
              ¿Estás seguro de eliminar el pedido <span className="font-semibold text-white">#{deleteOrderConfirm}</span>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteOrderConfirm(null)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition">Cancelar</button>
              <button onClick={confirmDeleteOrder} className="flex-1 bg-red-600 hover:bg-red-500 text-white font-semibold py-2.5 rounded-xl text-sm transition">Sí, eliminar</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal crear / editar categoría ── */}
      {catModalOpen && (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4" onClick={() => setCatModalOpen(false)}>
          <div className="bg-gray-900 border border-gray-700 rounded-2xl p-6 max-w-sm w-full shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">
                {editingCategory ? 'Editar categoría' : 'Nueva categoría'}
              </h3>
              <button onClick={() => setCatModalOpen(false)}><X className="w-5 h-5 text-gray-500 hover:text-white" /></button>
            </div>
            <label className="block text-sm text-gray-400 mb-1">Nombre de la categoría</label>
            <input
              type="text"
              value={catName}
              onChange={(e) => setCatName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSaveCat(); }}
              placeholder="Ej: Hamburguesas"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400/50 mb-5"
              autoFocus
            />
            <div className="flex gap-3">
              <button onClick={() => setCatModalOpen(false)} className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-xl text-sm transition">Cancelar</button>
              <button onClick={handleSaveCat} className="flex-1 bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold py-2.5 rounded-xl text-sm transition hover:from-yellow-300 hover:to-yellow-400">
                {editingCategory ? 'Guardar cambio' : 'Crear categoría'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal del Formulario de Producto ── */}
      {view === 'form' && (
        <AdminProductForm
          product={editingProduct}
          onSave={handleSave}
          onCancel={() => { setView('list'); setEditingProduct(null); }}
        />
      )}

      {/* ── Modal Detalles del Producto ── */}
      {viewingProduct && (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 overflow-y-auto" onClick={() => setViewingProduct(null)}>
          <div className="bg-gray-900 border border-gray-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden my-8" onClick={(e) => e.stopPropagation()}>
            <div className="relative h-64 bg-gray-800">
              {viewingProduct.image ? (
                <img src={viewingProduct.image} alt={viewingProduct.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <ChefHat className="w-16 h-16 text-gray-700" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900 to-transparent" />
              <button onClick={() => setViewingProduct(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full backdrop-blur-sm transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <span className="bg-yellow-400/10 text-yellow-400 text-xs font-bold px-3 py-1 rounded-full border border-yellow-400/20">{viewingProduct.category}</span>
                <h2 className="text-2xl font-black text-white mt-3 mb-2">{viewingProduct.name}</h2>
                <p className="text-gray-400 text-sm leading-relaxed">{viewingProduct.description}</p>
              </div>
              <div className="bg-gray-950 rounded-2xl p-4 border border-gray-800">
                <h3 className="font-bold text-gray-300 mb-3 text-sm flex items-center gap-2"><Package className="w-4 h-4" /> Variantes y Precios</h3>
                <div className="space-y-2">
                  {viewingProduct.variants.map((v, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-gray-800 last:border-0 last:pb-0">
                      <span className="text-gray-300 text-sm">{v.label}</span>
                      <span className="font-bold text-yellow-400">${v.price.toLocaleString('es-CO')}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={() => setViewingProduct(null)} className="w-full mt-6 bg-gray-800 hover:bg-gray-700 text-white font-medium py-3 rounded-xl transition">Cerrar detalles</button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════ BARRA LATERAL (SIDEBAR) ══════════════ */}
      <aside className="hidden md:flex w-64 flex-col bg-gray-900 border-r border-gray-800 shrink-0">
        <div className="p-6 border-b border-gray-800 flex flex-col items-center justify-center gap-2">
          <img src="/logo.png" alt="Comidas Rápidas Trucco" className="h-16 w-auto object-contain drop-shadow-lg" />
          <p className="text-xs text-gray-400">Trucco Panel</p>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('productos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'productos' ? 'bg-yellow-400/10 text-yellow-400 font-bold' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <Package className="w-5 h-5" /> Productos
          </button>

          <button
            onClick={() => setActiveTab('categorias')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'categorias' ? 'bg-yellow-400/10 text-yellow-400 font-bold' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <Tag className="w-5 h-5" /> Categorías
          </button>

          <button
            onClick={() => setActiveTab('pedidos')}
            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl font-medium transition ${activeTab === 'pedidos' ? 'bg-yellow-400/10 text-yellow-400 font-bold' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <div className="flex items-center gap-3">
              <ClipboardList className="w-5 h-5" />
              <span>Pedidos</span>
            </div>
            {pendingOrdersCount > 0 && (
              <span className="bg-yellow-400 text-gray-950 font-black text-xs px-2 py-0.5 rounded-full animate-pulse shadow-md">
                {pendingOrdersCount}
              </span>
            )}
          </button>

          <a href="/" target="_blank" rel="noreferrer" className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl font-medium transition mt-4 border-t border-gray-800 pt-4">
            <ExternalLink className="w-5 h-5" /> Ver mi página
          </a>
        </div>

        <div className="p-4 border-t border-gray-800 space-y-2">
          <button
            onClick={toggleSound}
            className={`w-full flex items-center justify-center gap-2 px-3 py-2 text-xs rounded-xl transition ${soundEnabled ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/20' : 'bg-gray-800 text-gray-400'}`}
          >
            {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Sonido: Activado' : 'Sonido: Silenciado'}</span>
          </button>

          <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 px-4 py-2.5 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-xl transition font-medium">
            <LogOut className="w-4 h-4" /> Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ══════════════ HEADER MÓVIL ══════════════ */}
      <div className="md:hidden bg-gray-900 border-b border-gray-800 sticky top-0 z-10 flex flex-col">
        <div className="px-4 py-3 flex items-center justify-between border-b border-gray-800">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="Trucco" className="h-8 w-auto object-contain drop-shadow-lg" />
            <h1 className="font-bold text-white text-sm">Admin Panel</h1>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleSound} className="p-2 text-gray-400 hover:text-yellow-400">
              {soundEnabled ? <Volume2 className="w-5 h-5 text-yellow-400" /> : <VolumeX className="w-5 h-5" />}
            </button>
            <button onClick={onLogout} className="text-red-400 p-2"><LogOut className="w-5 h-5" /></button>
          </div>
        </div>
        <div className="flex">
          <button onClick={() => setActiveTab('productos')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition ${activeTab === 'productos' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-500'}`}>Productos</button>
          <button onClick={() => setActiveTab('categorias')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition ${activeTab === 'categorias' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-500'}`}>Categorías</button>
          <button onClick={() => setActiveTab('pedidos')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition relative ${activeTab === 'pedidos' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-500'}`}>
            <span>Pedidos</span>
            {pendingOrdersCount > 0 && (
              <span className="ml-1.5 bg-yellow-400 text-gray-950 font-black text-[10px] px-1.5 py-0.5 rounded-full">
                {pendingOrdersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* ══════════════ CONTENIDO PRINCIPAL FULL-WIDTH RESPONSIVO ══════════════ */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-gray-950/50 w-full">

        {/* ── TAB PRODUCTOS (EXPANSIBLE A TODA LA PANTALLA) ── */}
        {activeTab === 'productos' && (
          <div className="w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 md:space-y-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white">Menú de Productos</h2>
                <p className="text-gray-400 text-sm mt-1">Administra el catálogo de Comidas Rápidas Trucco</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    localStorage.removeItem('trucco_sheet_cache');
                    localStorage.removeItem('trucco_sheet_cache_time');
                    refresh();
                    showToast('Actualizando datos desde Excel...', 'success');
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold p-3 md:px-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">Actualizar</span>
                </button>
                <button
                  onClick={handleNewProduct}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-gray-900 font-bold py-3 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20"
                >
                  <Plus className="w-5 h-5" /> Agregar producto
                </button>
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 px-4 py-3 rounded-xl border border-yellow-400/20">
                <RefreshCw className="w-4 h-4 animate-spin" /> Sincronizando con Google Sheets...
              </div>
            )}

            {/* Estadísticas */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {stats.map((stat, i) => (
                <div key={i} className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                    <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className={`text-2xl font-black ${stat.color}`}>{stat.value}</div>
                  <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Buscador y filtro */}
            <div className="bg-gray-900 border border-gray-800 p-2 rounded-2xl flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar por nombre o categoría..."
                  className="w-full bg-transparent text-white rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 text-sm"
                />
              </div>
              <div className="w-full md:w-72 border-t md:border-t-0 md:border-l border-gray-800 p-1">
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full bg-gray-900 text-gray-300 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 text-sm cursor-pointer"
                >
                  <option value="Todos" className="bg-gray-900 text-white">Todas las categorías</option>
                  {rawCategories.map(cat => (
                    <option key={cat} value={cat} className="bg-gray-900 text-white">{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Grid de productos que se expande en pantallas grandes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5 sm:gap-6">
              {filteredProducts.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-gray-900 border border-gray-800 rounded-3xl">
                  <ChefHat className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-300">No se encontraron productos</h3>
                  <p className="text-gray-500 mt-2">Prueba buscando con otros términos.</p>
                </div>
              ) : (
                filteredProducts.map((product) => (
                  <div key={product.id} className="bg-gray-900 border border-gray-800 rounded-3xl flex flex-col transition hover:border-gray-700 hover:shadow-xl hover:shadow-black/50 overflow-hidden relative">
                    <div className="relative h-48 bg-gray-800 flex items-center justify-center overflow-hidden shrink-0">
                      <img
                        src={product.image}
                        alt={product.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.target.src = ''; e.target.parentElement.innerHTML = '<div class="w-full h-full flex items-center justify-center text-5xl bg-gray-800">🍔</div>'; }}
                      />
                      <div className="absolute top-3 left-3 bg-yellow-400 text-gray-900 text-xs font-black px-3 py-1.5 rounded-full uppercase tracking-wider shadow-md">
                        {product.category}
                      </div>
                    </div>
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex-1">
                        <h3 className="font-bold text-white text-lg leading-snug mb-2 min-h-[3rem] flex items-center">{product.name}</h3>
                        <p className="text-sm text-gray-400 mb-4 line-clamp-2 min-h-[2.5rem]">{product.description}</p>
                      </div>
                      <div className="flex items-center justify-between mt-auto pt-4 border-t border-gray-800 mb-4 h-14">
                        <div className="flex flex-col">
                          {product.variants.length === 1 ? (
                            <span className="text-green-400 font-bold text-lg">${product.variants[0].price.toLocaleString('es-CO')}</span>
                          ) : (
                            <span className="text-green-400 font-bold text-lg">${Math.min(...product.variants.map(v => v.price)).toLocaleString('es-CO')} +</span>
                          )}
                          {product.variants.length > 1 && (
                            <span className="text-xs text-gray-500 font-medium">{product.variants.length} opciones</span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <button onClick={() => setViewingProduct(product)} className="flex items-center justify-center p-2.5 text-green-400 hover:text-green-300 bg-green-900/20 hover:bg-green-900/40 rounded-xl transition" title="Ver detalles">
                          <Eye className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleEdit(product)} className="flex items-center justify-center p-2.5 text-blue-400 hover:text-blue-300 bg-blue-900/20 hover:bg-blue-900/40 rounded-xl transition" title="Editar">
                          <Pencil className="w-5 h-5" />
                        </button>
                        <button onClick={() => handleDelete(product)} className="flex items-center justify-center p-2.5 text-red-400 hover:text-red-300 bg-red-900/20 hover:bg-red-900/40 rounded-xl transition" title="Eliminar">
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

        {/* ══════════════ TAB CATEGORÍAS (EXPANSIBLE) ══════════════ */}
        {activeTab === 'categorias' && (
          <div className="w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 md:space-y-8">

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <h2 className="text-2xl md:text-3xl font-black text-white">Categorías del Menú</h2>
                <p className="text-gray-400 text-sm mt-1">Organiza el menú de Comidas Rápidas Trucco por categorías</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    localStorage.removeItem('trucco_cats_cache');
                    localStorage.removeItem('trucco_cats_cache_time');
                    refreshCategories();
                    showToast('Actualizando categorías desde el Sheet...', 'success');
                  }}
                  className="bg-gray-800 hover:bg-gray-700 text-white font-bold p-3 md:px-4 rounded-xl transition flex items-center justify-center gap-2"
                >
                  <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                  <span className="hidden md:inline">Actualizar</span>
                </button>
                <button
                  onClick={openNewCat}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-gray-900 font-bold py-3 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20"
                >
                  <Plus className="w-5 h-5" /> Nueva categoría
                </button>
              </div>
            </div>

            {loading && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 px-4 py-3 rounded-xl border border-yellow-400/20">
                <RefreshCw className="w-4 h-4 animate-spin" /> Sincronizando con Google Sheets...
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-5">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition">
                <div className="w-10 h-10 rounded-xl bg-yellow-400/10 flex items-center justify-center mb-3">
                  <Tag className="w-5 h-5 text-yellow-400" />
                </div>
                <div className="text-2xl font-black text-yellow-400">{rawCategories.length}</div>
                <div className="text-sm text-gray-400 font-medium">Total categorías</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition">
                <div className="w-10 h-10 rounded-xl bg-orange-400/10 flex items-center justify-center mb-3">
                  <Package className="w-5 h-5 text-orange-400" />
                </div>
                <div className="text-2xl font-black text-orange-400">{products.length}</div>
                <div className="text-sm text-gray-400 font-medium">Productos en total</div>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition">
                <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center mb-3">
                  <ChefHat className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-black text-green-400">
                  {rawCategories.length > 0 ? (Math.round(products.length / rawCategories.length * 10) / 10) : 0}
                </div>
                <div className="text-sm text-gray-400 font-medium">Productos por categoría</div>
              </div>
            </div>

            {/* Grid de categorías */}
            {rawCategories.length === 0 ? (
              <div className="text-center py-20 bg-gray-900 border-2 border-dashed border-gray-700 rounded-3xl">
                <div className="w-20 h-20 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Tag className="w-10 h-10 text-gray-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-300">Sin categorías todavía</h3>
                <p className="text-gray-500 mt-2 mb-6 max-w-xs mx-auto">Crea categorías para que tus clientes puedan filtrar el menú fácilmente.</p>
                <button
                  onClick={openNewCat}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 text-gray-900 font-bold px-7 py-3 rounded-xl hover:from-yellow-300 hover:to-yellow-400 transition shadow-lg shadow-yellow-400/20 inline-flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" /> Crear primera categoría
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                {rawCategories.map((cat, idx) => {
                  const count = products.filter(p => p.category === cat).length;
                  const palettes = [
                    { bg: 'from-yellow-500/20 to-orange-500/5',  border: 'border-yellow-500/30',  icon: 'bg-yellow-400/20 text-yellow-400',  bar: 'bg-yellow-400',  badge: 'text-yellow-400' },
                    { bg: 'from-orange-500/20 to-red-500/5',     border: 'border-orange-500/30',  icon: 'bg-orange-400/20 text-orange-400',  bar: 'bg-orange-400',  badge: 'text-orange-400' },
                    { bg: 'from-blue-500/20 to-cyan-500/5',      border: 'border-blue-500/30',    icon: 'bg-blue-400/20 text-blue-400',      bar: 'bg-blue-400',    badge: 'text-blue-400' },
                    { bg: 'from-purple-500/20 to-pink-500/5',    border: 'border-purple-500/30',  icon: 'bg-purple-400/20 text-purple-400',  bar: 'bg-purple-400',  badge: 'text-purple-400' },
                    { bg: 'from-green-500/20 to-emerald-500/5',  border: 'border-green-500/30',   icon: 'bg-green-400/20 text-green-400',    bar: 'bg-green-400',   badge: 'text-green-400' },
                    { bg: 'from-pink-500/20 to-rose-500/5',      border: 'border-pink-500/30',    icon: 'bg-pink-400/20 text-pink-400',      bar: 'bg-pink-400',    badge: 'text-pink-400' },
                  ];
                  const pal = palettes[idx % palettes.length];
                  return (
                    <div
                      key={cat}
                      className={`relative bg-gradient-to-br ${pal.bg} border ${pal.border} rounded-3xl overflow-hidden hover:scale-[1.02] hover:shadow-2xl hover:shadow-black/40 transition-all duration-200`}
                    >
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-5">
                          <div className={`w-14 h-14 rounded-2xl ${pal.icon} flex items-center justify-center shadow-md`}>
                            <Tag className="w-7 h-7" />
                          </div>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full bg-gray-900/60 ${pal.badge} border ${pal.border} backdrop-blur-sm`}>
                            {count} {count === 1 ? 'producto' : 'productos'}
                          </span>
                        </div>

                        <h3 className="text-xl font-black text-white mb-4 leading-tight">{cat}</h3>

                        {products.length > 0 && (
                          <div className="mb-5">
                            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                              <span>% del catálogo</span>
                              <span className={pal.badge}>{Math.round(count / products.length * 100)}%</span>
                            </div>
                            <div className="w-full h-2 bg-gray-800/80 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${pal.bar} transition-all duration-700`}
                                style={{ width: `${Math.round(count / products.length * 100)}%` }}
                              />
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-2 gap-2 pt-4 border-t border-white/10">
                          <button
                            onClick={() => openEditCat(cat)}
                            className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-white/10 hover:bg-white/20 rounded-xl transition"
                          >
                            <Pencil className="w-4 h-4" /> Editar
                          </button>
                          <button
                            onClick={() => setDeleteCatConfirm(cat)}
                            className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-red-400 bg-red-900/20 hover:bg-red-900/40 rounded-xl transition"
                          >
                            <Trash2 className="w-4 h-4" /> Eliminar
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                <button
                  onClick={openNewCat}
                  className="border-2 border-dashed border-gray-700 hover:border-yellow-400/60 rounded-3xl p-6 flex flex-col items-center justify-center gap-3 text-gray-600 hover:text-yellow-400 transition-all duration-200 min-h-[220px] group"
                >
                  <div className="w-14 h-14 rounded-2xl bg-gray-800 group-hover:bg-yellow-400/10 flex items-center justify-center transition">
                    <Plus className="w-7 h-7" />
                  </div>
                  <span className="font-bold text-sm">Nueva categoría</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* ══════════════ TAB PEDIDOS (EXPANSIBLE CON GRID DE 2 COLUMNAS) ══════════════ */}
        {activeTab === 'pedidos' && (
          <div className="w-full max-w-[1700px] mx-auto p-4 sm:p-6 lg:p-8 xl:p-10 space-y-6 md:space-y-8">

            {/* Header de Pedidos */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-2xl md:text-3xl font-black text-white">Gestión de Pedidos en Vivo</h2>
                  <span className="flex items-center gap-1 text-[11px] font-bold bg-green-500/20 text-green-400 border border-green-500/30 px-2.5 py-1 rounded-full animate-pulse">
                    <span className="w-2 h-2 rounded-full bg-green-400 animate-ping" /> Sincronizado
                  </span>
                </div>
                <p className="text-gray-400 text-sm mt-1">
                  Pedidos registrados desde el carrito de compras y guardados automáticamente en Google Sheets
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={toggleSound}
                  className={`p-3 rounded-xl transition flex items-center gap-2 font-bold text-sm ${soundEnabled ? 'bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 hover:bg-yellow-400/20' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
                  title={soundEnabled ? 'Silenciar sonidos de nuevos pedidos' : 'Activar sonido de nuevos pedidos'}
                >
                  {soundEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                  <span className="hidden sm:inline">{soundEnabled ? 'Sonido ON' : 'Sonido OFF'}</span>
                </button>

                <button
                  onClick={requestNotificationPermission}
                  className="bg-gray-800 hover:bg-gray-700 text-gray-300 font-bold p-3 rounded-xl transition flex items-center gap-2 text-sm"
                  title="Activar alertas de escritorio en tu computadora o teléfono"
                >
                  <Bell className="w-5 h-5" />
                  <span className="hidden sm:inline">Alertas</span>
                </button>

                <button
                  onClick={() => {
                    fetchOrders();
                    showToast('Actualizando pedidos desde Google Sheets...', 'success');
                  }}
                  className="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 text-gray-900 font-bold py-3 px-4 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-yellow-400/20"
                >
                  <RefreshCw className={`w-5 h-5 ${loadingOrders ? 'animate-spin' : ''}`} />
                  <span>Actualizar</span>
                </button>
              </div>
            </div>

            {loadingOrders && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 px-4 py-3 rounded-xl border border-yellow-400/20">
                <RefreshCw className="w-4 h-4 animate-spin" /> Verificando nuevos pedidos en Google Sheets...
              </div>
            )}

            {/* Stats resumen de pedidos */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 sm:gap-4">
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition">
                <div className="text-xs text-gray-400 font-bold mb-1">🟡 Pendientes</div>
                <div className="text-2xl font-black text-yellow-400">{pendingOrdersCount}</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition">
                <div className="text-xs text-gray-400 font-bold mb-1">🟢 Completados</div>
                <div className="text-2xl font-black text-green-400">{completedOrdersCount}</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition">
                <div className="text-xs text-gray-400 font-bold mb-1">🛵 Domicilios</div>
                <div className="text-2xl font-black text-blue-400">{domicilioCount}</div>
              </div>
              <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition">
                <div className="text-xs text-gray-400 font-bold mb-1">🏪 En Punto</div>
                <div className="text-2xl font-black text-purple-400">{recogerCount}</div>
              </div>
              <div className="col-span-2 sm:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-4 hover:border-gray-700 transition">
                <div className="text-xs text-gray-400 font-bold mb-1">💰 Total Facturado</div>
                <div className="text-xl font-black text-emerald-400 truncate">${totalFacturado.toLocaleString('es-CO')}</div>
              </div>
            </div>

            {/* Buscador y filtros de pedidos */}
            <div className="space-y-3">
              <div className="bg-gray-900 border border-gray-800 p-2 rounded-2xl flex items-center">
                <Search className="w-5 h-5 text-gray-500 ml-3 shrink-0" />
                <input
                  type="text"
                  value={orderSearch}
                  onChange={(e) => setOrderSearch(e.target.value)}
                  placeholder="Buscar por cliente, teléfono, dirección, productos..."
                  className="w-full bg-transparent text-white rounded-xl px-4 py-2.5 focus:outline-none text-sm placeholder-gray-500"
                />
                {orderSearch && (
                  <button onClick={() => setOrderSearch('')} className="p-2 text-gray-500 hover:text-white">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filtros tipo pills */}
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {[
                  { id: 'todos', label: `Todos (${orders.length})` },
                  { id: 'pending', label: `🟡 Pendientes (${pendingOrdersCount})` },
                  { id: 'completed', label: `🟢 Completados (${completedOrdersCount})` },
                  { id: 'domicilio', label: `🛵 Domicilios (${domicilioCount})` },
                  { id: 'recoger', label: `🏪 Recoger (${recogerCount})` }
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setOrderFilter(tab.id)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition ${orderFilter === tab.id ? 'bg-yellow-400 text-gray-950 shadow-md shadow-yellow-400/20' : 'bg-gray-900 text-gray-400 hover:text-white hover:bg-gray-800 border border-gray-800'}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Listado de pedidos en cuadrícula de 2 columnas en pantallas grandes */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 sm:gap-6">
              {filteredOrders.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-gray-900 rounded-3xl border border-gray-800">
                  <ClipboardList className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-300">No hay pedidos para mostrar</h3>
                  <p className="text-gray-500 mt-2 max-w-sm mx-auto text-sm">
                    {orderSearch ? 'No se encontraron pedidos con ese criterio de búsqueda.' : 'Los pedidos que hagan los clientes por WhatsApp aparecerán aquí automáticamente en tiempo real.'}
                  </p>
                </div>
              ) : (
                filteredOrders.map((order) => {
                  const isPending = order.status === 'pending';
                  const cleanPhone = String(order.phone || '').replace(/\D/g, '');
                  const whatsappMsg = `*Hola ${order.name}!* Te escribimos de *Comidas Rápidas Trucco* 🍔\nRespecto a tu pedido #${order.id}:\n${order.itemsSummary || ''}\nTotal: $${Number(order.total || 0).toLocaleString('es-CO')}\n¿Confirmamos tu orden?`;

                  return (
                    <div
                      key={order.id}
                      className={`flex flex-col bg-gray-900 border-2 ${isPending ? 'border-yellow-400/40 shadow-xl shadow-yellow-400/5' : 'border-gray-800'} rounded-3xl p-5 md:p-6 transition relative overflow-hidden`}
                    >
                      {/* Cabecera del pedido */}
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-gray-800">
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="font-mono font-bold text-sm bg-gray-800 text-gray-300 px-3 py-1 rounded-xl border border-gray-700">
                            #{order.id}
                          </span>
                          
                          {isPending ? (
                            <span className="bg-yellow-400/10 text-yellow-400 border border-yellow-400/30 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5 animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-yellow-400" />
                              PENDIENTE
                            </span>
                          ) : (
                            <span className="bg-green-900/30 text-green-400 border border-green-800/40 text-xs font-black px-3 py-1 rounded-full flex items-center gap-1.5">
                              <Check className="w-3.5 h-3.5" />
                              COMPLETADO
                            </span>
                          )}

                          <span className={`text-xs font-bold px-3 py-1 rounded-full ${order.orderType === 'domicilio' ? 'bg-blue-900/30 text-blue-400 border border-blue-800/40' : 'bg-purple-900/30 text-purple-400 border border-purple-800/40'}`}>
                            {order.orderType === 'domicilio' ? '🛵 Domicilio' : '🏪 Recoger en Punto'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-gray-400">
                          <Clock className="w-3.5 h-3.5 text-gray-500" />
                          <span>{order.date} {order.time ? `• ${order.time}` : ''}</span>
                        </div>
                      </div>

                      {/* Cuerpo: Datos del Cliente + Detalle de productos */}
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-5 py-5 border-b border-gray-800">

                        {/* Columna izquierda: Datos del cliente (5 cols) */}
                        <div className="md:col-span-5 space-y-3 bg-gray-950 p-4 rounded-2xl border border-gray-800">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-0.5">Cliente</span>
                            <h3 className="text-lg font-black text-white">{order.name}</h3>
                          </div>

                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-1">Teléfono / Contacto</span>
                            <div className="flex items-center gap-2 flex-wrap">
                              <a
                                href={`tel:${cleanPhone}`}
                                className="inline-flex items-center gap-1.5 text-sm font-bold text-gray-300 hover:text-white bg-gray-900 hover:bg-gray-800 px-3 py-1.5 rounded-xl border border-gray-700 transition"
                              >
                                <Phone className="w-3.5 h-3.5 text-yellow-400" />
                                <span>{order.phone}</span>
                              </a>
                              {cleanPhone && (
                                <a
                                  href={`https://wa.me/57${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1 text-xs font-bold text-green-400 hover:text-green-300 bg-green-950/80 hover:bg-green-900/80 px-2.5 py-1.5 rounded-xl border border-green-800/50 transition"
                                >
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  <span>WhatsApp</span>
                                </a>
                              )}
                            </div>
                          </div>

                          {order.orderType === 'domicilio' && order.address && (
                            <div className="bg-blue-950/40 border border-blue-900/50 p-3 rounded-xl">
                              <div className="flex items-start gap-2 text-blue-300 text-xs">
                                <MapPin className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                                <div>
                                  <strong className="block text-blue-200">Dirección de Entrega:</strong>
                                  <p className="mt-0.5">{order.address}</p>
                                </div>
                              </div>
                            </div>
                          )}

                          {order.notes && (
                            <div className="bg-yellow-950/30 border border-yellow-900/40 p-3 rounded-xl">
                              <span className="text-[11px] font-bold text-yellow-400 block mb-0.5">Observaciones:</span>
                              <p className="text-xs text-yellow-200/90 italic">"{order.notes}"</p>
                            </div>
                          )}
                        </div>

                        {/* Columna derecha: Productos y Total (7 cols) */}
                        <div className="md:col-span-7 flex flex-col justify-between space-y-4">
                          <div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500 block mb-2">Detalle de Productos</span>
                            
                            {Array.isArray(order.items) && order.items.length > 0 ? (
                              <div className="space-y-2 bg-gray-950/60 p-3.5 rounded-2xl border border-gray-800/80">
                                {order.items.map((item, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-sm py-1.5 border-b border-gray-800/60 last:border-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-black text-yellow-400 bg-yellow-400/10 px-2 py-0.5 rounded-lg text-xs">
                                        {item.quantity}x
                                      </span>
                                      <span className="font-medium text-white">{item.name}</span>
                                      {item.variantLabel && item.variantLabel !== item.name && (
                                        <span className="text-xs text-gray-400">({item.variantLabel})</span>
                                      )}
                                    </div>
                                    <span className="font-bold text-gray-300">
                                      ${((item.price || 0) * (item.quantity || 1)).toLocaleString('es-CO')}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-gray-950/60 p-4 rounded-2xl border border-gray-800/80 text-sm text-gray-300 leading-relaxed">
                                {order.itemsSummary || 'Sin detalle de productos'}
                              </div>
                            )}
                          </div>

                          {/* Total a pagar */}
                          <div className="flex justify-between items-center bg-gray-950 p-4 rounded-2xl border border-gray-800">
                            <span className="font-bold text-gray-400 text-sm">TOTAL A COBRAR</span>
                            <span className="text-2xl font-black text-yellow-400">
                              ${Number(order.total || 0).toLocaleString('es-CO')} COP
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Botones de acción inferiores */}
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-4">
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                          {cleanPhone && (
                            <a
                              href={`https://wa.me/57${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-500 text-white font-bold rounded-xl transition text-sm shadow-md shadow-green-600/20"
                            >
                              <MessageCircle className="w-4 h-4" />
                              <span>Escribir por WhatsApp</span>
                            </a>
                          )}
                        </div>

                        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                          <button
                            onClick={() => handleToggleStatus(order)}
                            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-2.5 font-bold rounded-xl transition text-sm ${isPending ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-400 hover:to-emerald-500 text-white shadow-lg shadow-green-500/20' : 'bg-gray-800 hover:bg-gray-700 text-yellow-400 border border-yellow-400/20'}`}
                          >
                            <Check className="w-4 h-4" />
                            <span>{isPending ? 'Marcar como Listo' : 'Reabrir Pedido'}</span>
                          </button>

                          <button
                            onClick={() => setDeleteOrderConfirm(order.id)}
                            className="p-2.5 bg-red-900/20 hover:bg-red-900/40 text-red-400 rounded-xl transition"
                            title="Eliminar pedido"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Banner explicativo sincronización */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl p-6 text-sm text-gray-400 flex items-start gap-4">
              <Sparkles className="w-6 h-6 text-yellow-400 shrink-0 mt-1" />
              <div className="space-y-1">
                <strong className="text-white block text-base">¿Cómo funciona la gestión de pedidos?</strong>
                <p>
                  Cuando un cliente pulsa <strong>"Confirmar y Enviar por WhatsApp"</strong>, el sistema envía el pedido automáticamente a tu hoja de Google Sheets en la pestaña <code className="bg-gray-800 px-1.5 py-0.5 rounded text-yellow-400">pedidos</code> y se sincroniza con este panel.
                </p>
                <p className="text-xs text-gray-500 pt-1">
                  Puedes dejar esta pantalla abierta en tu computador o celular: sonará una campanita cada vez que entre un nuevo pedido y se actualizará automáticamente cada 12 segundos.
                </p>
              </div>
            </div>

          </div>
        )}

      </main>
    </div>
  );
}
