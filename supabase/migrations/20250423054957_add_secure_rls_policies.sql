-- Remove old insecure policies

-- contract_coi_files
DROP POLICY IF EXISTS "Users can access executed contracts" ON public.contract_coi_files;
DROP POLICY IF EXISTS "Users can insert COI files" ON public.contract_coi_files;
DROP POLICY IF EXISTS "Users can view COI files" ON public.contract_coi_files;

-- contract_audit_trail (Add policy names if audit trail had insecure ones)
-- Example: DROP POLICY IF EXISTS "Some old audit policy" ON public.contract_audit_trail;


-- === RLS Policies for contract_coi_files ===

-- First, enable RLS on the table if not already enabled
ALTER TABLE public.contract_coi_files ENABLE ROW LEVEL SECURITY;
-- Ensure RLS is forced for table owner (recommended)
ALTER TABLE public.contract_coi_files FORCE ROW LEVEL SECURITY;

-- 1. Allow users to SELECT files belonging to their organization
CREATE POLICY "Allow organization members to SELECT files" 
ON public.contract_coi_files
FOR SELECT
USING (organization_id = (auth.jwt() ->> 'org_id')); -- Match org ID from JWT

-- 2. Allow users to INSERT files for their organization
CREATE POLICY "Allow users to INSERT their own files within their org" 
ON public.contract_coi_files
FOR INSERT
WITH CHECK (
  organization_id = (auth.jwt() ->> 'org_id') AND
  uploaded_by = auth.uid() -- Ensure uploader is the current user
);

-- 3. Allow users to UPDATE files they uploaded within their org
CREATE POLICY "Allow users to UPDATE their own files within their org" 
ON public.contract_coi_files
FOR UPDATE
USING (
  organization_id = (auth.jwt() ->> 'org_id') AND
  uploaded_by = auth.uid()
)
WITH CHECK (
  organization_id = (auth.jwt() ->> 'org_id') AND 
  uploaded_by = auth.uid()
  -- Add other checks? e.g., prevent changing organization_id or uploaded_by?
  -- AND organization_id = (auth.jwt() ->> 'org_id') -- Redundant if in USING but explicit
  -- AND uploaded_by = auth.uid()
);


-- 4. Allow users to DELETE files they uploaded within their org
CREATE POLICY "Allow users to DELETE their own files within their org" 
ON public.contract_coi_files
FOR DELETE
USING (
  organization_id = (auth.jwt() ->> 'org_id') AND
  uploaded_by = auth.uid()
);


-- === RLS Policies for contract_audit_trail ===

-- First, enable RLS on the table if not already enabled
ALTER TABLE public.contract_audit_trail ENABLE ROW LEVEL SECURITY;
-- Ensure RLS is forced for table owner (recommended)
ALTER TABLE public.contract_audit_trail FORCE ROW LEVEL SECURITY;

-- 1. Allow users to SELECT audit entries belonging to their organization
CREATE POLICY "Allow organization members to SELECT audit entries" 
ON public.contract_audit_trail
FOR SELECT
USING (organization_id = (auth.jwt() ->> 'org_id')); -- Match org ID from JWT

-- 2. Allow authenticated users within the org to INSERT audit entries
-- The check ensures the inserted data matches the current user/org context
CREATE POLICY "Allow users to INSERT audit entries for their actions within their org" 
ON public.contract_audit_trail
FOR INSERT
WITH CHECK (
  organization_id = (auth.jwt() ->> 'org_id') AND
  performed_by = auth.uid() -- Ensure performer is the current user
);

-- 3. DENY ALL UPDATES (Audit trail should be immutable)
CREATE POLICY "Disallow updates to audit trail" 
ON public.contract_audit_trail
FOR UPDATE
USING (false); -- Condition is always false

-- 4. DENY ALL DELETES (Audit trail should be immutable)
CREATE POLICY "Disallow deletes from audit trail" 
ON public.contract_audit_trail
FOR DELETE
USING (false); -- Condition is always false
