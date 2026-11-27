// 中国数据图谱的主程序：哈希路由、总览页渲染（大数字滚动动画、长时序图与年度故事）与导航高亮。
// 路由表只有五条：总览、省份图谱、趋势长河、专题、数据说明；任何未知路径都回到总览，保证没有死链接。
(function () {
  const root = document.getElementById('viewRoot');
  const nav = document.getElementById('mainNav');
  const national = window.ATLAS_NATIONAL;

  function countUp(el, target, decimals) {
    const start = performance.now();
    const duration = 900;
    function frame(now) {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = target * eased;
      el.firstChild.textContent = decimals > 0
        ? value.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
        : Math.round(value).toLocaleString('zh-CN');
      if (t < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function renderHome() {
    root.innerHTML = `
      <section class="hero">
        <h1 class="serif">一个国家的一年，<br>装进一本可以逛的年鉴</h1>
        <p>这里没有堆成山的表格，只有把中国讲清楚的数字：134.9 万亿元的经济总量、14.08 亿人、31 个省份、二十年的来路。慢慢逛，每个数字都能点、能拖、能比。</p>
        <div class="hero-links">
          <a href="#/atlas">逛省份图谱 →</a>
          <a href="#/trends">拖动二十年时间 →</a>
          <a href="#/topics">读三个专题 →</a>
        </div>
      </section>
      <div class="kpi-grid" id="kpiGrid"></div>
      <div class="card">
        <h3 class="serif">二十年长河：GDP 与城镇化率</h3>
        <p class="card-sub">一条线往上冲，一条线稳稳爬。把鼠标放上图面，可以读到每一年的确切数字。</p>
        <div class="chart-box tall"><canvas id="homeLine"></canvas></div>
        <p class="chart-readout" id="homeReadout"></p>
      </div>
      <section class="page-head" style="margin-top:26px">
        <p class="page-kicker">年度焦点 · STORIES</p>
        <h2 class="page-title serif" style="font-size:26px">把大数字，讲成小故事</h2>
      </section>
      <div class="story-list">
        ${national.stories.map((s) => `<article class="story-card"><div class="story-year">${s.year}</div><div><h3 class="serif">${s.title}</h3><p>${s.body}</p></div></article>`).join('')}
      </div>
      <div class="insight"><p>接下来去哪儿？想看地方差异，去<a href="#/atlas">省份图谱</a>点一块瓷砖；想感受时间，去<a href="#/trends">趋势长河</a>按下播放；想要解读，去<a href="#/topics">专题</a>慢慢读。</p></div>`;

    const grid = root.querySelector('#kpiGrid');
    national.highlights2024.forEach((h) => {
      const card = document.createElement('div');
      card.className = 'kpi-card';
      card.innerHTML = `<div class="kpi-label">${h.label} · 2024</div><div class="kpi-value"><span>0</span><span class="kpi-unit">${h.unit}</span></div><p class="kpi-hint">${h.hint}</p>`;
      grid.appendChild(card);
      countUp(card.querySelector('.kpi-value'), h.value, h.decimals);
    });

    const charts = window.ATLAS_CHARTS;
    charts.lineChart(root.querySelector('#homeLine'), national.years, [
      { label: 'GDP（万亿元）', color: charts.colors.red, values: national.gdp },
      { label: '城镇化率（%）', color: charts.colors.blue, values: national.urbanRate },
    ], { labelEvery: 3, format: (v) => (v >= 100 ? v.toFixed(0) : v.toFixed(1)), onHover: (t) => { root.querySelector('#homeReadout').textContent = t; } });
  }

  const routes = {
    '/': { nav: 'home', render: renderHome },
    '/atlas': { nav: 'atlas', render: () => window.ATLAS_VIEWS.atlas(root) },
    '/trends': { nav: 'trends', render: () => window.ATLAS_VIEWS.trends(root) },
    '/topics': { nav: 'topics', render: () => window.ATLAS_VIEWS.topics(root) },
    '/about': { nav: 'about', render: () => window.ATLAS_VIEWS.about(root) },
  };

  function dispatch() {
    const raw = window.location.hash.replace(/^#/, '') || '/';
    const route = routes[raw] || routes['/'];
    nav.querySelectorAll('a').forEach((a) => a.classList.toggle('active', a.getAttribute('data-nav') === route.nav));
    route.render();
    window.scrollTo({ top: 0 });
  }

  window.addEventListener('hashchange', dispatch);
  dispatch();
})();
