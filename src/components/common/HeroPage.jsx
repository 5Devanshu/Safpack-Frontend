import React, { useState } from 'react';
import { Play, Users, Layers, Monitor, Cloud, Moon, Sun } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function HeroPage() {
  const navigator = useNavigate();
  const navigate = (path) => {
    console.log(`Navigating to: ${path}`);
    navigator(path);
  };
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      darkMode 
        ? 'bg-gradient-to-br from-slate-900 to-slate-800' 
        : 'bg-gradient-to-br from-slate-50 to-blue-50'
    }`}>
      {/* Header */}
      <header className={`relative z-50 backdrop-blur-md border-b transition-colors duration-300 ${
        darkMode 
          ? 'bg-slate-900/80 border-slate-700/50' 
          : 'bg-white/80 border-slate-200/50'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-2">
              {/* <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">S</span>
              </div> */}
              <img src="/logo.jpg" alt="logo" className='h-8' />
              <span className={`text-xl font-bold transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-slate-800'
              }`}>Safpack</span>
            </div>
            
            <nav className="hidden md:flex space-x-8">
              {/* <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors duration-200">Features</a> */}
              {/* <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors duration-200">Solutions</a>
              <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors duration-200">Pricing</a>
              <a href="#" className="text-slate-600 hover:text-blue-600 transition-colors duration-200">Resources</a> */}
            </nav>
            
            <div className="flex items-center space-x-4">
              
              {/* <button 
                onClick={()=>{ navigate("/login")}} 
                className={`transition-colors duration-200 ${
                  darkMode 
                    ? 'text-slate-300 hover:text-blue-400' 
                    : 'text-slate-600 hover:text-blue-600'
                }`}
              >
                Sign Up Free
              </button> */}
              <button 
                onClick={()=>{ navigate("/login")}} 
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                Sign In
              </button>
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg transition-all duration-200 ${
                  darkMode 
                    ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' 
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
                aria-label="Toggle dark mode"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32 ">
          {/* <div 
            className="absolute z-999 inset-0 bg-[url('/logo.jpg')] bg-contain bg-center bg-no-repeat opacity-10"
            style={{
              backgroundSize: '600px 600px', // Make it smaller
              filter: 'blur(4px)'
            }}
          ></div> */}
          <div className="grid lg:grid-cols-2 gap-12 items-center ">
            <div className="space-y-8 animate-fade-in-up">
              <h1 className={`text-5xl lg:text-6xl font-bold leading-tight transition-colors duration-300 ${
                darkMode ? 'text-white' : 'text-slate-800'
              }`}>
                Simplify
                <br />
                <span className="text-blue-600">Spreadsheets.</span>
                <br />
                Amplify Results.
              </h1>
              
              <p className={`text-xl leading-relaxed max-w-lg transition-colors duration-300 ${
                darkMode ? 'text-slate-300' : 'text-slate-600'
              }`}>
                The intuitive cloud spreadsheet that eliminates complexity while enhancing collaboration and data management.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={()=>{ navigate("/login")}} className="bg-blue-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
                  Start
                </button>
                {/* <button className={`flex items-center space-x-2 px-8 py-4 rounded-lg border font-semibold transition-all duration-200 hover:shadow-md ${
                  darkMode 
                    ? 'text-blue-400 border-blue-500/50 hover:border-blue-400 hover:text-blue-300' 
                    : 'text-blue-600 hover:text-blue-700 border-blue-200 hover:border-blue-300'
                }`}>
                  <Play className="w-5 h-5" />
                  <span>Watch Demo</span>
                </button> */}
              </div>
            </div>
            
            <div className="relative animate-fade-in-right">
              <div className={`relative z-10 rounded-2xl shadow-2xl p-6 transform rotate-3 hover:rotate-0 transition-all duration-500 ${
                darkMode ? 'bg-slate-800' : 'bg-white'
              }`}>
                <div className="flex items-center space-x-2 mb-4">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className={`rounded-lg p-4 mb-4 ${
                  darkMode ? 'bg-slate-700' : 'bg-slate-50'
                }`}>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    <div className={`h-6 rounded ${
                      darkMode ? 'bg-slate-600' : 'bg-slate-200'
                    }`}></div>
                    <div className={`h-6 rounded ${
                      darkMode ? 'bg-slate-600' : 'bg-slate-200'
                    }`}></div>
                    <div className={`h-6 rounded ${
                      darkMode ? 'bg-slate-600' : 'bg-slate-200'
                    }`}></div>
                    <div className={`h-6 rounded ${
                      darkMode ? 'bg-slate-600' : 'bg-slate-200'
                    }`}></div>
                  </div>
                  <div className="space-y-2">
                    <div className={`h-4 rounded w-3/4 ${
                      darkMode ? 'bg-blue-700/60' : 'bg-blue-100'
                    }`}></div>
                    <div className={`h-4 rounded w-1/2 ${
                      darkMode ? 'bg-blue-700/40' : 'bg-blue-100'
                    }`}></div>
                    <div className={`h-4 rounded w-2/3 ${
                      darkMode ? 'bg-blue-700/30' : 'bg-blue-100'
                    }`}></div>
                  </div>
                </div>
                <div className={`rounded-lg p-4 ${
                  darkMode 
                    ? 'bg-gradient-to-r from-slate-800 to-slate-700' 
                    : 'bg-gradient-to-r from-blue-50 to-indigo-50'
                }`}>
                  <div className={`w-full h-32 rounded-lg flex items-end justify-center pb-4 ${
                    darkMode 
                      ? 'bg-gradient-to-r from-slate-700 to-slate-600' 
                      : 'bg-gradient-to-r from-blue-200 to-indigo-300'
                  }`}>
                    <div className="flex items-end space-x-2">
                      <div className={`w-4 h-8 rounded-t ${
                        darkMode ? 'bg-blue-400' : 'bg-blue-500'
                      }`}></div>
                      <div className={`w-4 h-12 rounded-t ${
                        darkMode ? 'bg-blue-500' : 'bg-blue-600'
                      }`}></div>
                      <div className={`w-4 h-16 rounded-t ${
                        darkMode ? 'bg-blue-600' : 'bg-blue-700'
                      }`}></div>
                      <div className={`w-4 h-10 rounded-t ${
                        darkMode ? 'bg-blue-400' : 'bg-blue-500'
                      }`}></div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Floating elements */}
              <div className="absolute -top-4 -right-4 w-20 h-20 bg-yellow-400 rounded-lg transform rotate-12 animate-pulse opacity-80"></div>
              <div className="absolute -bottom-6 -left-6 w-16 h-16 bg-purple-400 rounded-full animate-bounce opacity-60"></div>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className={`absolute top-0 right-0 w-1/2 h-full -z-10 ${
          darkMode 
            ? 'bg-gradient-to-l from-slate-800/50 to-transparent' 
            : 'bg-gradient-to-l from-blue-100/50 to-transparent'
        }`}></div>
      </section>

      {/* Features Section */}
      <section className={`py-20 transition-colors duration-300 ${
        darkMode ? 'bg-slate-800' : 'bg-white'
      }`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className={`text-4xl font-bold mb-4 transition-colors duration-300 ${
              darkMode ? 'text-white' : 'text-slate-800'
            }`}>
              Powerful Features, Simple Experience
            </h2>
            <p className={`text-xl max-w-3xl mx-auto transition-colors duration-300 ${
              darkMode ? 'text-slate-300' : 'text-slate-600'
            }`}>
              Everything you need to manage your data efficiently, without the complexity of traditional spreadsheets.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Users,
                title: "Sheet Assignment",
                description: "Admins can assign specific sheets to users with granular permission controls.",
                color: "bg-blue-100 text-blue-600",
                darkColor: "bg-blue-900/30 text-blue-400"
              },
              {
                icon: Layers,
                title: "Multi-Sheet Access",
                description: "Users can access multiple sheets across different workbooks from a single dashboard.",
                color: "bg-indigo-100 text-indigo-600",
                darkColor: "bg-indigo-900/30 text-indigo-400"
              },
              {
                icon: Monitor,
                title: "Modern UI",
                description: "Clean, intuitive layout with no spreadsheet learning curve. Get started in minutes.",
                color: "bg-purple-100 text-purple-600",
                darkColor: "bg-purple-900/30 text-purple-400"
              },
              {
                icon: Cloud,
                title: "Cloud-Synced",
                description: "Real-time access and editing with automatic saving and version history.",
                color: "bg-cyan-100 text-cyan-600",
                darkColor: "bg-cyan-900/30 text-cyan-400"
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className={`group p-6 rounded-2xl select-none transform hover:-translate-y-2 transition-all duration-300 ${
                  darkMode 
                    ? 'bg-slate-700 hover:bg-slate-600 hover:shadow-xl' 
                    : 'bg-slate-50 hover:bg-white hover:shadow-xl'
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-200 ${
                  darkMode ? feature.darkColor : feature.color
                }`}>
                  <feature.icon className="w-6 h-6" />
                </div>
                <h3 className={`text-xl font-semibold mb-3 transition-colors duration-300 ${
                  darkMode ? 'text-white' : 'text-slate-800'
                }`}>{feature.title}</h3>
                <p className={`leading-relaxed transition-colors duration-300 ${
                  darkMode ? 'text-slate-300' : 'text-slate-600'
                }`}>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {/* <section className="py-20 bg-gradient-to-r from-blue-600 to-indigo-700">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to transform your data experience?
          </h2>
          <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
            Join thousands of teams that have switched to Safpack for a better spreadsheet experience.
          </p>
          
          <button className="bg-white text-blue-600 px-8 py-4 rounded-lg font-semibold text-lg hover:bg-blue-50 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl">
            Start Your Free 14-Day Trial
          </button>
          
          <p className="text-blue-200 text-sm mt-4">
            No credit card required. Cancel anytime.
          </p>
        </div>
      </section> */}

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-1">
              <div className="flex items-center space-x-2 mb-4">
                {/* <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">S</span>
                </div> */}
                <img src="/logo.jpg" alt="logo" className='h-8' />
                <span className="text-xl font-bold">Safpack</span>
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                Modern spreadsheet solution for teams of all sizes.
              </p>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-slate-200">Product</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Features</a></li>
                {/* <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Solutions</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Updates</a></li> */}
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-slate-200">Company</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Legal</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-4 text-slate-200">Resources</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Help Center</a></li>
                {/* <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Documentation</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">Guides</a></li>
                <li><a href="#" className="text-slate-400 hover:text-white transition-colors">API</a></li> */}
              </ul>
            </div>
          </div>
          
          <div className="border-t border-slate-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm">© 2025 Safpack. All rights reserved.</p>
            <div className="flex space-x-6 mt-4 md:mt-0">
              <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Terms</a>
              <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Privacy</a>
              <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">Cookies</a>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
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
        
        @keyframes fade-in-right {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.8s ease-out;
        }
        
        .animate-fade-in-right {
          animation: fade-in-right 0.8s ease-out 0.2s both;
        }
      `}</style>
    </div>
  );
}