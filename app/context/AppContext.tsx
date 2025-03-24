"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import toast from "react-hot-toast";

// Define the type for the context value
interface AppContextType {
    user: ReturnType<typeof useUser>["user"];
    chats: any[]; // Ideally, replace `any[]` with a Chat type
    setChats: React.Dispatch<React.SetStateAction<any[]>>;
    selectedChat: any | null; // Ideally, replace `any` with a Chat type
    setSelectedChat: React.Dispatch<React.SetStateAction<any | null>>;
    createNewChat: () => Promise<void>;
    fetchUserChats: () => Promise<void>;
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
    const { getToken } = useAuth();

    const [chats, setChats] = useState<any[]>([]);
    const [selectedChat, setSelectedChat] = useState<any | null>(null);

    const createNewChat = async () => {
        try {
            if (!user) return;

            const token = await getToken();

            await axios.post('/api/chat/create', {}, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            await fetchUserChats(); // Ensure latest chat data is fetched
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    const fetchUserChats = async () => {
        try {
            if (!user) return;

            const token = await getToken();

            const { data } = await axios.get('/api/chat/get', {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            if (data.success) {
                console.log(data.data);
                setChats(data.data);

                if (data.data?.length === 0) {
                    await createNewChat();
                    setSelectedChat(data.data);
                    return;
                } else {
                    // Sort chats based on last update time
                    const sortedChats = data.data.sort(
                        (a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                    );
                    setSelectedChat(sortedChats[0]);
                    console.log(sortedChats[0]);
                }
            } else {
                toast.error(data.message);
            }
        } catch (error: any) {
            toast.error(error.message);
        }
    };

    useEffect(() => {
        if (user) fetchUserChats();
    }, [user]);

    const value: AppContextType = { 
        user,
        chats,
        setChats,
        selectedChat,
        setSelectedChat,
        createNewChat,
        fetchUserChats
    };

    return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};
