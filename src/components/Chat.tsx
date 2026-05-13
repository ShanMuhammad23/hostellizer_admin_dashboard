import { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Loader2, ArrowLeft, Check, CheckCheck } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";
import { useAuth } from '@/lib/useAuth';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);



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

export default function Chat({ chatId, studentName, onBack }: ChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchMessages();
    
    // Set up real-time database subscription for messages
    const messagesSubscription = supabase
      .channel(`messages:${chatId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('New message from database:', payload);
          const newMessage = payload.new as Message;
          
          // Check if message already exists to avoid duplicates
          setMessages(prev => {
            if (prev.some(msg => msg.id === newMessage.id)) {
              return prev;
            }
            
            // Play sound for received message (only if not from current user)
           
            
            return [...prev, newMessage];
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'messages',
          filter: `chat_id=eq.${chatId}`
        },
        (payload) => {
          console.log('Message updated in database:', payload);
          const updatedMessage = payload.new as Message;
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === updatedMessage.id ? updatedMessage : msg
            )
          );
        }
      )
      .subscribe((status) => {
        console.log('Messages subscription status:', status);
      });

    // Set up typing subscription
    const typingChannel = supabase.channel(`typing:${chatId}`)
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        if (payload.chatId === chatId && payload.senderType === 'student') {
          setIsTyping(true);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setIsTyping(false);
          }, 3000);
        }
      })
      .subscribe((status) => {
        console.log('Typing subscription status:', status);
      });

    // Cleanup function
    return () => {
      console.log('Cleaning up subscriptions');
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(typingChannel);
    };
  }, [chatId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/chats?chatId=${chatId}`);
      const data = await response.json();
      
      if (data.success) {
        setMessages(data.messages);
      } else {
        throw new Error(data.message);
      }
    } catch (error) {
      toast.error("Failed to load messages");
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTyping = () => {
    supabase.channel(`typing:${chatId}`)
      .send({
        type: 'broadcast',
        event: 'typing',
        payload: { chatId, senderType: 'hostel' }
      });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
    }, 3000);
  };

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
          content: newMessage.trim(),
        }),
      });

      const data = await response.json();
      
      if (data.success) {
        // Update the temporary message with the real one from the database
        const updatedMessage = { ...data.message, status: 'sent' };
        setMessages(prev => prev.map(msg => 
          msg.id === tempId ? updatedMessage : msg
        ));
        
        // The real-time subscription will handle broadcasting to other clients
        console.log('Message sent successfully');
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
      {/* Chat Header */}
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
            <p className="text-sm text-gray-500">
              {isTyping ? 'typing...' : 'Active now'}
            </p>
          </div>
        </div>
      </div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.map((message) => {
          // Determine if the message is from the hostel (current user)
          const isFromHostel = message.sender_type === 'hostel';
          const senderInitial = message.sender_name ? message.sender_name.charAt(0).toUpperCase() : '?';
          
          return (
            <div
              key={message.id}
              className={`flex ${isFromHostel ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex items-end space-x-2 max-w-[80%] ${isFromHostel ? 'flex-row-reverse' : 'flex-row'}`}>
                {/* Avatar for student messages */}
                {!isFromHostel && (
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-primary font-semibold text-sm">
                    {senderInitial}
                  </div>
                )}
                
                {/* Message bubble */}
                <div
                  className={`rounded-2xl px-4 py-2 ${
                    isFromHostel
                      ? 'bg-primary text-white rounded-br-none'
                      : 'bg-white text-gray-800 rounded-bl-none shadow-sm'
                  }`}
                >
                  <div className="text-sm">{message.content}</div>
                </div>

                {/* Status indicators for hostel messages */}
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

      {/* Message Input */}
      <form onSubmit={sendMessage} className="p-4 bg-white border-t">
        <div className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
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