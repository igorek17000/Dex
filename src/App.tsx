import React,{lazy,Suspense} from 'react';
import { useEffect, useState, memo } from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Link,
  Redirect
} from "react-router-dom";

// import { Counter } from './features/counter/Counter';
import './App.css';
import { loadSwapMetaData } from "./app/SwapSlice";
import Dex from './pages/Dex';
import { useDispatch, useSelector } from "react-redux";

const App = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    dispatch(loadSwapMetaData());
  }, []);

  return (<Dex />);
};

export default App;
