import { configureStore } from '@reduxjs/toolkit';
import DashboardSlice from './DashboardSlice.js';
import LinkagesSlice from './LinkagesSlice.js';
import MetadataSlice from './MetadataSlice.js';

const Store = configureStore({
  reducer: {
    dashboard: DashboardSlice,
    metadata: MetadataSlice,
    linkages: LinkagesSlice,
  },
});

export default Store;
