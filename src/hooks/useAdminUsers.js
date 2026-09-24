// ═══════════════════════════════════════════════════
// Hook para gestión de usuarios y autenticación
// Lee y sincroniza con la pestaña 'usuarios' de Google Sheets
// ═══════════════════════════════════════════════════

import { useState, useEffect } from 'react';
import { SHEET_ID, APPS_SCRIPT_URL, parseCSVLine } from './useSheetProducts';

export const SHEET_USERS_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:csv&sheet=usuarios`;

export const DEFAULT_USERS = [
  { id: 1, usuario: 'admin', password: 'Admin123', nombre: 'Administrador Principal', rol: 'admin' },
  { id: 2, usuario: 'olga', password: 'Olga2026', nombre: 'Olga Reyes', rol: 'admin' }
];

const CACHE_USERS_KEY = 'trucco_users_cache';
const CACHE_TIME_KEY = 'trucco_users_cache_time';
const SESSION_USER_KEY = 'trucco_admin_user';
const SESSION_KEY = 'trucco_admin_session';
const CACHE_TTL = 3 * 60 * 1000; // 3 minutos

/**
 * Parsea el CSV de la pestaña 'usuarios' de Google Sheets
 */
export function parseUsersCSV(csvText) {
  if (!csvText) return [];
  const lines = csvText.trim().split('\n');
  if (lines.length < 2) return [];

  const users = [];
  // Saltar encabezado (id, usuario, password, nombre, rol)
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCSVLine(lines[i]);
    const [id, usuario, password, nombre, rol] = cols;

    if (usuario && password) {
      users.push({
        id: id ? Number(id) || i : i,
        usuario: String(usuario).trim(),
        password: String(password).trim(),
        nombre: nombre ? String(nombre).trim() : usuario,
        rol: rol ? String(rol).trim() : 'admin'
      });
    }
  }
  return users.length > 0 ? users : DEFAULT_USERS;
}

export function useAdminUsers() {
  const [users, setUsers] = useState(() => {
    try {
      const cached = localStorage.getItem(CACHE_USERS_KEY);
      const cachedTime = localStorage.getItem(CACHE_TIME_KEY);
      if (cached && cachedTime && Date.now() - Number(cachedTime) < CACHE_TTL) {
        return JSON.parse(cached);
      }
    } catch {}
    return DEFAULT_USERS;
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem(SESSION_USER_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem(SESSION_KEY) === 'true';
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await fetch(`${SHEET_USERS_URL}&t=${Date.now()}`);
      if (resp.ok) {
        const csv = await resp.text();
        const parsed = parseUsersCSV(csv);
        if (parsed && parsed.length > 0) {
          setUsers(parsed);
          localStorage.setItem(CACHE_USERS_KEY, JSON.stringify(parsed));
          localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
        }
      }
    } catch (err) {
      console.warn('No se pudo conectar a Google Sheets para usuarios, usando caché:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // Sincronizar usuarios a Google Sheets (pestaña 'usuarios')
  const syncUsersToSheet = async (newUsers) => {
    setLoading(true);
    try {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'saveUsers',
          users: newUsers
        })
      });

      setUsers(newUsers);
      localStorage.setItem(CACHE_USERS_KEY, JSON.stringify(newUsers));
      localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
    } catch (err) {
      console.error('Error guardando usuarios en Google Sheets:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // Validar credenciales de inicio de sesión
  const authenticate = (usernameInput, passwordInput) => {
    const cleanUser = (usernameInput || '').trim().toLowerCase();
    const cleanPass = (passwordInput || '').trim();

    // 1. Buscar en lista de usuarios cargados
    let match = users.find(
      u => u.usuario.toLowerCase() === cleanUser && u.password === cleanPass
    );

    // 2. Fallback con usuarios por defecto si aún no han cargado
    if (!match) {
      match = DEFAULT_USERS.find(
        u => u.usuario.toLowerCase() === cleanUser && u.password === cleanPass
      );
    }

    if (match) {
      const userObj = {
        id: match.id,
        usuario: match.usuario,
        nombre: match.nombre || match.usuario,
        rol: match.rol || 'admin'
      };
      sessionStorage.setItem(SESSION_KEY, 'true');
      sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
      setIsAuthenticated(true);
      setCurrentUser(userObj);
      return { success: true, user: userObj };
    }

    return { success: false, message: 'Usuario o contraseña incorrectos. Verifica tus datos.' };
  };

  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    sessionStorage.removeItem(SESSION_USER_KEY);
    setIsAuthenticated(false);
    setCurrentUser(null);
  };

  const addUser = async (userData) => {
    const cleanUser = (userData.usuario || '').trim().toLowerCase();
    if (!cleanUser) throw new Error('El nombre de usuario es obligatorio');
    if (!userData.password) throw new Error('La contraseña es obligatoria');

    if (users.some(u => u.usuario.toLowerCase() === cleanUser)) {
      throw new Error(`El usuario "@${cleanUser}" ya existe.`);
    }

    const newId = Math.max(...users.map(u => u.id || 0), 0) + 1;
    const newUser = {
      id: newId,
      usuario: cleanUser,
      password: userData.password.trim(),
      nombre: userData.nombre?.trim() || cleanUser,
      rol: userData.rol || 'admin'
    };

    const newUsers = [...users, newUser];
    await syncUsersToSheet(newUsers);
    return newUser;
  };

  const updateUser = async (userId, userData) => {
    const newUsers = users.map(u => {
      if (u.id === userId) {
        return {
          ...u,
          ...userData,
          usuario: userData.usuario ? userData.usuario.trim().toLowerCase() : u.usuario,
          password: userData.password ? userData.password.trim() : u.password,
          nombre: userData.nombre ? userData.nombre.trim() : u.nombre,
          rol: userData.rol || u.rol
        };
      }
      return u;
    });

    await syncUsersToSheet(newUsers);

    // Si se actualizó el usuario actual, actualizar la sesión
    if (currentUser && currentUser.id === userId) {
      const updatedCurrent = newUsers.find(u => u.id === userId);
      if (updatedCurrent) {
        const userObj = {
          id: updatedCurrent.id,
          usuario: updatedCurrent.usuario,
          nombre: updatedCurrent.nombre,
          rol: updatedCurrent.rol
        };
        sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(userObj));
        setCurrentUser(userObj);
      }
    }
  };

  const changePassword = async (userId, newPassword) => {
    if (!newPassword || newPassword.trim().length < 4) {
      throw new Error('La contraseña debe tener al menos 4 caracteres.');
    }
    await updateUser(userId, { password: newPassword.trim() });
  };

  const deleteUser = async (userId) => {
    if (users.length <= 1) {
      throw new Error('No puedes eliminar el único usuario del sistema.');
    }

    const newUsers = users.filter(u => u.id !== userId);
    await syncUsersToSheet(newUsers);

    // Si el usuario se eliminó a sí mismo, cerrar sesión
    if (currentUser && currentUser.id === userId) {
      logout();
    }
  };

  return {
    users,
    currentUser,
    isAuthenticated,
    loading,
    error,
    authenticate,
    logout,
    addUser,
    updateUser,
    changePassword,
    deleteUser,
    refreshUsers: fetchUsers
  };
}
