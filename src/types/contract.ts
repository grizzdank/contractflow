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
  type: "service" | "product" | "license" | "nda" | "mou" | "iaa" | "sponsorship" | "employment" | "vendor" | "other";
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
  creatorId?: string;
  creatorEmail?: string;
  createdAt?: string;
}
