import React from 'react';
import { Button } from '@/components/ui/button';
import { Compass } from 'lucide-react';
import { Link } from 'react-router-dom';

export const NotFound: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#f5f7fa] flex items-center justify-center p-6">
      <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center">
        <div className="mx-auto w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Compass className="w-7 h-7 text-gray-600" />
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2">Sidan hittades inte</h1>
        <p className="text-gray-600 mb-6">
          Adressen du försökte nå finns inte. Den kan ha tagits bort eller länken kan vara felaktig.
        </p>
        <div className="flex gap-3 justify-center">
          <Button asChild>
            <Link to="/dashboard">Till startsidan</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
