-- Add billing_period_start to track Stripe billing cycle for SMS quota
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS billing_period_start timestamptz;

-- Backfill from Stripe subscription data (April 2026)
UPDATE merchants SET billing_period_start = v.start_date
FROM (VALUES
  ('fb09bcf0-5e90-42e1-bfeb-6cfa556af96e'::uuid, '2026-03-26 09:25:00+00'::timestamptz),
  ('990d89b1-7969-4174-8c6f-ec2a6a6f81c1'::uuid, '2026-03-23 08:25:00+00'::timestamptz),
  ('b306a5d9-6ad6-45dd-88a9-f9080ea549cd'::uuid, '2026-03-21 10:11:00+00'::timestamptz),
  ('f46d639d-bfe2-440b-b25e-c6e1909f3496'::uuid, '2026-03-20 20:09:00+00'::timestamptz),
  ('1806dbe4-237b-4bc1-a82f-fb2766e34382'::uuid, '2026-03-18 22:31:00+00'::timestamptz),
  ('bea10dbb-2e0a-4d89-952e-991fe7b26c8e'::uuid, '2026-03-18 11:47:00+00'::timestamptz),
  ('8c49209b-1052-4043-adde-e7ea7c20c073'::uuid, '2026-03-18 07:47:00+00'::timestamptz),
  ('907ead2a-e3a9-4189-bc68-c889309bf1f2'::uuid, '2026-03-17 11:57:00+00'::timestamptz),
  ('0db5c969-0195-4cf6-b657-d6640ceb40f4'::uuid, '2026-03-13 18:23:00+00'::timestamptz),
  ('a13d333f-f703-4fbc-acd9-38e19c148373'::uuid, '2026-03-11 19:44:00+00'::timestamptz),
  ('4e765b64-5f17-4f01-a7cd-7e39e2e55ed5'::uuid, '2026-03-11 13:21:00+00'::timestamptz),
  ('22e109cf-3f00-4c4d-ba03-c42d295065f1'::uuid, '2026-03-07 21:52:00+00'::timestamptz),
  ('00a785b2-de50-452b-8b63-7e650e198597'::uuid, '2026-03-05 15:10:00+00'::timestamptz),
  ('9a311f5e-4861-4f21-8434-5ecca686a9d3'::uuid, '2026-02-28 10:53:00+00'::timestamptz),
  ('99e02ab8-d800-406f-a877-99ea004a7615'::uuid, '2026-02-27 21:41:00+00'::timestamptz),
  ('ca66ab38-8eb4-43ab-9f30-37f44d484b85'::uuid, '2026-02-25 09:37:00+00'::timestamptz),
  ('f744c2c8-50c6-4306-ad65-c0a47039f750'::uuid, '2026-02-24 23:12:00+00'::timestamptz),
  ('db50a968-7c0f-43a1-afeb-03d6567c4e7d'::uuid, '2026-02-23 21:52:00+00'::timestamptz),
  ('08e88501-805b-4cdd-8ea6-0873d33a6fa7'::uuid, '2026-02-22 20:11:00+00'::timestamptz),
  ('d899ffd8-b168-4fab-934f-e3fd9b124aff'::uuid, '2026-02-22 19:11:00+00'::timestamptz),
  ('2826be94-930b-41de-acc1-e140420c89b1'::uuid, '2026-02-21 13:55:00+00'::timestamptz),
  ('2d3f2adc-e254-4c14-9b86-4ec0a2126e62'::uuid, '2026-03-04 18:26:00+00'::timestamptz),
  ('660c596c-1835-440f-9030-de5d4a05bc14'::uuid, '2026-03-04 17:32:00+00'::timestamptz),
  ('3efc5c33-cca4-45d1-b57d-1f003826ac5a'::uuid, '2026-03-27 17:09:00+00'::timestamptz)
) AS v(merchant_id, start_date)
WHERE merchants.id = v.merchant_id;
