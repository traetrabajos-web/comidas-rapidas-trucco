import { useState, useEffect } from 'react';
import {
  LogOut, Plus, Pencil, Trash2,
  ChefHat, Search, Package, AlertTriangle, CheckCircle,
  ExternalLink, X, RefreshCw, Eye, ClipboardList, Check, Tag
} from 'lucide-react';
import { useAdminProducts } from '../hooks/useAdminProducts';
import AdminProductForm from './AdminProductForm';

export default function AdminPanel({ onLogout }) {
  const {
    products, categories, loading, isSaving, error,
    addProduct, updateProduct, deleteProduct,
    addCategory, updateCategory, deleteCategory,
    refresh, refreshCategories
  } = useAdminProducts();

  const [activeTab, setActiveTab] = useState('productos'); // 'productos' | 'categorias' | 'pedidos'
  const [orders, setOrders] = useState([]);
  const [view, setView] = useState('list'); // 'list' | 'form'
  const [editingProduct, setEditingProduct] = useState(null);
  const [viewingProduct, setViewingProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Todos');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [toast, setToast] = useState(null);

  // ─── Estado para CRUD de Categorías ───────────────
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null); // string o null
  const [catName, setCatName] = useState('');
  const [deleteCatConfirm, setDeleteCatConfirm] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  useEffect(() => {
    if (error) showToast(`Error al sincronizar: ${error}`, 'error');
  }, [error]);

  useEffect(() => {
    if (activeTab === 'pedidos') loadOrders();
  }, [activeTab]);

  const loadOrders = () => {
    try {
      const historyStr = localStorage.getItem('trucco_order_history');
      if (historyStr) setOrders(JSON.parse(historyStr).reverse());
      else setOrders([]);
    } catch (e) { console.error(e); }
  };

  const markOrderCompleted = (orderId) => {
    const newOrders = orders.map(o => o.id === orderId ? { ...o, status: 'completed' } : o);
    setOrders(newOrders);
    localStorage.setItem('trucco_order_history', JSON.stringify(newOrders.reverse()));
    loadOrders();
  };

  const deleteOrder = (orderId) => {
    const newOrders = orders.filter(o => o.id !== orderId);
    setOrders(newOrders);
    localStorage.setItem('trucco_order_history', JSON.stringify(newOrders.reverse()));
    loadOrders();
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

  const rawCategories = categories.filter(c => c !== 'Todos');

  const filteredProducts = products.filter((p) => {
    const matchCategory = filterCategory === 'Todos' || p.category === filterCategory;
    const matchQuery =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchQuery;
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
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-5 py-3 rounded-xl shadow-2xl transition-all ${toast.type === 'success' ? 'bg-green-800 border border-green-600' : 'bg-yellow-800 border border-yellow-600'}`}>
          {toast.type === 'success' ? <CheckCircle className="w-5 h-5 text-green-300 flex-shrink-0" /> : <AlertTriangle className="w-5 h-5 text-yellow-300 flex-shrink-0" />}
          <span className="text-sm text-white max-w-xs">{toast.message}</span>
          <button onClick={() => setToast(null)}><X className="w-4 h-4 text-white/60 hover:text-white" /></button>
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
      <aside className="hidden md:flex w-64 flex-col bg-gray-900 border-r border-gray-800">
        <div className="p-6 border-b border-gray-800 flex flex-col items-center justify-center gap-2">
          <img src="/logo.png" alt="Comidas Rápidas Trucco" className="h-16 w-auto object-contain drop-shadow-lg" />
          <p className="text-xs text-gray-400">Trucco Panel</p>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2">
          <button
            onClick={() => setActiveTab('productos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'productos' ? 'bg-yellow-400/10 text-yellow-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <Package className="w-5 h-5" /> Productos
          </button>

          <button
            onClick={() => setActiveTab('categorias')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'categorias' ? 'bg-yellow-400/10 text-yellow-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <Tag className="w-5 h-5" /> Categorías
          </button>

          <button
            onClick={() => setActiveTab('pedidos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition ${activeTab === 'pedidos' ? 'bg-yellow-400/10 text-yellow-400' : 'text-gray-400 hover:text-white hover:bg-gray-800'}`}
          >
            <ClipboardList className="w-5 h-5" /> Historial de Pedidos
          </button>

          <a href="/" target="_blank" rel="noreferrer" className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-white hover:bg-gray-800 rounded-xl font-medium transition mt-4 border-t border-gray-800 pt-4">
            <ExternalLink className="w-5 h-5" /> Ver mi página
          </a>
        </div>

        <div className="p-4 border-t border-gray-800">
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
          <button onClick={onLogout} className="text-red-400 p-2"><LogOut className="w-5 h-5" /></button>
        </div>
        <div className="flex">
          <button onClick={() => setActiveTab('productos')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition ${activeTab === 'productos' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-500'}`}>Productos</button>
          <button onClick={() => setActiveTab('categorias')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition ${activeTab === 'categorias' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-500'}`}>Categorías</button>
          <button onClick={() => setActiveTab('pedidos')} className={`flex-1 py-3 text-xs font-bold border-b-2 transition ${activeTab === 'pedidos' ? 'border-yellow-400 text-yellow-400' : 'border-transparent text-gray-500'}`}>Pedidos</button>
        </div>
      </div>

      {/* ══════════════ CONTENIDO PRINCIPAL ══════════════ */}
      <main className="flex-1 flex flex-col h-screen overflow-y-auto bg-gray-950/50">

        {/* ── TAB PRODUCTOS ── */}
        {activeTab === 'productos' && (
          <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-5xl mx-auto w-full">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
              <div className="w-full md:w-64 border-t md:border-t-0 md:border-l border-gray-800 p-1">
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

            {/* Grid de productos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
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

            <div className="bg-gradient-to-r from-green-900/30 to-emerald-900/20 border border-green-800/50 rounded-2xl p-5 md:p-6 mt-8 shadow-lg">
              <h3 className="text-base font-bold text-green-400 mb-2 flex items-center gap-2">
                <RefreshCw className="w-5 h-5" /> Sincronización Automática
              </h3>
              <p className="text-sm text-green-200/80 mb-4">Cualquier cambio que realices en el panel se enviará a tu hoja de cálculo.</p>
              <ul className="text-sm text-green-200/70 space-y-2 list-disc list-inside ml-2">
                <li>El indicador de <strong>"Guardando..."</strong> aparecerá cuando guardes.</li>
                <li>Tu hoja de Google Sheets es la fuente oficial de información.</li>
                <li>Los clientes verán los cambios actualizados en máximo 5 minutos en el menú principal.</li>
              </ul>
            </div>
          </div>
        )}

        {/* ══════════════ TAB CATEGORÍAS ══════════════ */}
        {activeTab === 'categorias' && (
          <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-5xl mx-auto w-full">

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
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
              <div className="col-span-2 md:col-span-1 bg-gray-900 border border-gray-800 rounded-2xl p-5 hover:border-gray-700 transition">
                <div className="w-10 h-10 rounded-xl bg-green-400/10 flex items-center justify-center mb-3">
                  <ChefHat className="w-5 h-5 text-green-400" />
                </div>
                <div className="text-2xl font-black text-green-400">
                  {rawCategories.length > 0 ? (Math.round(products.length / rawCategories.length * 10) / 10) : 0}
                </div>
                <div className="text-sm text-gray-400 font-medium">Productos por categoría</div>
              </div>
            </div>

            {/* Grid de tarjetas */}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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
                        {/* Ícono + badge contador */}
                        <div className="flex items-start justify-between mb-5">
                          <div className={`w-14 h-14 rounded-2xl ${pal.icon} flex items-center justify-center shadow-md`}>
                            <Tag className="w-7 h-7" />
                          </div>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-full bg-gray-900/60 ${pal.badge} border ${pal.border} backdrop-blur-sm`}>
                            {count} {count === 1 ? 'producto' : 'productos'}
                          </span>
                        </div>

                        {/* Nombre de la categoría */}
                        <h3 className="text-xl font-black text-white mb-4 leading-tight">{cat}</h3>

                        {/* Barra de progreso */}
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

                        {/* Botones de acción */}
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

                {/* Tarjeta "Agregar nueva" */}
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

            {/* Nota Apps Script */}
            <div className="bg-orange-900/20 border border-orange-800/40 rounded-2xl p-4 text-sm text-orange-200/80 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
              <div>
                <strong className="text-orange-300">Para sincronizar con Google Sheets:</strong> Actualiza el Apps Script con el código nuevo que soporta <code className="bg-orange-900/30 px-1 rounded">saveCategories</code>. Los cambios se guardan localmente de inmediato, pero para que queden en el Excel necesitas actualizar el script.
              </div>
            </div>
          </div>
        )}



        {/* ══════════════ TAB PEDIDOS ══════════════ */}
        {activeTab === 'pedidos' && (
          <div className="p-4 md:p-8 space-y-6 md:space-y-8 max-w-5xl mx-auto w-full">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">Historial de Pedidos</h1>
              <p className="text-gray-400 text-sm">Pedidos generados desde el carrito de compras</p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {orders.length === 0 ? (
                <div className="text-center py-16 bg-gray-900 rounded-3xl border border-gray-800">
                  <ClipboardList className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-300">No hay pedidos</h3>
                  <p className="text-gray-500 mt-2">Aún no se han enviado pedidos a WhatsApp.</p>
                </div>
              ) : (
                orders.map((order) => (
                  <div key={order.id} className={`flex flex-col bg-gray-900 border ${order.status === 'completed' ? 'border-green-800/50' : 'border-gray-800'} rounded-3xl p-5 md:p-6 transition shadow-lg`}>
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                          #{order.id} - {order.name}
                          {order.status === 'completed' && (
                            <span className="bg-green-900/30 text-green-400 text-xs px-2 py-1 rounded-md flex items-center gap-1"><Check className="w-3 h-3" /> Completado</span>
                          )}
                        </h3>
                        <p className="text-xs text-gray-400 mt-1">{order.date} a las {order.time}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-black text-xl text-yellow-400">${order.total.toLocaleString('es-CO')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-300 mb-4 bg-gray-950 p-4 rounded-xl border border-gray-800">
                      <div>
                        <p><strong className="text-gray-400">Teléfono:</strong> {order.phone}</p>
                        <p><strong className="text-gray-400">Tipo:</strong> {order.orderType === 'domicilio' ? '🛵 Domicilio' : '🏪 Recoger'}</p>
                        {order.address && <p><strong className="text-gray-400">Dirección:</strong> {order.address}</p>}
                        {order.notes && <p><strong className="text-gray-400">Notas:</strong> {order.notes}</p>}
                      </div>
                      <div>
                        <strong className="block text-gray-400 mb-1">Productos:</strong>
                        <ul className="space-y-1">
                          {order.items.map((item, i) => (
                            <li key={i} className="flex justify-between border-b border-gray-800 pb-1 last:border-0">
                              <span>{item.quantity}x {item.name} {item.variantLabel !== item.name ? `(${item.variantLabel})` : ''}</span>
                              <span className="text-gray-500">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end mt-2 pt-4 border-t border-gray-800">
                      {order.status !== 'completed' && (
                        <button onClick={() => markOrderCompleted(order.id)} className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-500 text-white font-medium rounded-xl transition text-sm">
                          <Check className="w-4 h-4" /> Marcar Listo
                        </button>
                      )}
                      <button onClick={() => deleteOrder(order.id)} className="flex items-center gap-2 px-4 py-2 bg-red-900/30 text-red-400 hover:bg-red-900/50 hover:text-red-300 font-medium rounded-xl transition text-sm">
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
