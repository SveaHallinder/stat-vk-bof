import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "@/lib/apiClient";

export const InviteAcceptPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [step, setStep] = useState<'verify' | 'register'>('verify');
  const [email, setEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !verificationCode) {
      setError("E-post och verifieringskod krävs");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api(`/invites/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, verification_code: verificationCode })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Kunde inte verifiera e-postadress');
      }

      // E-post verifierad, gå till nästa steg
      setStep('register');
      setError(null);
    } catch (error) {
      console.error('Verification error:', error);
      setError(error instanceof Error ? error.message : "Kunde inte verifiera e-postadress");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      setError("Lösenorden matchar inte");
      return;
    }

    if (password.length < 8) {
      setError("Lösenordet måste vara minst 8 tecken långt");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await api(`/invites/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password, name })
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Kunde inte acceptera inbjudan');
      }

      // Registrering lyckades
      navigate("/login", { 
        state: { 
          message: "Konto skapat framgångsrikt! Du kan nu logga in." 
        } 
      });
    } catch (error) {
      console.error('Registration error:', error);
      setError(error instanceof Error ? error.message : "Kunde inte acceptera inbjudan");
    } finally {
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Verifiera e-postadress</h1>
            <p className="text-gray-600">Ange din e-postadress och verifieringskoden från inbjudan</p>
          </div>

          <form onSubmit={handleVerifyEmail} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                E-postadress
              </label>
              <input
                id="email"
                type="email"
                placeholder="exempel@vallentuna.se"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="verificationCode" className="block text-sm font-medium text-gray-700 mb-2">
                Verifieringskod
              </label>
              <input
                id="verificationCode"
                type="text"
                placeholder="dinverifieringskod"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-center text-lg tracking-widest"
                maxLength={8}
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Ange 8-siffrig koden från din inbjudan
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Verifierar..." : "Verifiera e-postadress"}
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-500">
              Har du problem? Kontakta systemadministratören
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Skapa ditt konto</h1>
          <p className="text-gray-600">E-postadressen {email} är verifierad. Ange dina uppgifter för att slutföra registreringen.</p>
        </div>

        <form onSubmit={handleRegister} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Namn
            </label>
            <input
              id="name"
              type="text"
              placeholder="Ditt namn"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Lösenord
            </label>
            <input
              id="password"
              type="password"
              placeholder="Minst 8 tecken"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              minLength={8}
              required
            />
          </div>

          <div>
            <label htmlFor="confirm" className="block text-sm font-medium text-gray-700 mb-2">
              Bekräfta lösenord
            </label>
            <input
              id="confirm"
              type="password"
              placeholder="Upprepa lösenordet"
              value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Skapar konto..." : "Skapa konto"}
          </button>
        </form>

        <div className="text-center">
          <button
            onClick={() => setStep('verify')}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            ← Tillbaka till verifiering
          </button>
        </div>
      </div>
    </div>
  );
};
