-- Migration 047: Refactor shop_type categories
-- Remove 'epilation' and 'massage', add 'tatouage'
-- massage → spa (merged), epilation → autre (removed)

UPDATE merchants SET shop_type = 'spa' WHERE shop_type = 'massage';
UPDATE merchants SET shop_type = 'autre' WHERE shop_type = 'epilation';
