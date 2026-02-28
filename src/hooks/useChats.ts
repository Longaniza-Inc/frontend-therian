import { useEffect, useState } from "react";
import { chatService } from "@/services/chatService";
import { useAppSelector, useAppDispatch } from "./useAppDispatch";
import { setChatList, setMessagesForChat, markHistoryRequested, resetRefreshFlag } from "@/store/slices/chatSlice";

/**
 * Hook que carga la lista de chats UNA SOLA VEZ.
 * Después de cargar la lista, precarga el historial de TODOS los chats en background.
 * Así cuando el usuario entre a un chat, los mensajes ya están en Redux → instantáneo.
 * 
 * Si recibe invalidateChatList (nuevo chat via WS), recarga la lista.
 */
export const useChats = () => {
  const auth = useAppSelector((state) => state.auth);
  const chatList = useAppSelector((state) => state.chat.chatList);
  const unreadCounts = useAppSelector((state) => state.chat.unreadCounts);
  const shouldRefresh = useAppSelector((state) => state.chat.shouldRefreshList);

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const dispatch = useAppDispatch();
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    if (!auth.userId || !auth.isAuthenticated) return;
    
    // Recargar si se invalidó la lista (nuevo chat via WS)
    const shouldLoad = !hasLoaded || shouldRefresh;
    if (!shouldLoad) return;

    const cargar = async () => {
      try {
        setIsLoading(true);
        console.log("📝 useChats: cargando chats... (refresh:", shouldRefresh, ")");
        
        // 1. Cargar lista de chats
        const data = await chatService.obtenerChats();
        console.log("✅ Chats cargados:", data.length, "chats");
        dispatch(setChatList(data));

        // 2. Marcar TODOS como "ya pedidos" ANTES de hacer las requests
        data.forEach((chat) => dispatch(markHistoryRequested(chat.id_chat)));

        // 3. Precargar historial de TODOS los chats en paralelo
        await Promise.allSettled(
          data.map(async (chat) => {
            try {
              const mensajes = await chatService.obtenerHistorial(chat.id_chat);
              dispatch(setMessagesForChat({ chatId: chat.id_chat, mensajes }));
            } catch {
              // Si falla, setear array vacío para no bloquear
              dispatch(setMessagesForChat({ chatId: chat.id_chat, mensajes: [] }));
            }
          })
        );

        setError(null);
        setHasLoaded(true);
        
        // Resetear el flag de refresh
        if (shouldRefresh) {
          dispatch(resetRefreshFlag());
          console.log("🔄 useChats: flag de refresh reseteado");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar chats");
      } finally {
        setIsLoading(false);
      }
    };

    cargar();
  }, [auth.userId, auth.isAuthenticated, shouldRefresh, hasLoaded, dispatch]);

  return { chats: chatList, isLoading, error, unreadCounts };
};

