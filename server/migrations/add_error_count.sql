-- Add errorCount column to mistake_records table
ALTER TABLE `mistake_records` 
ADD COLUMN `error_count` int NOT NULL DEFAULT 1 COMMENT '错误次数';

-- Update existing records to have error_count = 1
UPDATE `mistake_records` SET `error_count` = 1; 