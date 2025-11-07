// 多因子选股系统 - 前端JavaScript
// ========================================

// 全局变量
let currentSection = 'dashboard';
let selectedStocks = [];
let factorsList = [];
let modelsList = [];
let optimizationResults = null;

// API基础URL
const API_BASE_URL = '/api/ml-factor';

// ========================================
// 工具函数
// ========================================

/**
 * 显示通知消息
 */
function showNotification(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.style.position = 'fixed';
    alertDiv.style.top = '20px';
    alertDiv.style.right = '20px';
    alertDiv.style.zIndex = '9999';
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    document.body.appendChild(alertDiv);

    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

/**
 * 格式化日期
 */
function formatDate(date) {
    if (!date) return '-';
    return new Date(date).toLocaleString('zh-CN');
}

/**
 * 格式化数字
 */
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return Number(num).toFixed(decimals);
}

/**
 * 格式化百分比
 */
function formatPercent(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return (Number(num) * 100).toFixed(decimals) + '%';
}

/**
 * HTML转义防止XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ========================================
// 页面导航
// ========================================

/**
 * 显示指定部分
 */
function showSection(sectionName) {
    // 隐藏所有内容区域
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });

    // 移除所有导航链接的active状态
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.classList.remove('active');
    });

    // 显示选中的内容区域
    const section = document.getElementById(sectionName);
    if (section) {
        section.classList.add('active');
        currentSection = sectionName;

        // 设置对应的导航链接为active
        const navLink = document.querySelector(`[data-section="${sectionName}"]`);
        if (navLink) {
            navLink.classList.add('active');
        }

        // 更新页面标题
        const titles = {
            'dashboard': '仪表盘',
            'factor-management': '因子管理',
            'model-management': '模型管理',
            'stock-selection': '股票选择',
            'portfolio-optimization': '组合优化',
            'analysis': '分析报告',
            'backtest': '回测验证'
        };
        document.getElementById('page-title').textContent = titles[sectionName] || '多因子选股系统';

        // 根据不同部分加载相应数据
        switch(sectionName) {
            case 'dashboard':
                loadDashboardData();
                break;
            case 'factor-management':
                loadFactorsList();
                break;
            case 'model-management':
                loadModelsList();
                break;
            case 'stock-selection':
                initStockSelection();
                break;
            case 'portfolio-optimization':
                // 组合优化页面初始化
                break;
            case 'analysis':
                // 分析报告页面初始化
                break;
            case 'backtest':
                initBacktestPage();
                break;
        }
    }
}

// ========================================
// 仪表盘功能
// ========================================

/**
 * 加载仪表盘数据
 */
async function loadDashboardData() {
    try {
        // 加载系统统计数据
        const response = await fetch(`${API_BASE_URL}/system/stats`);
        const data = await response.json();

        if (data.success) {
            const stats = data.data;
            document.getElementById('active-factors-count').textContent = stats.active_factors || 0;
            document.getElementById('trained-models-count').textContent = stats.trained_models || 0;
            document.getElementById('today-selections-count').textContent = stats.today_selections || 0;
            document.getElementById('portfolios-count').textContent = stats.portfolios || 0;
            document.getElementById('last-update-time').textContent = formatDate(stats.last_update_time);
        }
    } catch (error) {
        console.error('加载仪表盘数据失败:', error);
        // 设置默认值
        document.getElementById('active-factors-count').textContent = '12';
        document.getElementById('trained-models-count').textContent = '0';
        document.getElementById('today-selections-count').textContent = '0';
        document.getElementById('portfolios-count').textContent = '0';
    }
}

/**
 * 刷新数据
 */
function refreshData() {
    showNotification('正在刷新数据...', 'info');
    if (currentSection === 'dashboard') {
        loadDashboardData();
    } else if (currentSection === 'factor-management') {
        loadFactorsList();
    } else if (currentSection === 'model-management') {
        loadModelsList();
    }
}

/**
 * 显示设置
 */
function showSettings() {
    showNotification('设置功能开发中...', 'info');
}

// ========================================
// 因子管理功能
// ========================================

/**
 * 加载因子列表
 */
async function loadFactorsList() {
    try {
        const response = await fetch(`${API_BASE_URL}/factors/list`);
        const data = await response.json();

        if (data.success) {
            factorsList = data.data.factors || [];
            renderFactorsTable(factorsList);
        } else {
            showNotification('加载因子列表失败: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('加载因子列表失败:', error);
        showNotification('加载因子列表失败', 'danger');
    }
}

/**
 * 渲染因子表格
 */
function renderFactorsTable(factors) {
    const tbody = document.querySelector('#factors-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!factors || factors.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">暂无因子数据</td></tr>';
        return;
    }

    factors.forEach(factor => {
        const row = document.createElement('tr');
        const factorId = escapeHtml(factor.factor_id || '');
        const factorName = escapeHtml(factor.factor_name || '');
        const factorType = escapeHtml(factor.factor_type || '');

        row.innerHTML = `
            <td>${factorId}</td>
            <td>${factorName}</td>
            <td><span class="badge bg-primary">${factorType}</span></td>
            <td><span class="badge bg-success">活跃</span></td>
            <td>${formatDate(factor.created_at || factor.create_time)}</td>
            <td>
                <button class="btn btn-sm btn-outline-primary" onclick="viewFactor('${factorId}')">
                    <i class="bi bi-eye"></i>
                </button>
                <button class="btn btn-sm btn-outline-danger" onclick="deleteFactor('${factorId}')">
                    <i class="bi bi-trash"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * 显示创建因子模态框
 */
function showCreateFactorModal() {
    const modal = new bootstrap.Modal(document.getElementById('createFactorModal'));
    modal.show();
}

/**
 * 创建因子
 */
async function createFactor() {
    const factorId = document.getElementById('factor-id').value;
    const factorName = document.getElementById('factor-name').value;
    const factorType = document.getElementById('factor-type').value;
    const factorFormula = document.getElementById('factor-formula').value;
    const factorDescription = document.getElementById('factor-description').value;

    if (!factorId || !factorName || !factorType || !factorFormula) {
        showNotification('请填写所有必填字段', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/factors/custom`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                factor_id: factorId,
                factor_name: factorName,
                factor_type: factorType,
                factor_formula: factorFormula,
                description: factorDescription
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('因子创建成功', 'success');
            bootstrap.Modal.getInstance(document.getElementById('createFactorModal')).hide();
            document.getElementById('create-factor-form').reset();
            loadFactorsList();
        } else {
            showNotification('创建失败: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('创建因子失败:', error);
        showNotification('创建因子失败', 'danger');
    }
}

/**
 * 查看因子详情
 */
function viewFactor(factorId) {
    showNotification(`查看因子详情: ${factorId}`, 'info');
}

/**
 * 删除因子
 */
function deleteFactor(factorId) {
    if (confirm(`确定要删除因子 ${factorId} 吗？`)) {
        showNotification(`删除因子: ${factorId}`, 'warning');
    }
}

// ========================================
// 模型管理功能
// ========================================

/**
 * 加载模型列表
 */
async function loadModelsList() {
    try {
        const response = await fetch(`${API_BASE_URL}/models/list`);
        const data = await response.json();

        if (data.success) {
            modelsList = data.data.models || [];
            renderModelsTable(modelsList);
        } else {
            showNotification('加载模型列表失败: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('加载模型列表失败:', error);
        showNotification('加载模型列表失败', 'danger');
    }
}

/**
 * 渲染模型表格
 */
function renderModelsTable(models) {
    const tbody = document.querySelector('#models-table tbody');
    if (!tbody) return;

    tbody.innerHTML = '';

    if (!models || models.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">暂无模型数据</td></tr>';
        return;
    }

    models.forEach(model => {
        const row = document.createElement('tr');
        const modelId = escapeHtml(model.model_id || '');
        const modelName = escapeHtml(model.model_name || '');
        const modelType = escapeHtml(model.model_type || '');

        // 使用is_active作为状态判断，因为没有is_trained字段
        const statusBadge = model.is_active ?
            '<span class="badge bg-success">活跃</span>' :
            '<span class="badge bg-secondary">未激活</span>';

        row.innerHTML = `
            <td>${modelId}</td>
            <td>${modelName}</td>
            <td><span class="badge bg-info">${modelType}</span></td>
            <td>${statusBadge}</td>
            <td>${formatDate(model.created_at || model.create_time)}</td>
            <td>
                <button class="btn btn-sm btn-outline-success" onclick="trainModel('${modelId}')">
                    <i class="bi bi-play"></i> 训练
                </button>
                <button class="btn btn-sm btn-outline-primary" onclick="viewModel('${modelId}')">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

/**
 * 显示创建模型模态框
 */
async function showCreateModelModal() {
    // 先加载因子列表用于选择
    if (factorsList.length === 0) {
        await loadFactorsList();
    }

    // 填充因子复选框
    const factorCheckboxes = document.getElementById('model-factor-checkboxes');
    factorCheckboxes.innerHTML = '';

    factorsList.forEach(factor => {
        const checkbox = document.createElement('div');
        checkbox.className = 'form-check';
        checkbox.innerHTML = `
            <input class="form-check-input" type="checkbox" value="${factor.factor_id}" id="factor-${factor.factor_id}">
            <label class="form-check-label" for="factor-${factor.factor_id}">
                ${factor.factor_name} (${factor.factor_id})
            </label>
        `;
        factorCheckboxes.appendChild(checkbox);
    });

    const modal = new bootstrap.Modal(document.getElementById('createModelModal'));
    modal.show();
}

/**
 * 创建模型
 */
async function createModel() {
    const modelId = document.getElementById('model-id').value;
    const modelName = document.getElementById('model-name').value;
    const modelType = document.getElementById('model-type').value;
    const targetType = document.getElementById('target-type').value;

    // 获取选中的因子
    const selectedFactors = [];
    document.querySelectorAll('#model-factor-checkboxes input:checked').forEach(checkbox => {
        selectedFactors.push(checkbox.value);
    });

    if (!modelId || !modelName || !modelType || !targetType || selectedFactors.length === 0) {
        showNotification('请填写所有必填字段并至少选择一个因子', 'warning');
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/models/create`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model_id: modelId,
                model_name: modelName,
                model_type: modelType,
                target_type: targetType,
                factor_list: selectedFactors
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('模型创建成功', 'success');
            bootstrap.Modal.getInstance(document.getElementById('createModelModal')).hide();
            document.getElementById('create-model-form').reset();
            loadModelsList();
        } else {
            showNotification('创建失败: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('创建模型失败:', error);
        showNotification('创建模型失败', 'danger');
    }
}

/**
 * 训练模型
 */
async function trainModel(modelId) {
    if (!confirm(`确定要训练模型 ${modelId} 吗？这可能需要几分钟时间。`)) {
        return;
    }

    showNotification('开始训练模型...', 'info');

    try {
        const response = await fetch(`${API_BASE_URL}/models/train`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                model_id: modelId,
                start_date: '2020-01-01',
                end_date: '2023-12-31'
            })
        });

        const data = await response.json();

        if (data.success) {
            showNotification('模型训练成功', 'success');
            loadModelsList();
        } else {
            showNotification('训练失败: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('训练模型失败:', error);
        showNotification('训练模型失败', 'danger');
    }
}

/**
 * 查看模型详情
 */
function viewModel(modelId) {
    showNotification(`查看模型详情: ${modelId}`, 'info');
}

// ========================================
// 股票选择功能
// ========================================

/**
 * 初始化股票选择页面
 */
async function initStockSelection() {
    // 设置默认日期为今天
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('trade-date').value = today;

    // 加载因子列表
    if (factorsList.length === 0) {
        await loadFactorsList();
    }

    // 填充因子复选框
    const factorCheckboxes = document.getElementById('factor-checkboxes');
    factorCheckboxes.innerHTML = '';

    factorsList.forEach(factor => {
        const checkbox = document.createElement('div');
        checkbox.className = 'form-check';
        checkbox.innerHTML = `
            <input class="form-check-input" type="checkbox" value="${factor.factor_id}" id="select-factor-${factor.factor_id}">
            <label class="form-check-label" for="select-factor-${factor.factor_id}">
                ${factor.factor_name}
            </label>
        `;
        factorCheckboxes.appendChild(checkbox);
    });

    // 加载模型列表
    if (modelsList.length === 0) {
        await loadModelsList();
    }

    // 填充模型下拉框
    const modelSelect = document.getElementById('model-ids');
    modelSelect.innerHTML = '';

    modelsList.filter(m => m.is_trained).forEach(model => {
        const option = document.createElement('option');
        option.value = model.model_id;
        option.textContent = model.model_name;
        modelSelect.appendChild(option);
    });

    // 监听选股方法变化
    document.getElementById('selection-method').addEventListener('change', function() {
        const method = this.value;
        if (method === 'factor_based') {
            document.getElementById('factor-selection').style.display = 'block';
            document.getElementById('model-selection').style.display = 'none';
        } else {
            document.getElementById('factor-selection').style.display = 'none';
            document.getElementById('model-selection').style.display = 'block';
        }
    });

    // 监听表单提交
    document.getElementById('selection-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        await performStockSelection();
    });
}

/**
 * 执行股票选择
 */
async function performStockSelection() {
    const tradeDate = document.getElementById('trade-date').value;
    const method = document.getElementById('selection-method').value;
    const topN = parseInt(document.getElementById('top-n').value);

    // 显示加载动画
    document.getElementById('selection-loading').style.display = 'block';
    document.getElementById('selection-results').innerHTML = '';

    try {
        let endpoint, requestData;

        if (method === 'factor_based') {
            // 基于因子选股
            const selectedFactors = [];
            document.querySelectorAll('#factor-checkboxes input:checked').forEach(checkbox => {
                selectedFactors.push(checkbox.value);
            });

            if (selectedFactors.length === 0) {
                showNotification('请至少选择一个因子', 'warning');
                document.getElementById('selection-loading').style.display = 'none';
                return;
            }

            endpoint = `${API_BASE_URL}/scoring/factor-based`;
            requestData = {
                trade_date: tradeDate,
                factor_list: selectedFactors,
                method: 'equal_weight',
                top_n: topN
            };
        } else {
            // 基于模型选股
            const selectedModels = Array.from(document.getElementById('model-ids').selectedOptions).map(opt => opt.value);

            if (selectedModels.length === 0) {
                showNotification('请至少选择一个模型', 'warning');
                document.getElementById('selection-loading').style.display = 'none';
                return;
            }

            endpoint = `${API_BASE_URL}/scoring/ml-based`;
            requestData = {
                trade_date: tradeDate,
                model_ids: selectedModels,
                top_n: topN
            };
        }

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });

        const data = await response.json();

        document.getElementById('selection-loading').style.display = 'none';

        if (data.success) {
            selectedStocks = data.data.stocks || [];
            renderSelectionResults(selectedStocks);
            showNotification(`成功选出 ${selectedStocks.length} 只股票`, 'success');
        } else {
            showNotification('选股失败: ' + data.message, 'danger');
            document.getElementById('selection-results').innerHTML =
                '<p class="text-danger text-center">选股失败，请检查参数后重试</p>';
        }
    } catch (error) {
        console.error('选股失败:', error);
        document.getElementById('selection-loading').style.display = 'none';
        showNotification('选股失败', 'danger');
        document.getElementById('selection-results').innerHTML =
            '<p class="text-danger text-center">选股失败，请检查参数后重试</p>';
    }
}

/**
 * 渲染选股结果
 */
function renderSelectionResults(stocks) {
    const resultsDiv = document.getElementById('selection-results');

    if (!stocks || stocks.length === 0) {
        resultsDiv.innerHTML = '<p class="text-muted text-center">未找到符合条件的股票</p>';
        return;
    }

    let html = `
        <div class="table-responsive">
            <table class="table table-hover">
                <thead>
                    <tr>
                        <th>排名</th>
                        <th>股票代码</th>
                        <th>股票名称</th>
                        <th>综合得分</th>
                        <th>预期收益率</th>
                    </tr>
                </thead>
                <tbody>
    `;

    stocks.forEach((stock, index) => {
        html += `
            <tr>
                <td>${index + 1}</td>
                <td>${stock.ts_code || stock.stock_code}</td>
                <td>${stock.stock_name || '-'}</td>
                <td>${formatNumber(stock.score, 4)}</td>
                <td class="${stock.expected_return > 0 ? 'text-success' : 'text-danger'}">
                    ${formatPercent(stock.expected_return)}
                </td>
            </tr>
        `;
    });

    html += `
                </tbody>
            </table>
        </div>
        <div class="mt-3">
            <button class="btn btn-primary" onclick="proceedToOptimization()">
                <i class="bi bi-arrow-right"></i> 进行组合优化
            </button>
            <button class="btn btn-outline-secondary" onclick="exportSelectionResults()">
                <i class="bi bi-download"></i> 导出结果
            </button>
        </div>
    `;

    resultsDiv.innerHTML = html;
}

/**
 * 进入组合优化
 */
function proceedToOptimization() {
    if (selectedStocks.length === 0) {
        showNotification('请先进行股票选择', 'warning');
        return;
    }
    showSection('portfolio-optimization');
}

/**
 * 导出选股结果
 */
function exportSelectionResults() {
    showNotification('导出功能开发中...', 'info');
}

// ========================================
// 分析报告功能
// ========================================

/**
 * 生成因子分析报告
 */
function generateFactorAnalysis() {
    showNotification('正在生成因子分析报告...', 'info');
}

/**
 * 生成行业分析报告
 */
function generateSectorAnalysis() {
    showNotification('正在生成行业分析报告...', 'info');
}

// ========================================
// 回测功能
// ========================================

let backtestChart = null;

/**
 * 初始化回测页面
 */
function initBacktestPage() {
    // 设置默认日期
    const endDate = new Date();
    const startDate = new Date();
    startDate.setFullYear(startDate.getFullYear() - 1); // 默认回测一年

    document.getElementById('backtest-end-date').value = endDate.toISOString().split('T')[0];
    document.getElementById('backtest-start-date').value = startDate.toISOString().split('T')[0];

    // 初始化图表 - 先销毁旧图表防止内存泄漏
    if (backtestChart) {
        backtestChart.dispose();
        backtestChart = null;
    }
    backtestChart = initBacktestChart('backtest-chart');

    // 绑定表单提交事件（只绑定一次）
    const form = document.getElementById('backtest-form');
    if (form && !form.hasAttribute('data-bound')) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            await performBacktest();
        });
        form.setAttribute('data-bound', 'true');
    }
}

/**
 * 执行回测
 */
async function performBacktest() {
    const startDate = document.getElementById('backtest-start-date').value;
    const endDate = document.getElementById('backtest-end-date').value;
    const initialCapital = parseFloat(document.getElementById('initial-capital').value) * 10000; // 转换为元
    const rebalanceFreq = document.getElementById('rebalance-freq').value;
    const strategy = document.getElementById('backtest-strategy').value;

    if (!startDate || !endDate) {
        showNotification('请选择回测日期范围', 'warning');
        return;
    }

    // 显示加载动画
    document.getElementById('backtest-loading').style.display = 'block';
    document.getElementById('backtest-results').innerHTML = '';

    try {
        const response = await fetch(`${API_BASE_URL}/backtest/run`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                start_date: startDate,
                end_date: endDate,
                initial_capital: initialCapital,
                rebalance_freq: rebalanceFreq,
                strategy: strategy,
                factor_list: strategy === 'factor_based' ? getSelectedFactors() : [],
                model_ids: strategy === 'ml_based' ? getSelectedModels() : []
            })
        });

        const data = await response.json();

        document.getElementById('backtest-loading').style.display = 'none';

        if (data.success) {
            renderBacktestResults(data.data);
            showNotification('回测完成', 'success');
        } else {
            showNotification('回测失败: ' + data.message, 'danger');
            document.getElementById('backtest-results').innerHTML =
                '<p class="text-danger text-center">回测失败，请检查参数后重试</p>';
        }
    } catch (error) {
        console.error('回测失败:', error);
        document.getElementById('backtest-loading').style.display = 'none';
        showNotification('回测失败', 'danger');
        document.getElementById('backtest-results').innerHTML =
            '<p class="text-danger text-center">回测失败，请检查参数后重试</p>';
    }
}

/**
 * 渲染回测结果
 */
function renderBacktestResults(results) {
    const resultsDiv = document.getElementById('backtest-results');

    if (!results) {
        resultsDiv.innerHTML = '<p class="text-muted text-center">无回测结果</p>';
        return;
    }

    // 显示关键指标
    const metrics = results.metrics || {};
    let html = `
        <div class="row mb-3">
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-label">总收益率</div>
                    <div class="metric-value ${metrics.total_return > 0 ? 'text-success' : 'text-danger'}">
                        ${formatPercent(metrics.total_return)}
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-label">年化收益率</div>
                    <div class="metric-value ${metrics.annual_return > 0 ? 'text-success' : 'text-danger'}">
                        ${formatPercent(metrics.annual_return)}
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-label">夏普比率</div>
                    <div class="metric-value">
                        ${formatNumber(metrics.sharpe_ratio, 3)}
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-label">最大回撤</div>
                    <div class="metric-value text-danger">
                        ${formatPercent(metrics.max_drawdown)}
                    </div>
                </div>
            </div>
        </div>
        <div class="row">
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-label">波动率</div>
                    <div class="metric-value">
                        ${formatPercent(metrics.volatility)}
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-label">胜率</div>
                    <div class="metric-value">
                        ${formatPercent(metrics.win_rate)}
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-label">盈亏比</div>
                    <div class="metric-value">
                        ${formatNumber(metrics.profit_loss_ratio, 2)}
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="metric-card">
                    <div class="metric-label">卡尔玛比率</div>
                    <div class="metric-value">
                        ${formatNumber(metrics.calmar_ratio, 3)}
                    </div>
                </div>
            </div>
        </div>
    `;

    resultsDiv.innerHTML = html;

    // 绘制收益曲线
    if (results.equity_curve) {
        renderBacktestChart(backtestChart, {
            dates: results.equity_curve.dates,
            portfolio_returns: results.equity_curve.portfolio_returns,
            benchmark_returns: results.equity_curve.benchmark_returns
        });
    }
}

/**
 * 获取选中的因子
 */
function getSelectedFactors() {
    const selected = [];
    document.querySelectorAll('#factor-checkboxes input:checked').forEach(checkbox => {
        selected.push(checkbox.value);
    });
    return selected;
}

/**
 * 获取选中的模型
 */
function getSelectedModels() {
    return Array.from(document.getElementById('model-ids').selectedOptions).map(opt => opt.value);
}

// ========================================
// 页面初始化
// ========================================

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', function() {
    // 加载仪表盘数据
    loadDashboardData();

    // 绑定导航点击事件
    document.querySelectorAll('.sidebar .nav-link').forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const section = this.getAttribute('data-section');
            showSection(section);
        });
    });

    console.log('多因子选股系统已初始化');
});
