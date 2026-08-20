-- Migrate product.productType from PostgreSQL enum to varchar.
-- Run ONCE against the database before deploying the updated backend.
-- Safe to run multiple times (IF NOT EXISTS / IF EXISTS guards).

DO $$
BEGIN
  -- 1. Add a temporary varchar column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'product' AND column_name = 'product_type_new'
  ) THEN
    ALTER TABLE product ADD COLUMN product_type_new varchar(60);
  END IF;

  -- 2. Copy existing enum values as text
  UPDATE product SET product_type_new = product_type::text WHERE product_type_new IS NULL;

  -- 3. Drop old enum column
  ALTER TABLE product DROP COLUMN IF EXISTS product_type;

  -- 4. Rename new column
  ALTER TABLE product RENAME COLUMN product_type_new TO product_type;
END $$;
