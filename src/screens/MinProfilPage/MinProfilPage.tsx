import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getCustomers, getCases } from '../../lib/api';
import { Layout } from '../../components/Layout';
import { LogOut } from 'lucide-react';
import { Customer, CaseWithNames } from '../../types/types';

const MinProfilPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [cases, setCases] = useState<CaseWithNames[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      // Hämta användarens kunder och ärenden
      const [customersRes, casesRes] = await Promise.all([
        getCustomers(),
        getCases()
      ]);
      
      // Filtrera kunder baserat på användarens ärenden
      const userCases = casesRes.filter(c => 
        c.handler1_id === user?.id || c.handler2_id === user?.id
      );
      
      // Hämta kunder för användarens ärenden
      const userCustomerIds = [...new Set(userCases.map(c => c.customer_id))];
      const userCustomers = customersRes.filter(c => userCustomerIds.includes(c.id));
      
      // Filtrera ärenden för den inloggade användaren
      const userCasesFiltered = casesRes.filter(c => 
        c.handler1_id === user?.id || c.handler2_id === user?.id
      );
      
      setCustomers(userCustomers);
      setCases(userCasesFiltered);
    } catch (error) {
      console.error('Fel vid hämtning av data:', error);
    } finally {
      setLoading(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Laddar...</div>
      </div>
    );
  }

  return (
    <Layout title="Min Profil">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profilinformation */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Profilinformation</h2>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Namn</label>
                  <p className="mt-1 text-sm text-gray-900">{user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">E-post</label>
                  <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Roll</label>
                  <p className="mt-1 text-sm text-gray-900 capitalize">
                    {user?.role === 'handler' ? 'Behandlare' : user?.role === 'admin' ? 'Administratör' : user?.role}
                  </p>
                </div>
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    💡 Kontakta systemadministratören om du behöver ändra din profilinformation.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <button
                    onClick={logout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:border-red-300 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Logga ut
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Huvudinnehåll */}
          <div className="lg:col-span-2 space-y-6">
            {/* Mina kunder */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Mina kunder</h2>
              </div>
              <div className="p-6">
                {customers.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kund-ID</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Initialer</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Födelseår</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Åtgärd</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {customers.map((customer) => (
                          <tr key={customer.id} className="hover:bg-gray-50 cursor-pointer">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.id}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{customer.initials}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{customer.birth_year}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                customer.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {customer.active ? 'Aktiv' : 'Inaktiv'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <button 
                                onClick={() => window.location.href = `/kunder/${customer.id}`}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                              >
                                Visa profil →
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Inga kunder tillgängliga</p>
                )}
              </div>
            </div>

            {/* Mina ärenden */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-xl font-semibold text-gray-900">Mina ärenden</h2>
              </div>
              <div className="p-6">
                {cases.length > 0 ? (
                  <div className="space-y-4">
                    {cases.map((caseItem) => (
                      <div key={caseItem.id} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:shadow-sm transition-all cursor-pointer">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <h3 className="text-lg font-medium text-gray-900">{caseItem.customer_name} - {caseItem.effort_name}</h3>
                            <div className="flex gap-4 mt-2 text-sm text-gray-500">
                              <span>Skapad: {new Date(caseItem.created_at).toLocaleDateString('sv-SE')}</span>
                              <span>Kund-ID: {caseItem.customer_id}</span>
                              {caseItem.handler2_id && (
                                <span>Behandlare 2: {caseItem.handler2_name}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              caseItem.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {caseItem.active ? 'Aktivt' : 'Inaktivt'}
                            </span>
                            <button 
                              onClick={() => window.location.href = `/arendelista`}
                              className="text-blue-600 hover:text-blue-800 text-sm font-medium hover:underline"
                            >
                              Hantera ärende →
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">Inga ärenden tillgängliga</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default MinProfilPage;
