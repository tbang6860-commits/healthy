"""
AI 热点聚合分析平台 - 配置管理
读取 config.ini，提供类型安全的配置访问。
"""
import os
import configparser
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
CONFIG_FILE = BASE_DIR / "config.ini"

_config = configparser.ConfigParser()


def _load():
    """加载配置文件，不存在则回退到 example"""
    if CONFIG_FILE.exists():
        _config.read(CONFIG_FILE, encoding="utf-8")
    else:
        example = BASE_DIR / "config_example.ini"
        _config.read(example, encoding="utf-8")


_load()


def get(section: str, key: str, fallback=None):
    """获取配置值"""
    try:
        return _config.get(section, key, fallback=fallback)
    except (configparser.NoSectionError, configparser.NoOptionError):
        return fallback


def getint(section: str, key: str, fallback=0):
    try:
        return _config.getint(section, key, fallback=fallback)
    except (configparser.NoSectionError, configparser.NoOptionError, ValueError):
        return fallback


def getfloat(section: str, key: str, fallback=0.0):
    try:
        return _config.getfloat(section, key, fallback=fallback)
    except (configparser.NoSectionError, configparser.NoOptionError, ValueError):
        return fallback


# --- 常用配置快捷访问 ---
REFRESH_INTERVAL_MINUTES = getint("aihot", "refresh_interval", 30)
REQUEST_TIMEOUT = getint("aihot", "request_timeout", 30)

FIRECRAWL_API_KEY = get("firecrawl", "api_key", "")
FIRECRAWL_BASE_URL = get("firecrawl", "base_url", "https://api.firecrawl.dev")

TWITTER_API_KEY = get("twitter", "api_key", "")
TWITTER_BASE_URL = get("twitter", "base_url", "https://api.twitterapi.io")

DEEPSEEK_API_KEY = get("deepseek", "api_key", "")
DEEPSEEK_BASE_URL = get("deepseek", "base_url", "https://api.deepseek.com")
DEEPSEEK_MODEL = get("deepseek", "model", "deepseek-v4-flash")

# 抓取目标 URLs
WEIBO_HOT_URL = get("targets", "weibo_hot", "")
BAIDU_HOT_URL = get("targets", "baidu_hot", "")
ZHIHU_HOT_URL = get("targets", "zhihu_hot", "")

# 分析参数
SIMILARITY_THRESHOLD = getfloat("analysis", "similarity_threshold", 0.7)
MAX_HOTSPOTS = getint("analysis", "max_hotspots", 50)
CATEGORIES = [c.strip() for c in get("analysis", "categories", "").split(",") if c.strip()]


def is_configured() -> bool:
    """检查是否至少配置了一个 API Key"""
    return bool(FIRECRAWL_API_KEY and "YOUR" not in FIRECRAWL_API_KEY) or \
           bool(TWITTER_API_KEY and "YOUR" not in TWITTER_API_KEY)


if __name__ == "__main__":
    print(f"Refresh Interval: {REFRESH_INTERVAL_MINUTES} min")
    print(f"Firecrawl Key: {'***' if FIRECRAWL_API_KEY else 'NOT SET'}")
    print(f"Twitter Key: {'***' if TWITTER_API_KEY else 'NOT SET'}")
    print(f"DeepSeek Key: {'***' if DEEPSEEK_API_KEY else 'NOT SET'}")
    print(f"Categories: {CATEGORIES}")
