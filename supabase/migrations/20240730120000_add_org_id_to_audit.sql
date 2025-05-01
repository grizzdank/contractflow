-- Add organization_id column to contract_audit_trail
ALTER TABLE public.contract_audit_trail
ADD COLUMN organization_id UUID;

-- Add foreign key constraint referencing the organizations table
-- Assumes an organizations table exists with an id column
ALTER TABLE public.contract_audit_trail
ADD CONSTRAINT fk_audit_organization
FOREIGN KEY (organization_id)
REFERENCES public.organizations (id)
ON DELETE CASCADE; -- Or SET NULL, depending on desired behavior

-- Optional: Add an index for performance
CREATE INDEX idx_audit_organization_id ON public.contract_audit_trail(organization_id);

-- Optional: Backfill existing rows if necessary (User confirmed not needed for test data)

-- Grant usage permissions if needed (Adjust if different roles used)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contract_audit_trail TO authenticated;
GRANT ALL ON public.contract_audit_trail TO service_role; 