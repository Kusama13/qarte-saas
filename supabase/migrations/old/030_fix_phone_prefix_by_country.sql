-- Fix merchant phone prefixes based on country column
-- For merchants manually set to BE/CH/LU but still having French 33 prefix

-- BE: 33 -> 32
UPDATE merchants SET phone = '32' || SUBSTRING(phone FROM 3)
WHERE country = 'BE' AND phone LIKE '33%';

-- CH: 33 -> 41
UPDATE merchants SET phone = '41' || SUBSTRING(phone FROM 3)
WHERE country = 'CH' AND phone LIKE '33%';

-- LU: 33 -> 352
UPDATE merchants SET phone = '352' || SUBSTRING(phone FROM 3)
WHERE country = 'LU' AND phone LIKE '33%';
