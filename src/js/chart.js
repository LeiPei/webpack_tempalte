function get_single_node(index) {
  return {
    name: 'index' + index,
    itemStyle: null,
    symbolSize: 10,
    x: 100 + Math.pow(index + 1, 4),
    y: 100 + Math.pow(index + 1, 4),
  }
}

let spiderData = [];
for (let i = 0; i < 5; i++) {
  spiderData.push(get_single_node(i));
}
spiderData.unshift({
  name: 'cluster',
  symbolSize: 1,
});
let spiderLinks = spiderData.map(function (d, i) {
  return {
    source: 0,
    target: i,
  };
});

let graphOpt_ = { // for spiderfy
  tooltip: {
    show: false,
  },
  series: [{
    name: 'test_force_graph',
    type: 'graph',
    layout: 'force',
    force: {
      gravity: 1,   // the larger the center
      repulsion: 350,
      // edgeLength: 10,
      layoutAnimation: false // node more than 200 may cause browse crush
    },
    lineStyle: {
      normal: {
        opacity: 0.9,
        width: 1,
        color: '#1a1919'
      },
      emphasis: {
        color: '#ec407a'
      }
    },
    itemStyle: {
      normal: {
        borderColor: '#fff',
        borderWidth: 1,
        shadowBlur: 10,
        shadowColor: 'rgba(0, 0, 0, 0.3)'
      }
    },
    data: spiderData,
    links: spiderLinks,
  }]
};

export class User {
  constructor(name) {
    this.name = name;
  }
}

export { graphOpt_ }