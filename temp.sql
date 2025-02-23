/*
 Navicat Premium Data Transfer

 Source Server         : 113.45.161.48华为云-2c2
 Source Server Type    : MySQL
 Source Server Version : 80041
 Source Host           : 113.45.161.48:3306
 Source Schema         : exam

 Target Server Type    : MySQL
 Target Server Version : 80041
 File Encoding         : 65001

 Date: 22/02/2025 15:46:22
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for users
-- ----------------------------
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` int NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL COMMENT '用户名',
  `password` varchar(255) NOT NULL COMMENT '密码',
  `nickname` varchar(50) DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '头像URL',
  `signature` text COMMENT '个性签名',
  `role` enum('admin','user') NOT NULL DEFAULT 'user' COMMENT '用户角色',
  `status` tinyint(1) NOT NULL DEFAULT '1' COMMENT '状态：1-正常，0-禁用',
  `last_login` datetime DEFAULT NULL COMMENT '最后登录时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_username` (`username`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for question_banks
-- ----------------------------
DROP TABLE IF EXISTS `question_banks`;
CREATE TABLE `question_banks` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '题库名称',
  `description` text COMMENT '题库描述',
  `cover_image` varchar(255) DEFAULT NULL COMMENT '封面图片',
  `category` varchar(50) DEFAULT NULL COMMENT '题库分类',
  `difficulty` enum('easy','medium','hard') DEFAULT 'medium' COMMENT '难度等级',
  `user_id` int NOT NULL COMMENT '创建者ID',
  `is_public` tinyint(1) DEFAULT '1' COMMENT '是否公开',
  `question_count` int DEFAULT '0' COMMENT '题目数量',
  `used_count` int DEFAULT '0' COMMENT '使用次数',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_category` (`category`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for questions
-- ----------------------------
DROP TABLE IF EXISTS `questions`;
CREATE TABLE `questions` (
  `id` int NOT NULL AUTO_INCREMENT,
  `bank_id` int NOT NULL COMMENT '所属题库ID',
  `type` enum('single','multiple','judge','essay') NOT NULL COMMENT '题目类型',
  `content` text NOT NULL COMMENT '题目内容',
  `options` json DEFAULT NULL COMMENT '选项',
  `answer` text NOT NULL COMMENT '答案',
  `analysis` text COMMENT '题目解析',
  `difficulty` tinyint DEFAULT '2' COMMENT '难度：1-简单，2-中等，3-困难',
  `correct_count` int DEFAULT '0' COMMENT '正确次数',
  `wrong_count` int DEFAULT '0' COMMENT '错误次数',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_bank_id` (`bank_id`),
  KEY `idx_type` (`type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for exams
-- ----------------------------
DROP TABLE IF EXISTS `exams`;
CREATE TABLE `exams` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `bank_id` int NOT NULL COMMENT '题库ID',
  `total_score` int NOT NULL DEFAULT '0' COMMENT '总分',
  `pass_score` int NOT NULL DEFAULT '60' COMMENT '及格分数',
  `duration` int DEFAULT '60' COMMENT '考试时长(分钟)',
  `start_time` datetime DEFAULT NULL COMMENT '开始时间',
  `end_time` datetime DEFAULT NULL COMMENT '结束时间',
  `status` enum('pending','ongoing','completed','timeout') DEFAULT 'pending' COMMENT '状态',
  `score` int DEFAULT NULL COMMENT '得分',
  `correct_count` int DEFAULT '0' COMMENT '正确题数',
  `wrong_count` int DEFAULT '0' COMMENT '错误题数',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_bank_id` (`bank_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for exam_answers
-- ----------------------------
DROP TABLE IF EXISTS `exam_answers`;
CREATE TABLE `exam_answers` (
  `id` int NOT NULL AUTO_INCREMENT,
  `exam_id` int NOT NULL COMMENT '考试ID',
  `question_id` int NOT NULL COMMENT '题目ID',
  `user_answer` text COMMENT '用户答案',
  `is_correct` tinyint(1) DEFAULT NULL COMMENT '是否正确',
  `score` int DEFAULT '0' COMMENT '得分',
  `answer_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '作答时间',
  PRIMARY KEY (`id`),
  KEY `idx_exam_id` (`exam_id`),
  KEY `idx_question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for mistake_books
-- ----------------------------
DROP TABLE IF EXISTS `mistake_books`;
CREATE TABLE `mistake_books` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `question_id` int NOT NULL COMMENT '题目ID',
  `mistake_count` int DEFAULT '1' COMMENT '错误次数',
  `last_mistake_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '最后错误时间',
  `note` text COMMENT '笔记',
  `status` enum('active','archived') DEFAULT 'active' COMMENT '状态',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_question` (`user_id`,`question_id`),
  KEY `idx_question_id` (`question_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for friends
-- ----------------------------
DROP TABLE IF EXISTS `friends`;
CREATE TABLE `friends` (
  `id` int NOT NULL AUTO_INCREMENT,
  `user_id` int NOT NULL COMMENT '用户ID',
  `friend_id` int NOT NULL COMMENT '好友ID',
  `nickname` varchar(50) DEFAULT NULL COMMENT '好友备注',
  `status` enum('pending','accepted','blocked') NOT NULL DEFAULT 'pending' COMMENT '状态',
  `source` varchar(50) DEFAULT NULL COMMENT '来源',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_user_friend` (`user_id`,`friend_id`),
  KEY `idx_friend_id` (`friend_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for messages
-- ----------------------------
DROP TABLE IF EXISTS `messages`;
CREATE TABLE `messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `from_user_id` int NOT NULL COMMENT '发送者ID',
  `to_user_id` int NOT NULL COMMENT '接收者ID',
  `type` varchar(20) NOT NULL DEFAULT 'text' COMMENT '消息类型',
  `content` text NOT NULL COMMENT '消息内容',
  `metadata` json DEFAULT NULL COMMENT '元数据',
  `original_name` varchar(255) DEFAULT NULL COMMENT '原始文件名',
  `is_read` tinyint(1) DEFAULT '0' COMMENT '是否已读',
  `status` enum('sent','delivered','read','deleted') DEFAULT 'sent' COMMENT '状态',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_from_user` (`from_user_id`),
  KEY `idx_to_user` (`to_user_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for groups
-- ----------------------------
DROP TABLE IF EXISTS `groups`;
CREATE TABLE `groups` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL COMMENT '群组名称',
  `avatar` varchar(255) DEFAULT NULL COMMENT '群头像',
  `description` text COMMENT '群组描述',
  `owner_id` int NOT NULL COMMENT '群主ID',
  `max_members` int DEFAULT '200' COMMENT '最大成员数',
  `status` enum('active','locked','dismissed') DEFAULT 'active' COMMENT '状态',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `update_time` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_owner_id` (`owner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for group_members
-- ----------------------------
DROP TABLE IF EXISTS `group_members`;
CREATE TABLE `group_members` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL COMMENT '群组ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `nickname` varchar(50) DEFAULT NULL COMMENT '群昵称',
  `role` enum('owner','admin','member') NOT NULL DEFAULT 'member' COMMENT '角色',
  `mute_end_time` datetime DEFAULT NULL COMMENT '禁言结束时间',
  `join_time` datetime DEFAULT CURRENT_TIMESTAMP,
  `status` enum('active','left','kicked') DEFAULT 'active' COMMENT '状态',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_group_user` (`group_id`,`user_id`),
  KEY `idx_user_id` (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for group_messages
-- ----------------------------
DROP TABLE IF EXISTS `group_messages`;
CREATE TABLE `group_messages` (
  `id` int NOT NULL AUTO_INCREMENT,
  `group_id` int NOT NULL COMMENT '群组ID',
  `from_user_id` int NOT NULL COMMENT '发送者ID',
  `type` varchar(20) NOT NULL DEFAULT 'text' COMMENT '消息类型',
  `content` text NOT NULL COMMENT '消息内容',
  `metadata` json DEFAULT NULL COMMENT '元数据',
  `is_recalled` tinyint(1) DEFAULT '0' COMMENT '是否已撤回',
  `recall_time` datetime DEFAULT NULL COMMENT '撤回时间',
  `create_time` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_group_id` (`group_id`),
  KEY `idx_from_user_id` (`from_user_id`),
  KEY `idx_create_time` (`create_time`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ----------------------------
-- Table structure for group_message_read
-- ----------------------------
DROP TABLE IF EXISTS `group_message_read`;
CREATE TABLE `group_message_read` (
  `id` int NOT NULL AUTO_INCREMENT,
  `message_id` int NOT NULL COMMENT '消息ID',
  `user_id` int NOT NULL COMMENT '用户ID',
  `read_time` datetime DEFAULT CURRENT_TIMESTAMP COMMENT '阅读时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `idx_message_user` (`message_id`,`user_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_read_message` FOREIGN KEY (`message_id`) REFERENCES `group_messages` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_read_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

SET FOREIGN_KEY_CHECKS = 1;
