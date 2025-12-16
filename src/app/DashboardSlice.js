import { createSlice } from '@reduxjs/toolkit';
const localData = JSON.parse(localStorage.getItem('account'));
const Dstate = JSON.parse(localStorage.getItem('dState'));
const theme = localStorage.getItem('theme') || 'light'; // Default to dark theme
const initialState = {
  dashboardMenuState: true,
  dashboardFeature: Dstate ? Dstate : 'Home',
  account: localData ? localData : [],
  isLoggedIn: localData ? localData.isLoggedIn : false,
  profileData: [],
  theme: theme, // Add theme to state
};

const DashboardSlice = createSlice({
  initialState,
  name: 'dashboard',
  reducers: {
    setOpenDMenu: (state, action) => {
      state.dashboardMenuState = action.payload.dashboardMenuState;
    },
    setCloseDMenu: (state, action) => {
      state.dashboardMenuState = action.payload.dashboardMenuState;
    },
    setDFeature: (state, action) => {
      state.dashboardFeature = action.payload.dashboardFeature;
      localStorage.setItem(
        'dState',
        JSON.stringify(action.payload.dashboardFeature),
      );
    },
    setAccount: (state, action) => {
      state.account = action.payload;
      state.isLoggedIn = true;
      const temp = { ...state.account, isLoggedIn: state.isLoggedIn };
      localStorage.setItem('account', JSON.stringify(temp));
    },
    LogOut: (state, action) => {
      localStorage.clear();
      state.account = [];
      state.profileData = [];
      state.isLoggedIn = false;
      state.dashboardMenuState = false;
      state.dashboardFeature = 'dashboard';
      state.theme = 'light'; // Reset to dark theme on logout
      localStorage.setItem('theme', 'light');
    },
    setAccountAfterRegister: (state, action) => {
      state.account = action.payload;
      state.isLoggedIn = false;
      const temp1 = { ...state.account, isLoggedIn: state.isLoggedIn };
      localStorage.setItem('account', JSON.stringify(temp1));
    },
    setTheme: (state, action) => {
      state.theme = action.payload.theme;
      localStorage.setItem('theme', action.payload.theme);
    },
  },
});

export const {
  setOpenDMenu,
  setCloseDMenu,
  setDFeature,
  setAccount,
  setAccountAfterRegister,
  LogOut,
  setTheme,
} = DashboardSlice.actions;

export const dashboardMenuState = (state) => state.dashboard.dashboardMenuState;
export const dashboardFeature = (state) => state.dashboard.dashboardFeature;
export const isUserLoggedIn = (state) => state.dashboard.isLoggedIn;
export const selectAccount = (state) => state.dashboard.account;
export const selectProfileData = (state) => state.dashboard.profileData;
export const selectTheme = (state) => state.dashboard.theme;

export default DashboardSlice.reducer;