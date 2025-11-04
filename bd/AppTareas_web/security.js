/*!
 * security.js
 * Utilidades de seguridad / auditoría usadas por la app demo
 * Colocar en: AppTareas_web/security.js
 *
 * Nota: Este archivo usa localStorage para demo. En producción, la auditoría
 * y la persistencia deben manejarse en servidor y en un almacén de logs seguro.
 */

(function () {
  'use strict';

  // KEYs para localStorage
  const AUDIT_STORAGE_KEY = 'st_audit_v1';
  const AUDIT_MAX_ENTRIES = 1000; // to avoid crecer indefinidamente en demo

  // Generador simple de UUID v4 (suficiente para demo)
  function uuidv4() {
    // RFC4122 version 4 compliant-ish generator (not cryptographically strong in older browsers)
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  // Helper: leer array de audit desde localStorage
  function _readAuditArray() {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      console.warn('security: fallo parse audit storage', e);
      return [];
    }
  }

  // Helper: escribir array de audit en localStorage
  function _writeAuditArray(arr) {
    try {
      // mantener límite
      if (!Array.isArray(arr)) arr = [];
      if (arr.length > AUDIT_MAX_ENTRIES) {
        // mantener las entradas más recientes
        arr = arr.slice(arr.length - AUDIT_MAX_ENTRIES);
      }
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(arr));
    } catch (e) {
      console.warn('security: fallo guardando audit storage', e);
    }
  }

  // Append a single audit event (principal API)
  // evt: { ts?, level?, message, meta? }
  function audit_append(evt) {
    try {
      const nowIso = new Date().toISOString();
      const entry = {
        id: uuidv4(),
        ts: evt && evt.ts ? evt.ts : nowIso,
        level: (evt && evt.level) ? evt.level : 'info',
        message: (evt && evt.message) ? String(evt.message) : 'event',
        meta: (evt && evt.meta) ? evt.meta : {}
      };

      const arr = _readAuditArray();
      arr.push(entry);
      _writeAuditArray(arr);
      // For convenience also emit to console (debug)
      if (entry.level === 'error' || entry.level === 'warning') {
        console.warn('AUDIT', entry);
      } else {
        console.log('AUDIT', entry);
      }

      return entry;
    } catch (e) {
      console.warn('security: fallo audit_append', e);
      return null;
    }
  }

  // Obtener todos los eventos de auditoría (array)
  function audit_getAll() {
    return _readAuditArray();
  }

  // Limpiar auditoría (usar sólo en admin/demo)
  function audit_clear() {
    try {
      localStorage.removeItem(AUDIT_STORAGE_KEY);
      return true;
    } catch (e) {
      console.warn('security: fallo audit_clear', e);
      return false;
    }
  }

  // Buscar eventos por filtro simple (por nivel o mensaje contiene)
  function audit_search({ level, contains } = {}) {
    const all = _readAuditArray();
    return all.filter(e => {
      if (level && e.level !== level) return false;
      if (contains && !String(e.message).toLowerCase().includes(String(contains).toLowerCase())) return false;
      return true;
    });
  }

  // Exportar API a window
  window.security_audit_append_raw = audit_append; // nombre auxiliar (por compatibilidad)
  window.security_audit_getAll = audit_getAll;
  window.security_audit_clear = audit_clear;
  window.security_audit_search = audit_search;

  // -----------------------------
  // FIN de la IIFE principal. Añadiremos la exportación solicitada.
  // -----------------------------

  // exportar append de auditoría para otros módulos demo
  window.security_audit_append = audit_append;

})(); // end IIFE
