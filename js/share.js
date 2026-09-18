"use strict";

// Loaded on demand; no build step or server-side rendering required.
const SHARE_LIBRARY_URL = "https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.js";
const SHARE_EXPORT_OPTIONS = Object.freeze({
  width: 540, height: 720, pixelRatio: 2,
  backgroundColor: "#0d1019", skipFonts: true,
  style: { position: "relative", left: "0", top: "0", margin: "0", transform: "none" }
});

function withShareTimeout(promise, milliseconds = 20000) {
  let timer;
  return Promise.race([
    promise,
    new Promise((_, reject) => { timer = setTimeout(() => reject(new Error("分享卡生成超时")), milliseconds); })
  ]).finally(() => clearTimeout(timer));
}

function createShareController() {
  const card = document.querySelector("#share-card");
  const button = document.querySelector("#generate-share");
  const status = document.querySelector("#share-note");
  const preview = document.querySelector("#share-preview");
  const image = document.querySelector("#share-image");
  const save = document.querySelector("#share-download");
  let current = null;
  let revision = 0;
  let busy = false;
  let libraryPromise = null;
  const jobs = new Set();

  function loadLibrary() {
    if (window.htmlToImage?.toPng) return Promise.resolve(window.htmlToImage);
    if (libraryPromise) return libraryPromise;
    const script = document.createElement("script");
    script.src = SHARE_LIBRARY_URL;
    script.crossOrigin = "anonymous";
    const loading = new Promise((resolve, reject) => {
      script.onload = () => window.htmlToImage?.toPng ? resolve(window.htmlToImage) : reject(new Error("导出库不可用"));
      script.onerror = () => reject(new Error("导出库加载失败"));
      document.head.append(script);
    });
    libraryPromise = withShareTimeout(loading, 12000).catch(error => {
      script.remove();
      libraryPromise = null;
      throw error;
    });
    return libraryPromise;
  }

  function clear() {
    revision += 1;
    current = null;
    busy = false;
    jobs.forEach(node => node.remove());
    jobs.clear();
    card.querySelectorAll("[data-share]").forEach(node => node.replaceChildren());
    preview.hidden = true;
    image.removeAttribute("src");
    image.alt = "";
    save.removeAttribute("href");
    save.removeAttribute("download");
    button.disabled = true;
    button.textContent = "生成人格分享卡";
    button.setAttribute("aria-busy", "false");
    status.textContent = "完成测试后可生成人格分享卡。";
  }

  function populate() {
    const { result, profile } = current;
    const fields = {
      type: result.type, nickname: profile.nickname, symbol: profile.symbol,
      summary: profile.summary.match(/[^。！？]+[。！？]?/)?.[0] || profile.summary
    };
    Object.entries(fields).forEach(([key, value]) => {
      card.querySelector(`[data-share="${key}"]`).textContent = value;
    });
    const tags = card.querySelector('[data-share="keywords"]');
    tags.replaceChildren();
    profile.keywords.forEach(word => {
      const li = document.createElement("li"); li.textContent = word; tags.append(li);
    });
    const dimensions = card.querySelector('[data-share="dimensions"]');
    dimensions.replaceChildren();
    const labels = { EI: ["外向", "内向"], SN: ["实感", "直觉"], TF: ["思考", "情感"], JP: ["判断", "感知"] };
    result.dimensions.forEach(item => {
      const row = document.createElement("div"); row.className = "share-dimension";
      const heading = document.createElement("div"); heading.className = "share-dimension-labels";
      [item.positivePercent, item.negativePercent].forEach((percent, index) => {
        const label = document.createElement("span");
        label.textContent = `${item.dimension[index]} ${labels[item.dimension][index]} ${percent}%`;
        heading.append(label);
      });
      const bar = document.createElement("div"); bar.className = "share-dimension-bar";
      const fill = document.createElement("span"); fill.style.width = `${item.positivePercent}%`; bar.append(fill);
      row.append(heading, bar); dimensions.append(row);
    });
  }

  function setResult(result, profile) {
    clear();
    current = JSON.parse(JSON.stringify({ result, profile }));
    populate();
    button.disabled = false;
    status.textContent = "生成 1080 × 1440 PNG，保存后即可发给朋友。";
  }

  async function generate() {
    if (!current || busy) return;
    const token = revision;
    const type = current.result.type;
    let host;
    busy = true;
    button.disabled = true;
    button.textContent = "生成中…";
    button.setAttribute("aria-busy", "true");
    status.textContent = "正在绘制你的性格星图…";
    try {
      const library = await loadLibrary();
      if (token !== revision) return;
      await withShareTimeout(document.fonts?.ready || Promise.resolve());
      if (token !== revision) return;
      populate();
      // Capture a measurable clone, while keeping the original hidden and inert.
      host = document.createElement("div");
      host.className = "share-render-host";
      host.setAttribute("aria-hidden", "true");
      const clone = card.cloneNode(true);
      clone.removeAttribute("id");
      clone.hidden = false;
      host.append(clone);
      document.body.append(host);
      jobs.add(host);
      const dataUrl = await withShareTimeout(library.toPng(clone, SHARE_EXPORT_OPTIONS));
      if (token !== revision) return;
      if (!dataUrl.startsWith("data:image/png;base64,")) throw new Error("PNG数据无效");
      const filename = `inner-atlas-${type}.png`;
      image.src = dataUrl;
      image.alt = `内在星图 ${type} 人格分享卡`;
      save.href = dataUrl;
      save.download = filename;
      preview.hidden = false;
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = filename;
      document.body.append(link);
      try { link.click(); } finally { link.remove(); }
      status.textContent = "分享卡已生成。若未自动下载，可点击保存图片，或长按下方图片保存。";
    } catch (error) {
      if (token === revision) status.textContent = "分享卡生成失败，请稍后重试。";
    } finally {
      if (host) { host.remove(); jobs.delete(host); }
      if (token === revision) {
        busy = false;
        button.disabled = !current;
        button.textContent = "生成人格分享卡";
        button.setAttribute("aria-busy", "false");
      }
    }
  }

  button.addEventListener("click", generate);
  clear();
  return { setResult, clear, generate };
}

if (typeof document !== "undefined") window.atlasShare = createShareController();
