-- Add notes field to adjustment_batches table
-- This allows for additional detailed notes about stock adjustments

ALTER TABLE adjustment_batches ADD COLUMN notes TEXT NULL;

-- Add comment to document the field
COMMENT ON COLUMN adjustment_batches.notes IS 'Additional notes or details about the stock adjustment';
