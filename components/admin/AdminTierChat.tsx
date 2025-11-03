"use client";

import { useState, useRef, useEffect } from "react";
import { Tier } from "@prisma/client";
import { sendTierMessage, getTierMessages } from "@/actions/admin-actions";
import { SendHorizontal, X } from "lucide-react";

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
  onBack: () => void;
  onMessageSent: () => void;
}

export default function AdminTierChat({
  tierId,
  tiers,
  onBack,
  onMessageSent,
}: AdminTierChatProps) {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedTierId, setSelectedTierId] = useState(tierId);
  const [messages, setMessages] = useState<Message[]>([]);
  const [fetchingMessages, setFetchingMessages] = useState(true);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentTier = tiers.find((t) => t.id === selectedTierId);

  // Fetch messages when tier changes
  useEffect(() => {
    const fetchMessages = async () => {
      setFetchingMessages(true);
      const result = await getTierMessages(selectedTierId);
      if (result.success) {
        setMessages(result.messages || []);
      }
      setFetchingMessages(false);
    };
    fetchMessages();
  }, [selectedTierId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const result = await sendTierMessage(selectedTierId, message);
      if (result.success) {
        setMessage("");
        // Add the new message to the display immediately
        const newMessage: Message = {
          id: result.message?.id || "",
          content: result.message?.content || "",
          createdAt: result.message?.createdAt || new Date(),
          author: {
            id: "admin",
            name: "Admin",
            whopId: "admin",
          },
        };
        setMessages((prev) => [...prev, newMessage]);
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

  return (
    <div className="flex flex-col h-[600px] bg-gray-a3 border border-gray-a6 overflow-hidden">
      {/* Header with Back Button and Tabs */}
      <div className="border-b border-gray-a6 bg-gray-a2 p-2 flex items-center justify-start gap-4">
        <button
          onClick={onBack}
          className="text-gray-11 hover:text-gray-12 text-1 flex items-center gap-2 cursor-pointer border rounded-full border-gray-a6 px-3 py-2 w-fit"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Tier Tabs */}
        <div className="flex gap-2 overflow-x-auto">
          {tiers.map((tier) => (
            <button
              key={tier.id}
              onClick={() => setSelectedTierId(tier.id)}
              className={`px-3.5 py-2 rounded-lg text-2 font-medium whitespace-nowrap transition-colors cursor-pointer ${
                selectedTierId === tier.id
                  ? "bg-gray-a3 text-white border border-gray-a6"
                  : "text-gray-11 hover:text-gray-12"
              }`}
            >
              {tier.icon} {tier.name}
            </button>
          ))}
        </div>
      </div>

      {/* Current Tier Info */}
      <div className="px-4 py-2 bg-gray-a2 border-b border-gray-a6 text-2 text-gray-11">
        Posting to:{" "}
        <span className="font-semibold tracking-wide">
          {currentTier?.name} Tier
        </span>
      </div>

      {/* Messages Display */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {fetchingMessages ? (
          <p className="text-gray-11 text-center text-2">Loading messages...</p>
        ) : messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className="bg-gray-a2 rounded-lg p-3 border border-gray-a6"
            >
              <div className="flex items-center gap-2 mb-1">
                <p className="text-2 font-semibold">
                  {msg.author.name || "Admin"}
                </p>
                <p className="text-1 text-gray-11">
                  {new Date(msg.createdAt).toLocaleString()}
                </p>
              </div>
              <p className="text-3 text-gray-12">{msg.content}</p>
            </div>
          ))
        ) : (
          <p className="text-gray-11 text-center text-2">No messages yet</p>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form
        onSubmit={handleSendMessage}
        className="mt-auto p-2.5 px-5 border-t border-gray-a6"
      >
        <textarea
          ref={inputRef}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message..."
          className="w-full px-4 py-3 rounded-xl placeholder-gray-10 resize-none focus:outline-none border-2 border-[#484848]"
          rows={3}
          disabled={loading}
        />
        <div className="flex gap-2 justify-center mt-2.5">
          <button
            type="button"
            onClick={onBack}
            disabled={loading}
            className="p-3 rounded-full bg-gray-a3 hover:bg-gray-a4 text-gray-11 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="p-3 rounded-full bg-gray-a3 hover:bg-gray-a4 text-gray-11 disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            <SendHorizontal className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
