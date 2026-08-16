/**
 * ClientDesign — PHANTOM external-frontend integration (design: demo)
 * ====================================================================
 * Task 03 demo activation walkthrough (spec:
 * docs/superpowers/specs/2026-08-16-phantom-task03-design-activation-design.md).
 * Contract: designs/contracts/css-namespace-contract.md (§2).
 *
 * Public API (mandatory): init() / destroy() / refresh()
 * Registry: window.ClientDesign + window.__clientDesignRegistry
 *
 * Zero visual change: this file is only loaded when ph_active_design = demo.
 * No vendor libraries (demo); the vendor-{slug} slot stays documented.
 *
 * Lifecycle scope note: Task 03 proves the init/destroy/refresh contract with
 * a native IntersectionObserver implementation only. Vendor-library lifecycle
 * integration (GSAP/Swiper/Lenis/Three) is exercised in Task 04+; the
 * destroy() API above is shaped so those libraries can be torn down cleanly.
 */
(function () {
  'use strict'

  const SLUG = 'demo'

  const LIBRARIES = {
    gsap: null,
    lenis: null,
    swiper: null,
    three: null
  }

  const EVENTS = {
    themeReady: 'phantom:ready',
    sectionLoad: 'shopify:section:load',
    sectionUnload: 'shopify:section:unload',
    sectionSelect: 'shopify:section:select',
    sectionDeselect: 'shopify:section:deselect',
    cartUpdated: 'cart:updated'
  }

  const SECTION_SELECTOR = '[data-section-type], [data-section-id]'

  class ClientDesign {
    constructor({ slug = SLUG, root = document, libraries = LIBRARIES } = {}) {
      this.slug = slug
      this.root = root
      this.libraries = libraries
      this.scope = null
      this.initialized = false
      this.paused = false
      this.sections = new Map()
      this.abort = new AbortController()
      this._bound = {
        onSectionLoad: this._onSectionLoad.bind(this),
        onSectionUnload: this._onSectionUnload.bind(this),
        onSectionSelect: this._onSectionSelect.bind(this),
        onSectionDeselect: this._onSectionDeselect.bind(this),
        onCartUpdated: this._onCartUpdated.bind(this)
      }
    }

    init() {
      if (this.initialized) return this
      this.scope = this.root.querySelector('.ph-client--' + this.slug) || this.root.body || this.root
      if (this.scope === this.root.body) return this

      this._bindLifecycle()
      this._registerSections(this.scope.querySelectorAll(SECTION_SELECTOR))
      this.initialized = true
      this.root.dispatchEvent(new CustomEvent('client-design:init', { detail: { slug: this.slug } }))
      return this
    }

    destroy() {
      if (!this.initialized) return this
      this._unbindLifecycle()
      this._unregisterSections(this.scope.querySelectorAll(SECTION_SELECTOR))
      this.abort.abort()
      this.abort = new AbortController()
      this.initialized = false
      this.root.dispatchEvent(new CustomEvent('client-design:destroy', { detail: { slug: this.slug } }))
      return this
    }

    refresh(container) {
      const ctx = container || this.scope
      if (!ctx) return this
      this._registerSections(ctx.querySelectorAll(SECTION_SELECTOR))
      return this
    }

    _registerSections(list) {
      list.forEach((el) => {
        const id = el.dataset.sectionId || el.dataset.sectionType || el.id
        if (!id || this.sections.has(id)) return
        const controller = this._initSection(el)
        if (controller) this.sections.set(id, controller)
      })
    }

    _unregisterSections(list) {
      list.forEach((el) => {
        const id = el.dataset.sectionId || el.dataset.sectionType || el.id
        if (!id) return
        const ctrl = this.sections.get(id)
        if (ctrl) {
          ctrl.destroy()
          this.sections.delete(id)
        }
      })
    }

    _initSection(el) {
      const targets = Array.from(el.querySelectorAll('.ph-client__reveal'))
      if (!targets.length) return null
      if (this._reducedMotion()) {
        targets.forEach((t) => t.classList.add('is-visible'))
        return null
      }
      const io = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            io.unobserve(entry.target)
          }
        })
      }, { threshold: 0.15 })
      targets.forEach((t) => io.observe(t))
      return {
        destroy() {
          io.disconnect()
        }
      }
    }

    _bindLifecycle() {
      const { signal } = this.abort
      this.root.addEventListener(EVENTS.themeReady, () => this.initialized || this.init(), { signal })
      this.root.addEventListener(EVENTS.sectionLoad, this._bound.onSectionLoad, { signal })
      this.root.addEventListener(EVENTS.sectionUnload, this._bound.onSectionUnload, { signal })
      this.root.addEventListener(EVENTS.sectionSelect, this._bound.onSectionSelect, { signal })
      this.root.addEventListener(EVENTS.sectionDeselect, this._bound.onSectionDeselect, { signal })
      this.root.addEventListener(EVENTS.cartUpdated, this._bound.onCartUpdated, { signal })
    }

    _unbindLifecycle() {
      // No explicit work: every listener in _bindLifecycle is bound with
      // { signal: this.abort.signal }. destroy() calls this.abort.abort(),
      // which removes all of them atomically — so this method stays a
      // documented no-op. Library-specific teardown (GSAP contexts, Swiper
      // instances, Lenis) lands here in Task 04+.
    }

    _onSectionLoad(e) {
      const el = e.target && e.target.closest ? e.target.closest(SECTION_SELECTOR) || e.target : e.target
      this.refresh(el)
    }

    _onSectionUnload(e) {
      const el = e.target && e.target.closest ? e.target.closest(SECTION_SELECTOR) || e.target : e.target
      this._unregisterSections([el])
    }

    _onSectionSelect() {
      this.paused = true
      this.pauseAll()
    }

    _onSectionDeselect() {
      this.paused = false
      this.resumeAll()
    }

    _onCartUpdated() {
      // Demo has no cart UI; PHANTOM owns cart data and its own badges.
    }

    pauseAll() {}

    resumeAll() {}

    _reducedMotion() {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }
  }

  if (!window.ClientDesign) {
    window.ClientDesign = ClientDesign
    window.__clientDesignRegistry = window.__clientDesignRegistry || new Map()
  }

  window.addEventListener(EVENTS.themeReady, () => {
    if (!window.__clientDesignRegistry.has(SLUG)) {
      const instance = new ClientDesign()
      window.__clientDesignRegistry.set(SLUG, instance)
      instance.init()
    }
  }, { once: true })
})()