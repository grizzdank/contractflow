import React, { useState } from 'react';
import { Profile } from '@/lib/supabase/types'; // Assuming Profile type is correctly exported

interface InviteMemberDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onInvite: (email: string, department: string) => void; // Simplified invite function
  editingMember?: Profile | null; // Optional: if editing existing member details
}

const InviteMemberDialog: React.FC<InviteMemberDialogProps> = ({ isOpen, onClose, onInvite, editingMember }) => {
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('');

  React.useEffect(() => {
    if (editingMember) {
      setEmail(editingMember.email ?? '');
      setDepartment(editingMember.department ?? '');
    } else {
      setEmail('');
      setDepartment('');
    }
  }, [editingMember, isOpen]); // Reset form when opening or editing member changes

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    console.log(`Inviting/Updating member: Email=${email}, Department=${department}`); // Basic log
    onInvite(email, department);
    // Optionally close dialog after invite/update
    // onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className="dialog-backdrop fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-1000"> {/* Basic Tailwind for positioning */}
      <div className="dialog-content bg-white p-5 rounded-lg shadow-lg min-w-[300px]"> {/* Basic Tailwind styling */}
        <h2>{editingMember ? 'Edit Member' : 'Invite New Member'}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">Email:</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={!!editingMember} // Disable email editing for existing members for simplicity
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" // Basic input styling
            />
          </div>
          <div>
            <label htmlFor="department" className="block text-sm font-medium text-gray-700">Department:</label>
            <input
              type="text"
              id="department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              required
               className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm" // Basic input styling
            />
          </div>
          <div className="flex justify-end space-x-2"> {/* Button alignment */}
             <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">Cancel</button>
            <button type="submit" className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">{editingMember ? 'Update Member' : 'Send Invitation'}</button>
          </div>
        </form>
      </div>
      {/* Removed <style jsx> block */}
    </div>
  );
};

export default InviteMemberDialog; 