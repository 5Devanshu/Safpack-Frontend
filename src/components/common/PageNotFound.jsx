import React from 'react';
import { Home, ArrowLeft, Search, FileText, Users, Settings } from 'lucide-react';

export default function PageNotFound() {
  const handleGoHome = () => {
    // You can replace this with your actual navigation logic
    window.location.href = '/';
  };

  const handleGoBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-32 h-32 bg-blue-200/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute bottom-32 right-16 w-40 h-40 bg-indigo-200/20 rounded-full blur-xl animate-pulse" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-10 w-20 h-20 bg-purple-200/20 rounded-full blur-lg animate-bounce" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-32 right-32 w-24 h-24 bg-cyan-200/20 rounded-full blur-lg animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        
        {/* Floating spreadsheet cells */}
        <div className="absolute top-1/4 left-1/4 w-12 h-8 bg-white/40 border border-blue-200/50 rounded animate-float" style={{ animationDelay: '0.5s' }}></div>
        <div className="absolute top-3/4 right-1/3 w-16 h-10 bg-white/40 border border-indigo-200/50 rounded animate-float" style={{ animationDelay: '1.2s' }}></div>
        <div className="absolute bottom-1/4 left-1/2 w-10 h-6 bg-white/40 border border-purple-200/50 rounded animate-float" style={{ animationDelay: '2.1s' }}></div>
      </div>

      <div className="max-w-4xl mx-auto text-center relative z-10">
        {/* Logo */}
        <div className="flex justify-center mb-8 animate-fade-in">
          <div className="flex items-center space-x-3">
            <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-xl">
              <span className="text-white font-bold text-2xl">S</span>
            </div>
            <span className="text-3xl font-bold text-slate-800">Safpack</span>
          </div>
        </div>

        {/* 404 Animation */}
        <div className="relative mb-12 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
          <div className="text-[12rem] md:text-[16rem] font-bold text-transparent bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text leading-none animate-gradient-x">
            404
          </div>
          
          {/* Floating elements around 404 */}
          <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center pointer-events-none">
            <div className="absolute -top-8 -left-8 w-6 h-6 bg-blue-400 rounded-full animate-ping opacity-30"></div>
            <div className="absolute -top-12 right-16 w-4 h-4 bg-indigo-400 rounded-full animate-ping opacity-40" style={{ animationDelay: '0.5s' }}></div>
            <div className="absolute bottom-8 -left-12 w-8 h-8 bg-purple-400 rounded-full animate-ping opacity-25" style={{ animationDelay: '1s' }}></div>
            <div className="absolute -bottom-4 right-8 w-5 h-5 bg-cyan-400 rounded-full animate-ping opacity-35" style={{ animationDelay: '1.5s' }}></div>
          </div>
        </div>

        {/* Error Message */}
        <div className="mb-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <h1 className="text-4xl md:text-5xl font-bold text-slate-800 mb-4">
            Oops! Page Not Found
          </h1>
          <p className="text-xl text-slate-600 mb-2 max-w-2xl mx-auto leading-relaxed">
            Looks like this spreadsheet cell is empty! The page you're looking for seems to have been moved, deleted, or doesn't exist.
          </p>
          <p className="text-lg text-slate-500">
            Don't worry, we'll help you get back on track.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
          <button
            onClick={handleGoHome}
            className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <Home className="w-5 h-5" />
            <span>Go to Homepage</span>
          </button>
          
          <button
            onClick={handleGoBack}
            className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm text-slate-700 px-8 py-4 rounded-xl font-semibold border border-slate-200 hover:bg-white hover:shadow-lg transform hover:scale-105 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Go Back</span>
          </button>
        </div>

        {/* Quick Links */}
        <div className="animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
          <p className="text-slate-600 mb-8 font-medium">Or explore these popular sections:</p>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
            {[
              { icon: FileText, label: 'Dashboard', href: '/dashboard' },
              { icon: Users, label: 'Team', href: '/team' },
              { icon: Search, label: 'Search', href: '/search' },
              { icon: Settings, label: 'Settings', href: '/settings' }
            ].map((item, index) => (
              <a
                key={index}
                href={item.href}
                className="group p-6 bg-white/60 backdrop-blur-sm rounded-xl border border-slate-200/50 hover:bg-white hover:shadow-lg transform hover:-translate-y-1 transition-all duration-200"
                style={{ animationDelay: `${0.9 + index * 0.1}s` }}
              >
                <item.icon className="w-6 h-6 text-slate-600 group-hover:text-blue-600 mx-auto mb-2 transition-colors" />
                <span className="text-sm font-medium text-slate-700 group-hover:text-slate-800">{item.label}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-16 animate-fade-in-up" style={{ animationDelay: '1.2s' }}>
          <p className="text-slate-500 text-sm">
            Still need help? Contact our support team at{' '}
            <a href="mailto:support@sheetflow.com" className="text-blue-600 hover:text-blue-700 font-medium transition-colors">
              support@sheetflow.com
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(2deg);
          }
        }
        
        @keyframes gradient-x {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out both;
        }
        
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        
        .animate-gradient-x {
          background-size: 200% 200%;
          animation: gradient-x 3s ease infinite;
        }
      `}</style>
    </div>
  );
}