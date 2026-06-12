import { useState, useEffect, useCallback } from 'react';
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Chat {
  id: string;
  created_at: string;
  last_message_at: string;
  application_id: string;
  student_name: string;
  student_id: string;
  last_message: string;
}

interface ChatListProps {
  onSelectChat: (chatId: string, studentName: string) => void;
}

const POLL_INTERVAL_MS = 10_000;

export default function ChatList({ onSelectChat }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchChats = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const response = await fetch('/api/chats');
      const data = await response.json();

      if (data.success) {
        setChats(data.chats);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      if (showLoader) {
        toast.error("Failed to load chats");
      }
      console.error('Error fetching chats:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchChats(true);
    const interval = setInterval(() => fetchChats(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchChats]);

  const filteredChats = chats.filter(chat =>
    chat.student_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white">
      <div className="p-2 bg-white border-b shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-full border"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500">
            No chats found
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id, chat.student_name)}
                className="w-full p-4 hover:bg-gray-50 transition-colors duration-200 text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-primary font-semibold text-lg">
                    {chat.student_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="font-medium text-gray-900 truncate">
                        {chat.student_name}
                      </h3>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                        {chat.last_message_at
                          ? new Date(chat.last_message_at).toLocaleDateString([], {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : 'New chat'}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500 truncate">
                      {chat.last_message || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
