-- 刪除活動 Table
DROP TABLE `events`;

-- 創建活動資料
CREATE TABLE `events` (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(32) NOT NULL,
    event_description VARCHAR(512) NOT NULL,
    event_type SMALLINT NOT NULL,
    event_location VARCHAR(128) NOT NULL,
    image_url VARCHAR(512),
    max_participants INT DEFAULT 2,
    event_price INT DEFAULT 0,
    organizer_id INT NOT NULL,
    is_ended BOOLEAN DEFAULT 0,
    event_time TIMESTAMP NULL DEFAULT NULL,
    registration_deadline TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL,
    updated_at TIMESTAMP NULL DEFAULT NULL
);

-- 清除所有活動資料
TRUNCATE TABLE `events`;

-- ID 從1開始算
ALTER TABLE `events` AUTO_INCREMENT = 1;

-----------------------------

-- 刪除活動 Table
DROP TABLE `members`;

-- 創建活動資料
CREATE TABLE `members` (
    member_id INT AUTO_INCREMENT PRIMARY KEY,           -- 主鍵
    username VARCHAR(32) NOT NULL UNIQUE,               -- 使用者帳號名稱
    password_hash VARCHAR(256) NOT NULL,                -- 密碼加密後的字串
    email VARCHAR(128) UNIQUE,                          -- 信箱
    phone_number VARCHAR(16),                           -- 電話
    gender ENUM('male', 'female') DEFAULT NULL,         -- 性別
    birthday DATE DEFAULT NULL,                         -- 出生日期
    avatar_url VARCHAR(512) DEFAULT NULL,               -- 大頭照連結
    is_organizer BOOLEAN DEFAULT FALSE,                 -- 是否為主辦者
    created_at TIMESTAMP NULL DEFAULT NULL,             -- 註冊時間
    updated_at TIMESTAMP NULL DEFAULT NULL              -- 最後更新時間
);

-- 清除所有活動資料
TRUNCATE TABLE `members`;

-- ID 從1開始算
ALTER TABLE `members` AUTO_INCREMENT = 1;

---------------------------------

CREATE TABLE `event_participants` (
    event_id INT NOT NULL,
    member_id INT NOT NULL,
    registration_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_attended BOOLEAN DEFAULT FALSE,
    PRIMARY KEY (event_id, member_id),
    FOREIGN KEY (event_id) REFERENCES events(event_id),
    FOREIGN KEY (member_id) REFERENCES members(member_id)
);