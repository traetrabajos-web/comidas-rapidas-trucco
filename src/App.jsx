import { useState, useEffect } from 'react';
import { ShoppingCart, Clock, MapPin, Phone, Menu as MenuIcon, X, QrCode, ArrowRight, Star, Flame, ChefHat, Truck, Heart, ArrowDown } from 'lucide-react';
import { WHATSAPP_NUMBER } from './data/products';
import { useSheetProducts } from './hooks/useSheetProducts';
import ProductCard from './components/ProductCard';
import CartSidebar from './components/CartSidebar';
import CheckoutModal from './components/CheckoutModal';
import { motion, AnimatePresence } from 'framer-motion';


function App() {
  // ── Productos desde Google Sheets (con fallback a products.js) ──
  const { products, categories } = useSheetProducts();

  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem('trucco_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('trucco_cart', JSON.stringify(cart));
    } catch (err) {
      console.error('Error guardando carrito:', err);
    }
  }, [cart]);

  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeSection, setActiveSection] = useState('inicio');
  const [heroSlide, setHeroSlide] = useState(0);
  const [activeCategory, setActiveCategory] = useState("Todos");
  const [orderHistory, setOrderHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('trucco_order_history');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const handleOrderComplete = (orderData) => {
    const newOrder = { 
      ...orderData, 
      id: Date.now(),
      date: new Date().toISOString(), 
      items: [...cart] 
    };
    setOrderHistory(prev => {
      const updated = [newOrder, ...prev];
      try {
        localStorage.setItem('trucco_order_history', JSON.stringify(updated));
      } catch (err) {
        console.error('Error saving order history:', err);
      }
      return updated;
    });
    setCart([]);
  };

  // Filtramos los productos destacados para el Hero (uno de cada categoría principal)
  const heroProducts = [
    products.find(p => p.id === 7), // Perro todas las carnes
    products.find(p => p.id === 8), // Hamburguesa
    products.find(p => p.id === 12), // Salchipapas
    products.find(p => p.id === 16), // Burrito
    products.find(p => p.id === 19), // Mega Picada
  ].filter(Boolean);

  const heroImages = heroProducts.map(p => p.image);

  const filteredProducts = activeCategory === "Todos"
    ? products
    : products.filter(p => p.category === activeCategory);

  // Auto-avance del carrusel cada 10 segundos
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroSlide((prev) => (prev + 1) % heroImages.length);
    }, 10000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  // Restaurar sección activa si se recarga la página
  useEffect(() => {
    const targetHash = window.location.hash.replace('#', '') || sessionStorage.getItem('trucco_active_section');
    if (targetHash && targetHash !== 'inicio') {
      setActiveSection(targetHash);
      const timer = setTimeout(() => {
        const element = document.getElementById(targetHash);
        if (element) {
          const offset = 80;
          const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
          window.scrollTo({ top, behavior: 'smooth' });
        }
      }, 150);
      return () => clearTimeout(timer);
    }
  }, []);

  // Detectar la sección actual al scrollear y sincronizarla
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);

      const sections = ['inicio', 'nosotros', 'menu', 'contacto'];
      const scrollPos = window.scrollY + 200;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            sessionStorage.setItem('trucco_active_section', sectionId);
            if (window.location.hash !== `#${sectionId}` && sectionId !== 'inicio') {
              window.history.replaceState(null, null, `#${sectionId}`);
            } else if (sectionId === 'inicio' && window.location.hash) {
              window.history.replaceState(null, null, window.location.pathname);
            }
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isRestaurantOpen = () => {
    const hour = new Date().getHours();
    return hour >= 17 || hour === 0;
  };
  const openStatus = isRestaurantOpen();

  const addToCart = (product) => {
    const existingIndex = cart.findIndex(item => item.id === product.id);
    if (existingIndex >= 0) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    setIsCartOpen(true);
  };

  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  const navLinks = [
    { name: 'Inicio', href: 'inicio' },
    { name: 'Nosotros', href: 'nosotros' },
    { name: 'Menú', href: 'menu' },
    { name: 'Contacto', href: 'contacto' },
  ];

  const scrollTo = (id) => {
    setIsMobileMenuOpen(false);
    setActiveSection(id);
    sessionStorage.setItem('trucco_active_section', id);
    if (id !== 'inicio') {
      window.history.replaceState(null, null, `#${id}`);
    } else {
      window.history.replaceState(null, null, window.location.pathname);
    }
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const top = element.getBoundingClientRect().top + window.pageYOffset - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">

      {/* ═══════════════ NAVBAR ═══════════════ */}
      <header className={`fixed top-0 w-full z-50 transition-all duration-500 ${scrolled ? 'bg-neutral shadow-2xl' : 'bg-transparent'}`}>
        {/* Top bar */}
        <div className={`transition-all duration-300 overflow-hidden ${scrolled ? 'max-h-0 opacity-0' : 'max-h-14 opacity-100'}`}>
          <div className="bg-secondary text-neutral text-center py-1.5 px-3 text-xs sm:text-sm font-black tracking-wide">
            <span className="inline sm:hidden">🔥 Abiertos 5:00 PM a 12:00 AM — ¡Pide ya!</span>
            <span className="hidden sm:inline">🔥 Abiertos todos los días de 5:00 PM a 12:00 AM — ¡Haz tu pedido ahora!</span>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
          <div className="cursor-pointer z-50 relative" onClick={() => scrollTo('inicio')}>
            <img
              src="/logo.png"
              alt="Trucco"
              className={`transition-all duration-300 object-contain ${scrolled ? 'h-10 sm:h-14' : 'h-12 sm:h-20 md:h-24 drop-shadow-lg'}`}
            /></div>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1 bg-white/10 backdrop-blur-md px-2 py-2 rounded-full border border-white/10">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollTo(link.href)}
                className={`font-bold px-5 py-2.5 rounded-full text-sm uppercase tracking-wider transition-all ${activeSection === link.href
                  ? 'bg-primary text-white shadow-md'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
                  }`}
              >
                {link.name}
              </button>
            ))}
            
            <div className="w-px h-6 bg-white/20 mx-1"></div>
            
            <a
              href="/admin"
              className="font-bold px-4 py-2 rounded-full text-sm uppercase tracking-wider transition-all text-yellow-400 hover:text-white hover:bg-white/10 flex items-center gap-2"
            >
              <ChefHat className="w-4 h-4" /> Admin
            </a>
          </nav>

          <div className="flex items-center gap-3 z-50 relative">
            {orderHistory.length > 0 && (
              <button
                onClick={() => setIsHistoryOpen(true)}
                className="hidden sm:flex items-center gap-2 p-3 bg-white/10 backdrop-blur-md text-white rounded-full hover:bg-white/20 transition-all font-bold text-sm border border-white/10"
              >
                <Clock className="w-5 h-5" /> Mis Pedidos
              </button>
            )}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-3 bg-primary text-white rounded-full hover:bg-primary-dark transition-all hover:scale-105 shadow-lg shadow-primary/30 flex items-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              {cartItemsCount > 0 && (
                <>
                  <span className="hidden sm:block font-bold text-sm pr-1">
                    ${cart.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('es-CO')}
                  </span>
                  <span className="absolute -top-2 -right-2 bg-secondary text-neutral text-xs font-black rounded-full w-6 h-6 flex items-center justify-center shadow-md animate-bounce">
                    {cartItemsCount}
                  </span>
                </>
              )}
            </button>

            <button
              className="lg:hidden p-2 rounded-full text-white bg-white/10 backdrop-blur-sm border border-white/10"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="lg:hidden bg-neutral border-t border-white/10 overflow-hidden"
            >
              <nav className="flex flex-col p-4 space-y-2">
                {navLinks.map((link) => (
                  <button
                    key={link.name}
                    onClick={() => scrollTo(link.href)}
                    className={`text-left font-bold px-6 py-4 rounded-2xl uppercase tracking-wider text-sm transition-all ${activeSection === link.href
                      ? 'bg-primary text-white'
                      : 'text-white hover:bg-white/5'
                      }`}
                  >
                    {link.name}
                  </button>
                ))}
                
                <div className="h-px bg-white/10 mx-6 my-2"></div>
                
                <a
                  href="/admin"
                  className="text-left font-bold px-6 py-4 rounded-2xl uppercase tracking-wider text-sm transition-all text-yellow-400 hover:bg-white/5 flex items-center gap-3"
                >
                  <ChefHat className="w-5 h-5" /> Panel de Administración
                </a>
              </nav>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ═══════════════ HERO / CARRUSEL FULL-WIDTH ═══════════════ */}
      <section id="inicio" className="relative min-h-[660px] lg:min-h-screen overflow-hidden bg-neutral flex items-center">

        {/* Slides de fondo */}
        <AnimatePresence mode="wait">
          <motion.div
            key={heroSlide}
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1 }}
            className="absolute inset-0 z-0"
          >
            <img
              src={heroImages[heroSlide]}
              alt={`Producto Trucco ${heroSlide + 1}`}
              className="w-full h-full object-cover"
            />
            {/* Gradiente oscuro sobre la imagen para legibilidad */}
            <div className="absolute inset-0 bg-gradient-to-r from-neutral via-neutral/80 to-transparent"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-neutral via-transparent to-neutral/40"></div>
          </motion.div>
        </AnimatePresence>

        {/* Contenido superpuesto con anclaje superior estable */}
        <div className="relative z-10 w-full pt-36 sm:pt-40 lg:pt-44 pb-16">
          <div className="max-w-7xl mx-auto px-6 w-full">
            <div className="max-w-2xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 bg-secondary/20 border border-secondary/40 text-secondary px-4 py-2 rounded-full font-bold mb-4 sm:mb-6 text-xs sm:text-sm uppercase tracking-widest backdrop-blur-sm">
                  <Flame className="w-4 h-4" />
                  Comidas Rápidas Trucco
                </div>

                {/* Nombre del producto actual con altura contenida y estable */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`info-${heroSlide}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ duration: 0.4 }}
                    className="min-h-[220px] sm:min-h-[260px] flex flex-col justify-start"
                  >
                    <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white mb-3 leading-[1.1] drop-shadow-lg">
                      {heroProducts[heroSlide]?.name || 'Comidas Rápidas Trucco'}
                    </h1>
                    <p className="text-gray-300 text-base sm:text-lg mb-4 max-w-lg leading-relaxed drop-shadow-md line-clamp-2">
                      {heroProducts[heroSlide]?.description || 'Las mejores hamburguesas y salchipapas de la ciudad.'}
                    </p>
                    <div>
                      <div className="inline-flex items-center gap-3 bg-secondary text-neutral font-black text-2xl sm:text-3xl px-5 py-2.5 rounded-2xl shadow-lg mb-6">
                        ${heroProducts[heroSlide]?.variants[0]?.price?.toLocaleString('es-CO') || '---'}
                      </div>
                    </div>
                  </motion.div>
                </AnimatePresence>

                <div className="flex flex-col sm:flex-row items-start gap-4">
                  <button
                    onClick={() => scrollTo('menu')}
                    className="bg-primary hover:bg-primary-dark text-white font-black py-4 px-10 rounded-full text-lg transition-all hover:scale-105 shadow-[0_0_30px_rgba(211,47,47,0.5)] flex items-center gap-3"
                  >
                    Ver Menú <ArrowRight className="w-5 h-5" />
                  </button>

                  <div className="flex items-center gap-3 bg-black/40 backdrop-blur-md px-6 py-4 rounded-full border border-white/10">
                    <span className="relative flex h-3 w-3">
                      {openStatus && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${openStatus ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </span>
                    <span className="text-white font-bold text-sm">
                      {openStatus ? 'ABIERTO AHORA' : 'CERRADO'}
                    </span>
                    <span className="text-white/50 text-sm ml-1">• 5PM – 12AM</span>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>

        {/* Flechas de navegación */}
        <button
          onClick={() => setHeroSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length)}
          className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all border border-white/20 hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <button
          onClick={() => setHeroSlide((prev) => (prev + 1) % heroImages.length)}
          className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 z-20 w-12 h-12 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white rounded-full flex items-center justify-center transition-all border border-white/20 hover:scale-110"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
        </button>

        {/* Dots indicadores + Scroll */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-6">
          <div className="flex items-center gap-2.5">
            {heroImages.map((_, i) => (
              <button
                key={i}
                onClick={() => setHeroSlide(i)}
                className={`rounded-full transition-all duration-500 ${i === heroSlide
                  ? 'w-10 h-3 bg-secondary shadow-[0_0_10px_rgba(255,179,0,0.6)]'
                  : 'w-3 h-3 bg-white/40 hover:bg-white/70'
                  }`}
              />
            ))}
          </div>
          <div className="text-white/30 animate-bounce">
            <ArrowDown className="w-5 h-5" />
          </div>
        </div>
      </section>

      {/* ═══════════════ NOSOTROS ═══════════════ */}
      <section id="nosotros" className="py-24 bg-white relative overflow-hidden">
        {/* Decoración */}
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary"></div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-primary font-bold uppercase tracking-[0.2em] text-sm">Conócenos</span>
            <h2 className="text-4xl md:text-5xl font-black text-neutral mt-3">Sobre <span className="text-primary">Trucco</span></h2>
          </div>

          <div className="flex flex-col lg:flex-row items-start gap-16">
            {/* Columna Izquierda: Imágenes y Pagos */}
            <div className="w-full lg:w-1/2 flex flex-col gap-10">
              {/* Collage de imágenes */}
              <div className="relative grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <img src="/images/picadas.jpg" alt="Picadas" className="w-full h-52 object-cover rounded-3xl shadow-lg" />
                  <img src="/images/amburguesas.jpg" alt="Hamburguesas" className="w-full h-36 object-cover rounded-3xl shadow-lg" />
                </div>
                <div className="space-y-4 mt-8">
                  <img src="/images/burritos.jpeg" alt="Burritos" className="w-full h-36 object-cover rounded-3xl shadow-lg" />
                  <img src="/images/perro-caliente.jpeg" alt="Perro Caliente" className="w-full h-52 object-cover rounded-3xl shadow-lg" />
                </div>
              </div>

              {/* Información Importante (Envíos y Pagos) */}
              <div className="bg-white border-2 border-cream-dark p-8 rounded-3xl shadow-sm flex flex-col">
                <h4 className="font-bold text-primary text-xl mb-6 flex items-center gap-3">
                  <Truck className="w-6 h-6" /> Envíos y Pagos
                </h4>

                <div className="space-y-6">
                  <div>
                    <h5 className="font-black text-neutral text-lg mb-2">🛵 Zonas de Cobertura</h5>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Llegamos a gran parte de la zona sur occidente y zonas aledañas al 20 de Julio. ¡Pregunta por tu barrio al WhatsApp!
                    </p>
                  </div>

                  <div>
                    <h5 className="font-black text-neutral text-lg mb-2">💳 Medios de Pago</h5>
                    <p className="text-gray-500 text-sm leading-relaxed">
                      Para confirmar tu pedido, es necesario realizar primero el pago por <strong>Nequi</strong>.
                      Una vez realizado el pago, envíanos el comprobante por WhatsApp para validar y confirmar tu pedido.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Columna Derecha: Texto descriptivo y Horario/Mapa */}
            <div className="w-full lg:w-1/2">
              <h3 className="text-3xl md:text-4xl font-black text-neutral mb-6 leading-tight">
                Donde el hambre se convierte en <span className="text-secondary">satisfacción</span>
              </h3>
              <p className="text-gray-600 text-lg mb-8 leading-relaxed">
                En <strong className="text-primary">Comidas Rápidas Trucco</strong> no hacemos comida normal. Preparamos cada plato con ingredientes frescos, salsas de la casa y porciones generosas. Nuestro objetivo es simple: que te vayas feliz y quieras volver.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-10">
                <div className="flex items-start gap-4 bg-cream p-5 rounded-2xl">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <ChefHat className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-neutral">Preparación Fresca</h5>
                    <p className="text-gray-500 text-sm mt-1">Todo se prepara al momento de tu pedido.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-cream p-5 rounded-2xl">
                  <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center shrink-0">
                    <Star className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-neutral">Calidad Premium</h5>
                    <p className="text-gray-500 text-sm mt-1">Los mejores ingredientes, todos los días.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-cream p-5 rounded-2xl">
                  <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-neutral">Horario Nocturno</h5>
                    <p className="text-gray-500 text-sm mt-1">Abiertos de 5:00 PM a 12:00 AM.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4 bg-cream p-5 rounded-2xl">
                  <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-xl flex items-center justify-center shrink-0">
                    <Heart className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="font-bold text-neutral">Porciones Generosas</h5>
                    <p className="text-gray-500 text-sm mt-1">Servimos con amor y en cantidad.</p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-6">
                {/* Horario completo */}
                <div className="bg-neutral text-white p-6 rounded-2xl">
                  <h4 className="font-bold text-secondary mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5" /> Horario de Atención
                  </h4>
                  <div className="grid grid-cols-2 gap-y-2 text-sm">
                    {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(day => (
                      <div key={day} className="flex justify-between pr-4">
                        <span className="text-gray-400">{day}</span>
                        <span className="font-bold text-white">5PM – 12AM</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center gap-3">
                    <span className="relative flex h-3 w-3">
                      {openStatus && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>}
                      <span className={`relative inline-flex rounded-full h-3 w-3 ${openStatus ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    </span>
                    <span className="font-bold text-sm">{openStatus ? '🟢 ESTAMOS ABIERTOS' : '🔴 CERRADO AHORA'}</span>
                  </div>
                </div>

                {/* Ubicación Google Maps */}
                <div className="bg-white border-2 border-cream-dark p-5 rounded-2xl shadow-sm flex flex-col h-[400px]">
                  <h4 className="font-bold text-primary mb-3 flex items-center gap-2">
                    <MapPin className="w-5 h-5" /> Ubicación
                  </h4>
                  <p className="text-gray-600 text-sm mb-4 font-medium leading-tight">
                    La Urbanización Emmanuel, Barrio 20 de Julio. Cartagena, Bolívar
                  </p>
                  <div className="flex-grow rounded-xl overflow-hidden bg-cream relative">
                    <iframe
                      src="https://maps.google.com/maps?q=Urbanizaci%C3%B3n%20Emmanuel,%20Barrio%2020%20de%20Julio,%20Cartagena,%20Bol%C3%ADvar&t=&z=15&ie=UTF8&iwloc=&output=embed"
                      width="100%"
                      height="100%"
                      style={{ border: 0, position: 'absolute', inset: 0 }}
                      allowFullScreen=""
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title="Ubicación Comidas Rápidas Trucco"
                    ></iframe>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>

      </section>

      {/* ═══════════════ MENÚ ═══════════════ */}
      <main id="menu" className="w-full bg-cream py-24 relative">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-secondary via-primary to-secondary"></div>

        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-10">
            <span className="text-primary font-bold uppercase tracking-[0.2em] text-sm">Descubre</span>
            <h3 className="text-4xl md:text-5xl font-black text-neutral mt-3">Nuestro <span className="text-secondary">Menú</span></h3>
            <p className="text-gray-500 mt-4 text-lg max-w-lg mx-auto">Elige tus favoritos y agrégalos al carrito. Tu pedido llegará directo a nuestro WhatsApp.</p>
          </div>

          {/* Filtros de Categoría */}
          <div className="flex flex-wrap items-center justify-center gap-3 mb-12">
            {categories.map(category => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-5 py-2.5 rounded-full font-bold text-sm transition-all ${activeCategory === category
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-white text-gray-500 border-2 border-cream-dark hover:border-primary/50 hover:text-primary'
                  }`}
              >
                {category}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ duration: 0.2 }}
                  key={product.id}
                  className="h-full flex flex-col"
                >
                  <ProductCard product={product} onAdd={addToCart} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* ═══════════════ CONTACTO / QR ═══════════════ */}
      <section id="contacto" className="py-24 bg-white relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-primary via-secondary to-primary"></div>

        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <span className="text-primary font-bold uppercase tracking-[0.2em] text-sm">Contacto</span>
            <h3 className="text-4xl md:text-5xl font-black text-neutral mt-3">Haz Tu <span className="text-secondary">Pedido</span></h3>
          </div>

          <div className="bg-neutral rounded-[2rem] overflow-hidden flex flex-col md:flex-row shadow-2xl relative">
            <div className="absolute top-0 right-0 w-96 h-96 bg-primary rounded-full filter blur-[150px] opacity-10"></div>

            <div className="md:w-3/5 p-10 md:p-16 flex flex-col justify-center relative z-10">
              <h3 className="text-3xl md:text-4xl font-black text-white mb-6">
                Sin complicaciones, <span className="text-secondary">rápido y fácil</span>
              </h3>
              <p className="text-gray-400 mb-10 text-lg leading-relaxed">
                Arma tu pedido en nuestra web, confirma tus datos y te lo enviamos organizado por WhatsApp para coordinar la entrega.
              </p>

              <ul className="space-y-5">
                {[
                  { step: '1', text: 'Explora el menú y elige tus platos' },
                  { step: '2', text: 'Revisa tu carrito y ajusta cantidades' },
                  { step: '3', text: 'Llena tus datos de entrega' },
                  { step: '4', text: '¡Listo! Se envía automático a WhatsApp' },
                ].map(item => (
                  <li key={item.step} className="flex items-center gap-4 text-white">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center font-black text-sm shrink-0">{item.step}</div>
                    <span className="text-lg">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:w-2/5 bg-gradient-to-br from-primary to-primary-dark p-10 md:p-12 flex flex-col items-center justify-center text-center relative z-10">
              <h4 className="text-2xl font-bold text-white mb-2">¿Prefieres directo?</h4>
              <p className="text-white/70 mb-8 text-sm">Escanea el QR o toca el botón</p>

              <div className="bg-white p-4 rounded-3xl mb-8 shadow-xl transform hover:scale-105 transition-transform duration-300">
                <img src="/codigo qr.png" alt="QR WhatsApp" className="w-48 h-48 object-contain" />
              </div>

              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank" rel="noreferrer"
                className="bg-white text-neutral font-bold py-4 px-8 rounded-full transition-all hover:scale-105 flex items-center gap-3 shadow-lg text-lg"
              >
                <Phone className="w-5 h-5 text-[#25D366]" /> Abrir WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ FOOTER ═══════════════ */}
      <footer className="bg-neutral pt-16 pb-8 border-t-4 border-secondary">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          <div className="md:col-span-2">
            <img src="/logo.png" alt="Trucco" className="h-24 md:h-32 mb-6 object-contain" />
            <p className="text-gray-400 max-w-sm leading-relaxed">
              El sabor que te mueve. Preparando las mejores hamburguesas y comidas rápidas de la ciudad, todos los días desde las 5:00 PM.
            </p>
          </div>
          <div>
            <h4 className="text-lg font-black mb-6 text-secondary">Navegación</h4>
            <ul className="space-y-3 text-gray-400 font-medium">
              {navLinks.map(link => (
                <li key={link.name}>
                  <button onClick={() => scrollTo(link.href)} className="hover:text-white transition-colors">{link.name}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="text-lg font-black mb-6 text-secondary">Información</h4>
            <ul className="space-y-4 text-gray-400">
              <li className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-primary" />
                <span>5:00 PM - 12:00 AM</span>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0 mt-1" />
                <span>La Urbanización Emmanuel<br />Barrio 20 de Julio<br />Cartagena, Bolívar</span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-5 h-5 text-primary shrink-0" />
                <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noreferrer" className="hover:text-white transition-colors">
                  WhatsApp: 317 192 2866
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-4 text-center text-gray-600 text-sm font-medium pt-8 border-t border-white/10">
          &copy; {new Date().getFullYear()} Comidas Rápidas Trucco — Todos los derechos reservados.
        </div>
      </footer>

      {/* ═══════════════ MODALS ═══════════════ */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        setCart={setCart}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        cart={cart}
        onConfirmOrder={handleOrderComplete}
      />

      {/* History Modal */}
      <AnimatePresence>
        {isHistoryOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsHistoryOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-cream rounded-3xl shadow-2xl w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 bg-neutral text-white flex justify-between items-center">
                <h3 className="text-xl font-black flex items-center gap-2">
                  <Clock className="text-secondary w-6 h-6" /> Historial de Pedidos
                </h3>
                <button onClick={() => setIsHistoryOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 overflow-y-auto bg-white flex-grow">
                {orderHistory.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">No has realizado ningún pedido aún.</p>
                ) : (
                  <div className="space-y-6">
                    {orderHistory.map((order, idx) => (
                      <div key={idx} className="border-2 border-cream-dark rounded-2xl p-4 bg-cream/50">
                        <div className="flex justify-between items-center mb-3">
                          <span className="font-bold text-neutral text-sm">
                            {new Date(order.date).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className="bg-secondary text-neutral px-3 py-1 rounded-full text-xs font-black uppercase">
                            {order.orderType === 'domicilio' ? '🛵 Domicilio' : '🏪 Recoger'}
                          </span>
                        </div>
                        <ul className="space-y-2 mb-3">
                          {order.items.map((item, i) => (
                            <li key={i} className="flex justify-between text-sm text-gray-700">
                              <span><span className="font-bold">{item.quantity}x</span> {item.name} {item.variantLabel && item.variantLabel !== item.name ? `(${item.variantLabel})` : ''}</span>
                              <span className="font-medium">${(item.price * item.quantity).toLocaleString('es-CO')}</span>
                            </li>
                          ))}
                        </ul>
                        <div className="pt-3 border-t-2 border-cream-dark flex justify-between items-center font-black text-neutral">
                          <span>Total</span>
                          <span className="text-primary text-lg">${order.items.reduce((sum, item) => sum + (item.price * item.quantity), 0).toLocaleString('es-CO')}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;

