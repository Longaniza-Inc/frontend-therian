import { useState } from "react";
import { Search } from "lucide-react";
import logoColor from "@/assets/logo-color.png";
import BottomNav from "@/components/BottomNav";
import type { ChatPreview } from "@/types";

const THERIAN_EMOJIS: Record<string, string> = {
  zorro: "🦊",
  lobo: "🐺",
  no_therian: "🙂",
  apoyo: "💚",
};

const MOCK_CHATS: ChatPreview[] = [
  {
    id: "c1",
    userId: "1",
    name: "Zorrito",
    avatar: "https://images.unsplash.com/photo-1474511320723-9a56873571b7?w=100&h=100&fit=crop",
    lastMessage: "Heyy! ¿Qué tal todo? 🦊",
    lastMessageTime: "14:32",
    unreadCount: 2,
    therianType: "zorro",
  },
  {
    id: "c2",
    userId: "2",
    name: "Luna",
    avatar: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=100&h=100&fit=crop",
    lastMessage: "Ayer vi la luna llena, fue increíble",
    lastMessageTime: "Ayer",
    unreadCount: 0,
    therianType: "lobo",
  },
  {
    id: "c3",
    userId: "3",
    name: "Maple",
    avatar: "https://images.unsplash.com/photo-1518495973542-4542c06a5843?w=100&h=100&fit=crop",
    lastMessage: "¿Nos vemos este finde?",
    lastMessageTime: "Lun",
    unreadCount: 1,
    therianType: "zorro",
  },
  {
    id: "c4",
    userId: "4",
    name: "Kai",
    avatar: "https://images.unsplash.com/photo-1472396961693-142e6e269027?w=100&h=100&fit=crop",
    lastMessage: "Gracias por el consejo 💚",
    lastMessageTime: "Dom",
    unreadCount: 0,
    therianType: "apoyo",
  },
];

const Chat = () => {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = MOCK_CHATS.filter((chat) =>
    chat.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="gradient-header px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logoColor} alt="thalk" className="h-10 w-10" />
          <span className="text-2xl font-extrabold text-primary-foreground italic">thalk</span>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-4 pb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Buscar conversación..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-2xl bg-secondary border-none text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {filteredChats.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl">💬</p>
            <p className="text-muted-foreground mt-2 font-semibold">No hay conversaciones</p>
            <p className="text-muted-foreground text-sm mt-1">¡Haz match para empezar a chatear!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredChats.map((chat) => (
              <button
                key={chat.id}
                className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/60 transition-colors text-left"
              >
                <div className="relative shrink-0">
                  <img
                    src={chat.avatar}
                    alt={chat.name}
                    className="h-14 w-14 rounded-full object-cover border-2 border-border"
                  />
                  <span className="absolute -bottom-0.5 -right-0.5 text-sm">
                    {THERIAN_EMOJIS[chat.therianType]}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-foreground truncate">{chat.name}</h3>
                    <span className="text-xs text-muted-foreground shrink-0 ml-2">
                      {chat.lastMessageTime}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate mt-0.5">
                    {chat.lastMessage}
                  </p>
                </div>

                {chat.unreadCount > 0 && (
                  <span className="h-6 min-w-6 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
                    {chat.unreadCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Chat;
