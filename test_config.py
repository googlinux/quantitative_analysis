"""测试配置 - 使用SQLite数据库"""
import os
from config import Config

class TestConfig(Config):
    """测试环境配置 - 使用SQLite"""

    # 使用SQLite数据库进行测试
    SQLALCHEMY_DATABASE_URI = 'sqlite:///app/stock_analysis.db'
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # 禁用Redis用于测试
    REDIS_HOST = None

    # 测试模式
    TESTING = True
    DEBUG = True

    # 简化配置
    SQLALCHEMY_ENGINE_OPTIONS = {}

config = {
    'test': TestConfig,
    'default': TestConfig
}
