import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  metadata: null,
};

const MetadataSlice = createSlice({
  initialState,
  name: 'metadata',
  reducers: {
    setMetadata: (state, action) => {
      state.metadata = action.payload.metadata;
    },
  },
});

export const {
  setMetadata,
} = MetadataSlice.actions;

export const getMetadata = (state) => state.metadata.metadata;

export default MetadataSlice.reducer;