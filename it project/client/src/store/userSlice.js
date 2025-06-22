import { createSlice } from "@reduxjs/toolkit";

const initialValue = {
  _id: "",
  name: "",
  email: "",
  avatar: "",
  mobile: null,
  refresh_token: "",
  verify_email: false,
  last_login_date: "",
  forgot_password_otp: null,
  forgot_password_expiry: "",
  role: "USER",
};

const userSlice = createSlice({
  name: "user",
  initialState: initialValue,
  reducers: {
    setUserDetails: (state, action) => {
      const data = action.payload || {};
      state._id = data._id || "";
      state.name = data.name || "";
      state.email = data.email || "";
      state.avatar = data.avatar || "";
      state.mobile = data.mobile ?? null;
      state.refresh_token = data.refresh_token || "";
      state.verify_email = data.verify_email || false;
      state.last_login_date = data.last_login_date || "";
      state.forgot_password_otp = data.forgot_password_otp ?? null;
      state.forgot_password_expiry = data.forgot_password_expiry || "";
      state.role = data.role || "USER";
    },
    updateAvatar: (state, action) => {
      state.avatar = action.payload || "";
    },
    logout: (state) => {
      Object.assign(state, initialValue); // Reset state to initial
    },
  },
});

export const { setUserDetails, logout, updateAvatar } = userSlice.actions;

export default userSlice.reducer;
