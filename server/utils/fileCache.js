const fs = require('fs');
const path = require('path');

// 缓存文件路径
const cacheDir = path.join(__dirname, '../cache');
if (!fs.existsSync(cacheDir)) {
  fs.mkdirSync(cacheDir, { recursive: true });
}

/**
 * 设置缓存
 * @param {string} key - 缓存键
 * @param {any} value - 缓存值
 */
async function setCache(key, value) {
  try {
    const filePath = path.join(cacheDir, `${key}.json`);
    await fs.promises.writeFile(filePath, JSON.stringify(value, null, 2), 'utf8');
    return true;
  } catch (error) {
    console.error('设置缓存失败:', error);
    return false;
  }
}

/**
 * 获取缓存
 * @param {string} key - 缓存键
 * @returns {Object} 返回缓存对象
 */
async function getCache(key) {
  try {
    const filePath = path.join(cacheDir, `${key}.json`);
    if (fs.existsSync(filePath)) {
      const data = await fs.promises.readFile(filePath, 'utf8');
      return JSON.parse(data);
    }
    return {};
  } catch (error) {
    console.error('获取缓存失败:', error);
    return {};
  }
}

module.exports = {
  setCache,
  getCache
};
