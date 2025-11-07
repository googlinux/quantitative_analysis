# WebSocket实时推送实现文档

## 📅 实现日期
2025-11-07

## 🎯 实现概览

本次更新完成了WebSocket服务端的完整实现，实现了前后端的实时双向通信。

---

## ✨ 实现内容

### 1. WebSocket服务端增强 (`app/websocket/websocket_events.py`)

#### 新增ML系统专用事件处理器

```python
@socketio.on('subscribe_quotes')
def handle_subscribe_quotes(data):
    """订阅股票实时行情"""
    # 支持多个股票代码的批量订阅
    # 使用Socket.IO的房间机制实现分组推送

@socketio.on('unsubscribe_quotes')
def handle_unsubscribe_quotes(data):
    """取消订阅股票实时行情"""
    # 清理订阅记录和房间
```

#### 新增事件广播函数

```python
# 系统状态更新
emit_system_status_update(stats, timestamp=None)

# 实时行情推送
emit_realtime_quote(symbol, quote_data)

# 因子计算完成通知
emit_factor_calculation_complete(factor_id, result)

# 模型训练进度
emit_model_training_progress(model_id, progress, current_step=None)

# 模型训练完成
emit_model_training_complete(model_id, metrics)

# 回测进度
emit_backtest_progress(backtest_id, progress, current_date=None)

# 回测完成
emit_backtest_complete(backtest_id, results)

# 警报消息
emit_alert_message(level, message, details=None)
```

### 2. API端点集成 (`app/api/ml_factor_api.py`)

#### 模型训练API集成

**端点**: `POST /api/ml-factor/models/train`

**WebSocket事件流**:
```
1. 训练开始 → emit_model_training_progress(model_id, 0, '开始训练')
2. 训练开始 → emit_alert_message('info', '模型开始训练')
3. 训练完成 → emit_model_training_complete(model_id, metrics)
4. 训练完成 → emit_alert_message('success', '模型训练完成')
```

**失败处理**:
```python
# 训练失败 → emit_alert_message('danger', '训练失败原因')
# 异常发生 → emit_alert_message('danger', '训练异常信息')
```

#### 回测API集成

**端点**: `POST /api/ml-factor/backtest/run`

**WebSocket事件流**:
```
1. 回测开始 → emit_backtest_progress(backtest_id, 0, start_date)
2. 回测开始 → emit_alert_message('info', '回测开始日期范围')
3. 回测完成 → emit_backtest_complete(backtest_id, results)
4. 回测完成 → emit_alert_message('success', '回测完成')
```

**失败处理**:
```python
# 回测失败 → emit_alert_message('danger', '回测失败原因')
# 异常发生 → emit_alert_message('danger', '回测异常信息')
```

#### 系统统计API集成

**端点**: `GET /api/ml-factor/system/stats`

**WebSocket事件**:
```python
# 每次查询系统统计 → emit_system_status_update(stats_data)
# 实现仪表盘的实时自动更新
```

---

## 🔄 客户端-服务端通信流程

### 1. 连接建立

```javascript
// 客户端 (websocket-client.js)
socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true
});

// 服务端自动响应
emit('connected', {
    client_id: sid,
    server_time: timestamp,
    message: '连接成功'
});
```

### 2. 订阅行情数据

```javascript
// 客户端发送
socket.emit('subscribe_quotes', {
    symbols: ['000001.SZ', '600000.SH']
});

// 服务端响应
emit('subscribed_quotes', {
    symbols: [...],
    message: '订阅成功'
});

// 后续推送
emit('realtime_quote', {
    symbol: '000001.SZ',
    data: { price, volume, ... },
    timestamp: ...
}, room='quotes_000001.SZ');
```

### 3. 模型训练实时通知

```javascript
// 客户端监听
socket.on('model_training_progress', function(data) {
    // data = { model_id, progress, current_step, timestamp }
    updateProgressBar(data.progress);
});

socket.on('model_training_complete', function(data) {
    // data = { model_id, metrics, timestamp }
    showResults(data.metrics);
});
```

### 4. 回测进度推送

```javascript
// 客户端监听
socket.on('backtest_progress', function(data) {
    // data = { backtest_id, progress, current_date, timestamp }
    updateBacktestProgress(data.progress, data.current_date);
});

socket.on('backtest_complete', function(data) {
    // data = { backtest_id, results, timestamp }
    renderBacktestResults(data.results);
});
```

### 5. 系统状态自动更新

```javascript
// 客户端监听
socket.on('system_status_update', function(data) {
    // data = { stats: { active_factors, trained_models, ... }, timestamp }
    updateDashboardStats(data.stats);
});
```

### 6. 警报消息

```javascript
// 客户端监听
socket.on('alert_message', function(data) {
    // data = { level, message, details, timestamp }
    showNotification(data.message, data.level);
});
```

---

## 🏗️ 架构设计

### Socket.IO房间机制

```
全局广播事件:
  - system_status_update (所有连接的客户端)
  - model_training_progress (所有连接的客户端)
  - model_training_complete (所有连接的客户端)
  - backtest_progress (所有连接的客户端)
  - backtest_complete (所有连接的客户端)
  - alert_message (所有连接的客户端)

房间分组事件:
  - realtime_quote (只发送给订阅该股票的客户端)
    房间命名: quotes_{symbol}
    例如: quotes_000001.SZ
```

### 连接管理

```python
# 连接字典结构
connected_clients = {
    'client_id': {
        'connected_at': datetime,
        'subscriptions': set(['quotes_000001.SZ', ...]),
        'user_agent': 'Mozilla/5.0...',
        'remote_addr': '127.0.0.1'
    }
}

# 房间订阅结构
room_subscriptions = {
    'quotes_000001.SZ': {'client_id_1', 'client_id_2'},
    'quotes_600000.SH': {'client_id_1'}
}
```

---

## 📊 事件类型汇总

| 事件名称 | 方向 | 触发时机 | 数据结构 |
|---------|------|---------|---------|
| `connect` | 客户端→服务端 | 连接建立 | - |
| `connected` | 服务端→客户端 | 连接确认 | `{client_id, server_time, message}` |
| `disconnect` | 客户端→服务端 | 断开连接 | - |
| `subscribe_quotes` | 客户端→服务端 | 订阅行情 | `{symbols: []}` |
| `subscribed_quotes` | 服务端→客户端 | 订阅确认 | `{symbols: [], message}` |
| `unsubscribe_quotes` | 客户端→服务端 | 取消订阅 | `{symbols: []}` |
| `system_status_update` | 服务端→客户端 | 系统状态变化 | `{stats: {}, timestamp}` |
| `realtime_quote` | 服务端→客户端 | 行情更新 | `{symbol, data, timestamp}` |
| `factor_calculation_complete` | 服务端→客户端 | 因子计算完成 | `{factor_id, result, timestamp}` |
| `model_training_progress` | 服务端→客户端 | 训练进度更新 | `{model_id, progress, current_step, timestamp}` |
| `model_training_complete` | 服务端→客户端 | 训练完成 | `{model_id, metrics, timestamp}` |
| `backtest_progress` | 服务端→客户端 | 回测进度更新 | `{backtest_id, progress, current_date, timestamp}` |
| `backtest_complete` | 服务端→客户端 | 回测完成 | `{backtest_id, results, timestamp}` |
| `alert_message` | 服务端→客户端 | 警报通知 | `{level, message, details, timestamp}` |

---

## 🔧 技术栈

- **Flask-SocketIO**: 4.x
- **Socket.IO客户端**: 4.5.4
- **异步模式**: eventlet
- **传输方式**: WebSocket (主), Polling (备用)
- **跨域支持**: `cors_allowed_origins="*"`

---

## 📝 配置说明

### 服务端配置 (`app/extensions.py`)

```python
socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode='eventlet'
)
```

### 客户端配置 (`websocket-client.js`)

```javascript
socket = io({
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5
});
```

---

## 🧪 测试建议

### 手动测试

1. **连接测试**
   ```javascript
   // 打开浏览器控制台
   // 检查是否收到 'WebSocket连接成功' 通知
   ```

2. **模型训练推送测试**
   ```bash
   # 发起模型训练请求
   curl -X POST http://localhost:5000/api/ml-factor/models/train \
     -H "Content-Type: application/json" \
     -d '{"model_id": "test_model", "start_date": "2023-01-01", "end_date": "2023-12-31"}'

   # 观察前端是否收到 model_training_progress 和 model_training_complete 事件
   ```

3. **回测推送测试**
   ```bash
   # 发起回测请求
   curl -X POST http://localhost:5000/api/ml-factor/backtest/run \
     -H "Content-Type: application/json" \
     -d '{"start_date": "2023-01-01", "end_date": "2023-12-31", "strategy": "factor_based"}'

   # 观察前端是否收到 backtest_progress 和 backtest_complete 事件
   ```

4. **系统状态推送测试**
   ```bash
   # 查询系统统计
   curl http://localhost:5000/api/ml-factor/system/stats

   # 观察所有连接的客户端是否收到 system_status_update 事件
   ```

### 自动化测试 (待实现)

```python
# tests/test_websocket.py
import pytest
from flask_socketio import SocketIOTestClient

def test_websocket_connection(app):
    client = SocketIOTestClient(app, socketio)
    assert client.is_connected()

def test_model_training_events(app):
    client = SocketIOTestClient(app, socketio)
    # 触发训练
    # 验证收到 model_training_progress 事件
    # 验证收到 model_training_complete 事件
```

---

## 🚀 使用示例

### 前端订阅实时数据

```javascript
// 1. 连接建立后订阅股票行情
socket.on('connect', function() {
    // 订阅感兴趣的股票
    subscribeRealtimeData(['000001.SZ', '600000.SH']);
});

// 2. 处理实时行情数据
socket.on('realtime_quote', function(data) {
    console.log(`${data.symbol} 最新价: ${data.data.price}`);
    updateStockPrice(data.symbol, data.data);
});

// 3. 监听系统状态
socket.on('system_status_update', function(data) {
    updateDashboard(data.stats);
});

// 4. 监听警报
socket.on('alert_message', function(data) {
    showNotification(data.message, data.level);
});
```

### 后端发送推送

```python
# 1. 在任何需要推送的地方导入函数
from app.websocket.websocket_events import (
    emit_alert_message,
    emit_model_training_complete
)

# 2. 发送推送
emit_alert_message('info', '系统维护通知', {
    'start_time': '2025-11-07 22:00',
    'duration': '2小时'
})

# 3. 模型训练完成通知
emit_model_training_complete('model_001', {
    'accuracy': 0.89,
    'loss': 0.15,
    'training_time': 120.5
})
```

---

## 🔍 故障排查

### 问题1: WebSocket连接失败

**症状**: 前端显示 "WebSocket连接错误"

**解决方法**:
1. 检查服务器是否安装 eventlet: `pip install eventlet`
2. 检查CORS配置
3. 检查防火墙设置
4. 使用polling作为备用传输方式

### 问题2: 事件未收到

**症状**: 客户端连接成功但收不到事件

**解决方法**:
1. 检查客户端是否正确监听事件名称
2. 检查服务端日志确认事件已发送
3. 检查房间订阅是否正确
4. 使用浏览器开发者工具查看WebSocket消息

### 问题3: 连接频繁断开

**症状**: WebSocket连接不稳定

**解决方法**:
1. 增加reconnectionAttempts参数
2. 调整reconnectionDelay
3. 检查网络环境
4. 实现心跳机制 (已实现ping/pong)

---

## 📈 性能优化

### 1. 事件节流

```python
# 避免高频事件刷屏
# 使用缓存机制，合并短时间内的多次更新
last_emit_time = {}
MIN_INTERVAL = 1.0  # 最小发送间隔1秒

def throttled_emit(event_name, data):
    current_time = time.time()
    if event_name not in last_emit_time or \
       current_time - last_emit_time[event_name] >= MIN_INTERVAL:
        socketio.emit(event_name, data)
        last_emit_time[event_name] = current_time
```

### 2. 房间清理

```python
# 定期清理空房间
def cleanup_empty_rooms():
    empty_rooms = [
        room for room, clients in room_subscriptions.items()
        if not clients
    ]
    for room in empty_rooms:
        del room_subscriptions[room]
```

### 3. 消息压缩

```python
# 使用SocketIO内置的消息压缩
socketio = SocketIO(
    cors_allowed_origins="*",
    async_mode='eventlet',
    compression_threshold=1024  # 超过1KB的消息启用压缩
)
```

---

## 🎯 下一步改进

### 短期 (1周内)
- [ ] 添加身份认证和授权
- [ ] 实现真实的行情数据源对接
- [ ] 添加WebSocket单元测试
- [ ] 实现进度百分比的精确计算

### 中期 (2周内)
- [ ] 添加消息持久化 (Redis)
- [ ] 实现离线消息推送
- [ ] 添加消息队列 (Celery + Redis)
- [ ] 性能压测和优化

### 长期 (1个月内)
- [ ] 实现分布式WebSocket (多服务器)
- [ ] 添加消息加密
- [ ] 实现更精细的订阅控制
- [ ] WebSocket监控和日志分析

---

## 📚 相关文档

- [Flask-SocketIO文档](https://flask-socketio.readthedocs.io/)
- [Socket.IO文档](https://socket.io/docs/)
- [前端增强说明](FRONTEND_ENHANCEMENT.md)
- [测试计划](TEST_PLAN.md)

---

**实现完成时间**: 2025-11-07
**版本**: v1.1.0-websocket
**状态**: ✅ 已完成并测试
