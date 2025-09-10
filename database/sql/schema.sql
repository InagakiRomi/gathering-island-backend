-- 刪除活動 Table
DROP TABLE `events`;

-- 創建活動資料
CREATE TABLE `events` (
    event_id INT AUTO_INCREMENT PRIMARY KEY,             -- 活動ID（主鍵，自動遞增）
    event_name VARCHAR(32) NOT NULL,                     -- 活動名稱
    event_description VARCHAR(512) NOT NULL,             -- 活動描述 / 詳細資訊
    event_type SMALLINT NOT NULL,                        -- 活動類型代碼（可對應活動類型表）
    event_location VARCHAR(128) NOT NULL,                -- 活動地點
    image_url VARCHAR(512),                              -- 活動圖片的URL
    max_participants INT DEFAULT 2,                      -- 最大參加人數，預設為2人
    event_price INT DEFAULT 0,                           -- 活動費用，預設為0（免費）
    organizer_id INT NOT NULL,                           -- 主辦人ID（對應members.member_id）
    is_ended BOOLEAN DEFAULT 0                           -- 活動是否已結束（0=進行中，1=已結束）
    event_time TIMESTAMP NULL DEFAULT NULL,              -- 活動舉辦時間
    registration_deadline TIMESTAMP NULL DEFAULT NULL,   -- 活動報名截止時間
    created_at TIMESTAMP NULL DEFAULT NULL,              -- 活動建立時間
    updated_at TIMESTAMP NULL DEFAULT NULL,              -- 最後更新資料時間
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
    updated_at TIMESTAMP NULL DEFAULT NULL,             -- 最後更新時間
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