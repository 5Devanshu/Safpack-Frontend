import React, { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { HeroPage, Login, VerifyEmail } from './components';
import { dashboardMenuState, isUserLoggedIn, selectTheme } from './app/DashboardSlice';

import NavBar from './components/protected/Dashboard/NavBar';
import Sidebar from './components/utils/Sidebar';
import Dashboard from './components/protected/Dashboard/Dashboard';
import ViewSheets from './components/protected/Views/Main';
import ViewSheetsNew from './components/protected/Views/Main_New';
// import SheetDisplay from './components/protected/Linkages/SheetDisplay';
import PageNotFound from './components/common/PageNotFound';
import Linkages from './components/protected/Linkages/Main';
import { isDeatailSheetBar } from './app/LinkagesSlice';
import UserControl from './components/protected/UserControl/UserControl';
import LoginAdmin from './components/common/LoginAdmin';
import CreateSheet from './components/protected/SheetCreate/Main';
import GroupsManagement from './components/protected/Groups/Groups';
import ProfessionalDashboard from './components/protected/Dashboard/ProfessionalDashboard';
import ReconciliationPage from './components/protected/Dashboard/ReconciliationPage';

const RoutesConfig = () => {
  const isLoggedIn = useSelector(isUserLoggedIn);
  const ifDMenuState = useSelector(dashboardMenuState);
  const theme = useSelector(selectTheme);
  const isDetailSheet = useSelector(isDeatailSheetBar);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  if (!isLoggedIn) {
    return (
      <Routes>
        <Route
          path="/"
          key={'home'}
          className="transition-all scrollbar-hide"
          element={[<HeroPage key={'HeroPage'} />]}
        />
        <Route
          path="/login"
          className="transition-all scrollbar-hide"
          element={[<Login />]}
        />
        <Route
          path="/admin-login"
          className="transition-all scrollbar-hide"
          element={[<LoginAdmin />]}
        />
        <Route
          path="/verify-email"
          className="transition-all scrollbar-hide"
          element={[<VerifyEmail />]}
        />
        <Route path="*" element={<PageNotFound />} />
      </Routes>
    );
  } else {
    return (
      <div
        className={`w-full h-[100vh] bg-[var(--bg-primary)] flex flex-col overflow-y-auto scrollbar-hide relative`}
      >
        {/*<Sidebar isOpen={ifDMenuState} />*/}
        <NavBar />
        
        <div className={`${ifDMenuState && 'pl-[0rem]'}`}>
          <Routes>
            <Route path="/" element={<ViewSheets />} />
            <Route path="/YW5hbHl0aWNhbC1kYXNoYm9hcmQ=" element={<ProfessionalDashboard />} />
            <Route path="/reconciliation" element={<ReconciliationPage />} />
            <Route path="*" element={<PageNotFound />} />
            {/* <Route path="/dashboard" element={<Dashboard />} /> */}
            
            <Route path="/create-sheet" element={<CreateSheet />} />
            <Route path="/sheets" element={<ViewSheets />} />
            <Route path="/sheets-new" element={<ViewSheetsNew />} />
            <Route path="/linkages" element={<Linkages />} />
            <Route path="/user-control" element={<UserControl />} />
            <Route path="/groups" element={<GroupsManagement />} />
          </Routes>
          {/* <div className="bg-[var(--bg-secondary)] b-2 pr-2 text-sm pb-1 flex justify-end items-center">
            <p className="text-[var(--text-primary)]">
              Designed and Developed with ❤️ by{' '}
              <a
                href="https://hareshkurade.netlify.app"
                className="text-[var(--accent-color)]"
              >
                Haresh
              </a>
            </p>
          </div> */}
        </div>
      </div>
    );
  }
};

export default RoutesConfig;