# type-tester

A title typeface selector you drop into a page to audition display faces on
the real headline, in the real column, at the real size. Four files, no build
step, no framework, no network calls at runtime.

Built for `design-expert.html`. Nothing in it knows about that page.

## The one thing your page has to do

Every heading takes its family from a custom property instead of naming a
font:

```css
:root { --title: "Fraunces", Georgia, serif; }
h1, h2, h3 { font-family: var(--title); }
```

That is the whole integration. If your headings name fonts directly, the
control has nothing to turn.

Two optional properties buy you more. `--title-vf` carries variable-font axes,
and `--title-scale` is how the control keeps a headline on one line:

```css
h1 {
  font-family: var(--title);
  font-variation-settings: var(--title-vf, normal);
  font-size: calc(clamp(56px, 6.7vw, 94px) * var(--title-scale, 1));
}
```

## Dropping it in

```html
<head>
  <link rel="stylesheet" href="./display-fonts.css">
  <link rel="stylesheet" href="./type-tester.css">
  <script src="./type-tester-faces.js"></script>
  <script src="./type-tester.js" data-measure="h1"></script>
</head>
<body>
  <nav>
    <div class="type-tester"></div>
  </nav>
</body>
```

Both scripts go in the head and are **not** deferred. The control writes its
face rules and restores the stored choice before the body is parsed, so a
reload does not flash the default face first.

### Configuration

All of it lives on the script tag, all of it optional.

| Attribute | Default | What it does |
|---|---|---|
| `data-mount` | `.type-tester` | Where the control builds itself |
| `data-measure` | none | The headline that must not rewrap. Unset means no scaling |
| `data-var` | `--title` | The family property |
| `data-var-axes` | `--title-vf` | The variable-axis property |
| `data-var-scale` | `--title-scale` | The scale property |
| `data-storage` | `type-tester:face` | localStorage key |
| `data-label` | a sensible sentence | Accessible name for the control |

## Why `--title-scale` exists, and why it is measured

Display faces do not fill the em by the same amount. At one font-size the
same headline runs more than twice as long in Climate Crisis as in Fraunces.
Swap only the family and you get a headline that is either lost on the page or
broken onto a second line.

So each face carries a scale: the base face's width ratio over its own. It
normalises how loud the headline reads, not how large it is set. On this page
that lands every one of the 27 faces between 85 and 90 per cent of the intro
column, at sizes from 30px to 78px.

**These numbers are measured, not written down.** That matters more than it
sounds. The first version of this had 27 hand-measured constants in the
stylesheet, and they were correct for exactly one headline in one column at
one weight. Copied into another project they were all quietly wrong, and
nothing announced it: the headline just sat at an odd size.

Now the control measures. It renders your `data-measure` text offscreen at a
reference size in each face, carrying the headline's real weight, style and
letter-spacing, and divides. The result is cached in localStorage against the
exact sample text, so later visits apply the scale before the first paint and
a rewritten headline throws the stale numbers away by itself.

Adding a face is one line in the manifest. There is no measurement step.

## Adding faces

`type-tester-faces.js` is the only file you edit per project. A category
carries the fallback stack for its faces, so a serif never falls back to a
grotesque:

```js
{
  id: 'condensed',
  label: 'Condensed',
  fallback: '"Helvetica Neue", Helvetica, Arial, sans-serif',
  faces: [
    { id: 'anton', family: 'Anton', name: 'Anton',
      note: 'One weight, tightly condensed. Built to be read across a room.' },
  ],
}
```

`vf` is optional and carries axes, for example `'"opsz" 144, "WONK" 1'`. A
static face ignores axes it does not have, so one declaration serves both.

`base` at the top names the face the page already uses. It sets no attribute
on the root, so your own CSS keeps describing the default, and it is the
yardstick every other face is measured against.

Then declare the face in `display-fonts.css`. To self-host from Google Fonts,
add a line to `explorations/download-display-fonts.mjs` and run it: it fetches
the latin woff2 subset, drops the OFL licence beside it, and regenerates
`display-fonts.css`.

## Notes

- **Specificity.** Every rule in `type-tester.css` is scoped under `.tt`. A
  drop-in lands inside markup it cannot see, and mounted in a nav its list gets
  matched by whatever the host says about `nav ul`. One class loses to one
  class plus one element; two classes do not.
- **Payload.** The faces only download when the panel is opened and a specimen
  renders, because `font-display: swap` does not fetch what nothing paints.
  A closed panel costs nothing.
- **Keyboard.** Left and Right move between tabs, Up and Down through the
  faces, Home and End jump, Enter picks, Escape closes and returns focus.
  Roving tabindex throughout.
- **Storage.** Two keys: the chosen face, and the measured ratios. Both are
  wrapped in try/catch, so a private window degrades to measuring once per
  session rather than breaking.
