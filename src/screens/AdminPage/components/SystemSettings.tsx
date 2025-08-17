import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { 
  SettingsIcon, 
  DatabaseIcon, 
  ShieldIcon, 
  BellIcon,
  MailIcon,
  ClockIcon,
  SaveIcon,
  RefreshCwIcon
} from "lucide-react";

export const SystemSettings = (): JSX.Element => {
  const settingsCategories = [
    {
      title: "Allmänna inställningar",
      icon: SettingsIcon,
      settings: [
        {
          label: "Systemnamn",
          value: "Vallentuna Biståndssystem",
          type: "text",
          description: "Namnet som visas i systemet"
        },
        {
          label: "Tidzon",
          value: "Europe/Stockholm",
          type: "select",
          options: ["Europe/Stockholm", "UTC"],
          description: "Systemets tidzon"
        },
        {
          label: "Språk",
          value: "Svenska",
          type: "select",
          options: ["Svenska", "English"],
          description: "Standardspråk för systemet"
        },
        {
          label: "Session timeout (minuter)",
          value: "30",
          type: "number",
          description: "Automatisk utloggning efter inaktivitet"
        }
      ]
    },
    {
      title: "Säkerhetsinställningar",
      icon: ShieldIcon,
      settings: [
        {
          label: "Kräv stark lösenord",
          value: true,
          type: "toggle",
          description: "Minst 8 tecken, stora/små bokstäver, siffror och specialtecken"
        },
        {
          label: "Tvåfaktorsautentisering",
          value: false,
          type: "toggle",
          description: "Kräv SMS eller app-verifiering vid inloggning"
        },
        {
          label: "Max inloggningsförsök",
          value: "5",
          type: "number",
          description: "Antal försök innan kontot låses"
        },
        {
          label: "Kontolåsning (minuter)",
          value: "15",
          type: "number",
          description: "Hur länge kontot är låst efter för många försök"
        }
      ]
    },
    {
      title: "E-postinställningar",
      icon: MailIcon,
      settings: [
        {
          label: "SMTP-server",
          value: "smtp.vallentuna.se",
          type: "text",
          description: "E-postserver för utgående meddelanden"
        },
        {
          label: "SMTP-port",
          value: "587",
          type: "number",
          description: "Port för SMTP-anslutning"
        },
        {
          label: "Avsändaradress",
          value: "noreply@vallentuna.se",
          type: "email",
          description: "E-postadress för systemmeddelanden"
        },
        {
          label: "Använd SSL/TLS",
          value: true,
          type: "toggle",
          description: "Säker anslutning till e-postserver"
        }
      ]
    },
    {
      title: "Notifieringsinställningar",
      icon: BellIcon,
      settings: [
        {
          label: "E-postnotifieringar",
          value: true,
          type: "toggle",
          description: "Skicka e-post för viktiga händelser"
        },
        {
          label: "Påminnelser för deadlines",
          value: true,
          type: "toggle",
          description: "Automatiska påminnelser för förfallodatum"
        },
        {
          label: "Daglig sammanfattning",
          value: false,
          type: "toggle",
          description: "Skicka daglig rapport till administratörer"
        },
        {
          label: "Påminnelse före deadline (dagar)",
          value: "3",
          type: "number",
          description: "Antal dagar innan deadline att skicka påminnelse"
        }
      ]
    },
    {
      title: "Databasinställningar",
      icon: DatabaseIcon,
      settings: [
        {
          label: "Automatisk backup",
          value: true,
          type: "toggle",
          description: "Daglig säkerhetskopiering av databasen"
        },
        {
          label: "Backup-tid",
          value: "02:00",
          type: "time",
          description: "Tid för automatisk backup"
        },
        {
          label: "Behåll backups (dagar)",
          value: "30",
          type: "number",
          description: "Antal dagar att behålla säkerhetskopior"
        },
        {
          label: "Dataarkivering (månader)",
          value: "24",
          type: "number",
          description: "Arkivera gamla ärenden efter antal månader"
        }
      ]
    }
  ];

  const renderSettingInput = (setting: any) => {
    switch (setting.type) {
      case "toggle":
        return (
          <div className="flex items-center">
            <button
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                setting.value ? "bg-[#17694c]" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  setting.value ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        );
      case "select":
        return (
          <select
            value={setting.value}
            className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0 text-sm"
          >
            {setting.options?.map((option: string) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );
      case "number":
        return (
          <Input
            type="number"
            value={setting.value}
            className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0 text-sm"
          />
        );
      case "time":
        return (
          <Input
            type="time"
            value={setting.value}
            className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0 text-sm"
          />
        );
      case "email":
        return (
          <Input
            type="email"
            value={setting.value}
            className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0 text-sm"
          />
        );
      default:
        return (
          <Input
            type="text"
            value={setting.value}
            className="w-full p-2 border border-gray-300 rounded-lg focus:border-[#17694c] focus:ring-0 text-sm"
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <DatabaseIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-green-600">Online</div>
                <div className="text-sm text-[#666666]">Systemstatus</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <ClockIcon className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#333333]">99.9%</div>
                <div className="text-sm text-[#666666]">Upptid</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <RefreshCwIcon className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-[#333333]">v2.1.4</div>
                <div className="text-sm text-[#666666]">Systemversion</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white shadow-sm border border-gray-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 rounded-lg">
                <ShieldIcon className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-sm font-semibold text-green-600">Säker</div>
                <div className="text-sm text-[#666666]">Säkerhetsstatus</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Settings Categories */}
      {settingsCategories.map((category, categoryIndex) => {
        const IconComponent = category.icon;
        return (
          <Card key={categoryIndex} className="bg-white shadow-sm border border-gray-200">
            <CardHeader>
              <CardTitle className="text-lg text-[#333333] font-bold flex items-center gap-2">
                <IconComponent className="w-5 h-5 text-[#17694c]" />
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {category.settings.map((setting, settingIndex) => (
                  <div key={settingIndex} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                    <div className="flex-1 mr-6">
                      <div className="font-medium text-[#333333] mb-1">
                        {setting.label}
                      </div>
                      <div className="text-sm text-[#666666]">
                        {setting.description}
                      </div>
                    </div>
                    <div className="w-64">
                      {renderSettingInput(setting)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* Save Button */}
      <div className="flex justify-end gap-4">
        <Button
          variant="outline"
          className="px-6 py-2 rounded-lg border-gray-300 text-[#666666] hover:bg-gray-50"
        >
          Återställ
        </Button>
        <Button className="bg-[#17694c] hover:bg-[#17694c]/90 text-white px-6 py-2 rounded-lg flex items-center gap-2">
          <SaveIcon className="w-4 h-4" />
          Spara inställningar
        </Button>
      </div>
    </div>
  );
};