import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Check, HelpCircle, Users, Clock, BarChart3, FileText, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  target: string;
  position: 'top' | 'bottom' | 'left' | 'right';
  content: React.ReactNode;
}

interface OnboardingTourProps {
  isVisible?: boolean;
  onClose?: () => void;
  forceShow?: boolean;
}

export const OnboardingTour: React.FC<OnboardingTourProps> = ({ 
  isVisible: externalIsVisible, 
  onClose, 
  forceShow = false 
}) => {
  const { user } = useAuth();
  const [internalIsVisible, setInternalIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTour, setHasSeenTour] = useState(false);
  
  // Använd extern kontroll om den finns, annars intern
  const isVisible = externalIsVisible !== undefined ? externalIsVisible : internalIsVisible;
  const setIsVisible = externalIsVisible !== undefined ? onClose || (() => {}) : setInternalIsVisible;

  useEffect(() => {
    // Om forceShow är true, visa alltid
    if (forceShow && externalIsVisible) {
      return;
    }
    
    // Kontrollera om användaren redan har sett touren
    const tourSeen = localStorage.getItem(`onboarding-tour-${user?.id}`);
    if (!tourSeen && user && !externalIsVisible) {
      // Vänta lite så att sidan laddas klart
      const timer = setTimeout(() => {
        setInternalIsVisible(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, forceShow, externalIsVisible]);

  const steps: OnboardingStep[] = [
    {
      id: 'welcome',
      title: 'Välkommen till systemet!',
      description: 'Låt oss gå igenom hur du använder systemet steg för steg.',
      icon: <HelpCircle className="w-6 h-6" />,
      target: 'welcome-step',
      position: 'top',
      content: (
        <div className="text-center">
          <div className="w-16 h-16 bg-[#17694c] rounded-full flex items-center justify-center mx-auto mb-4">
            <HelpCircle className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-light text-[#333] mb-3">Välkommen till Vallentuna Biståndshandläggare!</h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Detta system hjälper dig att hantera kunder, ärenden och registrera din arbetstid. 
            Låt oss gå igenom de viktigaste funktionerna tillsammans.
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
            <span>Steg 1 av 6</span>
            <div className="w-20 h-1 bg-gray-200 rounded-full">
              <div className="w-4 h-1 bg-[#17694c] rounded-full"></div>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'dashboard-overview',
      title: 'Dashboard - Översikt',
      description: 'Här ser du en snabb översikt över dina aktiviteter och statistik.',
      icon: <BarChart3 className="w-6 h-6" />,
      target: 'dashboard-overview',
      position: 'bottom',
      content: (
        <div>
          <h3 className="text-xl font-medium text-[#333] mb-3">Dashboard</h3>
          <p className="text-gray-600 mb-4">
            Dashboard visar dig viktig information på en gång:
          </p>
          <ul className="text-sm text-gray-600 space-y-2 mb-4">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Antal kunder du arbetar med
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Aktiva ärenden
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Månadens besök
            </li>
          </ul>
          <p className="text-sm text-gray-500">
            Klicka på korten för att navigera till respektive sektion.
          </p>
        </div>
      )
    },
    {
      id: 'quick-actions',
      title: 'Snabbåtgärder',
      description: 'Här kan du snabbt utföra vanliga uppgifter.',
      icon: <ArrowRight className="w-6 h-6" />,
      target: 'quick-actions',
      position: 'top',
      content: (
        <div>
          <h3 className="text-xl font-medium text-[#333] mb-3">Snabbåtgärder</h3>
          <p className="text-gray-600 mb-4">
            Här hittar du de vanligaste funktionerna:
          </p>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 p-3 rounded-lg">
              <strong className="text-[#17694c]">+ Lägg till kund</strong>
              <p className="text-gray-600 text-xs mt-1">Registrera nya kunder i systemet</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <strong className="text-[#17694c]">+ Registrera ärende</strong>
              <p className="text-gray-600 text-xs mt-1">Skapa nya ärenden för kunder</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <strong className="text-[#17694c]">+ Registrera tid</strong>
              <p className="text-gray-600 text-xs mt-1">Logga din arbetstid på ärenden</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <strong className="text-[#17694c]">+ Ta ut statistik</strong>
              <p className="text-gray-600 text-xs mt-1">Generera rapporter och statistik</p>
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'customer-management',
      title: 'Kundhantering',
      description: 'Hantera kunder och deras information.',
      icon: <Users className="w-6 h-6" />,
      target: 'customer-management',
      position: 'left',
      content: (
        <div>
          <h3 className="text-xl font-medium text-[#333] mb-3">Kundhantering</h3>
          <p className="text-gray-600 mb-4">
            I kundsektionen kan du:
          </p>
          <ul className="text-sm text-gray-600 space-y-2 mb-4">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Se alla kunder du arbetar med
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Lägga till nya kunder
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Uppdatera kundinformation
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Se kundens ärenden och historik
            </li>
          </ul>
          <p className="text-sm text-gray-500">
            Klicka på "Kunder totalt" kortet för att komma till kundsektionen.
          </p>
        </div>
      )
    },
    {
      id: 'case-management',
      title: 'Ärendeshantering',
      description: 'Skapa och hantera ärenden för dina kunder.',
      icon: <FileText className="w-6 h-6" />,
      target: 'case-management',
      position: 'right',
      content: (
        <div>
          <h3 className="text-xl font-medium text-[#333] mb-3">Ärendeshantering</h3>
          <p className="text-gray-600 mb-4">
            Ett ärende kopplar ihop en kund med en specifik insats:
          </p>
          <ul className="text-sm text-gray-600 space-y-2 mb-4">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Välj kund från listan
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Välj typ av insats
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Tilldela behandlare
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Aktivera ärendet
            </li>
          </ul>
          <p className="text-sm text-gray-500">
            Klicka på "Aktiva insatser" kortet för att se alla ärenden.
          </p>
        </div>
      )
    },
    {
      id: 'time-tracking',
      title: 'Tidsregistrering',
      description: 'Registrera din arbetstid på ärenden.',
      icon: <Clock className="w-6 h-6" />,
      target: 'time-tracking',
      position: 'top',
      content: (
        <div>
          <h3 className="text-xl font-medium text-[#333] mb-3">Tidsregistrering</h3>
          <p className="text-gray-600 mb-4">
            När du arbetar med ett ärende, registrera din tid:
          </p>
          <ul className="text-sm text-gray-600 space-y-2 mb-4">
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Välj ärende från listan
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Ange datum och antal timmar
            </li>
            <li className="flex items-center gap-2">
              <Check className="w-4 h-4 text-green-500" />
              Spara tiden
            </li>
          </ul>
          <p className="text-sm text-gray-500">
            Detta hjälper till att spåra arbetstid och generera statistik.
          </p>
        </div>
      )
    }
  ];

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      completeTour();
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTour = () => {
    if (externalIsVisible !== undefined && onClose) {
      onClose();
    } else {
      setInternalIsVisible(false);
    }
    setHasSeenTour(true);
    if (user?.id) {
      localStorage.setItem(`onboarding-tour-${user.id}`, 'completed');
    }
  };

  const skipTour = () => {
    completeTour();
  };

  if (!isVisible || (hasSeenTour && !forceShow)) {
    return null;
  }

  const currentStepData = steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="bg-[#17694c] rounded-t-2xl px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {currentStepData.icon}
            <div>
              <h2 className="text-white text-lg font-medium">{currentStepData.title}</h2>
              <p className="text-white text-sm opacity-90">{currentStepData.description}</p>
            </div>
          </div>
          <button
            onClick={skipTour}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {currentStepData.content}
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Steg {currentStep + 1} av {steps.length}</span>
            <div className="w-24 h-2 bg-gray-200 rounded-full">
              <div 
                className="h-2 bg-[#17694c] rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              ></div>
            </div>
          </div>
          
          <div className="flex gap-3">
            {!isFirstStep && (
              <Button
                variant="outline"
                onClick={prevStep}
                className="flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                Föregående
              </Button>
            )}
            
            <Button
              onClick={nextStep}
              className="bg-[#17694c] hover:bg-[#145c41] flex items-center gap-2"
            >
              {isLastStep ? (
                <>
                  <Check className="w-4 h-4" />
                  Avsluta
                </>
              ) : (
                <>
                  Nästa
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
