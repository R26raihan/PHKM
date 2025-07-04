-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: localhost:3306
-- Generation Time: Mar 16, 2025 at 01:07 PM
-- Server version: 5.7.39
-- PHP Version: 8.3.11

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `algoplay_db`
--

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `password`, `created_at`) VALUES
(1, 'Andya Raihan Setiawan', 'raihansetiawan203@gmail.com', '$2y$10$Ff/j3q.v.rdONoKkBgCkle82A4/oP8Sn.bvN3GgEZq5MtC2FcTqWe', '2025-03-13 17:02:55'),
(2, 'salma', 'salama79@gmail.com', '$2y$10$VAuHjy0yNBOcXngn3L5W4OyPB1JgBVP4jAPkuMVApplL007MGRjg6', '2025-03-13 17:23:34'),
(3, 'Andya Raihan Setiawan', 'Raisyah@gmail.com', '$2y$10$zL/rdk.eMpWANAd8ngMOW.FcD4Rqcdb.hY0LWqC1/gmF6wPqc2w/S', '2025-03-14 02:19:06'),
(4, 'ra raihan', 'raihansetiawan@gmail.com', '$2y$10$7H1nclSH1cCkNamNiPpot.RzWrVJ5SeDOnNTgms28stH3YR2MdD0W', '2025-03-15 05:15:52'),
(5, 'ra raihan', 'raihansetiwan203@gmail.com', '$2y$10$z.OgGpX92fPbJ1sV8eOiI.SbDmcFpQpr4iiQ6Nyu9ubYKFGjIKtM2', '2025-03-15 05:25:45');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `email` (`email`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=6;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
