/* The faces the title selector offers, and the tabs they sit under.
 *
 * This is the file you edit per project. Everything else in type-tester is
 * generic. Adding a face is one line here plus an @font-face in
 * display-fonts.css; there is no measurement step, because the control
 * measures each face against the page's own headline when you pick it.
 *
 * A category carries the fallback stack for its faces, so the entries stay
 * short and a serif never falls back to a grotesque. `vf` is optional and
 * carries variable-font axes; a static face ignores axes it does not have,
 * so there is no harm in a shared declaration.
 */
window.TYPE_TESTER = {
  /* The face used when nothing is stored. It sets no attribute on the root,
     so the page's own CSS keeps describing the default, and it is the
     yardstick every other face is scaled against. */
  base: 'anton',

  categories: [
    {
      id: 'serif',
      label: 'Serif',
      fallback: '"Source Serif 4", "GT Sectra", "Iowan Old Style", Georgia, serif',
      faces: [
        { id: 'fraunces', family: 'Fraunces', name: 'Fraunces', vf: '"opsz" 144',
          note: 'The page as drawn. Soft old-style with a deliberate wobble.' },
        { id: 'fraunces-wonk', family: 'Fraunces Flex', name: 'Fraunces, wonky',
          vf: '"opsz" 144, "SOFT" 100, "WONK" 1',
          note: 'The same face with its axes opened: softer terminals, the leaning g.' },
        { id: 'baskerville', family: 'Libre Baskerville', name: 'Libre Baskerville',
          note: 'Settled and bookish. The page starts sounding like a printed manual.' },
        { id: 'newsreader', family: 'Newsreader', name: 'Newsreader',
          note: 'A news serif with the warmth left in. Reads long without tiring.' },
        { id: 'young-serif', family: 'Young Serif', name: 'Young Serif',
          note: 'Old-style bones at slab weight. Blunt, and friendlier than it looks.' },
        { id: 'instrument', family: 'Instrument Serif', name: 'Instrument Serif',
          note: 'Narrow and high-contrast. Editorial, and quietly expensive.' },
      ],
    },
    {
      id: 'didone',
      label: 'Didone',
      fallback: '"Source Serif 4", "GT Sectra", "Iowan Old Style", Georgia, serif',
      faces: [
        { id: 'gloock', family: 'Gloock', name: 'Gloock',
          note: 'A Didone pushed until the thin strokes almost disappear.' },
        { id: 'bodoni', family: 'Bodoni Moda', name: 'Bodoni Moda',
          note: 'Bodoni at its heaviest. Fashion-masthead authority, and no warmth at all.' },
        { id: 'playfair', family: 'Playfair Display', name: 'Playfair Display',
          note: 'The transitional workhorse. Familiar enough to disappear.' },
        { id: 'prata', family: 'Prata', name: 'Prata',
          note: 'Lighter and more drawn. Contrast without the shouting.' },
        { id: 'abril', family: 'Abril Fatface', name: 'Abril Fatface',
          note: 'A Didone with the weight of a poster. Built for four words, not forty.' },
      ],
    },
    {
      id: 'condensed',
      label: 'Condensed',
      fallback: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      faces: [
        { id: 'anton', family: 'Anton', name: 'Anton',
          note: 'One weight, tightly condensed. Built to be read across a room.' },
        { id: 'big-shoulders', family: 'Big Shoulders Display', name: 'Big Shoulders',
          note: 'Industrial signage: narrow, upright, nothing spare.' },
        { id: 'oswald', family: 'Oswald', name: 'Oswald',
          note: 'The condensed gothic, reworked for screens. Steady and unfussy.' },
        { id: 'bebas', family: 'Bebas Neue', name: 'Bebas Neue',
          note: 'Capitals only, so the headline becomes a sign rather than a sentence.' },
        { id: 'fjalla', family: 'Fjalla One', name: 'Fjalla One',
          note: 'Condensed with soft corners. Less severe than Anton at the same width.' },
        { id: 'archivo-narrow', family: 'Archivo', name: 'Archivo Narrow',
          note: 'A grotesque squeezed to 62 per cent. Neutral, and still fits a long line.' },
      ],
    },
    {
      id: 'sans',
      label: 'Sans',
      fallback: '"Helvetica Neue", Helvetica, Arial, sans-serif',
      faces: [
        { id: 'archivo-black', family: 'Archivo Black', name: 'Archivo Black',
          note: 'A plain grotesque at full weight. The headline stops performing.' },
        { id: 'space-grotesk', family: 'Space Grotesk', name: 'Space Grotesk',
          note: 'Straight-sided and slightly technical. Reads engineered.' },
        { id: 'bricolage', family: 'Bricolage Grotesque', name: 'Bricolage Grotesque',
          note: 'A grotesque that refuses to be tidy. Odd widths on purpose.' },
        { id: 'schibsted', family: 'Schibsted Grotesk', name: 'Schibsted Grotesk',
          note: 'Newsroom sans. Warm enough to carry a paragraph under it.' },
        { id: 'darker-grotesque', family: 'Darker Grotesque', name: 'Darker Grotesque',
          note: 'Tall, narrow and very light on its feet. Almost a display face.' },
      ],
    },
    {
      id: 'display',
      label: 'Display',
      fallback: '"Source Serif 4", "GT Sectra", "Iowan Old Style", Georgia, serif',
      faces: [
        { id: 'alfa-slab', family: 'Alfa Slab One', name: 'Alfa Slab One',
          note: 'A fat slab serif with circus-poster energy.' },
        { id: 'syne', family: 'Syne', name: 'Syne',
          note: 'Art-school geometry. The widths refuse to behave and that is the point.' },
        { id: 'unbounded', family: 'Unbounded', name: 'Unbounded',
          note: 'Round and confident, closer to a logotype than to a text face.' },
        { id: 'bungee', family: 'Bungee', name: 'Bungee',
          note: 'Drawn for signs that have to read downward as well as across.' },
        { id: 'climate', family: 'Climate Crisis', name: 'Climate Crisis',
          note: 'A face whose weight is an argument. Uncomfortable on purpose.' },
      ],
    },
  ],
};
