"use client";
import { useAuth, useUser } from "@clerk/nextjs";
import axios from "axios";
import { createContext, useContext, ReactNode, useState, useEffect } from "react";
import toast from "react-hot-toast";

// Define the type for a chat message
export interface ChatMessage {
    role: "user" | "assistant";
    content: string | null;
    timestamp?: number;
}

// Define the type for a chat
export interface Chat {
    _id: string;
    messages: ChatMessage[];
    name: string;
    updatedAt: string; // Assuming updatedAt is a string; adjust if it's a Date
    // Add additional properties as needed
}

// Define the type for the context value
interface AppContextType {
    user: ReturnType<typeof useUser>["user"];
    chats: Chat[];
    setChats: React.Dispatch<React.SetStateAction<Chat[]>>;
    selectedChat: Chat | null;
    setSelectedChat: React.Dispatch<React.SetStateAction<Chat | null>>;
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

    const [chats, setChats] = useState<Chat[]>([]);
    const [selectedChat, setSelectedChat] = useState<Chat | null>(null);

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
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            }
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
                // Assuming data.data is an array of Chat objects
                setChats(data.data);

                if (data.data.length === 0) {
                    await createNewChat();
                    setSelectedChat(data.data[0] || null);
                    return;
                } else {
                    // Sort chats based on last update time
                    const sortedChats = data.data.sort(
                        (a: Chat, b: Chat) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
                    );
                    setSelectedChat(sortedChats[0]);
                    console.log(sortedChats[0]);
                }
            } else {
                toast.error(data.message);
            }
        } catch (error: unknown) {
            if (error instanceof Error) {
                toast.error(error.message);
            }
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
