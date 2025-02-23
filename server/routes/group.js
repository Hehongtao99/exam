const express = require('express');
const router = express.Router();
const groupController = require('../controllers/group');
const auth = require('../middleware/auth');

// 创建群组
router.post('/create', auth, groupController.createGroup);
// 获取用户群组列表
router.get('/list', auth, groupController.getUserGroups);

module.exports = router;
