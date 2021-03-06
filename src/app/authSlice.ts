import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState = {
  isLogged: false,
  id: "",
  username: "",
  userRole: "client",
  email: "",
  password: "",
  image: "",
  token: "",
  cellPhone: "",
  officePhone: "",
  address: "",
  birthday: "",

  }
export interface AuthData {
  isLogged: boolean;
  id: string;
  userRole: string;
  username: string;
  email: string;
  password: string;
  image: string;
  token: string;
  cellPhone: string;
  officePhone: string;
  address: string;
  birthday: string;
}

export const authSlice = createSlice({
    name: 'auth',
    initialState:initialState,
    // The `reducers` field lets us define reducers and generate associated actions
    reducers: {
      setuserstate: (state, { payload }: PayloadAction<AuthData>) =>{
        state.isLogged =payload.isLogged;
        state.id = payload.id;
        state.username = payload.username;
        state.userRole = payload.userRole;
        state.image = payload.image;
        state.email = payload.email;
        state.password = payload.password;
        state.token = payload.token;
        state.cellPhone = payload.cellPhone;
        state.officePhone = payload.officePhone;
        state.address = payload.address;
        state.birthday = payload.birthday;
      },
      
      //   toggleSideBar: (state) => {
      //   // Redux Toolkit allows us to write "mutating" logic in reducers. It
      //   // doesn't actually mutate the state because it uses the Immer library,
      //   // which detects changes to a "draft state" and produces a brand new
      //   // immutable state based off those changes
      //   state.isCollapsed = !state.isCollapsed;
      // },
    },
    // The `extraReducers` field lets the slice handle actions defined elsewhere,
    // including actions generated by createAsyncThunk or in other slices.
    extraReducers: (builder) => {
    //   builder
    //     .addCase(incrementAsync.pending, (state) => {
    //       state.status = 'loading';
    //     })
    //     .addCase(incrementAsync.fulfilled, (state, action) => {
    //       state.status = 'idle';
    //       state.value += action.payload;
    //     });
    },
  });

  export const { setuserstate } = authSlice.actions;
  export default authSlice.reducer;