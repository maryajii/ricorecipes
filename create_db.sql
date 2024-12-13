-- # Create database script for Rico Recipes

-- # Create the database
-- CREATE DATABASE IF NOT EXISTS rico_recipes;
-- USE rico_recipes;

-- # Create the tables
-- CREATE TABLE IF NOT EXISTS recipes (id INT AUTO_INCREMENT,name VARCHAR(50),price DECIMAL(5, 2) unsigned,PRIMARY KEY(id));

-- # Create the app user
-- CREATE USER IF NOT EXISTS 'rico_recipes_app'@'localhost' IDENTIFIED BY 'qwertyuiop'; 
-- GRANT ALL PRIVILEGES ON bettys_books.* TO ' rico_recipes_app'@'localhost';

-- Create Database
CREATE DATABASE IF NOT EXISTS rico_recipes;
USE rico_recipes;

-- Table structure for table `users`
DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `first_name` varchar(50) NOT NULL,
  `last_name` varchar(50) NOT NULL,
  `username` varchar(50) NOT NULL,
  `email` varchar(100) NOT NULL,
  `hashed_password` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email_UNIQUE` (`email`),
  UNIQUE KEY `username_UNIQUE` (`username`)
) ENGINE=InnoDB AUTO_INCREMENT=25 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;

-- Table structure for table `recipes`
DROP TABLE IF EXISTS `recipes`;
CREATE TABLE `recipes` (
  `id` bigint unsigned NOT NULL AUTO_INCREMENT,
  `user_id` bigint unsigned NOT NULL,
  `name` varchar(255) NOT NULL,
  `ingredients` varchar(500) DEFAULT NULL,
  `instructions` text NOT NULL,
  `description` text NOT NULL,
  `cuisine_type` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  CONSTRAINT `recipes_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
