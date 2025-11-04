// 图表可视化模块
// ========================================

/**
 * 初始化回测结果图表
 */
function initBacktestChart(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return null;

    return echarts.init(container);
}

/**
 * 绘制回测收益曲线
 */
function renderBacktestChart(chart, backtestData) {
    if (!chart || !backtestData) return;

    const dates = backtestData.dates || [];
    const portfolioReturns = backtestData.portfolio_returns || [];
    const benchmarkReturns = backtestData.benchmark_returns || [];

    const option = {
        title: {
            text: '策略回测收益曲线',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            },
            formatter: function(params) {
                let html = params[0].axisValue + '<br/>';
                params.forEach(param => {
                    html += param.marker + param.seriesName + ': ' + (param.value * 100).toFixed(2) + '%<br/>';
                });
                return html;
            }
        },
        legend: {
            data: ['策略收益', '基准收益'],
            top: 30
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dates
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: function(value) {
                    return (value * 100).toFixed(1) + '%';
                }
            }
        },
        series: [
            {
                name: '策略收益',
                type: 'line',
                data: portfolioReturns,
                smooth: true,
                lineStyle: {
                    width: 2,
                    color: '#5470c6'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0, color: 'rgba(84, 112, 198, 0.3)'
                        }, {
                            offset: 1, color: 'rgba(84, 112, 198, 0.05)'
                        }]
                    }
                }
            },
            {
                name: '基准收益',
                type: 'line',
                data: benchmarkReturns,
                smooth: true,
                lineStyle: {
                    width: 2,
                    color: '#ee6666',
                    type: 'dashed'
                }
            }
        ],
        dataZoom: [
            {
                type: 'inside',
                start: 0,
                end: 100
            },
            {
                start: 0,
                end: 100
            }
        ]
    };

    chart.setOption(option);
}

/**
 * 绘制因子贡献度图表
 */
function renderFactorContributionChart(containerId, factorData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const chart = echarts.init(container);

    const factors = factorData.factors || [];
    const contributions = factorData.contributions || [];

    const option = {
        title: {
            text: '因子贡献度分析',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'value',
            axisLabel: {
                formatter: '{value}%'
            }
        },
        yAxis: {
            type: 'category',
            data: factors
        },
        series: [
            {
                name: '贡献度',
                type: 'bar',
                data: contributions,
                itemStyle: {
                    color: function(params) {
                        const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de'];
                        return colors[params.dataIndex % colors.length];
                    }
                },
                label: {
                    show: true,
                    position: 'right',
                    formatter: '{c}%'
                }
            }
        ]
    };

    chart.setOption(option);
}

/**
 * 绘制行业分布饼图
 */
function renderSectorPieChart(containerId, sectorData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const chart = echarts.init(container);

    const data = sectorData.map(item => ({
        name: item.sector,
        value: item.count || item.value
    }));

    const option = {
        title: {
            text: '行业分布',
            left: 'center'
        },
        tooltip: {
            trigger: 'item',
            formatter: '{b}: {c} ({d}%)'
        },
        legend: {
            orient: 'vertical',
            left: 'left',
            top: 'middle'
        },
        series: [
            {
                name: '行业',
                type: 'pie',
                radius: ['40%', '70%'],
                avoidLabelOverlap: false,
                itemStyle: {
                    borderRadius: 10,
                    borderColor: '#fff',
                    borderWidth: 2
                },
                label: {
                    show: true,
                    formatter: '{b}: {d}%'
                },
                emphasis: {
                    label: {
                        show: true,
                        fontSize: 16,
                        fontWeight: 'bold'
                    }
                },
                labelLine: {
                    show: true
                },
                data: data
            }
        ]
    };

    chart.setOption(option);
}

/**
 * 绘制回撤曲线
 */
function renderDrawdownChart(containerId, drawdownData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const chart = echarts.init(container);

    const dates = drawdownData.dates || [];
    const drawdowns = drawdownData.drawdowns || [];

    const option = {
        title: {
            text: '回撤曲线',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'cross'
            },
            formatter: function(params) {
                return params[0].axisValue + '<br/>' +
                       params[0].marker + '回撤: ' + (params[0].value * 100).toFixed(2) + '%';
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            boundaryGap: false,
            data: dates
        },
        yAxis: {
            type: 'value',
            axisLabel: {
                formatter: function(value) {
                    return (value * 100).toFixed(1) + '%';
                }
            }
        },
        series: [
            {
                name: '回撤',
                type: 'line',
                data: drawdowns,
                smooth: true,
                lineStyle: {
                    width: 2,
                    color: '#ee6666'
                },
                areaStyle: {
                    color: {
                        type: 'linear',
                        x: 0,
                        y: 0,
                        x2: 0,
                        y2: 1,
                        colorStops: [{
                            offset: 0, color: 'rgba(238, 102, 102, 0.3)'
                        }, {
                            offset: 1, color: 'rgba(238, 102, 102, 0.05)'
                        }]
                    }
                }
            }
        ],
        visualMap: {
            show: false,
            dimension: 1,
            pieces: [{
                lte: 0,
                color: '#ee6666'
            }]
        }
    };

    chart.setOption(option);
}

/**
 * 绘制因子相关性热力图
 */
function renderCorrelationHeatmap(containerId, correlationData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const chart = echarts.init(container);

    const factors = correlationData.factors || [];
    const matrix = correlationData.matrix || [];

    // 转换数据格式
    const data = [];
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            data.push([i, j, matrix[i][j]]);
        }
    }

    const option = {
        title: {
            text: '因子相关性矩阵',
            left: 'center'
        },
        tooltip: {
            position: 'top',
            formatter: function(params) {
                return factors[params.value[0]] + ' vs ' + factors[params.value[1]] + '<br/>' +
                       '相关系数: ' + params.value[2].toFixed(3);
            }
        },
        grid: {
            left: '15%',
            top: '15%',
            right: '5%',
            bottom: '5%'
        },
        xAxis: {
            type: 'category',
            data: factors,
            splitArea: {
                show: true
            }
        },
        yAxis: {
            type: 'category',
            data: factors,
            splitArea: {
                show: true
            }
        },
        visualMap: {
            min: -1,
            max: 1,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: '0%',
            inRange: {
                color: ['#313695', '#4575b4', '#74add1', '#abd9e9', '#e0f3f8',
                        '#ffffbf', '#fee090', '#fdae61', '#f46d43', '#d73027', '#a50026']
            }
        },
        series: [{
            name: '相关性',
            type: 'heatmap',
            data: data,
            label: {
                show: true,
                formatter: function(params) {
                    return params.value[2].toFixed(2);
                }
            },
            emphasis: {
                itemStyle: {
                    shadowBlur: 10,
                    shadowColor: 'rgba(0, 0, 0, 0.5)'
                }
            }
        }]
    };

    chart.setOption(option);
}

/**
 * 绘制股票收益分布直方图
 */
function renderReturnsDistribution(containerId, returnsData) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const chart = echarts.init(container);

    const bins = returnsData.bins || [];
    const frequencies = returnsData.frequencies || [];

    const option = {
        title: {
            text: '收益率分布',
            left: 'center'
        },
        tooltip: {
            trigger: 'axis',
            axisPointer: {
                type: 'shadow'
            }
        },
        grid: {
            left: '3%',
            right: '4%',
            bottom: '3%',
            containLabel: true
        },
        xAxis: {
            type: 'category',
            data: bins,
            axisLabel: {
                formatter: '{value}%'
            }
        },
        yAxis: {
            type: 'value'
        },
        series: [
            {
                name: '频数',
                type: 'bar',
                data: frequencies,
                itemStyle: {
                    color: '#5470c6'
                }
            }
        ]
    };

    chart.setOption(option);
}

/**
 * 响应式调整图表大小
 */
function setupChartResize() {
    window.addEventListener('resize', function() {
        // 获取所有已初始化的ECharts实例并调整大小
        const charts = document.querySelectorAll('[_echarts_instance_]');
        charts.forEach(chartDom => {
            const chart = echarts.getInstanceByDom(chartDom);
            if (chart) {
                chart.resize();
            }
        });
    });
}

// 页面加载完成后设置响应式调整
document.addEventListener('DOMContentLoaded', function() {
    setupChartResize();
});
