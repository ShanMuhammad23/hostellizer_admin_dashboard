import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from '@/lib/useAuth';
import {
  notifyMessageReceived,
  notifyMessageSent,
} from '@/lib/chatNotifications';

interface Message {
  id: string;
  content: string;
  created_at: string;
  sender_id: string;
  sender_type: 'hostel' | 'student';
  sender_name: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'failed';
}

interface ChatProps {
  chatId: string;
  studentName: string;
  onBack?: () => void;
}

const POLL_INTERVAL_MS = 5_000;

export default function Chat({ chatId, studentName, onBack }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const knownMessageIdsRef = useRef<Set<string>>(new Set());
  const isInitialFetchRef = useRef(true);
  const { user } = useAuth();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchMessages = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      const response = await fetch(`/api/chats?chatId=${chatId}`);
      const data = await response.json();

      if (data.success) {
        const incoming = data.messages as Message[];

        if (isInitialFetchRef.current) {
          isInitialFetchRef.current = false;
        } else {
          for (const message of incoming) {
            if (
              !knownMessageIdsRef.current.has(message.id) &&
              message.sender_type === 'student'
            ) {
              notifyMessageReceived(
                message.sender_name || studentName,
                message.content,
                chatId,
                message.id
              );
            }
          }
        }

        knownMessageIdsRef.current = new Set(incoming.map((message) => message.id));
        setMessages(incoming);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      if (showLoader) {
        toast.error("Failed to load messages");
      }
      console.error('Error fetching messages:', error);
    } finally {
      if (showLoader) setLoading(false);
    }
  }, [chatId, studentName]);

  useEffect(() => {
    isInitialFetchRef.current = true;
    knownMessageIdsRef.current = new Set();
  }, [chatId]);

  useEffect(() => {
    fetchMessages(true);
    const interval = setInterval(() => fetchMessages(false), POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const tempId = Date.now().toString();
    const tempMessage: Message = {
      id: tempId,
      content: newMessage.trim(),
      created_at: new Date().toISOString(),
      sender_id: user?.id || '',
      sender_type: 'hostel',
      sender_name: user?.email || 'Hostel',
      status: 'sending'
    };

    const content = newMessage.trim();
    setMessages(prev => [...prev, tempMessage]);
    setNewMessage('');

    try {
      setSending(true);
      const response = await fetch('/api/chats', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          chatId,
          content,
        }),
      });

      const data = await response.json();

      if (data.success) {
        const updatedMessage = { ...data.message, status: 'sent' as const };
        knownMessageIdsRef.current.add(updatedMessage.id);
        setMessages(prev => prev.map(msg =>
          msg.id === tempId ? updatedMessage : msg
        ));
        notifyMessageSent(studentName, content);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error("Failed to send message");
      console.error('Error sending message:', error);
      setMessages(prev => prev.map(msg =>
        msg.id === tempId ? { ...msg, status: 'failed' } : msg
      ));
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-4rem)] bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] bg-white">
      <div className="flex items-center p-4 bg-white border-b shadow-sm">
        {onBack && (
          <button
            onClick={onBack}
            className="mr-4 p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
        )}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-primary font-semibold">
            {studentName.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{studentName}</h3>
            <p className="text-sm text-gray-500">Active now</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => {
          const isFromHostel = message.sender_type === 'hostel';
          const senderInitial = message.sender_name ? message.sender_name.charAt(0).toUpperCase() : '?';

          return (
            <div
              key={message.id}
              className={`flex ${isFromHostel ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end space-x-2 max-w-[80%] ${isFromHostel ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isFromHostel && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-primary font-semibold text-sm">
                    {senderInitial}
                  </div>
                )}

                <div
                  className={`rounded-2xl px-4 py-2 ${
                    isFromHostel
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                </div>

                {isFromHostel && (
                  <div className="flex items-center space-x-1">
                    {message.status === 'sending' && <Loader2 className="h-3 w-3 animate-spin text-gray-400" />}
                    {message.status === 'sent' && <Check className="h-3 w-3 text-gray-400" />}
                    {message.status === 'delivered' && <CheckCheck className="h-3 w-3 text-gray-400" />}
                    {message.status === 'read' && <CheckCheck className="h-3 w-3 text-primary" />}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="p-4 bg-white border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 rounded-full border"
            disabled={sending}
          />
          <Button
            type="submit"
            disabled={sending || !newMessage.trim()}
            className="rounded-full bg-primary hover:bg-primary px-4"
          >
            {sending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
