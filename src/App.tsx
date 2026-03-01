import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { store } from "@/store";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { useChats } from "@/hooks/useChats";
import { useProfileLoader } from "@/hooks/useProfileLoader";
import { useDeepLink } from "@/hooks/useDeepLink";
import { useAppSelector } from "@/hooks/useAppDispatch";
import LoadingScreen from "@/components/LoadingScreen";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import CreateProfile from "./pages/CreateProfile";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import Chat from "./pages/Chat";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Rutas públicas que no necesitan esperar la carga inicial */
const PUBLIC_PATHS = ["/", "/login", "/register", "/auth/callback", "/create-profile"];

/** Componente interno: carga inicial de chats + perfil + rutas */
const AppContent = () => {
  // Carga lista de chats una vez → Redux
  useChats();
  // Carga perfil del usuario al autenticarse (se cachea en Redux)
  useProfileLoader();
  // Maneja deep links desde la app mobile
  useDeepLink();

  const location = useLocation();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const profileLoaded = useAppSelector((s) => s.user.profileLoaded);
  const chatsLoaded = useAppSelector((s) => s.chat.chatsLoaded);

  // Mostrar pantalla de carga solo en rutas protegidas mientras cargan datos iniciales
  const isPublicRoute = PUBLIC_PATHS.includes(location.pathname);
  const showLoading = isAuthenticated && !isPublicRoute && (!profileLoaded || !chatsLoaded);

  if (showLoading) {
    return <LoadingScreen />;
  }

  return (
    <>
      <Toaster />
      <Sonner />
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/create-profile" element={<CreateProfile />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/feed" element={<Feed />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
};

const App = () => (
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <WebSocketProvider>
        <TooltipProvider>
          <BrowserRouter>
            <AppContent />
          </BrowserRouter>
        </TooltipProvider>
      </WebSocketProvider>
    </QueryClientProvider>
  </Provider>
);

export default App;
