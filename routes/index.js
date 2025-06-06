const Router = require('koa-router');
const aiController = require('../controller/ai');

const router = new Router();

// 常规API接口
router.post('/api/ai', aiController.postData);
router.get('/api/health', aiController.getData);

// SSE接口
router.post('/api/sse', aiController.sseData);

module.exports = router;
