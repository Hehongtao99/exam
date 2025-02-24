const User = require('./user');
const QuestionBank = require('./questionBank');
const Question = require('./question');
const Exam = require('./exam');
const ExamDetail = require('./examDetail');
const MistakeBook = require('./mistakeBook');
const MistakeRecord = require('./mistakeRecord');
const Friend = require('./friend');
const Message = require('./message');
const Group = require('./group');
const GroupMember = require('./groupMember');
const GroupMessage = require('./groupMessage');
const GroupMessageRead = require('./groupMessageRead');
const GroupRequest = require('./groupRequest');

// 用户与题库关联
User.hasMany(QuestionBank, {
  foreignKey: 'userId',
  as: 'questionBanks'
});

QuestionBank.belongsTo(User, {
  foreignKey: 'userId',
  as: 'owner'
});

// 题库与题目关联
QuestionBank.hasMany(Question, {
  foreignKey: 'bankId',
  as: 'bankQuestions'
});

Question.belongsTo(QuestionBank, {
  foreignKey: 'bankId',
  as: 'bank'
});

// 用户与考试关联
User.hasMany(Exam, {
  foreignKey: 'userId',
  as: 'userExams'
});

Exam.belongsTo(User, {
  foreignKey: 'userId',
  as: 'examUser'
});

// 题库与考试关联
QuestionBank.hasMany(Exam, {
  foreignKey: 'bankId',
  as: 'bankExams'
});

Exam.belongsTo(QuestionBank, {
  foreignKey: 'bankId',
  as: 'examBank'
});

// 考试与考试详情关联
Exam.hasMany(ExamDetail, {
  foreignKey: 'examId',
  as: 'examDetails'
});

ExamDetail.belongsTo(Exam, {
  foreignKey: 'examId',
  as: 'exam'
});

// 题目与考试详情关联
Question.hasMany(ExamDetail, {
  foreignKey: 'questionId',
  as: 'questionDetails'
});

ExamDetail.belongsTo(Question, {
  foreignKey: 'questionId',
  as: 'question'
});

// 用户与错题本关联
User.hasMany(MistakeBook, {
  foreignKey: 'userId',
  as: 'mistakeBooks'
});

MistakeBook.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

// 题目与错题记录关联
Question.hasMany(MistakeRecord, {
  foreignKey: 'questionId',
  as: 'questionMistakes'
});

MistakeRecord.belongsTo(Question, {
  foreignKey: 'questionId',
  as: 'question'
});

// 错题本与错题记录关联
MistakeBook.hasMany(MistakeRecord, {
  foreignKey: 'bookId',
  as: 'mistakeRecords'
});

MistakeRecord.belongsTo(MistakeBook, {
  foreignKey: 'bookId',
  as: 'mistakeBook'
});

// 好友关系关联
Friend.belongsTo(User, {
  foreignKey: 'userId',
  as: 'user'
});

Friend.belongsTo(User, {
  foreignKey: 'friendId',
  as: 'friendInfo'
});

// 好友请求关联
Friend.belongsTo(User, {
  foreignKey: 'userId',
  as: 'requestUser'
});

// 消息关联
Message.belongsTo(User, {
  foreignKey: 'fromUserId',
  as: 'fromUser'
});

Message.belongsTo(User, {
  foreignKey: 'toUserId',
  as: 'toUser'
});

// 群组关联
Group.belongsTo(User, {
  foreignKey: 'owner_id',
  as: 'owner'
});

Group.hasMany(GroupMember, {
  foreignKey: 'group_id',
  as: 'members'
});

GroupMember.belongsTo(Group, {
  foreignKey: 'group_id',
  as: 'group'
});

GroupMember.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

Group.hasMany(GroupMessage, {
  foreignKey: 'group_id',
  as: 'messages'
});

GroupMessage.belongsTo(Group, {
  foreignKey: 'group_id',
  as: 'group'
});

GroupMessage.belongsTo(User, {
  foreignKey: 'from_user_id',
  as: 'fromUser'
});

GroupMessage.hasMany(GroupMessageRead, {
  foreignKey: 'message_id',
  as: 'readRecords'
});

GroupMessageRead.belongsTo(GroupMessage, {
  foreignKey: 'message_id',
  as: 'message'
});

GroupMessageRead.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user'
});

// 群组申请关联
GroupRequest.belongsTo(Group, {
  foreignKey: 'group_id',
  as: 'group',
  onDelete: 'CASCADE'
});

GroupRequest.belongsTo(User, {
  foreignKey: 'user_id',
  as: 'user',
  onDelete: 'CASCADE'
});

Group.hasMany(GroupRequest, {
  foreignKey: 'group_id',
  as: 'requests',
  onDelete: 'CASCADE'
});

User.hasMany(GroupRequest, {
  foreignKey: 'user_id',
  as: 'groupRequests',
  onDelete: 'CASCADE'
});

module.exports = {
  User,
  QuestionBank,
  Question,
  Exam,
  ExamDetail,
  MistakeBook,
  MistakeRecord,
  Friend,
  Message,
  Group,
  GroupMember,
  GroupMessage,
  GroupMessageRead,
  GroupRequest
}; 