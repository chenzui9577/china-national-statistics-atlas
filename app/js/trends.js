// 趋势长河视图：年份滑杆驱动的时间机器、播放动画，以及 GDP 与人口双线长时序图、出生人口柱状图。
// 拖动滑杆回到任意一年，指标卡随年份即时变化；点播放，年轮自己往前走，像翻一本会动的年鉴。
(function () {
  function renderTrends(root) {
    const data = window.ATLAS_NATIONAL;
    const charts = window.ATLAS_CHARTS;
    let yearIndex = data.years.length - 1;
    let timer = null;

    root.innerHTML = `
      <section class="page-head">
        <p class="page-kicker">趋势长河 · TRENDS 2005 — 2024</p>
        <h2 class="page-title serif">二十年，浓缩成一条可以拖动的河</h2>
        <p class="page-lede">左边是 2005 年，右边是今天。拖动滑杆，或者按下播放，看着 GDP 从 18 万亿走到 134 万亿，看着城镇里的人一年比一年多——时间在这里是有形状的。</p>
      </section>
      <div class="card time-machine">
        <div class="play-row">
          <div class="year-big"><span id="tmYear">2024</span><small>年</small></div>
          <button class="btn red active" id="tmPlay">▶ 播放二十年</button>
          <span class="card-sub" id="tmCaption" style="margin:0"></span>
        </div>
        <input type="range" class="year-slider" id="tmSlider" min="0" max="${data.years.length - 1}" step="1" value="${yearIndex}">
        <div class="time-stats">
          <div class="time-stat"><b id="tmGdp">—</b><span>国内生产总值（万亿元）</span></div>
          <div class="time-stat"><b id="tmPop">—</b><span>年末总人口（万人）</span></div>
          <div class="time-stat"><b id="tmUrban">—</b><span>城镇化率</span></div>
          <div class="time-stat"><b id="tmPer">—</b><span>人均 GDP（元）</span></div>
        </div>
        <p class="card-sub" id="tmStory"></p>
      </div>
      <div class="card">
        <h3 class="serif">GDP 与人口：一条陡峭，一条平缓</h3>
        <p class="card-sub">经济总量二十年涨到约 7.2 倍，人口则在 2021 年前后见顶回落——两条线的分叉，正是这个时代最重要的注脚。把鼠标放上图面可以逐年读数。</p>
        <div class="chart-box tall"><canvas id="trendLine"></canvas></div>
        <p class="chart-readout" id="trendReadout"></p>
        <div class="legend"><span><i style="background:#b3543f"></i>GDP（万亿元，左轴）</span><span><i style="background:#31517a"></i>人口（亿人，右轴量级同图示）</span></div>
      </div>
      <div class="two-col">
        <div class="card">
          <h3 class="serif">出生人口的拐点</h3>
          <p class="card-sub">2016 年的小高峰之后一路下行，2024 年龙年回升到 954 万。</p>
          <div class="chart-box"><canvas id="birthBars"></canvas></div>
        </div>
        <div class="card">
          <h3 class="serif">城镇化：从 43% 到 67%</h3>
          <p class="card-sub">二十年里，约 3.4 亿人从乡村走进城镇，这是人类历史上最大规模的人口迁徙。</p>
          <div class="chart-box"><canvas id="urbanLine"></canvas></div>
        </div>
      </div>`;

    const slider = root.querySelector('#tmSlider');
    const playBtn = root.querySelector('#tmPlay');
    const captions = {
      2005: '起点之年：人均 GDP 刚过一万元。',
      2010: 'GDP 成为世界第二，城镇化率逼近一半。',
      2016: '出生人口小高峰，服务业占比过半。',
      2020: '第七次人口普查之年，GDP 突破百万亿元。',
      2021: '总人口见顶，此后进入负增长通道。',
      2024: '最新一年：人均 GDP 约 9.6 万元。',
    };

    function showYear() {
      const i = yearIndex;
      root.querySelector('#tmYear').textContent = String(data.years[i]);
      root.querySelector('#tmGdp').textContent = data.gdp[i].toFixed(2);
      root.querySelector('#tmPop').textContent = data.population[i].toLocaleString('zh-CN');
      root.querySelector('#tmUrban').textContent = data.urbanRate[i].toFixed(1) + '%';
      root.querySelector('#tmPer').textContent = data.gdpPerCapita[i].toLocaleString('zh-CN');
      const caption = captions[data.years[i]] || `${data.years[i]} 年：GDP ${data.gdp[i].toFixed(1)} 万亿元，城镇化率 ${data.urbanRate[i].toFixed(1)}%。`;
      root.querySelector('#tmCaption').textContent = caption;
      root.querySelector('#tmStory').textContent = `这一年，每 100 个中国人里约有 ${Math.round(data.urbanRate[i])} 个生活在城镇；人均 GDP 是 2005 年的 ${(data.gdpPerCapita[i] / data.gdpPerCapita[0]).toFixed(1)} 倍。`;
      slider.value = String(i);
    }

    slider.addEventListener('input', () => { stopPlay(); yearIndex = Number(slider.value); showYear(); });
    function stopPlay() {
      if (timer) { clearInterval(timer); timer = null; playBtn.textContent = '▶ 播放二十年'; }
    }
    playBtn.onclick = () => {
      if (timer) { stopPlay(); return; }
      if (yearIndex >= data.years.length - 1) yearIndex = 0;
      playBtn.textContent = '⏸ 暂停';
      timer = setInterval(() => {
        yearIndex += 1;
        if (yearIndex >= data.years.length) { yearIndex = data.years.length - 1; showYear(); stopPlay(); return; }
        showYear();
      }, 420);
    };
    showYear();

    charts.lineChart(root.querySelector('#trendLine'), data.years, [
      { label: 'GDP（万亿元）', color: charts.colors.red, values: data.gdp },
      { label: '人口（亿人）', color: charts.colors.blue, values: data.population.map((v) => v / 10000) },
    ], { labelEvery: 3, format: (v) => (v >= 100 ? v.toFixed(0) : v.toFixed(1)), onHover: (t) => { root.querySelector('#trendReadout').textContent = t; } });

    charts.barChart(root.querySelector('#birthBars'), data.birthYears.map((y, i) => ({
      label: y, value: data.births[i], color: i === data.birthYears.length - 1 ? charts.colors.red : charts.colors.blue,
    })), { format: (v) => String(Math.round(v)) });

    charts.lineChart(root.querySelector('#urbanLine'), data.years, [
      { label: '城镇化率（%）', color: charts.colors.green, values: data.urbanRate },
    ], { labelEvery: 4, min: 35, format: (v) => v.toFixed(0) + '%' });
  }

  window.ATLAS_VIEWS = window.ATLAS_VIEWS || {};
  window.ATLAS_VIEWS.trends = renderTrends;
})();
