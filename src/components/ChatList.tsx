import { useState, useEffect, useCallback, useRef } from 'react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { notifyMessageReceived } from '@/lib/chatNotifications';

interface Chat {
  id: string;
  created_at: string;
  last_message_at: string;
  application_id: string;
  student_name: string;
  student_id: string;
  last_message: string;
  last_message_sender_type?: string | null;
  unread_count?: number;
}

interface ChatListProps {
  onSelectChat: (chatId: string, studentName: string) => void;
  activeChatId?: string | null;
}

const POLL_INTERVAL_MS = 10_000;

export default function ChatList({ onSelectChat, activeChatId = null }: ChatListProps) {
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const chatSnapshotRef = useRef<Map<string, string>>(new Map());
  const isInitialFetchRef = useRef(true);

  const fetchChats = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const response = await fetch('/api/chats');
      const data = await response.json();

      if (data.success) {
        const incoming = data.chats as Chat[];

        if (isInitialFetchRef.current) {
          isInitialFetchRef.current = false;
        } else {
          for (const chat of incoming) {
            const previousTimestamp = chatSnapshotRef.current.get(chat.id);
            const hasNewMessage =
              previousTimestamp &&
              chat.last_message_at &&
              chat.last_message_at !== previousTimestamp;

            if (
              hasNewMessage &&
              chat.id !== activeChatId &&
              chat.last_message_sender_type === 'student'
            ) {
              notifyMessageReceived(
                chat.student_name,
                chat.last_message || 'New message',
                chat.id,
                `${chat.id}-${chat.last_message_at}`,
                () => onSelectChat(chat.id, chat.student_name)
              );
            }
          }
        }

        chatSnapshotRef.current = new Map(
          incoming.map((chat) => [chat.id, chat.last_message_at ?? ''])
        );
        setChats(incoming);
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
  }, [activeChatId, onSelectChat]);

  useEffect(() => {
    fetchChats(true);
    const interval = setInterval(() => fetchChats(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchChats]);

  useEffect(() => {
    if (activeChatId) {
      fetchChats(false);
    }
  }, [activeChatId, fetchChats]);

  const totalUnread = chats.reduce(
    (sum, chat) => sum + Number(chat.unread_count ?? 0),
    0
  );

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
        <div className="flex items-center justify-between gap-2 px-1 pb-2">
          <h2 className="text-sm font-semibold text-gray-900">Messages</h2>
          {totalUnread > 0 && (
            <Badge className="rounded-full px-2 py-0.5 text-xs">
              {totalUnread > 99 ? '99+' : totalUnread} unread
            </Badge>
          )}
        </div>
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
            {filteredChats.map((chat) => {
              const unreadCount = Number(chat.unread_count ?? 0);
              const hasUnread = unreadCount > 0;

              return (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id, chat.student_name)}
                className={`w-full p-4 hover:bg-gray-50 transition-colors duration-200 text-left ${
                  hasUnread ? 'bg-blue-50/60' : ''
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center text-primary font-semibold text-lg">
                      {chat.student_name.charAt(0).toUpperCase()}
                    </div>
                    {hasUnread && (
                      <Badge className="absolute -top-1 -right-1 h-5 min-w-5 rounded-full px-1.5 text-[10px] leading-none flex items-center justify-center">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </Badge>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <h3 className={`truncate ${hasUnread ? 'font-semibold text-gray-900' : 'font-medium text-gray-900'}`}>
                        {chat.student_name}
                      </h3>
                      <span className={`text-xs whitespace-nowrap ${hasUnread ? 'font-medium text-primary' : 'text-gray-500'}`}>
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
                    <p className={`text-sm truncate ${hasUnread ? 'font-medium text-gray-800' : 'text-gray-500'}`}>
                      {chat.last_message || 'No messages yet'}
                    </p>
                  </div>
                </div>
              </button>
            );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
