(function () {
  'use strict';

  const API = '/api';
  const DATA_URL_MAX_BYTES_FAVICON = 300 * 1024; // 300KB
  const DATA_URL_MAX_BYTES_HERO = 2 * 1024 * 1024; // 2MB

  function isDataUrl(s) {
    return typeof s === 'string' && s.startsWith('data:image/');
  }

  function approxBytesFromDataUrl(dataUrl) {
    // Rough but safe enough for client-side limits.
    // base64 expands by ~4/3; we also include the prefix.
    if (!dataUrl || typeof dataUrl !== 'string') return 0;
    if (!dataUrl.startsWith('data:')) return dataUrl.length;
    const idx = dataUrl.indexOf('base64,');
    if (idx === -1) return dataUrl.length;
    const b64 = dataUrl.slice(idx + 'base64,'.length);
    return Math.floor((b64.length * 3) / 4);
  }

  function toDataUrl(file, opts) {
    // opts: { maxWidth, maxBytes, quality, mimeType }
    return new Promise((resolve, reject) => {
      if (!file) return resolve(null);
      if (!file.type || !file.type.startsWith('image/')) return reject(new Error('Please select a valid image file'));

      const reader = new FileReader();
      reader.onerror = () => reject(new Error('Failed to read image file'));
      reader.onload = (e) => {
        const img = new Image();
        img.onerror = () => reject(new Error('Failed to load image'));
        img.onload = () => {
          try {
            const maxWidth = (opts && opts.maxWidth) || 1400;
            const quality = (opts && typeof opts.quality === 'number') ? opts.quality : 0.82;
            const mimeType = (opts && opts.mimeType) || 'image/jpeg';

            let width = img.width;
            let height = img.height;
            if (width > maxWidth) {
              height = Math.round((height * maxWidth) / width);
              width = maxWidth;
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const out = canvas.toDataURL(mimeType, quality);
            const maxBytes = (opts && opts.maxBytes) || DATA_URL_MAX_BYTES_HERO;
            const bytes = approxBytesFromDataUrl(out);
            if (bytes > maxBytes) {
              return reject(new Error('Image is too large after compression. Please use a smaller image.'));
            }
            resolve(out);
          } catch (err) {
            reject(err);
          }
        };
        img.src = e.target.result;
      };
      reader.readAsDataURL(file);
    });
  }

  function wireImageField(cfg) {
    // cfg: { textId, fileId, browseBtnId, clearBtnId, previewWrapId, previewImgId, kind }
    const text = document.getElementById(cfg.textId);
    const file = document.getElementById(cfg.fileId);
    const browseBtn = document.getElementById(cfg.browseBtnId);
    const clearBtn = document.getElementById(cfg.clearBtnId);
    const previewWrap = document.getElementById(cfg.previewWrapId);
    const previewImg = document.getElementById(cfg.previewImgId);

    function setPreview(val) {
      if (!previewWrap || !previewImg) return;
      if (val && typeof val === 'string') {
        previewImg.src = val;
        previewWrap.style.display = 'block';
      } else {
        previewImg.src = '';
        previewWrap.style.display = 'none';
      }
    }

    function syncFromText() {
      if (!text) return;
      const v = text.value ? text.value.trim() : '';
      // Only preview when it looks like an image source.
      if (v && (isDataUrl(v) || v.startsWith('http') || v.startsWith('assets/'))) {
        setPreview(v);
      } else {
        setPreview('');
      }
    }

    if (text) {
      text.addEventListener('input', syncFromText);
      text.addEventListener('change', syncFromText);
    }

    if (browseBtn && file) {
      browseBtn.addEventListener('click', function () { file.click(); });
    }

    if (clearBtn) {
      clearBtn.addEventListener('click', function () {
        if (text) text.value = '';
        if (file) file.value = '';
        setPreview('');
      });
    }

    if (file) {
      file.addEventListener('change', function (e) {
        const f = e && e.target && e.target.files && e.target.files[0] ? e.target.files[0] : null;
        if (!f) return;

        const isFavicon = cfg.kind === 'favicon';
        const opts = isFavicon
          ? { maxWidth: 256, maxBytes: DATA_URL_MAX_BYTES_FAVICON, quality: 0.92, mimeType: 'image/png' }
          : { maxWidth: 1600, maxBytes: DATA_URL_MAX_BYTES_HERO, quality: 0.82, mimeType: 'image/jpeg' };

        toDataUrl(f, opts)
          .then(function (dataUrl) {
            if (text) text.value = dataUrl || '';
            setPreview(dataUrl || '');
          })
          .catch(function (err) {
            alert((err && err.message) ? err.message : 'Failed to process image');
          })
          .finally(function () {
            // Allow re-selecting same file
            try { file.value = ''; } catch (e2) {}
          });
      });
    }

    // initial render
    syncFromText();
    return { setPreview: setPreview };
  }

  function getPassword() {
    if (window.AdminAuth && typeof window.AdminAuth.getPassword === 'function') {
      return window.AdminAuth.getPassword() || '';
    }
    try { return sessionStorage.getItem('tenant_admin_pw') || ''; } catch (e) { return ''; }
  }

  function setPassword(pw) {
    if (window.AdminAuth && typeof window.AdminAuth.setPassword === 'function') {
      return window.AdminAuth.setPassword(pw);
    }
    try { sessionStorage.setItem('tenant_admin_pw', pw); } catch (e) {}
  }

  function clearPassword() {
    if (window.AdminAuth && typeof window.AdminAuth.clearPassword === 'function') {
      return window.AdminAuth.clearPassword();
    }
    try { sessionStorage.removeItem('tenant_admin_pw'); } catch (e) {}
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
    showLoginError('');
    if (window.AdminAuth && typeof window.AdminAuth.openLoginModal === 'function') {
      window.AdminAuth.openLoginModal({ reason: 'manage tenants' })
        .then(function (pw) {
          if (!pw) return;
          showMain();
          loadTenantList();
        })
        .catch(function () {
          showLoginError('Login failed');
        });
      return;
    }
    showLoginError('Admin login modal unavailable.');
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
    const heroSections = {};

    function readHeroSection(pageKey, bgId, headlineId, subheadlineId) {
      const bg = (document.getElementById(bgId) && document.getElementById(bgId).value.trim()) || null;
      const headline = (document.getElementById(headlineId) && document.getElementById(headlineId).value.trim()) || null;
      const subheadline = (document.getElementById(subheadlineId) && document.getElementById(subheadlineId).value.trim()) || null;
      const out = {};
      if (bg) out.backgroundImage = bg;
      if (headline) out.headline = headline;
      if (subheadline) out.subheadline = subheadline;
      if (Object.keys(out).length) heroSections[pageKey] = out;
    }

    // Guardrails: prevent oversized database-backed data URLs.
    if (favicon && isDataUrl(favicon) && approxBytesFromDataUrl(favicon) > DATA_URL_MAX_BYTES_FAVICON) {
      alert('Favicon image is too large. Please choose a smaller image.');
      return null;
    }

    readHeroSection('home', 'tenantHeroHomeBg', 'tenantHeroHomeHeadline', 'tenantHeroHomeSubheadline');
    readHeroSection('calendar', 'tenantHeroCalendarBg', 'tenantHeroCalendarHeadline', 'tenantHeroCalendarSubheadline');
    readHeroSection('coordinate', 'tenantHeroCoordinateBg', 'tenantHeroCoordinateHeadline', 'tenantHeroCoordinateSubheadline');
    readHeroSection('whatsapp', 'tenantHeroWhatsappBg', 'tenantHeroWhatsappHeadline', 'tenantHeroWhatsappSubheadline');
    readHeroSection('signup', 'tenantHeroSignupBg', 'tenantHeroSignupHeadline', 'tenantHeroSignupSubheadline');

    const heroKeys = Object.keys(heroSections);
    for (let i = 0; i < heroKeys.length; i++) {
      const k = heroKeys[i];
      const sec = heroSections[k] || {};
      if (sec.backgroundImage && isDataUrl(sec.backgroundImage) && approxBytesFromDataUrl(sec.backgroundImage) > DATA_URL_MAX_BYTES_HERO) {
        alert('Hero image for "' + k + '" is too large. Please choose a smaller image.');
        return null;
      }
    }

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
    if (Object.keys(heroSections).length) configJson.heroSections = heroSections;
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
    const heroHomeBg = document.getElementById('tenantHeroHomeBg');
    const heroCalendarBg = document.getElementById('tenantHeroCalendarBg');
    const heroCoordinateBg = document.getElementById('tenantHeroCoordinateBg');
    const heroWhatsappBg = document.getElementById('tenantHeroWhatsappBg');
    const heroSignupBg = document.getElementById('tenantHeroSignupBg');
    const heroHomeHeadline = document.getElementById('tenantHeroHomeHeadline');
    const heroCalendarHeadline = document.getElementById('tenantHeroCalendarHeadline');
    const heroCoordinateHeadline = document.getElementById('tenantHeroCoordinateHeadline');
    const heroWhatsappHeadline = document.getElementById('tenantHeroWhatsappHeadline');
    const heroSignupHeadline = document.getElementById('tenantHeroSignupHeadline');
    const heroHomeSubheadline = document.getElementById('tenantHeroHomeSubheadline');
    const heroCalendarSubheadline = document.getElementById('tenantHeroCalendarSubheadline');
    const heroCoordinateSubheadline = document.getElementById('tenantHeroCoordinateSubheadline');
    const heroWhatsappSubheadline = document.getElementById('tenantHeroWhatsappSubheadline');
    const heroSignupSubheadline = document.getElementById('tenantHeroSignupSubheadline');
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
    const hs = c.heroSections || {};
    function writeHeroSection(pageKey, bgEl, headEl, subEl) {
      const sec = hs && hs[pageKey] ? hs[pageKey] : {};
      if (bgEl) bgEl.value = sec.backgroundImage || '';
      if (headEl) headEl.value = sec.headline || '';
      if (subEl) subEl.value = sec.subheadline || '';
    }
    writeHeroSection('home', heroHomeBg, heroHomeHeadline, heroHomeSubheadline);
    writeHeroSection('calendar', heroCalendarBg, heroCalendarHeadline, heroCalendarSubheadline);
    writeHeroSection('coordinate', heroCoordinateBg, heroCoordinateHeadline, heroCoordinateSubheadline);
    writeHeroSection('whatsapp', heroWhatsappBg, heroWhatsappHeadline, heroWhatsappSubheadline);
    writeHeroSection('signup', heroSignupBg, heroSignupHeadline, heroSignupSubheadline);
    const h = c.hero || {};
    if (findGroupUrl) findGroupUrl.value = h.findGroupUrl || '';
    if (learnMoreUrl) learnMoreUrl.value = h.learnMoreUrl || '';
    if (showCtas) showCtas.checked = !!h.showCtas;
    if (saveBtn) saveBtn.textContent = t.tenantKey ? 'Update tenant' : 'Create tenant';
    if (cancelBtn) cancelBtn.style.display = t.tenantKey ? 'inline-block' : 'none';
    updateDnsBlock();

    // Sync previews after populating values
    if (window.__tenantImageFields && typeof window.__tenantImageFields.syncAll === 'function') {
      window.__tenantImageFields.syncAll();
    }
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
    if (!d) return;
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
    } else if (window.AdminAuth && typeof window.AdminAuth.openLoginModal === 'function') {
      showLogin();
    } else {
      showLogin();
      showLoginError('Admin login unavailable.');
    }
    tenantCancelEdit();
    var product = document.getElementById('tenantProduct');
    var sub = document.getElementById('tenantSubdomain');
    if (product) product.addEventListener('change', onProductOrSubdomainChange);
    if (sub) sub.addEventListener('input', onProductOrSubdomainChange);

    // Wire up image browse/preview controls (favicon + hero backgrounds)
    const fields = [];
    fields.push(wireImageField({
      kind: 'favicon',
      textId: 'tenantFavicon',
      fileId: 'tenantFaviconFile',
      browseBtnId: 'tenantFaviconBrowseBtn',
      clearBtnId: 'tenantFaviconClearBtn',
      previewWrapId: 'tenantFaviconPreviewWrap',
      previewImgId: 'tenantFaviconPreview',
    }));
    fields.push(wireImageField({
      kind: 'hero',
      textId: 'tenantHeroHomeBg',
      fileId: 'tenantHeroHomeBgFile',
      browseBtnId: 'tenantHeroHomeBgBrowseBtn',
      clearBtnId: 'tenantHeroHomeBgClearBtn',
      previewWrapId: 'tenantHeroHomeBgPreviewWrap',
      previewImgId: 'tenantHeroHomeBgPreview',
    }));
    fields.push(wireImageField({
      kind: 'hero',
      textId: 'tenantHeroCalendarBg',
      fileId: 'tenantHeroCalendarBgFile',
      browseBtnId: 'tenantHeroCalendarBgBrowseBtn',
      clearBtnId: 'tenantHeroCalendarBgClearBtn',
      previewWrapId: 'tenantHeroCalendarBgPreviewWrap',
      previewImgId: 'tenantHeroCalendarBgPreview',
    }));
    fields.push(wireImageField({
      kind: 'hero',
      textId: 'tenantHeroCoordinateBg',
      fileId: 'tenantHeroCoordinateBgFile',
      browseBtnId: 'tenantHeroCoordinateBgBrowseBtn',
      clearBtnId: 'tenantHeroCoordinateBgClearBtn',
      previewWrapId: 'tenantHeroCoordinateBgPreviewWrap',
      previewImgId: 'tenantHeroCoordinateBgPreview',
    }));
    fields.push(wireImageField({
      kind: 'hero',
      textId: 'tenantHeroWhatsappBg',
      fileId: 'tenantHeroWhatsappBgFile',
      browseBtnId: 'tenantHeroWhatsappBgBrowseBtn',
      clearBtnId: 'tenantHeroWhatsappBgClearBtn',
      previewWrapId: 'tenantHeroWhatsappBgPreviewWrap',
      previewImgId: 'tenantHeroWhatsappBgPreview',
    }));
    fields.push(wireImageField({
      kind: 'hero',
      textId: 'tenantHeroSignupBg',
      fileId: 'tenantHeroSignupBgFile',
      browseBtnId: 'tenantHeroSignupBgBrowseBtn',
      clearBtnId: 'tenantHeroSignupBgClearBtn',
      previewWrapId: 'tenantHeroSignupBgPreviewWrap',
      previewImgId: 'tenantHeroSignupBgPreview',
    }));

    window.__tenantImageFields = {
      syncAll: function () {
        fields.forEach(function (f) {
          try {
            if (f && typeof f.setPreview === 'function') {
              // no-op; previews are synced via input handlers. This hook exists so fillForm can request refresh.
            }
          } catch (e) {}
        });
        // Re-trigger input change to refresh previews
        [
          'tenantFavicon',
          'tenantHeroHomeBg',
          'tenantHeroCalendarBg',
          'tenantHeroCoordinateBg',
          'tenantHeroWhatsappBg',
          'tenantHeroSignupBg',
        ].forEach(function (id) {
          const el = document.getElementById(id);
          if (el) el.dispatchEvent(new Event('change', { bubbles: true }));
        });
      },
    };
    window.__tenantImageFields.syncAll();
  };
})();
