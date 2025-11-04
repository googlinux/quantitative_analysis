// WebSocket客户端模块
// ========================================

let socket = null;
let isConnected = false;

/**
 * 初始化WebSocket连接
 */
function initWebSocket() {
    try {
        // 连接到Socket.IO服务器
        socket = io({
            transports: ['websocket', 'polling'],
            reconnection: true,
            reconnectionDelay: 1000,
            reconnectionDelayMax: 5000,
            reconnectionAttempts: 5
        });

        // 连接成功
        socket.on('connect', function() {
            console.log('WebSocket连接成功');
            isConnected = true;
            showNotification('实时数据连接已建立', 'success');
        });

        // 连接断开
        socket.on('disconnect', function() {
            console.log('WebSocket连接断开');
            isConnected = false;
            showNotification('实时数据连接已断开', 'warning');
        });

        // 连接错误
        socket.on('connect_error', function(error) {
            console.error('WebSocket连接错误:', error);
            isConnected = false;
        });

        // 监听系统状态更新
        socket.on('system_status_update', function(data) {
            handleSystemStatusUpdate(data);
        });

        // 监听实时行情数据
        socket.on('realtime_quote', function(data) {
            handleRealtimeQuote(data);
        });

        // 监听因子计算完成
        socket.on('factor_calculation_complete', function(data) {
            handleFactorCalculationComplete(data);
        });

        // 监听模型训练进度
        socket.on('model_training_progress', function(data) {
            handleModelTrainingProgress(data);
        });

        // 监听模型训练完成
        socket.on('model_training_complete', function(data) {
            handleModelTrainingComplete(data);
        });

        // 监听回测进度
        socket.on('backtest_progress', function(data) {
            handleBacktestProgress(data);
        });

        // 监听回测完成
        socket.on('backtest_complete', function(data) {
            handleBacktestComplete(data);
        });

        // 监听警报消息
        socket.on('alert_message', function(data) {
            handleAlertMessage(data);
        });

    } catch (error) {
        console.error('WebSocket初始化失败:', error);
    }
}

/**
 * 订阅实时数据
 */
function subscribeRealtimeData(symbols) {
    if (!socket || !isConnected) {
        console.warn('WebSocket未连接');
        return;
    }

    socket.emit('subscribe_quotes', {
        symbols: symbols
    });

    console.log('已订阅实时行情:', symbols);
}

/**
 * 取消订阅实时数据
 */
function unsubscribeRealtimeData(symbols) {
    if (!socket || !isConnected) {
        return;
    }

    socket.emit('unsubscribe_quotes', {
        symbols: symbols
    });

    console.log('已取消订阅实时行情:', symbols);
}

/**
 * 处理系统状态更新
 */
function handleSystemStatusUpdate(data) {
    console.log('系统状态更新:', data);

    // 更新仪表盘统计数据
    if (data.stats) {
        if (data.stats.active_factors !== undefined) {
            document.getElementById('active-factors-count').textContent = data.stats.active_factors;
        }
        if (data.stats.trained_models !== undefined) {
            document.getElementById('trained-models-count').textContent = data.stats.trained_models;
        }
        if (data.stats.today_selections !== undefined) {
            document.getElementById('today-selections-count').textContent = data.stats.today_selections;
        }
        if (data.stats.portfolios !== undefined) {
            document.getElementById('portfolios-count').textContent = data.stats.portfolios;
        }
    }

    // 更新最后更新时间
    if (data.timestamp) {
        document.getElementById('last-update-time').textContent = formatDate(data.timestamp);
    }
}

/**
 * 处理实时行情数据
 */
function handleRealtimeQuote(data) {
    console.log('实时行情:', data);

    // 这里可以更新实时行情显示
    // 例如更新选股结果中的最新价格等
}

/**
 * 处理因子计算完成
 */
function handleFactorCalculationComplete(data) {
    console.log('因子计算完成:', data);

    showNotification(`因子 ${data.factor_id} 计算完成`, 'success');

    // 如果当前在因子管理页面，刷新列表
    if (currentSection === 'factor-management') {
        loadFactorsList();
    }
}

/**
 * 处理模型训练进度
 */
function handleModelTrainingProgress(data) {
    console.log('模型训练进度:', data);

    const progress = data.progress || 0;
    const modelId = data.model_id;

    // 显示进度通知
    showNotification(`模型 ${modelId} 训练进度: ${progress}%`, 'info');
}

/**
 * 处理模型训练完成
 */
function handleModelTrainingComplete(data) {
    console.log('模型训练完成:', data);

    const modelId = data.model_id;
    const metrics = data.metrics || {};

    let message = `模型 ${modelId} 训练完成`;
    if (metrics.r2_score) {
        message += `，R² = ${formatNumber(metrics.r2_score, 4)}`;
    }

    showNotification(message, 'success');

    // 如果当前在模型管理页面，刷新列表
    if (currentSection === 'model-management') {
        loadModelsList();
    }
}

/**
 * 处理回测进度
 */
function handleBacktestProgress(data) {
    console.log('回测进度:', data);

    const progress = data.progress || 0;
    const currentDate = data.current_date || '';

    // 更新回测进度显示
    const loadingDiv = document.getElementById('backtest-loading');
    if (loadingDiv && loadingDiv.style.display === 'block') {
        const progressText = loadingDiv.querySelector('p');
        if (progressText) {
            progressText.textContent = `正在进行回测... ${progress}% (${currentDate})`;
        }
    }
}

/**
 * 处理回测完成
 */
function handleBacktestComplete(data) {
    console.log('回测完成:', data);

    showNotification('回测完成', 'success');

    // 隐藏加载动画
    document.getElementById('backtest-loading').style.display = 'none';

    // 显示回测结果
    if (data.results) {
        renderBacktestResults(data.results);
    }
}

/**
 * 处理警报消息
 */
function handleAlertMessage(data) {
    console.log('警报消息:', data);

    const level = data.level || 'info'; // info, warning, danger
    const message = data.message || '收到系统警报';

    showNotification(message, level);
}

/**
 * 发送WebSocket消息
 */
function sendWebSocketMessage(event, data) {
    if (!socket || !isConnected) {
        console.warn('WebSocket未连接，无法发送消息');
        return false;
    }

    socket.emit(event, data);
    return true;
}

/**
 * 断开WebSocket连接
 */
function disconnectWebSocket() {
    if (socket) {
        socket.disconnect();
        socket = null;
        isConnected = false;
        console.log('WebSocket已断开');
    }
}

// 页面加载完成后自动初始化WebSocket
document.addEventListener('DOMContentLoaded', function() {
    // 延迟初始化，确保页面完全加载
    setTimeout(function() {
        initWebSocket();
    }, 1000);
});

// 页面卸载前断开连接
window.addEventListener('beforeunload', function() {
    disconnectWebSocket();
});
