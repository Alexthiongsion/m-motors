TRUNCATE TABLE vehicles RESTART IDENTITY;

INSERT INTO vehicles (brand, model, price, offer_type, is_available, image_url) VALUES
('Renault', 'Clio', 12000, 'purchase', true, NULL),
('Peugeot', '208', 350, 'rental', true, NULL),
('BMW', 'Série 1', 22000, 'purchase', true, NULL),
('Renault', 'Captur', 420, 'rental', true, NULL),
('Audi', 'A3', 25000, 'purchase', false, NULL),
('Peugeot', '308', 390, 'rental', false, NULL);
