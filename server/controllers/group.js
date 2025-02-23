const { Group, GroupMember } = require('../models');

exports.createGroup = async (req, res) => {
  try {
    const { name } = req.body;
    
    // 创建群组
    const group = await Group.create({
      name,
      creator_id: req.user.id
    });

    // 添加创建者为群成员
    await GroupMember.create({
      group_id: group.id,
      user_id: req.user.id,
      role: 'admin'
    });

    res.json({
      success: true,
      data: group
    });
  } catch (error) {
    console.error('创建群组错误:', error);
    res.status(500).json({ 
      success: false, 
      message: error.errors?.[0]?.message || '创建群组失败'
    });
  }
};

exports.getUserGroups = async (req, res) => {
  try {
    const groups = await GroupMember.findAll({
      where: { user_id: req.user.id },
      include: [{
        model: Group,
        attributes: ['id', 'name', 'created_at']
      }],
      order: [[Group, 'created_at', 'DESC']]
    });

    res.json({
      success: true,
      data: groups.map(g => ({
        id: g.Group.id,
        name: g.Group.name,
        create_time: g.Group.created_at,
        role: g.role
      }))
    });
  } catch (error) {
    console.error('获取群组列表错误:', error);
    res.status(500).json({ 
      success: false,
      message: error.errors?.[0]?.message || '获取群组列表失败'
    });
  }
};
