// Interactive realm map: tap a kingdom for its lore card, and follow the story
// chapter by chapter with "Where is everyone?". The map SVG itself is generated
// by tools/build_map.py; this file only adds behaviour on top of it.
(function () {
  const svg = document.querySelector(".map-figure svg");
  if (!svg) return;
  const NS = "http://www.w3.org/2000/svg";

  // Map regions -> lore entry. Both Moyin islands share one entry.
  const LORE_OF = { "moyin-w": "moyin", "moyin-e": "moyin" };
  const REGION_NAME = { "moyin-w": "Western Moyin", "moyin-e": "Eastern Moyin, the centre island" };
  // Kingdoms without a portrait yet show a crest instead.
  const CREST = { hangkas: "🐍", sam: "⚒️" };

  // Story places, in map coordinates.
  const PLACES = {
    hangkas: [470, 420, "the Hangkas"],
    nayaSea: [420, 545, "the sea off the Sea Tyrants"],
    opita: [471, 125, "Opita Island"],
    talz: [640, 545, "Talz Dominion"],
    rahel: [800, 625, "Rahel's Empire"],
    pam: [1120, 650, "Pam's Wonderland"],
    bina: [985, 805, "Bina's Sunny Island"],
    moyinW: [880, 420, "Western Moyin"],
    moyinE: [1045, 395, "Eastern Moyin"],
    windmill: [1075, 470, "the great windmill"],
    ruins: [1035, 375, "the old palace ruins"],
    maze: [960, 470, "Jeje's maze, deep underground"],
    ayaluna: [714, 160, "Ayaluna"],
    kz: [1010, 175, "KZ Roselynd"],
    zav: [1380, 150, "the Broccolingdom"],
    cinta: [1335, 750, "Cinta Island"],
    beryl: [1400, 470, "Beryl Kingdom"],
    shareen: [1290, 340, "Shareen's Mart"],
    westShore: [1215, 420, "the great island's western shore"],
    laura: [1735, 430, "Laura Island"],
  };

  // Characters: img = ruler portrait in images/rulers/, otherwise a coloured badge.
  const CHARS = {
    neya: { name: "Empress Neya", badge: "🐍", color: "#3f8f5a" },
    naya: { name: "Pirate King Naya", img: "naya" },
    opi: { name: "Queen Opi", img: "opita" },
    aya: { name: "Queen Aya", img: "ayaluna" },
    kz: { name: "Queen KZ", img: "kz" },
    zav: { name: "King Zav", img: "zav" },
    kaylee: { name: "Queen Kaylee", img: "kaylee" },
    maureen: { name: "Queen Maureen", img: "moyin" },
    talitha: { name: "Queen Talitha", img: "talz" },
    rahel: { name: "Queen Rahel", img: "rahel" },
    jasmyn: { name: "Queen Jasmyn", img: "jasmyn" },
    pam: { name: "Queen Pam", img: "pam" },
    bina: { name: "Queen Bina", img: "bina" },
    shareen: { name: "Queen Shareen", img: "shareen" },
    sharleen: { name: "Queen Sharleen", img: "sharleen" },
    mayzha: { name: "Queen Mayzha and Beryl", img: "beryl" },
    laura: { name: "Queen Laura", img: "laura" },
    cinta: { name: "Queen Cinta", img: "cinta" },
    jeje: { name: "Queen Jeje", img: "jecroft" },
    yopis: { name: "Queen Yopis", img: "yopis" },
    sam: { name: "Queen Samantha", badge: "S", color: "#7a5a9e" },
    redFleet: { name: "The red fleet", badge: "⛵", color: "#b23a3a", foe: true },
    nonne: { name: "General Nonne", badge: "N", color: "#b23a3a", foe: true },
    kannca: { name: "General Kannca", badge: "K", color: "#b23a3a", foe: true },
    tama: { name: "General Tama", badge: "T", color: "#b23a3a", foe: true },
    raian: { name: "Emperor Raian", badge: "R", color: "#5a1f1f", foe: true },
    hanji: { name: "Hanji", badge: "H", color: "#1a1a1a", foe: true },
  };

  // Who is where in each chapter, plus a one-line reminder of what happens.
  const CHAPTERS = {
    1: { at: { naya: "nayaSea", redFleet: "nayaSea", neya: "hangkas" }, note: "Naya meets a strange red fleet at sea. The Grand Map is gone." },
    2: { at: { naya: "hangkas", neya: "hangkas" }, note: "Opita explodes. Neya goes north to Opi; Naya heads for Talz." },
    3: { at: { naya: "talz", talitha: "talz", jasmyn: "talz", kaylee: "moyinW" }, note: "Talitha and Jasmyn send help to Moyin. Naya goes on to Rahel." },
    4: { at: { naya: "rahel", rahel: "rahel" }, note: "Rahel's healers start making salve for the whole realm." },
    5: { at: { naya: "pam", pam: "pam", nonne: "pam" }, note: "An ambush at Pam's Wonderland. Nonne has turned." },
    6: { at: { neya: "opita", opi: "opita", kannca: "opita" }, note: "Neya frees Opita and finds Opi in the ruins." },
    7: { at: { neya: "opita", opi: "opita" }, note: "Opita rebuilds. Neya sets off for Ayaluna." },
    8: { at: { kaylee: "moyinW", jasmyn: "moyinW", maureen: "moyinE", kz: "moyinE" }, note: "Western Moyin is won back, but Maureen and KZ have been taken east." },
    9: { at: { zav: "zav" }, note: "Zav's people escape the captured capital on Laura's lanterns." },
    10: { at: { naya: "pam", pam: "pam", nonne: "pam" }, note: "Naya's clouds wake up. Pam is free." },
    11: { at: { naya: "pam", pam: "pam", bina: "bina" }, note: "The ducks fly again. Naya explains the Ring of the Sea." },
    12: { at: { neya: "ayaluna", aya: "ayaluna" }, note: "Aya is safe. A huge red fleet is sailing for the centre." },
    13: { at: { naya: "cinta", cinta: "cinta", jeje: "cinta", sam: "cinta", yopis: "cinta" }, note: "The eastern queens hear the name Raian." },
    14: { at: { aya: "kz", neya: "moyinW", kaylee: "moyinW", redFleet: "moyinE" }, note: "Aya takes KZ Roselynd back. Neya's fleet is beaten at sea." },
    15: { at: { jasmyn: "rahel", rahel: "rahel" }, note: "An old book tells of a demon whose name was erased." },
    16: { at: { naya: "beryl", yopis: "beryl", sam: "beryl", mayzha: "beryl", sharleen: "beryl", tama: "beryl" }, note: "Naya's storm arrives just in time to save Beryl." },
    17: { at: { naya: "shareen", yopis: "shareen", sam: "shareen", shareen: "shareen" }, note: "Shareen's toys come to life." },
    18: { at: { neya: "moyinW", kaylee: "moyinW", jasmyn: "moyinW", talitha: "moyinW" }, note: "Neya says the name nobody says. A door opens in the cliffs." },
    19: { at: { naya: "laura", zav: "laura", yopis: "westShore", sam: "westShore", shareen: "westShore", neya: "moyinW", kaylee: "moyinW" }, note: "Naya beats Tama and falls from the sky. Zav catches him." },
    20: { at: { neya: "maze", kaylee: "maze", jasmyn: "maze", talitha: "maze", jeje: "maze" }, note: "Jeje's secret maze carries the armies toward the centre." },
    21: { at: { naya: "laura", zav: "laura", laura: "laura" }, note: "Naya forges the Ring of the Moon." },
    22: { at: { kaylee: "windmill", jasmyn: "windmill", talitha: "windmill", jeje: "windmill", kz: "windmill", maureen: "windmill" }, note: "KZ and Maureen are rescued from the great windmill." },
    23: { at: { neya: "ruins", raian: "ruins", hanji: "ruins", kaylee: "windmill", jasmyn: "windmill", talitha: "windmill", jeje: "windmill", kz: "windmill", maureen: "windmill" }, note: "The black stone breaks. The centre island shatters." },
    24: { at: { neya: "ruins", hanji: "ruins", jeje: "ruins", jasmyn: "ruins", kaylee: "ruins", talitha: "ruins", kz: "ruins", maureen: "ruins" }, note: "Neya fights the boring demon." },
    25: { at: { naya: "hangkas", neya: "hangkas", opi: "opita", aya: "kz", zav: "zav", laura: "zav" }, note: "The map is whole again. Naya will stay two more months before he sails north." },
  };

  // How each kingdom stands, from the chapter the reader learns it.
  const EVENTS = [
    [2, "opita", "taken"],
    [3, "moyin-w", "battle"], [3, "moyin-e", "taken"],
    [5, "pam", "taken"],
    [6, "opita", null],
    [8, "moyin-w", null], [8, "kz", "taken"],
    [9, "zav", "taken"],
    [10, "pam", null],
    [13, "shareen", "taken"], [13, "beryl", "battle"],
    [14, "kz", null],
    [16, "beryl", null],
    [17, "shareen", null],
    [23, "moyin-e", "battle"],
    [24, "moyin-e", null],
    [25, "zav", null],
  ];
  const STATUS_TEXT = { taken: "Held by the red army", battle: "Fighting the red army" };
  const LAST = 25;

  // ---------- kingdom cards ----------

  const card = document.createElement("aside");
  card.className = "realm-card";
  card.hidden = true;
  document.body.appendChild(card);

  function lore(kid) {
    const h = document.getElementById("lore-" + (LORE_OF[kid] || kid));
    if (!h) return null;
    const [name, ruler] = h.textContent.split(" — ");
    return { name, ruler, html: h.nextElementSibling.innerHTML, anchor: h.id };
  }

  function statusAt(kid, ch) {
    let s = null;
    for (const [c, k, st] of EVENTS) if (c <= ch && k === kid) s = st;
    return s;
  }

  function openCard(kid) {
    const info = lore(kid);
    if (!info) return;
    const portraitKey = LORE_OF[kid] || kid;
    const portrait = CREST[portraitKey]
      ? `<div class="crest" aria-hidden="true">${CREST[portraitKey]}</div>`
      : `<img src="images/rulers/${portraitKey}.jpg" alt="${info.ruler}">`;
    const places = [...svg.querySelectorAll(`.lm[data-k="${kid}"] text`)].map(t => t.textContent);

    let story = "";
    if (tracker.on) {
      const ch = tracker.chapter;
      const st = statusAt(kid, ch);
      const here = Object.entries(CHAPTERS[ch].at)
        .filter(([, p]) => placeRegion(p) === kid)
        .map(([c]) => CHARS[c].name);
      story = `<p class="card-story"><b>Chapter ${ch}:</b> ${st ? STATUS_TEXT[st] : "At peace"}.` +
        (here.length ? ` Here: ${here.join(", ")}.` : "") + "</p>";
    }

    card.innerHTML = `
      <button class="card-close" aria-label="Close">×</button>
      <div class="card-top">${portrait}
        <div><h3>${REGION_NAME[kid] || info.name}</h3><p class="card-ruler">${info.ruler}</p></div>
      </div>
      <p>${info.html}</p>
      ${places.length ? `<p class="card-places">📍 ${places.join(" · ")}</p>` : ""}
      ${story}
      <a class="card-more" href="#${info.anchor}">Read in the Lore Book ↓</a>`;
    card.hidden = false;
    svg.querySelectorAll(".realm.selected").forEach(p => p.classList.remove("selected"));
    svg.querySelector(`.realm[data-k="${kid}"]`).classList.add("selected");
    card.querySelector(".card-close").onclick = closeCard;
    card.querySelector(".card-more").onclick = closeCard;
  }

  function closeCard() {
    card.hidden = true;
    svg.querySelectorAll(".realm.selected").forEach(p => p.classList.remove("selected"));
  }

  svg.addEventListener("click", e => {
    const hit = e.target.closest("[data-k]");
    if (hit) openCard(hit.dataset.k);
    else closeCard();
  });
  document.addEventListener("keydown", e => { if (e.key === "Escape") closeCard(); });

  // Which region a story place sits in (for "Here:" on the cards).
  const regionCache = {};
  function placeRegion(p) {
    if (p in regionCache) return regionCache[p];
    const [x, y] = PLACES[p];
    const pt = svg.createSVGPoint();
    pt.x = x; pt.y = y;
    const r = [...svg.querySelectorAll(".realm")].find(path => path.isPointInFill(pt));
    return (regionCache[p] = r ? r.dataset.k : null);
  }

  // ---------- reading progress (for spoiler protection) ----------

  const KEY = "neya-read-up-to";
  function readUpTo() {
    try { return Math.max(1, Number(localStorage.getItem(KEY)) || 1); } catch { return 1; }
  }
  const seen = new IntersectionObserver(entries => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      const n = Number(e.target.closest("article").id.slice(2));
      if (n > readUpTo()) try { localStorage.setItem(KEY, n); } catch {}
    }
  });
  document.querySelectorAll("article.chapter h2").forEach(h => seen.observe(h));

  // ---------- "Where is everyone?" ----------

  const tracker = { on: false, chapter: 1, peek: false };
  const panel = document.createElement("div");
  panel.className = "tracker";
  panel.innerHTML = `
    <button class="tracker-toggle" aria-expanded="false">🧭 Where is everyone?</button>
    <div class="tracker-body" hidden>
      <div class="tracker-row">
        <button class="tracker-step" data-step="-1" aria-label="Previous chapter">‹</button>
        <input type="range" min="1" max="${LAST}" value="1" aria-label="Chapter">
        <button class="tracker-step" data-step="1" aria-label="Next chapter">›</button>
      </div>
      <p class="tracker-title"></p>
      <div class="tracker-lock" hidden>
        <p>You haven't read this far yet. Looking might spoil what happens!</p>
        <button class="tracker-peek">Peek anyway</button>
      </div>
      <div class="tracker-info">
        <p class="tracker-note"></p>
        <ul class="tracker-who"></ul>
        <p class="tracker-key"><span class="key taken"></span> held by the red army
          <span class="key battle"></span> fighting</p>
      </div>
    </div>`;
  svg.closest(".map-figure").after(panel);

  const toggle = panel.querySelector(".tracker-toggle");
  const body = panel.querySelector(".tracker-body");
  const range = panel.querySelector("input");
  const lock = panel.querySelector(".tracker-lock");
  const infoBox = panel.querySelector(".tracker-info");
  const tokens = svg.querySelector(".tokens");

  toggle.onclick = () => {
    tracker.on = !tracker.on;
    toggle.setAttribute("aria-expanded", tracker.on);
    body.hidden = !tracker.on;
    if (tracker.on) {
      tracker.chapter = Math.min(readUpTo(), LAST);
      range.value = tracker.chapter;
    }
    render();
  };
  range.oninput = () => { tracker.chapter = Number(range.value); render(); };
  panel.querySelectorAll(".tracker-step").forEach(b => b.onclick = () => {
    tracker.chapter = Math.min(LAST, Math.max(1, tracker.chapter + Number(b.dataset.step)));
    range.value = tracker.chapter;
    render();
  });
  panel.querySelector(".tracker-peek").onclick = () => { tracker.peek = true; render(); };

  function render() {
    tokens.replaceChildren();
    svg.querySelectorAll(".realm").forEach(p => p.classList.remove("taken", "battle"));
    if (!card.hidden) closeCard();
    if (!tracker.on) return;

    const ch = tracker.chapter;
    // A locked chapter shows only its number: even the title could give things away.
    const locked = ch > readUpTo() && !tracker.peek;
    const title = document.querySelector(`#ch${ch} h2`);
    panel.querySelector(".tracker-title").textContent = title && !locked ? title.textContent : "Chapter " + ch;

    lock.hidden = !locked;
    infoBox.hidden = locked;
    if (locked) return;

    svg.querySelectorAll(".realm").forEach(p => {
      const st = statusAt(p.dataset.k, ch);
      if (st) p.classList.add(st);
    });

    const data = CHAPTERS[ch];
    panel.querySelector(".tracker-note").textContent = data.note;

    // Group characters by place, then lay each group out in a small row.
    const groups = {};
    for (const [c, p] of Object.entries(data.at)) (groups[p] = groups[p] || []).push(c);
    const who = panel.querySelector(".tracker-who");
    who.replaceChildren();
    for (const [p, cs] of Object.entries(groups)) {
      const [x, y, label] = PLACES[p];
      const perRow = 4, gap = 52;
      cs.forEach((c, i) => {
        const row = Math.floor(i / perRow);
        const inRow = Math.min(perRow, cs.length - row * perRow);
        const tx = x + (i % perRow - (inRow - 1) / 2) * gap;
        const ty = y + row * gap;
        tokens.appendChild(token(c, tx, ty));
      });
      const li = document.createElement("li");
      li.innerHTML = `<b>${label[0].toUpperCase() + label.slice(1)}:</b> ${cs.map(c => CHARS[c].name).join(", ")}`;
      who.appendChild(li);
    }
  }

  function token(c, x, y) {
    const ch = CHARS[c];
    const g = document.createElementNS(NS, "g");
    g.setAttribute("class", "token" + (ch.foe ? " foe" : ""));
    g.setAttribute("transform", `translate(${x} ${y})`);
    const title = document.createElementNS(NS, "title");
    title.textContent = ch.name;
    g.appendChild(title);
    const ring = document.createElementNS(NS, "circle");
    ring.setAttribute("r", 24);
    ring.setAttribute("fill", ch.color || "#fff8ec");
    g.appendChild(ring);
    if (ch.img) {
      const im = document.createElementNS(NS, "image");
      im.setAttribute("href", `images/rulers/${ch.img}.jpg`);
      im.setAttribute("x", -22); im.setAttribute("y", -22);
      im.setAttribute("width", 44); im.setAttribute("height", 44);
      im.setAttribute("preserveAspectRatio", "xMidYMin slice");
      im.setAttribute("clip-path", "url(#token-clip)");
      g.appendChild(im);
    } else {
      const t = document.createElementNS(NS, "text");
      t.setAttribute("text-anchor", "middle");
      t.setAttribute("dy", "0.36em");
      t.textContent = ch.badge;
      g.appendChild(t);
    }
    return g;
  }

  // Circular clip for portrait tokens (in each token's own coordinates).
  const defs = document.createElementNS(NS, "defs");
  defs.innerHTML = '<clipPath id="token-clip"><circle r="22"/></clipPath>';
  svg.prepend(defs);
})();
