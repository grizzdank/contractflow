
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ClipboardCheck, File, Send, User } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const ContractRequest = () => {
  const [formData, setFormData] = useState({
    requestTitle: "",
    description: "",
    vendorName: "",
    vendorEmail: "",
    vendorPhone: "",
    sowFile: null as File | null,
  });
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFormData({ ...formData, sowFile: e.target.files[0] });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would typically send the data to your backend
    toast({
      title: "Request Submitted",
      description: "Your contract request has been submitted successfully.",
    });
    // Reset form
    setFormData({
      requestTitle: "",
      description: "",
      vendorName: "",
      vendorEmail: "",
      vendorPhone: "",
      sowFile: null,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 p-6">
      <div className="max-w-3xl mx-auto space-y-8 fade-in">
        <header className="text-center space-y-4">
          <div className="inline-block px-4 py-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full text-sm font-medium">
            New Contract Request
          </div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
            Submit a Contract Request
          </h1>
          <p className="text-gray-600">
            Fill out the form below to submit a new contract request. Please ensure all required information is provided.
          </p>
        </header>

        <Card className="p-6 glass-panel">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4">
              <label className="block">
                <span className="text-gray-700">Request Title</span>
                <Input
                  type="text"
                  required
                  value={formData.requestTitle}
                  onChange={(e) => setFormData({ ...formData, requestTitle: e.target.value })}
                  className="mt-1 block w-full"
                  placeholder="Brief title for your request"
                />
              </label>

              <label className="block">
                <span className="text-gray-700">Description</span>
                <Textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1 block w-full"
                  placeholder="Describe the purpose and details of the contract"
                  rows={4}
                />
              </label>

              <div className="bg-emerald-50 p-4 rounded-lg space-y-4">
                <div className="flex items-center gap-2 text-emerald-700">
                  <User className="h-5 w-5" />
                  <h3 className="font-medium">Vendor Information</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <label className="block">
                    <span className="text-gray-700">Vendor Name</span>
                    <Input
                      type="text"
                      required
                      value={formData.vendorName}
                      onChange={(e) => setFormData({ ...formData, vendorName: e.target.value })}
                      className="mt-1 block w-full"
                    />
                  </label>
                  <label className="block">
                    <span className="text-gray-700">Vendor Email</span>
                    <Input
                      type="email"
                      required
                      value={formData.vendorEmail}
                      onChange={(e) => setFormData({ ...formData, vendorEmail: e.target.value })}
                      className="mt-1 block w-full"
                    />
                  </label>
                  <label className="block md:col-span-2">
                    <span className="text-gray-700">Vendor Phone</span>
                    <Input
                      type="tel"
                      value={formData.vendorPhone}
                      onChange={(e) => setFormData({ ...formData, vendorPhone: e.target.value })}
                      className="mt-1 block w-full"
                    />
                  </label>
                </div>
              </div>

              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                <label className="block cursor-pointer">
                  <input
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx"
                    onChange={handleFileChange}
                  />
                  <div className="space-y-2">
                    <File className="h-8 w-8 mx-auto text-gray-400" />
                    <div className="text-sm text-gray-600">
                      {formData.sowFile ? (
                        <span className="text-emerald-600">{formData.sowFile.name}</span>
                      ) : (
                        <>
                          <span className="text-emerald-600 font-medium">Click to upload</span> or drag
                          and drop
                          <br />
                          SOW document (PDF, DOC, DOCX)
                        </>
                      )}
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <div className="flex justify-end gap-4">
              <Button
                type="submit"
                size="lg"
                className="hover-effect bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
              >
                <Send className="w-4 h-4 mr-2" />
                Submit Request
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

export default ContractRequest;
