CREATE DATABASE IF NOT EXISTS farm_store;
USE farm_store;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS products (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  description TEXT,
  image TEXT,
  price DECIMAL(10, 2) NOT NULL,
  stock INT NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS orders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  customer_name VARCHAR(100) NOT NULL,
  phone VARCHAR(30) NOT NULL,
  address TEXT NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS order_items (
  id INT AUTO_INCREMENT PRIMARY KEY,
  order_id INT NOT NULL,
  product_id INT NULL,
  product_name VARCHAR(150) NOT NULL,
  quantity INT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
);

INSERT INTO products (name, description, image, price, stock)
SELECT * FROM (
  SELECT 'Fresh Tomatoes', 'Juicy red tomatoes harvested daily.', 'https://images.unsplash.com/photo-1546094096-0df4bcaaa337?auto=format&fit=crop&w=900&q=80', 4.99, 40
  UNION ALL
  SELECT 'Organic Carrots', 'Crunchy organic carrots straight from the farm.', 'https://images.unsplash.com/photo-1447175008436-170170753d51?auto=format&fit=crop&w=900&q=80', 3.49, 60
  UNION ALL
  SELECT 'Green Lettuce', 'Fresh lettuce perfect for healthy salads.', 'https://images.unsplash.com/photo-1622205313162-be1d5712a43c?auto=format&fit=crop&w=900&q=80', 2.99, 30
  UNION ALL
  SELECT 'Sweet Corn', 'Naturally sweet corn picked at peak ripeness.', 'https://images.unsplash.com/photo-1601593768797-90dfd7c4b49d?auto=format&fit=crop&w=900&q=80', 5.99, 25
) AS seed
WHERE NOT EXISTS (SELECT 1 FROM products LIMIT 1);