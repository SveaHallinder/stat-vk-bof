import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  PlusIcon, 
  EditIcon, 
  TrashIcon, 
  ShieldIcon, 
  UserIcon, 
  MailIcon,
  SearchIcon,
  FilterIcon
} from "lucide-react";

export const UserManagement = (): JSX.Element => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("alla");

  const users = [
    {
      id: 1,
      name: "Anna Andersson",
      email: "anna.andersson@vallentuna.se",
      phone: "08-587 850 00",
      role: "Admin",
      department: "IT-avdelningen",
      status: "Aktiv",
      lastLogin: "2025-03-25 14:30",
      created: "2024-01-15",
    },
    {
      id: 2,
      name: "Maria Petersson",
      email: "maria.petersson@vallentuna.se",
      phone: "08-587 851 23",
      role: "Handläggare",
      department: "Biståndsbedömda",
      status: "Aktiv",
      lastLogin: "2025-03-25 13:45",
      created: "2024-02-20",
    },
    {
      id: 3,
      name: "Erik Johansson",
      email: "erik.johansson@vallentuna.se",
      phone: "08-587 851 45",
      role: "Handläggare",
      department: "Biståndsbedömda",
      status: "Aktiv",
      lastLogin: "2025-03-25 12:15",
      created: "2024-03-10",
    },
    {
      id: 4,
      name: "Lars Nilsson",
      email: "lars.nilsson@vallentuna.se",
      phone: "08-587 851 67",
      role: "Supervisor",
      department: "Förebyggande arbete",
      status: "Inaktiv",
      lastLogin: "2025-03-20 16:20",
      created: "2023-11-05",
    },
    {
      id: 5,
      name: "Sara Lindberg",
      email: "sara.lindberg@vallentuna.se",
      phone: "08-587 851 89",
      role: "Handläggare",
      department: "Familj & barn",
      status: "Aktiv",
      lastLogin: "2025-03-25 11:30",
      created: "2024-01-30",
    },
  ];

  const roles = [
    { id: "alla", label: "Alla roller", count: 24 },
    { id: "admin", label: "Admin", count: 3 },
    { id: "supervisor", label: "Supervisor", count: 6 },
    { id: "handlaggare", label: "Handläggare", count: 15 },
  ];

  const filteredUsers = users.filter((user) => {
    const matchesSearch = searchTerm === "" || 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = selectedRole === "alla" ||
      user.role.toLowerCase() === selectedRole;

    return matchesSearch && matchesRole;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case "Admin":
        return "bg-red-100 text-red-800";
      case "Supervisor":
        return "bg-blue-100 text-blue-800";
      case "Handläggare":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    return status === "Aktiv" 
      ? "bg-green-100 text-green-800" 
      : "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6">
      {/* User Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <UserIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#333333]">24</div>
                <div className="text-sm text-[#666666]">Totalt användare</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <UserIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#333333]">21</div>
                <div className="text-sm text-[#666666]">Aktiva användare</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <ShieldIcon className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#333333]">3</div>
                <div className="text-sm text-[#666666]">Administratörer</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <MailIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-[#333333]">5</div>
                <div className="text-sm text-[#666666]">Väntande inbjudningar</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <FilterIcon className="w-5 h-5 text-[#666666]" />
              <span className="text-lg font-semibold text-[#333333]">Användarhantering</span>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="relative">
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-80 pl-4 pr-12 py-2 h-10 rounded-lg border border-gray-300 text-sm placeholder:text-[#888888] focus:border-[#17694c] focus:ring-0"
                  placeholder="Sök användare..."
                />
                <SearchIcon className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-500" />
              </div>
              
              <Button className="bg-[#17694c] hover:bg-[#17694c]/90 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                <PlusIcon className="w-4 h-4" />
                Ny användare
              </Button>
            </div>
          </div>

          <div className="flex gap-3 mb-6">
            {roles.map((role) => (
              <Button
                key={role.id}
                variant={selectedRole === role.id ? "default" : "outline"}
                onClick={() => setSelectedRole(role.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedRole === role.id
                    ? "bg-[#17694c] text-white hover:bg-[#17694c]/90"
                    : "bg-white text-[#666666] border-gray-300 hover:bg-gray-50"
                }`}
              >
                {role.label}
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                  selectedRole === role.id
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 text-[#666666]"
                }`}>
                  {role.count}
                </span>
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card className="bg-white shadow-sm border border-gray-200">
        <CardContent className="p-0">
          {/* Table Header */}
          <div className="grid grid-cols-12 gap-4 p-4 bg-gray-50 border-b border-gray-200 text-sm font-semibold text-[#666666]">
            <div className="col-span-3">Användare</div>
            <div className="col-span-2">Kontakt</div>
            <div className="col-span-2">Roll & Avdelning</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Senaste inloggning</div>
            <div className="col-span-1">Åtgärder</div>
          </div>

          {/* Table Body */}
          <div className="divide-y divide-gray-200">
            {filteredUsers.map((user) => (
              <div key={user.id} className="grid grid-cols-12 gap-4 p-4 hover:bg-gray-50 transition-colors">
                <div className="col-span-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#17694c] text-white rounded-full flex items-center justify-center text-sm font-bold">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <div className="font-semibold text-[#333333]">{user.name}</div>
                      <div className="text-sm text-[#666666]">ID: {user.id}</div>
                    </div>
                  </div>
                </div>
                
                <div className="col-span-2">
                  <div className="text-sm text-[#333333]">{user.email}</div>
                  <div className="text-sm text-[#666666]">{user.phone}</div>
                </div>
                
                <div className="col-span-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(user.role)}`}>
                    {user.role}
                  </span>
                  <div className="text-sm text-[#666666] mt-1">{user.department}</div>
                </div>
                
                <div className="col-span-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(user.status)}`}>
                    {user.status}
                  </span>
                  <div className="text-sm text-[#666666] mt-1">
                    Skapad: {user.created}
                  </div>
                </div>
                
                <div className="col-span-2">
                  <div className="text-sm text-[#333333]">{user.lastLogin}</div>
                </div>
                
                <div className="col-span-1">
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-green-50 hover:text-green-600"
                      title="Redigera användare"
                    >
                      <EditIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                      title="Ta bort användare"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Table Footer */}
          <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-[#666666]">
              Visar {filteredUsers.length} av {users.length} användare
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" disabled>
                Föregående
              </Button>
              <span className="px-3 py-1 bg-[#17694c] text-white rounded text-sm">1</span>
              <Button variant="outline" size="sm" disabled>
                Nästa
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
