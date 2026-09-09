/* Dashboard behaviour. No dependencies. */
(function () {
  'use strict';

  /* ---- sidebar ---------------------------------------------------------- */
  var sidebar = document.getElementById('adminSidebar');
  var backdrop = document.getElementById('sidebarBackdrop');
  function setSidebar(open) {
    if (!sidebar) return;
    sidebar.classList.toggle('is-open', open);
    if (backdrop) backdrop.hidden = !open;
  }
  var openBtn = document.getElementById('sidebarOpen');
  var closeBtn = document.getElementById('sidebarClose');
  if (openBtn) openBtn.addEventListener('click', function () { setSidebar(true); });
  if (closeBtn) closeBtn.addEventListener('click', function () { setSidebar(false); });
  if (backdrop) backdrop.addEventListener('click', function () { setSidebar(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setSidebar(false); });

  /* ---- theme ------------------------------------------------------------ */
  var themeBtn = document.getElementById('adminThemeToggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('admin-theme', next); } catch (e) {}
    });
  }

  /* ---- confirm before destructive submits ------------------------------- */
  document.addEventListener('submit', function (e) {
    var form = e.target.closest('form[data-confirm]');
    if (form && !window.confirm(form.getAttribute('data-confirm'))) {
      e.preventDefault();
    }
  });
  // A delete button that targets a separate form still needs the prompt.
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('button[form]');
    if (!btn) return;
    var target = document.getElementById(btn.getAttribute('form'));
    if (target && target.hasAttribute('data-confirm') && !window.confirm(target.getAttribute('data-confirm'))) {
      e.preventDefault();
    }
  });

  /* ---- toggle switches inside list rows submit immediately -------------- */
  document.querySelectorAll('.switch-input').forEach(function (input) {
    input.addEventListener('change', function () {
      var wrap = input.closest('.switch-label');
      if (wrap) wrap.querySelector('.switch').classList.toggle('is-on', input.checked);
    });
  });

  /* ---- search box submits as you stop typing ---------------------------- */
  var search = document.getElementById('tableSearch');
  if (search) {
    var timer;
    search.addEventListener('input', function () {
      clearTimeout(timer);
      timer = setTimeout(function () { search.form.submit(); }, 500);
    });
  }

  /* ---- slug helper: fill from the title until edited by hand ------------ */
  var slugInput = document.querySelector('input[data-slug]');
  var titleInput = document.getElementById('f-title') || document.getElementById('f-name');
  if (slugInput && titleInput) {
    var touched = slugInput.value.trim() !== '';
    slugInput.addEventListener('input', function () { touched = true; });
    titleInput.addEventListener('input', function () {
      if (touched) return;
      slugInput.value = titleInput.value.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
    });
  }

  /* ---- icon picker preview ---------------------------------------------- */
  document.querySelectorAll('.icon-picker select').forEach(function (select) {
    select.addEventListener('change', function () {
      var preview = select.parentElement.querySelector('.icon-preview');
      if (preview) preview.style.opacity = select.value ? '1' : '.35';
    });
  });

  /* ---- copy a media path ------------------------------------------------ */
  document.querySelectorAll('.copy-path').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-path');
      var done = function () {
        var original = btn.textContent;
        btn.textContent = 'Copied';
        setTimeout(function () { btn.textContent = original; }, 1500);
      };
      if (navigator.clipboard) { navigator.clipboard.writeText(text).then(done).catch(done); }
      else {
        var t = document.createElement('textarea');
        t.value = text; document.body.appendChild(t); t.select();
        try { document.execCommand('copy'); } catch (e) {}
        document.body.removeChild(t); done();
      }
    });
  });

  /* ---- rich text editor -------------------------------------------------- */
  document.querySelectorAll('[data-editor]').forEach(function (editor) {
    var surface = editor.querySelector('.editor-surface');
    var source = editor.querySelector('.editor-source');
    var htmlBtn = editor.querySelector('[data-html]');
    var showingSource = false;

    function sync() { if (!showingSource) source.value = surface.innerHTML; }

    editor.querySelectorAll('.editor-toolbar button').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.preventDefault();
        if (btn.hasAttribute('data-html')) {
          showingSource = !showingSource;
          if (showingSource) {
            source.value = surface.innerHTML;
            surface.hidden = true; source.hidden = false; source.focus();
          } else {
            surface.innerHTML = source.value;
            source.hidden = true; surface.hidden = false; surface.focus();
          }
          htmlBtn.classList.toggle('is-active', showingSource);
          return;
        }
        if (showingSource) return;

        surface.focus();
        var block = btn.getAttribute('data-block');
        if (block) {
          document.execCommand('formatBlock', false, block);
        } else {
          var cmd = btn.getAttribute('data-cmd');
          if (cmd === 'createLink') {
            var href = window.prompt('Link address (include https://)', 'https://');
            if (href) document.execCommand('createLink', false, href);
          } else {
            document.execCommand(cmd, false, null);
          }
        }
        sync();
      });
    });

    surface.addEventListener('input', sync);
    surface.addEventListener('blur', sync);
    source.addEventListener('input', function () { if (showingSource) surface.innerHTML = source.value; });

    // Paste as plain text so Word and Google Docs markup never leaks in.
    surface.addEventListener('paste', function (e) {
      var html = (e.clipboardData || window.clipboardData).getData('text/html');
      if (!html) return;
      e.preventDefault();
      var clean = html
        .replace(/<!--[\s\S]*?-->/g, '')
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
        .replace(/\sstyle="[^"]*"/gi, '')
        .replace(/\sclass="[^"]*"/gi, '')
        .replace(/<\/?(span|font|o:p|meta|link)[^>]*>/gi, '');
      document.execCommand('insertHTML', false, clean);
      sync();
    });

    var form = editor.closest('form');
    if (form) form.addEventListener('submit', function () { if (!showingSource) source.value = surface.innerHTML; });
  });

  /* ---- warn before leaving an edited form ------------------------------- */
  var form = document.querySelector('.admin-form');
  if (form) {
    var dirty = false;
    form.addEventListener('input', function () { dirty = true; });
    form.addEventListener('submit', function () { dirty = false; });
    window.addEventListener('beforeunload', function (e) {
      if (!dirty) return;
      e.preventDefault();
      e.returnValue = '';
    });
  }
})();
