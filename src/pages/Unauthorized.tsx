import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useUser } from '@/contexts/AuthContext';

export default function Unauthorized() {
  const navigate = useNavigate();
  const user = useUser();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-green-50 via-white to-orange-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-8 text-center">
        <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
        
        <div className="text-gray-600 mb-6">
          <p className="mb-4">
            You don't have permission to access this page. This area requires a higher permission level.
          </p>
          
          {user && (
            <p className="text-sm bg-gray-100 p-3 rounded">
              You are signed in as <span className="font-semibold">{user.email}</span> with role <span className="font-semibold">{user.role}</span>.
            </p>
          )}
        </div>
        
        <div className="flex flex-col space-y-3">
          <Button onClick={() => navigate('/')} variant="default">
            Go to Dashboard
          </Button>
          
          <Button onClick={() => navigate(-1)} variant="outline">
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
} 