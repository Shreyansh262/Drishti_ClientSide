"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
// The import for ThemeProviderProps can remain if you use it in a separate TypeScript file,
// but it's not strictly necessary in this .jsx file once the type annotation is removed.
// import { ThemeProviderProps } from "next-themes" 

export function ThemeProvider({ children, ...props }) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}