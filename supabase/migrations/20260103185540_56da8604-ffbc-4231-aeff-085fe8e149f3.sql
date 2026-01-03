-- Add email column to patients table
ALTER TABLE public.patients 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Add email column to donors table
ALTER TABLE public.donors 
ADD COLUMN IF NOT EXISTS email TEXT;