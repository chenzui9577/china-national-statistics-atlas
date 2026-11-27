// 专题视图：经济、人口、民生三个专题页签，每个专题有编辑式导语、手绘图表与一句话解读，另含数据说明页。
// 写专题的目的，是让数字背后的人间烟火被看见——指标是骨架，故事才是这本年鉴的血肉。
(function () {
  const TOPICS = [
    {
      id: 'economy', name: '经济专题', kicker: '一个国家的一年',
      lead: '134.9 万亿元，是十四亿人一整年的忙碌折成的数字：工厂里的灯、田野里的穗、屏幕后的每一次点击。',
      body: [
        '把 2024 年的经济切成三块：第一产业占 6.8%，第二产业占 36.5%，第三产业占 56.7%。这张饼的样子，和二十年前完全不同——服务业第一次稳稳占下半壁江山，是在 2015 年前后。',
        '省份之间也在悄悄换位。广东以 14.16 万亿元继续领跑，江苏紧随其后只差不到五千亿；中部的安徽、江西增速常年靠前，长三角的版图因此越拼越大。想看省份的细账，去省份图谱里点一点，比任何榜单都直观。',
        '人均 GDP 约 9.57 万元，折合约 1.34 万美元。中国经济的故事，正在从「长个子」切换到「长本事」：新能源汽车产销量全球第一、光伏组件占全球八成左右，这些才是下一张饼的模样。',
      ],
      chart: 'industry',
    },
    {
      id: 'population', name: '人口专题', kicker: '十四亿人的日常',
      lead: '人口是最慢的变量，也是最有分量的变量。它决定了教室要建多少间、养老金要备多厚、城市的边界画在哪里。',
      body: [
        '2024 年末，全国人口 140828 万人，比上年减少 139 万。这是连续第三年负增长——2021 年的 141260 万人，大概率就是这一轮人口曲线的峰顶。',
        '出生人口的曲线更直观：2016 年 1786 万的高峰之后一路下行，2023 年跌到 902 万，2024 年龙年回升到 954 万。一个婴儿从出生到走进职场要二十年，所以今天产房里的数字，写的是 2045 年的劳动力市场。',
        '与此同时，城镇化率走到了 67%。广东常住人口 1.28 亿居全国之首，而西藏只有 370 万人——最大与最小之间，差了 34 倍。这片土地上的人口分布，本身就是一部经济地理。',
      ],
      chart: 'births',
    },
    {
      id: 'livelihood', name: '民生专题', kicker: '日子是过出来的',
      lead: '收入这个指标最贴近皮肤：它涨没涨、涨得快不快，直接决定了千家万户餐桌与账本的温度。',
      body: [
        '2024 年，全国居民人均可支配收入 41314 元，实际增长 5.1%。从 2013 年的 18311 元算起，十一年翻了一倍还多——这个速度，和同期的经济增长基本同步，是官方反复强调的「同步增长」落到纸面的样子。',
        '省份之间的温差同样真实：上海 88366 元、北京 85415 元，是甘肃 26612 元的三倍多；但浙江的城乡收入比只有约 1.8，是全国最均衡的地方之一。平均数之外，看差距，才算看懂民生。',
        '收入的结构也在变：工资性收入占六成左右，经营净收入、财产净收入、转移净收入各占一块。对普通家庭来说，最实在的获得感，往往来自那多出来的一成转移净收入——养老金又涨了一点，医保报销又多了一点。',
      ],
      chart: 'income',
    },
  ];

  function renderTopics(root) {
    const charts = window.ATLAS_CHARTS;
    const national = window.ATLAS_NATIONAL;
    let active = TOPICS[0];

    root.innerHTML = `
      <section class="page-head">
        <p class="page-kicker">专题 · FEATURES</p>
        <h2 class="page-title serif">数字背后，是人间烟火</h2>
        <p class="page-lede">三个专题，三种读法：经济看结构，人口看趋势，民生看温度。每个专题都配了一张手绘图和一段慢慢讲的解读。</p>
      </section>
      <div class="topic-tabs" id="topicTabs"></div>
      <div class="card topic-article" id="topicBody"></div>`;

    const tabs = root.querySelector('#topicTabs');
    const body = root.querySelector('#topicBody');

    function draw() {
      tabs.innerHTML = '';
      TOPICS.forEach((t) => {
        const btn = document.createElement('button');
        btn.className = 'btn red' + (t.id === active.id ? ' active' : '');
        btn.textContent = t.name;
        btn.onclick = () => { active = t; draw(); };
        tabs.appendChild(btn);
      });
      body.innerHTML = `
        <p class="page-kicker">${active.kicker}</p>
        <h3 class="serif">${active.name}</h3>
        <p class="lead">${active.lead}</p>
        ${active.body.map((p) => `<p>${p}</p>`).join('')}
        <div class="chart-box"><canvas id="topicChart"></canvas></div>
        <p class="chart-readout" id="topicNote"></p>`;
      const canvas = body.querySelector('#topicChart');
      const note = body.querySelector('#topicNote');
      if (active.chart === 'industry') {
        charts.donutChart(canvas, national.industry2024, '2024 产业结构');
        note.textContent = national.industry2024.map((p) => `${p.name} ${p.share}%：${p.note}`).join(' ');
      } else if (active.chart === 'births') {
        charts.barChart(canvas, national.birthYears.map((y, i) => ({
          label: y, value: national.births[i],
          color: i === 0 ? charts.colors.green : (y === 2024 ? charts.colors.red : charts.colors.blue),
        })), {});
        note.textContent = '出生人口（万人）：2016 年的高峰与 2023 年的低谷之间，隔着 884 万个新生儿。';
      } else {
        charts.lineChart(canvas, national.incomeYears, [
          { label: '人均可支配收入（元）', color: charts.colors.red, values: national.income },
        ], { labelEvery: 2, format: (v) => Math.round(v).toLocaleString('zh-CN'), onHover: (t) => { note.textContent = t; } });
        note.textContent = '全国居民人均可支配收入，2013—2024 年。把鼠标放上图面可逐年读数。';
      }
    }
    draw();
  }

  function renderAbout(root) {
    root.innerHTML = `
      <section class="page-head">
        <p class="page-kicker">数据说明 · ABOUT THE DATA</p>
        <h2 class="page-title serif">先说清楚，再谈数字</h2>
        <p class="page-lede">一本年鉴的可信，从交代口径开始。这一页写明本站数据的来源、口径与边界，免得任何数字被误读。</p>
      </section>
      <div class="about-list">
        <div class="about-item"><h3 class="serif">数据来源</h3><p>本站全部数字取自国家统计局公开发布的《国民经济和社会发展统计公报》《中国统计年鉴》以及各省统计公报的真实量级，由作者手工整理并嵌入页面文件。站点运行时不发起任何网络请求，断网也能完整浏览。</p></div>
        <div class="about-item"><h3 class="serif">口径说明</h3><ul>
          <li>GDP 为当年价格计算的初步核算数，个别年份在官方修订后会有小幅出入，本站采用公开发布的数值，并按展示需要四舍五入。</li>
          <li>人口为年末常住人口；2020 年数据与第七次全国人口普查结果衔接。</li>
          <li>城镇化率为常住人口口径；居民人均可支配收入为全国居民口径，统一序列自 2013 年起。</li>
          <li>省份 GDP、人口、收入与城镇化率为 2024 年各省公报量级，个别省份为约数。</li>
        </ul></div>
        <div class="about-item"><h3 class="serif">使用边界</h3><p>本站是为「逛年鉴」设计的阅读型产品：数字适合建立量级感与趋势判断，不作为论文引用、投资决策或政策制定的依据。正式引用请查阅国家统计局官网与当年统计年鉴原文。</p></div>
        <div class="about-item"><h3 class="serif">本站结构</h3><p>总览看 2024 年的关键指标与年度故事；省份图谱用瓷砖地图与对比工具看 31 省；趋势长河用时间机器回看 2005—2024；专题页提供经济、人口、民生的编辑式解读。五页之间均可通过顶部导航到达。</p></div>
      </div>`;
  }

  window.ATLAS_VIEWS = window.ATLAS_VIEWS || {};
  window.ATLAS_VIEWS.topics = renderTopics;
  window.ATLAS_VIEWS.about = renderAbout;
})();
