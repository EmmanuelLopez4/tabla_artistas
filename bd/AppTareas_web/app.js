/*!
 * app.js
 * Lógica principal de la AppTareas (demo)
 * Integra sanitización OWASP (front), auditoría y control de intentos (demo).
 * Colocar en: AppTareas_web/app.js
 */

(function () {
  'use strict';

  /* -----------------------
     CONFIG
  ----------------------- */
  const TASKS_STORAGE_KEY = 'st_tasks_demo'; // demo tasks
  const SESSION_STORAGE_KEY = 'st_session_demo'; // demo session (username)
  const DEFAULT_PAGE_SIZE = 50;

  /* -----------------------
     HELPERS
  ----------------------- */

  function _nowIso() {
    return new Date().toISOString();
  }

  function _logAudit(level, message, meta) {
    try {
      if (window && typeof window.security_audit_append === 'function') {
        window.security_audit_append({ level, message, meta });
      } else if (window && typeof window.security_audit_append_raw === 'function') {
        // fallback to alternate name
        window.security_audit_append_raw({ level, message, meta });
      } else {
        // fallback console only (demo)
        console.log('AUDIT fallback', level, message, meta || {});
      }
    } catch (e) {
      console.warn('app: fallo audit log', e);
    }
  }

  // Escapa/insert safe text en nodos (usa owasp_escapeHTML si existe)
  function _safeText(text) {
    try {
      if (window && typeof window.owasp_escapeHTML === 'function') {
        return window.owasp_escapeHTML(text);
      }
    } catch (e) {
      // ignore
    }
    // basic fallback
    if (text === null || text === undefined) return '';
    return String(text);
  }

  // Leer tareas desde storage
  function loadTasks() {
    try {
      const raw = localStorage.getItem(TASKS_STORAGE_KEY) || '[]';
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch (e) {
      console.warn('app: fallo parse tasks', e);
      return [];
    }
  }

  // Guardar tareas en storage
  function saveTasks(tasks) {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks || []));
    } catch (e) {
      console.warn('app: fallo save tasks', e);
    }
  }

  // Obtener sesión demo (username) o null
  function getSessionUser() {
    try {
      return localStorage.getItem(SESSION_STORAGE_KEY) || null;
    } catch (e) {
      return null;
    }
  }

  function setSessionUser(username) {
    try {
      if (username) {
        localStorage.setItem(SESSION_STORAGE_KEY, String(username));
        _logAudit('info', 'session_set', { username: String(username) });
      } else {
        localStorage.removeItem(SESSION_STORAGE_KEY);
        _logAudit('info', 'session_cleared');
      }
    } catch (e) {
      console.warn('app: fallo setSessionUser', e);
    }
  }

  /* -----------------------
     RENDER
  ----------------------- */

  // Render lista compacta de tareas en consola y (si existe) en DOM simple.
  function renderTasks() {
    const tasks = loadTasks();
    // if there is a UI container, show a simple list; otherwise log
    try {
      // reuse a container if exists, else create a lightweight overlay list
      let listEl = document.getElementById('app-tasks-list');
      if (!listEl) {
        listEl = document.createElement('div');
        listEl.id = 'app-tasks-list';
        listEl.style.marginTop = '10px';
        const parent = document.getElementById('task-card') || document.body;
        parent.appendChild(listEl);
      }
      // Clear
      listEl.innerHTML = ''; // safe: we only insert text nodes below
      if (!tasks || tasks.length === 0) {
        const p = document.createElement('div');
        p.textContent = 'No hay tareas.';
        p.style.color = '#555';
        listEl.appendChild(p);
        return;
      }

      const ul = document.createElement('ul');
      ul.style.paddingLeft = '18px';
      for (let i = 0; i < tasks.length; i++) {
        const t = tasks[i];
        const li = document.createElement('li');
        // title (safe)
        const titleSpan = document.createElement('strong');
        titleSpan.textContent = _safeText(t.title || '(sin título)');
        li.appendChild(titleSpan);

        // meta (date)
        if (t.dueDate) {
          const d = document.createElement('span');
          d.style.marginLeft = '8px';
          d.style.fontSize = '12px';
          d.style.color = '#666';
          d.textContent = '(' + _safeText(String(t.dueDate).slice(0, 10)) + ')';
          li.appendChild(d);
        }

        // description
        if (t.description) {
          const br = document.createElement('div');
          br.style.fontSize = '13px';
          br.style.color = '#333';
          br.textContent = _safeText(t.description);
          li.appendChild(br);
        }

        // actions: delete
        const aDel = document.createElement('button');
        aDel.textContent = 'Eliminar';
        aDel.style.marginLeft = '12px';
        aDel.style.padding = '4px 8px';
        aDel.style.fontSize = '12px';
        aDel.addEventListener('click', (function (taskId) {
          return function () {
            if (!confirm('Eliminar tarea?')) return;
            deleteTask(taskId);
          };
        })(t.id));
        li.appendChild(aDel);

        ul.appendChild(li);
      }
      listEl.appendChild(ul);

    } catch (e) {
      console.log('Tareas (fallback):', loadTasks());
    }
  }

  /* -----------------------
     CRUD tareas (demo)
  ----------------------- */

  function createTask(payload) {
    try {
      // si existe sanitizador OWASP en frontend, usarlo (recomendado)
      if (window && typeof window.owasp_sanitizeTaskPayload === 'function') {
        const res = window.owasp_sanitizeTaskPayload(payload);
        if (!res.ok) {
          _logAudit('warning', 'task_create_validation_failed', { errors: res.errors });
          return { ok: false, errors: res.errors };
        }
        payload = res.data;
      } else {
        // fallback: minimal sanitization
        payload = {
          title: String(payload.title || '').slice(0, 100),
          description: String(payload.description || '').slice(0, 1000),
          dueDate: payload.dueDate ? String(payload.dueDate) : null
        };
      }

      const tasks = loadTasks();
      const task = {
        id: _nowIso() + '-' + Math.floor(Math.random() * 10000),
        title: payload.title,
        description: payload.description,
        dueDate: payload.dueDate,
        createdAt: _nowIso()
      };
      tasks.push(task);
      saveTasks(tasks);
      _logAudit('info', 'task_created', { id: task.id, title: task.title });
      renderTasks();
      return { ok: true, task };
    } catch (e) {
      _logAudit('error', 'task_create_error', { error: String(e) });
      return { ok: false, error: String(e) };
    }
  }

  function deleteTask(taskId) {
    try {
      let tasks = loadTasks();
      const before = tasks.length;
      tasks = tasks.filter(t => t.id !== taskId);
      if (tasks.length === before) return { ok: false, reason: 'not_found' };
      saveTasks(tasks);
      _logAudit('info', 'task_deleted', { id: taskId });
      renderTasks();
      return { ok: true };
    } catch (e) {
      _logAudit('error', 'task_delete_error', { error: String(e) });
      return { ok: false, error: String(e) };
    }
  }

  /* -----------------------
     AUTH demo (login flow)
  ----------------------- */

  // Intenta iniciar sesión (demo): combina auth_canAttempt / auth_recordFailedLogin / auth_resetAttempts
  // Nota: en producción autenticación debe ser por backend.
  function handleLoginDemo(username, password) {
    // normalize
    username = String(username || 'demo').trim().toLowerCase();
    password = String(password || '');

    try {
      // Check if allowed to attempt
      if (window && typeof window.auth_canAttempt === 'function') {
        const chk = window.auth_canAttempt(username);
        if (!chk.ok) {
          _logAudit('warning', 'login_blocked_attempt', { username, reason: chk.reason, unlockAt: chk.unlockAt });
          return { ok: false, blocked: true, unlockAt: chk.unlockAt };
        }
      }

      // Demo credential: password === '1234'
      const success = password === '1234';

      if (success) {
        // reset attempts
        if (window && typeof window.auth_resetAttempts === 'function') {
          try { window.auth_resetAttempts(username); } catch (e) { /* ignore */ }
        }
        setSessionUser(username);
        _logAudit('info', 'user_login_success', { username });
        return { ok: true };
      } else {
        // record failed attempt
        if (window && typeof window.auth_recordFailedLogin === 'function') {
          try {
            const res = window.auth_recordFailedLogin(username);
            _logAudit('warning', 'user_login_failed', { username, attempts_15min: res.attempts_15min, blocked: res.blocked, blockedUntil: res.blockedUntil });
            return { ok: false, blocked: !!res.blocked, blockedUntil: res.blockedUntil, attempts_15min: res.attempts_15min };
          } catch (e) {
            // fallback
            _logAudit('warning', 'user_login_failed_no_monitor', { username });
            return { ok: false };
          }
        } else {
          _logAudit('warning', 'user_login_failed_no_monitor', { username });
          return { ok: false };
        }
      }
    } catch (e) {
      _logAudit('error', 'login_flow_error', { error: String(e) });
      return { ok: false, error: String(e) };
    }
  }

  function handleLogout() {
    try {
      const user = getSessionUser();
      setSessionUser(null);
      _logAudit('info', 'user_logged_out', { username: user });
    } catch (e) {
      console.warn('app: logout error', e);
    }
  }

  /* -----------------------
     BOOT / LISTENERS
  ----------------------- */

  function setupEventBindings() {
    // Login bindings (if elements exist)
    const btnLogin = document.getElementById('btn-login');
    const loginMsg = document.getElementById('login-msg');
    const inputUser = document.getElementById('login-username');
    const inputPass = document.getElementById('login-password');

    if (btnLogin && inputUser && inputPass) {
      btnLogin.addEventListener('click', function () {
        const username = (inputUser.value || 'demo').trim();
        const password = inputPass.value || '';
        const res = handleLoginDemo(username, password);
        if (res.ok) {
          if (loginMsg) {
            loginMsg.style.color = 'green';
            loginMsg.textContent = 'Login exitoso (demo).';
          }
        } else {
          if (loginMsg) {
            loginMsg.style.color = '#b00';
            if (res.blocked) {
              loginMsg.textContent = 'Cuenta bloqueada hasta ' + (res.blockedUntil || res.unlockAt || 'N/A');
            } else if (res.attempts_15min !== undefined) {
              loginMsg.textContent = 'Credenciales incorrectas. Intentos 15min: ' + res.attempts_15min;
            } else {
              loginMsg.textContent = 'Credenciales incorrectas.';
            }
          }
        }
      });
    }

    // Create task binding
    const btnCreate = document.getElementById('btn-create-task');
    const taskMsg = document.getElementById('task-msg');
    if (btnCreate) {
      btnCreate.addEventListener('click', function () {
        const payload = {
          title: (document.getElementById('task-title') || {}).value,
          description: (document.getElementById('task-desc') || {}).value,
          dueDate: (document.getElementById('task-due') || {}).value
        };
        const res = createTask(payload);
        if (!res.ok) {
          if (taskMsg) {
            taskMsg.style.color = '#b00';
            taskMsg.textContent = (res.errors && res.errors.join('; ')) || res.error || 'Error al crear tarea.';
          }
        } else {
          if (taskMsg) {
            taskMsg.style.color = 'green';
            taskMsg.textContent = 'Tarea creada.';
          }
          // optionally clear inputs
          try {
            (document.getElementById('task-title') || {}).value = '';
            (document.getElementById('task-desc') || {}).value = '';
            (document.getElementById('task-due') || {}).value = '';
          } catch (e) { /* ignore */ }
        }
      });
    }

    // Export audit to console (if UI buttons exist they may already call)
    const btnShow = document.getElementById('btn-show-audit');
    if (btnShow) {
      btnShow.addEventListener('click', function () {
        if (window && typeof window.security_audit_getAll === 'function') {
          console.table(window.security_audit_getAll());
          alert('Revisa la consola para ver los logs de auditoría (demo).');
        } else {
          alert('API de auditoría no disponible.');
        }
      });
    }

    const btnClear = document.getElementById('btn-clear-audit');
    if (btnClear) {
      btnClear.addEventListener('click', function () {
        if (window && typeof window.security_audit_clear === 'function') {
          window.security_audit_clear();
          alert('Logs limpiados (demo).');
        } else {
          alert('API de auditoría no disponible.');
        }
      });
    }
  }

  function init() {
    try {
      // Render tasks on load
      renderTasks();

      // Apply any front-end hardening if available (no-ops if not)
      try {
        if (window && typeof window.owasp_applyCSP === 'function') window.owasp_applyCSP();
        if (window && typeof window.owasp_enforceNoInlineHandlers === 'function') window.owasp_enforceNoInlineHandlers();
      } catch (e) {
        // ignore
      }

      // Setup event bindings
      setupEventBindings();

      // Audit startup
      _logAudit('info', 'app_started', { ts: _nowIso() });

    } catch (e) {
      console.error('app init error', e);
      _logAudit('error', 'app_init_error', { error: String(e) });
    }
  }

  // Auto init when DOM is ready
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    setTimeout(init, 10);
  } else {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  }

  // Expose some functions for debugging / integration
  window.appTasks = {
    loadTasks,
    saveTasks,
    renderTasks,
    createTask,
    deleteTask,
    handleLoginDemo,
    handleLogout,
    getSessionUser
  };

})(); // end IIFE
