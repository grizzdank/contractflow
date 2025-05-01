import React, { useEffect, useState, useMemo } from "react";
import { Clock, User, FileText, Edit, CheckCircle } from "lucide-react";
import { contractService } from "@/lib/dataService"; // <-- Uncomment singleton import
import { useClerkAuth } from "@/contexts/ClerkAuthContext"; // <-- Comment out auth context import
// import { createAuthenticatedSupabaseClient } from "@/lib/supabase/client"; // <-- Comment out client creator import
import { format } from 'date-fns';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area"; // Optional: For long lists

interface AuditTrailEntry {
  id: string;
  action_type: string;
  changes: any;
  performed_by_email: string;
  performed_at: string;
}

interface ContractAuditTrailProps {
  contractId: string;
}

// Helper function to format the audit entry changes into a readable string
const formatAuditChanges = (actionType: string, changes: any): string => {
    if (!changes) return 'No changes recorded.';

    // Simple formatting for common actions
    switch (actionType) {
        case 'contract_created':
            return 'Contract created.'; 
        case 'contract_updated':
            const changeDescriptions: string[] = Object.entries(changes)
                .map(([key, value]) => {
                    // Check for the detailed {old, new} format first
                    if (typeof value === 'object' && value !== null && 'old' in value && 'new' in value) {
                         const oldValue = value.old === null || value.old === undefined || value.old === '' ? 'empty' : `"${value.old}"`;
                         const newValue = value.new === null || value.new === undefined || value.new === '' ? 'empty' : `"${value.new}"`;
                         // Only return a description if the value actually changed
                         if (oldValue !== newValue) {
                            return `${key.replace(/_/g, ' ')} changed from ${oldValue} to ${newValue}`;
                         }
                    } else if (key === 'updated_fields' && Array.isArray(value)) {
                        // Handle the less specific 'updated_fields' array if present and {old, new} isn't
                        // This is less ideal, as we don't know the old/new values
                        return `Fields updated: ${value.join(', ')}`;
                    }
                    // Ignore other potential keys or formats in the changes object for now
                    return null; 
                })
                .filter((desc): desc is string => desc !== null); // Filter out nulls and assert type

            // Return specific change if only one, otherwise summarize or fallback
            if (changeDescriptions.length === 1) {
                return changeDescriptions[0];
            } else if (changeDescriptions.length > 1) {
                return changeDescriptions.join('; ');
            } else {
                // Fallback if no detailed changes were found in the expected format
                return 'Contract details updated.'; 
            }
        case 'executed_document_uploaded':
            return `Executed document uploaded: ${changes.new_file_name || changes.path || 'Unknown file'}`;
        case 'executed_document_replaced':
            return `Executed document replaced. Old: ${changes.old_path || 'N/A'}, New: ${changes.new_file_name || changes.new_path || 'N/A'}`;
        case 'attachment_uploaded':
            return `Attachment uploaded: ${changes.file_name || changes.path || 'Unknown file'}`;
        case 'comment_added':
            return `Comment added: "${changes.comment || ''}"`;
        default:
            return `Action performed: ${actionType.replace(/_/g, ' ')}`;
    }
};

export function ContractAuditTrail({ contractId }: ContractAuditTrailProps) {
  const [auditTrail, setAuditTrail] = useState<AuditTrailEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null); // <-- Add error state
  const { contractServiceInstance, isLoading, error: authError } = useClerkAuth(); // <-- Get service instance and auth loading state

  useEffect(() => {
    if (!isLoading && contractServiceInstance) {
      console.log("[AuditTrail] Service instance available, calling loadAuditTrail.");
      loadAuditTrail();
    } else if (!isLoading && !contractServiceInstance) {
        console.warn("[AuditTrail] Auth loaded but contract service instance is still null.");
        setError("Contract service could not be initialized."); 
        setLoading(false); // Stop local loading indicator
    } else {
       setLoading(true); // Keep local loading indicator active
    } 
  }, [contractId, contractServiceInstance, isLoading]);

  const loadAuditTrail = async () => {
    if (!contractServiceInstance) {
        console.error("[AuditTrail] loadAuditTrail called but service instance is null!");
        setError("Audit trail service is not available.");
        setLoading(false);
        return;
    }
    setError(null); 
    console.log(`[AuditTrail] Loading trail for contract ID: ${contractId} using service instance.`);
    setLoading(true);
    try {
      const { data, error: fetchError } = await contractServiceInstance.getContractAuditTrail(contractId);

      // Detailed Logging
      console.log('[AuditTrail] Raw Fetch result:', { data, error: fetchError }); 
      if (data) {
        console.log(`[AuditTrail] Received ${data.length} audit entries.`);
        if (data.length > 0) console.log("[AuditTrail] First entry details:", data[0]); 
      }
      // End Detailed Logging

      if (fetchError) throw fetchError;
      setAuditTrail(data || []);
    } catch (err: any) {
      console.error('Error loading audit trail:', err);
      setError(err.message || "Failed to load audit trail."); // <-- Set error state
      setAuditTrail([]);
    } finally {
      setLoading(false);
    }
  };

  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'created':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'edited':
        return <Edit className="h-4 w-4 text-yellow-500" />;
      case 'executed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return <div>Loading authentication context...</div>;
  }
  if (authError) {
    return <div className="text-red-500">Authentication Error: {authError.message}</div>;
  }
  if (!contractServiceInstance) {
    return <div className="text-red-500">Could not initialize contract service. Check auth context logs.</div>;
  }

  return (
    <Card>
        <CardHeader className="p-0"> {/* Remove padding if using Accordion trigger directly */} 
            {/* Wrap everything in an Accordion */} 
             <Accordion type="single" collapsible className="w-full" defaultValue={undefined}> {/* Collapsed by default */} 
                 <AccordionItem value="audit-trail" className="border-none"> {/* Remove border if desired */} 
                     <AccordionTrigger className="text-lg font-medium p-4 hover:no-underline"> {/* Add padding back here */} 
                         Audit Trail
                     </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0"> {/* Remove top padding */} 
                         {loading ? (
                            <p>Loading audit trail...</p>
                         ) : error ? (
                            <p className="text-red-500">Error loading audit trail: {error}</p>
                         ) : auditTrail.length === 0 ? (
                            <p className="text-gray-500 italic">(No audit trail entries found)</p>
                         ) : (
                             <ScrollArea className="h-[300px] pr-4"> {/* Optional: Limit height and add scroll */} 
                                <ul className="space-y-3">
                                {auditTrail.map((entry) => {
                                    console.log(`[AuditTrail] Rendering entry ID: ${entry.id}, Action: ${entry.action_type}`);
                                    const formattedDate = entry.performed_at 
                                        ? format(new Date(entry.performed_at), "PPpp") // Format: May 1, 2024, 4:06:46 PM
                                        : 'Date unknown';
                                    const formattedChanges = formatAuditChanges(entry.action_type, entry.changes);
                                    return (
                                        <li key={entry.id} className="text-sm border-b pb-2 last:border-b-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <span className="font-medium text-gray-600">{entry.performed_by_email || 'System'}</span>
                                                <span className="text-xs text-gray-400">{formattedDate}</span>
                                            </div>
                                            <p className="text-gray-700">{formattedChanges}</p>
                                            {/* <pre className="text-xs mt-1 bg-gray-50 p-1 rounded overflow-auto">{JSON.stringify(entry.changes, null, 2)}</pre> */}
                                        </li>
                                    );
                                })}
                                </ul>
                            </ScrollArea>
                         )}
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </CardHeader>
        {/* CardContent might not be needed if everything is in the Accordion */} 
         {/* <CardContent className="p-4"> ... </CardContent> */}
    </Card>
  );
}
