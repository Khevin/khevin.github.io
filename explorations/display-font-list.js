/* The title-font candidate set — one definition, read by the nav picker
   (signal-fonts.js) and by the specimen sheet (title-fonts.html).

   `track` is the letter-spacing that face wants at display size: a condensed
   face needs far less negative tracking than a wide one, and comparing them at
   a single fixed value flatters whichever happens to match it.

   `licensed` faces cannot be fetched and self-hosted. They are reached through
   local() and only render where they are installed. */
window.SIGNAL_FONTS = {
  selfHosted: [
  { id: 'archivo',   label: 'Archivo Black',    family: 'Archivo Black',         track: '-0.03em',  weight: 400, note: 'current' },
  { id: 'anton',     label: 'Anton',            family: 'Anton',                 track: '-0.005em', weight: 400 },
  { id: 'bodoni',    label: 'Bodoni Moda 900',  family: 'Bodoni Moda',           track: '-0.02em',  weight: 900 },
  { id: 'baskerv',   label: 'Libre Baskerville',family: 'Libre Baskerville',     track: '-0.02em',  weight: 700 },
  { id: 'alfa',      label: 'Alfa Slab One',    family: 'Alfa Slab One',         track: '-0.02em',  weight: 400 },
  { id: 'unbounded', label: 'Unbounded 800',    family: 'Unbounded',             track: '-0.045em', weight: 800 },
  { id: 'bungee',    label: 'Bungee',           family: 'Bungee',                track: '0',        weight: 400 },
  { id: 'syne',      label: 'Syne 800',         family: 'Syne',                  track: '-0.03em',  weight: 800 },
  { id: 'climate',   label: 'Climate Crisis',   family: 'Climate Crisis',        track: '-0.01em',  weight: 400 },
  { id: 'bigshoul',  label: 'Big Shoulders 800',family: 'Big Shoulders Display', track: '0',        weight: 800 },
  { id: 'gloock',    label: 'Gloock',           family: 'Gloock',                track: '-0.02em',  weight: 400 },
  { id: 'fraunces',  label: 'Fraunces 900',     family: 'Fraunces',              track: '-0.025em', weight: 900 },
  { id: 'instrument',label: 'Instrument Serif', family: 'Instrument Serif',      track: '-0.02em',  weight: 400 },
  ],
  licensed: [
  { id: 'riking',    label: 'Riking',           family: 'Riking',          track: '-0.02em', weight: 900 },
  { id: 'ezra',      label: 'Ezra',             family: 'Ezra',            track: '-0.02em', weight: 900 },
  { id: 'futurabk',  label: 'Futura Black',     family: 'Futura Black',    track: '-0.01em', weight: 400 },
  { id: 'ttravels',  label: 'TT Travels Pro',   family: 'TT Travels Pro',  track: '-0.03em', weight: 900 },
  { id: 'construct', label: 'Construction',     family: 'Construction',    track: '-0.02em', weight: 900 },
  { id: 'baskreal',  label: 'Baskerville',      family: 'Baskerville',     track: '-0.02em', weight: 700 },
  ],
};
