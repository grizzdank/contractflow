
export interface Comment {
  id: string;
  userId: string;
  userName: string;
  content: string;
  timestamp: string;
}

export interface Contract {
  id: string;
  contractNumber: string;
  title: string;
  description: string;
  vendor: string;
  amount: number;
  startDate: string;
  endDate: string;
  status: "Requested" | "Draft" | "Review" | "InSignature" | "ExecutedActive" | "ExecutedExpired";
  type: "grant" | "services" | "goods" | "sponsorship" | "amendment" | "vendor_agreement" | "interagency_agreement" | "mou" | "sole_source" | "rfp";
  department: string;
  assignedTo?: {
    name: string;
    email: string;
  };
  accountingCodes: string;
  vendorEmail: string;
  vendorPhone: string;
  vendorAddress: string;
  signatoryName: string;
  signatoryEmail: string;
  attachments: Array<{
    name: string;
    url: string;
  }>;
  comments: Comment[];
}
