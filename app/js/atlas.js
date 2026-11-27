// 省份图谱视图：31 省瓷砖地图（按地理大致排布的方格图）、指标切换、省份详情、双省对比与可排序数据表。
// 颜色深浅由当前指标的数值映射，点选省份看详情，再点另一个省份进入对比，表格列头可点击排序。
(function () {
  const METRICS = [
    { key: 'gdp', label: 'GDP（亿元）', format: (v) => v.toLocaleString('zh-CN') },
    { key: 'pop', label: '常住人口（万人）', format: (v) => v.toLocaleString('zh-CN') },
    { key: 'income', label: '人均可支配收入（元）', format: (v) => v.toLocaleString('zh-CN') },
    { key: 'urban', label: '城镇化率（%）', format: (v) => v.toFixed(1) },
  ];

  function colorFor(value, min, max) {
    const t = max === min ? 0.5 : (value - min) / (max - min);
    // 从浅黛蓝到深墨蓝再到朱红：低值冷静、高值醒目，像年鉴里的分级设色图。
    if (t < 0.55) {
      const k = t / 0.55;
      const r = Math.round(146 + (49 - 146) * k);
      const g = Math.round(168 + (81 - 168) * k);
      const b = Math.round(196 + (122 - 196) * k);
      return `rgb(${r},${g},${b})`;
    }
    const k = (t - 0.55) / 0.45;
    const r = Math.round(49 + (179 - 49) * k);
    const g = Math.round(81 + (84 - 81) * k);
    const b = Math.round(122 + (63 - 122) * k);
    return `rgb(${r},${g},${b})`;
  }

  function renderAtlas(root) {
    const provinces = window.ATLAS_PROVINCES;
    let metricKey = 'gdp';
    let selected = provinces.find((p) => p.name === '广东');
    let compare = provinces.find((p) => p.name === '江苏');
    let sortKey = 'gdp';
    let sortAsc = false;

    root.innerHTML = `
      <section class="page-head">
        <p class="page-kicker">省份图谱 · PROVINCE ATLAS</p>
        <h2 class="page-title serif">三十一个地方，三十一种活法</h2>
        <p class="page-lede">把地图折成方格，每个省一块瓷砖，颜色深浅就是数字大小。点一块看它的详情，再点另一块，两省立刻同台对比——谁的家底厚、谁的日子润，一眼见分晓。</p>
      </section>
      <div class="btn-row" id="metricRow"></div>
      <div class="two-col">
        <div class="card">
          <h3 class="serif">瓷砖地图</h3>
          <p class="card-sub">位置按地理大致排布：上北下南，左西右东。颜色对应当前指标。</p>
          <div class="tile-grid" id="tileGrid"></div>
          <div class="legend"><span><i style="background:#92a8c4"></i>较低</span><span><i style="background:#31517a"></i>中等</span><span><i style="background:#b3543f"></i>较高</span></div>
        </div>
        <div class="card province-detail" id="detailCard"></div>
      </div>
      <div class="card" id="compareCard"></div>
      <div class="card">
        <h3 class="serif">三十一省一览表（2024 年）</h3>
        <p class="card-sub">点击列头可以排序，找第一名和找家乡都方便。</p>
        <div style="overflow-x:auto"><table class="data-table" id="provinceTable"></table></div>
      </div>`;

    const metricRow = root.querySelector('#metricRow');
    const tileGrid = root.querySelector('#tileGrid');
    const detailCard = root.querySelector('#detailCard');
    const compareCard = root.querySelector('#compareCard');
    const table = root.querySelector('#provinceTable');
    const maxCol = Math.max(...provinces.map((p) => p.col)) + 1;
    tileGrid.style.gridTemplateColumns = `repeat(${maxCol}, 1fr)`;

    function currentMetric() { return METRICS.find((m) => m.key === metricKey); }

    function drawMetrics() {
      metricRow.innerHTML = '';
      METRICS.forEach((m) => {
        const btn = document.createElement('button');
        btn.className = 'btn red' + (m.key === metricKey ? ' active' : '');
        btn.textContent = m.label;
        btn.onclick = () => { metricKey = m.key; drawAll(); };
        metricRow.appendChild(btn);
      });
    }

    function drawTiles() {
      const metric = currentMetric();
      const values = provinces.map((p) => p[metricKey]);
      const min = Math.min(...values), max = Math.max(...values);
      tileGrid.innerHTML = '';
      provinces.forEach((p) => {
        const tile = document.createElement('button');
        tile.className = 'tile' + (selected && p.name === selected.name ? ' selected' : '') + (compare && p.name === compare.name ? ' compare' : '');
        tile.style.gridColumnStart = String(p.col + 1);
        tile.style.gridRowStart = String(p.row + 1);
        tile.style.background = colorFor(p[metricKey], min, max);
        tile.innerHTML = `<b>${p.name}</b><span>${metric.format(p[metricKey])}</span>`;
        tile.title = `${p.name} · ${metric.label} ${metric.format(p[metricKey])}`;
        tile.onclick = () => {
          if (selected && p.name !== selected.name) { compare = selected; }
          selected = p;
          drawAll();
        };
        tileGrid.appendChild(tile);
      });
    }

    function drawDetail() {
      if (!selected) { detailCard.innerHTML = '<p>点一块瓷砖，这里会出现它的详情。</p>'; return; }
      const p = selected;
      const gdpRank = [...provinces].sort((a, b) => b.gdp - a.gdp).findIndex((x) => x.name === p.name) + 1;
      const incomeRank = [...provinces].sort((a, b) => b.income - a.income).findIndex((x) => x.name === p.name) + 1;
      detailCard.innerHTML = `
        <p class="page-kicker">${p.region} · 第 ${gdpRank} 位（GDP）</p>
        <h3 class="serif">${p.name}</h3>
        <p class="detail-note">${p.note}</p>
        <div class="detail-grid">
          <div class="detail-cell"><b>${p.gdp.toLocaleString('zh-CN')} 亿元</b><span>地区生产总值 2024</span></div>
          <div class="detail-cell"><b>${p.pop.toLocaleString('zh-CN')} 万人</b><span>常住人口</span></div>
          <div class="detail-cell"><b>${p.income.toLocaleString('zh-CN')} 元</b><span>居民人均可支配收入 · 第 ${incomeRank} 位</span></div>
          <div class="detail-cell"><b>${p.urban.toFixed(1)}%</b><span>常住人口城镇化率</span></div>
        </div>
        <p class="card-sub">人均 GDP 约 ${Math.round((p.gdp * 10000) / p.pop).toLocaleString('zh-CN')} 元。再点另一个省份，下方会自动生成两省对比。</p>`;
    }

    function drawCompare() {
      if (!selected || !compare || selected.name === compare.name) {
        compareCard.innerHTML = '<h3 class="serif">双省对比</h3><p class="card-sub">先选一个省份，再点另一个，就能看到它们同台对比。</p>';
        return;
      }
      const rows = METRICS.map((m) => {
        const a = selected[m.key], b = compare[m.key];
        const total = a + b;
        return `<div class="compare-row"><span>${selected.name} · ${m.format(a)}</span><span class="bar-track"><span class="bar-a" style="width:${(a / total) * 100}%"></span><span class="bar-b" style="width:${(b / total) * 100}%"></span></span><span style="text-align:right">${compare.name} · ${m.format(b)}</span></div><div class="compare-label">${m.label}</div>`;
      }).join('');
      compareCard.innerHTML = `
        <h3 class="serif">双省对比：${selected.name} × ${compare.name}</h3>
        <p class="card-sub"><span class="tag">朱红 = ${selected.name}</span><span class="tag">墨蓝 = ${compare.name}</span> 条长按两省合计的占比分配。</p>
        <div class="compare-bars">${rows}</div>
        <div class="insight"><p>${selected.name}的 GDP 是 ${compare.name} 的 ${(selected.gdp / compare.gdp).toFixed(2)} 倍，常住人口相差 ${Math.abs(selected.pop - compare.pop).toLocaleString('zh-CN')} 万人；收入上${selected.income >= compare.income ? selected.name : compare.name}更胜一筹。数字背后，是两种不同的发展路径。</p></div>`;
    }

    function drawTable() {
      const sorted = [...provinces].sort((a, b) => (sortAsc ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey]));
      const head = [['name', '省份'], ['gdp', 'GDP（亿元）'], ['pop', '人口（万人）'], ['income', '人均收入（元）'], ['urban', '城镇化率（%）']]
        .map(([k, label]) => `<th data-sort="${k}">${label}${sortKey === k ? (sortAsc ? ' ↑' : ' ↓') : ''}</th>`).join('');
      const body = sorted.map((p) => `<tr><td>${p.name}</td><td>${p.gdp.toLocaleString('zh-CN')}</td><td>${p.pop.toLocaleString('zh-CN')}</td><td>${p.income.toLocaleString('zh-CN')}</td><td>${p.urban.toFixed(1)}</td></tr>`).join('');
      table.innerHTML = `<thead><tr>${head}</tr></thead><tbody>${body}</tbody>`;
      table.querySelectorAll('th').forEach((th) => {
        th.onclick = () => {
          const k = th.getAttribute('data-sort');
          if (k === 'name') return;
          if (sortKey === k) sortAsc = !sortAsc; else { sortKey = k; sortAsc = false; }
          drawTable();
        };
      });
    }

    function drawAll() { drawMetrics(); drawTiles(); drawDetail(); drawCompare(); drawTable(); }
    drawAll();
  }

  window.ATLAS_VIEWS = window.ATLAS_VIEWS || {};
  window.ATLAS_VIEWS.atlas = renderAtlas;
})();
