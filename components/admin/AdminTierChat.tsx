"use client";

import { useState, useRef, useEffect } from "react";
import { Tier } from "@prisma/client";
import {
  sendTierMessage,
  getTierMessages,
  deleteMessage,
} from "@/actions/admin-actions";
import { ArrowUp, Trash2 } from "lucide-react";

interface Message {
  id: string;
  content: string;
  createdAt: Date;
  author: {
    id: string;
    name: string | null;
    whopId: string;
  };
}

interface AdminTierChatProps {
  tierId: string;
  tiers: Tier[];
  onMessageSent: () => void;
  adminMemberId: string;
}

// Module-level cache that persists across component mount/unmount
const messagesCache: Record<string, Message[]> = {};

export default function AdminTierChat({
  tierId,
  tiers,
  onMessageSent,
  adminMemberId,
}: AdminTierChatProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState(tierId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fetchingMessages, setFetchingMessages] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentTier = tiers.find((t) => t.id === selectedTierId);

  // Update selected tier when tierId prop changes
  useEffect(() => {
    setSelectedTierId(tierId);
  }, [tierId]);

  // Fetch messages when tier changes (only if not cached)
  useEffect(() => {
    const fetchMessages = async () => {
      // Check if messages are already cached
      if (messagesCache[selectedTierId]) {
        setMessages(messagesCache[selectedTierId]);
        setFetchingMessages(false);
        return;
      }

      // Fetch from server if not cached
      setFetchingMessages(true);
      const result = await getTierMessages(selectedTierId);
      if (result.success) {
        const fetchedMessages = result.messages || [];
        setMessages(fetchedMessages);
        // Cache the messages
        messagesCache[selectedTierId] = fetchedMessages;
      }
      setFetchingMessages(false);
    };
    fetchMessages();
  }, [selectedTierId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);

    // Auto-resize textarea
    const textarea = e.target;
    textarea.style.height = "auto";
    const newHeight = Math.min(textarea.scrollHeight, 128);
    textarea.style.height = `${newHeight}px`;
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const result = await sendTierMessage(
        selectedTierId,
        message,
        adminMemberId
      );
      if (result.success) {
        setMessage("");
        if (inputRef.current) {
          inputRef.current.style.height = "auto";
        }
        const newMessage: Message = {
          id: result.message?.id || "",
          content: result.message?.content || "",
          createdAt: result.message?.createdAt || new Date(),
          author: {
            id: adminMemberId,
            name: "Admin",
            whopId: "admin",
          },
        };
        const updatedMessages = [...messages, newMessage];
        setMessages(updatedMessages);
        // Update cache with new message
        messagesCache[selectedTierId] = updatedMessages;
        if (inputRef.current) {
          inputRef.current.focus();
        }
        onMessageSent();
      } else {
        alert(result.error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm("Are you sure you want to delete this message?")) {
      return;
    }

    try {
      const result = await deleteMessage(messageId);
      if (result.success) {
        // Remove message from state
        const updatedMessages = messages.filter((msg) => msg.id !== messageId);
        setMessages(updatedMessages);
        // Update cache
        messagesCache[selectedTierId] = updatedMessages;
        onMessageSent(); // Trigger any needed refreshes
      } else {
        alert(result.error);
      }
    } catch (error) {
      console.error("Error deleting message:", error);
      alert("Failed to delete message");
    }
  };

  return (
    <div className="flex flex-col h-[600px] bg-gray-a2 border border-gray-a6 overflow-hidden">
      <div className="px-4 py-2 bg-gray-a2 border-b border-gray-a6 text-2 text-gray-11">
        Posting to:{" "}
        <span className="font-semibold tracking-wide">
          {currentTier?.name} Tier
        </span>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {fetchingMessages ? (
          <p className="text-gray-11 text-center text-2">Loading messages...</p>
        ) : messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-gray-a2 rounded-lg p-3 border border-gray-a6 group hover:border-gray-a7 transition-colors"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <p className="text-2 font-semibold">{msg.author.name}</p>
                <div className="flex items-center gap-2">
                  <p className="text-1 text-gray-11">
                    {new Date(msg.createdAt).toLocaleString()}
                  </p>
                  <button
                    onClick={() => handleDeleteMessage(msg.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-a3 rounded transition-all text-red-11 hover:text-red-12 cursor-pointer"
                    title="Delete message"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <p className="text-3 text-gray-12 mt-2 whitespace-pre-wrap break-words">
                {msg.content}
              </p>
            </div>
          ))
        ) : (
          <p className="text-gray-11 text-center text-2">No messages yet</p>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={handleSendMessage}
        className="mt-auto p-4 border-t border-gray-a6"
      >
        <div className="relative flex items-end gap-2 px-4 py-3 rounded-2xl border-2 border-[#484848] bg-transparent focus-within:border-gray-a8 transition-colors">
          <textarea
            ref={inputRef}
            value={message}
            onChange={handleTextareaChange}
            placeholder="Type your message..."
            className="flex-1 bg-transparent placeholder-gray-10 resize-none focus:outline-none text-gray-12 max-h-32 overflow-y-auto"
            rows={1}
            disabled={loading}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="flex-shrink-0 p-2 rounded-lg bg-gray-12 hover:bg-gray-11 text-gray-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-gray-12 transition-all"
          >
            <ArrowUp className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}
