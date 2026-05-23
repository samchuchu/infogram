const ROLE_RULES = {
  title: {
    label: "Title",
    color: "#087b72",
    interaction: "Intro spotlight",
    rule: "Use as the first tap step. It sets context and should stay readable, not become a random animation."
  },
  statistic: {
    label: "Statistic",
    color: "#c77916",
    interaction: "Count or compare",
    rule: "Numbers become proof points. Tap reveals context, comparisons, or a count-up style state."
  },
  content: {
    label: "Content",
    color: "#356fbd",
    interaction: "Grouped explanation",
    rule: "Connected items share one pattern. If A, B, and C belong together, all three appear in the same step."
  },
  chart: {
    label: "Chart",
    color: "#7d57b8",
    interaction: "Chart reveal",
    rule: "Charts become guided highlights, reveal states, or comparison overlays instead of simple movement."
  },
  character: {
    label: "Character",
    color: "#26754d",
    interaction: "Guide action",
    rule: "Characters act as guides. Later, this role can generate pose/action images that match the source style."
  },
  science: {
    label: "Technical Graphic",
    color: "#b23a48",
    interaction: "Diagram hotspots",
    rule: "Physics, chemistry, process, or mechanism graphics become connected tappable parts with labels and cause-effect steps."
  }
};

const seedLayers = [
  { id: "title", role: "title", group: "Intro", label: "Main title", x: 8, y: 4, w: 70, h: 9 },
  { id: "stat", role: "statistic", group: "Intro", label: "Main number", x: 10, y: 15, w: 44, h: 10 },
  { id: "character", role: "character", group: "Intro", label: "Guide visual", x: 58, y: 12, w: 28, h: 17 },
  { id: "chart", role: "chart", group: "Data", label: "Chart area", x: 8, y: 31, w: 84, h: 21 },
  { id: "content-a", role: "content", group: "Explanation", label: "Point A", x: 9, y: 57, w: 25, h: 15 },
  { id: "content-b", role: "content", group: "Explanation", label: "Point B", x: 38, y: 57, w: 25, h: 15 },
  { id: "content-c", role: "content", group: "Explanation", label: "Point C", x: 67, y: 57, w: 25, h: 15 },
  { id: "science", role: "science", group: "Detail", label: "Process graphic", x: 12, y: 78, w: 76, h: 12 }
];

function buildHeuristicLayers() {
  return [
    { id: `title-${Date.now()}`, role: "title", group: "Opening", label: "Title", x: 7, y: 3, w: 86, h: 7, prompt: "" },
    { id: `section-1-${Date.now()}`, role: "content", group: "Section 1", label: "Section 1", x: 7, y: 12, w: 86, h: 14, prompt: "" },
    { id: `section-2-${Date.now()}`, role: "content", group: "Section 2", label: "Section 2", x: 7, y: 27, w: 86, h: 14, prompt: "" },
    { id: `section-3-${Date.now()}`, role: "character", group: "Section 3", label: "Character / visual", x: 7, y: 42, w: 86, h: 14, prompt: "" },
    { id: `section-4-${Date.now()}`, role: "science", group: "Section 4", label: "Technical graphic", x: 7, y: 57, w: 86, h: 14, prompt: "" },
    { id: `section-5-${Date.now()}`, role: "chart", group: "Section 5", label: "Data / diagram", x: 7, y: 72, w: 86, h: 14, prompt: "" },
    { id: `section-6-${Date.now()}`, role: "content", group: "Section 6", label: "Final section", x: 7, y: 87, w: 86, h: 10, prompt: "" }
  ];
}

const state = {
  imageSrc: "USDT.png",
  imageSize: { width: 941, height: 1672 },
  layers: buildHeuristicLayers(),
  activeGroup: "Opening",
  activeLayerId: null,
  preview: false,
  audit: [],
  drag: null,
  globalPrompt: ""
};

const els = {
  imageInput: document.getElementById("imageInput"),
  sourceImage: document.getElementById("sourceImage"),
  overlayRoot: document.getElementById("overlayRoot"),
  detailCard: document.getElementById("detailCard"),
  activeTitle: document.getElementById("activeTitle"),
  groupField: document.getElementById("groupField"),
  globalPrompt: document.getElementById("globalPrompt"),
  zonePrompt: document.getElementById("zonePrompt")
};

document.getElementById("detectBtn").addEventListener("click", analyzeInfographic);
document.getElementById("previewBtn").addEventListener("click", () => {
  state.preview = !state.preview;
  if (state.preview) {
    els.detailCard.hidden = true;
  } else {
    els.detailCard.hidden = true;
  }
  render();
});
document.getElementById("exportBtn").addEventListener("click", exportHtml);
document.getElementById("addZoneBtn").addEventListener("click", addZone);
document.getElementById("resetZonesBtn").addEventListener("click", analyzeInfographic);
els.imageInput.addEventListener("change", uploadImage);
els.groupField.addEventListener("input", updateSelectedFromFields);
els.zonePrompt.addEventListener("input", updateSelectedFromFields);
els.globalPrompt.addEventListener("input", () => {
  state.globalPrompt = els.globalPrompt.value;
});

function analyzeInfographic() {
  state.layers = buildHeuristicLayers();
  state.activeGroup = state.layers[0].group;
  state.activeLayerId = state.layers[0].id;
  state.preview = false;
  els.detailCard.hidden = true;
  audit();
  render();
}

function uploadImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      state.imageSrc = reader.result;
      state.imageSize = { width: image.naturalWidth, height: image.naturalHeight };
      state.layers = [];
      state.activeLayerId = null;
      state.activeGroup = "";
      state.preview = false;
      els.detailCard.hidden = true;
      audit();
      render();
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}

function audit() {
  const messages = [];
  const groups = getGroups();

  if (Math.abs(state.imageSize.width / state.imageSize.height - 9 / 16) > 0.22) {
    messages.push({ level: "warn", text: "Source is not exactly mobile portrait. It is fitted with contain, so no image cutoff." });
  }

  groups.forEach((group) => {
    const connectedContent = group.layers.filter((layer) => layer.role === "content");
    if (connectedContent.length > 1) {
      messages.push({ level: "ok", text: `${group.name}: connected content is handled as one grouped interaction.` });
    }
  });

  state.layers.forEach((layer) => {
    if (layer.x < 0 || layer.y < 0 || layer.x + layer.w > 100 || layer.y + layer.h > 100) {
      messages.push({ level: "error", text: `${layer.label} is outside the mobile canvas.` });
    }
    if (layer.role === "character" && layer.h < 10) {
      messages.push({ level: "warn", text: "Character box may be too small for future generated action poses." });
    }
  });

  if (!messages.length) {
    messages.push({ level: "ok", text: "Mobile portrait plan is valid. Overlap is allowed when it belongs to a tap state." });
  }
  state.audit = messages;
}

function render() {
  document.body.classList.toggle("preview-mode", state.preview);
  document.getElementById("previewBtn").innerHTML = state.preview ? "<span>E</span>dit" : "<span>P</span>review";
  els.sourceImage.src = state.imageSrc;
  renderHotspots();
  renderAdvancedPanel();
}

function renderHotspots() {
  els.overlayRoot.innerHTML = "";
  state.layers.forEach((layer) => {
    const rule = ROLE_RULES[layer.role];
    const hotspot = document.createElement("button");
    hotspot.type = "button";
    hotspot.className = "hotspot";
    hotspot.dataset.role = rule.label;
    hotspot.style.left = `${layer.x}%`;
    hotspot.style.top = `${layer.y}%`;
    hotspot.style.width = `${layer.w}%`;
    hotspot.style.height = `${layer.h}%`;
    hotspot.style.color = rule.color;
    if (layer.group === state.activeGroup) hotspot.classList.add("active");
    if (layer.id === state.activeLayerId) hotspot.classList.add("selected");
    if (state.preview && layer.group !== state.activeGroup) hotspot.classList.add("dimmed");
    if (layer.hidden) hotspot.classList.add("hidden-zone");
    hotspot.addEventListener("pointerdown", (event) => startDrag(event, layer.id));
    if (layer.id === state.activeLayerId && !state.preview) {
      const labelButton = document.createElement("span");
      labelButton.className = "label-trigger";
      labelButton.textContent = ROLE_RULES[layer.role].label;
      labelButton.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        renderZonePopup(layer.id);
      });
      hotspot.append(labelButton);

      const duplicateButton = document.createElement("span");
      duplicateButton.className = "quick-duplicate";
      duplicateButton.textContent = "+";
      duplicateButton.title = "Duplicate zone";
      duplicateButton.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        duplicateZone(layer.id);
      });
      hotspot.append(duplicateButton);

      ["nw", "n", "ne", "e", "se", "s", "sw", "w"].forEach((handle) => {
        const grip = document.createElement("span");
        grip.className = `resize-handle ${handle}`;
        grip.dataset.handle = handle;
        grip.addEventListener("pointerdown", (event) => startResize(event, layer.id, handle));
        hotspot.append(grip);
      });
    }
    els.overlayRoot.append(hotspot);
  });
  if (state.preview) {
    const activeLayer = getActiveLayer();
    if (activeLayer) appendInteractionEffect(activeLayer, els.overlayRoot);
  }
}

function appendInteractionEffect(layer, root) {
  const rule = ROLE_RULES[layer.role];
  const effect = document.createElement("div");
  effect.className = `interaction-effect ${layer.role}-effect`;
  effect.style.left = `${layer.x}%`;
  effect.style.top = `${layer.y}%`;
  effect.style.width = `${layer.w}%`;
  effect.style.height = `${layer.h}%`;
  effect.style.color = rule.color;

  const label = escapeHtml(layer.label);
  const prompt = escapeHtml(layer.prompt || rule.interaction);
  const content = {
    title: `<span>${label}</span>`,
    statistic: `<span>${label}</span><b>+24%</b>`,
    content: `<span>${label}</span><i></i>`,
    chart: `<span>${label}</span><i></i>`,
    character: `<span>${prompt}</span>`,
    science: `<span>${label}</span><i></i>`
  };
  effect.innerHTML = content[layer.role] || `<span>${label}</span>`;
  root.append(effect);
}

function renderZonePopup(id) {
  const layer = state.layers.find((item) => item.id === id);
  if (!layer) return;
  const existing = document.querySelector(".zone-popup");
  if (existing) existing.remove();

  const popup = document.createElement("form");
  popup.className = "zone-popup";
  popup.innerHTML = `
    <input type="text" name="zone-label" value="${escapeHtml(layer.label)}" aria-label="Zone label" autocomplete="off" autocorrect="off" spellcheck="false" />
    <select name="zone-role" aria-label="Zone role">
      ${Object.entries(ROLE_RULES).map(([role, rule]) => `<option value="${role}" ${role === layer.role ? "selected" : ""}>${rule.label}</option>`).join("")}
    </select>
    <div class="popup-actions">
      <button type="button" data-action="copy">Copy</button>
      <button type="button" data-action="hide">${layer.hidden ? "Show" : "Hide"}</button>
      <button type="button" data-action="delete">Delete</button>
    </div>
  `;
  popup.style.left = `${clamp(layer.x, 2, 64)}%`;
  popup.style.top = `${clamp(layer.y + layer.h + 1, 2, 78)}%`;
  popup.addEventListener("submit", (event) => event.preventDefault());
  popup.addEventListener("pointerdown", (event) => event.stopPropagation());
  const labelInput = popup.querySelector('[name="zone-label"]');
  const roleSelect = popup.querySelector('[name="zone-role"]');
  labelInput.addEventListener("input", () => {
    layer.label = labelInput.value || "Untitled zone";
    const selectedHotspot = els.overlayRoot.querySelector(".hotspot.selected");
    const label = selectedHotspot?.querySelector(".label-trigger");
    if (label) label.textContent = ROLE_RULES[layer.role].label;
  });
  roleSelect.addEventListener("change", () => {
    layer.role = roleSelect.value;
    audit();
    render();
    renderZonePopup(layer.id);
  });
  popup.querySelector('[data-action="copy"]').addEventListener("click", () => duplicateZone(layer.id));
  popup.querySelector('[data-action="hide"]').addEventListener("click", () => toggleSelectedZone());
  popup.querySelector('[data-action="delete"]').addEventListener("click", () => deleteSelectedZone());
  els.overlayRoot.append(popup);
}

function startDrag(event, id) {
  event.preventDefault();
  const layer = state.layers.find((item) => item.id === id);
  if (!layer) return;
  state.activeLayerId = id;
  state.activeGroup = layer.group;
  const rect = els.overlayRoot.getBoundingClientRect();
  state.drag = {
    id,
    startX: event.clientX,
    startY: event.clientY,
    layerX: layer.x,
    layerY: layer.y,
    rect,
    moved: false
  };
  window.addEventListener("pointermove", dragSelected);
  window.addEventListener("pointerup", endDrag, { once: true });
  render();
}

function dragSelected(event) {
  if (!state.drag) return;
  const layer = state.layers.find((item) => item.id === state.drag.id);
  if (!layer) return;
  const dx = ((event.clientX - state.drag.startX) / state.drag.rect.width) * 100;
  const dy = ((event.clientY - state.drag.startY) / state.drag.rect.height) * 100;
  if (Math.abs(dx) + Math.abs(dy) > 0.7) state.drag.moved = true;
  layer.x = clamp(state.drag.layerX + dx, 0, 100 - layer.w);
  layer.y = clamp(state.drag.layerY + dy, 0, 100 - layer.h);
  audit();
  render();
}

function endDrag() {
  window.removeEventListener("pointermove", dragSelected);
  const drag = state.drag;
  state.drag = null;
  if (drag && !drag.moved) activateLayer(drag.id);
}

function startResize(event, id, handle) {
  event.preventDefault();
  event.stopPropagation();
  const layer = state.layers.find((item) => item.id === id);
  if (!layer) return;
  state.activeLayerId = id;
  state.activeGroup = layer.group;
  const rect = els.overlayRoot.getBoundingClientRect();
  state.drag = {
    type: "resize",
    id,
    handle,
    startX: event.clientX,
    startY: event.clientY,
    layerX: layer.x,
    layerY: layer.y,
    layerW: layer.w,
    layerH: layer.h,
    rect,
    moved: true
  };
  window.addEventListener("pointermove", resizeByHandle);
  window.addEventListener("pointerup", endResize, { once: true });
}

function resizeByHandle(event) {
  if (!state.drag || state.drag.type !== "resize") return;
  const layer = state.layers.find((item) => item.id === state.drag.id);
  if (!layer) return;
  const dx = ((event.clientX - state.drag.startX) / state.drag.rect.width) * 100;
  const dy = ((event.clientY - state.drag.startY) / state.drag.rect.height) * 100;
  const minW = 4;
  const minH = 3;
  let x = state.drag.layerX;
  let y = state.drag.layerY;
  let w = state.drag.layerW;
  let h = state.drag.layerH;

  if (state.drag.handle.includes("e")) w = state.drag.layerW + dx;
  if (state.drag.handle.includes("s")) h = state.drag.layerH + dy;
  if (state.drag.handle.includes("w")) {
    x = state.drag.layerX + dx;
    w = state.drag.layerW - dx;
  }
  if (state.drag.handle.includes("n")) {
    y = state.drag.layerY + dy;
    h = state.drag.layerH - dy;
  }

  if (w < minW) {
    if (state.drag.handle.includes("w")) x = state.drag.layerX + state.drag.layerW - minW;
    w = minW;
  }
  if (h < minH) {
    if (state.drag.handle.includes("n")) y = state.drag.layerY + state.drag.layerH - minH;
    h = minH;
  }

  if (x < 0) {
    w += x;
    x = 0;
  }
  if (y < 0) {
    h += y;
    y = 0;
  }
  if (x + w > 100) w = 100 - x;
  if (y + h > 100) h = 100 - y;

  layer.x = x;
  layer.y = y;
  layer.w = w;
  layer.h = h;
  audit();
  render();
}

function endResize() {
  window.removeEventListener("pointermove", resizeByHandle);
  state.drag = null;
}

function renderAdvancedPanel() {
  const layer = getActiveLayer();
  if (!layer) {
    els.activeTitle.textContent = "Image loaded";
    els.groupField.value = "";
    els.zonePrompt.value = "";
    [els.groupField, els.zonePrompt].forEach((field) => {
      field.disabled = true;
    });
    return;
  }
  [els.groupField, els.zonePrompt].forEach((field) => {
    field.disabled = false;
  });
  const rule = ROLE_RULES[layer.role];
  els.activeTitle.textContent = `${rule.label}: ${rule.interaction}`;
  els.groupField.value = layer.group;
  els.globalPrompt.value = state.globalPrompt;
  els.zonePrompt.value = layer.prompt || "";
}

function activateLayer(id) {
  const layer = state.layers.find((item) => item.id === id);
  if (!layer) return;
  state.activeLayerId = id;
  state.activeGroup = layer.group;
  els.detailCard.hidden = true;
  render();
}

function showGroupPreview() {
  els.detailCard.hidden = true;
}

function updateSelectedFromFields() {
  const layer = getActiveLayer();
  if (!layer) return;
  layer.group = els.groupField.value || "Ungrouped";
  layer.prompt = els.zonePrompt.value;
  state.activeGroup = layer.group;
  audit();
  render();
}

function addZone() {
  const newLayer = {
    id: `zone-${Date.now()}`,
    role: "content",
    group: state.activeGroup || "New Step",
    label: "New zone",
    x: 28,
    y: 38,
    w: 42,
    h: 12,
    prompt: ""
  };
  state.layers.push(newLayer);
  state.activeLayerId = newLayer.id;
  state.activeGroup = newLayer.group;
  audit();
  render();
}

function duplicateZone(id) {
  const source = state.layers.find((layer) => layer.id === id);
  if (!source) return;
  const copy = {
    ...source,
    id: `zone-${Date.now()}`,
    label: `${source.label} copy`,
    x: clamp(source.x + 3, 0, 100 - source.w),
    y: clamp(source.y + 3, 0, 100 - source.h)
  };
  state.layers.push(copy);
  state.activeLayerId = copy.id;
  state.activeGroup = copy.group;
  audit();
  render();
}

function toggleSelectedZone() {
  const layer = getActiveLayer();
  if (!layer) return;
  layer.hidden = !layer.hidden;
  audit();
  render();
}

function deleteSelectedZone() {
  if (state.layers.length <= 1) return;
  state.layers = state.layers.filter((layer) => layer.id !== state.activeLayerId);
  state.activeLayerId = state.layers[0].id;
  state.activeGroup = state.layers[0].group;
  audit();
  render();
}

function getGroups() {
  const map = new Map();
  state.layers.forEach((layer) => {
    if (!map.has(layer.group)) map.set(layer.group, []);
    map.get(layer.group).push(layer);
  });
  return Array.from(map, ([name, layers]) => ({ name, layers }));
}

function getActiveLayer() {
  return state.layers.find((layer) => layer.id === state.activeLayerId) || state.layers[0] || null;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  })[char]);
}

function exportHtml() {
  const doc = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>Interactive Infographic</title>
<style>
:root{font-family:"Trebuchet MS",Arial,sans-serif;color:#37281f}
body{margin:0;background:linear-gradient(135deg,#ffd17d,#ffdf9d)}
.app{width:min(100%,430px);margin:0 auto;min-height:100vh;padding:12px;background:linear-gradient(rgba(94,131,118,.08) 1px,transparent 1px),linear-gradient(90deg,rgba(94,131,118,.08) 1px,transparent 1px),linear-gradient(#fff2bf,#ffd890);background-size:22px 22px,22px 22px,auto}
.frame{position:relative;aspect-ratio:9/16;background:#fff;border:3px solid #4b3526;border-radius:22px;overflow:hidden;box-shadow:0 16px 0 rgba(69,45,25,.16),0 25px 42px rgba(106,66,31,.2)}
img{width:100%;height:100%;object-fit:contain;display:block}
.spot{position:absolute;border:2px dashed currentColor;border-radius:14px;background:color-mix(in srgb,currentColor 10%,transparent);padding:0;transition:opacity .18s ease,transform .18s ease,box-shadow .18s ease;animation:pulse 2.4s ease-in-out infinite}
.spot.dim{opacity:.13;animation:none}.spot.active{background:color-mix(in srgb,currentColor 22%,transparent);box-shadow:0 0 0 5px color-mix(in srgb,currentColor 26%,transparent);transform:translateY(-1px);opacity:1}
.spot span,.effect span{position:absolute;left:7px;top:7px;max-width:calc(100% - 14px);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:rgba(255,253,240,.96);border-radius:999px;padding:4px 8px;color:currentColor;font-size:10px;font-weight:900;text-transform:uppercase}
.effect{position:absolute;z-index:4;pointer-events:none;border-radius:16px;color:inherit}
.title-effect{box-shadow:inset 0 0 0 999px rgba(255,253,240,.18),0 0 0 6px color-mix(in srgb,currentColor 24%,transparent);animation:titlePop .7s ease both}
.statistic-effect b{position:absolute;right:8px;bottom:8px;min-width:54px;border-radius:999px;padding:7px 10px;background:currentColor;color:#fffdf0;font-size:20px;line-height:1;animation:countPop .8s ease both}
.content-effect{background:linear-gradient(90deg,color-mix(in srgb,currentColor 18%,transparent),transparent 62%);animation:revealWash .9s ease both}.content-effect i{position:absolute;left:10px;right:10px;bottom:10px;height:7px;border-radius:999px;background:currentColor;transform-origin:left;animation:traceGrow .9s ease both}
.chart-effect{overflow:hidden}.chart-effect:before{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,color-mix(in srgb,currentColor 28%,transparent),transparent);transform:translateX(-100%);animation:scanAcross 1.15s ease both}.chart-effect i{position:absolute;left:10%;right:10%;bottom:16%;height:34%;border-left:10px solid currentColor;border-right:10px solid currentColor;background:linear-gradient(to top,currentColor 0 65%,transparent 65%);opacity:.75;animation:barRise .85s ease both}
.character-effect span{left:auto;right:8px;top:-12px;max-width:min(180px,92%);text-transform:none;color:#37281f;animation:bubbleIn .65s ease both}.science-effect{background:linear-gradient(90deg,currentColor 50%,transparent 0) 0 50%/18px 3px repeat-x;animation:traceDash .95s linear both}.science-effect i{position:absolute;right:8px;top:calc(50% - 8px);width:16px;height:16px;border-top:4px solid currentColor;border-right:4px solid currentColor;transform:rotate(45deg)}
.card{margin-top:12px;background:#fffdf0;border:2px solid #4b3526;border-radius:18px;padding:12px 14px;box-shadow:0 6px 0 rgba(75,53,38,.18);font-size:13px;line-height:1.4}.card strong{display:block;font-size:15px;margin-bottom:4px}.hint{font-size:12px;color:#8a6b4d;margin-top:6px}
@keyframes pulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,currentColor 28%,transparent)}50%{box-shadow:0 0 0 6px color-mix(in srgb,currentColor 4%,transparent)}}@keyframes titlePop{from{opacity:0;transform:scale(.98)}to{opacity:1;transform:scale(1)}}@keyframes countPop{from{opacity:0;transform:translateY(12px) scale(.7)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes revealWash{from{opacity:0;clip-path:inset(0 100% 0 0)}to{opacity:1;clip-path:inset(0)}}@keyframes traceGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}@keyframes scanAcross{to{transform:translateX(100%)}}@keyframes barRise{from{opacity:0;transform:scaleY(0);transform-origin:bottom}to{opacity:.75;transform:scaleY(1);transform-origin:bottom}}@keyframes bubbleIn{from{opacity:0;transform:translateY(8px) scale(.92)}to{opacity:1;transform:translateY(0) scale(1)}}@keyframes traceDash{from{background-position-x:0;opacity:0}to{background-position-x:36px;opacity:1}}
</style>
</head>
<body>
<main class="app"><section id="frame" class="frame"><img src="${state.imageSrc}" alt="Interactive infographic"></section><article id="card" class="card"><strong>Tap a highlighted area</strong><div>The infographic itself will react.</div><div class="hint">No note-only mode.</div></article></main>
<script>
const layers=${JSON.stringify(state.layers.filter((layer) => !layer.hidden))};
const rules=${JSON.stringify(ROLE_RULES)};
let activeId=layers[0]?.id||null;
const frame=document.getElementById('frame'),card=document.getElementById('card');
function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]))}
function effectMarkup(l){const r=rules[l.role],label=esc(l.label),prompt=esc(l.prompt||r.interaction);return {title:'<span>'+label+'</span>',statistic:'<span>'+label+'</span><b>+24%</b>',content:'<span>'+label+'</span><i></i>',chart:'<span>'+label+'</span><i></i>',character:'<span>'+prompt+'</span>',science:'<span>'+label+'</span><i></i>'}[l.role]||'<span>'+label+'</span>'}
function render(){frame.querySelectorAll('button,.effect').forEach(n=>n.remove());layers.forEach(l=>{const r=rules[l.role],b=document.createElement('button');b.type='button';b.className='spot '+(l.id===activeId?'active':'dim');b.style.cssText='left:'+l.x+'%;top:'+l.y+'%;width:'+l.w+'%;height:'+l.h+'%;color:'+r.color;const s=document.createElement('span');s.textContent=r.label;b.append(s);b.onclick=()=>{activeId=l.id;card.innerHTML='<strong>'+esc(l.label)+'</strong><div>'+esc(r.interaction)+'</div><div class="hint">'+esc(l.prompt||'Tap another zone to change the scene.')+'</div>';render()};frame.append(b)});const active=layers.find(l=>l.id===activeId);if(active){const r=rules[active.role],e=document.createElement('div');e.className='effect '+active.role+'-effect';e.style.cssText='left:'+active.x+'%;top:'+active.y+'%;width:'+active.w+'%;height:'+active.h+'%;color:'+r.color;e.innerHTML=effectMarkup(active);frame.append(e)}}
render();
<\/script>
</body>
</html>`;
  const blob = new Blob([doc], { type: "text/html" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "mobile-interactive-infographic.html";
  a.click();
  URL.revokeObjectURL(url);
}

audit();
render();
