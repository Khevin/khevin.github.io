# Popover review — Nihongo Reader extension

**Depth** sub-surface (one surface inside the reader). **Register** product, per the reader's own side panel and the Nihongo app's settings drawer. **Design system** the Nihongo app (`nihongo/app.css` § settings) and the reader panel (`reader-extension/sidepanel.css`); no `DESIGN.md` governs the extension, and the portfolio's root `DESIGN.md` is brand register and does not apply. **Reviewed** `reader-extension/popup.html` + `popup.css` at 300 px, both themes, Defaults expanded. **Method** design-expert 1.2.1 review mode, read from the plugin on disk because the slash command is not loaded in this session.

## Context

The popover began as a switch plus two buttons and three defaults. It has since absorbed a translation provider, three picture-provider credentials, a voice picker, a speech key, two voice actions and a diagnostics line, without its layout changing. It is now 871 px tall at 300 px wide inside a surface that stops scrolling at 600, and every one of those controls sits in the same flat two-column grid at the same visual level.

## What works

- The top block is genuinely good: switch, one-sentence hint, two buttons, per-site mute. Nothing there needs changing.
- Colour, spacing and the toggle switch already match the reader's warm paper palette.
- The Test voice button gives the settings a way to prove themselves, which most extension popovers lack.

## Issues

**Blocker · Nine of thirteen controls have no programmatic label**
WHAT: `View`, `Translate to`, `Translation`, `Translation key`, `Pictures`, `Voice`, `Nihongo URL` are `<span>` text in a grid column, not `<label for>`. Measured in the page: only `enabled`, `mute`, `romaji` and `ttsRate` resolve a label.
WHY: [UD 1] equitable use and [UD 4a] redundant presentation. A screen reader announces "password, blank" three times in a row in the Pictures group. Clicking the word "Voice" does not focus the control, which is the cheapest affordance a form has. [NNg, "Form Design Quick Fix: Group Form Elements Effectively"]
WHERE: `popup.html`, every row of `.grid`.
HOW: one `<label for>` per control, above the control, not beside it.

**Blocker · Placeholders are doing the work of labels**
WHAT: The three Pictures fields are told apart only by grey placeholder text: "Pixabay API key (first choice)", "Google API key (Custom Search)", "search engine id (cx)".
WHY: Placeholder text disappears the moment a value is typed, so the field loses its identity exactly when the user wants to check what they pasted. [NNg, "Placeholders in Form Fields Are Harmful"] [Heuristic 6] recognition rather than recall.
WHERE: `pixabayKey`, `imagesKey`, `imagesCx`, `translateKey`, `gcloudTtsKey`, `appUrl`.
HOW: move the identity into the label; leave the placeholder for format only, or drop it.

**Major · No group boundaries, so the categories have no edges**
WHAT: Eleven rows sit at one level with no headings and no rules. Reading defaults, a translation provider, three picture credentials, a voice, a rate and an app URL are indistinguishable as a scan.
WHY: [Heuristic 4] consistency, [Heuristic 8] aesthetic and minimalist design, and Gestalt proximity. The Nihongo app already solved this in its own settings drawer, with a section head per group over a dashed rule (`app.css` § `.settings-section-head`, `音声 / Voice · text-to-speech`). The popover ignores the pattern its own product established.
WHERE: `popup.html` `.grid`.
HOW: sections with a lowercase head and a hairline rule, in the reader's idiom: reading, translation, pictures, voice, app.

**Major · The row label floats against tall stacks**
WHAT: `.grid { align-items: center }` centres "Pictures" vertically against a three-input stack, so the label lands beside the second field and roughly 40 px below the group it names.
WHY: Proximity is the only cue tying label to control, and centring breaks it. [Heuristic 4]
WHERE: `popup.css` `.grid`.
HOW: label above control; the two-column grid goes away with it.

**Major · "Defaults" is no longer true**
WHAT: The disclosure labelled Defaults contains API credentials, a provider choice, a voice test and a diagnostics line. None of those are defaults.
WHY: [Heuristic 2] match between system and the real world. A user hunting for a key will not open a drawer called Defaults.
HOW: rename to Settings, and keep the reading defaults as its first section.

**Minor · The popover is missing furigana**
WHAT: The bar offers romaji and furigana side by side; the popover exposes only romaji as a default, though `prefs.furigana` exists and the bar persists it.
WHY: [Heuristic 4]. Two toggles that always appear together in the reader appear as one here.
HOW: add the furigana default next to romaji, as a matching pair.

**Minor · 871 px inside a 600 px surface**
WHAT: With Settings open the popover scrolls, and the scroll is invisible until the user tries.
WHY: [Heuristic 1] visibility of system status.
HOW: sections shorten it on their own; the remaining overflow is acceptable once the groups make the scan cheap.

**Note · Two `select` rules and two full-width input rules**
WHAT: `popup.css` declares `select { … }` twice and repeats the same border, radius and padding for four input types.
HOW: one `.control` rule for every field.

## Anti-defaultism scan

Nine categories walked against `anti-slop.md`, product register. No tells found in the visual language: the palette is the product's own warm paper, there is no gradient, no glass, no icon tile, no uppercase eyebrow, no numbered section marker, no side stripe. The failure here is the opposite of slop. It is an interface that grew by appending rows to a grid, which reads as unfinished rather than machine-shaped. No Blocker from this scan. No system-mandated patterns apply, since the extension declares no design system of its own.

## Universal Design 7

Pass on 2, 3, 5, 6. **Fails 1** equitable use and **4a** redundant presentation, both from the missing labels. **7c** is a pass at 22 px for the switch but the `.btn.mini` pair sits at 18 px tall, under the 24 px minimum for a pointer target, so **7c fails** for Test voice and Import key. Three failures means the surface is broken regardless of polish, which matches the owner's reading of it.

## Next steps

- **P0** a real `<label for>` on every control, identity out of the placeholders.
- **P0** raise the two mini buttons to a 24 px target.
- **P1** five sections with heads and hairlines, in the reader's lowercase idiom; rename Defaults to Settings.
- **P1** label above control; drop the two-column grid.
- **P2** add the furigana default beside romaji.
- **P3** collapse the duplicated `select` and input rules into one `.control`.

## References

[Heuristic 1, 2, 4, 6, 8] Nielsen's ten. [UD 1, 4a, 7c] Universal Design 7. [NNg, "Placeholders in Form Fields Are Harmful"]. [NNg, "Form Design Quick Fix: Group Form Elements Effectively"]. `nihongo/app.css` § `.settings-section`, `.settings-field-label` for the product's established settings pattern. `reader-extension/sidepanel.css` § `.toolbar` for the reader's toggle idiom. Capsule consultation, three seats: Alan Cooper on the label-beside-stack failure ("the label must touch the thing it names"), Dieter Rams on the duplicated rules ("as little design as possible" applies to the stylesheet too), Jakob Nielsen on placeholders as labels.
