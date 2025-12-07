import React from "react";
import { Provider } from "react-redux";
import { store } from "../store";
import { ThemeProvider } from "./ThemeProvider";

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </Provider>
  );
}