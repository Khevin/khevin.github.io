/* Skillstone — the 3D figure.
   An ES module the app imports on demand (import("assets/3d/figure.js")) when the Character
   column is switched to 3D. Nothing here touches the app's state: the app hands in the
   wardrobe and the avatar, this hands back a canvas that turns.

   Body: Quaternius' Universal Base Characters (CC0), baked by lab/bake-body.py into
   khev-figure.glb with every hairstyle riding the head bone. Garments are derived from the
   body's own surface: a rule over bones and heights, an offset along the normal, the skin
   weights kept, then hung and relaxed so they sit like cloth. Prints are the app's own
   shirtPattern() marks as a repeating texture with cylindrical UVs per panel.

   three.js comes through jsdelivr's +esm endpoint, which rewrites the addons' bare "three"
   imports to the same module, so no import map is needed and the app gains no script tags. */
import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.170.0/+esm";
import { GLTFLoader } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/loaders/GLTFLoader.js/+esm";
import { OrbitControls } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/controls/OrbitControls.js/+esm";
import { RoomEnvironment } from "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/environments/RoomEnvironment.js/+esm";

export const DEFAULT_AVATAR = { skin: "#ad8062", hair: "buzzed", beard: "none", hairColor: "#302720", eyes: "#3a2a1e", height: 1.78, strength: 1, build: 1 };
export const HAIRS = [["buzzed", "Buzzed"], ["parted", "Parted"], ["long", "Long"], ["buns", "Buns"], ["none", "Bald"]];
/* one beard mesh, two ways to wear it: stubble is the same shape drawn as a shadow on the skin */
export const BEARDS = [["none", "None"], ["stubble", "Stubble"], ["short", "Short"]];
const HAIR_MESH = { buzzed: "Hair_Buzzed", parted: "Hair_SimpleParted", long: "Hair_Long", buns: "Hair_Buns" };
const MODEL_HEIGHT = 1.86;                 /* the baked body, crown to sole, before scaling */
const TILE_M = 0.19;                       /* one pattern tile is about 19 cm of cloth */
const hexInt = c => /^#[0-9a-f]{6}$/i.test(c || "") ? parseInt(c.slice(1), 16) : null;
const shirtInk = (c, f) => /^#[0-9a-f]{6}$/i.test(c || "") ? c : f;

/* The light skin map, tinted to a target tone. Calibrated once by eye against the 2D figure:
   #ad8062 on the drawing looked right at #a88f7f on the map, so the tint carries that ratio. */
function skinTint(hex) {
  const c = new THREE.Color(hex), k = [0xa8 / 0xad, 0x8f / 0x80, 0x7f / 0x62];
  return new THREE.Color(Math.min(1, c.r * k[0]), Math.min(1, c.g * k[1]), Math.min(1, c.b * k[2]));
}

/* ---------- the prints (the same five drawings the 2D figure wears) ---------- */
function shirtPatternSVG(it) {
  const a = shirtInk(it.printColor, "#202326"), b = it.printSecond ? shirtInk(it.printColor2, "#779b83") : a, k = it.pattern || "sticks";
  let marks = "";
  if (k === "sticks") marks = '<path d="M2 2l2 4m5-5-1 5m5 3 3-2M3 12l-1 4m6-6 2 4m5 1 1 3" fill="none" stroke="' + a + '" stroke-width=".8" stroke-linecap="round"/><path d="M6 7l1 3m9-6-2 2" stroke="' + b + '" stroke-width=".8"/>';
  else if (k === "abstract") marks = '<path d="M4 2 8 1l3 3-1 6-5 2-3-4ZM16 15l4-2 3 4-1 5-5 1-3-4Z" fill="' + a + '"/><path d="M19 3l3 2-1 4-4-1Z" fill="' + b + '"/>';
  else if (k === "spots") marks = '<path d="M3 2q4-2 4 2l-1 3q-4 2-4-2ZM12 11q3-2 4 1l-1 4q-4 2-5-1Z" fill="' + a + '"/><path d="M13 2q3-1 3 2l-2 2-2-2Z" fill="' + b + '"/>';
  else if (k === "flowers") marks = '<g fill="' + a + '"><path d="M6 2C1-2-1 5 3 7c-4 5 3 9 6 5 6 2 9-5 4-7 1-5-5-7-7-3Z"/></g><path d="M20 17c-4-5-9 0-6 4-4 3 1 8 5 5 5 4 9-2 5-5 2-4-1-6-4-4Z" fill="' + b + '"/><g fill="' + shirtInk(it.color, "#172026") + '"><circle cx="7" cy="7" r="2.2"/><circle cx="20" cy="22" r="2"/></g>';
  else marks = '<path d="M8 9q-3 8 1 14m-1-6q-7 0-6-5 5-1 6 5m0 2q7-1 6-6-5 0-6 6" fill="' + b + '" stroke="' + b + '" stroke-width=".6"/><path d="M8 3c-4-3-7 2-4 4-2 4 4 6 5 3 5 1 6-5 2-5Z" fill="' + a + '"/><path d="M6 6q4-3 4 2" fill="none" stroke="' + shirtInk(it.color, "#172026") + '" stroke-width=".7"/>';
  const size = k === "flowers" ? 30 : k === "sprigs" ? 32 : k === "abstract" ? 24 : 18;
  return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 ' + size + " " + size + '"><rect width="' + size + '" height="' + size + '" fill="' + shirtInk(it.color, "#6b6257") + '"/>' + marks + "</svg>";
}
async function patternTexture(it) {
  const img = new Image(); const url = URL.createObjectURL(new Blob([shirtPatternSVG(it)], { type: "image/svg+xml" }));
  await new Promise((res, rej) => { img.onload = res; img.onerror = rej; img.src = url; });
  const px = 256, cv = document.createElement("canvas"); cv.width = px; cv.height = px;
  cv.getContext("2d").drawImage(img, 0, 0, px, px); URL.revokeObjectURL(url);
  const tex = new THREE.CanvasTexture(cv); tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return tex;
}

/* ---------- how cloth sits ----------
   HANG: below the armpit nothing on a shirt may be narrower than what is above it in the same
   direction, because fabric falls from the widest point. RELAX: Laplacian smoothing takes the
   muscle out, boundary rings hold their height (they are the cut) and slide sideways, and a
   clearance check keeps the cloth off the skin. */
function relaxShell(pos, index, base, nrm, tags, offset, opts, pinned) {
  const count = pos.length / 3;
  const nb = Array.from({ length: count }, () => new Set()), edges = new Map();
  for (let f = 0; f < index.length; f += 3) {
    const t = [index[f], index[f + 1], index[f + 2]];
    for (let k = 0; k < 3; k++) { const a = t[k], b = t[(k + 1) % 3]; nb[a].add(b); nb[b].add(a); const key = a < b ? a + "_" + b : b + "_" + a; edges.set(key, (edges.get(key) || 0) + 1); }
  }
  const boundary = new Uint8Array(count);
  for (const [key, c] of edges) if (c === 1) { const [a, b] = key.split("_").map(Number); boundary[a] = 1; boundary[b] = 1; }
  if (opts.hang) {
    const { cx, cz, top: topY, sectors = 40 } = opts.hang, order = [];
    for (let v = 0; v < count; v++) if (tags[v].torso) order.push(v);
    order.sort((a, b) => pos[b * 3 + 1] - pos[a * 3 + 1]);
    const runMax = new Float32Array(sectors);
    for (const v of order) {
      const x = pos[v * 3] - cx, z = pos[v * 3 + 2] - cz, y = pos[v * 3 + 1];
      const sec = ((Math.floor((Math.atan2(z, x) + Math.PI) / (2 * Math.PI) * sectors) % sectors) + sectors) % sectors, r = Math.hypot(x, z);
      if (y > topY) { runMax[sec] = Math.max(runMax[sec], r); continue; }
      const mix = 0.3 + 0.45 * Math.max(0, 1 - (topY - y) / 0.3);
      const want = Math.max(r, r + (runMax[sec] - r) * mix);
      if (want > r) { const k = want / r; pos[v * 3] = cx + x * k; pos[v * 3 + 2] = cz + z * k; }
      runMax[sec] = Math.max(runMax[sec], want);
    }
  }
  const iters = opts.iters ?? 6, lambda = 0.5, tmp = new Float32Array(pos.length);
  for (let it = 0; it < iters; it++) {
    for (let v = 0; v < count; v++) {
      if (nb[v].size === 0 || (pinned && pinned[v])) { tmp[v * 3] = pos[v * 3]; tmp[v * 3 + 1] = pos[v * 3 + 1]; tmp[v * 3 + 2] = pos[v * 3 + 2]; continue; }
      let ax = 0, ay = 0, az = 0; for (const u of nb[v]) { ax += pos[u * 3]; ay += pos[u * 3 + 1]; az += pos[u * 3 + 2]; }
      const m = nb[v].size;
      tmp[v * 3] = pos[v * 3] + lambda * (ax / m - pos[v * 3]); tmp[v * 3 + 2] = pos[v * 3 + 2] + lambda * (az / m - pos[v * 3 + 2]);
      tmp[v * 3 + 1] = boundary[v] ? pos[v * 3 + 1] : pos[v * 3 + 1] + lambda * (ay / m - pos[v * 3 + 1]);
    }
    pos.set(tmp);
    for (let v = 0; v < count; v++) {
      const dx = pos[v * 3] - base[v * 3], dy = pos[v * 3 + 1] - base[v * 3 + 1], dz = pos[v * 3 + 2] - base[v * 3 + 2];
      const d = dx * nrm[v * 3] + dy * nrm[v * 3 + 1] + dz * nrm[v * 3 + 2], want = offset * 0.7;
      if (d < want) { const k = want - d; pos[v * 3] += nrm[v * 3] * k; pos[v * 3 + 1] += nrm[v * 3 + 1] * k; pos[v * 3 + 2] += nrm[v * 3 + 2] * k; }
    }
  }
  return boundary;
}

/* ---------- the figure ---------- */
export async function createFigure({ url, width = 244, height = 520, pixelRatio = Math.min(devicePixelRatio || 1, 2) } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(pixelRatio); renderer.setSize(width, height);
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.setClearColor(0x000000, 0);
  const canvas = renderer.domElement; canvas.className = "iv-figure3d";

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.35;
  const camera = new THREE.PerspectiveCamera(30, width / height, 0.05, 50);
  const controls = new OrbitControls(camera, canvas);
  controls.enablePan = false; controls.enableZoom = false; controls.maxPolarAngle = Math.PI * 0.55; controls.minPolarAngle = Math.PI * 0.3;
  scene.add(new THREE.HemisphereLight(0xfff1dc, 0x1a1510, 0.55));
  const key = new THREE.DirectionalLight(0xffe4bd, 2.6); key.position.set(2.2, 3.6, 2.4); key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024); key.shadow.camera.near = 1; key.shadow.camera.far = 10;
  key.shadow.camera.left = key.shadow.camera.bottom = -1.5; key.shadow.camera.right = key.shadow.camera.top = 1.5; key.shadow.bias = -0.0008; key.shadow.normalBias = 0.02;
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xbfd0ff, 0.5); fill.position.set(-2.5, 2, -2); scene.add(fill);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(1.1, 64), new THREE.MeshStandardMaterial({ color: 0x1a1712, roughness: 1 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const catcher = new THREE.Mesh(new THREE.PlaneGeometry(6, 6), new THREE.ShadowMaterial({ opacity: 0.55 }));
  catcher.rotation.x = -Math.PI / 2; catcher.position.y = 0.001; catcher.receiveShadow = true; scene.add(catcher);

  /* the body */
  const gltf = await new GLTFLoader().loadAsync(url);
  const root = gltf.scene; scene.add(root);
  let body = null; const bones = {}, hairs = {}; let eyes = null, brows = null, beard = null;
  root.traverse(o => {
    if (o.isBone) bones[o.name] = o;
    if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; o.frustumCulled = false; }
    if (o.isSkinnedMesh && /superhero|male|body/i.test(o.name)) body = o;
    if (o.isMesh && /^Hair_/.test(o.name)) { o.material = o.material.clone(); if (/Beard/.test(o.name)) beard = o; else hairs[o.name] = o; }
    if (o.isMesh && /eyebrow/i.test(o.name)) { brows = o; o.material = o.material.clone(); }
    if (o.isMesh && /^Eyes/i.test(o.name)) { eyes = o; o.material = o.material.clone(); }
  });
  if (!body) throw new Error("figure: no body mesh in " + url);
  body.material = body.material.clone(); body.material.roughness = 0.62;

  /* the skin, tagged: dominant bone, along-bone t, height, radius — and the bind-pose bone axes */
  const geo = body.geometry, P = geo.attributes.position, N = geo.attributes.normal, SI = geo.attributes.skinIndex, SW = geo.attributes.skinWeight, IDX = geo.index;
  const P0 = P.array.slice();                          /* the body as shipped; shaping starts from here */
  body.skeleton.pose(); root.updateMatrixWorld(true);
  const invMesh = new THREE.Matrix4().copy(body.matrixWorld).invert(), head = {}, axis = {};
  for (const b of body.skeleton.bones) head[b.name] = new THREE.Vector3().setFromMatrixPosition(b.matrixWorld).applyMatrix4(invMesh);
  for (const b of body.skeleton.bones) {
    const child = b.children.find(c => c.isBone && head[c.name]);
    const a = child ? head[child.name].clone().sub(head[b.name]) : (b.parent && head[b.parent.name] ? head[b.name].clone().sub(head[b.parent.name]) : new THREE.Vector3(0, 1, 0));
    axis[b.name] = { len: a.length() || 1, dir: a.normalize() };
  }
  /* a relaxed stance: the pack rests with the arms out. Applied only now, because pose() above
     put the skeleton back into its bind pose to read the axes; shells are skinned, so they follow. */
  const rot = (n, x, y, z) => { const b = bones[n]; if (b) { b.rotation.x += x; b.rotation.y += y; b.rotation.z += z; } };
  rot("upperarm_l", 0.10, 0, -1.28); rot("upperarm_r", 0.10, 0, 1.28); rot("lowerarm_l", 0, 0, -0.22); rot("lowerarm_r", 0, 0, 0.22);
  root.updateMatrixWorld(true);
  const boneOf = i => body.skeleton.bones[i];
  const dom = new Int32Array(P.count);
  for (let v = 0; v < P.count; v++) { let best = 0; for (let k = 1; k < 4; k++) if (SW.getComponent(v, k) > SW.getComponent(v, best)) best = k; dom[v] = SI.getComponent(v, best); }
  /* the skin's seam-duplicate vertices, welded: one shell vertex per position, normal averaged */
  const CANON = new Int32Array(P.count), AVGN = new Float32Array(P.count * 3);
  let vTag, Y, SPINE, armAxis = {};
  const TORSO = new Set(["spine_01", "spine_02", "spine_03", "clavicle_l", "clavicle_r"]);
  const ARM_U = new Set(["upperarm_l", "upperarm_r"]), ARM_L = new Set(["lowerarm_l", "lowerarm_r"]), THIGH = new Set(["thigh_l", "thigh_r"]), CALF = new Set(["calf_l", "calf_r"]);
  const FOOT = new Set(["foot_l", "foot_r", "ball_l", "ball_r", "ball_leaf_l", "ball_leaf_r"]);

  /* Shaping: every vertex is pulled toward or pushed from its bone's axis by a factor. The free
     body is the pack's Superhero proportion, so 1.0 is already slimmed; strength scales the arms,
     shoulders and chest around that, build the trunk, hips and thighs. Garments are derived from
     the shaped skin, so they follow. */
  function shapeBody(avatar) {
    const s = avatar.strength ?? 1, b = avatar.build ?? 1;
    const amounts = { upperarm_l: 0.84 * s, upperarm_r: 0.84 * s, lowerarm_l: 0.86 * s, lowerarm_r: 0.86 * s, clavicle_l: 0.92 * s, clavicle_r: 0.92 * s, spine_03: 0.93 * s,
      spine_02: 0.89 * b, spine_01: 0.87 * b, pelvis: 0.93 * b, thigh_l: 0.93 * b, thigh_r: 0.93 * b, calf_l: 0.92 * Math.sqrt(b), calf_r: 0.92 * Math.sqrt(b) };
    const p = new THREE.Vector3(), q = new THREE.Vector3();
    for (let v = 0; v < P.count; v++) {
      const bone = boneOf(dom[v]).name, f = amounts[bone];
      p.set(P0[v * 3], P0[v * 3 + 1], P0[v * 3 + 2]);
      if (f) { const h = head[bone], ax = axis[bone], t = p.clone().sub(h).dot(ax.dir); q.copy(h).addScaledVector(ax.dir, t); p.sub(q).multiplyScalar(f).add(q); }
      P.setXYZ(v, p.x, p.y, p.z);
    }
    P.needsUpdate = true; geo.computeVertexNormals(); geo.computeBoundingSphere();
    /* re-tag and re-weld on the shaped skin */
    const seen = new Map(), key = v => Math.round(P.getX(v) * 1e4) + "," + Math.round(P.getY(v) * 1e4) + "," + Math.round(P.getZ(v) * 1e4);
    AVGN.fill(0);
    for (let v = 0; v < P.count; v++) { const k = key(v); if (!seen.has(k)) seen.set(k, v); CANON[v] = seen.get(k); }
    for (let v = 0; v < P.count; v++) { const c = CANON[v]; AVGN[c * 3] += N.getX(v); AVGN[c * 3 + 1] += N.getY(v); AVGN[c * 3 + 2] += N.getZ(v); }
    for (let v = 0; v < P.count; v++) { if (CANON[v] !== v) continue; const l = Math.hypot(AVGN[v * 3], AVGN[v * 3 + 1], AVGN[v * 3 + 2]) || 1; AVGN[v * 3] /= l; AVGN[v * 3 + 1] /= l; AVGN[v * 3 + 2] /= l; }
    vTag = new Array(P.count);
    for (let v = 0; v < P.count; v++) {
      const bone = boneOf(dom[v]).name, h = head[bone], ax = axis[bone];
      p.fromBufferAttribute(P, v);
      vTag[v] = { bone, t: h && ax ? p.clone().sub(h).dot(ax.dir) / ax.len : 0, y: p.y, r: Math.hypot(p.x, p.z), x: p.x, z: p.z };
    }
    Y = { neck: head.neck_01.y, pelvis: head.pelvis.y, thigh: head.thigh_l.y, foot: head.foot_l.y };
    SPINE = { cx: (head.spine_01.x + head.spine_03.x) / 2, cz: (head.spine_01.z + head.spine_03.z) / 2, r: 0.17 };
    for (const bn of ["upperarm_l", "upperarm_r", "lowerarm_l", "lowerarm_r"]) {
      const dir = axis[bn].dir.clone(), n1 = new THREE.Vector3(0, 1, 0).cross(dir).normalize(); if (n1.lengthSq() < 1e-6) n1.set(1, 0, 0);
      armAxis[bn] = { head: head[bn].clone(), dir, n1, n2: dir.clone().cross(n1).normalize() };
    }
  }

  /* ---------- garments ---------- */
  let garments = [];
  const cloth = (hex, rough = 0.92) => new THREE.MeshStandardMaterial({ color: hex, roughness: rough, metalness: 0, side: THREE.DoubleSide });
  function derive(name, rule, offset, material, clamp, opts = {}) {
    /* a clamp may EXCLUDE a vertex (false: the inside of an opening) or PIN one it moved sideways */
    const keep = new Uint8Array(P.count);
    for (let v = 0; v < P.count; v++) keep[v] = rule(vTag[v]) && !(clamp && clamp(vTag[v]) === false) ? 1 : 0;
    const pos = [], nor = [], si = [], sw = [], base = [], nrms = [], tags = [], pins = [], map = new Int32Array(P.count).fill(-1);
    const take = v0 => {
      const v = CANON[v0]; if (map[v] >= 0) return map[v];
      const i = pos.length / 3; map[v] = i;
      const nx = AVGN[v * 3], ny = AVGN[v * 3 + 1], nz = AVGN[v * 3 + 2];
      let x = P.getX(v) + nx * offset, y = P.getY(v) + ny * offset, z = P.getZ(v) + nz * offset;
      let pin = 0;
      if (clamp) { const c = clamp(vTag[v]); if (typeof c === "number") y = c; else if (c) { if (c.x != null) { x = c.x; pin = 1; } if (c.y != null) y = c.y; if (c.z != null) { z = c.z; pin = 1; } } }
      pos.push(x, y, z); nor.push(nx, ny, nz); pins.push(pin);
      for (let k = 0; k < 4; k++) { si.push(SI.getComponent(v, k)); sw.push(SW.getComponent(v, k)); }
      base.push(P.getX(v), P.getY(v), P.getZ(v)); nrms.push(nx, ny, nz);
      const tg = vTag[v];
      tags.push({ torso: TORSO.has(tg.bone) || tg.bone === "pelvis" || THIGH.has(tg.bone) || tg.bone === "neck_01" || tg.bone === "spine_01", side: tg.bone.endsWith("_l") ? "l" : tg.bone.endsWith("_r") ? "r" : null, src: v });
      return i;
    };
    const index = [];
    for (let f = 0; f < IDX.count; f += 3) {
      const a = IDX.getX(f), b = IDX.getX(f + 1), c = IDX.getX(f + 2);
      if (keep[a] + keep[b] + keep[c] === 3) index.push(take(a), take(b), take(c));
    }
    let boundary = null;
    if (opts.relax) {
      const posF = new Float32Array(pos);
      boundary = relaxShell(posF, index, base, nrms, tags, offset, { hang: opts.hang ? { cx: SPINE.cx, cz: SPINE.cz, top: Y.neck - 0.15 } : null, iters: opts.iters }, pins);
      for (let i = 0; i < pos.length; i++) pos[i] = posF[i];
    }
    /* the collar and placket are built from positions, captured here because the print remap
       below re-indexes every array */
    const info = { boundaryPts: [], torsoPts: [] };
    for (let v = 0; v < pos.length / 3; v++) {
      const pt = [pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]];
      if (boundary && boundary[v]) info.boundaryPts.push(pt);
      if (tags[v].torso) info.torsoPts.push(pt);
    }
    let uvOut = null;
    if (opts.uv === "cylinder") {
      const torsoUV = v => { const dx = pos[v * 3] - SPINE.cx, dz = pos[v * 3 + 2] - SPINE.cz; return [Math.atan2(dz, dx) / (2 * Math.PI) * (2 * Math.PI * SPINE.r) / TILE_M, pos[v * 3 + 1] / TILE_M]; };
      const armUV = (v, ax) => { const p = new THREE.Vector3(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]).sub(ax.head), t = p.dot(ax.dir), radial = p.clone().addScaledVector(ax.dir, -t);
        return [Math.atan2(radial.dot(ax.n2), radial.dot(ax.n1)) / (2 * Math.PI) * (2 * Math.PI * 0.05) / TILE_M, t / TILE_M]; };
      const PANEL = { torso: { uv: torsoUV, R: (2 * Math.PI * SPINE.r) / TILE_M }, arm_l: { uv: v => armUV(v, armAxis.upperarm_l), R: (2 * Math.PI * 0.05) / TILE_M }, arm_r: { uv: v => armUV(v, armAxis.upperarm_r), R: (2 * Math.PI * 0.05) / TILE_M } };
      const panelOf = tri => { const t = tri.filter(v => tags[v].torso).length; if (t >= 2) return "torso"; const side = tri.map(v => tags[v].side).find(x => x); return side ? "arm_" + side : "torso"; };
      const P2 = [], N2 = [], S2 = [], W2 = [], U2 = [], I2 = [], T2 = [], seen = new Map();
      const copy = (v, panel) => {
        const k = panel + ":" + v; if (seen.has(k)) return seen.get(k);
        const j = P2.length / 3; seen.set(k, j);
        P2.push(pos[v * 3], pos[v * 3 + 1], pos[v * 3 + 2]); N2.push(nor[v * 3], nor[v * 3 + 1], nor[v * 3 + 2]);
        for (let q = 0; q < 4; q++) { S2.push(si[v * 4 + q]); W2.push(sw[v * 4 + q]); }
        const [u, w] = PANEL[panel].uv(v); U2.push(u, w); T2.push(panel); return j;
      };
      for (let f = 0; f < index.length; f += 3) { const tri = [index[f], index[f + 1], index[f + 2]], panel = panelOf(tri); I2.push(copy(tri[0], panel), copy(tri[1], panel), copy(tri[2], panel)); }
      for (let f = 0; f < I2.length; f += 3) {
        const tri = [I2[f], I2[f + 1], I2[f + 2]], R = PANEL[T2[tri[0]]].R, us = tri.map(v => U2[v * 2]), hi = Math.max(...us);
        for (let k = 0; k < 3; k++) if (hi - us[k] > R / 2) {
          const v = tri[k], j = P2.length / 3;
          P2.push(P2[v * 3], P2[v * 3 + 1], P2[v * 3 + 2]); N2.push(N2[v * 3], N2[v * 3 + 1], N2[v * 3 + 2]);
          for (let q = 0; q < 4; q++) { S2.push(S2[v * 4 + q]); W2.push(W2[v * 4 + q]); }
          U2.push(us[k] + R, U2[v * 2 + 1]); T2.push(T2[v]); I2[f + k] = j;
        }
      }
      pos.length = 0; for (const x of P2) pos.push(x); nor.length = 0; for (const x of N2) nor.push(x);
      si.length = 0; for (const x of S2) si.push(x); sw.length = 0; for (const x of W2) sw.push(x);
      index.length = 0; for (const x of I2) index.push(x); uvOut = U2;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    g.setAttribute("skinIndex", new THREE.Uint16BufferAttribute(si, 4));
    g.setAttribute("skinWeight", new THREE.Float32BufferAttribute(sw, 4));
    if (uvOut) g.setAttribute("uv", new THREE.Float32BufferAttribute(uvOut, 2));
    g.setIndex(index);
    if (clamp || opts.relax) g.computeVertexNormals();
    const m = new THREE.SkinnedMesh(g, material);
    m.name = name; m.castShadow = true; m.receiveShadow = true; m.frustumCulled = false;
    body.parent.add(m); m.bind(body.skeleton, body.bindMatrix); garments.push(m);
    m.userData.shell = { pos, si, sw, info };
    return m;
  }
  /* a piece of geometry skinned by copying the weights of the nearest shell vertex */
  function skinnedPiece(name, g, material, shell) {
    const n = g.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4), pa = g.attributes.position;
    for (let i = 0; i < n; i++) {
      let best = 0, bd = Infinity; const x = pa.getX(i), y = pa.getY(i), z = pa.getZ(i);
      for (let v = 0; v < shell.pos.length / 3; v++) { const d = (shell.pos[v * 3] - x) ** 2 + (shell.pos[v * 3 + 1] - y) ** 2 + (shell.pos[v * 3 + 2] - z) ** 2; if (d < bd) { bd = d; best = v; } }
      for (let q = 0; q < 4; q++) { si[i * 4 + q] = shell.si[best * 4 + q]; sw[i * 4 + q] = shell.sw[best * 4 + q]; }
    }
    g.setAttribute("skinIndex", new THREE.BufferAttribute(si, 4)); g.setAttribute("skinWeight", new THREE.BufferAttribute(sw, 4));
    const m = new THREE.SkinnedMesh(g, material); m.name = name; m.castShadow = true; m.frustumCulled = false;
    body.parent.add(m); m.bind(body.skeleton, body.bindMatrix); garments.push(m); return m;
  }
  function sole(boneName, material, thick = 0.026) {
    const bi = body.skeleton.bones.findIndex(b => b.name === boneName), side = boneName.slice(-2);
    const min = new THREE.Vector3(Infinity, Infinity, Infinity), max = new THREE.Vector3(-Infinity, -Infinity, -Infinity);
    for (let v = 0; v < P.count; v++) { const t = vTag[v]; if (!(t.bone === boneName || t.bone === "ball" + side || t.bone === "ball_leaf" + side)) continue;
      min.x = Math.min(min.x, P.getX(v)); max.x = Math.max(max.x, P.getX(v)); min.z = Math.min(min.z, P.getZ(v)); max.z = Math.max(max.z, P.getZ(v)); }
    min.x -= 0.014; max.x += 0.014; min.z -= 0.012; max.z += 0.022;
    /* the footprint as a rounded outline, extruded and bevelled, rather than a box */
    const w = max.x - min.x, d = max.z - min.z, r = Math.min(w, d) * 0.45, sh = new THREE.Shape();
    const x0 = min.x, y0 = -max.z;   /* the extrusion is turned onto the floor below, which mirrors z */
    sh.moveTo(x0 + r, y0); sh.lineTo(x0 + w - r, y0); sh.quadraticCurveTo(x0 + w, y0, x0 + w, y0 + r); sh.lineTo(x0 + w, y0 + d - r); sh.quadraticCurveTo(x0 + w, y0 + d, x0 + w - r, y0 + d);
    sh.lineTo(x0 + r, y0 + d); sh.quadraticCurveTo(x0, y0 + d, x0, y0 + d - r); sh.lineTo(x0, y0 + r); sh.quadraticCurveTo(x0, y0, x0 + r, y0);
    const g = new THREE.ExtrudeGeometry(sh, { depth: thick, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.003, bevelSegments: 2, curveSegments: 6 });
    g.rotateX(-Math.PI / 2); g.translate(0, 0.002, 0);
    const n = g.attributes.position.count, si = new Uint16Array(n * 4), sw = new Float32Array(n * 4);
    for (let i = 0; i < n; i++) { si[i * 4] = bi; sw[i * 4] = 1; }
    g.setAttribute("skinIndex", new THREE.BufferAttribute(si, 4)); g.setAttribute("skinWeight", new THREE.BufferAttribute(sw, 4));
    const m = new THREE.SkinnedMesh(g, material); m.name = "sole" + side; m.castShadow = true; m.frustumCulled = false;
    body.parent.add(m); m.bind(body.skeleton, body.bindMatrix); garments.push(m); return m;
  }

  /* A button-up's front: the V is the cut, the placket a strip proud of the cloth along the
     front centre, the buttons small and few, the collar a band on the neckline with two points
     lying on the chest. Built on the shell after it has hung, so the collar follows its neckline. */
  function shirtFront(shellMesh, material, style) {
    const shell = shellMesh.userData.shell, { info } = shell;
    const COLLAR = Y.neck - 0.018, cx = SPINE.cx, cz = SPINE.cz;
    /* the neckline ring: boundary points near the collar line and near the neck, in angle order */
    const ring = info.boundaryPts.filter(p => Math.abs(p[1] - COLLAR) < 0.03 && Math.hypot(p[0] - cx, p[2] - cz) < 0.14)
      .sort((a, b) => Math.atan2(a[2] - cz, a[0] - cx) - Math.atan2(b[2] - cz, b[0] - cx));
    if (ring.length < 6) return;
    const at = p => new THREE.Vector3(p[0], p[1], p[2]);
    const out = p => new THREE.Vector3(p[0] - cx, 0, p[2] - cz).normalize();
    const pos = null;
    /* collar band: a strip standing up from the ring, leaning out, skipping the V at the front */
    const bandH = style.collarH, lean = 0.012, bp = [], bi = [];
    /* resampled: 36 even angles round the neck, each taking the widest ring point in its bin at
       the collar height, so the band is one clean strip; the front opening is left out */
    const N = 36, bins = Array.from({ length: N }, () => null);
    for (const p of ring) {
      const th = Math.atan2(p[2] - cz, p[0] - cx), i = ((Math.round((th + Math.PI) / (2 * Math.PI) * N) % N) + N) % N, r = Math.hypot(p[0] - cx, p[2] - cz);
      if (!bins[i] || r > bins[i].r) bins[i] = { r, y: p[1] };
    }
    const rs = [];
    for (let i = 0; i < N; i++) {
      const b = bins[i] || bins[(i + N - 1) % N] || bins[(i + 1) % N]; if (!b) continue;
      const th = (i / N) * 2 * Math.PI - Math.PI; rs.push([cx + Math.cos(th) * (b.r + 0.004), Math.min(b.y, COLLAR), cz + Math.sin(th) * (b.r + 0.004)]);
    }
    const front = p => (p[2] - cz) > 0.02 && Math.abs(p[0] - cx) < style.openHalf;
    for (let i = 0; i < rs.length; i++) {
      const a = rs[i], b = rs[(i + 1) % rs.length];
      if (front(a) || front(b)) continue;
      const pa = at(a), pb = at(b), oa = out(a), ob = out(b);
      const qa = pa.clone().addScaledVector(oa, lean).setY(pa.y + bandH), qb = pb.clone().addScaledVector(ob, lean).setY(pb.y + bandH);
      const k = bp.length / 3; bp.push(pa.x, pa.y, pa.z, pb.x, pb.y, pb.z, qb.x, qb.y, qb.z, qa.x, qa.y, qa.z); bi.push(k, k + 1, k + 2, k, k + 2, k + 3);
    }
    /* the two points: triangles from the band's front ends lying down onto the chest */
    const ends = rs.filter(p => !front(p) && (p[2] - cz) > 0).sort((a, b) => a[0] - b[0]);
    if (ends.length >= 2) {
      for (const [v, s] of [[ends[0], -1], [ends[ends.length - 1], 1]]) {
        const p = at(v), o = out(v);
        const tip = p.clone().add(new THREE.Vector3(-s * style.pointIn, -style.pointDrop, 0)).addScaledVector(o, 0.014);
        const outer = p.clone().add(new THREE.Vector3(s * style.pointOut, -style.pointDrop * 0.45, 0)).addScaledVector(o, 0.012);
        const top = p.clone().addScaledVector(o, lean).setY(p.y + bandH);
        const k = bp.length / 3; bp.push(top.x, top.y, top.z, p.x, p.y, p.z, tip.x, tip.y, tip.z, outer.x, outer.y, outer.z); bi.push(k, k + 1, k + 2, k, k + 2, k + 3);
      }
    }
    if (bp.length) { const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(bp, 3)); g.setIndex(bi); g.computeVertexNormals(); skinnedPiece("collar", g, material, shell); }
    /* placket: the front surface along the centre, sampled by height, made a strip a little proud */
    if (style.placketTo != null) {
      const yTop = COLLAR - style.vDepth, yBot = style.placketTo, sp = [], sidx = [];
      const frontZ = y => { let best = null, bd = Infinity; for (const p of info.torsoPts) { const d = Math.abs(p[1] - y) * 3 + Math.abs(p[0] - cx); if (p[2] > cz && d < bd) { bd = d; best = p; } } return best == null ? cz + 0.12 : best[2]; };
      const steps = Math.max(2, Math.round((yTop - yBot) / 0.03)), half = 0.012;
      for (let i = 0; i <= steps; i++) {
        const y = yTop - (yTop - yBot) * i / steps, z = frontZ(y) + 0.004;
        sp.push(cx - half, y, z, cx + half, y, z);
        if (i) { const k = i * 2; sidx.push(k - 2, k - 1, k + 1, k - 2, k + 1, k); }
      }
      const g = new THREE.BufferGeometry(); g.setAttribute("position", new THREE.Float32BufferAttribute(sp, 3)); g.setIndex(sidx); g.computeVertexNormals();
      skinnedPiece("placket", g, material, shell);
      const bm = new THREE.MeshStandardMaterial({ color: style.buttonColor, roughness: 0.5 });
      for (let y = yTop - 0.02; y > yBot + 0.02; y -= style.buttonGap) {
        const bg = new THREE.SphereGeometry(0.006, 10, 8); bg.translate(cx, y, frontZ(y) + 0.009);
        skinnedPiece("button", bg, bm, shell);
      }
    }
  }

  /* the cuts */
  let RULES, CLAMP, HEM, WAIST, ANKLE, KNEE, COLLAR;
  function makeRules() {
    WAIST = Y.pelvis + 0.045; HEM = WAIST - 0.045; ANKLE = Y.foot + 0.05; KNEE = Y.thigh - 0.30; COLLAR = Y.neck - 0.018;
    const BAND = 0.03;
    const collar = v => v.bone === "Head" || (v.r < 0.11 && v.y > COLLAR + BAND);
    const neckline = v => { if (v.r >= 0.11) return null; const dip = COLLAR - 0.045 * Math.max(0, Math.min(1, (v.z - SPINE.cz) / 0.08)); return v.y > dip ? dip : null; };
    /* an open front: inside the V the cloth is pulled sideways to the V's edge, so the edge is straight */
    const vee = (depth, halfAtCollar) => v => {
      const dz = v.z - SPINE.cz, dx = v.x - SPINE.cx;
      if (dz < 0.02 || Math.hypot(dx, dz) > 0.2) return neckline(v);
      const yBot = COLLAR - depth; if (v.y < yBot || v.y > COLLAR + BAND) return v.y > COLLAR ? COLLAR : null;
      const w = halfAtCollar * (v.y - yBot) / depth;
      if (Math.abs(dx) < w * 0.55) return false;
      if (Math.abs(dx) < w * 2.2) return { x: SPINE.cx + (dx < 0 ? -w : w), y: Math.min(v.y, COLLAR) };
      return v.y > COLLAR ? COLLAR : null;
    };
    const torsoish = v => TORSO.has(v.bone) || v.bone === "pelvis" || THIGH.has(v.bone);
    const LEGS = v => v.bone === "pelvis" || THIGH.has(v.bone) || CALF.has(v.bone) || FOOT.has(v.bone) || (v.bone === "spine_01" && v.y <= WAIST + BAND);
    RULES = {
      tee:      v => !collar(v) && ((torsoish(v) && v.y > HEM - BAND) || (ARM_U.has(v.bone) && v.t < 0.5)),
      shirt:    v => !collar(v) && ((torsoish(v) && v.y > HEM - 0.03 - BAND) || (ARM_U.has(v.bone) && v.t < 0.8)),
      tank:     v => !collar(v) && torsoish(v) && v.y > HEM - BAND && !(v.bone.startsWith("clavicle") && Math.abs(v.x) > 0.12) && !(v.y > Y.neck - 0.07 && v.r < 0.11),
      long:     v => !collar(v) && ((torsoish(v) && v.y > HEM - 0.02 - BAND) || ARM_U.has(v.bone) || (ARM_L.has(v.bone) && v.t < 0.92)),
      trousers: v => LEGS(v) && v.y <= WAIST + BAND && v.y > ANKLE - BAND,
      shorts:   v => LEGS(v) && v.y <= WAIST + BAND && v.y > KNEE - BAND,
      briefs:   v => (LEGS(v) || v.bone === "spine_01" || v.bone === "spine_02") && v.y <= WAIST + 0.09 + BAND && v.y > Y.thigh - 0.15 - BAND,
      shoes:    v => (FOOT.has(v.bone) || CALF.has(v.bone)) && v.y < ANKLE + 0.012,
      boots:    v => (FOOT.has(v.bone) || CALF.has(v.bone)) && v.y < Y.foot + 0.22,
    };
    CLAMP = {
      tee:      v => torsoish(v) && v.y < HEM ? HEM : neckline(v),
      tank:     v => torsoish(v) && v.y < HEM ? HEM : neckline(v),
      long:     v => torsoish(v) && v.y < HEM - 0.02 ? HEM - 0.02 : neckline(v),
      shirtOpen2: v => torsoish(v) && v.y < HEM - 0.03 ? HEM - 0.03 : vee(0.13, 0.045)(v),
      shirtOpen1: v => torsoish(v) && v.y < HEM - 0.03 ? HEM - 0.03 : vee(0.075, 0.035)(v),
      shirtClosed: v => torsoish(v) && v.y < HEM - 0.03 ? HEM - 0.03 : (v.r < 0.11 && v.y > COLLAR ? COLLAR : null),
      vneck:    v => torsoish(v) && v.y < HEM - 0.02 ? HEM - 0.02 : vee(0.12, 0.06)(v),
      trousers: v => v.y > WAIST ? WAIST : v.y < ANKLE ? ANKLE : null,
      shorts:   v => v.y > WAIST ? WAIST : v.y < KNEE ? KNEE : null,
      briefs:   v => v.y > WAIST + 0.09 ? WAIST + 0.09 : v.y < Y.thigh - 0.15 ? Y.thigh - 0.15 : null,
      shoes: null, boots: null,
    };
  }

  const TOP_RULE = { tee: "tee", polo: "shirt", printed: "shirt", tank: "tank", shirt: "long" };
  const LEG_RULE = { jeans: "trousers", chinos: "trousers", joggers: "trousers", cargo: "trousers", shorts: "shorts" };
  const FEET_RULE = { sneakers: "shoes", lowtop: "shoes", loafers: "shoes", boots: "boots", hightop: "boots", flipflops: null };
  const SHIRT_STYLE = {
    printed: { vDepth: 0.13, openHalf: 0.045, collarH: 0.032, pointDrop: 0.075, pointIn: 0.03, pointOut: 0.055, placketTo: null, buttonGap: 0.075, buttonColor: 0x1a1714 },
    polo:    { vDepth: 0.075, openHalf: 0.035, collarH: 0.03, pointDrop: 0.06, pointIn: 0.025, pointOut: 0.045, placketTo: null, buttonGap: 0.045, buttonColor: 0x2a2624 },
    shirt:   { vDepth: 0.0, openHalf: 0.0, collarH: 0.034, pointDrop: 0.07, pointIn: 0.028, pointOut: 0.05, placketTo: null, buttonGap: 0.085, buttonColor: 0xe8e1cf },
  };
  function undress() { for (const g of garments) { g.parent && g.parent.remove(g); g.geometry.dispose(); } garments = []; }
  let currentWardrobe = null;
  function setOutfit(w) {
    currentWardrobe = w; undress();
    const worn = {}; if (w) for (const k of Object.keys(w.worn || {})) worn[k] = (w.items || []).find(x => x.id === w.worn[k]);
    const top = worn.top, outer = worn.outer, legs = worn.legs, feet = worn.feet;
    if (!legs || !top) derive("briefs", RULES.briefs, 0.012, cloth(0x2b2b2a), CLAMP.briefs);
    if (legs) {
      const legKind = legs.kind, legRule = LEG_RULE[legKind] || "trousers";
      derive("legs", RULES[legRule], legKind === "cargo" ? 0.03 : legKind === "joggers" ? 0.024 : 0.019, cloth(hexInt(legs.color) ?? 0x3a3835), CLAMP[legRule]);
    }
    if (feet && FEET_RULE[feet.kind] !== null) {
      const fr = FEET_RULE[feet.kind] || "shoes", shoeC = hexInt(feet.color) ?? 0x1b1a17, star = feet.kind === "lowtop" || feet.kind === "hightop";
      const shoeOpts = { relax: true, iters: 5, hang: false };
      derive("feet", RULES[fr], 0.02, cloth(shoeC, 0.55), CLAMP[fr], shoeOpts);
      if (star) { let footZ = -Infinity; for (let v = 0; v < P.count; v++) if (FOOT.has(vTag[v].bone)) footZ = Math.max(footZ, vTag[v].z);
        const capZ = footZ - 0.075;
        derive("toecap", v => RULES[fr](v) && v.z > capZ - 0.03 && v.y < Y.foot + 0.06, 0.026, cloth(0xe9e4d8, 0.5), v => v.z < capZ ? { z: capZ } : null, shoeOpts); }
      const soleM = cloth(star ? 0xe9e4d8 : feet.kind === "sneakers" ? new THREE.Color(shoeC).multiplyScalar(0.7).getHex() : 0x1a1714, 0.8);
      sole("foot_l", soleM); sole("foot_r", soleM);
    }
    const topKind = top ? top.kind : null, topRule = TOP_RULE[topKind] || "tee", soft = { relax: true, hang: true, iters: 6 };
    const topC = hexInt(top && top.color) ?? 0xf2efe6;
    if (!top) { /* bare */ }
    else if (topKind === "printed" || topKind === "polo" || topKind === "shirt") {
      const style = SHIRT_STYLE[topKind], clamp = topKind === "printed" ? CLAMP.shirtOpen2 : topKind === "polo" ? CLAMP.shirtOpen1 : CLAMP.shirtClosed;
      const m = topKind === "printed" ? new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.92, metalness: 0, side: THREE.DoubleSide }) : cloth(topC);
      const shell = derive("top", RULES[topRule], 0.03, m, clamp, { ...soft, uv: topKind === "printed" ? "cylinder" : undefined, hang: true });
      if (topKind === "printed") patternTexture(top).then(tex => { m.map = tex; m.needsUpdate = true; });
      const st = { ...style, placketTo: topKind === "polo" ? COLLAR - style.vDepth - 0.09 : HEM - 0.03 + 0.02, buttonColor: topKind === "shirt" ? 0xe8e1cf : style.buttonColor };
      shirtFront(shell, topKind === "printed" ? cloth(topC) : m, st);
    } else derive("top", RULES[topRule], 0.03, cloth(topC), CLAMP[topRule], soft);
    if (outer) {
      const oc = hexInt(outer.color) ?? 0x303d43;
      if (outer.kind === "vneck") derive("outer", RULES.long, 0.044, cloth(oc), CLAMP.vneck, soft);
      else derive("outer", RULES.long, 0.044, cloth(oc), CLAMP.long, soft);
    }
    return garments.map(g => ({ name: g.name, tris: g.geometry.index ? g.geometry.index.count / 3 : g.geometry.attributes.position.count / 3 }));
  }

  /* ---------- the avatar ---------- */
  let avatar = { ...DEFAULT_AVATAR };
  function setAvatar(a) {
    avatar = { ...DEFAULT_AVATAR, ...(a || {}) };
    body.material.color.copy(skinTint(avatar.skin));
    for (const [k, mesh] of Object.entries(hairs)) mesh.visible = HAIR_MESH[avatar.hair] === k;
    const bm = avatar.beard === true ? "short" : (avatar.beard || "none");
    const hc = new THREE.Color(avatar.hairColor);
    for (const mesh of Object.values(hairs)) { mesh.material.color.copy(hc); mesh.material.roughness = 0.75; }
    if (beard) {
      beard.visible = bm !== "none";
      beard.material.color.copy(hc); beard.material.transparent = bm === "stubble"; beard.material.opacity = bm === "stubble" ? 0.45 : 1;
      beard.material.depthWrite = bm !== "stubble"; beard.material.needsUpdate = true;
    }
    if (brows) brows.material.color.copy(hc);
    if (eyes) eyes.material.color.copy(new THREE.Color(avatar.eyes).lerp(new THREE.Color(0xffffff), 0.35));
    const scale = (avatar.height || DEFAULT_AVATAR.height) / MODEL_HEIGHT; root.scale.setScalar(scale);
    shapeBody(avatar); makeRules();
    if (currentWardrobe !== undefined) setOutfit(currentWardrobe);
    frame();
  }

  /* ---------- camera ---------- */
  let angle = 0, spinning = false;
  const H = () => (avatar.height || DEFAULT_AVATAR.height);
  function frame() { controls.target.set(0, H() * 0.515, 0); setAngle(angle); }
  function setAngle(deg) {
    angle = ((deg % 360) + 360) % 360; const a = angle * Math.PI / 180, h = H(), dist = h * 2.05;
    camera.position.set(Math.sin(a) * dist, h * 0.64, Math.cos(a) * dist); camera.lookAt(controls.target); controls.update();
  }
  controls.addEventListener("change", () => { angle = Math.atan2(camera.position.x, camera.position.z) * 180 / Math.PI; });
  const clock = new THREE.Clock(); let raf = 0, live = true;
  function loop() { if (!live) return; const dt = clock.getDelta(); if (spinning) setAngle(angle + dt * 30); controls.update(); renderer.render(scene, camera); raf = requestAnimationFrame(loop); }
  const reduced = matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  setAvatar(avatar);
  loop();
  return {
    canvas, scene, root, body, bones, get garments() { return garments; }, get angle() { return angle; },
    setOutfit, setAvatar, setAngle: d => { spinning = false; setAngle(d); }, get avatar() { return avatar; },
    spin(on) { spinning = reduced ? false : (on == null ? !spinning : !!on); return spinning; }, get spinning() { return spinning; },
    resize(w, h) { renderer.setSize(w, h); camera.aspect = w / h; camera.updateProjectionMatrix(); },
    render: () => renderer.render(scene, camera),
    dispose() { live = false; cancelAnimationFrame(raf); undress(); renderer.dispose(); controls.dispose(); },
  };
}
