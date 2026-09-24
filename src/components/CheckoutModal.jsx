import { useState, useEffect } from 'react';
import { X, Send, CheckCircle, ShieldAlert, Loader2, AlertCircle, FileText, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { WHATSAPP_NUMBER } from '../data/products';
import { APPS_SCRIPT_URL } from '../hooks/useSheetProducts';

const COOLDOWN_SECONDS = 45; // 45 segundos de espera entre pedidos

export default function CheckoutModal({ isOpen, onClose, cart, onConfirmOrder }) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    orderType: 'recoger',
    address: '',
    notes: ''
  });
  
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const [savedTicket, setSavedTicket] = useState(null);

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Comprobar y gestionar el temporizador anti-spam (Rate Limiting)
  useEffect(() => {
    const checkCooldown = () => {
      const lastOrderTime = localStorage.getItem('trucco_last_order_timestamp');
      if (lastOrderTime) {
        const elapsed = Math.floor((Date.now() - parseInt(lastOrderTime, 10)) / 1000);
        if (elapsed < COOLDOWN_SECONDS) {
          setCooldownRemaining(COOLDOWN_SECONDS - elapsed);
        } else {
          setCooldownRemaining(0);
        }
      }
    };

    checkCooldown();
    const interval = setInterval(checkCooldown, 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Generador y descargador de archivo TXT
  const downloadTicketTxt = (filename, content) => {
    try {
      const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error al descargar txt:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    // 1. Verificación de seguridad: Cooldown activo
    if (cooldownRemaining > 0) {
      setErrorMessage(`⚠️ Por favor espera ${cooldownRemaining}s antes de enviar otro pedido.`);
      return;
    }

    // 2. Verificación de seguridad: Evitar múltiples clics simultáneos (Debounce/Lock)
    if (isSubmitting) return;

    // 3. Verificación de carrito vacío
    if (!cart || cart.length === 0) {
      setErrorMessage('El carrito está vacío. Agrega productos para continuar.');
      return;
    }

    // 4. Validaciones estrictas de datos
    const cleanName = formData.name.trim();
    if (cleanName.length < 3) {
      setErrorMessage('Por favor escribe tu nombre completo (mínimo 3 letras).');
      return;
    }

    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      setErrorMessage('Por favor ingresa un número de teléfono válido de 10 dígitos (Ej: 310 123 4567).');
      return;
    }

    if (formData.orderType === 'domicilio') {
      const cleanAddress = formData.address.trim();
      if (cleanAddress.length < 6) {
        setErrorMessage('Por favor ingresa una dirección de entrega completa.');
        return;
      }
    }

    // Bloquear el botón inmediatamente para proteger de spam / spam-clicking
    setIsSubmitting(true);

    try {
      const now = new Date();
      const dateFormatted = now.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
      const timeFormatted = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit', hour12: true });
      const orderId = now.getTime();

      // ═══ 1. CONSTRUIR TEXTO DEL COMPROBANTE TXT ═══
      let ticketContent = `=====================================================\n`;
      ticketContent += `          COMIDAS RAPIDAS TRUCCO - PEDIDO\n`;
      ticketContent += `=====================================================\n`;
      ticketContent += `Fecha: ${dateFormatted} - ${timeFormatted}\n`;
      ticketContent += `ID Pedido: #${orderId}\n`;
      ticketContent += `Estado: Enviado por WhatsApp\n\n`;

      ticketContent += `-----------------------------------------------------\n`;
      ticketContent += `DATOS DEL CLIENTE\n`;
      ticketContent += `-----------------------------------------------------\n`;
      ticketContent += `Nombre: ${cleanName}\n`;
      ticketContent += `Telefono: ${cleanPhone}\n`;
      ticketContent += `Modalidad: ${formData.orderType === 'domicilio' ? 'Domicilio' : 'Recoger en el punto'}\n`;
      if (formData.orderType === 'domicilio' && formData.address) {
        ticketContent += `Direccion: ${formData.address.trim()}\n`;
      }
      if (formData.notes) {
        ticketContent += `Observaciones: ${formData.notes.trim()}\n`;
      }
      ticketContent += `\n`;

      ticketContent += `-----------------------------------------------------\n`;
      ticketContent += `DETALLE DEL PEDIDO\n`;
      ticketContent += `-----------------------------------------------------\n`;
      cart.forEach((item, index) => {
        const variantText = item.variantLabel && item.variantLabel !== item.name ? ` (${item.variantLabel})` : '';
        ticketContent += `${index + 1}. ${item.quantity}x ${item.name}${variantText}\n`;
        ticketContent += `   Subtotal: $${(item.price * item.quantity).toLocaleString('es-CO')} COP\n`;
      });
      ticketContent += `\n`;

      ticketContent += `=====================================================\n`;
      ticketContent += `TOTAL A PAGAR: $${total.toLocaleString('es-CO')} COP\n`;
      ticketContent += `=====================================================\n`;
      ticketContent += `¡Gracias por preferir Comidas Rapidas Trucco!\n`;
      ticketContent += `Direccion: Urbanizacion Emmanuel, Barrio 20 de Julio\n`;
      ticketContent += `Cartagena, Bolivar\n`;
      ticketContent += `=====================================================\n`;

      // Nombre del archivo txt: Pedido_[Nombre]_[Fecha]_[Hora].txt
      const safeName = cleanName.replace(/[^a-zA-Z0-9]/g, '_');
      const fileDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
      const fileTime = `${String(now.getHours()).padStart(2, '0')}-${String(now.getMinutes()).padStart(2, '0')}`;
      const fileName = `Pedido_${safeName}_${fileDate}_${fileTime}.txt`;

      setSavedTicket({ filename: fileName, content: ticketContent });

      // Guardar en disco local en public/pedidos (vía Vite server middleware)
      try {
        await fetch('/api/save-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ filename: fileName, content: ticketContent })
        });
      } catch (err) {
        // En producción (ej. Netlify) fetch local es omitido silenciosamente
      }

      // ═══ 2. CONSTRUIR MENSAJE LIMPIO DE WHATSAPP (100% UTF-8 CODIFICADO) ═══
      let rawWhatsAppText = `*¡Hola Comidas Rápidas Trucco!* 👋\n\n`;
      rawWhatsAppText += `Quiero realizar el siguiente pedido:\n\n`;
      
      rawWhatsAppText += `==========================\n`;
      rawWhatsAppText += `🍔 *RESUMEN DEL PEDIDO*\n`;
      rawWhatsAppText += `==========================\n`;
      cart.forEach(item => {
        const variantText = item.variantLabel && item.variantLabel !== item.name ? ` (${item.variantLabel})` : '';
        rawWhatsAppText += `• ${item.quantity}x ${item.name}${variantText} → $${(item.price * item.quantity).toLocaleString('es-CO')}\n`;
      });
      
      rawWhatsAppText += `\n💰 *TOTAL A PAGAR: $${total.toLocaleString('es-CO')}*\n\n`;
      
      rawWhatsAppText += `==========================\n`;
      rawWhatsAppText += `📋 *DATOS DE ENTREGA*\n`;
      rawWhatsAppText += `==========================\n`;
      rawWhatsAppText += `• *Cliente:* ${cleanName}\n`;
      rawWhatsAppText += `• *Teléfono:* ${cleanPhone}\n`;
      rawWhatsAppText += `• *Modalidad:* ${formData.orderType === 'domicilio' ? '🛵 Domicilio' : '🏪 Recoger en el punto'}\n`;
      if (formData.orderType === 'domicilio' && formData.address) {
        rawWhatsAppText += `• *Dirección:* ${formData.address.trim()}\n`;
      }
      if (formData.notes) {
        rawWhatsAppText += `• *Observaciones:* ${formData.notes.trim()}\n`;
      }
      rawWhatsAppText += `\n¡Quedo atento a su confirmación! Muchas gracias. 🙌`;

      // Registrar timestamp en almacenamiento local para anti-spam persistente
      localStorage.setItem('trucco_last_order_timestamp', Date.now().toString());
      setCooldownRemaining(COOLDOWN_SECONDS);

      // --- NUEVO: Guardar en el historial local del dashboard ---
      try {
        const historyStr = localStorage.getItem('trucco_order_history');
        const history = historyStr ? JSON.parse(historyStr) : [];
        history.push({
          id: orderId,
          date: dateFormatted,
          time: timeFormatted,
          name: cleanName,
          phone: cleanPhone,
          orderType: formData.orderType,
          address: formData.address,
          notes: formData.notes,
          items: cart,
          total,
          status: 'pending' // pending, completed
        });
        localStorage.setItem('trucco_order_history', JSON.stringify(history));
      } catch (err) {
        console.error("Error guardando historial local", err);
      }
      // -----------------------------------------------------------

      // --- NUEVO: Guardar pedido en Google Sheets (pestaña 'pedidos') ---
      try {
        fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          mode: 'no-cors',
          headers: { 'Content-Type': 'text/plain;charset=utf-8' },
          body: JSON.stringify({
            action: 'saveOrder',
            order: {
              id: orderId,
              date: dateFormatted,
              time: timeFormatted,
              name: cleanName,
              phone: cleanPhone,
              orderType: formData.orderType,
              address: formData.address || '',
              notes: formData.notes || '',
              items: cart,
              itemsSummary: cart.map(i => `${i.quantity}x ${i.name}${i.variantLabel && i.variantLabel !== i.name ? ` (${i.variantLabel})` : ''}`).join(', '),
              total: total,
              status: 'pending'
            }
          })
        }).catch(e => console.warn('Fetch saveOrder async caught:', e));
      } catch (err) {
        console.warn("Error enviando pedido a Google Sheets:", err);
      }
      // -----------------------------------------------------------------

      // CODIFICACIÓN ESTRICTA: encodeURIComponent garantiza cero caracteres corruptos o 
      const encodedMessage = encodeURIComponent(rawWhatsAppText);
      const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodedMessage}`;
      window.open(whatsappUrl, '_blank');
      
      setIsSubmitted(true);
      if (onConfirmOrder) {
        onConfirmOrder({ ...formData, ticketFileName: fileName });
      }
    } catch (err) {
      console.error(err);
      setErrorMessage('Ocurrió un error al procesar el pedido. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (isSubmitted) {
      setIsSubmitted(false);
      setSavedTicket(null);
      setFormData({ name: '', phone: '', orderType: 'recoger', address: '', notes: '' });
    }
    setErrorMessage('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={handleClose} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="bg-cream rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 bg-neutral text-white flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-black">{isSubmitted ? '¡Pedido Enviado!' : 'Confirmar Pedido'}</h2>
                <p className="text-gray-400 text-sm mt-1">{isSubmitted ? 'Tu orden ha sido registrada' : 'Llena tus datos para enviarlo por WhatsApp'}</p>
              </div>
              <button onClick={handleClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                <X className="w-6 h-6" />
              </button>
            </div>

            {isSubmitted ? (
              <div className="p-8 flex flex-col items-center justify-center text-center space-y-4">
                <motion.div 
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 bg-green-100 text-green-500 rounded-full flex items-center justify-center mb-2"
                >
                  <CheckCircle className="w-10 h-10" />
                </motion.div>
                <h3 className="text-2xl font-black text-neutral">¡Todo listo, {formData.name}!</h3>
                <p className="text-gray-500 max-w-sm text-sm">
                  Tu pedido ha sido enviado con éxito a WhatsApp, el carrito se ha vaciado y guardamos el registro en tu historial.
                </p>

                <button 
                  onClick={handleClose}
                  className="mt-4 w-full py-3.5 rounded-xl font-black text-base bg-neutral text-white hover:bg-neutral-800 transition-colors"
                >
                  Cerrar y seguir navegando
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 overflow-y-auto flex-1 space-y-5">
                {/* Resumen del pedido */}
                <div className="bg-white p-4 rounded-2xl border border-cream-dark">
                  <h3 className="font-bold text-sm text-gray-500 mb-3 uppercase tracking-wider">Resumen</h3>
                  {cart.map((item, i) => (
                    <div key={i} className="flex justify-between items-center py-2 border-b border-cream last:border-0">
                      <div className="flex flex-col">
                        <span className="text-sm"><strong>{item.quantity}x</strong> {item.name}</span>
                        {item.variantLabel && item.variantLabel !== item.name && (
                          <span className="text-xs text-gray-500 leading-tight">{item.variantLabel}</span>
                        )}
                      </div>
                      <span className="text-sm font-bold text-primary ml-4">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                    </div>
                  ))}
                  <div className="flex justify-between items-center pt-3 mt-2 border-t-2 border-neutral">
                    <span className="font-black text-lg">TOTAL</span>
                    <span className="font-black text-xl text-primary">${total.toLocaleString('es-CO')}</span>
                  </div>
                </div>

                {/* Banner de alerta de cooldown / rate-limiting */}
                {cooldownRemaining > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3 text-amber-800">
                    <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="block font-bold mb-0.5">Control anti-saturación activo:</strong>
                      Para evitar spam y pedidos duplicados en WhatsApp, por favor espera <strong>{cooldownRemaining}s</strong> antes de enviar un nuevo pedido.
                    </div>
                  </div>
                )}

                {/* Mensaje de error de validación */}
                {errorMessage && (
                  <div className="bg-red-50 border border-red-200 text-red-700 p-3.5 rounded-xl text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-500" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-neutral mb-1.5">Tu Nombre</label>
                  <input 
                    required 
                    type="text" 
                    value={formData.name} 
                    onChange={e => {
                      setFormData({...formData, name: e.target.value});
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-cream-dark bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium"
                    placeholder="Ej. Juan Pérez" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-neutral mb-1.5">Teléfono (WhatsApp)</label>
                  <input 
                    required 
                    type="tel" 
                    value={formData.phone} 
                    onChange={e => {
                      setFormData({...formData, phone: e.target.value});
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="w-full px-4 py-3.5 rounded-xl border-2 border-cream-dark bg-white focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all font-medium"
                    placeholder="Ej. 310 123 4567" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-neutral mb-1.5">Tipo de Pedido</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setFormData({...formData, orderType: 'recoger'})}
                      className={`py-3.5 rounded-xl font-bold border-2 transition-all ${formData.orderType === 'recoger' ? 'border-primary bg-primary/10 text-primary' : 'border-cream-dark bg-white text-gray-500 hover:border-gray-300'}`}>
                      🏪 Recoger
                    </button>
                    <button type="button" onClick={() => setFormData({...formData, orderType: 'domicilio'})}
                      className={`py-3.5 rounded-xl font-bold border-2 transition-all ${formData.orderType === 'domicilio' ? 'border-primary bg-primary/10 text-primary' : 'border-cream-dark bg-white text-gray-500 hover:border-gray-300'}`}>
                      🛵 Domicilio
                    </button>
                  </div>
                </div>

                {formData.orderType === 'domicilio' && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                    <label className="block text-sm font-bold text-neutral mb-1.5">Dirección de Entrega</label>
                    <input 
                      required 
                      type="text" 
                      value={formData.address} 
                      onChange={e => {
                        setFormData({...formData, address: e.target.value});
                        if (errorMessage) setErrorMessage('');
                      }}
                      className="w-full px-4 py-3.5 rounded-xl border-2 border-cream-dark bg-white focus:ring-2 focus:ring-primary outline-none font-medium"
                      placeholder="Ej. Calle 123 #45-67, Barrio..." 
                    />
                  </motion.div>
                )}

                <div>
                  <label className="block text-sm font-bold text-neutral mb-1.5">Notas adicionales (Opcional)</label>
                  <textarea 
                    value={formData.notes} 
                    onChange={e => setFormData({...formData, notes: e.target.value})}
                    className="w-full px-4 py-3 rounded-xl border-2 border-cream-dark bg-white focus:ring-2 focus:ring-primary outline-none resize-none font-medium"
                    placeholder="Ej. Sin cebolla, salsas aparte..." rows="2" 
                  />
                </div>

                <button 
                  type="submit"
                  disabled={cooldownRemaining > 0 || isSubmitting}
                  className={`w-full py-4 rounded-xl font-black text-lg transition-all flex items-center justify-center gap-3 shadow-lg ${
                    cooldownRemaining > 0 || isSubmitting
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed shadow-none'
                      : 'text-white bg-[#25D366] hover:bg-[#1da851] shadow-green-500/30 active:scale-[0.98]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Procesando pedido...
                    </>
                  ) : cooldownRemaining > 0 ? (
                    <>
                      <ShieldAlert className="w-5 h-5 text-amber-600" />
                      Espera {cooldownRemaining}s para volver a pedir
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      Confirmar y Enviar por WhatsApp
                    </>
                  )}
                </button>
              </form>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
