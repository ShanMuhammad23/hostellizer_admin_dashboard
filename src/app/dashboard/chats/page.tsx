"use client"
import { useState, useEffect } from 'react';
import ChatList from '@/components/ChatList';
import Chat from '@/components/Chat';

export default function ChatsPage() {
  const [selectedChat, setSelectedChat] = useState<{
    id: string;
    studentName: string;
  } | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)]">
      <div className="h-full">
        {isMobile ? (
          // Mobile view: Show either chat list or chat window
          selectedChat ? (
            <Chat
              chatId={selectedChat.id}
              studentName={selectedChat.studentName}
              onBack={() => setSelectedChat(null)}
            />
          ) : (
            <ChatList
              onSelectChat={(chatId, studentName) =>
                setSelectedChat({ id: chatId, studentName })
              }
            />
          )
        ) : (
          // Desktop view: Show both chat list and chat window side by side
          <div className="grid grid-cols-12 h-full">
            <div className="col-span-4 border-r">
              <ChatList
                onSelectChat={(chatId, studentName) =>
                  setSelectedChat({ id: chatId, studentName })
                }
              />
            </div>
            <div className="col-span-8">
              {selectedChat ? (
                <Chat
                  chatId={selectedChat.id}
                  studentName={selectedChat.studentName}
                />
              ) : (
                <div className="flex items-center justify-center h-full bg-gray-50">
                  <p className="text-gray-500">
                    Select a chat to start messaging
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 