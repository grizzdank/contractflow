
import { Button } from "@/components/ui/button";
import { Download, FileText } from "lucide-react";

interface Attachment {
  name: string;
  url: string;
}

interface ContractAttachmentsProps {
  attachments: Attachment[];
}

export function ContractAttachments({ attachments }: ContractAttachmentsProps) {
  return (
    <div>
      <h3 className="text-lg font-medium mb-4">Attachments</h3>
      <div className="space-y-2">
        {attachments.map((attachment) => (
          <div key={attachment.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span>{attachment.name}</span>
            </div>
            <Button variant="ghost" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
