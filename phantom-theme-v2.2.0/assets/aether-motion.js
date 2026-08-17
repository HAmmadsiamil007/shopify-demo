/**
 * AETHER — Motion system (port of frozen `frontend/frontend/assets/js/animations.js` v4.0)
 * =====================================================================================
 * SINGLE MODULE CONTRACT (see Wave 1 Task 1 Step 3):
 *   - aether.js.liquid is the ONLY file that loads this module. It exposes exactly one
 *     global API: `window.AetherMotion` (module singleton, idempotent).
 *   - Controllers and aether-product.js consume ONLY `window.AetherMotion` — no direct
 *     imports of this module anywhere else; aether-product.js waits for phantom:ready /
 *     window.AetherMotion presence before any motion work.
 *   - Depends on vendored globals `window.gsap` + `window.ScrollTrigger` (aether-gsap.min.js,
 *     loaded on demand by the runtime) and `window.Lenis` (aether-lenis.min.js).
 *
 * Attribute mapping (frozen -> AETHER): data-motion-text -> data-aether-motion-text,
 * data-reveal -> data-aether-reveal, data-reveal-delay -> data-aether-reveal-delay,
 * data-reveal-group/item -> data-aether-reveal-group/item, data-image-reveal ->
 * data-aether-image-reveal, data-magnetic -> data-aether-magnetic, data-parallax ->
 * data-aether-parallax (+ data-aether-parallax-speed), data-tilt -> data-aether-tilt
 * (+ data-aether-tilt-scale/-speed), data-image-zoom -> data-aether-image-zoom,
 * data-countup -> data-aether-countup (+ -suffix/-prefix/-decimals),
 * data-scrub-horizontal/-track/-wrap -> data-aether-scrub-*, data-sticky-pin ->
 * data-aether-sticky-pin, data-parallax-layer -> data-aether-parallax-layer.
 * Class mapping: frozen classes (section-header/label/title/subtitle, product-card,
 * btn-primary/btn-outline/btn-lg/section-cta -> .aether-btn, pd-info, pd-gallery-main,
 * pd-accordion-item, pd-review-card, pd-specs, pd-related, hero-slider/slide/*, footer*,
 * pd-bar-fill -> .aether-bar-fill, category-card, review-card, faq-item, etc.) -> .aether-*.
 *
 * Deviations (recorded in Wave 1 deviations log):
 *   - D10: page-level snap scrolling (animations.js initPageSnap) NOT ported — conflicts
 *     with Lenis + Shopify scroll; reveal/parallax/motion preserved.
 *   - Legacy `.reveal-*` classes (.reveal-right-premium etc.) NOT ported — WordPress-era
 *     hooks on frozen-only markup; AETHER markup uses data-aether-reveal + auto-assign.
 *
 * Event contract: hero entrance animates on CustomEvent `aetherHeroAnimate`
 * with `detail.index` (dispatched by the aether-hero controller, Task 4).
 * Guards: prefers-reduced-motion / html[data-aether-motion="0"] (set by aether.js boot
 * from _motionEnabled()) / body[data-disable-animations="true"] / Shopify.designMode.
 */
export const AetherMotion = (() => {
  'use strict'

  const registry = new WeakMap()
  let paused = false
  let lenisInstance = null

  const motionDisabled = () =>
    window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
    document.documentElement.dataset.aetherMotion === '0' ||
    (document.body && document.body.dataset.disableAnimations === 'true') ||
    (window.Shopify && window.Shopify.designMode)

  // ═══════════════════════════════════════════════════════════════
  // PREMIUM REVEAL PRESETS — Left/Right directional entrances
  // ═══════════════════════════════════════════════════════════════
  var revealPresets = {
    'slide-left':        { from: { x: -80, autoAlpha: 0 }, to: { x: 0, autoAlpha: 1 }, ease: 'power4.out' },
    'slide-left-soft':   { from: { x: -50, autoAlpha: 0 }, to: { x: 0, autoAlpha: 1 }, ease: 'power3.out' },
    'slide-left-far':    { from: { x: -120, autoAlpha: 0 }, to: { x: 0, autoAlpha: 1 }, ease: 'power4.out' },
    'slide-left-up':     { from: { x: -60, y: 30, autoAlpha: 0 }, to: { x: 0, y: 0, autoAlpha: 1 }, ease: 'power4.out' },
    'slide-left-rotate': { from: { x: -70, rotation: -3, autoAlpha: 0 }, to: { x: 0, rotation: 0, autoAlpha: 1 }, ease: 'power4.out' },
    'slide-right':        { from: { x: 80, autoAlpha: 0 }, to: { x: 0, autoAlpha: 1 }, ease: 'power4.out' },
    'slide-right-soft':   { from: { x: 50, autoAlpha: 0 }, to: { x: 0, autoAlpha: 1 }, ease: 'power3.out' },
    'slide-right-far':    { from: { x: 120, autoAlpha: 0 }, to: { x: 0, autoAlpha: 1 }, ease: 'power4.out' },
    'slide-right-up':     { from: { x: 60, y: 30, autoAlpha: 0 }, to: { x: 0, y: 0, autoAlpha: 1 }, ease: 'power4.out' },
    'slide-right-rotate': { from: { x: 70, rotation: 3, autoAlpha: 0 }, to: { x: 0, rotation: 0, autoAlpha: 1 }, ease: 'power4.out' },
    'fade-up':     { from: { y: 50, autoAlpha: 0 }, to: { y: 0, autoAlpha: 1 }, ease: 'power4.out' },
    'fade-down':   { from: { y: -50, autoAlpha: 0 }, to: { y: 0, autoAlpha: 1 }, ease: 'power4.out' },
    'scale':       { from: { scale: 0.88, autoAlpha: 0 }, to: { scale: 1, autoAlpha: 1 }, ease: 'back.out(1.2)' },
    'scale-up':    { from: { scale: 0.85, y: 30, autoAlpha: 0 }, to: { scale: 1, y: 0, autoAlpha: 1 }, ease: 'back.out(1.2)' },
    'blur-in':     { from: { y: 20, autoAlpha: 0, filter: 'blur(16px)' }, to: { y: 0, autoAlpha: 1, filter: 'blur(0px)' }, ease: 'power4.out' },
    'clip-reveal': { from: { clipPath: 'inset(0 0 100% 0)', autoAlpha: 0 }, to: { clipPath: 'inset(0 0 0% 0)', autoAlpha: 1 }, ease: 'expo.out' }
  }

  var heroEntrancePresets = [
    { headline: 'slide-left-far', subline: 'slide-right', cta: 'slide-left' },
    { headline: 'slide-right-far', subline: 'slide-left', cta: 'slide-right' },
    { headline: 'slide-left-far', subline: 'slide-right', cta: 'slide-left-soft' }
  ]

  // ═══════════════════════════════════════════════════════════════
  // 1. TEXT REVEAL — Word-by-word / line-by-line staggered entrance
  // ═══════════════════════════════════════════════════════════════
  function splitWords(element) {
    if (element.dataset.aetherMotionSplit === 'true') return
    var text = element.textContent || ''
    var parts = text.split(/(\s+)/)
    element.textContent = ''
    element.setAttribute('aria-label', text.trim())
    var index = 0
    parts.forEach(function (part) {
      if (!part.trim()) {
        element.appendChild(document.createTextNode(part))
        return
      }
      var mask = document.createElement('span')
      var word = document.createElement('span')
      mask.className = 'aether-motion-word-mask'
      mask.setAttribute('aria-hidden', 'true')
      word.className = 'aether-motion-word'
      word.textContent = part
      word.style.setProperty('--word-index', index)
      mask.appendChild(word)
      element.appendChild(mask)
      index += 1
    })
    element.dataset.aetherMotionSplit = 'true'
  }

  function initTextReveals(gsap, scope, rec) {
    gsap.utils.toArray('[data-aether-motion-text="words"]', scope).forEach(function (element) {
      if (rec.elements.has(element)) return
      splitWords(element)
      var words = element.querySelectorAll('.aether-motion-word')
      gsap.set(element, { autoAlpha: 1 })
      gsap.fromTo(words,
        { yPercent: 110, autoAlpha: 0, filter: 'blur(8px)' },
        {
          yPercent: 0, autoAlpha: 1, filter: 'blur(0px)',
          duration: 0.9, ease: 'power4.out', stagger: 0.055,
          scrollTrigger: { trigger: element, start: 'top 82%', once: true }
        }
      )
      rec.elements.add(element)
    })

    gsap.utils.toArray('[data-aether-motion-text="lines"]', scope).forEach(function (element) {
      if (rec.elements.has(element)) return
      var lines = element.querySelectorAll('.aether-motion-line')
      var targets = lines.length ? lines : element.children
      if (!targets.length) return
      gsap.set(element, { autoAlpha: 1 })
      gsap.fromTo(targets,
        { yPercent: 100, autoAlpha: 0, filter: 'blur(8px)' },
        {
          yPercent: 0, autoAlpha: 1, filter: 'blur(0px)',
          duration: 1, ease: 'power4.out', stagger: 0.11,
          scrollTrigger: { trigger: element, start: 'top 84%', once: true }
        }
      )
      rec.elements.add(element)
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // 2. SCROLL REVEALS — directional entrances + group stagger
  // ═══════════════════════════════════════════════════════════════
  function initScrollReveals(gsap, scope, rec) {
    gsap.utils.toArray('[data-aether-reveal-group]', scope).forEach(function (group) {
      if (rec.elements.has(group)) return
      var items = group.querySelectorAll('[data-aether-reveal-item]')
      if (!items.length) return
      gsap.set(group, { autoAlpha: 1 })
      gsap.fromTo(items,
        { y: 36, autoAlpha: 0, filter: 'blur(6px)' },
        {
          y: 0, autoAlpha: 1, filter: 'blur(0px)',
          duration: 0.95, ease: 'power4.out', stagger: 0.08,
          scrollTrigger: { trigger: group, start: 'top 82%', once: true }
        }
      )
      rec.elements.add(group)
      items.forEach(function (el) { rec.elements.add(el) })
    })

    gsap.utils.toArray('[data-aether-reveal]:not([data-aether-reveal-item])', scope).forEach(function (element) {
      if (rec.elements.has(element)) return
      var presetKey = element.dataset.aetherReveal || 'fade-up'
      var preset = revealPresets[presetKey] || revealPresets['fade-up']
      var toVars = Object.assign({}, preset.to, {
        duration: 0.95,
        ease: preset.ease || 'expo.out',
        delay: Number(element.dataset.aetherRevealDelay || 0),
        scrollTrigger: { trigger: element, start: 'top 86%', once: true }
      })
      gsap.fromTo(element, preset.from, toVars)
      rec.elements.add(element)
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // AUTO-ASSIGN REVEALS — frozen animations.js:169-411, .aether-* classes
  // ═══════════════════════════════════════════════════════════════
  function assign(el, preset, delay) {
    if (!el.dataset.aetherReveal && !el.dataset.aetherMotionText) {
      el.dataset.aetherReveal = preset
      if (delay !== undefined) el.dataset.aetherRevealDelay = delay
    }
  }

  function autoAssignReveals(gsap, scope) {
    gsap.utils.toArray('.aether-section-header', scope).forEach(function (el) { assign(el, 'fade-up') })
    gsap.utils.toArray('.aether-section-label', scope).forEach(function (el) { assign(el, 'slide-left-soft') })
    gsap.utils.toArray('.aether-section-title', scope).forEach(function (el) { assign(el, 'fade-up') })
    gsap.utils.toArray('.aether-section-subtitle', scope).forEach(function (el) { assign(el, 'slide-right-soft') })

    gsap.utils.toArray('.aether-category-card', scope).forEach(function (el, i) {
      assign(el, i % 2 === 0 ? 'slide-left-rotate' : 'slide-right-rotate', (i * 0.15).toFixed(2))
    })

    gsap.utils.toArray('.aether-product-card', scope).forEach(function (el, i) {
      var colInRow = i % 4
      var directions = ['slide-left', 'slide-right', 'slide-left-soft', 'slide-right-soft']
      assign(el, directions[colInRow], (colInRow * 0.1).toFixed(2))
    })

    gsap.utils.toArray('.aether-blog-card', scope).forEach(function (el, i) {
      assign(el, i % 2 === 0 ? 'slide-left' : 'slide-right', (i * 0.12).toFixed(2))
    })

    gsap.utils.toArray('.aether-review-card', scope).forEach(function (el, i) {
      assign(el, i % 2 === 0 ? 'slide-left-soft' : 'slide-right-soft', (i * 0.1).toFixed(2))
    })

    gsap.utils.toArray('.aether-team-card', scope).forEach(function (el, i) {
      assign(el, i % 2 === 0 ? 'slide-left-rotate' : 'slide-right-rotate', (i * 0.12).toFixed(2))
    })

    gsap.utils.toArray('.aether-faq-item', scope).forEach(function (el, i) {
      assign(el, i % 2 === 0 ? 'slide-left-soft' : 'slide-right-soft', (i * 0.08).toFixed(2))
    })

    gsap.utils.toArray('.aether-mission-content', scope).forEach(function (el) { assign(el, 'slide-left') })
    gsap.utils.toArray('.aether-mission-image', scope).forEach(function (el) { assign(el, 'slide-right') })
    gsap.utils.toArray('.aether-story-quote', scope).forEach(function (el) { assign(el, 'blur-in') })
    gsap.utils.toArray('.aether-page-hero-content', scope).forEach(function (el) { assign(el, 'fade-up') })

    gsap.utils.toArray('.aether-feature-row', scope).forEach(function (el, i) {
      assign(el, i % 2 === 0 ? 'slide-left' : 'slide-right', (i * 0.1).toFixed(2))
    })
    gsap.utils.toArray('.aether-about-feature', scope).forEach(function (el, i) {
      assign(el, i % 2 === 0 ? 'slide-left-rotate' : 'slide-right-rotate', (i * 0.12).toFixed(2))
    })
    gsap.utils.toArray('.aether-contact-info-item', scope).forEach(function (el, i) {
      assign(el, i % 2 === 0 ? 'slide-left' : 'slide-right', (i * 0.1).toFixed(2))
    })

    gsap.utils.toArray('.aether-btn, .aether-section-cta', scope).forEach(function (el) {
      if (!el.dataset.aetherReveal && !el.closest('[data-aether-reveal]')) assign(el, 'slide-left-soft')
    })

    var footer = scope.querySelector('.aether-footer')
    if (footer) assign(footer, 'fade-up')

    gsap.utils.toArray('.aether-footer-links, .aether-footer-brand, .aether-footer-newsletter', scope).forEach(function (el, i) {
      assign(el, i % 2 === 0 ? 'slide-left-soft' : 'slide-right-soft', (i * 0.08).toFixed(2))
    })

    gsap.utils.toArray('.aether-faq-cta', scope).forEach(function (el) { assign(el, 'slide-left-soft') })
    gsap.utils.toArray('.aether-stat-item, .aether-stat-number', scope).forEach(function (el, i) {
      assign(el, i % 2 === 0 ? 'slide-left' : 'slide-right', (i * 0.1).toFixed(2))
    })
    gsap.utils.toArray('.aether-newsletter-inner', scope).forEach(function (el) { assign(el, 'slide-left-soft') })
    gsap.utils.toArray('.aether-newsletter-form', scope).forEach(function (el) { assign(el, 'slide-right-soft') })
    gsap.utils.toArray('.aether-confirmation-section', scope).forEach(function (el) { assign(el, 'scale') })
    gsap.utils.toArray('.aether-content-page', scope).forEach(function (el) { assign(el, 'fade-up') })

    gsap.utils.toArray('.aether-pd-info, .aether-pd-info-inner', scope).forEach(function (el) { assign(el, 'slide-right') })
    gsap.utils.toArray('.aether-gallery-main', scope).forEach(function (el) { assign(el, 'scale') })
    gsap.utils.toArray('.aether-pd-accordion-item', scope).forEach(function (el, i) {
      assign(el, i % 2 === 0 ? 'slide-left-soft' : 'slide-right-soft', (i * 0.08).toFixed(2))
    })
    gsap.utils.toArray('.aether-pd-review-card', scope).forEach(function (el, i) {
      assign(el, i % 2 === 0 ? 'slide-left' : 'slide-right', (i * 0.1).toFixed(2))
    })
    gsap.utils.toArray('.aether-pd-specs, .aether-pd-related', scope).forEach(function (el) { assign(el, 'fade-up') })

    gsap.utils.toArray('.aether-contact-form, .aether-contact-form-wrap', scope).forEach(function (el) { assign(el, 'slide-left') })
    gsap.utils.toArray('.aether-info-card', scope).forEach(function (el, i) {
      assign(el, i % 2 === 0 ? 'slide-right' : 'slide-left', (i * 0.12).toFixed(2))
    })

    gsap.utils.toArray('.aether-filter-bar', scope).forEach(function (el) { assign(el, 'slide-left-soft') })
    gsap.utils.toArray('.aether-shop-grid-section', scope).forEach(function (el) { assign(el, 'fade-up') })

    gsap.utils.toArray('.aether-reviews-summary, .aether-reviews-score', scope).forEach(function (el) { assign(el, 'slide-right-soft') })
    gsap.utils.toArray('.aether-score-number', scope).forEach(function (el) { assign(el, 'scale') })
    gsap.utils.toArray('.aether-score-stars', scope).forEach(function (el) { assign(el, 'slide-left-soft') })

    gsap.utils.toArray('.aether-footer-social', scope).forEach(function (el) { assign(el, 'slide-right-soft') })
    gsap.utils.toArray('.aether-footer-payments', scope).forEach(function (el) { assign(el, 'slide-left-soft') })
    gsap.utils.toArray('.aether-footer-bottom', scope).forEach(function (el) { assign(el, 'fade-up') })
  }

  // ═══════════════════════════════════════════════════════════════
  // 3. IMAGE CLIP REVEALS — data-aether-image-reveal
  // ═══════════════════════════════════════════════════════════════
  function initImageReveals(gsap, scope, rec) {
    gsap.utils.toArray('[data-aether-image-reveal]', scope).forEach(function (figure) {
      if (rec.elements.has(figure)) return
      var image = figure.querySelector('img')
      if (!image) return
      gsap.set(figure, { autoAlpha: 1 })
      var tl = gsap.timeline({
        scrollTrigger: { trigger: figure, start: 'top 82%', once: true }
      })
      tl.fromTo(figure,
        { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: 1.1, ease: 'expo.out' }
      ).fromTo(image,
        { scale: 1.08, autoAlpha: 0.75 },
        { scale: 1, autoAlpha: 1, duration: 1.2, ease: 'expo.out' },
        0
      )
      rec.elements.add(figure)
      rec.elements.add(image)
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // 4. HERO MOTION — content fade, scroll indicator, bg parallax
  //    (page snap NOT ported — D10)
  // ═══════════════════════════════════════════════════════════════
  function initHeroMotion(gsap, scope) {
    var heroSlider = scope.querySelector('.aether-hero')
    if (heroSlider) {
      var heroContent = heroSlider.querySelector('.aether-hero-slide-content')
      if (heroContent) {
        gsap.to(heroContent, {
          y: -60, opacity: 0, ease: 'none',
          scrollTrigger: {
            trigger: heroSlider, start: 'top top', end: '60% top',
            scrub: 1
          }
        })
      }

      var scrollIndicator = heroSlider.querySelector('.aether-scroll-indicator')
      if (scrollIndicator) {
        gsap.to(scrollIndicator, {
          opacity: 0, y: -20, ease: 'none',
          scrollTrigger: {
            trigger: heroSlider, start: '10% top', end: '30% top',
            scrub: 1
          }
        })
      }

      gsap.utils.toArray('.aether-hero-slide-bg img', heroSlider).forEach(function (img) {
        gsap.to(img, {
          y: 80, ease: 'none',
          scrollTrigger: {
            trigger: heroSlider, start: 'top top', end: 'bottom top',
            scrub: 1.5, invalidateOnRefresh: true
          }
        })
      })
    }

    gsap.utils.toArray('.aether-story-section', scope).forEach(function (section) {
      gsap.to(section, {
        backgroundPosition: '50% 60%', ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top bottom', end: 'bottom top',
          scrub: 1.5
        }
      })
    })
  }

  // ─── Hero slide entrance (per-slide directional presets) ───
  function animateHeroSlide(gsap, slideIndex) {
    var slides = document.querySelectorAll('.aether-hero-slide')
    var slide = slides[slideIndex]
    if (!slide) return
    var dirs = heroEntrancePresets[slideIndex % heroEntrancePresets.length]
    var text = slide.querySelector('.aether-hero-slide-text')
    if (!text) return
    gsap.set(text, { autoAlpha: 1 })
    var items = [
      { el: text.querySelector('.aether-hero-headline'), key: dirs.headline, delay: 0 },
      { el: text.querySelector('.aether-hero-subline'), key: dirs.subline, delay: 0.16 },
      { el: text.querySelector('.aether-hero-cta-group'), key: dirs.cta, delay: 0.32 }
    ]
    items.forEach(function (item) {
      if (!item.el) return
      var preset = revealPresets[item.key]
      if (!preset) return
      gsap.set(item.el, { clearProps: 'all' })
      gsap.fromTo(item.el, preset.from, {
        x: 0, y: 0, autoAlpha: 1, filter: 'blur(0px)',
        duration: 0.95,
        ease: 'power4.out',
        delay: item.delay
      })
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // 5. MAGNETIC HOVER — data-aether-magnetic (buttons follow cursor)
  // ═══════════════════════════════════════════════════════════════
  function initMagnetic(gsap, scope, rec) {
    if (window.matchMedia('(pointer: coarse)').matches) return

    gsap.utils.toArray('.aether-btn, .aether-hero-nav-btn', scope).forEach(function (el) {
      if (!el.dataset.aetherMagnetic) el.dataset.aetherMagnetic = '0.15'
    })

    gsap.utils.toArray('[data-aether-magnetic]', scope).forEach(function (element) {
      var strength = Number(element.dataset.aetherMagnetic || 0.2)
      var xTo = gsap.quickTo(element, 'x', { duration: 0.45, ease: 'power3.out' })
      var yTo = gsap.quickTo(element, 'y', { duration: 0.45, ease: 'power3.out' })

      var onMove = function (event) {
        var rect = element.getBoundingClientRect()
        var x = (event.clientX - rect.left - rect.width / 2) * strength
        var y = (event.clientY - rect.top - rect.height / 2) * strength
        xTo(x)
        yTo(y)
      }
      var onLeave = function () {
        xTo(0)
        yTo(0)
      }
      element.addEventListener('pointermove', onMove)
      element.addEventListener('pointerleave', onLeave)
      rec.handlers.push({ el: element, type: 'pointermove', fn: onMove })
      rec.handlers.push({ el: element, type: 'pointerleave', fn: onLeave })
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // 6. IMAGE PARALLAX — subtle zoom on scroll (auto-assign)
  // ═══════════════════════════════════════════════════════════════
  function initImageParallax(gsap, scope) {
    gsap.utils.toArray('.aether-category-card-bg img, .aether-product-image img, .aether-gallery-main img', scope).forEach(function (img) {
      var parent = img.closest('.aether-category-card, .aether-product-card, .aether-gallery-main')
      if (!parent) return
      gsap.fromTo(img,
        { scale: 1.08 },
        {
          scale: 1, ease: 'none',
          scrollTrigger: {
            trigger: parent,
            start: 'top bottom', end: 'bottom top',
            scrub: 1.5
          }
        }
      )
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // 7. PROGRESS BARS — .aether-bar-fill width animation
  // ═══════════════════════════════════════════════════════════════
  function initProgressBars(gsap, scope, rec) {
    gsap.utils.toArray('.aether-bar-fill', scope).forEach(function (bar) {
      if (rec.elements.has(bar)) return
      var width = bar.style.width || '0%'
      bar.style.width = '0%'
      gsap.to(bar, {
        width: width, duration: 1.2, ease: 'power3.out',
        scrollTrigger: { trigger: bar, start: 'top 90%', once: true }
      })
      rec.elements.add(bar)
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // 8. 3D TILT — data-aether-tilt on cards
  // ═══════════════════════════════════════════════════════════════
  function initTilt(gsap, scope, rec) {
    if (window.matchMedia('(pointer: coarse)').matches) return

    gsap.utils.toArray('[data-aether-tilt]', scope).forEach(function (card) {
      var strength = Number(card.dataset.aetherTilt || 8)
      var scale = Number(card.dataset.aetherTiltScale || 1.02)
      var speed = Number(card.dataset.aetherTiltSpeed || 0.3)

      var onMove = function (e) {
        var rect = card.getBoundingClientRect()
        var x = (e.clientX - rect.left) / rect.width
        var y = (e.clientY - rect.top) / rect.height
        var tiltX = (y - 0.5) * -strength
        var tiltY = (x - 0.5) * strength
        gsap.to(card, {
          rotationX: tiltX, rotationY: tiltY, scale: scale,
          duration: speed, ease: 'power3.out',
          transformPerspective: 800
        })
      }
      var onLeave = function () {
        gsap.to(card, {
          rotationX: 0, rotationY: 0, scale: 1,
          duration: 0.5, ease: 'power3.out'
        })
      }
      card.addEventListener('pointermove', onMove)
      card.addEventListener('pointerleave', onLeave)
      rec.handlers.push({ el: card, type: 'pointermove', fn: onMove })
      rec.handlers.push({ el: card, type: 'pointerleave', fn: onLeave })
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // 9. PARALLAX — data-aether-parallax on images
  // ═══════════════════════════════════════════════════════════════
  function initParallaxAttr(gsap, scope) {
    gsap.utils.toArray('[data-aether-parallax]', scope).forEach(function (el) {
      var speed = Number(el.dataset.aetherParallaxSpeed || 0.2)
      var section = el.closest('[data-aether-parallax-section]') || el.parentElement
      gsap.to(el, {
        y: function () { return window.innerHeight * speed * -1 },
        ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top bottom', end: 'bottom top',
          scrub: 1.2, invalidateOnRefresh: true
        }
      })
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // 10. IMAGE ZOOM — data-aether-image-zoom on product images
  // ═══════════════════════════════════════════════════════════════
  function initImageZoom(gsap, scope, rec) {
    if (window.matchMedia('(pointer: coarse)').matches) return

    gsap.utils.toArray('[data-aether-image-zoom]', scope).forEach(function (wrap) {
      var img = wrap.querySelector('img') || wrap
      var target = img.tagName === 'IMG' ? img : wrap

      var onEnter = function () {
        gsap.to(target, {
          scale: 1.08, duration: 0.7, ease: 'power3.out',
          overwrite: 'auto'
        })
      }
      var onLeave = function () {
        gsap.to(target, {
          scale: 1, duration: 0.7, ease: 'power3.out',
          overwrite: 'auto'
        })
      }
      wrap.addEventListener('pointerenter', onEnter)
      wrap.addEventListener('pointerleave', onLeave)
      rec.handlers.push({ el: wrap, type: 'pointerenter', fn: onEnter })
      rec.handlers.push({ el: wrap, type: 'pointerleave', fn: onLeave })
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // 11. COUNTUP — data-aether-countup animated counters
  // ═══════════════════════════════════════════════════════════════
  function initCountup(gsap, scope, rec) {
    gsap.utils.toArray('[data-aether-countup]', scope).forEach(function (el) {
      if (rec.elements.has(el)) return
      var target = Number(el.dataset.aetherCountup) || 0
      var suffix = el.dataset.aetherCountupSuffix || ''
      var prefix = el.dataset.aetherCountupPrefix || ''
      var decimals = el.dataset.aetherCountupDecimals !== undefined ? Number(el.dataset.aetherCountupDecimals) : 0
      var obj = { val: 0 }
      gsap.to(obj, {
        val: target,
        duration: 2,
        ease: 'power3.out',
        scrollTrigger: { trigger: el, start: 'top 85%', once: true },
        onUpdate: function () {
          el.textContent = prefix + obj.val.toFixed(decimals) + suffix
        }
      })
      rec.elements.add(el)
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // 12. SCRUB HORIZONTAL — data-aether-scrub-horizontal galleries
  // ═══════════════════════════════════════════════════════════════
  function initScrubHorizontal(gsap, scope) {
    gsap.utils.toArray('[data-aether-scrub-horizontal]', scope).forEach(function (section) {
      var track = section.querySelector('[data-aether-scrub-track]')
      if (!track) return
      var wrap = section.querySelector('[data-aether-scrub-wrap]') || track
      gsap.to(track, {
        x: function () { return -(track.scrollWidth - wrap.offsetWidth) },
        ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top top',
          end: function () { return '+=' + track.scrollWidth },
          scrub: 1, pin: true, anticipatePin: 1,
          invalidateOnRefresh: true
        }
      })
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // 13. STICKY PIN — data-aether-sticky-pin pinned sections
  // ═══════════════════════════════════════════════════════════════
  function initStickyPin(gsap, scope) {
    var ScrollTrigger = window.ScrollTrigger
    gsap.utils.toArray('[data-aether-sticky-pin]', scope).forEach(function (section) {
      var height = section.dataset.aetherStickyPin || '100%'
      ScrollTrigger.create({
        trigger: section, start: 'top top',
        end: function () { return '+=' + (height === '100%' ? window.innerHeight : height) },
        pin: true, anticipatePin: 1,
        invalidateOnRefresh: true
      })
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // 14. PARALLAX LAYER — data-aether-parallax-layer depth layers
  // ═══════════════════════════════════════════════════════════════
  function initParallaxLayer(gsap, scope) {
    gsap.utils.toArray('[data-aether-parallax-layer]', scope).forEach(function (layer) {
      var depth = Number(layer.dataset.aetherParallaxLayer || 0.15)
      var section = layer.closest('[data-aether-parallax-section]') || layer.parentElement
      gsap.to(layer, {
        y: function () { return window.innerHeight * depth * -1 },
        ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top bottom', end: 'bottom top',
          scrub: 1.2, invalidateOnRefresh: true
        }
      })
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // 15. BUTTON RIPPLE — .aether-btn click feedback
  // ═══════════════════════════════════════════════════════════════
  function initButtonRipple(scope, rec) {
    scope.querySelectorAll('.aether-btn').forEach(function (btn) {
      var onRipple = function (e) {
        var rect = btn.getBoundingClientRect()
        var x = e.clientX - rect.left
        var y = e.clientY - rect.top
        var ripple = document.createElement('span')
        ripple.style.cssText =
          'position:absolute;border-radius:50%;background:rgba(255,255,255,0.3);' +
          'width:0;height:0;left:' + x + 'px;top:' + y + 'px;' +
          'transform:translate(-50%,-50%);pointer-events:none;z-index:1;'
        btn.appendChild(ripple)
        var size = Math.max(rect.width, rect.height) * 2
        ripple.animate([
          { width: '0px', height: '0px', opacity: 0.5 },
          { width: size + 'px', height: size + 'px', opacity: 0 }
        ], { duration: 600, easing: 'cubic-bezier(0.16, 1, 0.3, 1)' })
        setTimeout(function () { ripple.remove() }, 600)
      }
      btn.addEventListener('click', onRipple)
      rec.handlers.push({ el: btn, type: 'click', fn: onRipple })
    })
  }

  // ═══════════════════════════════════════════════════════════════
  // SINGLETON API
  // ═══════════════════════════════════════════════════════════════
  return {
    init(scope = document) {
      if (paused) return this
      if (motionDisabled()) {
        document.documentElement.classList.add('aether-no-motion')
        return this
      }
      if (registry.has(scope)) return this

      var gsap = window.gsap
      var ScrollTrigger = window.ScrollTrigger
      if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
        // Vendors not loaded yet — runtime loads GSAP before calling init.
        return this
      }

      var rec = { triggers: new Set(), elements: new Set(), handlers: [] }
      registry.set(scope, rec)

      document.documentElement.classList.add('aether-has-motion')

      gsap.registerPlugin(ScrollTrigger)
      gsap.defaults({ ease: 'power3.out', duration: 0.85 })

      // Track every trigger created in this scope (gsap's plugin routes tween
      // scrollTrigger configs through ScrollTrigger.create while patched).
      var origCreate = ScrollTrigger.create
      ScrollTrigger.create = function (cfg) {
        var st = origCreate.call(ScrollTrigger, cfg)
        rec.triggers.add(st)
        return st
      }

      autoAssignReveals(gsap, scope)
      initTextReveals(gsap, scope, rec)
      initScrollReveals(gsap, scope, rec)
      initImageReveals(gsap, scope, rec)
      initHeroMotion(gsap, scope)
      initMagnetic(gsap, scope, rec)
      initImageParallax(gsap, scope)
      initProgressBars(gsap, scope, rec)
      initTilt(gsap, scope, rec)
      initParallaxAttr(gsap, scope)
      initImageZoom(gsap, scope, rec)
      initCountup(gsap, scope, rec)
      initScrubHorizontal(gsap, scope)
      initStickyPin(gsap, scope)
      initParallaxLayer(gsap, scope)
      initButtonRipple(scope, rec)

      ScrollTrigger.create = origCreate

      // Hero slide entrance — frozen animations.js:656-708 ported as a
      // CustomEvent contract (aetherHeroAnimate, detail.index).
      if (!this._heroListener) {
        var gsapRef = gsap
        this._heroListener = function (e) { animateHeroSlide(gsapRef, e.detail && e.detail.index) }
        document.addEventListener('aetherHeroAnimate', this._heroListener)
      }

      // Refresh trigger positions once images have loaded.
      if (!this._loadListener) {
        this._loadListener = function () { ScrollTrigger.refresh() }
        window.addEventListener('load', this._loadListener, { once: true })
      }

      ScrollTrigger.refresh()
      return this
    },

    refresh(scope) {
      if (paused || !window.ScrollTrigger) return this
      var ScrollTrigger = window.ScrollTrigger
      if (scope && !registry.has(scope)) this.init(scope)
      else this.init(scope || document)
      ScrollTrigger.refresh()
      return this
    },

    destroy(scope) {
      var rec = registry.get(scope)
      if (!rec) return this
      rec.triggers.forEach(function (t) {
        try { t.kill() } catch (e) { /* already dead */ }
      })
      rec.triggers.clear()
      rec.handlers.forEach(function (h) { h.el.removeEventListener(h.type, h.fn) })
      rec.handlers = []
      if (window.gsap) {
        rec.elements.forEach(function (el) {
          try { window.gsap.set(el, { clearProps: 'all' }) } catch (e) { /* detached */ }
        })
      }
      rec.elements.clear()
      registry.delete(scope)
      return this
    },

    initLenis(enabled) {
      if (!enabled || lenisInstance || !window.Lenis) return this
      if (motionDisabled()) return this
      var lenis = new window.Lenis({
        duration: 1.2,
        easing: function (t) { return Math.min(1, 1.001 - Math.pow(2, -10 * t)) },
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 1.5
      })
      document.documentElement.style.setProperty('scroll-behavior', 'auto', 'important')
      var raf = function (time) {
        lenis.raf(time)
        if (typeof window.ScrollTrigger !== 'undefined') window.ScrollTrigger.update()
        requestAnimationFrame(raf)
      }
      requestAnimationFrame(raf)
      lenisInstance = lenis
      window.lenis = lenis
      return this
    },

    pause() {
      paused = true
      if (lenisInstance && lenisInstance.stop) lenisInstance.stop()
      return this
    },

    resume() {
      paused = false
      if (lenisInstance && lenisInstance.start) lenisInstance.start()
      return this
    }
  }
})()
