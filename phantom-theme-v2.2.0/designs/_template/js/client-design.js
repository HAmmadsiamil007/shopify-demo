/**
 * ClientDesign — PHANTOM external-frontend integration lifecycle shell
 * ====================================================================
 * Task 02 scaffold (blueprint: 2026-08-16-phantom-external-integration-blueprint.md).
 * Contract: designs/contracts/css-namespace-contract.md (§2 JavaScript Lifecycle Contract).
 *
 * TEMPLATE. On activation of a client design:
 *   1. Copy to assets/client-{slug}.js
 *   2. Replace {slug} below and set LIBRARIES to the design's vendor bundle
 *   3. Register in snippets/theme-import-map.liquid (ui-* precedent)
 *
 * Public API (mandatory): init() / destroy() / refresh()
 * Registry: window.ClientDesign (single global entry)
 *
 * Zero visual change: this file is never loaded by the default theme.
 */
(function () {
  'use strict'

  const SLUG = '{slug}'

  // Lazy-load maps for optional libraries (design's vendor bundle).
  // Remove entries the design does not use — never load libraries
  // that are not required (performance contract §12).
  const LIBRARIES = {
    gsap: () => import(/* @vite-ignore */ '/assets/vendor-' + SLUG + '.js'),
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
      this.sections = new Map() // sectionId -> section controller
      this.swipers = new Map() // sectionId -> swiper instance
      this.lenis = null
      this.abort = new AbortController()
      this._bound = {
        onSectionLoad: this._onSectionLoad.bind(this),
        onSectionUnload: this._onSectionUnload.bind(this),
        onSectionSelect: this._onSectionSelect.bind(this),
        onSectionDeselect: this._onSectionDeselect.bind(this),
        onCartUpdated: this._onCartUpdated.bind(this)
      }
    }

    /* ---------------------------------------------------------- lifecycle */

    init() {
      if (this.initialized) return this
      this.scope = this.root.querySelector('.ph-client--' + this.slug) || this.root.body || this.root
      if (this.scope === this.root.body) {
        // design not active on this page — stay inert
        return this
      }

      this._bindLifecycle()
      this._initLenis()
      this._registerSections(this.scope.querySelectorAll(SECTION_SELECTOR))
      this.initialized = true
      this.root.dispatchEvent(new CustomEvent('client-design:init', { detail: { slug: this.slug } }))
      return this
    }

    destroy() {
      if (!this.initialized) return this
      this._unbindLifecycle()
      this._unregisterSections(this.scope.querySelectorAll(SECTION_SELECTOR))
      this._destroyLenis()
      this.abort.abort()
      this.abort = new AbortController()
      this.initialized = false
      this.root.dispatchEvent(new CustomEvent('client-design:destroy', { detail: { slug: this.slug } }))
      return this
    }

    /** Re-scan a section (or whole scope) after Shopify injects/replaces DOM. */
    refresh(container) {
      const ctx = container || this.scope
      if (!ctx) return this
      this._registerSections(ctx.querySelectorAll(SECTION_SELECTOR))
      return this
    }

    /* ------------------------------------------------------- section mgmt */

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
        this._destroySwiper(id)
      })
    }

    _initSection(el) {
      // Replace with design-specific section controllers. Every controller
      // MUST implement destroy(). Create GSAP timelines inside gsap.context
      // bound to `el` so teardown is automatic (contract §2.3).
      return { destroy: () => {} }
    }

    /* --------------------------------------------------------- lifecycle */

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
      // AbortController removes every listener registered with { signal }
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

    _onCartUpdated(e) {
      // Update cart badges/counts from e.detail (PHANTOM's cart system owns
      // the data; the client design owns only its presentation of it).
    }

    /* ---------------------------------------------------- library mgmt */

    _initLenis() {
      if (!this.libraries.lenis || this.lenis) return
      this.libraries.lenis().then(({ default: Lenis }) => {
        if (this.destroyed) return
        this.lenis = new Lenis({ autoRaf: true })
        if (this.paused) this.lenis.stop()
      })
    }

    _destroyLenis() {
      if (this.lenis) {
        this.lenis.destroy()
        this.lenis = null
      }
    }

    _initSwiper(el, options) {
      if (!this.libraries.swiper) return
      const id = el.dataset.sectionId || el.id
      this.libraries.swiper().then(({ default: Swiper }) => {
        if (this.swipers.has(id)) return // never double-create
        this.swipers.set(id, new Swiper(el, options))
      })
    }

    _destroySwiper(id) {
      const sw = this.swipers.get(id)
      if (sw) {
        sw.destroy(true, true)
        this.swipers.delete(id)
      }
    }

    /** Lazy 3D loader: WebGL-capable, active design, not reduced-motion only. */
    loadThree(sectionEl, createScene) {
      if (!this.libraries.three) return Promise.resolve(null)
      if (this._reducedMotion() || !this._webglAvailable()) return Promise.resolve(null)
      return this.libraries.three().then(({ default: THREE }) => createScene(THREE, sectionEl))
    }

    pauseAll() {
      this.lenis && this.lenis.stop()
      // design-specific: pause GSAP timelines, swiper autoplay, RAF loops
    }

    resumeAll() {
      this.lenis && this.lenis.start()
    }

    /* ---------------------------------------------------------- helpers */

    _reducedMotion() {
      return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }

    _webglAvailable() {
      try {
        const c = document.createElement('canvas')
        return !!(c.getContext('webgl') || c.getContext('experimental-webgl'))
      } catch (e) {
        return false
      }
    }
  }

  /* ------------------------------------------------------------ registry */

  if (!window.ClientDesign) {
    window.ClientDesign = ClientDesign
    window.__clientDesignRegistry = window.__clientDesignRegistry || new Map()
  }

  // Boot on PHANTOM's own ready event (never DOMContentLoaded alone).
  window.addEventListener(EVENTS.themeReady, () => {
    if (!window.__clientDesignRegistry.has(SLUG)) {
      const instance = new ClientDesign()
      window.__clientDesignRegistry.set(SLUG, instance)
      instance.init()
    }
  }, { once: true })
})()