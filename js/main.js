(function () {
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var header = document.querySelector(".site-header");

  /* En-tête */
  function onScroll() { header.classList.toggle("scrolled", window.scrollY > 20); }
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var toggle = document.querySelector(".nav-toggle");
  toggle.addEventListener("click", function () {
    var open = header.classList.toggle("nav-open");
    toggle.setAttribute("aria-expanded", open);
  });

  /* Transition entre les pages */
  document.querySelectorAll("a[href]").forEach(function (a) {
    var href = a.getAttribute("href");
    if (!href || href.charAt(0) === "#" || /^(https?:|mailto:|tel:)/.test(href) || a.target) return;
    a.addEventListener("click", function (e) {
      if (e.metaKey || e.ctrlKey || reduce) return;
      e.preventDefault();
      document.body.classList.add("leaving");
      setTimeout(function () { window.location.href = href; }, 260);
    });
  });
  window.addEventListener("pageshow", function () { document.body.classList.remove("leaving"); });

  /* Apparition au défilement */
  var items = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    items.forEach(function (el) { io.observe(el); });
  } else {
    items.forEach(function (el) { el.classList.add("in"); });
  }

  /* Compteurs */
  document.querySelectorAll("[data-count]").forEach(function (el) {
    var target = +el.dataset.count, suffix = el.dataset.suffix || "";
    if (reduce) { el.textContent = target + suffix; return; }
    var started = false;
    new IntersectionObserver(function (entries, obs) {
      if (!entries[0].isIntersecting || started) return;
      started = true; obs.disconnect();
      var t0 = performance.now(), dur = 1600;
      (function tick(t) {
        var p = Math.min((t - t0) / dur, 1), e = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * e) + suffix;
        if (p < 1) requestAnimationFrame(tick);
      })(t0);
    }, { threshold: 0.5 }).observe(el);
  });

  /* Parallaxe légère du héros */
  var visual = document.querySelector(".hero-visual");
  if (visual && !reduce && window.matchMedia("(pointer: fine)").matches) {
    document.querySelector(".hero").addEventListener("mousemove", function (e) {
      var x = (e.clientX / window.innerWidth - 0.5) * 18, y = (e.clientY / window.innerHeight - 0.5) * 18;
      visual.style.transform = "translate(" + x + "px," + y + "px)";
    });
    visual.style.transition = "transform 0.4s ease-out";
  }

  var cfg = window.EAC || {};
  document.querySelectorAll("[data-mail]").forEach(function (a) {
    a.href = "mailto:" + cfg.email; a.textContent = a.textContent || cfg.email;
  });

  /* Évènements */
  var list = document.getElementById("events");
  if (list) {
    var data = (window.EVENEMENTS || []).slice().sort(function (a, b) { return a.date < b.date ? -1 : 1; });
    var today = new Date().toISOString().slice(0, 10);
    var mois = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];
    var mode = "upcoming";
    var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };

    var render = function () {
      var shown = data.filter(function (ev) { return mode === "upcoming" ? ev.date >= today : ev.date < today; });
      if (mode === "past") shown.reverse();
      if (!shown.length) {
        list.innerHTML = '<div class="empty reveal in"><div class="icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M3 10h18M8 3v4M16 3v4"/></svg></div><h3>' +
          (mode === "upcoming" ? "Aucun évènement programmé pour le moment" : "Aucun évènement passé") +
          '</h3><p>' + (mode === "upcoming" ? "Les prochaines dates seront annoncées ici dès qu\'elles seront fixées. Revenez bientôt, ou écrivez-nous pour être prévenu." : "L\'historique de nos rendez-vous apparaîtra ici.") + '</p></div>';
        return;
      }
      list.innerHTML = shown.map(function (ev, i) {
        var d = new Date(ev.date + "T12:00:00");
        return '<article class="event reveal in" style="animation: rise .7s var(--ease) ' + (i * 0.08) + 's both">' +
          '<div class="event-date"><b>' + d.getDate() + '</b><span>' + mois[d.getMonth()] + " " + d.getFullYear() + '</span></div>' +
          '<div><h3>' + esc(ev.titre) + '</h3>' + (ev.description ? '<p>' + esc(ev.description) + '</p>' : "") +
          '<div class="meta">' + (ev.heure ? '<span>' + esc(ev.heure) + '</span>' : "") + (ev.lieu ? '<span>' + esc(ev.lieu) + '</span>' : "") + '</div></div>' +
          '<span class="badge">' + (mode === "upcoming" ? "À venir" : "Terminé") + '</span></article>';
      }).join("");
      list.firstElementChild && list.querySelectorAll(".event").forEach(function (el) { if (mode === "past") el.classList.add("past"); });
    };

    document.querySelectorAll(".filters button").forEach(function (b) {
      b.addEventListener("click", function () {
        document.querySelectorAll(".filters button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active"); mode = b.dataset.mode; render();
      });
    });
    render();
  }

  /* Adhésion */
  var plans = document.querySelectorAll(".plan");
  var typeSel = document.getElementById("type");
  if (plans.length) {
    plans.forEach(function (p) {
      var key = p.dataset.plan;
      var price = p.querySelector("[data-price]");
      if (cfg.adhesions && price) price.textContent = cfg.adhesions[key];
      p.addEventListener("click", function () {
        plans.forEach(function (x) { x.classList.remove("selected"); });
        p.classList.add("selected"); typeSel.value = key;
        document.getElementById("formulaire").scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
      });
    });
    typeSel.addEventListener("change", function () {
      plans.forEach(function (x) { x.classList.toggle("selected", x.dataset.plan === typeSel.value); });
    });
  }

  var form = document.getElementById("adhesion-form");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = new FormData(form), g = function (k) { return f.get(k) || ""; };
      var body = "Demande d'adhésion à Entr'Aide et Culture\n\n" +
        "Nom : " + g("nom") + "\nPrénom : " + g("prenom") + "\nEmail : " + g("email") + "\nTéléphone : " + g("tel") +
        "\nType d'adhésion : " + typeSel.options[typeSel.selectedIndex].text +
        "\nEnfant / niveau : " + g("niveau") + "\n\nMessage :\n" + g("message");
      var notice = document.getElementById("form-notice");
      notice.textContent = "Merci " + g("prenom") + ". Votre messagerie va s'ouvrir avec votre demande déjà rédigée : il ne reste qu'à l'envoyer.";
      notice.classList.add("show");
      window.location.href = "mailto:" + cfg.email + "?subject=" + encodeURIComponent("Adhésion EAC - " + g("nom")) + "&body=" + encodeURIComponent(body);
    });
  }

  /* Dons */
  var donForm = document.getElementById("don-form");
  if (donForm) {
    var amount = 20, monthly = false;
    var out = document.getElementById("don-total"), custom = document.getElementById("custom");
    var label = document.getElementById("don-label");
    var update = function () {
      out.textContent = amount + " €";
      label.textContent = monthly ? "par mois" : "don unique";
    };
    donForm.querySelectorAll(".amount").forEach(function (b) {
      b.addEventListener("click", function () {
        donForm.querySelectorAll(".amount").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active"); amount = +b.dataset.amount; custom.value = ""; update();
      });
    });
    custom.addEventListener("input", function () {
      var v = parseInt(custom.value, 10);
      if (v > 0) { donForm.querySelectorAll(".amount").forEach(function (x) { x.classList.remove("active"); }); amount = v; update(); }
    });
    donForm.querySelectorAll(".toggle button").forEach(function (b) {
      b.addEventListener("click", function () {
        donForm.querySelectorAll(".toggle button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active"); monthly = b.dataset.mode === "monthly"; update();
      });
    });
    donForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (cfg.helloassoDon) { window.location.href = cfg.helloassoDon; return; }
      var n = document.getElementById("don-notice");
      n.innerHTML = "Le paiement en ligne n'est pas encore ouvert. Pour faire un don de " + amount + " € (" + (monthly ? "mensuel" : "unique") + "), écrivez-nous à <a href=\"mailto:" + cfg.email + "?subject=" + encodeURIComponent("Don EAC de " + amount + " euros") + "\"><u>" + cfg.email + "</u></a> et nous vous indiquerons comment procéder.";
      n.classList.add("show");
    });
    update();
    var bar = document.querySelector(".progress");
    if (bar) { if (!cfg.objectifDon) bar.parentElement.style.display = "none"; }
  }
})();
