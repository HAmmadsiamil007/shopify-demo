/* AETHER product section module (Task 8).
 *
 * Section-local module script (PHANTOM quiz.js pattern): self-initializes on
 * its own section scope when the runtime controller calls AetherProduct.init.
 * All interactivity for `sections/aether-product.liquid`:
 *   - gallery swipers (main fade + thumbs) + magnify lens (desktop only)
 *   - generic variant engine (option-position matching, amendment 5)
 *   - quantity stepper (1-10) synced to the form.product quantity input
 *   - sticky add-to-cart bar (IntersectionObserver on the main ATC button)
 *   - specs accordion + size guide modal
 *   - related products swiper
 * Cleanup contract: destroy(root) removes every listener/observer/swiper and
 * clears the init flag (editor section refresh re-runs init). */
(function () {
  'use strict'

  var entries = [] // [{ root, state }]

  function formatMoney(cents) {
    if (window.theme && theme.Currency && typeof theme.Currency.formatMoney === 'function') {
      return theme.Currency.formatMoney(cents, theme.settings.moneyFormat)
    }
    if (window.Shopify && typeof Shopify.formatMoney === 'function') {
      return Shopify.formatMoney(cents, Shopify.money_format || '{{amount}}')
    }
    return '$' + (cents / 100).toFixed(2)
  }

  function entryFor(root) {
    for (var i = 0; i < entries.length; i++) {
      if (entries[i].root === root) return entries[i]
    }
    return null
  }

  function on(st, target, type, fn, opts) {
    st.listeners.push({ target: target, type: type, fn: fn, opts: opts })
    target.addEventListener(type, fn, opts)
  }

  function init(root) {
    if (!root || root.dataset.aetherProductInit === '1') return
    root.dataset.aetherProductInit = '1'

    var st = {
      swiperMain: null,
      swiperThumbs: null,
      swiperRelated: null,
      observer: null,
      listeners: [],
      variants: [],
      current: null,
      sizeOption: -1,
      gallery: null,
      lens: null,
      lensFrame: null,
      lensHover: false,
      zoomOn: false,
      closeModal: null,
      onKeydown: null
    }
    entries.push({ root: root, state: st })

    var vJson = root.querySelector('[data-aether-variant-json]')
    var cJson = root.querySelector('[data-aether-current-variant-json]')
    try {
      st.variants = vJson ? JSON.parse(vJson.textContent) : []
      st.current = cJson ? JSON.parse(cJson.textContent) : null
    } catch (e) {
      st.variants = []
      st.current = null
    }
    st.sizeOption = parseInt(root.getAttribute('data-aether-size-option') || '-1', 10)

    bindSwiper(root, st)
    bindLens(root, st)
    bindVariants(root, st)
    bindQty(root, st)
    bindSticky(root, st)
    bindAccordion(root, st)
    bindModal(root, st)
  }

  function destroy(root) {
    var entry = entryFor(root)
    if (!entry) return
    var st = entry.state
    var i = entries.indexOf(entry)
    if (i >= 0) entries.splice(i, 1)

    if (st.swiperMain) st.swiperMain.destroy(true, true)
    if (st.swiperThumbs) st.swiperThumbs.destroy(true, true)
    if (st.swiperRelated) st.swiperRelated.destroy(true, true)
    if (st.observer) st.observer.disconnect()
    if (st.lens) st.lens.remove()
    if (st.lensFrame) cancelAnimationFrame(st.lensFrame)
    if (st.onKeydown) document.removeEventListener('keydown', st.onKeydown)
    if (st.closeModal) st.closeModal()
    st.listeners.forEach(function (l) {
      l.target.removeEventListener(l.type, l.fn, l.opts)
    })
    delete root.dataset.aetherProductInit
  }

  /* ── 8B Gallery ───────────────────────────────────────────────────────── */

  function bindSwiper(root, st) {
    var mainEl = root.querySelector('[data-aether-gallery-main]')
    var thumbsEl = root.querySelector('[data-aether-gallery-thumbs]')
    var relatedEl = root.querySelector('[data-aether-related-swiper]')
    var any = mainEl || relatedEl

    function boot() {
      if (!window.Swiper) {
        if (any) window.addEventListener('load', boot, { once: true })
        return
      }
      if (mainEl && !st.swiperMain) {
        var thumbs = null
        if (thumbsEl) {
          thumbs = new Swiper(thumbsEl, {
            spaceBetween: 12,
            slidesPerView: 4,
            freeMode: true,
            watchSlidesProgress: true
          })
        }
        st.swiperThumbs = thumbs
        st.swiperMain = new Swiper(mainEl, {
          thumbs: thumbs ? { swiper: thumbs } : undefined,
          effect: 'fade',
          fadeEffect: { crossFade: true }
        })
      }
      if (relatedEl && !st.swiperRelated) {
        st.swiperRelated = new Swiper(relatedEl, {
          slidesPerView: 1.2,
          spaceBetween: 20,
          breakpoints: {
            576: { slidesPerView: 2 },
            992: { slidesPerView: 3.2 }
          }
        })
      }
    }
    boot()
  }

  function ensureLens(st) {
    if (!st.lens && st.gallery) {
      var lens = document.createElement('div')
      lens.className = 'magnify-lens'
      st.gallery.appendChild(lens)
      st.lens = lens
    }
    return st.lens
  }

  function placeLens(st, e) {
    if (!st.gallery || !st.lens) return
    var rect = st.gallery.getBoundingClientRect()
    var zoom = 2.5
    var lensW = 120
    var lensH = 120
    var x = e.clientX - rect.left
    var y = e.clientY - rect.top
    st.lens.style.left = x - lensW / 2 + 'px'
    st.lens.style.top = y - lensH / 2 + 'px'
    var img = st.gallery.querySelector('.swiper-slide-active img')
    if (!img) return
    st.lens.style.backgroundImage = 'url(' + img.currentSrc || img.src + ')'
    st.lens.style.backgroundSize = rect.width * zoom + 'px ' + rect.height * zoom + 'px'
    st.lens.style.backgroundPosition = (x / rect.width) * 100 + '% ' + (y / rect.height) * 100 + '%'
  }

  function bindLens(root, st) {
    var gallery = root.querySelector('[data-aether-zoom]')
    if (!gallery) return
    st.gallery = gallery
    if (!window.matchMedia('(min-width: 768px)').matches) return

    st.lensMove = function (e) {
      if (!st.lens) return
      if (st.lensFrame) cancelAnimationFrame(st.lensFrame)
      st.lensFrame = requestAnimationFrame(function () { placeLens(st, e) })
    }
    st.lensEnter = function () {
      st.lensHover = true
      if (st.zoomOn) return
      var lens = ensureLens(st)
      if (lens) lens.style.display = 'block'
    }
    st.lensLeave = function () {
      st.lensHover = false
      if (st.zoomOn) return
      if (st.lens) st.lens.style.display = 'none'
    }
    on(st, gallery, 'mouseenter', st.lensEnter)
    on(st, gallery, 'mouseleave', st.lensLeave)
    on(st, gallery, 'mousemove', st.lensMove)

    var toggle = root.querySelector('[data-aether-zoom-toggle]')
    if (toggle) {
      st.zoomToggle = function () {
        st.zoomOn = !st.zoomOn
        toggle.setAttribute('aria-pressed', st.zoomOn ? 'true' : 'false')
        gallery.classList.toggle('pd-gallery-zoom-mode', st.zoomOn)
        var lens = ensureLens(st)
        if (lens) lens.style.display = st.zoomOn || st.lensHover ? 'block' : 'none'
      }
      on(st, toggle, 'click', st.zoomToggle)
    }
  }

  /* ── 8C Variant engine (generic, option-position matching) ─────────────── */

  function matchesSelection(variant, selection) {
    var opts = variant.options || []
    for (var k in selection) {
      if (opts[parseInt(k, 10)] !== selection[k]) return false
    }
    return true
  }

  function applyVariant(root, st, variant) {
    var priceEl = root.querySelector('[data-aether-price]')
    var compareEl = root.querySelector('[data-aether-compare-at]')
    var atcPrice = root.querySelector('[data-aether-atc-price]')
    var atcLabel = root.querySelector('[data-aether-atc-label]')
    var atc = root.querySelector('[data-aether-atc]')
    var stickyAtc = root.querySelector('[data-aether-sticky-atc]')
    var qtyValue = root.querySelector('[data-aether-qty-value]')
    var qtyInput = root.querySelector('[data-aether-qty-input]')
    var available = !!variant.available
    var money = formatMoney(variant.price || 0)

    if (priceEl) priceEl.textContent = money
    if (compareEl) {
      if (variant.compare_at_price > variant.price) {
        compareEl.textContent = formatMoney(variant.compare_at_price)
        compareEl.style.display = ''
      } else {
        compareEl.style.display = 'none'
      }
    }
    if (atcPrice) atcPrice.textContent = money
    if (atc) {
      atc.disabled = !available
      if (atcLabel) {
        atcLabel.textContent = available
          ? root.getAttribute('data-aether-add-text')
          : root.getAttribute('data-aether-soldout-text')
      }
    }
    if (stickyAtc) stickyAtc.disabled = !available

    var cJson = root.querySelector('[data-aether-current-variant-json]')
    if (cJson) cJson.textContent = JSON.stringify(variant)
    var idInput = root.querySelector('product-form input[name="id"]')
    if (idInput) idInput.value = variant.id

    root.querySelectorAll('[data-aether-option-group]').forEach(function (group) {
      var idx = parseInt(group.getAttribute('data-aether-option-index'), 10)
      group.querySelectorAll('[data-aether-value]').forEach(function (btn) {
        btn.classList.toggle('active', btn.getAttribute('data-aether-value') === variant.options[idx])
      })
      var label = group.querySelector('[data-aether-option-value]')
      if (label && variant.options[idx]) label.textContent = variant.options[idx]
    })

    if (st.swiperMain && variant.featured_media && variant.featured_media.position) {
      st.swiperMain.slideTo(variant.featured_media.position - 1, 300)
    }

    var stickySelect = root.querySelector('[data-aether-sticky-size]')
    if (stickySelect && st.sizeOption >= 0) {
      stickySelect.value = variant.options[st.sizeOption] || ''
    }
    var stickyName = root.querySelector('[data-aether-sticky-name]')
    if (stickyName) {
      var title = root.getAttribute('data-aether-product-title') || ''
      var variantTitle = variant.title || ''
      stickyName.textContent = variantTitle && variantTitle !== title
        ? title + ' — ' + variantTitle
        : title
    }
    var stickyPrice = root.querySelector('[data-aether-sticky-price]')
    if (stickyPrice) stickyPrice.textContent = money
    var stickyImg = root.querySelector('[data-aether-sticky-img]')
    if (stickyImg && variant.featured_media && variant.featured_media.preview_image) {
      stickyImg.src = variant.featured_media.preview_image.src
    }

    if (qtyValue) qtyValue.textContent = '1'
    if (qtyInput) qtyInput.value = '1'

    root.dispatchEvent(new CustomEvent('variant:change', { detail: { variant: variant } }))
  }

  function selectVariant(root, st, selection) {
    var variant = null
    st.variants.forEach(function (v) {
      if (!variant && matchesSelection(v, selection)) variant = v
    })
    if (!variant) return
    st.current = variant
    applyVariant(root, st, variant)
  }

  function bindVariants(root, st) {
    var selection = {}
    if (st.current && st.current.options) {
      st.current.options.forEach(function (value, i) {
        selection[i] = value
      })
    }
    root.querySelectorAll('[data-aether-option-group]').forEach(function (group) {
      var index = parseInt(group.getAttribute('data-aether-option-index'), 10)
      on(st, group, 'click', function (e) {
        var btn = e.target.closest('[data-aether-value]')
        if (!btn) return
        selection[index] = btn.getAttribute('data-aether-value')
        selectVariant(root, st, selection)
      })
    })
    var stickySelect = root.querySelector('[data-aether-sticky-size]')
    if (stickySelect && st.sizeOption >= 0) {
      on(st, stickySelect, 'change', function () {
        selection[st.sizeOption] = stickySelect.value
        selectVariant(root, st, selection)
      })
    }
  }

  /* ── 8D Quantity + cart ────────────────────────────────────────────────── */

  function bindQty(root, st) {
    var valueEl = root.querySelector('[data-aether-qty-value]')
    if (!valueEl) return
    var input = root.querySelector('[data-aether-qty-input]')
    root.querySelectorAll('[data-aether-qty-btn]').forEach(function (btn) {
      on(st, btn, 'click', function () {
        var step = parseInt(btn.getAttribute('data-aether-qty-btn'), 10)
        var v = parseInt(valueEl.textContent, 10) || 1
        v = Math.min(10, Math.max(1, v + step))
        valueEl.textContent = String(v)
        if (input) input.value = String(v)
      })
    })
  }

  /* ── 8E Sticky bar ─────────────────────────────────────────────────────── */

  function bindSticky(root, st) {
    var bar = root.querySelector('[data-aether-sticky-bar]')
    var atc = root.querySelector('[data-aether-atc]')
    if (bar && atc && 'IntersectionObserver' in window) {
      st.observer = new IntersectionObserver(function (entriesList) {
        entriesList.forEach(function (entry) {
          bar.classList.toggle('visible', !entry.isIntersecting)
        })
      }, { threshold: 0 })
      st.observer.observe(atc)
    }
    var stickyAtc = root.querySelector('[data-aether-sticky-atc]')
    if (stickyAtc && atc) {
      on(st, stickyAtc, 'click', function () { atc.click() })
    }
  }

  /* ── 8F Accordion + modal ──────────────────────────────────────────────── */

  function bindAccordion(root, st) {
    var container = root.querySelector('[data-aether-accordion]')
    if (!container) return
    var items = Array.prototype.slice.call(container.querySelectorAll('.pd-accordion-item'))
    items.forEach(function (item) {
      var header = item.querySelector('.pd-accordion-header')
      var body = item.querySelector('.pd-accordion-body')
      on(st, header, 'click', function () {
        var isActive = item.classList.contains('active')
        items.forEach(function (i) {
          i.classList.remove('active')
          var b = i.querySelector('.pd-accordion-body')
          if (b) b.style.maxHeight = null
          var h = i.querySelector('.pd-accordion-header')
          if (h) h.setAttribute('aria-expanded', 'false')
        })
        if (!isActive && body) {
          item.classList.add('active')
          body.style.maxHeight = body.scrollHeight + 'px'
          header.setAttribute('aria-expanded', 'true')
        }
      })
    })
  }

  function bindModal(root, st) {
    var overlay = root.querySelector('[data-aether-size-modal]')
    if (!overlay) return
    var closeBtn = root.querySelector('[data-aether-close-size-guide]')
    var open = function () {
      overlay.classList.add('open')
      document.body.style.overflow = 'hidden'
    }
    var close = function () {
      overlay.classList.remove('open')
      document.body.style.overflow = ''
    }
    root.querySelectorAll('[data-aether-open-size-guide]').forEach(function (trigger) {
      on(st, trigger, 'click', function (e) {
        e.preventDefault()
        open()
      })
    })
    if (closeBtn) on(st, closeBtn, 'click', close)
    on(st, overlay, 'click', function (e) {
      if (e.target === overlay) close()
    })
    st.onKeydown = function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) close()
    }
    document.addEventListener('keydown', st.onKeydown)
    st.closeModal = close
  }

  window.AetherProduct = {
    init: init,
    destroy: destroy,
    refresh: function (root) {
      destroy(root)
      init(root)
    }
  }
})()
