/* Huakui Knitting — interactions (vanilla, ~3KB) */
(function () {
  'use strict';

  /* ---- mobile nav ---- */
  var toggle = document.querySelector('.nav-toggle');
  var mobile = document.querySelector('.nav-mobile');
  if (toggle && mobile) {
    toggle.addEventListener('click', function () {
      var open = mobile.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    mobile.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () {
        mobile.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- language switcher ---- */
  var langBtn = document.querySelector('.lang-toggle');
  var langMenu = document.querySelector('.lang-menu');
  if (langBtn && langMenu) {
    langBtn.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = langMenu.classList.toggle('open');
      langBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function () {
      langMenu.classList.remove('open');
      langBtn.setAttribute('aria-expanded', 'false');
    });
  }

  /* ---- portfolio product-line navigation ---- */
  var portfolioLinks = Array.from(document.querySelectorAll('.portfolio-line[href^="#"]'));
  if (portfolioLinks.length) {
    var portfolioSections = portfolioLinks.map(function (link) {
      return document.querySelector(link.getAttribute('href'));
    }).filter(Boolean);

    function setActiveProductLine(id) {
      portfolioLinks.forEach(function (link) {
        var active = link.getAttribute('href') === '#' + id;
        link.classList.toggle('active', active);
        if (active) link.setAttribute('aria-current', 'true');
        else link.removeAttribute('aria-current');
      });
    }

    function syncProductLine() {
      var marker = window.scrollY + Math.min(240, window.innerHeight * 0.3);
      var current = portfolioSections[0];
      portfolioSections.forEach(function (section) {
        if (section.offsetTop <= marker) current = section;
      });
      if (current) setActiveProductLine(current.id);
    }

    portfolioLinks.forEach(function (link) {
      link.addEventListener('click', function () {
        setActiveProductLine(link.getAttribute('href').slice(1));
      });
    });
    window.addEventListener('scroll', syncProductLine, { passive: true });
    window.addEventListener('resize', syncProductLine);
    window.addEventListener('hashchange', function () {
      var id = window.location.hash.slice(1);
      if (id && document.getElementById(id)) setActiveProductLine(id);
      else syncProductLine();
    });

    var initialId = window.location.hash.slice(1);
    if (initialId && document.getElementById(initialId)) setActiveProductLine(initialId);
    else syncProductLine();
  }

  /* ---- reveal on scroll ---- */
  var reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.classList.add('is-visible');
          io.unobserve(en.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add('is-visible'); });
  }

  /* ---- inquiry form (FormSubmit AJAX) ---- */
  var form = document.querySelector('[data-form="inquiry"]');
  if (form) {
    var success = form.querySelector('[data-success]');
    var btn = form.querySelector('button[type="submit"]');
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!form.checkValidity()) { form.reportValidity(); return; }
      var honey = form.querySelector('.honey');
      if (honey && honey.value) return; // bot trap
      var action = form.getAttribute('action');
      var ajaxUrl = action.replace('formsubmit.co/', 'formsubmit.co/ajax/');
      var data = {};
      new FormData(form).forEach(function (v, k) { data[k] = v; });
      if (btn) { btn.disabled = true; btn.dataset.label = btn.textContent; btn.textContent = '…'; }
      fetch(ajaxUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json(); })
        .then(function (j) {
          if (j && (j.success === 'true' || j.success === true)) {
            form.reset();
            if (success) { success.hidden = false; success.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
          } else {
            alert('Could not send. Please email us directly — details in the footer.');
          }
        })
        .catch(function () {
          // fall back to a normal POST so the message still goes through
          form.removeEventListener('submit', arguments.callee);
          form.submit();
        })
        .finally(function () {
          if (btn) { btn.disabled = false; btn.textContent = btn.dataset.label; }
        });
    });
  }
})();
