import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const TestAuthPage = () => {
  const { user, token, isAuthenticated, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#f5f7fa] p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-light text-[#333] mb-8">🔐 Autentisering Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Användarinfo</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Status:</span>
                <Badge variant={isAuthenticated ? "default" : "destructive"}>
                  {isAuthenticated ? "Inloggad" : "Utloggad"}
                </Badge>
              </div>
              
              {user && (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Namn:</span>
                      <span className="font-medium">{user.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Email:</span>
                      <span className="font-medium">{user.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Roll:</span>
                      <Badge variant="outline">{user.role}</Badge>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Token Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-gray-600">Token:</span>
                <Badge variant={token ? "default" : "secondary"}>
                  {token ? "Aktiv" : "Saknas"}
                </Badge>
              </div>
              
              {token && (
                <div className="bg-gray-100 p-3 rounded text-xs font-mono break-all">
                  {token.substring(0, 50)}...
                </div>
              )}
              
              <Button 
                onClick={logout}
                variant="outline"
                className="w-full"
              >
                Logga ut
              </Button>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Test Routes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Testa att navigera till olika sidor för att verifiera att autentiseringen fungerar:
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <a href="/dashboard" className="text-[#17694c] hover:underline">Dashboard</a>
              <a href="/kunder" className="text-[#17694c] hover:underline">Kunder</a>
              <a href="/statistik" className="text-[#17694c] hover:underline">Statistik</a>
              <a href="/admin" className="text-[#17694c] hover:underline">Admin</a>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
