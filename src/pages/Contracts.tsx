
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ClipboardList, Calendar, FileText, CheckCircle } from "lucide-react";

const Contracts = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8 fade-in">
        <header className="text-center space-y-4">
          <div className="inline-block px-4 py-1 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-full text-sm font-medium">
            Contract Tracker
          </div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-emerald-700 to-orange-600 bg-clip-text text-transparent">
            Active Contracts
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Monitor and manage your ongoing contracts in one place.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Card className="p-6 hover-effect glass-panel border-0 shadow-lg bg-white/50">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r from-emerald-500 to-green-500 text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm">Active</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Website Development Agreement</h3>
                <p className="text-sm text-gray-600 mt-1">TechCorp Solutions</p>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                Expires: Dec 31, 2024
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-effect glass-panel border-0 shadow-lg bg-white/50">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r from-green-500 to-teal-500 text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm">Active</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Marketing Services</h3>
                <p className="text-sm text-gray-600 mt-1">Digital Marketing Pro</p>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                Expires: Mar 15, 2025
              </div>
            </div>
          </Card>

          <Card className="p-6 hover-effect glass-panel border-0 shadow-lg bg-white/50">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-r from-teal-500 to-orange-400 text-white">
                  <FileText className="h-6 w-6" />
                </div>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-700 text-sm">Active</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Cloud Services Agreement</h3>
                <p className="text-sm text-gray-600 mt-1">CloudHost Solutions</p>
              </div>
              <div className="flex items-center text-sm text-gray-500">
                <Calendar className="h-4 w-4 mr-2" />
                Expires: Jun 30, 2025
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Contracts;
