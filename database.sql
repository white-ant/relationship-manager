-- ============================================
-- 人际关系管理工具 - 数据库初始化脚本
-- ============================================

CREATE DATABASE IF NOT EXISTS relationship_manager DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE relationship_manager;

-- ============================================
-- 人物表
-- ============================================
DROP TABLE IF EXISTS `people`;
CREATE TABLE `people` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `name` VARCHAR(50) NOT NULL COMMENT '姓名',
  `avatar` VARCHAR(255) DEFAULT NULL COMMENT '头像URL',
  `birthday` DATE NOT NULL COMMENT '生日',
  `relation` VARCHAR(20) NOT NULL COMMENT '关系：家人/亲戚/朋友/同学/同事/邻居',
  `contact` VARCHAR(255) DEFAULT NULL COMMENT '联系方式',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='人物表';

-- ============================================
-- 纪念日表
-- ============================================
DROP TABLE IF EXISTS `anniversaries`;
CREATE TABLE `anniversaries` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `person_id` INT UNSIGNED NOT NULL COMMENT '人物ID',
  `title` VARCHAR(100) NOT NULL COMMENT '纪念日名称',
  `date` DATE NOT NULL COMMENT '纪念日日期',
  `type` VARCHAR(20) NOT NULL DEFAULT 'custom' COMMENT '类型：birthday-生日, custom-自定义',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_person_id` (`person_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='纪念日表';

-- ============================================
-- 示例数据
-- ============================================

-- 人物示例数据
INSERT INTO `people` (`name`, `avatar`, `birthday`, `relation`, `contact`) VALUES
('张伟', NULL, '1990-06-15', '朋友', '13800138001'),
('李娜', NULL, '1992-08-23', '家人', '13800138002'),
('王强', NULL, '1988-03-10', '同事', '13800138003'),
('刘芳', NULL, '1995-12-05', '同学', NULL),
('陈明', NULL, '1985-09-18', '邻居', '13800138005');

-- 生日纪念日（自动同步）
INSERT INTO `anniversaries` (`person_id`, `title`, `date`, `type`) VALUES
(1, '张伟的生日', '1990-06-15', 'birthday'),
(2, '李娜的生日', '1992-08-23', 'birthday'),
(3, '王强的生日', '1988-03-10', 'birthday'),
(4, '刘芳的生日', '1995-12-05', 'birthday'),
(5, '陈明的生日', '1985-09-18', 'birthday');

-- 自定义纪念日示例
INSERT INTO `anniversaries` (`person_id`, `title`, `date`, `type`) VALUES
(1, '相识纪念日', '2018-05-20', 'custom'),
(2, '结婚纪念日', '2015-10-01', 'custom'),
(3, '入职纪念日', '2020-07-15', 'custom');
