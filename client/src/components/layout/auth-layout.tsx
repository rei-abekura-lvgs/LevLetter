import { ReactNode } from 'react';
import { BearLogo } from '../bear-logo';

interface AuthLayoutProps {
  children: ReactNode;
}

export default function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="inline-block">
              <BearLogo size={80} useTransparent={true} bgColor="bg-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mt-4">LevLetter</h1>
            <p className="text-gray-600 mt-2">感謝の気持ちを伝えよう</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}