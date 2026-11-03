-- Seed only the already provisioned demo customer. Existing edits are preserved.
CREATE TABLE IF NOT EXISTS customer_contacts (
  customer_id TEXT PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  phone TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS customer_delivery (
  customer_id TEXT PRIMARY KEY REFERENCES customers(id) ON DELETE CASCADE,
  data TEXT NOT NULL
);
INSERT OR IGNORE INTO customer_contacts(customer_id, phone)
SELECT id, '+12025550143'
FROM customers
WHERE id = 'delu-customer-demo' AND email = 'cliente.demo@delu.example'
  AND NOT EXISTS (SELECT 1 FROM customer_delivery WHERE customer_id = customers.id);

INSERT OR IGNORE INTO customer_delivery(customer_id, data)
SELECT id, '{"address":"Via Esempio 12","city":"Roma","postcode":"00100","province":"RM","country":"IT"}'
FROM customers
WHERE id = 'delu-customer-demo' AND email = 'cliente.demo@delu.example';
