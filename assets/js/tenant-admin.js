(function () {
  'use strict';

  const STORAGE_KEY = 'tenant_admin_pw';
  const API = '/api';

  function getPassword() {
    try {
      return sessionStorage.getItem(STORAGE_KEY) || '';
    } catch (e) {
      return '';
    }
  }

  function setPassword(pw) {
    try {
      sessionStorage.setItem(STORAGE_KEY, pw);
    } catch (e) {}
  }

  function clearPassword() {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
  }

  function adminHeaders() {
    const h = { 'Content-Type': 'application/json' };
    const pw = getPassword();
    if (pw) h['X-Admin-Password'] = pw;
    return h;
  }

  function showLogin() {
    const login = document.getElementById('tenantManagerLogin');
    const main = document.getElementById('tenantManagerMain');
    if (login) login.style.display = 'block';
    if (main) main.style.display = 'none';
  }

  function showMain() {
    const login = document.getElementById('tenantManagerLogin');
    const main = document.getElementById('tenantManagerMain');
    if (login) login.style.display = 'none';
    if (main) main.style.display = 'block';
  }

  function showLoginError(msg) {
    const el = document.getElementById('tenantLoginError');
    if (!el) return;
    el.textContent = msg || '';
    el.style.display = msg ? 'block' : 'none';
  }

  window.tenantAdminLogin = function () {
    const input = document.getElementById('tenantAdminPassword');
    const pw = (input && input.value) ? input.value.trim() : '';
    if (!pw) {
      showLoginError('Enter password');
      return;
    }
    showLoginError('');
    fetch(API + '/admin/tenants', { headers: { 'X-Admin-Password': pw } })
      .then(function (r) {
        if (!r.ok) throw new Error('Invalid password');
        setPassword(pw);
        if (input) input.value = '';
        showMain();
        loadTenantList();
      })
      .catch(function () {
        showLoginError('Invalid password');
      });
  };

  window.tenantAdminLogout = function () {
    clearPassword();
    showLogin();
    tenantCancelEdit();
  };

  function tenantFormData() {
    const product = (document.getElementById('tenantProduct') && document.getElementById('tenantProduct').value) || 'eplanner';
    const sub = (document.getElementById('tenantSubdomain') && document.getElementById('tenantSubdomain').value.trim().toLowerCase()) || '';
    const displayName = (document.getElementById('tenantDisplayName') && document.getElementById('tenantDisplayName').value.trim()) || null;
    const senderEmail = (document.getElementById('tenantSenderEmail') && document.getElementById('tenantSenderEmail').value.trim()) || null;
    const favicon = (document.getElementById('tenantFavicon') && document.getElementById('tenantFavicon').value.trim()) || null;
    const logoText = (document.getElementById('tenantLogoText') && document.getElementById('tenantLogoText').value.trim()) || null;
    const titleBrand = (document.getElementById('tenantTitleBrand') && document.getElementById('tenantTitleBrand').value.trim()) || null;
    const findGroupUrl = (document.getElementById('tenantHeroFindGroupUrl') && document.getElementById('tenantHeroFindGroupUrl').value.trim()) || null;
    const learnMoreUrl = (document.getElementById('tenantHeroLearnMoreUrl') && document.getElementById('tenantHeroLearnMoreUrl').value.trim()) || null;
    const showCtas = document.getElementById('tenantHeroShowCtas') && document.getElementById('tenantHeroShowCtas').checked;
    const hero = {};
    if (findGroupUrl) hero.findGroupUrl = findGroupUrl;
    if (learnMoreUrl) hero.learnMoreUrl = learnMoreUrl;
    hero.showCtas = !!showCtas;
    const configJson = {};
    if (favicon) configJson.favicon = favicon;
    if (logoText) configJson.logoText = logoText;
    if (titleBrand) configJson.titleBrand = titleBrand;
    if (Object.keys(hero).length) configJson.hero = hero;
    return {
      product,
      subdomain: sub,
      displayName,
      senderEmail,
      configJson: Object.keys(configJson).length ? configJson : null,
    };
  }

  function fillForm(t) {
    const formKey = document.getElementById('tenantFormKey');
    const product = document.getElementById('tenantProduct');
    const sub = document.getElementById('tenantSubdomain');
    const displayName = document.getElementById('tenantDisplayName');
    const senderEmail = document.getElementById('tenantSenderEmail');
    const favicon = document.getElementById('tenantFavicon');
    const logoText = document.getElementById('tenantLogoText');
    const titleBrand = document.getElementById('tenantTitleBrand');
    const findGroupUrl = document.getElementById('tenantHeroFindGroupUrl');
    const learnMoreUrl = document.getElementById('tenantHeroLearnMoreUrl');
    const showCtas = document.getElementById('tenantHeroShowCtas');
    const saveBtn = document.getElementById('tenantSaveBtn');
    const cancelBtn = document.getElementById('tenantCancelEditBtn');
    if (formKey) formKey.value = t.tenantKey || '';
    if (product) product.value = t.product || 'eplanner';
    if (sub) { sub.value = t.subdomain || ''; sub.disabled = !!t.tenantKey; }
    if (displayName) displayName.value = t.displayName || '';
    if (senderEmail) senderEmail.value = t.senderEmail || '';
    const c = t.configJson || {};
    if (favicon) favicon.value = c.favicon || '';
    if (logoText) logoText.value = c.logoText || '';
    if (titleBrand) titleBrand.value = c.titleBrand || '';
    const h = c.hero || {};
    if (findGroupUrl) findGroupUrl.value = h.findGroupUrl || '';
    if (learnMoreUrl) learnMoreUrl.value = h.learnMoreUrl || '';
    if (showCtas) showCtas.checked = !!h.showCtas;
    if (saveBtn) saveBtn.textContent = t.tenantKey ? 'Update tenant' : 'Create tenant';
    if (cancelBtn) cancelBtn.style.display = t.tenantKey ? 'inline-block' : 'none';
    updateDnsBlock();
  }

  window.tenantCancelEdit = function () {
    fillForm({});
    var sub = document.getElementById('tenantSubdomain');
    if (sub) sub.disabled = false;
  };

  function updateDnsBlock() {
    const product = (document.getElementById('tenantProduct') && document.getElementById('tenantProduct').value) || '';
    const sub = (document.getElementById('tenantSubdomain') && document.getElementById('tenantSubdomain').value.trim()) || '';
    const block = document.getElementById('tenantDnsBlock');
    if (!block) return;
    if (!product || !sub) {
      block.style.display = 'none';
      return;
    }
    const base = product === 'lgbtq-hub' ? 'lgbtq-hub.com' : 'eplanner.kervinapps.com';
    const host = product === 'lgbtq-hub' ? sub + '.lgbtq-hub.com' : sub + '.eplanner.kervinapps.com';
    block.textContent = 'DNS & Netlify steps:\n1. Add CNAME: ' + sub + ' -> your Netlify site target (e.g. apex-loadbalancer.netlify.app).\n2. In Netlify: Domain settings -> Add domain -> ' + host + '\n3. Ensure wildcard *.' + base + ' is configured if you use many subdomains.';
    block.style.display = 'block';
  }

  function onProductOrSubdomainChange() {
    updateDnsBlock();
  }

  window.tenantSave = function () {
    const d = tenantFormData();
    var key = (document.getElementById('tenantFormKey') && document.getElementById('tenantFormKey').value) || '';
    if (!key && !d.subdomain) {
      alert('Subdomain is required');
      return;
    }
    var method = key ? 'PUT' : 'POST';
    var url = key ? API + '/admin/tenants/' + encodeURIComponent(key) : API + '/admin/tenants';
    var body = key ? { displayName: d.displayName, configJson: d.configJson, senderEmail: d.senderEmail } : d;
    fetch(url, {
      method: method,
      headers: adminHeaders(),
      body: JSON.stringify(body),
    })
      .then(function (r) {
        if (!r.ok) return r.json().then(function (j) { throw new Error(j.message || j.error || 'Request failed'); });
        return r.json();
      })
      .then(function () {
        tenantCancelEdit();
        loadTenantList();
      })
      .catch(function (e) {
        alert(e.message || 'Failed to save tenant');
      });
  };

  window.tenantEdit = function (tenantKey) {
    fetch(API + '/admin/tenants', { headers: adminHeaders() })
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load');
        return r.json();
      })
      .then(function (j) {
        var t = (j.tenants || []).find(function (x) { return x.tenantKey === tenantKey; });
        if (t) fillForm(t);
      })
      .catch(function () { alert('Failed to load tenant'); });
  }

  window.tenantDelete = function (tenantKey) {
    if (!confirm('Delete tenant ' + tenantKey + '? This does not delete events.')) return;
    fetch(API + '/admin/tenants/' + encodeURIComponent(tenantKey), {
      method: 'DELETE',
      headers: adminHeaders(),
    })
      .then(function (r) {
        if (!r.ok) throw new Error('Delete failed');
        loadTenantList();
        tenantCancelEdit();
      })
      .catch(function (e) {
        alert(e.message || 'Failed to delete');
      });
  }

  function loadTenantList() {
    const list = document.getElementById('tenantList');
    const loading = document.getElementById('tenantListLoading');
    if (loading) loading.style.display = 'block';
    if (list) list.style.display = 'none';
    fetch(API + '/admin/tenants', { headers: adminHeaders() })
      .then(function (r) {
        if (!r.ok) throw new Error('Failed to load tenants');
        return r.json();
      })
      .then(function (j) {
        if (loading) loading.style.display = 'none';
        if (!list) return;
        list.style.display = 'block';
        var arr = j.tenants || [];
        if (arr.length === 0) {
          list.innerHTML = '<p style="color: var(--text-gray);">No tenants yet. Create one above.</p>';
          return;
        }
        var html = '<table style="width: 100%; border-collapse: collapse;"><thead><tr style="background: var(--light-gray-1); border-bottom: 2px solid var(--border-gray);"><th style="padding: 10px; text-align: left;">Tenant</th><th style="padding: 10px; text-align: left;">Product</th><th style="padding: 10px; text-align: left;">Subdomain</th><th style="padding: 10px; text-align: left;">Sender email</th><th style="padding: 10px; text-align: left;">Actions</th></tr></thead><tbody>';
        arr.forEach(function (t) {
          var host = t.product === 'lgbtq-hub' ? t.subdomain + '.lgbtq-hub.com' : t.subdomain + '.eplanner.kervinapps.com';
          html += '<tr style="border-bottom: 1px solid var(--border-gray);"><td style="padding: 10px;">' + (t.tenantKey || '') + '</td><td style="padding: 10px;">' + (t.product || '') + '</td><td style="padding: 10px;">' + (t.subdomain || '') + '</td><td style="padding: 10px;">' + (t.senderEmail || '-') + '</td><td style="padding: 10px;"><button type="button" class="button button-secondary" style="margin-right: 8px; padding: 4px 10px; font-size: 12px;" onclick="tenantEdit(\'' + (t.tenantKey || '').replace(/'/g, "\\'") + '\')">Edit</button><button type="button" class="button button-secondary" style="padding: 4px 10px; font-size: 12px;" onclick="tenantDelete(\'' + (t.tenantKey || '').replace(/'/g, "\\'") + '\')">Delete</button></td></tr>';
        });
        html += '</tbody></table>';
        list.innerHTML = html;
      })
      .catch(function () {
        if (loading) loading.style.display = 'none';
        if (list) {
          list.style.display = 'block';
          list.innerHTML = '<p style="color: #dc2626;">Failed to load tenants. Check admin password.</p>';
        }
      });
  }

  window.initTenantManager = function () {
    var login = document.getElementById('tenantManagerLogin');
    var main = document.getElementById('tenantManagerMain');
    if (!login || !main) return;
    if (getPassword()) {
      showMain();
      loadTenantList();
    } else {
      showLogin();
    }
    tenantCancelEdit();
    var product = document.getElementById('tenantProduct');
    var sub = document.getElementById('tenantSubdomain');
    if (product) product.addEventListener('change', onProductOrSubdomainChange);
    if (sub) sub.addEventListener('input', onProductOrSubdomainChange);
  };
})();
