/* Deploy a Skillstone build into this Pages repo.
 *
 * WHY THIS EXISTS. skillstone/index.html looks like a pure artifact of
 * skill-tracker-v5.html, and it is not: it also carries the namespace bar that links the four
 * khevin.com projects, plus the sign-in button that bar holds for signed-out visitors. The bar
 * is site chrome, so it never belonged in v5 — but nothing wrote that down, and a plain
 * `cp public/index.html skillstone/index.html` therefore deleted it from the live site on
 * 16 Sep 2026. Before that it survived only because each deploy was a hand-run three-way merge.
 *
 * So the bar now lives beside this script, in git, as deploy/ns-bar.html, and the deploy is a
 * command rather than a judgement call:
 *
 *     node skillstone/deploy.mjs <path-to-built-index.html>
 *
 * The build stays where it is (skill-tracker's build-public.js); this only injects and checks.
 * Like that build, it refuses to write rather than write something wrong.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const SNIPPET = path.join(HERE, "deploy", "ns-bar.html");
const OUT = path.join(HERE, "index.html");

const src = process.argv[2] || process.env.SKILLSTONE_BUILD;
if (!src) {
  console.error("usage: node skillstone/deploy.mjs <path-to-built-index.html>\n" +
    "   (or set SKILLSTONE_BUILD). This is the public/index.html that build-public.js writes.");
  process.exit(1);
}
if (!fs.existsSync(src)) { console.error("no build at " + src); process.exit(1); }

let step = 0;
const say = m => console.log("   " + ++step + ". " + m);

/* The bar in three pieces, split on the markers in deploy/ns-bar.html. Anything before the
   first marker is the file's own header comment and is dropped. */
const chunks = Object.fromEntries(
  fs.readFileSync(SNIPPET, "utf8").split(/^<!-- @(\w+) -->$/m).slice(1)
    .reduce((pairs, part, i, all) => (i % 2 ? pairs : [...pairs, [part, all[i + 1].trim()]]), [])
);
for (const name of ["style", "nav", "script", "behaviour"]) {
  if (!chunks[name]) { console.error("deploy/ns-bar.html has no @" + name + " chunk"); process.exit(1); }
}
say("read the bar from deploy/ns-bar.html  (style, nav, script, behaviour)");

let t = fs.readFileSync(src, "utf8").replace(/\r\n/g, "\n");

/* Every anchor is asserted unique before anything is replaced. A build that renames one of
   these should stop the deploy, not half-apply it. */
const CANVAS = '<canvas id="sky" class="sky" hidden aria-hidden="true"></canvas>';
const RENDER = "function renderAuth() {\n";
const BOOT = "async function authBoot() {\n  authLoad();\n";
const SCRIPT_END = "</script>";
for (const [name, anchor] of [["</head>", "</head>"], ["sky canvas", CANVAS],
                              ["renderAuth", RENDER], ["authBoot", BOOT],
                              ["closing </script>", SCRIPT_END]]) {
  const n = t.split(anchor).length - 1;
  if (n !== 1) { console.error("anchor '" + name + "' appears " + n + " times, expected 1"); process.exit(1); }
}
say("five anchors found, each exactly once");

t = t.replace("</head>", chunks.style + "\n</head>");
say("namespace switcher styles → before </head>");

t = t.replace(CANVAS, CANVAS + "\n\n" + chunks.nav);
say("nav.ns-bar → after the sky canvas");

/* The bar hides itself for a signed-in visitor, so its sync has to run wherever auth is read.
   In authBoot that is the SYNCHRONOUS read, before the network round-trip — otherwise a
   signed-in visit shows the bar for a moment and then removes it. */
t = t.replace(RENDER, chunks.script + "\n" + RENDER + "  nsBarSync();\n");
t = t.replace(BOOT, BOOT +
  "  /* on the synchronous read, not after the network round-trip — otherwise a\n" +
  "     signed-in visit flashes the bar before removing it */\n  nsBarSync();\n");
say("nsBarSync() defined, and called from renderAuth and authBoot");

/* The dropdown's own behaviour. This page loads neither styles.css nor script.js — it is a
   self-contained app — so the switcher cannot borrow the handler the other eleven pages share.
   Without this the bar renders and does nothing when clicked.

   In its own <script> tag, as the hand-maintained copy had it: an IIFE that touches only the
   DOM has no reason to share scope with the app, and a throw in the app's own script then
   cannot take the switcher down with it. */
t = t.replace(SCRIPT_END, SCRIPT_END + "\n\n<script>\n" + chunks.behaviour + "\n" + SCRIPT_END + "\n");
say("switcher dropdown behaviour → before the closing </script>");

/* Refuse to write rather than write something wrong. */
/* Counts taken from fdfe42d:skillstone/index.html — the last deploy that still had the bar.
   <script> and </script> are in the list because an unbalanced pair is exactly the kind of
   damage that still renders fine at the top of a 3MB page. */
const must = [["ns-bar", 5], ["Connect with Google", 1], ["nsBarSync", 3],
              ["ns-switcher-behaviour", 1], ["ns-trigger", 3], ["ns-panel", 4],
              ["<script>", 2], ["</script>", 2]];
for (const [needle, want] of must) {
  const got = t.split(needle).length - 1;
  if (got !== want) { console.error("expected " + want + " × '" + needle + "', got " + got); process.exit(1); }
}
for (const personal of ["Khevin", "khevinm@"]) {
  const got = t.split(personal).length - 1;
  if (got) { console.error("'" + personal + "' appears " + got + " × in the output — not deploying"); process.exit(1); }
}
say("checked: ns-bar 5, sign-in 1, nsBarSync 3, no personal strings");

fs.writeFileSync(OUT, t);
say("wrote " + path.relative(process.cwd(), OUT) + "  (" + Math.round(t.length / 1024) + "KB)");
console.log("\nskillstone/ is ready — commit and push to deploy.");
