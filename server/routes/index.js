const Router = require('koa-router');
const sseController = require('../controller/sse');
const aiController = require('../controller/ai');


const router = new Router();

// SSE接口
router.post('/api/sse', sseController.sendSSE);

// 公司AI接口
router.post('/api/chat', aiController.Chat);
router.post('/api/chatStream', aiController.ChatStream);


module.exports = router;
