import { useEffect } from 'react';
import RoutesConfig from './RoutesConfig';
import { useDispatch, useSelector } from 'react-redux';
import { selectAccount } from './app/DashboardSlice';
import { useNavigate } from 'react-router-dom';

function App() {
  const account = useSelector(selectAccount);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  // useEffect(() => {
  //   const handleBeforeUnload = (e) => {
  //     // Don't do anything - let browser handle refresh naturally
  //     // Only clear on actual tab/window close
  //   };

  //   const handleUnload = () => {
  //     // This fires on actual close, not refresh
  //     localStorage.clear();
  //     sessionStorage.clear();
  //   };

  //   window.addEventListener('beforeunload', handleBeforeUnload);
  //   window.addEventListener('unload', handleUnload);

  //   return () => {
  //     window.removeEventListener('beforeunload', handleBeforeUnload);
  //     window.removeEventListener('unload', handleUnload);
  //   };
  // }, []);
  return <RoutesConfig />;
}

export default App;
