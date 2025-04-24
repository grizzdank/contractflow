-- Add organization_id to contract_coi_files
ALTER TABLE public.contract_coi_files
ADD COLUMN organization_id text;

-- Add foreign key constraint for organization_id in contract_coi_files
-- Assuming organizations table exists and has uuid primary key 'id'
ALTER TABLE public.contract_coi_files
ADD CONSTRAINT fk_organization
FOREIGN KEY (organization_id)
REFERENCES public.organizations(id);

-- Add foreign key constraint for uploaded_by in contract_coi_files
-- Assuming auth.users table exists and has uuid primary key 'id'
ALTER TABLE public.contract_coi_files
ADD CONSTRAINT fk_uploaded_by
FOREIGN KEY (uploaded_by)
REFERENCES auth.users(id);

-- Backfill NULL values using the correct UUIDs/Text IDs
UPDATE public.contract_coi_files
SET
  uploaded_by = COALESCE(uploaded_by, '89167df0-47db-4b17-a234-709d1c26ce01'), -- Fallback User UUID
  organization_id = COALESCE(organization_id, 'org_2w4JpEJlvxk7N1i02puW0892UWM')  -- Fallback Org Text ID
WHERE uploaded_by IS NULL OR organization_id IS NULL;

-- Make uploaded_by NOT NULL (assuming all future uploads require a user)
-- Consider backfilling existing NULL values if necessary before applying
-- UPDATE public.contract_coi_files SET uploaded_by = <some_default_user_id> WHERE uploaded_by IS NULL;
ALTER TABLE public.contract_coi_files
ALTER COLUMN uploaded_by SET NOT NULL;

-- Make organization_id NOT NULL (assuming all files belong to an org)
-- Consider backfilling existing NULL values if necessary before applying
-- UPDATE public.contract_coi_files SET organization_id = <some_default_org_id> WHERE organization_id IS NULL;
ALTER TABLE public.contract_coi_files
ALTER COLUMN organization_id SET NOT NULL;


-- Add organization_id to contract_audit_trail
ALTER TABLE public.contract_audit_trail
ADD COLUMN organization_id text;

-- Backfill/Overwrite performed_by with the correct User UUID string
-- Important: Overwrites any existing text data in performed_by
UPDATE public.contract_audit_trail
SET performed_by = '89167df0-47db-4b17-a234-709d1c26ce01';

-- Change performed_by column type in contract_audit_trail from text to uuid
-- Drop existing data or handle conversion carefully if needed
-- This will likely FAIL if there is existing non-UUID data in performed_by
ALTER TABLE public.contract_audit_trail
ALTER COLUMN performed_by TYPE uuid USING performed_by::uuid;

-- Add foreign key constraint for performed_by in contract_audit_trail
ALTER TABLE public.contract_audit_trail
ADD CONSTRAINT fk_performed_by
FOREIGN KEY (performed_by)
REFERENCES auth.users(id);

-- Backfill organization_id where NULL
UPDATE public.contract_audit_trail
SET organization_id = COALESCE(organization_id, 'org_2w4JpEJlvxk7N1i02puW0892UWM') -- Fallback Org Text ID
WHERE organization_id IS NULL;

-- Add foreign key constraint for organization_id in contract_audit_trail
ALTER TABLE public.contract_audit_trail
ADD CONSTRAINT fk_organization
FOREIGN KEY (organization_id)
REFERENCES public.organizations(id);

-- Make performed_by NOT NULL
-- Consider backfilling existing NULL values if necessary before applying
-- UPDATE public.contract_audit_trail SET performed_by = <some_default_user_id> WHERE performed_by IS NULL;
ALTER TABLE public.contract_audit_trail
ALTER COLUMN performed_by SET NOT NULL;

-- Make organization_id NOT NULL in contract_audit_trail
-- Consider backfilling existing NULL values if necessary before applying
-- UPDATE public.contract_audit_trail SET organization_id = <some_default_org_id> WHERE organization_id IS NULL;
ALTER TABLE public.contract_audit_trail
ALTER COLUMN organization_id SET NOT NULL;
