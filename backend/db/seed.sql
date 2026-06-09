TRUNCATE TABLE application_documents, applications, users, vehicles RESTART IDENTITY CASCADE;

INSERT INTO vehicles (brand, model, price, offer_type, is_available, image_url) VALUES
('Renault', 'Clio', 12000, 'purchase', true, NULL),
('Peugeot', '208', 350, 'rental', true, NULL),
('BMW', 'Série 1', 22000, 'purchase', true, NULL),
('Renault', 'Captur', 420, 'rental', true, NULL),
('Audi', 'A3', 25000, 'purchase', false, NULL),
('Peugeot', '308', 390, 'rental', false, NULL);

INSERT INTO users (first_name, last_name, email, password_hash, role) VALUES
('Client', 'Demo', 'client.demo@mmotors.test', '$2b$10$RH7O3aM5H1tLgCeCfIzYyuTV043RumDIta8OgeFHX9e9Jx02qtfhu', 'client'),
('Admin', 'Demo', 'admin.demo@mmotors.test', '$2b$10$57em4ouuUXkp63mrHvdFQe2bSlytR6B51KQxhMOP6AWL8bJg2PoOO', 'admin');
