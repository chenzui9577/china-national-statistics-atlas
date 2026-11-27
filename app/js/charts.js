// 手绘 Canvas 图表工具：折线、柱状与环形图，带网格、渐入动画与悬停读数，全部用原生 Canvas 绘制，不引入任何图表库。
// 设计原则：坐标轴用年鉴式细线，数字用等宽排版，颜色只取站点的墨蓝、朱红与黛绿三色，让图表像印在纸上的统计图。
(function () {
  const INK = '#22314a';
  const FAINT = '#8a94a6';
  const GRID = 'rgba(34,49,74,0.10)';
  const RED = '#b3543f';
  const BLUE = '#31517a';
  const GREEN = '#7a9a5b';

  function setupCanvas(canvas) {
    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = Math.max(10, Math.round(rect.width * ratio));
    canvas.height = Math.max(10, Math.round(rect.height * ratio));
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    return { ctx, width: rect.width, height: rect.height };
  }

  function animate(draw) {
    const start = performance.now();
    const duration = 650;
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      draw(eased);
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  // 折线图：seriesList 每项 {label, color, values}，xLabels 与年份一一对应；支持悬停时显示最近点读数。
  function lineChart(canvas, xLabels, seriesList, opts) {
    const options = opts || {};
    const { ctx, width, height } = setupCanvas(canvas);
    const padL = 52, padR = 14, padT = 16, padB = 28;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    let min = Infinity, max = -Infinity;
    seriesList.forEach((s) => s.values.forEach((v) => { if (v < min) min = v; if (v > max) max = v; }));
    if (options.min != null) min = options.min;
    const span = (max - min) || 1;
    max += span * 0.08;
    const xAt = (i) => padL + (plotW * i) / (xLabels.length - 1);
    const yAt = (v) => padT + plotH - ((v - min) / (max - min)) * plotH;
    let hoverIndex = -1;

    function draw(progress) {
      ctx.clearRect(0, 0, width, height);
      ctx.font = '11px "Noto Sans SC", sans-serif';
      ctx.fillStyle = FAINT;
      ctx.strokeStyle = GRID;
      ctx.lineWidth = 1;
      for (let g = 0; g <= 4; g++) {
        const value = min + ((max - min) * g) / 4;
        const y = yAt(value);
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
        ctx.textAlign = 'right';
        ctx.fillText(options.format ? options.format(value) : String(Math.round(value)), padL - 8, y + 4);
      }
      ctx.textAlign = 'center';
      xLabels.forEach((label, i) => {
        if (i % options.labelEvery === 0 || i === xLabels.length - 1) {
          ctx.fillText(String(label), xAt(i), padT + plotH + 18);
        }
      });
      seriesList.forEach((s) => {
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        const upto = Math.max(2, Math.floor(s.values.length * progress));
        for (let i = 0; i < upto; i++) {
          const x = xAt(i), y = yAt(s.values[i]);
          if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
        }
        ctx.stroke();
        ctx.fillStyle = s.color;
        const lastX = xAt(upto - 1), lastY = yAt(s.values[upto - 1]);
        ctx.beginPath(); ctx.arc(lastX, lastY, 3.2, 0, Math.PI * 2); ctx.fill();
      });
      if (hoverIndex >= 0) {
        const x = xAt(hoverIndex);
        ctx.strokeStyle = 'rgba(179,84,63,0.45)';
        ctx.setLineDash([4, 4]);
        ctx.beginPath(); ctx.moveTo(x, padT); ctx.lineTo(x, padT + plotH); ctx.stroke();
        ctx.setLineDash([]);
        seriesList.forEach((s) => {
          ctx.fillStyle = s.color;
          ctx.beginPath(); ctx.arc(x, yAt(s.values[hoverIndex]), 4.4, 0, Math.PI * 2); ctx.fill();
        });
      }
    }
    animate(draw);
    canvas.onmousemove = (ev) => {
      const rect = canvas.getBoundingClientRect();
      const rel = (ev.clientX - rect.left - padL) / plotW;
      const idx = Math.round(rel * (xLabels.length - 1));
      hoverIndex = Math.max(0, Math.min(xLabels.length - 1, idx));
      draw(1);
      if (options.onHover) {
        const parts = seriesList.map((s) => `${s.label} ${options.format ? options.format(s.values[hoverIndex]) : s.values[hoverIndex]}`);
        options.onHover(`${xLabels[hoverIndex]} 年 · ${parts.join(' · ')}`);
      }
    };
    canvas.onmouseleave = () => { hoverIndex = -1; draw(1); if (options.onHover) options.onHover(''); };
  }

  // 柱状图：items 每项 {label, value, color}，适合出生人口这类单一系列的年度对比。
  function barChart(canvas, items, opts) {
    const options = opts || {};
    const { ctx, width, height } = setupCanvas(canvas);
    const padL = 46, padR = 10, padT = 18, padB = 28;
    const plotW = width - padL - padR;
    const plotH = height - padT - padB;
    let max = 0;
    items.forEach((it) => { if (it.value > max) max = it.value; });
    max *= 1.12;
    const slot = plotW / items.length;
    const barW = Math.min(34, slot * 0.58);
    function draw(progress) {
      ctx.clearRect(0, 0, width, height);
      ctx.font = '11px "Noto Sans SC", sans-serif';
      ctx.fillStyle = FAINT;
      ctx.strokeStyle = GRID;
      for (let g = 0; g <= 4; g++) {
        const y = padT + plotH - (plotH * g) / 4;
        ctx.beginPath(); ctx.moveTo(padL, y); ctx.lineTo(padL + plotW, y); ctx.stroke();
        ctx.textAlign = 'right';
        ctx.fillText(options.format ? options.format((max * g) / 4) : String(Math.round((max * g) / 4)), padL - 8, y + 4);
      }
      items.forEach((it, i) => {
        const h = (it.value / max) * plotH * progress;
        const x = padL + slot * i + (slot - barW) / 2;
        const y = padT + plotH - h;
        ctx.fillStyle = it.color || BLUE;
        ctx.beginPath();
        ctx.roundRect(x, y, barW, h, [4, 4, 0, 0]);
        ctx.fill();
        ctx.fillStyle = INK;
        ctx.textAlign = 'center';
        if (progress > 0.9) ctx.fillText(String(it.value), x + barW / 2, y - 6);
        ctx.fillStyle = FAINT;
        ctx.fillText(String(it.label), x + barW / 2, padT + plotH + 18);
      });
    }
    animate(draw);
  }

  // 环形图：parts 每项 {name, share, tone}，中心写总计说明，适合产业结构。
  function donutChart(canvas, parts, centerText) {
    const { ctx, width, height } = setupCanvas(canvas);
    const cx = width / 2, cy = height / 2;
    const radius = Math.min(width, height) / 2 - 12;
    function draw(progress) {
      ctx.clearRect(0, 0, width, height);
      let angle = -Math.PI / 2;
      parts.forEach((p) => {
        const sweep = (p.share / 100) * Math.PI * 2 * progress;
        ctx.beginPath();
        ctx.strokeStyle = p.tone;
        ctx.lineWidth = Math.max(16, radius * 0.30);
        ctx.arc(cx, cy, radius - ctx.lineWidth / 2, angle, angle + sweep);
        ctx.stroke();
        angle += (p.share / 100) * Math.PI * 2;
      });
      ctx.fillStyle = INK;
      ctx.font = '600 15px "Noto Serif SC", serif';
      ctx.textAlign = 'center';
      ctx.fillText(centerText, cx, cy + 5);
    }
    animate(draw);
  }

  window.ATLAS_CHARTS = { lineChart, barChart, donutChart, colors: { ink: INK, faint: FAINT, red: RED, blue: BLUE, green: GREEN } };
})();
