import React from 'react';
import { Profile } from '@/lib/supabase/types'; // Assuming Profile type is correctly exported

interface TeamMemberTableProps {
  members: Profile[];
  onEdit: (member: Profile) => void;
  onDelete: (memberId: string) => void;
}

const TeamMemberTable: React.FC<TeamMemberTableProps> = ({ members, onEdit, onDelete }) => {
  console.log('Rendering TeamMemberTable with members:', members); // Basic log

  if (!members || members.length === 0) {
    return <p>No team members found.</p>;
  }

  return (
    <div>
      <h2>Team Members</h2>
      {/* Basic placeholder table structure */}
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Department</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {members.map((member) => (
            <tr key={member.id}>
              <td>{member.full_name ?? 'N/A'}</td>
              <td>{member.email ?? 'N/A'}</td>
              <td>{member.department ?? 'N/A'}</td>
              <td>
                <button onClick={() => onEdit(member)}>Edit</button>
                <button onClick={() => onDelete(member.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TeamMemberTable; 