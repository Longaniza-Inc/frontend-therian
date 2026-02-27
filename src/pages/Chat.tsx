import { useState, useEffect, useRef } from "react";
import { Search, ArrowLeft, Send } from "lucide-react";
import logoColor from "@/assets/logo-color.png";
import BottomNav from "@/components/BottomNav";
import { useAppSelector } from "@/hooks/useAppDispatch";
import { useChat } from "@/hooks/useChat";

const Chat = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedChatId, setSelectedChatId] = useState<number | null>(null);
  const [messageInput, setMessageInput] = useState("");

  const auth = useAppSelector((state) => state.auth);
  const chatList = useAppSelector((state) => state.chat.chatList);
  const unreadCounts = useAppSelector((state) => state.chat.unreadCounts);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { mensajes, isConnected, isLoadingHistory, enviarMensaje } = useChat(selectedChatId);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes]);

  const filteredChats = chatList.filter((c) =>
    c.otro_usuario_nombre.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatearFecha = (fecha: string | null) => {
    if (!fecha) return "";
    const d = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    if (d.toDateString() === hoy.toDateString())
      return d.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" });
    if (d.toDateString() === ayer.toDateString()) return "Ayer";
    if (d.getFullYear() === hoy.getFullYear())
      return d.toLocaleDateString("es-ES", { month: "short", day: "numeric" });
    return d.toLocaleDateString("es-ES", { year: "2-digit", month: "short", day: "numeric" });
  };

  const truncar = (msg?: string, max = 50) =>
    !msg ? "Sin mensajes" : msg.length > max ? `${msg.substring(0, max)}...` : msg;

  const handleEnviar = (e: React.FormEvent) => {
    e.preventDefault();
    if (messageInput.trim()) {
      enviarMensaje(messageInput);
      setMessageInput("");
    }
  };

  const selectedChat = chatList.find((c) => c.id_chat === selectedChatId);

  /* ── Vista conversación ────────────────────────────────────── */
  if (selectedChatId !== null && selectedChat) {
    return (
      <div className="h-screen bg-background flex flex-col overflow-hidden">
        <div className="gradient-header px-4 py-3 flex items-center justify-between shrink-0">
          <button
            onClick={() => setSelectedChatId(null)}
            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          >
            <ArrowLeft className="h-6 w-6 text-primary-foreground" />
            <span className="text-xl font-bold text-primary-foreground">
              {selectedChat.otro_usuario_nombre}
            </span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
          {isLoadingHistory ? (
            <div className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">Cargando mensajes...</p>
            </div>
          ) : mensajes.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-muted-foreground">Sin mensajes aún</p>
            </div>
          ) : (
            <>
              {mensajes.map((msg, i) => {
                const mine =
                  msg.id_emisor === auth.userId ||
                  msg.id_emisor === String(auth.userId);
                const key = msg.id_mensaje || `${selectedChatId}-${i}`;
                return (
                  <div key={`msg-${key}`} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-xs px-4 py-2 rounded-lg ${
                        mine ? "bg-primary text-primary-foreground" : "bg-secondary text-foreground"
                      }`}
                    >
                      <p className="text-sm">{msg.contenido}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(msg.fecha).toLocaleTimeString("es-ES", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        <div className="border-t border-border p-4 pb-20 shrink-0">
          <form onSubmit={handleEnviar} className="flex gap-2">
            <input
              type="text"
              value={messageInput}
              onChange={(e) => setMessageInput(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1 px-4 py-2 rounded-full bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!isConnected || !messageInput.trim()}
              className="p-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              <Send className="h-5 w-5" />
            </button>
          </form>
          {!isConnected && (
            <p className="text-xs text-muted-foreground mt-2">Conectando...</p>
          )}
        </div>
      </div>
    );
  }

  /* ── Vista lista de chats ──────────────────────────────────── */
  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="gradient-header px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <img src={logoColor} alt="thalk" className="h-10 w-10" />
          <span className="text-2xl font-extrabold text-primary-foreground italic">thalk</span>
        </div>
      </div>

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

      <div className="flex-1 overflow-y-auto">
        {chatList.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">Cargando chats...</p>
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-2xl">💬</p>
            <p className="text-muted-foreground mt-2 font-semibold">No hay conversaciones</p>
            <p className="text-muted-foreground text-sm mt-1">¡Haz match para empezar a chatear!</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredChats.map((chat) => {
              const unread = unreadCounts[chat.id_chat] || 0;
              return (
                <button
                  key={`chat-${chat.id_chat}`}
                  onClick={() => setSelectedChatId(chat.id_chat)}
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-secondary/60 transition-colors text-left"
                >
                  <div className="relative shrink-0">
                    <div className="h-14 w-14 rounded-full object-cover border-2 border-border bg-secondary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className={`font-bold truncate ${unread > 0 ? "text-foreground" : "text-foreground"}`}>
                        {chat.otro_usuario_nombre}
                      </h3>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {formatearFecha(chat.fecha_ultimo_mensaje)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <p className={`text-sm truncate ${unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                        {truncar(chat.ultimo_mensaje)}
                      </p>
                      {unread > 0 && (
                        <span className="ml-2 shrink-0 bg-primary text-primary-foreground text-xs font-bold rounded-full h-5 min-w-[20px] flex items-center justify-center px-1.5">
                          {unread}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
};

export default Chat;
