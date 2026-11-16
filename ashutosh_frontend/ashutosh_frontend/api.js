// Owner: Ashutosh - shared helpers and the ONE door to the backend.
// Opened as a file (double-click)  -> mock mode: the UI runs with fake data, no C++ needed.
// Opened from the C++ server (http://localhost:3000) -> real mode: every call goes to POST /api/<name>.
const USE_MOCK = location.protocol === "file:";
const BELT_SIZE = 5, VAN_SIZE = 5;

const $ = id => document.getElementById(id);
const money = n => "Rs " + n.toFixed(2);
function el(tag, text, cls) {
  const e = document.createElement(tag);
  if (text !== undefined) e.textContent = text;
  if (cls) e.className = cls;
  return e;
}
// ---------- Copy icon: put one next to every tracking ID ----------
const SVG_NS = "http://www.w3.org/2000/svg";
function svgIcon(kind) {                                  // built with DOM calls (no innerHTML)
  const svg = document.createElementNS(SVG_NS, "svg");
  ["width", "16", "height", "16", "viewBox", "0 0 24 24", "fill", "none", "stroke", "currentColor",
   "stroke-width", "2", "stroke-linecap", "round", "stroke-linejoin", "round"]
    .forEach((v, i, a) => { if (i % 2 === 0) svg.setAttribute(v, a[i + 1]); });
  const add = (tag, attrs) => { const n = document.createElementNS(SVG_NS, tag); for (const k in attrs) n.setAttribute(k, attrs[k]); svg.append(n); };
  if (kind === "check") add("polyline", { points: "20 6 9 17 4 12" });
  else { add("rect", { x: 9, y: 9, width: 13, height: 13, rx: 2 }); add("path", { d: "M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" }); }
  return svg;
}
async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; } catch (e) { /* fall back below */ }
  const t = document.createElement("textarea");           // fallback for browsers/pages without clipboard permission
  t.value = text; t.style.position = "fixed"; t.style.opacity = "0";
  document.body.append(t); t.select();
  let ok = false; try { ok = document.execCommand("copy"); } catch (e) { ok = false; }
  t.remove(); return ok;
}
function copyBtn(id) {
  const b = el("button", undefined, "copy");
  b.type = "button"; b.title = "Copy ID"; b.setAttribute("aria-label", "Copy tracking ID " + id);
  b.append(svgIcon("copy"));
  b.onclick = async e => {
    e.stopPropagation();
    const ok = await copyText(id);
    b.replaceChildren(svgIcon(ok ? "check" : "copy"));
    b.title = ok ? "Copied!" : "Copy failed - select the ID and press Ctrl+C";
    b.classList.toggle("done", ok);
    setTimeout(() => { b.replaceChildren(svgIcon("copy")); b.title = "Copy ID"; b.classList.remove("done"); }, 1300);
  };
  return b;
}
function idWithCopy(id) {                                  // the ID text followed by its copy icon
  const w = el("span", undefined, "idcopy");
  w.append(el("span", id, "idtext"), copyBtn(id));
  return w;
}

function say(text, isError) {
  const m = $("msg"); m.textContent = text; m.className = isError ? "error" : "";
  const found = text.match(/\b\d{12}\b/);                 // message mentions a tracking ID -> offer a copy icon
  if (found && !isError) m.append(copyBtn(found[0]));
}
async function act(fn, okText) {
  try { const r = await fn(); if (okText) say(okText(r)); await refresh(); }
  catch (e) { say(e.message, true); }
}

async function call(name, body = {}) {
  if (USE_MOCK) return mock[name](body);
  const res = await fetch("/api/" + name, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ---------- Mock backend (sample data; mirrors what the C++ engine will return) ----------
const PLACES = {
  "248001": "Clock Tower",
  "248002": "Clement Town",
  "248003": "Dehradun Cantt",
  "248005": "IIP Dehradun",
  "248007": "Bidholi",
  "248008": "Barasi",
  "248009": "Rajpur Road",
  "248012": "Doon University",
  "248013": "Kandoli",
  "248121": "Ajabpur",
  "248122": "Barlowganj",
  "248123": "Chakrata",
  "248125": "Dakpathar",
  "248140": "Doiwala",
  "248142": "Herbertpur",
  "248143": "Bhogpur",
  "248158": "Kalsi",
  "248179": "Mussoorie",
  "248199": "Tuini",
  "249201": "Rishikesh",
  "249401": "Haridwar"
};
const RATES = {
  standard: { name: "Standard Ground", prio: 2, cost: (w, d) => 40 + w * 10 + d * 1.5 },
  express:  { name: "Prime Express",   prio: 1, cost: (w, d) => 100 + w * 22 + d * 3.5 }
};
const db = { parcels: [], belt: [], van: [], route: ["Central Warehouse"], seq: 0 };
const byId = id => db.parcels.find(p => p.id === id);

const mock = {
  suggest({ prefix }) {                                   // C++ side: Trie prefix search
    const q = prefix.toLowerCase();
    if (!q) return [];
    return Object.entries(PLACES).filter(([pin, name]) => pin.startsWith(q) || name.toLowerCase().startsWith(q)).map(([pin, name]) => ({ pin, name })).slice(0, 8);
  },
  quote({ service, weight, distance }) { return { cost: RATES[service].cost(weight, distance) }; },   // Strategy pattern
  register({ pincode, service, weight, distance }) {      // hash table insert + heap insert
    if (!PLACES[pincode]) throw new Error("Unknown pincode. Pick one from the suggestions.");
    if (!(weight > 0) || !(distance > 0)) throw new Error("Weight and distance must be positive.");
    const r = RATES[service], seq = ++db.seq;
    const p = { id: String(100000000100 + seq), pincode, dest: PLACES[pincode], service: r.name, priority: r.prio, seq, cost: r.cost(weight, distance), status: "Placed" };
    db.parcels.push(p);
    if (!db.route.includes(p.dest)) db.route.push(p.dest);
    return p;
  },
  track({ id }) {                                         // hash table lookup, O(1)
    const p = byId(id);
    if (!p) throw new Error("No parcel with that ID.");
    return p;
  },
  state() { return JSON.parse(JSON.stringify(db)); },
  dispatch() {                                            // heap extract-min -> circular queue
    if (db.belt.length >= BELT_SIZE) throw new Error("Belt is full.");
    const waiting = db.parcels.filter(p => p.status === "Placed").sort((a, b) => a.priority - b.priority || a.seq - b.seq);
    if (!waiting.length) throw new Error("No parcels waiting.");
    waiting[0].status = "Sorted";
    db.belt.push(waiting[0].id);
    return waiting[0];
  },
  loadVan() {                                             // queue dequeue -> re-stack by priority -> stack push
    if (!db.belt.length) throw new Error("Belt is empty.");
    if (db.van.length >= VAN_SIZE) throw new Error("Van is full.");
    const loaded = db.belt.splice(0, VAN_SIZE - db.van.length);
    // re-stack: rank parcels from earlier loads together with the new ones (priority, then arrival order)
    const cargo = [...db.van, ...loaded].map(byId)
      .sort((x, y) => x.priority - y.priority || x.seq - y.seq);
    db.van.length = 0;
    // stack is last-in-first-out, so push in reverse: most urgent ends on top
    [...cargo].reverse().forEach(par => { db.van.push(par.id); par.status = "In transit"; });
    return { count: loaded.length, top: cargo[0].id };
  },
  deliver() {                                             // stack pop, State pattern -> Delivered
    if (!db.van.length) throw new Error("Van is empty.");
    const id = db.van.pop();
    byId(id).status = "Delivered";
    return { id };
  },
  cancelStop({ name }) {                                  // doubly linked list unlink
    const i = db.route.indexOf(name);
    if (i < 1) throw new Error("That stop can't be cancelled.");
    db.route.splice(i, 1);
    return { name };
  }
};
if (USE_MOCK) [["248001", "standard", 3, 8.5], ["248009", "express", 1.2, 5]].forEach(([pincode, service, weight, distance]) => mock.register({ pincode, service, weight, distance }));
