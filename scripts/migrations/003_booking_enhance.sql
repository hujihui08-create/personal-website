BEGIN;

-- 003_booking_enhance: 预约增强迁移
-- 1. 添加 contact_name 列（如果不存在）
-- 2. contact_email 改为可空
-- 3. 添加 cancel_reason 列（如果不存在）
-- 4. 去掉 id 列的 SERIAL 自增（改为手动管理 6 位数字 ID）

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS contact_name VARCHAR(50) NOT NULL DEFAULT '';

ALTER TABLE bookings ALTER COLUMN contact_email DROP NOT NULL;

ALTER TABLE bookings ADD COLUMN IF NOT EXISTS cancel_reason TEXT;

ALTER TABLE bookings ALTER COLUMN contact_phone SET NOT NULL;

ALTER TABLE bookings ALTER COLUMN id DROP DEFAULT;

DROP SEQUENCE IF EXISTS bookings_id_seq;

COMMIT;
