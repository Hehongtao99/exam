/*
 Navicat Premium Dump SQL

 Source Server         : 113.45.161.48-华为云2c4
 Source Server Type    : MySQL
 Source Server Version : 80041 (8.0.41)
 Source Host           : 113.45.161.48:3306
 Source Schema         : exam

 Target Server Type    : MySQL
 Target Server Version : 80041 (8.0.41)
 File Encoding         : 65001

 Date: 07/03/2025 14:59:41
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for exam_answers
-- ----------------------------
DROP TABLE IF EXISTS `exam_answers`;
CREATE TABLE `exam_answers`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `exam_id` int NOT NULL COMMENT '考试ID',
  `question_id` int NOT NULL COMMENT '题目ID',
  `user_answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '用户答案',
  `is_correct` tinyint(1) NULL DEFAULT NULL COMMENT '是否正确',
  `score` int NULL DEFAULT 0 COMMENT '得分',
  `answer_time` datetime NULL DEFAULT CURRENT_TIMESTAMP COMMENT '作答时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_exam_id`(`exam_id` ASC) USING BTREE,
  INDEX `idx_question_id`(`question_id` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 1 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exam_details
-- ----------------------------
DROP TABLE IF EXISTS `exam_details`;
CREATE TABLE `exam_details`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `examId` int NOT NULL,
  `questionId` int NOT NULL,
  `user_answer` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `is_correct` tinyint(1) NOT NULL,
  `create_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `examId`(`examId` ASC) USING BTREE,
  INDEX `questionId`(`questionId` ASC) USING BTREE,
  CONSTRAINT `exam_details_ibfk_93` FOREIGN KEY (`examId`) REFERENCES `exams` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exam_details_ibfk_94` FOREIGN KEY (`questionId`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 82 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for exams
-- ----------------------------
DROP TABLE IF EXISTS `exams`;
CREATE TABLE `exams`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `score` int NOT NULL,
  `correct_count` int NOT NULL,
  `wrong_count` int NOT NULL,
  `create_time` datetime NULL DEFAULT NULL,
  `userId` int NOT NULL,
  `bankId` int NOT NULL,
  `total_questions` int NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `userId`(`userId` ASC) USING BTREE,
  INDEX `bankId`(`bankId` ASC) USING BTREE,
  CONSTRAINT `exams_ibfk_93` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `exams_ibfk_94` FOREIGN KEY (`bankId`) REFERENCES `question_banks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for friends
-- ----------------------------
DROP TABLE IF EXISTS `friends`;
CREATE TABLE `friends`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '好友备注名',
  `status` enum('pending','accepted','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending',
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  `userId` int NOT NULL,
  `friendId` int NOT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `userId`(`userId` ASC) USING BTREE,
  INDEX `friendId`(`friendId` ASC) USING BTREE,
  CONSTRAINT `friends_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `friends_ibfk_2` FOREIGN KEY (`friendId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 6 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for group_members
-- ----------------------------
DROP TABLE IF EXISTS `group_members`;
CREATE TABLE `group_members`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL COMMENT '群组ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '群昵称',
  `role` enum('owner','admin','member') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'member' COMMENT '成员角色: owner-群主, admin-管理员, member-普通成员',
  `mute_end_time` datetime NULL DEFAULT NULL COMMENT '禁言结束时间',
  `join_time` datetime NULL DEFAULT NULL COMMENT '加入时间',
  `last_read_time` datetime NULL DEFAULT NULL COMMENT '最后阅读时间',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_group_user`(`group_id` ASC, `user_id` ASC) USING BTREE,
  UNIQUE INDEX `group_members_group_id_user_id`(`group_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `idx_user_id`(`user_id` ASC) USING BTREE,
  CONSTRAINT `group_members_ibfk_95` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `group_members_ibfk_96` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 7 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for group_message_read
-- ----------------------------
DROP TABLE IF EXISTS `group_message_read`;
CREATE TABLE `group_message_read`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL COMMENT '群组ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `last_read_time` datetime NOT NULL COMMENT '最后读取时间',
  `message_id` int NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_group_user`(`group_id` ASC, `user_id` ASC) USING BTREE,
  UNIQUE INDEX `group_message_read_group_id_user_id`(`group_id` ASC, `user_id` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `message_id`(`message_id` ASC) USING BTREE,
  CONSTRAINT `group_message_read_ibfk_93` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `group_message_read_ibfk_94` FOREIGN KEY (`message_id`) REFERENCES `group_messages` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 49 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for group_messages
-- ----------------------------
DROP TABLE IF EXISTS `group_messages`;
CREATE TABLE `group_messages`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL COMMENT '群组ID',
  `from_user_id` int NOT NULL COMMENT '发送者ID',
  `type` varchar(20) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'text' COMMENT '消息类型',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '消息内容',
  `metadata` json NULL COMMENT '消息元数据',
  `create_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_group_id`(`group_id` ASC) USING BTREE,
  INDEX `idx_from_user_id`(`from_user_id` ASC) USING BTREE,
  INDEX `idx_create_time`(`create_time` ASC) USING BTREE,
  INDEX `group_messages_group_id`(`group_id` ASC) USING BTREE,
  INDEX `group_messages_from_user_id`(`from_user_id` ASC) USING BTREE,
  INDEX `group_messages_create_time`(`create_time` ASC) USING BTREE,
  CONSTRAINT `group_messages_ibfk_95` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `group_messages_ibfk_96` FOREIGN KEY (`from_user_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 13 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for group_requests
-- ----------------------------
DROP TABLE IF EXISTS `group_requests`;
CREATE TABLE `group_requests`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL,
  `user_id` int NOT NULL,
  `status` enum('pending','accepted','rejected') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'pending' COMMENT '申请状态',
  `create_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `group_id`(`group_id` ASC) USING BTREE,
  INDEX `user_id`(`user_id` ASC) USING BTREE,
  INDEX `status`(`status` ASC) USING BTREE,
  INDEX `group_requests_group_id`(`group_id` ASC) USING BTREE,
  INDEX `group_requests_user_id`(`user_id` ASC) USING BTREE,
  INDEX `group_requests_status`(`status` ASC) USING BTREE,
  CONSTRAINT `group_requests_ibfk_79` FOREIGN KEY (`group_id`) REFERENCES `groups` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `group_requests_ibfk_80` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 17 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for groups
-- ----------------------------
DROP TABLE IF EXISTS `groups`;
CREATE TABLE `groups`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_number` varchar(4) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '群号(4位数字)',
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '群组名称',
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL COMMENT '群头像',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '群描述',
  `owner_id` int NOT NULL COMMENT '群主ID',
  `announcement` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '群公告',
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `idx_group_number`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `groups_group_number`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_2`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_3`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_4`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_5`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_6`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_7`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_8`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_9`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_10`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_11`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_12`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_13`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_14`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_15`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_16`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_17`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_18`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_19`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_20`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_21`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_22`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_23`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_24`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_25`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_26`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_27`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_28`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_29`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_30`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_31`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_32`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_33`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_34`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_35`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_36`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_37`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_38`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_39`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_40`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_41`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_42`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_43`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_44`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_45`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_46`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_47`(`group_number` ASC) USING BTREE,
  UNIQUE INDEX `group_number_48`(`group_number` ASC) USING BTREE,
  INDEX `owner_id`(`owner_id` ASC) USING BTREE,
  CONSTRAINT `groups_ibfk_1` FOREIGN KEY (`owner_id`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 4 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `type` enum('text','image','voice','file','emoji','question_bank') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'text',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `create_time` datetime NULL DEFAULT NULL,
  `fromUserId` int NOT NULL,
  `toUserId` int NOT NULL,
  `isRead` tinyint(1) NULL DEFAULT 0,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_create_time`(`create_time` ASC) USING BTREE,
  INDEX `fromUserId`(`fromUserId` ASC) USING BTREE,
  INDEX `toUserId`(`toUserId` ASC) USING BTREE,
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`fromUserId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`toUserId`) REFERENCES `users` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 14 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = DYNAMIC;

-- ----------------------------
-- Table structure for mistake_books
-- ----------------------------
DROP TABLE IF EXISTS `mistake_books`;
CREATE TABLE `mistake_books`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `userId` int NOT NULL,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_userId`(`userId` ASC) USING BTREE,
  CONSTRAINT `mistake_books_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 2 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for mistake_records
-- ----------------------------
DROP TABLE IF EXISTS `mistake_records`;
CREATE TABLE `mistake_records`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `bookId` int NOT NULL,
  `questionId` int NOT NULL,
  `create_time` datetime NULL DEFAULT NULL,
  `error_count` int NOT NULL DEFAULT 1 COMMENT '错误次数',
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_bookId_questionId`(`bookId` ASC, `questionId` ASC) USING BTREE,
  INDEX `questionId`(`questionId` ASC) USING BTREE,
  CONSTRAINT `mistake_records_ibfk_105` FOREIGN KEY (`bookId`) REFERENCES `mistake_books` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `mistake_records_ibfk_106` FOREIGN KEY (`questionId`) REFERENCES `questions` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 3 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for question_banks
-- ----------------------------
DROP TABLE IF EXISTS `question_banks`;
CREATE TABLE `question_banks`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '题库名称',
  `description` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '题库描述',
  `userId` int NOT NULL,
  `is_public` tinyint(1) NOT NULL DEFAULT 0 COMMENT '是否公开',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_userId`(`userId` ASC) USING BTREE,
  INDEX `idx_is_public`(`is_public` ASC) USING BTREE,
  CONSTRAINT `question_banks_ibfk_1` FOREIGN KEY (`userId`) REFERENCES `users` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 10 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for questions
-- ----------------------------
DROP TABLE IF EXISTS `questions`;
CREATE TABLE `questions`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `bankId` int NOT NULL,
  `type` enum('single','multiple','judge','essay') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '题目类型：single-单选题，multiple-多选题，judge-判断题，essay-问答题',
  `content` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '题目内容',
  `options` json NULL COMMENT '选项，格式：{A: \"选项内容\", B: \"选项内容\", ...}',
  `answer` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL COMMENT '答案。单选题：A/B/C/D，多选题：A,B,C，判断题：true/false，问答题：文本',
  `analysis` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL COMMENT '题目解析',
  `create_time` datetime NULL DEFAULT NULL COMMENT '创建时间',
  `update_time` datetime NULL DEFAULT NULL COMMENT '更新时间',
  PRIMARY KEY (`id`) USING BTREE,
  INDEX `idx_bankId`(`bankId` ASC) USING BTREE,
  INDEX `idx_type`(`type` ASC) USING BTREE,
  CONSTRAINT `questions_ibfk_1` FOREIGN KEY (`bankId`) REFERENCES `question_banks` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE = InnoDB AUTO_INCREMENT = 457 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users`  (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `password` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL,
  `nickname` varchar(50) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `avatar` varchar(255) CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL DEFAULT NULL,
  `signature` text CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NULL,
  `role` enum('admin','user') CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci NOT NULL DEFAULT 'user',
  `create_time` datetime NULL DEFAULT NULL,
  `update_time` datetime NULL DEFAULT NULL,
  PRIMARY KEY (`id`) USING BTREE,
  UNIQUE INDEX `uk_username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_2`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_3`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_4`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_5`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_6`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_7`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_8`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_9`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_10`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_11`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_12`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_13`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_14`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_15`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_16`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_17`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_18`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_19`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_20`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_21`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_22`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_23`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_24`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_25`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_26`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_27`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_28`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_29`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_30`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_31`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_32`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_33`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_34`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_35`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_36`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_37`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_38`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_39`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_40`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_41`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_42`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_43`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_44`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_45`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_46`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_47`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_48`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_49`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_50`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_51`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_52`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_53`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_54`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_55`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_56`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_57`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_58`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_59`(`username` ASC) USING BTREE,
  UNIQUE INDEX `username_60`(`username` ASC) USING BTREE,
  INDEX `idx_role`(`role` ASC) USING BTREE,
  INDEX `idx_create_time`(`create_time` ASC) USING BTREE
) ENGINE = InnoDB AUTO_INCREMENT = 5 CHARACTER SET = utf8mb4 COLLATE = utf8mb4_general_ci ROW_FORMAT = Dynamic;

SET FOREIGN_KEY_CHECKS = 1;
