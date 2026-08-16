/* ─── PHANTOM SkeletonManager ────────────────────────────────────────
 * Layer 2a: Smart skeleton lifecycle controller
 * Watches DOM mutations to show/hide skeleton loaders during AJAX
 * Integrates with ph-motion entrance animations on content reveal
 * ──────────────────────────────────────────────────────────────────── */

class SkeletonManager {
  constructor() {
    this.config = {
      enabled: window.phMotionSettings?.skeletonsEnabled ?? false,
      minDisplayMs: 400,
      reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches
    }

    this.observer = null
    this.activeTimers = {}
    this._cache = {}
    this._observerReady = false
  }

  init() {
    if (!this.config.enabled) return

    if (document.documentElement.hasAttribute('data-disable-animations')) {
      this.config.reducedMotion = true
    }

    this._cacheExisting()

    this.observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (mutation.type === 'attributes') {
          this._handleAttributeChange(mutation.target, mutation.attributeName)
        }
        if (mutation.type === 'childList') {
          for (const node of mutation.addedNodes) {
            if (node.nodeType === 1) this._scanNode(node)
          }
        }
      }
    })

    this.observer.observe(document.body, {
      attributes: true,
      attributeFilter: ['class', 'loading'],
      childList: true,
      subtree: true
    })

    this._observerReady = true

    document.addEventListener('shopify:section:load', (e) => {
      this._onSectionLoad(e)
    })

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) this._pauseAll()
    })
  }

  _cacheExisting() {
    document.querySelectorAll('[data-skeleton]').forEach((el) => {
      this._cacheContainer(el)
    })
  }

  _scanNode(node) {
    const containers = node.querySelectorAll
      ? node.querySelectorAll('[data-skeleton]')
      : []
    containers.forEach((el) => this._cacheContainer(el))
    if (node.hasAttribute && node.hasAttribute('data-skeleton')) {
      this._cacheContainer(node)
    }
  }

  _cacheContainer(el) {
    const id = el.getAttribute('data-skeleton')
    if (!id) return
    this._cache[id] = el
  }

  _handleAttributeChange(target, attr) {
    if (attr === 'class') {
      const gridWrapper = target.closest('.collection-grid__wrapper') ||
        (target.classList && target.classList.contains('collection-grid__wrapper') ? target : null)
      if (gridWrapper) {
        if (gridWrapper.classList.contains('unload')) {
          this.show('collection-grid')
        } else {
          this.hide('collection-grid')
        }
      }

      const quizSlot = target.closest('.quiz-card-slot') ||
        (target.classList && target.classList.contains('quiz-card-slot') ? target : null)
      if (quizSlot) {
        const cardsContainer = quizSlot.closest('[data-quiz-cards]')
        if (cardsContainer) {
          const skeletonEl = cardsContainer.querySelector('[data-skeleton="product-cards"]')
          if (skeletonEl) {
            if (quizSlot.classList.contains('is-loading')) {
              this._showEl(skeletonEl)
            } else if (!cardsContainer.querySelector('.quiz-card-slot.is-loading')) {
              setTimeout(() => this._hideEl(skeletonEl), 100)
            }
          }
        }
      }
    }

    if (attr === 'loading') {
      const searchEl = target.closest('predictive-search') ||
        (target.tagName === 'PREDICTIVE-SEARCH' ? target : null)
      if (searchEl) {
        if (searchEl.hasAttribute('loading')) {
          this.show('predictive')
        } else {
          this.hide('predictive')
        }
      }
    }
  }

  _onSectionLoad(e) {
    const section = e.target
    if (!section) return
    const skeletons = section.querySelectorAll('[data-skeleton]')
    skeletons.forEach((el) => {
      const id = el.getAttribute('data-skeleton')
      if (id) {
        this._cache[id] = el
        setTimeout(() => this.hide(id), 100)
      }
    })
  }

  show(id) {
    if (this.config.reducedMotion) return
    if (this.activeTimers[id]) clearTimeout(this.activeTimers[id])

    const el = this._cache[id] || document.querySelector(`[data-skeleton="${id}"]`)
    if (!el) return

    this._showEl(el)
  }

  hide(id) {
    const el = this._cache[id] || document.querySelector(`[data-skeleton="${id}"]`)
    if (!el) return

    if (this.activeTimers[id]) clearTimeout(this.activeTimers[id])

    if (el.classList.contains('is-visible')) {
      this.activeTimers[id] = setTimeout(() => {
        this._hideEl(el)
      }, this.config.minDisplayMs)
    }
  }

  _showEl(el) {
    el.removeAttribute('hidden')
    el.classList.remove('is-hidden')
    requestAnimationFrame(() => {
      el.classList.add('is-visible')
    })
  }

  _hideEl(el) {
    if (this.config.reducedMotion) {
      el.classList.remove('is-visible')
      el.setAttribute('hidden', '')
      return
    }

    el.classList.remove('is-visible')
    el.classList.add('is-hidden')
    setTimeout(() => {
      el.setAttribute('hidden', '')
      el.classList.remove('is-hidden')
    }, 150)
  }

  _pauseAll() {
    Object.keys(this.activeTimers).forEach((id) => {
      clearTimeout(this.activeTimers[id])
    })
  }

  destroy() {
    if (this.observer) {
      this.observer.disconnect()
      this.observer = null
    }
    this._pauseAll()
    this._observerReady = false
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.phSkeleton = new SkeletonManager()
    window.phSkeleton.init()
  })
} else {
  window.phSkeleton = new SkeletonManager()
  window.phSkeleton.init()
}
