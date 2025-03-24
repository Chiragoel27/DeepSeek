import Image from 'next/image';
import React, { Dispatch, SetStateAction, useState } from 'react';
import { assets } from "@/assets/assets";
import { useAppContext } from '../context/AppContext';
import toast from 'react-hot-toast';
import axios from 'axios';

interface PromptBoxProps {
    isLoading: boolean;
    setIsLoading: Dispatch<SetStateAction<boolean>>;
}

const PromptBox: React.FC<PromptBoxProps> = ({ isLoading, setIsLoading }) => {
    const [prompt, setPrompt] = useState<string>('');
    const { user, chats, setChats, selectedChat, setSelectedChat } = useAppContext();

    const sendPrompt = async (e: React.FormEvent<HTMLFormElement>) => {
        const promptCopy = prompt;

        try {
            e.preventDefault();
            if (!user) return toast.error("Login to send message");
            if (isLoading) return toast.error("Wait for previous prompt response");

            setIsLoading(true);
            setPrompt("");

            const userPrompt = {
                role: "user",
                content: prompt,
                timestamp: Date.now(),
            };

            // ✅ Update chats immutably
            setChats((prevChats) =>
                prevChats.map((chat) =>
                    chat._id === selectedChat._id
                        ?
                        {
                            ...chat,
                            messages: [...chat.messages, userPrompt]
                        } : chat
                )
            );

            setSelectedChat((prev: any) => ({
                ...prev,
                messages: [...prev.messages, userPrompt],
            }));

            const { data } = await axios.post('/api/chat/ai', {
                chatId: selectedChat._id,
                prompt,
            });

            if (data.success) {
                // ✅ Update chat with AI response
                setChats((prevChats) =>
                    prevChats.map((chat) =>
                        chat._id === selectedChat._id
                            ? { ...chat, messages: [...chat.messages, data.data] }
                            : chat
                    )
                );

                const message = data.data.content;
                const messageTokens = message.split(" ");
                let assistantMessage = {
                    role: 'assistant',
                    content: "",
                    timestamp: Date.now(),
                };

                // ✅ Set initial AI message before animation
                setSelectedChat((prev: any) => ({
                    ...prev,
                    messages: [...prev.messages, assistantMessage],
                }));

                // ✅ Animate message word-by-word
                for (let i = 0; i < messageTokens.length; i++) {
                    setTimeout(() => {
                        assistantMessage.content = messageTokens.slice(0, i + 1).join(" ")
                        setSelectedChat((prev: any) => {
                            const updatedMessages = [
                                ...prev.messages.slice(0, -1),
                                assistantMessage
                            ]
                            return { ...prev, messages: updatedMessages };
                        });
                    }, i * 100);
                }
            } else {
                console.log(data);
                toast.error(data.message || data.error);
                setPrompt(promptCopy);
            }
        } catch (error: any) {
            console.log(error);
            toast.error(error.message);
            setPrompt(promptCopy);
        } finally {
            setIsLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            sendPrompt(e as any);
        }
    };

    return (
        <form
            onSubmit={sendPrompt}
            className={`w-full ${selectedChat?.messages?.length > 0 ? "max-w-3xl" : "max-w-2xl"} bg-[#404045] p-4 rounded-3xl mt-4 transition-all`}
        >
            <textarea
                className='outline-none w-full resize-none overflow-hidden break-words bg-transparent'
                rows={2}
                placeholder='Message DeepSeek'
                required
                onChange={(e) => setPrompt(e.target.value)}
                value={prompt}
                onKeyDown={handleKeyDown}
            />

            <div className='flex items-center justify-between text-sm'>
                <div className='flex items-center gap-2'>
                    <p className='flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition'>
                        <Image src={assets.deepthink_icon} alt='' className='h-5' />
                        DeepThink (R1)
                    </p>
                    <p className='flex items-center gap-2 text-xs border border-gray-300/40 px-2 py-1 rounded-full cursor-pointer hover:bg-gray-500/20 transition'>
                        <Image src={assets.search_icon} alt='' className='h-5' />
                        Search
                    </p>
                </div>
                <div className='flex items-center gap-2'>
                    <Image src={assets.pin_icon} alt='' className='h-4 cursor-pointer' />
                    <button
                        className={`${prompt ? "bg-primary" : "bg-[#71717a]"} rounded-full p-2 cursor-pointer`}
                        type="submit"
                    >
                        <Image src={prompt ? assets.arrow_icon : assets.arrow_icon_dull} alt='' className='w-3.5 aspect-square' />
                    </button>
                </div>
            </div>
        </form>
    );
};

export default PromptBox;
