/* Shared finite-animation lifecycle. Components own their choreography;
   this scope owns interruption, visibility, and accessibility. */
window.KhevMotion = (() => {
  const ease = 'cubic-bezier(.16, 1, .3, 1)';
  class Scope {
    constructor(root) {
      this.root = root;
      this.animations = new Set();
      this.reduced = matchMedia('(prefers-reduced-motion: reduce)');
      this.visible = false;
      this.paused = false;
      this.controller = new AbortController();
      this.sync = () => {
        if (this.reduced.matches) this.clear();
        else for (const animation of this.animations) {
          if (animation.playState === 'finished') continue;
          if (this.running) animation.play(); else animation.pause();
        }
        this.root.dispatchEvent(new CustomEvent('motionstatechange'));
      };
      this.reduced.addEventListener('change', this.sync, { signal: this.controller.signal });
      document.addEventListener('visibilitychange', this.sync, { signal: this.controller.signal });
      this.observer = new IntersectionObserver(([entry]) => {
        this.visible = entry.isIntersecting;
        this.sync();
      }, { threshold: .2 });
      this.observer.observe(root);
    }
    get running() { return this.visible && !document.hidden && !this.paused && !this.reduced.matches; }
    animate(element, frames, options = {}) {
      if (!element || this.reduced.matches || !element.animate) return null;
      const animation = element.animate(frames, { duration: 900, easing: ease, fill: 'both', ...options });
      this.animations.add(animation);
      // Base CSS always describes the final state, so completed effects can
      // be released. There are no permanently filling animations to accrue.
      animation.onfinish = () => { this.animations.delete(animation); animation.cancel(); };
      if (!this.running) animation.pause();
      return animation;
    }
    clear() { for (const animation of this.animations) animation.cancel(); this.animations.clear(); }
    pause(value = true) { this.paused = value; this.sync(); }
    destroy() { this.clear(); this.observer.disconnect(); this.controller.abort(); }
  }
  return { Scope, ease };
})();
