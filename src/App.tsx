import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { store } from "@/store";
import { WebSocketProvider } from "@/providers/WebSocketProvider";
import { useChats } from "@/hooks/useChats";
import { useProfileLoader } from "@/hooks/useProfileLoader";
import { useDeepLink } from "@/hooks/useDeepLink";
import { useInitAuth } from "@/hooks/useInitAuth";
import { useAppSelector } from "@/hooks/useAppDispatch";
import LoadingScreen from "@/components/LoadingScreen";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AuthCallback from "./pages/AuthCallback";
import CreateProfile from "./pages/CreateProfile";
import Profile from "./pages/Profile";
import Feed from "./pages/Feed";
import Chat from "./pages/Chat";
import DeleteAccount from "./pages/DeleteAccount";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

/** Rutas públicas que no necesitan esperar la carga inicial */
const PUBLIC_PATHS = ["/", "/login", "/register", "/auth/callback", "/create-profile", "/delete-account"];

/** Componente interno: carga inicial de chats + perfil + rutas */
const AppContent = () => {
  // Validar y refrescar token si es necesario
  useInitAuth();
  // Carga lista de chats una vez → Redux
  useChats();
  // Carga perfil del usuario al autenticarse (se cachea en Redux)
  useProfileLoader();
  // Maneja deep links desde la app mobile
  useDeepLink();

  const location = useLocation();
  const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
  const isInitializing = useAppSelector((s) => s.auth.isInitializing);
  const profileLoaded = useAppSelector((s) => s.user.profileLoaded);
  const chatsLoaded = useAppSelector((s) => s.chat.chatsLoaded);

  console.log("📋 [App] Estado de inicialización - isInitializing:", isInitializing, "isAuthenticated:", isAuthenticated, "path:", location.pathname);

  // Mostrar pantalla de carga mientras se valida el token
  if (isInitializing) {
    console.log("⏳ [App] Mostrando LoadingScreen (esperando validación de token)");
    return <LoadingScreen />;
  }

  console.log("✅ [App] Inicialización completada - isInitializing:", isInitializing);

  // Mostrar pantalla de carga solo en rutas protegidas mientras cargan datos iniciales
  const isPublicRoute = PUBLIC_PATHS.includes(location.pathname);
  const showLoading = isAuthenticated && !isPublicRoute && (!profileLoaded || !chatsLoaded);

  // Si está autenticado en ruta "/", redirigir a /feed con loading screen
  if (isAuthenticated && location.pathname === "/") {
    if (!profileLoaded || !chatsLoaded) {
      return <LoadingScreen />;
    }
    return <Navigate to="/feed" replace />;
  }

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
        <Route path="/delete-account" element={<DeleteAccount />} />
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
