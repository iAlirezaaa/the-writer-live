/* The notebook on the desk. Its handwriting lives here, on real paper, and its pages turn around the spine.
   RTL book: the right page is the earlier one, so a forward turn lifts the left leaf over the spine to the right. */

export function buildNotebook({ THREE, canvasTex, clickable, onTurn }) {
  const group = new THREE.Group();
  const coverMat = new THREE.MeshStandardMaterial({ color: 0x6b4a2f, roughness: 0.75 });
  const paperMat = new THREE.MeshStandardMaterial({ color: 0xf3ead6, roughness: 0.95 });

  const base = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.018, 0.3), coverMat);
  base.position.set(0, 0.009, 0); base.castShadow = true; base.receiveShadow = true; group.add(base);

  const spineMesh = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.026, 0.3), coverMat);
  spineMesh.position.set(0, 0.02, 0); spineMesh.castShadow = true; group.add(spineMesh);

  const stackR = new THREE.Group(); group.add(stackR);
  const stackL = new THREE.Group(); group.add(stackL);
  const sheetGeo = new THREE.BoxGeometry(0.185, 0.004, 0.275);
  for (let i = 0; i < 7; i++) {
    const a = new THREE.Mesh(sheetGeo, paperMat); a.position.set(0.098, 0.032 + i * 0.0042, 0); a.castShadow = true; stackR.add(a);
    const b = new THREE.Mesh(sheetGeo, paperMat); b.position.set(-0.098, 0.032 + i * 0.0042, 0); b.castShadow = true; stackL.add(b);
  }

  const lid = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.014, 0.3), coverMat);
  const lidPivot = new THREE.Group(); lidPivot.position.set(0, 0.062, 0);
  lid.position.set(0, 0.007, 0); lid.castShadow = true; lidPivot.add(lid); group.add(lidPivot);
  const ribbon = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.002, 0.3), new THREE.MeshStandardMaterial({ color: 0xa8691a, roughness: 0.6 }));
  ribbon.position.set(0.12, 0.016, 0); lid.add(ribbon);

  const pageGeo = new THREE.PlaneGeometry(0.185, 0.275);
  const faceMat = (tex) => new THREE.MeshBasicMaterial({ map: tex, toneMapped: false, side: THREE.FrontSide });
  const right = new THREE.Mesh(pageGeo, faceMat(blankTex("—")));
  right.rotation.set(-Math.PI / 2, 0, 0); right.position.set(0.098, 0.062, 0); group.add(right);
  const left = new THREE.Mesh(pageGeo, faceMat(blankTex("—")));
  left.rotation.set(-Math.PI / 2, 0, Math.PI); left.position.set(-0.098, 0.062, 0); group.add(left);

  const flip = new THREE.Group();
  const flipFront = new THREE.Mesh(pageGeo, faceMat(blankTex("—")));
  flipFront.rotation.set(-Math.PI / 2, 0, 0); flipFront.position.set(0.098, 0.001, 0);
  const flipBack = new THREE.Mesh(pageGeo, faceMat(blankTex("—")));
  flipBack.rotation.set(Math.PI / 2, 0, 0); flipBack.position.set(0.098, -0.001, 0);
  flip.add(flipFront, flipBack); flip.position.set(0, 0.0625, 0); flip.visible = false; group.add(flip);

  let pages = [];
  let spreadIndex = 0;
  let open = false;
  let lidProgress = 0;
  let anim = null;                      // { dir, progress, speed }
  let speed = 1;
  let tilt = 0;

  function blankTex(label) {
    const t = canvasTex(256, 384, (g) => {
      g.fillStyle = "#f3ead6"; g.fillRect(0, 0, 256, 384);
      g.fillStyle = "#d9cdb2"; g.fillRect(0, 0, 256, 384);
      g.fillStyle = "#efe6d2"; g.fillRect(4, 4, 248, 376);
      if (label && label !== "—") { g.fillStyle = "#8b7d63"; g.font = "400 16px Vazirmatn, Tahoma, sans-serif"; g.textAlign = "center"; g.fillText(label, 128, 200); }
    });
    return t;
  }

  // A sheet of paper with the writer's own handwriting on it. Text is drawn as text, never as markup.
  function pageTex(page) {
    const ink = page.ink || "#2a2118";
    return canvasTex(512, 768, (g) => {
      g.fillStyle = "#f6efdd"; g.fillRect(0, 0, 512, 768);
      for (let y = 92; y < 740; y += 34) { g.fillStyle = "rgba(120,105,80,0.10)"; g.fillRect(34, y, 444, 1); }
      g.fillStyle = "rgba(168,105,26,0.22)"; g.fillRect(470, 0, 2, 768);
      if (page.paperNoise) {
        for (let i = 0; i < 900; i++) {
          g.fillStyle = `rgba(90,78,60,${0.02 + Math.random() * 0.03})`;
          g.fillRect(Math.random() * 512, Math.random() * 768, 1.4, 1.4);
        }
      }
      g.direction = "rtl"; g.textAlign = "right";
      if (page.title) {
        g.fillStyle = "#5a3a16"; g.font = "600 30px 'Noto Naskh Arabic', Vazirmatn, Tahoma, serif";
        g.fillText(page.title.slice(0, 26), 452, 60);
      }
      g.fillStyle = ink;
      const size = page.size || 24;
      g.font = `400 ${size}px 'Noto Naskh Arabic', Vazirmatn, Tahoma, serif`;
      const lines = wrap(g, page.body || "", 436, size);
      let y = page.title ? 118 : 84;
      for (const line of lines) {
        if (y > 736) break;
        // handwriting is not typeset: every line drifts a little
        g.save();
        g.translate(452 + (Math.random() - 0.5) * 2.5, y + (Math.random() - 0.5) * 1.8);
        g.rotate((Math.random() - 0.5) * 0.006);
        g.fillText(line, 0, 0);
        g.restore();
        y += 34;
      }
      if (page.folio != null) {
        g.fillStyle = "#8b7d63"; g.font = "400 18px Vazirmatn, Tahoma, sans-serif";
        g.textAlign = page.folio % 2 ? "right" : "left";
        g.fillText(String(page.folio), page.folio % 2 ? 452 : 60, 752);
      }
      if (page.stamp) {
        g.save(); g.globalAlpha = 0.5; g.strokeStyle = "#8f3b3b"; g.lineWidth = 3;
        g.font = "600 34px Vazirmatn, Tahoma, sans-serif"; g.textAlign = "center";
        g.strokeText(page.stamp, 256, 420); g.restore();
      }
    });
  }

  function wrap(g, text, width) {
    const out = [];
    for (const para of String(text).split(/\n+/)) {
      const words = para.split(/\s+/).filter(Boolean);
      let line = "";
      for (const w of words) {
        const trial = line ? `${line} ${w}` : w;
        if (g.measureText(trial).width > width && line) { out.push(line); line = w; } else line = trial;
      }
      if (line) out.push(line);
      out.push("");
    }
    return out;
  }

  function paint() {
    const a = pages[spreadIndex * 2], b = pages[spreadIndex * 2 + 1];
    right.material.map = a ? a.tex : blankTex("—");
    left.material.map = b ? b.tex : blankTex("—");
    right.material.needsUpdate = left.material.needsUpdate = true;
  }

  return {
    group,
    get isOpen() { return open; },
    get spread() { return spreadIndex; },
    get pagecount() { return pages.length; },
    setSpeed(v) { speed = Math.max(0.3, Math.min(4, v || 1)); },
    setOpen(v) { open = !!v; },
    // each page: { title, body, folio, stamp, ink }
    setPages(list, keepPlace) {
      const inkList = (list || []).map((p, i) => ({ ...p, folio: p.folio ?? i + 1, tex: pageTex(p) }));
      if (inkList.length % 2) inkList.push({ title: "", body: "", folio: inkList.length + 1, tex: pageTex({ body: "" }) });
      for (const old of pages) old.tex?.dispose?.();
      pages = inkList;
      const max = Math.max(0, Math.ceil(pages.length / 2) - 1);
      if (!keepPlace) spreadIndex = 0;
      spreadIndex = Math.min(Math.max(0, spreadIndex), max);
      paint();
    },
    firstPage() { this.goto(0); },
    goto(i) {
      const max = Math.max(0, Math.ceil(pages.length / 2) - 1);
      spreadIndex = Math.min(Math.max(0, i), max);
      paint();
    },
    next() {
      if (anim || spreadIndex >= Math.ceil(pages.length / 2) - 1) return false;
      anim = { dir: 1, progress: 0 };
      const a = pages[spreadIndex * 2 + 1], b = pages[spreadIndex * 2 + 2];
      flipFront.material.map = a ? a.tex : blankTex("—");
      flipBack.material.map = b ? b.tex : blankTex("—");
      flipFront.material.needsUpdate = flipBack.material.needsUpdate = true;
      flip.visible = true;
      flip.rotation.y = 0;
      return true;
    },
    prev() {
      if (anim || spreadIndex <= 0) return false;
      anim = { dir: -1, progress: 0 };
      const a = pages[spreadIndex * 2 - 1], b = pages[spreadIndex * 2 - 2];
      flipFront.material.map = a ? a.tex : blankTex("—");
      flipBack.material.map = b ? b.tex : blankTex("—");
      flipFront.material.needsUpdate = flipBack.material.needsUpdate = true;
      flip.visible = true;
      flip.rotation.y = -Math.PI;
      return true;
    },
    turnFromPointer(xLocal) { if (xLocal > 0) this.prev(); else this.next(); },
    hitPages() { return [right, left]; },
    registerPickables(add) {
      right.userData.notebook = "right"; left.userData.notebook = "left";
      clickable(right, "p-notebook", "برگ‌های دست‌نویس");
      clickable(left, "p-notebook", "برگ‌های دست‌نویس");
    },
    update(dt) {
      // the lid opens before the pages are reachable
      const target = open ? 1 : 0;
      const before = lidProgress;
      lidProgress += (target - lidProgress) * Math.min(1, dt * 3.4);
      lidPivot.rotation.y = -lidProgress * (Math.PI * 0.94);
      lidPivot.position.y = 0.062 + lidProgress * 0.004;
      if (before < 0.5 && lidProgress >= 0.5) right.visible = left.visible = true;
      if (before >= 0.5 && lidProgress < 0.5) right.visible = left.visible = false;

      if (anim) {
        anim.progress += dt * 1.9 * speed;
        const p = Math.min(1, anim.progress);
        const eased = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
        const angle = anim.dir > 0 ? -eased * Math.PI : (1 - eased) * Math.PI - Math.PI;
        flip.rotation.y = angle;
        flip.position.y = 0.0625 + Math.sin(p * Math.PI) * 0.022;
        tilt = Math.sin(p * Math.PI) * 0.02;
        group.rotation.z = tilt;
        if (p >= 1) {
          const dir = anim.dir;
          anim = null; flip.visible = false; flip.rotation.y = 0; group.rotation.z = 0;
          if (dir > 0) spreadIndex += 1; else spreadIndex = Math.max(0, spreadIndex - 1);
          paint();
          onTurn?.(spreadIndex, dir);
        }
      }
    },
    dispose() {
      for (const p of pages) p.tex?.dispose?.();
    },
  };
}
