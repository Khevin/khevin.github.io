# Council motion

The hero is the pilot for a reusable motion language, not a site-wide animation rollout.

## Choreography

A selection sends a short arc around the council and a signal down the selected spoke. The outer drawing acknowledges the selection. The central study then demonstrates the principle: Rams subtracts, Vignelli establishes a rhythm, Kare assembles pixels, Itten directs attention, Tufte removes chart noise, and Müller-Brockmann aligns a composition. The checkmark arrives after the work, not before it.

Every study finishes in about 3.7 seconds, including its final checkmark. The introductory tour holds each seat for 4.8 seconds, visits the other five, returns to the initial seat, then stops. A visible pause control freezes the study and stops the tour. Play starts a fresh lap; Replay repeats only the current study. Selecting a designer or focusing a seat ends automatic selection. Hover pauses only automatic advancement so a study can still finish under the pointer.

## Reusable implementation

- `site-motion.js`: `KhevMotion.Scope(root)` owns finite Web Animations API effects, pause/resume, viewport visibility, document visibility, runtime reduced-motion changes, and teardown. `animate(element, frames, options)`, `clear()`, `pause(boolean)`, and `destroy()` are the shared contract.
- `council-scenes.js`: final-state SVGs and authored entrance cues. `data-motion` is `assemble`, `draw`, `remove`, or `reveal`; delays and offsets belong to the illustration.
- `design-expert-hero.js`: component state and sequence. New input cancels old effects immediately. No stale delayed content swaps; the selected label, scene, and `aria-pressed` always agree.
- CSS describes the finished composition. Effects are released on completion rather than left filling indefinitely. Reduced motion therefore retains the complete illustration, with no invisible delayed text.
- The tour is silent to assistive technology. Manual selection restores polite announcements. Keyboard navigation and native buttons remain available with reduced motion; autoplay and replay are disabled.

## Applying this elsewhere

Reuse the lifecycle and the shared deceleration curve, not the council animation itself. A library row might reveal its hierarchy, a diagram might trace a relationship, and a chart might uncover its comparison. Keep motion tied to the content. Avoid infinite loops, scroll hijacking, or hiding essential content until JavaScript runs. Instantiate one scope per independently visible component and destroy it when that component is removed.

No animation dependencies, CDN scripts, network requests, or build step are needed. Existing designer SVGs and palette behavior are preserved.
