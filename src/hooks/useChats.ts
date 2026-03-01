import { useEffect, useRef } from "react";
import { chatService } from "@/services/chatService";
import { useAppSelector, useAppDispatch } from "./useAppDispatch";
import { setChatList, setMessagesForChat, markHistoryRequested, resetRefreshFlag, setChatsLoaded } from "@/store/slices/chatSlice";

/**
 * Hook que carga la lista de chats y los cachea en Redux.
 *
 * Estrategia de caché:
 * - Si ya hay datos en Redux (chatList.length > 0), se muestran inmediatamente.
 * - Se refresca en background sin mostrar loading.
 * - Solo muestra loading la primera vez (cuando no hay caché).
 * - Si llega invalidateChatList (nuevo chat via WS), recarga silenciosamente.
 */
export const useChats = () => {
  const auth = useAppSelector((state) => state.auth);
  const chatList = useAppSelector((state) => state.chat.chatList);
  const unreadCounts = useAppSelector((state) => state.chat.unreadCounts);
  const shouldRefresh = useAppSelector((state) => state.chat.shouldRefreshList);
  const dispatch = useAppDispatch();

  const hasLoadedOnce = useRef(false);
  const isLoadingRef = useRef(false);

  // Determinar si hay datos cacheados
  const hasCachedData = chatList.length > 0;

  useEffect(() => {
    if (!auth.userId || !auth.isAuthenticated) return;

    // Cargar si: primera vez, o se invalidó la lista
    const shouldLoad = !hasLoadedOnce.current || shouldRefresh;
    if (!shouldLoad || isLoadingRef.current) return;

    const cargar = async () => {
      isLoadingRef.current = true;

      try {
        console.log("📝 useChats: cargando chats... (refresh:", shouldRefresh, ", firstLoad:", !hasLoadedOnce.current, ")");

        // 1. Cargar lista de chats
        const data = await chatService.obtenerChats();
        console.log("✅ Chats cargados:", data.length, "chats");
        dispatch(setChatList(data));

        // 2. Marcar todos como "ya pedidos" antes de las requests
        data.forEach((chat) => dispatch(markHistoryRequested(chat.id_chat)));

        // 3. Precargar historial de TODOS los chats en paralelo
        await Promise.allSettled(
          data.map(async (chat) => {
            try {
              const mensajes = await chatService.obtenerHistorial(chat.id_chat);
              dispatch(setMessagesForChat({ chatId: chat.id_chat, mensajes }));
            } catch {
              dispatch(setMessagesForChat({ chatId: chat.id_chat, mensajes: [] }));
            }
          })
        );

        hasLoadedOnce.current = true;
        dispatch(setChatsLoaded());

        // Resetear el flag de refresh
        if (shouldRefresh) {
          dispatch(resetRefreshFlag());
        }
      } catch (err) {
        console.error("❌ useChats error:", err);
      } finally {
        isLoadingRef.current = false;
      }
    };

    cargar();
  }, [auth.userId, auth.isAuthenticated, shouldRefresh, dispatch]);

  // isLoading solo si es la primera vez y no hay caché
  const isLoading = !hasLoadedOnce.current && !hasCachedData;

  return { chats: chatList, isLoading, error: null, unreadCounts };
};

