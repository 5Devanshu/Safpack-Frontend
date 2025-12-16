import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isDeatailSheetBarOpen: false,
  sheetForDetail: null,
  detailSheetAttributes: null,
  sheetName: null,
};

const LinkagesSlice = createSlice({
  initialState,
  name: 'linkages',
  reducers: {
    detailSheetBarToggle: (state, action) => {
      state.isDeatailSheetBarOpen = action.payload.detailSheetBar;
    },
    setSheetForDetail: (state, action) => {
      state.sheetForDetail = action.payload.sheetForDetail;
    },
    setDetailSheetAttributes: (state, action) => {
      state.detailSheetAttributes = action.payload.attributes;
      state.sheetName = action.payload.label;
      state.isDeatailSheetBarOpen = true;
    },
    clearSheetData: (state, action) => {
      state.detailSheetAttributes = null;
      state.sheetForDetail = null;
      state.sheetName = null;
      state.isDeatailSheetBarOpen = false;
    },
  },
});

export const {
  detailSheetBarToggle,
  setSheetForDetail,
  setDetailSheetAttributes,
  clearSheetData
} = LinkagesSlice.actions;

export const isDeatailSheetBar = (state) => state.linkages.isDeatailSheetBarOpen;
export const sheetForDetail = (state) => state.linkages.sheetForDetail;
export const detailSheetAttributes = (state => state.linkages.detailSheetAttributes);
export const sheetNameForDetail = (state => state.linkages.sheetName);

export default LinkagesSlice.reducer;