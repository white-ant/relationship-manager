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
('我', NULL, '1990-01-01', '自己', NULL),
('张伟', NULL, '1990-06-15', '朋友', '13800138001'),
('李娜', NULL, '1992-08-23', '家人', '13800138002'),
('王强', NULL, '1988-03-10', '同事', '13800138003'),
('刘芳', NULL, '1995-12-05', '同学', NULL),
('陈明', NULL, '1985-09-18', '邻居', '13800138005'),
('小明', NULL, '1991-04-20', '朋友', '13800138006'),
('张三', NULL, '1965-05-10', '家人', '13800138007'),
('李四', NULL, '1968-08-15', '家人', '13800138008'),
('王五', NULL, '1963-02-28', '家人', '13800138009'),
('赵六', NULL, '1966-11-12', '家人', '13800138010'),
('小红', NULL, '1993-07-08', '朋友', '13800138011'),
('小亮', NULL, '2018-12-01', '家人', NULL),
('小强', NULL, '1995-03-25', '朋友', '13800138012');

-- 生日纪念日（自动同步）
INSERT INTO `anniversaries` (`person_id`, `title`, `date`, `type`) VALUES
(2, '张伟的生日', '1990-06-15', 'birthday'),
(3, '李娜的生日', '1992-08-23', 'birthday'),
(4, '王强的生日', '1988-03-10', 'birthday'),
(5, '刘芳的生日', '1995-12-05', 'birthday'),
(6, '陈明的生日', '1985-09-18', 'birthday'),
(7, '小明的生日', '1991-04-20', 'birthday'),
(8, '张三的生日', '1965-05-10', 'birthday'),
(9, '李四的生日', '1968-08-15', 'birthday'),
(10, '王五的生日', '1963-02-28', 'birthday'),
(11, '赵六的生日', '1966-11-12', 'birthday'),
(12, '小红的生日', '1993-07-08', 'birthday'),
(13, '小亮的生日', '2018-12-01', 'birthday'),
(14, '小强的生日', '1995-03-25', 'birthday');

-- 自定义纪念日示例
INSERT INTO `anniversaries` (`person_id`, `title`, `date`, `type`) VALUES
(2, '相识纪念日', '2018-05-20', 'custom'),
(3, '结婚纪念日', '2015-10-01', 'custom'),
(4, '入职纪念日', '2020-07-15', 'custom');

-- ============================================
-- 人情往来记录表
-- ============================================
DROP TABLE IF EXISTS `relationship_records`;
CREATE TABLE `relationship_records` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `person_id` INT UNSIGNED NOT NULL COMMENT '人物ID',
  `category` VARCHAR(10) NOT NULL COMMENT '分类：money-资金往来, gift-礼物/人情往来',
  `type` VARCHAR(20) NOT NULL COMMENT '具体类型: transfer/receive/lend/return_in/pay_for/reimburse/red_packet_out/red_packet_in/gift_in/gift_out/treat/treated/help/helped',
  `type_name` VARCHAR(20) NOT NULL COMMENT '类型中文名称',
  `direction` VARCHAR(10) NOT NULL COMMENT '方向：income-收入, expense-支出, neutral-中立',
  `amount` DECIMAL(10,2) DEFAULT NULL COMMENT '金额，资金类必填',
  `gift_name` VARCHAR(100) DEFAULT NULL COMMENT '礼物名称，礼物类必填',
  `gift_image` VARCHAR(255) DEFAULT NULL COMMENT '礼物图片URL',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `record_date` DATE NOT NULL COMMENT '记录日期',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_person_id` (`person_id`),
  KEY `idx_category` (`category`),
  KEY `idx_record_date` (`record_date`),
  KEY `idx_person_date` (`person_id`, `record_date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='人情往来记录表';

-- ============================================
-- 人情往来示例数据
-- ============================================

-- 张伟的人情往来
INSERT INTO `relationship_records` (`person_id`, `category`, `type`, `type_name`, `direction`, `amount`, `gift_name`, `gift_image`, `remark`, `record_date`) VALUES
(2, 'money', 'transfer', '转账', 'expense', 200.00, NULL, NULL, '生日红包', '2026-06-15'),
(2, 'money', 'return_in', '还入', 'income', 100.00, NULL, NULL, '归还之前借款', '2026-05-20'),
(2, 'gift', 'gift_out', '送礼', 'neutral', NULL, '生日蛋糕', NULL, '生日当天送的', '2026-06-15'),
(2, 'gift', 'gift_in', '收礼', 'neutral', NULL, '茶叶', NULL, '收到龙井茶叶一盒', '2026-03-10');

-- 李娜的人情往来
INSERT INTO `relationship_records` (`person_id`, `category`, `type`, `type_name`, `direction`, `amount`, `gift_name`, `gift_image`, `remark`, `record_date`) VALUES
(3, 'money', 'red_packet_out', '红包支出', 'expense', 500.00, NULL, NULL, '春节红包', '2026-01-29'),
(3, 'money', 'receive', '收款', 'income', 200.00, NULL, NULL, '代购物退款', '2026-04-12'),
(3, 'gift', 'treat', '请客', 'neutral', NULL, NULL, NULL, '请全家吃饭', '2026-02-14');

-- 王强的人情往来
INSERT INTO `relationship_records` (`person_id`, `category`, `type`, `type_name`, `direction`, `amount`, `gift_name`, `gift_image`, `remark`, `record_date`) VALUES
(4, 'money', 'lend', '借出', 'expense', 1000.00, NULL, NULL, '临时周转', '2026-05-01'),
(4, 'gift', 'helped', '被帮忙', 'neutral', NULL, NULL, NULL, '帮忙搬家', '2026-04-18');

-- ============================================
-- 人物关系表
-- ============================================
DROP TABLE IF EXISTS `person_relations`;
CREATE TABLE `person_relations` (
  `id` INT UNSIGNED NOT NULL AUTO_INCREMENT COMMENT '主键ID',
  `source_person_id` INT UNSIGNED NOT NULL COMMENT '关系发起人物ID',
  `target_person_id` INT UNSIGNED NOT NULL COMMENT '被关联人物ID',
  `relation_name` VARCHAR(100) NOT NULL COMMENT '关系称呼',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_source_person_id` (`source_person_id`),
  KEY `idx_target_person_id` (`target_person_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='人物关系表';

-- ============================================
-- 人物关系示例数据
-- ============================================
INSERT INTO `person_relations` (`source_person_id`, `target_person_id`, `relation_name`, `remark`) VALUES
(1, 7, '我的朋友', NULL),
(1, 8, '我的爸爸', NULL),
(1, 9, '我的妈妈', NULL),
(7, 10, '小明的爸爸', NULL),
(7, 11, '小明的妈妈', NULL),
(7, 12, '小明的老婆', NULL),
(7, 13, '小明的儿子', NULL),
(7, 14, '小明的弟弟', NULL);
