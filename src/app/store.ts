import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import appSliceReducer from './appSlice';
import authSliceReducer from './authSlice';
import bondReducer from './BondSlice';
import accountReducer from './AccountSlice';
import networkReducer from './NetworkSlice';
import swapReducer from './SwapSlice';
import appReducer from './app-reducer';
import authReducer from './auth-reducer';
import pendingTransactionsReducer from './PendingTxnsSlice';

// export const store = configureStore({
//   reducer: {
//     auth: authReducer, app: appReducer 
//   },
// });

export const store = configureStore({
  reducer: {
    app: appSliceReducer ,
    auth: authSliceReducer,
    swap: swapReducer,
    bonding: bondReducer,
    networks: networkReducer,
    account: accountReducer,
    pendingTransactions: pendingTransactionsReducer,
  },
});

export type AppDispatch = typeof store.dispatch;
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
