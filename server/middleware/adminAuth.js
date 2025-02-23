const User = require('../models/user');

const adminAuth = async (req, res, next) => {
  try {
    const userId = req.headers['x-user-id'];
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: '未登录'
      });
    }

    const user = await User.findByPk(parseInt(userId));
    if (!user || user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: '无权限访问'
      });
    }

    next();
  } catch (error) {
    console.error('管理员权限验证失败:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

module.exports = adminAuth; 