import Image from 'next/image'
import React, { Dispatch, SetStateAction } from 'react'
import { assets } from "@/assets/assets";
import { useAppContext } from '../context/AppContext';
import axios from 'axios';
import toast from 'react-hot-toast';

interface ChatLabelProps {
    openMenu: {id: number, open: boolean};
    setOpenMenu: Dispatch<SetStateAction<{id: number, open: boolean}>>;
    id: number;
    name: string;
}

const ChatLabel: React.FC<ChatLabelProps> = ({openMenu, setOpenMenu, id, name}) => {
    const {fetchUserChats, chats, setSelectedChat} = useAppContext();

    const selectChat = () => {
        const chatData = chats.find(chat => chat._id === id);
        setSelectedChat(chatData);
        console.log(chatData);
    }

    const renameChat = async () => {
        try {
            const newName = prompt("Enter new name");
            if(!newName) return;
            const {data} = await axios.post('api/chat/rename', {chatId: id, name: newName});
            if(data.success) {
                fetchUserChats();
                setOpenMenu({id: 0, open: false});
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    const deleteHandler = async () => {
        try {
            const confirm = window.confirm("Are you sure");
            if(!confirm) return;
            const {data} = await axios.post('api/chat/delete', {chatId: id});
            if(data.success) {
                fetchUserChats();
                setOpenMenu({id: 0, open: false});
                toast.success(data.message);
            } else {
                toast.error(data.message);
            }
        } catch (error: any) {
            toast.error(error.message)
        }
    }

    return (
        <div onClick={selectChat} className='flex items-center justify-between p-2 text-white/80 hover:bg-white/10 rounded-lg text-sm group cursor-pointer'>
            <p className='group-hover:max-w-5/6 truncate'>{name}</p>
            <div onClick={e => {e.stopPropagation(); setOpenMenu({id: id, open: !openMenu.open})}} className='group relative flex items-center justify-center h-6 w-6 aspect-square hover:bg-black/80 rounded-lg'>
                <Image onClick={() => setOpenMenu(prev => ({ ...prev, open: !prev.open }))} src={assets.three_dots} alt='' className={`w-4 ${openMenu.id === id && openMenu.open ? "" : "hidden"} group-hover:block`} />
                <div className={`absolute ${openMenu.id === id && openMenu.open ? "block" : "hidden"} -right-36 top-6 bg-gray-700 rounded-xl w-max p-2`}>
                    <div onClick={renameChat} className='flex items-center gap-3 hover:bg-white/10 px-3 py-2'>
                        <Image src={assets.pencil_icon} alt='' className='w-4' />
                        <p>Rename</p>
                    </div>
                    <div onClick={deleteHandler} className='flex items-center gap-3 hover:bg-white/10 px-3 py-2'>
                        <Image src={assets.delete_icon} alt='' className='w-4' />
                        <p>Delete</p>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default ChatLabel
