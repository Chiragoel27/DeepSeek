"use client";
import { useUser } from "@clerk/nextjs";
import { createContext, useContext, ReactNode } from "react";

// Define the type for the context value
interface AppContextType {
    user: ReturnType<typeof useUser>["user"];
}

// Create context with an initial value of `null`
export const AppContext = createContext<AppContextType | null>(null);

// Custom hook to use the context
export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error("useAppContext must be used within an AppContextProvider");
    }
    return context;
};

// Define props for the provider
interface AppContextProviderProps {
    children: ReactNode;
}

export const AppContextProvider = ({ children }: AppContextProviderProps) => {
    const { user } = useUser();

    const value: AppContextType = { user };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
