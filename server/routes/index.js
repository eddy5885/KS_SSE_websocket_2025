const Router = require('koa-router');
const aiController = require('../controller/ai');
const aiControllerV2 = require('../controller/aiv2');


const router = new Router();

// 常规API接口
router.post('/api/ai', aiController.postData);
router.get('/api/health', aiController.getData);

// SSE接口
router.post('/api/sse', aiController.sseData);

// 公司AI接口
router.post('/api/chat', aiControllerV2.Chat);


module.exports = router;
