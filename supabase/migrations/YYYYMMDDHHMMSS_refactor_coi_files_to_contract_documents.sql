-- Phase 1: Refactor Document Upload & Storage
-- Step 1: Add new columns to contract_coi_files

ALTER TABLE public.contract_coi_files
ADD COLUMN document_type TEXT,
ADD COLUMN mime_type TEXT,
ADD COLUMN file_size BIGINT;

-- Step 2: Populate document_type based on existing data
-- Note: This assumes 'organization_id' column exists and helps differentiate COIs from general_attachments when is_executed_contract is FALSE.

-- Handle executed contracts
UPDATE public.contract_coi_files
SET document_type = 'executed_agreement'
WHERE is_executed_contract = TRUE;

-- Handle general attachments (assuming they had organization_id populated by uploadGeneralAttachment)
UPDATE public.contract_coi_files
SET document_type = 'general_attachment'
WHERE is_executed_contract = FALSE AND organization_id IS NOT NULL;

-- Handle COIs (assuming they did NOT have organization_id populated by uploadContractFile)
UPDATE public.contract_coi_files
SET document_type = 'coi'
WHERE is_executed_contract = FALSE AND organization_id IS NULL;

-- Step 3: Add a check for unmigrated rows (optional but recommended)
-- SELECT id, file_name, is_executed_contract, organization_id FROM public.contract_coi_files WHERE document_type IS NULL;
-- If the above query returns rows, the logic for setting document_type needs refinement for those cases.

-- Step 4: Make document_type NOT NULL (only after confirming all rows are populated)
-- This should be run manually after verifying the above SELECT returns no rows, or a default should be set.
-- For now, I will comment it out.
-- ALTER TABLE public.contract_coi_files ALTER COLUMN document_type SET NOT NULL;

-- Step 5: (Future, after code changes and testing) Drop the old is_executed_contract column
-- ALTER TABLE public.contract_coi_files DROP COLUMN is_executed_contract;

-- Step 6: (Future, after code changes and testing) Rename the table
-- Note: Renaming primary key constraints and other indexes might also be needed.
-- The exact name of the primary key constraint needs to be identified first.
-- Example: ALTER INDEX contract_coi_files_pkey RENAME TO contract_documents_pkey;
-- ALTER TABLE public.contract_coi_files RENAME TO contract_documents; 