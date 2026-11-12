// 3D navigation graph: page nodes sit on a sphere around Home (the centre).
// Drag to rotate; keyboard focus turns a node to the front; hover/focus shows its satellites.
// Without this script the same markup is a plain list of links.
(() => {
  const graph = document.getElementById("graph");
  if (!graph) return;
  const svg = graph.querySelector(".graph-edges");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const F = 3; // perspective distance, in sphere radii

  const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
  const norm = (a) => { const l = Math.hypot(...a); return a.map((v) => v / l); };

  const nodes = [...graph.querySelectorAll(".node")].map((el, i, all) => {
    // Fibonacci sphere: evenly spread directions (a nod to the BAO shell)
    const y = 1 - (2 * (i + 0.5)) / all.length;
    const r = Math.sqrt(1 - y * y), t = i * Math.PI * (3 - Math.sqrt(5));
    const dir = [Math.cos(t) * r, y, Math.sin(t) * r];
    const a = norm(cross(dir, Math.abs(dir[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
    const b = cross(dir, a);
    // Satellites are lifted out of their node (as siblings) so the node's transform and opacity don't apply to them.
    const lis = [...el.querySelectorAll(".satellites li")];
    lis.forEach((li) => li.classList.add("sat"));
    el.after(...lis);
    const sats = lis.map((li, j) => {
      const ang = (j / lis.length) * 2 * Math.PI + 0.6;
      return { el: li, pos: dir.map((d, k) => d * 1.05 + (Math.cos(ang) * a[k] + Math.sin(ang) * b[k]) * 0.4) };
    });
    return { el, dir, sats };
  });

  let rx = -0.25, ry = 0, vx = 0, vy = 0, target = null, open = null, drag = null, moved = 0, w = 0, h = 0, R = 0;
  try { [rx, ry] = JSON.parse(sessionStorage.getItem("graph-rot")) || [rx, ry]; } catch {}
  addEventListener("pagehide", () => { try { sessionStorage.setItem("graph-rot", JSON.stringify([rx, ry])); } catch {} });

  graph.classList.add("is-3d");
  new ResizeObserver(() => {
    w = graph.clientWidth; h = graph.clientHeight;
    R = Math.min(w, h) * 0.36;
    svg.setAttribute("viewBox", `${-w / 2} ${-h / 2} ${w} ${h}`);
  }).observe(graph);

  function project([x, y, z]) {
    const cy = Math.cos(ry), sy = Math.sin(ry), cx = Math.cos(rx), sx = Math.sin(rx);
    [x, z] = [x * cy + z * sy, -x * sy + z * cy];
    [y, z] = [y * cx - z * sx, y * sx + z * cx];
    const s = F / (F - z);
    return { x: x * R * s, y: y * R * s, z };
  }

  function place(el, p, base, minAlpha) {
    const depth = (p.z + 1.4) / 2.8; // 0 = back, 1 = front
    el.style.transform = `translate(-50%, -50%) translate(${p.x}px, ${p.y}px) scale(${(0.55 + 0.45 * depth) * base})`;
    el.style.zIndex = Math.round(depth * 200);
    el.style.opacity = minAlpha < 0 ? 0 : minAlpha + (1 - minAlpha) * depth;
    return depth;
  }

  function render() {
    let lines = "";
    for (const n of nodes) {
      const p = project(n.dir), d = place(n.el, p, 1, 0.3);
      lines += `<line x1="0" y1="0" x2="${p.x}" y2="${p.y}" stroke-width="${1 + 2 * d}" stroke-opacity="${0.15 + 0.6 * d}"/>`;
      for (const s of n.sats) {
        const shown = n.el === open;
        s.el.classList.toggle("is-shown", shown);
        const q = project(s.pos), sd = place(s.el, q, 0.85, shown ? 0.75 : -1);
        if (shown) lines += `<line x1="${p.x}" y1="${p.y}" x2="${q.x}" y2="${q.y}" stroke-width="${1 + sd}" stroke-opacity="${0.5 + 0.5 * sd}"/>`;
      }
    }
    svg.innerHTML = lines;
  }

  function tick() {
    // Page swapped out in place (nav.js): remember the rotation and stop this loop.
    if (!graph.isConnected) { try { sessionStorage.setItem("graph-rot", JSON.stringify([rx, ry])); } catch {} return; }
    if (!drag) {
      if (target) {
        rx += (target[0] - rx) * 0.12; ry += (target[1] - ry) * 0.12;
        if (Math.abs(target[0] - rx) + Math.abs(target[1] - ry) < 0.002) target = null;
      } else {
        rx += vx; ry += vy; vx *= 0.94; vy *= 0.94;
        if (!reduced && !open) ry += 0.0015; // slow idle drift
      }
      rx = Math.max(-1.2, Math.min(1.2, rx));
    }
    render();
    requestAnimationFrame(tick);
  }

  // Drag to rotate. Clicks only count if the pointer barely moved.
  graph.addEventListener("pointerdown", (e) => { drag = [e.clientX, e.clientY]; moved = 0; target = null; });
  addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag[0], dy = e.clientY - drag[1];
    drag = [e.clientX, e.clientY];
    moved += Math.abs(dx) + Math.abs(dy);
    vy = dx * 0.005; vx = -dy * 0.005;
    ry += vy; rx += vx;
    if (moved > 5) graph.classList.add("is-dragging");
  });
  addEventListener("pointerup", () => { drag = null; graph.classList.remove("is-dragging"); });
  graph.addEventListener("click", (e) => { if (moved > 5) { e.preventDefault(); e.stopPropagation(); } }, true);

  for (const n of nodes) {
    const parts = [n.el, ...n.sats.map((s) => s.el)];
    const active = () => parts.some((el) => el.matches(":hover") || el.contains(document.activeElement));
    const show = () => { open = n.el; };
    // Grace period so the pointer can travel from a node to its satellites.
    const hide = () => setTimeout(() => { if (open === n.el && !active()) open = null; }, 400);
    for (const el of parts) {
      el.addEventListener("pointerenter", show);
      el.addEventListener("pointerleave", hide);
      el.addEventListener("focusin", show);
      el.addEventListener("focusout", hide);
    }
    n.el.addEventListener("focusin", (e) => {
      if (!e.target.matches(":focus-visible")) return;
      // Turn the focused node to the front.
      const [x, y, z] = n.dir;
      let ty = Math.atan2(-x, z);
      ty = ry + Math.atan2(Math.sin(ty - ry), Math.cos(ty - ry));
      target = [Math.atan2(y, Math.hypot(x, z)), ty];
    });
  }

  requestAnimationFrame(tick);
})();
