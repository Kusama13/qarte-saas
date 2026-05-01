-- Add WhatsApp URL field to merchants
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS whatsapp_url TEXT;
