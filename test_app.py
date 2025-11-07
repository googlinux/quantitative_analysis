"""测试应用启动脚本"""
import sys
import os

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from flask import Flask
from flask_cors import CORS
from test_config import TestConfig
from app.extensions import db, socketio
from app.utils.logger import setup_logger

def create_test_app():
    """创建测试应用"""
    app = Flask(__name__)

    # 加载测试配置
    app.config.from_object(TestConfig)

    # 初始化扩展
    db.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*", async_mode='eventlet')
    CORS(app)

    # 设置日志
    setup_logger('INFO', 'test.log')

    # 注册蓝图
    from app.api import api_bp
    from app.api.ml_factor_api import ml_factor_bp
    from app.routes.ml_factor_routes import ml_factor_routes
    from app.main import main_bp

    app.register_blueprint(api_bp, url_prefix='/api')
    app.register_blueprint(ml_factor_bp)
    app.register_blueprint(ml_factor_routes)
    app.register_blueprint(main_bp)

    # 注册WebSocket事件处理器
    from app.websocket import websocket_events

    return app

if __name__ == '__main__':
    app = create_test_app()
    print("=" * 60)
    print("测试服务器启动")
    print("访问: http://localhost:5000")
    print("使用SQLite数据库: app/stock_analysis.db")
    print("=" * 60)

    # 使用socketio.run而不是app.run
    socketio.run(app, host='0.0.0.0', port=5000, debug=True)
