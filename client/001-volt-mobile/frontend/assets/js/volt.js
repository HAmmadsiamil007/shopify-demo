/* ==========================================================================
   VOLT MOBILE — External Frontend · Interactions
   Client #1 · Baseline: aether-master-v1.2.1 · 2026-08-19
   Motion layer: Lenis smooth scroll + GSAP reveals + Swiper + commerce sim.
   ========================================================================== */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var Lenis = window.Lenis;
  var gsap = window.gsap;

  /* ---------- 1. Smooth scroll ---------- */
  var lenis = null;
  if (Lenis && !prefersReduced) {
    lenis = new Lenis({ lerp: 0.09, wheelMultiplier: 0.95 });
    function raf(time) { lenis.raf(time); requestAnimationFrame(raf); }
    requestAnimationFrame(raf);
    window.vmLenis = lenis;
  }

  /* ---------- 2. Header state ---------- */
  var header = document.querySelector(".vm-header");
  if (header) {
    var onScroll = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      header.classList.toggle("is-compact", window.scrollY > 140);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 3. Reveal animations ---------- */
  if (gsap && window.ScrollTrigger && !prefersReduced) {
    gsap.registerPlugin(window.ScrollTrigger);
    var revealEls = document.querySelectorAll("[data-reveal]");
    revealEls.forEach(function (el) {
      gsap.to(el, {
        opacity: 1,
        y: 0,
        x: 0,
        scale: 1,
        duration: 0.9,
        ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%", once: true }
      });
    });
    var staggerGroups = document.querySelectorAll("[data-reveal-stagger]");
    staggerGroups.forEach(function (group) {
      var kids = group.querySelectorAll("[data-reveal]");
      if (!kids.length) return;
      gsap.to(kids, {
        opacity: 1,
        y: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out",
        scrollTrigger: { trigger: group, start: "top 86%", once: true }
      });
    });
  }

  /* ---------- 4. Mobile nav ---------- */
  var burger = document.querySelector(".vm-burger");
  var mobileNav = document.querySelector(".vm-mobile-nav");
  var body = document.body;
  function openMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.add("is-open");
    body.style.overflow = "hidden";
    var links = mobileNav.querySelectorAll(".vm-mobile-nav__link");
    links.forEach(function (l, i) { l.style.transitionDelay = (0.06 * i) + "s"; });
    if (lenis) lenis.stop();
  }
  function closeMobileNav() {
    if (!mobileNav) return;
    mobileNav.classList.remove("is-open");
    body.style.overflow = "";
    if (lenis) lenis.start();
  }
  if (burger) burger.addEventListener("click", openMobileNav);
  if (mobileNav) {
    var closeBtn = mobileNav.querySelector("[data-close-nav]");
    if (closeBtn) closeBtn.addEventListener("click", closeMobileNav);
    mobileNav.querySelectorAll("a").forEach(function (a) { a.addEventListener("click", closeMobileNav); });
  }

  /* ---------- 5. Overlay + drawers ---------- */
  var overlay = document.querySelector(".vm-overlay");
  var cartDrawer = document.querySelector(".vm-drawer");
  var searchOverlay = document.querySelector(".vm-search");

  function openOverlay() { if (overlay) overlay.classList.add("is-open"); }
  function closeOverlay() { if (overlay) overlay.classList.remove("is-open"); }
  function closeAll() {
    if (cartDrawer) cartDrawer.classList.remove("is-open");
    if (searchOverlay) searchOverlay.classList.remove("is-open");
    closeOverlay();
    body.style.overflow = "";
    if (lenis) lenis.start();
  }
  if (overlay) overlay.addEventListener("click", closeAll);
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeAll(); });

  function openCart() {
    if (!cartDrawer) return;
    cartDrawer.classList.add("is-open");
    openOverlay();
    body.style.overflow = "hidden";
    if (lenis) lenis.stop();
  }
  function openSearch() {
    if (!searchOverlay) return;
    searchOverlay.classList.add("is-open");
    openOverlay();
    body.style.overflow = "hidden";
    if (lenis) lenis.stop();
    var input = searchOverlay.querySelector("input");
    if (input) setTimeout(function () { input.focus(); }, 260);
  }

  document.querySelectorAll("[data-cart-open]").forEach(function (b) { b.addEventListener("click", openCart); });
  document.querySelectorAll("[data-search-open]").forEach(function (b) { b.addEventListener("click", openSearch); });
  document.querySelectorAll("[data-close]").forEach(function (b) { b.addEventListener("click", closeAll); });

  /* ---------- 6. Cart simulation ---------- */
  var cart = [];
  try {
    var stored = localStorage.getItem("volt-cart");
    if (stored) cart = JSON.parse(stored) || [];
  } catch (e) { cart = []; }
  var cartCountEl = document.querySelector(".vm-cart-count");
  var cartLinesEl = document.querySelector("[data-cart-lines]");
  var cartEmptyEl = document.querySelector("[data-cart-empty]");
  var shippingFill = document.querySelector(".vm-shipping-bar__fill");
  var shippingLabel = document.querySelector(".vm-shipping-bar__label");
  var FREE_SHIP = 99000;

  function money(n) { return "$" + (n / 100).toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

  function renderCart() {
    if (!cartLinesEl) return;
    try { localStorage.setItem("volt-cart", JSON.stringify(cart)); } catch (e) {}
    if (cart.length === 0) {
      if (cartEmptyEl) cartEmptyEl.style.display = "";
      cartLinesEl.innerHTML = "";
    } else {
      if (cartEmptyEl) cartEmptyEl.style.display = "none";
      cartLinesEl.innerHTML = cart.map(function (item, i) {
        return '<div class="vm-cart-line">' +
          '<div class="vm-cart-line__img"><img src="' + item.img + '" alt="' + item.name + '"></div>' +
          '<div><h4>' + item.name + '</h4><div class="variant">' + item.variant + '</div>' +
          '<div class="vm-cart-line__qty"><button data-qty="down" data-idx="' + i + '" aria-label="Decrease">\u2212</button>' +
          '<span>' + item.qty + '</span><button data-qty="up" data-idx="' + i + '" aria-label="Increase">+</button></div></div>' +
          '<div style="display:flex;flex-direction:column;align-items:flex-end;gap:8px;">' +
          '<span class="price">' + money(item.price * item.qty) + '</span>' +
          '<button class="vm-cart-line__remove" data-remove="' + i + '" aria-label="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div></div>';
      }).join("");
    }
    var total = cart.reduce(function (s, it) { return s + it.price * it.qty; }, 0);
    var count = cart.reduce(function (s, it) { return s + it.qty; }, 0);
    if (cartCountEl) {
      cartCountEl.textContent = count;
      cartCountEl.classList.toggle("is-visible", count > 0);
    }
    document.querySelectorAll("[data-cart-total]").forEach(function (el) { el.textContent = money(total); });
    document.querySelectorAll("[data-cart-count-text]").forEach(function (el) { el.textContent = count + (count === 1 ? " item" : " items"); });
    if (shippingFill && shippingLabel) {
      var pct = Math.min(100, (total / FREE_SHIP) * 100);
      shippingFill.style.width = pct + "%";
      if (total >= FREE_SHIP) {
        shippingLabel.innerHTML = 'You\u2019ve unlocked <b>FREE Express Shipping</b> \u26A1';
      } else {
        shippingLabel.innerHTML = 'Add <b>' + money(FREE_SHIP - total) + '</b> more for free express shipping';
      }
    }
  }

  document.addEventListener("click", function (e) {
    var q = e.target.closest("[data-qty]");
    if (q) {
      var idx = +q.dataset.idx;
      if (q.dataset.qty === "up") cart[idx].qty++;
      else { cart[idx].qty--; if (cart[idx].qty < 1) cart.splice(idx, 1); }
      renderCart();
      renderCartPage();
    }
    var rm = e.target.closest("[data-remove]");
    if (rm) { cart.splice(+rm.dataset.remove, 1); renderCart(); renderCartPage(); }
  });

  function addToCart(btn) {
    var name = btn.dataset.name || "Volt X1 Pro";
    var price = +(btn.dataset.price || 129900);
    var img = btn.dataset.img || "assets/images/phones/volt-x1-pro.svg";
    var variant = btn.dataset.variant || "Titanium \u00B7 256 GB";
    var addQty = +(btn.dataset.qty || 1);
    var existing = cart.find(function (it) { return it.name === name && it.variant === variant; });
    if (existing) existing.qty += addQty;
    else cart.push({ name: name, price: price, img: img, variant: variant, qty: addQty });
    renderCart();
    renderCartPage();
    showToast(name + " added to cart");
    if (!cartDrawer || !cartDrawer.classList.contains("is-open")) {
      var bump = cartCountEl;
      if (bump) {
        bump.classList.add("is-visible");
        bump.style.transform = "scale(1.4)";
        setTimeout(function () { bump.style.transform = ""; }, 260);
      }
    }
  }

  document.querySelectorAll("[data-add-to-cart]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var q = document.querySelector(".vm-pdp .val");
      if (q && btn.closest(".vm-pdp__buy, .vm-buybar")) btn.dataset.qty = q.textContent;
      addToCart(btn);
    });
  });

  /* ---------- 7. Toast ---------- */
  var toast = document.querySelector(".vm-toast");
  var toastTimer = null;
  function showToast(msg) {
    if (!toast) return;
    toast.innerHTML = '<span class="ok">\u2713</span><span>' + msg + '</span>';
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 2600);
  }

  /* ---------- 8. Search simulation ---------- */
  var searchInput = document.querySelector(".vm-search input");
  var searchGrid = document.querySelector(".vm-search__grid");
  if (searchInput && searchGrid) {
    var searchItems = Array.prototype.slice.call(searchGrid.children);
    searchInput.addEventListener("input", function () {
      var q = searchInput.value.trim().toLowerCase();
      searchItems.forEach(function (card) {
        var text = card.textContent.toLowerCase();
        card.style.display = (!q || text.indexOf(q) !== -1) ? "" : "none";
      });
    });
  }

  /* ---------- 9. Collection filters ---------- */
  document.querySelectorAll(".vm-filter-chip").forEach(function (chip) {
    chip.addEventListener("click", function () {
      var wrap = chip.closest("[data-filter-group]");
      if (wrap) {
        wrap.querySelectorAll(".vm-filter-chip").forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        var f = chip.dataset.filter;
        document.querySelectorAll("[data-filter-item]").forEach(function (item) {
          var match = f === "all" || (item.dataset.filterItem || "").split(" ").indexOf(f) !== -1;
          item.style.display = match ? "" : "none";
        });
        var countEl = document.querySelector(".vm-toolbar__count");
        if (countEl) {
          var visible = Array.prototype.filter.call(document.querySelectorAll("[data-filter-item]"), function (i) { return i.style.display !== "none"; }).length;
          var label = countEl.dataset.countLabel || "products";
          if (label.indexOf(" ") === -1) label = " " + label;
          countEl.textContent = visible + label;
        }
      }
    });
  });

  /* ---------- 10. Qty steppers (PDP) ---------- */
  document.querySelectorAll(".vm-qty").forEach(function (qty) {
    var val = qty.querySelector(".val");
    var down = qty.querySelector("[data-step='down']");
    var up = qty.querySelector("[data-step='up']");
    function step(d) {
      var v = Math.max(1, (+val.textContent || 1) + d);
      val.textContent = v;
    }
    if (down) down.addEventListener("click", function () { step(-1); });
    if (up) up.addEventListener("click", function () { step(1); });
  });

  /* ---------- 11. PDP gallery + swipers ---------- */
  if (window.Swiper) {
    var mainEl = document.querySelector(".vm-gallery__main .swiper");
    var thumbsEl = document.querySelector(".vm-gallery__thumbs .swiper");
    if (mainEl && thumbsEl) {
      var galleryThumbs = new Swiper(thumbsEl, {
        slidesPerView: 4,
        spaceBetween: 12,
        watchSlidesProgress: true
      });
      new Swiper(mainEl, {
        slidesPerView: 1,
        spaceBetween: 0,
        loop: true,
        navigation: { nextEl: ".vm-gallery .swiper-button-next", prevEl: ".vm-gallery .swiper-button-prev" },
        thumbs: { swiper: galleryThumbs }
      });
    }
    document.querySelectorAll("[data-cards-swiper]").forEach(function (el) {
      new Swiper(el, {
        slidesPerView: 1,
        spaceBetween: 18,
        breakpoints: { 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }
      });
    });
  }

  /* ---------- 12. Sticky buy bar (PDP mobile) ---------- */
  var buyBar = document.querySelector(".vm-buybar");
  if (buyBar) {
    var pdpTop = document.querySelector(".vm-pdp");
    var added = false;
    window.addEventListener("scroll", function () {
      if (!pdpTop) return;
      var rect = pdpTop.getBoundingClientRect();
      var past = rect.bottom < window.innerHeight * 0.75 && !added;
      if (past) { buyBar.classList.add("is-visible"); added = true; }
      else if (!past && added && window.scrollY < 200) { buyBar.classList.remove("is-visible"); added = false; }
    }, { passive: true });
    var buyBtn = buyBar.querySelector("[data-add-to-cart]");
    if (buyBtn) buyBtn.addEventListener("click", function () { addToCart(buyBtn); });
  }

  /* ---------- 13. Stat counters ---------- */
  if (gsap && window.ScrollTrigger && !prefersReduced) {
    document.querySelectorAll("[data-count]").forEach(function (wrap) {
      wrap.querySelectorAll("[data-count-target]").forEach(function (el) {
        var target = +el.dataset.countTarget || 0;
        gsap.fromTo(el, { textContent: 0 }, {
          textContent: target,
          duration: 1.6,
          ease: "power2.out",
          snap: { textContent: 1 },
          scrollTrigger: { trigger: el, start: "top 90%", once: true }
        });
      });
    });
  }

  /* ---------- 14. PDP option selectors ---------- */
  document.querySelectorAll("[data-swatch-group]").forEach(function (group) {
    var valueEl = document.querySelector('[data-option-value="color"]');
    group.querySelectorAll("[data-swatch]").forEach(function (sw) {
      sw.addEventListener("click", function () {
        group.querySelectorAll("[data-swatch]").forEach(function (s) { s.classList.remove("is-active"); });
        sw.classList.add("is-active");
        if (valueEl) valueEl.textContent = sw.dataset.swatch;
      });
    });
  });
  document.querySelectorAll("[data-chip-group]").forEach(function (group) {
    var valueEl = document.querySelector('[data-option-value="storage"]');
    group.querySelectorAll("[data-option]").forEach(function (chip) {
      chip.addEventListener("click", function () {
        group.querySelectorAll("[data-option]").forEach(function (c) { c.classList.remove("is-active"); });
        chip.classList.add("is-active");
        if (valueEl) valueEl.textContent = chip.dataset.option;
      });
    });
  });

  /* ---------- 15. Buy now ---------- */
  document.querySelectorAll("[data-buy-now]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      addToCart(btn);
      setTimeout(openCart, 160);
    });
  });

  /* ---------- 16. Cart page ---------- */
  var promoApplied = false;
  var cartPageItems = document.querySelector("[data-cart-page-items]");
  var cartPageEmpty = document.querySelector("[data-cart-page-empty]");
  var cartPageClear = document.querySelector("[data-cart-clear]");

  function lineMarkup(item, i) {
    return '<div class="vm-cart-page__item">' +
      '<div class="vm-cart-page__img"><img src="' + item.img + '" alt="' + item.name + '"></div>' +
      '<div class="vm-cart-page__info"><h4>' + item.name + '</h4>' +
      '<div class="variant">' + item.variant + '</div>' +
      '<div class="vm-cart-line__qty"><button data-qty="down" data-idx="' + i + '" aria-label="Decrease">\u2212</button>' +
      '<span>' + item.qty + '</span><button data-qty="up" data-idx="' + i + '" aria-label="Increase">+</button></div></div>' +
      '<div class="vm-cart-page__side"><span class="price">' + money(item.price * item.qty) + '</span>' +
      '<button class="vm-cart-line__remove" data-remove="' + i + '" aria-label="Remove"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18M6 6l12 12"/></svg></button></div></div>';
  }

  function subtotal() {
    var base = cart.reduce(function (s, it) { return s + it.price * it.qty; }, 0);
    return promoApplied ? Math.round(base * 0.9) : base;
  }

  function renderCartPage() {
    if (!cartPageItems) return;
    if (cart.length === 0) {
      if (cartPageEmpty) cartPageEmpty.style.display = "";
      cartPageItems.innerHTML = "";
      if (cartPageClear) cartPageClear.style.display = "none";
    } else {
      if (cartPageEmpty) cartPageEmpty.style.display = "none";
      if (cartPageClear) cartPageClear.style.display = "";
      cartPageItems.innerHTML = cart.map(lineMarkup).join("");
    }
    var total = subtotal();
    document.querySelectorAll("[data-cart-subtotal]").forEach(function (el) { el.textContent = money(total); });
    document.querySelectorAll("[data-cart-shipping]").forEach(function (el) {
      el.textContent = cart.length === 0 ? "Calculated at checkout" : (total >= FREE_SHIP ? "Free express" : "$9.00");
    });
    var discountRow = document.querySelector(".vm-summary-row--discount");
    if (discountRow) discountRow.style.display = promoApplied && cart.length > 0 ? "" : "none";
    var totalRow = document.querySelector("[data-cart-total]");
    if (totalRow) totalRow.textContent = money(total + (cart.length && total < FREE_SHIP ? 900 : 0));
  }

  var promoInput = document.querySelector("[data-promo-input]");
  var promoApply = document.querySelector("[data-promo-apply]");
  function applyPromo() {
    if (!promoInput) return;
    var code = promoInput.value.trim().toLowerCase();
    if (code === "volt10") {
      promoApplied = true;
      renderCart();
      renderCartPage();
      showToast("Code VOLT10 applied \u2014 10% off");
    } else {
      promoApplied = false;
      renderCart();
      renderCartPage();
      showToast("That code isn\u2019t valid. Try VOLT10.");
    }
  }
  if (promoApply) promoApply.addEventListener("click", applyPromo);
  if (promoInput) promoInput.addEventListener("keydown", function (e) { if (e.key === "Enter") applyPromo(); });

  if (cartPageClear) cartPageClear.addEventListener("click", function () {
    cart = [];
    renderCart();
    showToast("Cart cleared");
  });

  document.querySelectorAll("[data-checkout]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (cart.length === 0) { showToast("Your cart is empty"); return; }
      showToast("Demo checkout \u2014 connects to Shopify at launch");
    });
  });

  /* ---------- 17. Contact form ---------- */
  document.querySelectorAll("[data-phantom-form]").forEach(function (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      form.reset();
      showToast("Message sent \u2014 we reply within one business day");
    });
  });

  /* ---------- 18. Init cart render ---------- */
  renderCart();
  renderCartPage();
})();