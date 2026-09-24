import { useState } from 'react';
import { Save, X, Upload, Plus, Trash2, Image as ImageIcon, Tag, DollarSign, AlignLeft, ChefHat, FolderPlus } from 'lucide-react';

const CATEGORIES_FALLBACK = [
  'Perros Calientes',
  'Hamburguesas',
  'Salchipapas',
  'Burritos',
  'Picadas',
  'Patacones',
  'Mega Picada',
];

const emptyVariant = { label: '', price: 0 };

export default function AdminProductForm({ product, categories: dynamicCategories = [], onSave, onCancel }) {
  const isEditing = !!product;

  // Filtrar categorías válidas dinámicas (sin 'Todos')
  const baseList = Array.isArray(dynamicCategories) && dynamicCategories.length > 0
    ? dynamicCategories.filter(c => c && c !== 'Todos')
    : CATEGORIES_FALLBACK;

  // Si el producto actual tiene una categoría que no está en la lista, incluirla
  const categoryOptions = product?.category && !baseList.includes(product.category)
    ? [product.category, ...baseList]
    : baseList;

  const [form, setForm] = useState({
    name: product?.name || '',
    description: product?.description || '',
    category: product?.category || categoryOptions[0] || 'Hamburguesas',
    image: product?.image || '',
    variants: product?.variants?.length
      ? product.variants.map(v => ({ label: v.label, price: v.price }))
      : [{ ...emptyVariant }],
  });

  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [customCategoryName, setCustomCategoryName] = useState('');

  const [imagePreview, setImagePreview] = useState(product?.image || null);
  const [imageMode, setImageMode] = useState(product?.image?.startsWith('data:') ? 'upload' : 'url');
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  // Manejar subida de imagen desde el dispositivo
  const handleImageFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({ ...prev, image: 'El archivo debe ser una imagen.' }));
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setErrors(prev => ({ ...prev, image: 'La imagen no debe superar 5 MB.' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target.result;
      setImagePreview(dataUrl);
      setForm(prev => ({ ...prev, image: dataUrl }));
      setErrors(prev => ({ ...prev, image: undefined }));
    };
    reader.readAsDataURL(file);
  };

  const handleVariantChange = (index, field, value) => {
    setForm(prev => {
      const updated = [...prev.variants];
      updated[index] = { ...updated[index], [field]: field === 'price' ? Number(value) : value };
      return { ...prev, variants: updated };
    });
  };

  const addVariant = () => {
    setForm(prev => ({ ...prev, variants: [...prev.variants, { ...emptyVariant }] }));
  };

  const removeVariant = (index) => {
    setForm(prev => ({
      ...prev,
      variants: prev.variants.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    const newErrors = {};
    if (!form.name.trim()) newErrors.name = 'El nombre es obligatorio.';
    
    const activeCategory = isCustomCategory ? customCategoryName.trim() : form.category;
    if (!activeCategory) newErrors.category = 'Selecciona o escribe una categoría.';
    
    if (!form.image) newErrors.image = 'La imagen es obligatoria.';
    if (form.variants.length === 0) newErrors.variants = 'Agrega al menos una variante/precio.';
    form.variants.forEach((v, i) => {
      if (!v.label.trim()) newErrors[`variant_label_${i}`] = 'Nombre requerido.';
      if (!v.price || v.price <= 0) newErrors[`variant_price_${i}`] = 'Precio inválido.';
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);

    const activeCategory = isCustomCategory && customCategoryName.trim()
      ? customCategoryName.trim()
      : form.category;

    const dataToSave = {
      ...form,
      category: activeCategory
    };

    setTimeout(() => {
      onSave(dataToSave);
      setSaving(false);
    }, 300);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-[60] overflow-y-auto flex items-start justify-center p-4"
      onClick={onCancel}
    >
      <div 
        className="bg-gray-950 w-full max-w-2xl my-8 md:my-16 rounded-3xl border border-gray-800 shadow-2xl overflow-hidden text-left relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header del Modal */}
        <div className="bg-gray-900 border-b border-gray-800 sticky top-0 z-10">
          <div className="px-5 py-4 flex items-center justify-between">
            <div>
              <h1 className="text-lg font-bold text-white">
                {isEditing ? 'Editar Producto' : 'Nuevo Producto'}
              </h1>
              <p className="text-xs text-gray-400">
                {isEditing ? `Editando: ${product.name}` : 'Completa los datos del nuevo plato'}
              </p>
            </div>
            <button
              onClick={onCancel}
              className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="px-5 py-6 space-y-6">

        {/* Imagen del producto */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-yellow-400 flex items-center gap-2">
            <ImageIcon className="w-4 h-4" /> Imagen del Plato
          </h2>

          {/* Tabs URL vs Subir */}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setImageMode('upload')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${imageMode === 'upload' ? 'bg-yellow-400 text-gray-900 font-bold' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              📁 Subir desde PC/Celular
            </button>
            <button
              type="button"
              onClick={() => setImageMode('url')}
              className={`flex-1 py-2 rounded-xl text-sm font-medium transition ${imageMode === 'url' ? 'bg-yellow-400 text-gray-900 font-bold' : 'bg-gray-800 text-gray-400 hover:bg-gray-700'}`}
            >
              🔗 URL de imagen
            </button>
          </div>

          {imageMode === 'upload' ? (
            <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-700 hover:border-yellow-400 rounded-xl p-6 cursor-pointer transition group">
              <Upload className="w-8 h-8 text-gray-500 group-hover:text-yellow-400 mb-2 transition" />
              <span className="text-sm text-gray-400 group-hover:text-white transition">
                Haz clic para seleccionar una imagen
              </span>
              <span className="text-xs text-gray-600 mt-1">JPG, PNG, WEBP — Máx. 5 MB</span>
              <input type="file" accept="image/*" onChange={handleImageFile} className="hidden" />
            </label>
          ) : (
            <div>
              <input
                type="text"
                placeholder="https://... o /images/mi-plato.jpg"
                value={form.image.startsWith('data:') ? '' : form.image}
                onChange={(e) => {
                  setForm(prev => ({ ...prev, image: e.target.value }));
                  setImagePreview(e.target.value);
                  setErrors(prev => ({ ...prev, image: undefined }));
                }}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
              />
            </div>
          )}

          {/* Preview */}
          {imagePreview && (
            <div className="relative">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-full h-48 object-cover rounded-xl border border-gray-700"
                onError={() => setImagePreview(null)}
              />
              <button
                type="button"
                onClick={() => { setImagePreview(null); setForm(prev => ({ ...prev, image: '' })); }}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          {errors.image && <p className="text-red-400 text-xs">{errors.image}</p>}
        </div>

        {/* Datos básicos */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
          <h2 className="font-semibold text-yellow-400 flex items-center gap-2">
            <ChefHat className="w-4 h-4" /> Información del Plato
          </h2>

          {/* Nombre */}
          <div>
            <label className="text-sm text-gray-300 mb-1.5 block font-medium">
              <Tag className="w-3.5 h-3.5 inline mr-1" /> Nombre del plato
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => { setForm(prev => ({ ...prev, name: e.target.value })); setErrors(prev => ({ ...prev, name: undefined })); }}
              placeholder="Ej. Perro Ranchero Especial"
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
            />
            {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* Descripción */}
          <div>
            <label className="text-sm text-gray-300 mb-1.5 block font-medium">
              <AlignLeft className="w-3.5 h-3.5 inline mr-1" /> Descripción
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Describe los ingredientes y el sabor del plato..."
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm resize-none"
            />
          </div>

          {/* Categoría Dinámica */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm text-gray-300 font-medium">Categoría</label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-xs text-yellow-400 hover:text-yellow-300 transition flex items-center gap-1 font-semibold"
              >
                <FolderPlus className="w-3.5 h-3.5" />
                {isCustomCategory ? 'Seleccionar existente' : 'Escribir nueva categoría'}
              </button>
            </div>

            {isCustomCategory ? (
              <div>
                <input
                  type="text"
                  value={customCategoryName}
                  onChange={(e) => {
                    setCustomCategoryName(e.target.value);
                    if (errors.category) setErrors(prev => ({ ...prev, category: undefined }));
                  }}
                  placeholder="Escribe el nombre de la nueva categoría (Ej. Bebidas, Desgranados...)"
                  className="w-full bg-gray-800 border border-yellow-500/50 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm"
                  autoFocus
                />
                <p className="text-xs text-gray-400 mt-1">Esta nueva categoría se guardará automáticamente en el sistema.</p>
              </div>
            ) : (
              <select
                value={form.category}
                onChange={(e) => {
                  setForm(prev => ({ ...prev, category: e.target.value }));
                  if (errors.category) setErrors(prev => ({ ...prev, category: undefined }));
                }}
                className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-yellow-400 text-sm cursor-pointer"
              >
                {categoryOptions.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
            {errors.category && <p className="text-red-400 text-xs mt-1">{errors.category}</p>}
          </div>
        </div>

        {/* Variantes y precios */}
        <div className="bg-gray-900 rounded-2xl border border-gray-800 p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-yellow-400 flex items-center gap-2">
              <DollarSign className="w-4 h-4" /> Precios y Porciones
            </h2>
            <button
              type="button"
              onClick={addVariant}
              className="flex items-center gap-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-yellow-400 px-3 py-1.5 rounded-lg transition border border-gray-700"
            >
              <Plus className="w-3.5 h-3.5" /> Agregar tamaño
            </button>
          </div>

          {form.variants.map((variant, index) => (
            <div key={index} className="flex gap-2 items-start">
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={variant.label}
                  onChange={(e) => handleVariantChange(index, 'label', e.target.value)}
                  placeholder="Ej. Perro Sencillo / Para 2 personas"
                  className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                />
                {errors[`variant_label_${index}`] && <p className="text-red-400 text-xs">{errors[`variant_label_${index}`]}</p>}
              </div>
              <div className="w-32 space-y-2">
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">$</span>
                  <input
                    type="number"
                    value={variant.price || ''}
                    onChange={(e) => handleVariantChange(index, 'price', e.target.value)}
                    placeholder="0"
                    min="0"
                    className="w-full bg-gray-800 border border-gray-700 text-white rounded-xl pl-6 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-400"
                  />
                </div>
                {errors[`variant_price_${index}`] && <p className="text-red-400 text-xs">{errors[`variant_price_${index}`]}</p>}
              </div>
              {form.variants.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="p-2 text-red-400 hover:text-red-300 hover:bg-red-900/30 rounded-xl transition mt-0.5"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
          {errors.variants && <p className="text-red-400 text-xs">{errors.variants}</p>}

          <p className="text-xs text-gray-600">
            Tip: Si el plato tiene un solo precio, deja solo una fila. Si viene en varios tamaños (pequeño/grande o 1/2/3 personas), agrega una fila por cada opción.
          </p>
        </div>

        {/* Botones inferiores */}
        <div className="flex gap-3 pb-8">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-800 hover:bg-gray-700 text-gray-300 font-medium py-3 rounded-xl transition border border-gray-700"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-gray-900 font-bold py-3 rounded-xl transition shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <div className="w-5 h-5 border-2 border-gray-900/30 border-t-gray-900 rounded-full animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {isEditing ? 'Guardar cambios' : 'Crear producto'}
          </button>
        </div>
      </form>
      </div>
    </div>
  );
}
