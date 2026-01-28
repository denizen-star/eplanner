(function () {
  'use strict';

  // Reuse the existing tenant manager storage key so logins carry over.
  const STORAGE_KEY = 'tenant_admin_pw';
  const VERIFY_URL = '/api/admin/tenants';

  function _getSession(key) {
    try {
      return sessionStorage.getItem(key) || '';
    } catch (e) {
      return '';
    }
  }

  function _setSession(key, val) {
    try {
      sessionStorage.setItem(key, val);
    } catch (e) {}
  }

  function _removeSession(key) {
    try {
      sessionStorage.removeItem(key);
    } catch (e) {}
  }

  function getPassword() {
    return _getSession(STORAGE_KEY);
  }

  function setPassword(pw) {
    _setSession(STORAGE_KEY, pw || '');
  }

  function clearPassword() {
    _removeSession(STORAGE_KEY);
  }

  function _headersToObject(h) {
    if (!h) return {};
    try {
      if (h instanceof Headers) {
        const out = {};
        h.forEach((v, k) => { out[k] = v; });
        return out;
      }
    } catch (e) {}
    return { ...h };
  }

  function adminHeaders(existing) {
    const out = _headersToObject(existing);
    const pw = getPassword();
    if (pw) out['X-Admin-Password'] = pw;
    return out;
  }

  async function _verifyPassword(pw) {
    const r = await fetch(VERIFY_URL, { headers: { 'X-Admin-Password': pw } });
    return !!r.ok;
  }

  function openLoginModal(opts) {
    const options = opts || {};
    const modalId = 'adminLogin_' + Date.now();

    return new Promise((resolve) => {
      window[modalId + '_cancel'] = () => {
        try { hideModal(); } catch (e) {}
        resolve(null);
        delete window[modalId + '_cancel'];
        delete window[modalId + '_submit'];
      };

      window[modalId + '_submit'] = async () => {
        const input = document.getElementById(modalId + '_pw');
        const err = document.getElementById(modalId + '_err');
        const btn = document.getElementById(modalId + '_btn');
        const pw = (input && input.value) ? input.value.trim() : '';

        if (!pw) {
          if (err) {
            err.textContent = 'Enter password';
            err.style.display = 'block';
          }
          return;
        }

        if (err) {
          err.textContent = '';
          err.style.display = 'none';
        }

        if (btn) btn.disabled = true;
        try {
          const ok = await _verifyPassword(pw);
          if (!ok) {
            if (err) {
              err.textContent = 'Invalid password';
              err.style.display = 'block';
            }
            if (btn) btn.disabled = false;
            return;
          }

          setPassword(pw);
          if (input) input.value = '';
          try { hideModal(); } catch (e) {}
          resolve(pw);
        } catch (e) {
          if (err) {
            err.textContent = 'Login failed. Please try again.';
            err.style.display = 'block';
          }
          if (btn) btn.disabled = false;
          return;
        } finally {
          delete window[modalId + '_cancel'];
          delete window[modalId + '_submit'];
        }
      };

      const reason = options.reason ? String(options.reason) : 'access admin tools';
      const content = `
        <div class="modal-title">Admin login</div>
        <div class="modal-message">Enter the admin password to ${reason}.</div>
        <div style="margin-bottom: 8px;">
          <input
            type="password"
            id="${modalId}_pw"
            placeholder="Admin password"
            style="width: 100%; padding: 10px 12px; border: 1px solid var(--border-gray); border-radius: 6px;"
            autocomplete="current-password"
          />
        </div>
        <div id="${modalId}_err" style="display: none; margin-bottom: 12px; color: #dc2626; font-size: 13px;"></div>
        <div class="modal-actions">
          <button class="button" onclick="window['${modalId}_cancel']()">Cancel</button>
          <button class="button button-primary" id="${modalId}_btn" onclick="window['${modalId}_submit']()">Log in</button>
        </div>
      `;

      try {
        showModal(content);
      } catch (e) {
        // If modals aren't available for some reason, gracefully fall back to a browser prompt.
        const pw = window.prompt('Admin password required');
        if (!pw) return resolve(null);
        _verifyPassword(String(pw).trim())
          .then((ok) => {
            if (!ok) return resolve(null);
            setPassword(String(pw).trim());
            resolve(String(pw).trim());
          })
          .catch(() => resolve(null));
        return;
      }

      setTimeout(() => {
        const input = document.getElementById(modalId + '_pw');
        if (!input) return;
        input.focus();
        input.addEventListener('keypress', (e) => {
          if (e.key === 'Enter') {
            window[modalId + '_submit']();
          }
        });
      }, 50);
    });
  }

  async function ensureAdmin(opts) {
    const pw = getPassword();
    if (pw) return pw;
    return await openLoginModal(opts);
  }

  async function adminFetch(url, options, opts) {
    const requestOptions = options || {};
    const meta = opts || {};

    const pw = await ensureAdmin(meta);
    if (!pw) {
      // User cancelled login; do not perform the request.
      throw new Error('Admin login required');
    }

    const first = await fetch(url, {
      ...requestOptions,
      headers: adminHeaders(requestOptions.headers),
    });

    if (first.status !== 401 && first.status !== 403) return first;

    // Password likely incorrect or expired: clear and prompt once more.
    clearPassword();
    const pw2 = await ensureAdmin({ ...(meta || {}), reason: meta.reason || 'access admin tools' });
    if (!pw2) return first;

    return await fetch(url, {
      ...requestOptions,
      headers: adminHeaders(requestOptions.headers),
    });
  }

  window.AdminAuth = {
    getPassword,
    setPassword,
    clearPassword,
    adminHeaders,
    openLoginModal,
    ensureAdmin,
    adminFetch,
  };
})();

