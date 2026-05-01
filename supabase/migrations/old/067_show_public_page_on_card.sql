-- Add toggle for showing public page link on loyalty card
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS show_public_page_on_card boolean NOT NULL DEFAULT false;
