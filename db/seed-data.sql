-- Sample seed data for Power Monitoring application
-- Use this file to populate your database with initial test data

-- Clear existing data to avoid conflicts
DELETE FROM "phasa_R";
DELETE FROM "phasa_S";
DELETE FROM "phasa_T";
DELETE FROM "chart_data";

-- Reset the sequences
ALTER SEQUENCE "phasa_R_No_seq" RESTART WITH 1;
ALTER SEQUENCE "phasa_S_No_seq" RESTART WITH 1;
ALTER SEQUENCE "phasa_T_No_seq" RESTART WITH 1;
ALTER SEQUENCE "chart_data_id_seq" RESTART WITH 1;

-- Seed Phase R data
INSERT INTO "phasa_R" ("voltage", "current", "power", "energy", "frequency", "pf", "time") VALUES
(208.7, 79.461, 16137.9, 183.331, 50, 0.97, '2025-04-11 17:05:35'),
(213.5, 60.771, 12621.3, 183.414, 50, 0.97, '2025-04-11 17:05:55'),
(213.9, 56.228, 11701.3, 183.447, 50, 0.97, '2025-04-11 17:06:05'),
(208.4, 63.586, 13066.5, 183.695, 50, 0.99, '2025-04-11 17:07:15'),
(209.1, 61.99, 12768.1, 183.73, 50, 0.99, '2025-04-11 17:07:25'),
(209.7, 61.899, 12791.2, 183.766, 50, 0.99, '2025-04-11 17:07:35');

-- Seed Phase S data
INSERT INTO "phasa_S" ("voltage", "current", "power", "energy", "frequency", "pf", "time") VALUES
(225.5, 26.423, 5264.9, 212.912, 50, 0.88, '2025-04-11 21:16:10'),
(226.1, 24.631, 4846.3, 212.926, 50, 0.87, '2025-04-11 21:16:20'),
(226, 24.019, 4718.6, 212.939, 50, 0.87, '2025-04-11 21:16:30'),
(226, 24.018, 4714.5, 212.952, 50, 0.87, '2025-04-11 21:16:40'),
(226, 24.037, 4716.7, 212.966, 50, 0.87, '2025-04-11 21:16:50'),
(226.1, 23.975, 4712.1, 212.979, 50, 0.87, '2025-04-11 21:17:00'),
(225.9, 23.925, 4720.2, 212.992, 50, 0.87, '2025-04-11 21:17:10'),
(225.9, 23.966, 4722.6, 213.005, 50, 0.87, '2025-04-11 21:17:20'),
(225.7, 24.035, 4723.3, 213.018, 50, 0.87, '2025-04-11 21:17:30');

-- Seed Phase T data
INSERT INTO "phasa_T" ("voltage", "current", "power", "energy", "frequency", "pf", "time") VALUES
(212.8, 62.515, 12784.5, 184.733, 50, 0.96, '2025-04-11 17:11:45'),
(210.3, 59.999, 12353.5, 184.766, 50, 0.98, '2025-04-11 17:11:55'),
(211, 56.715, 11746.8, 184.799, 50, 0.98, '2025-04-11 17:12:05'),
(212, 52.038, 10838.8, 184.829, 50, 0.98, '2025-04-11 17:12:15'),
(213, 50.24, 10513.1, 184.859, 50, 0.98, '2025-04-11 17:12:25'),
(213, 50.516, 10555.1, 184.889, 50, 0.98, '2025-04-11 17:12:35'),
(209.9, 59.345, 12292.2, 184.92, 50, 0.99, '2025-04-11 17:12:45'),
(210.1, 72.282, 15035.7, 246.366, 50, 0.99, '2025-04-11 17:13:30');

-- Seed chart data for each phase and data type (simplified version)
-- In a real scenario, you would have more data points for the charts

-- Voltage chart data
INSERT INTO "chart_data" ("phase", "data_type", "time", "value") VALUES
('R', 'voltage', '17:05', 208.7),
('R', 'voltage', '17:06', 213.5),
('R', 'voltage', '17:07', 209.7),
('S', 'voltage', '21:16', 225.5),
('S', 'voltage', '21:17', 226.1),
('S', 'voltage', '21:18', 225.7),
('T', 'voltage', '17:11', 212.8),
('T', 'voltage', '17:12', 211.0),
('T', 'voltage', '17:13', 210.1);

-- Current chart data
INSERT INTO "chart_data" ("phase", "data_type", "time", "value") VALUES
('R', 'current', '17:05', 79.461),
('R', 'current', '17:06', 60.771),
('R', 'current', '17:07', 61.899),
('S', 'current', '21:16', 26.423),
('S', 'current', '21:17', 24.631),
('S', 'current', '21:18', 24.035),
('T', 'current', '17:11', 62.515),
('T', 'current', '17:12', 56.715),
('T', 'current', '17:13', 72.282);

-- Power chart data
INSERT INTO "chart_data" ("phase", "data_type", "time", "value") VALUES
('R', 'power', '17:05', 16137.9),
('R', 'power', '17:06', 12621.3),
('R', 'power', '17:07', 12791.2),
('S', 'power', '21:16', 5264.9),
('S', 'power', '21:17', 4846.3),
('S', 'power', '21:18', 4723.3),
('T', 'power', '17:11', 12784.5),
('T', 'power', '17:12', 11746.8),
('T', 'power', '17:13', 15035.7);

-- Frequency chart data
INSERT INTO "chart_data" ("phase", "data_type", "time", "value") VALUES
('R', 'frequency', '17:05', 50),
('R', 'frequency', '17:06', 50),
('R', 'frequency', '17:07', 50),
('S', 'frequency', '21:16', 50),
('S', 'frequency', '21:17', 50),
('S', 'frequency', '21:18', 50),
('T', 'frequency', '17:11', 50),
('T', 'frequency', '17:12', 50),
('T', 'frequency', '17:13', 50);

-- Power factor chart data
INSERT INTO "chart_data" ("phase", "data_type", "time", "value") VALUES
('R', 'pf', '17:05', 0.97),
('R', 'pf', '17:06', 0.97),
('R', 'pf', '17:07', 0.99),
('S', 'pf', '21:16', 0.88),
('S', 'pf', '21:17', 0.87),
('S', 'pf', '21:18', 0.87),
('T', 'pf', '17:11', 0.96),
('T', 'pf', '17:12', 0.98),
('T', 'pf', '17:13', 0.99);