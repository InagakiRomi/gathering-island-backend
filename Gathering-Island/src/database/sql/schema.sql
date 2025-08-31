CREATE TABLE `events` (
    event_id INT AUTO_INCREMENT PRIMARY KEY,
    event_name VARCHAR(32) NOT NULL,
    event_description VARCHAR(512) NOT NULL,
    event_type VARCHAR(16)  NOT NULL,
    event_location VARCHAR(128) NOT NULL,
    image_url VARCHAR(512),
    max_participants INT DEFAULT 2,
    event_price INT DEFAULT 0,
    organizer_id INT NOT NULL,
    event_time TIMESTAMP NULL DEFAULT NULL,
    registration_deadline TIMESTAMP NULL DEFAULT NULL,
    created_at TIMESTAMP NULL DEFAULT NULL
);