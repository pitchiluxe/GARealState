"use client";

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSession } from "next-auth/react";
import { Hash, Mic, Volume2, Send, Users, Loader2 } from "lucide-react";
import { formatRelative } from "@/lib/utils/format";

interface Channel { id: string; name: string; description: string; channelType: string; }
interface Message { id: string; content: string; createdAt: string; user: { id: string; name: string; image: string | null }; }

export default function BreakroomPage() {
  const { data: session } = useSession();
  const [activeChannel, setActiveChannel] = useState("general");
  const [message, setMessage] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data: channels } = useQuery({
    queryKey: ["channels"],
    queryFn: async () => {
      const res = await fetch("/api/breakroom/channels");
      const json = await res.json();
      return json.data as Channel[];
    },
  });

  const { data: messages, isLoading: msgLoading } = useQuery({
    queryKey: ["messages", activeChannel],
    queryFn: async () => {
      const res = await fetch(`/api/breakroom/messages?channel=${activeChannel}&limit=50`);
      const json = await res.json();
      return json.data as Message[];
    },
    refetchInterval: 5000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const res = await fetch("/api/breakroom/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, channel: activeChannel }),
      });
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["messages", activeChannel] });
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleSend() {
    const msg = message.trim();
    if (!msg || sendMutation.isPending) return;
    setMessage("");
    sendMutation.mutate(msg);
  }

  const currentChannel = channels?.find(c => c.name === activeChannel);
  const isVoice = currentChannel?.channelType === "VOICE";

  return (
    <div className="h-[calc(100vh-64px)] flex">
      {/* Channel sidebar */}
      <div className="w-56 border-r border-white/8 flex flex-col flex-shrink-0 hidden sm:flex">
        <div className="p-4 border-b border-white/8">
          <h2 className="text-white font-semibold text-sm">Study Group</h2>
          <p className="text-gray-600 text-xs">Collaborate with peers</p>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
          <div className="text-xs font-semibold text-gray-600 uppercase px-2 py-1.5 mt-1">Text Channels</div>
          {channels?.filter(c => c.channelType === "TEXT").map(channel => (
            <button key={channel.id} onClick={() => setActiveChannel(channel.name)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all ${activeChannel === channel.name ? "bg-re-500/15 text-re-400" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}>
              <Hash className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
          <div className="text-xs font-semibold text-gray-600 uppercase px-2 py-1.5 mt-3">Voice Channels</div>
          {channels?.filter(c => c.channelType === "VOICE").map(channel => (
            <button key={channel.id} onClick={() => setActiveChannel(channel.name)} className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-all ${activeChannel === channel.name ? "bg-re-500/15 text-re-400" : "text-gray-500 hover:text-gray-300 hover:bg-white/5"}`}>
              <Volume2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="truncate">{channel.name}</span>
            </button>
          ))}
        </div>
        {/* User */}
        <div className="p-3 border-t border-white/8 flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-re-500/20 flex items-center justify-center text-xs font-bold text-re-400">
            {session?.user?.name?.[0]?.toUpperCase() || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs text-white font-medium truncate">{session?.user?.name || "Student"}</div>
            <div className="text-xs text-green-400">● Online</div>
          </div>
        </div>
      </div>

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Channel header */}
        <div className="px-4 py-3 border-b border-white/8 flex items-center gap-2 flex-shrink-0">
          {isVoice ? <Volume2 className="w-4 h-4 text-gray-400" /> : <Hash className="w-4 h-4 text-gray-400" />}
          <span className="text-white font-semibold">{activeChannel}</span>
          {currentChannel?.description && <span className="text-gray-500 text-sm hidden sm:block">— {currentChannel.description}</span>}
        </div>

        {isVoice ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8">
            <div className="w-16 h-16 bg-re-500/15 rounded-2xl flex items-center justify-center">
              <Mic className="w-8 h-8 text-re-400" />
            </div>
            <div className="text-center">
              <h3 className="text-white font-semibold mb-1">Voice Channel: {activeChannel}</h3>
              <p className="text-gray-500 text-sm">Voice channels require LiveKit integration. Set LIVEKIT_URL in .env.local to enable live voice/video.</p>
            </div>
            <div className="flex gap-3">
              <div className="px-4 py-2 rounded-xl bg-green-500/15 border border-green-500/30 text-green-400 text-sm flex items-center gap-2">
                <Mic className="w-4 h-4" /> Join Voice
              </div>
              <div className="px-4 py-2 rounded-xl bg-white/8 border border-white/15 text-gray-400 text-sm flex items-center gap-2">
                <Users className="w-4 h-4" /> 0 online
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
              {msgLoading ? (
                <div className="flex items-center justify-center h-32"><Loader2 className="w-5 h-5 animate-spin text-gray-500" /></div>
              ) : messages?.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-600">
                  <Hash className="w-8 h-8 mb-2 opacity-40" />
                  <p className="text-sm">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                messages?.map((msg, i) => {
                  const prevMsg = messages[i - 1];
                  const sameAuthor = prevMsg?.user?.id === msg.user.id;
                  const isMe = msg.user.id === session?.user?.id;
                  return (
                    <div key={msg.id} className={`flex gap-3 group ${sameAuthor ? "mt-0.5" : "mt-3"}`}>
                      {!sameAuthor ? (
                        <div className="w-8 h-8 rounded-full bg-re-500/20 flex items-center justify-center text-xs font-bold text-re-400 flex-shrink-0 mt-0.5">
                          {msg.user.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      ) : <div className="w-8 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        {!sameAuthor && (
                          <div className="flex items-baseline gap-2 mb-0.5">
                            <span className={`text-sm font-semibold ${isMe ? "text-re-400" : "text-white"}`}>{msg.user.name || "Student"}</span>
                            <span className="text-xs text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity">{formatRelative(msg.createdAt)}</span>
                          </div>
                        )}
                        <p className="text-sm text-gray-300 break-words">{msg.content}</p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input */}
            <div className="px-4 pb-4 pt-2 flex-shrink-0 border-t border-white/8">
              <div className="flex gap-2 items-center bg-white/8 border border-white/15 rounded-xl px-3 focus-within:border-re-500/50 transition-colors">
                <input
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                  placeholder={`Message #${activeChannel}`}
                  className="flex-1 bg-transparent py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none"
                />
                <button onClick={handleSend} disabled={!message.trim() || sendMutation.isPending} className="w-8 h-8 bg-re-500 hover:bg-re-600 disabled:opacity-40 rounded-lg flex items-center justify-center transition-colors">
                  {sendMutation.isPending ? <Loader2 className="w-3.5 h-3.5 text-white animate-spin" /> : <Send className="w-3.5 h-3.5 text-white" />}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
