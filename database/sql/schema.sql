-- 刪除活動 Table
DROP TABLE `events`;

-- 創建活動資料
CREATE TABLE `events` (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(32) NOT NULL,
    event_description VARCHAR(512) NOT NULL,
    event_type SMALLINT  NOT NULL,
    event_location VARCHAR(128) NOT NULL,
    image_url VARCHAR(512),
    max_participants INT DEFAULT 2,
    event_price INT DEFAULT 0,
    organizer_id INT NOT NULL,
    event_time TIMESTAMP NULL DEFAULT NULL,
    registration_deadline TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    is_ended BOOLEAN DEFAULT 0
);

-- 清除所有活動資料
TRUNCATE TABLE `events`;

-- ID 從1開始算
ALTER TABLE `events` AUTO_INCREMENT = 1;