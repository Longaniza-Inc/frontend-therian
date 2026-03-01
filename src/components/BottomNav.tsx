import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import logoColor from "@/assets/logo-color.png";
import logoSinColor from "@/assets/logo-sin-color.png";
import mensajes1 from "@/assets/mensajes-1.png";
import mensajes2 from "@/assets/mensajes-2.png";
import perfil1 from "@/assets/perfil-1.png";
import perfil2 from "@/assets/perfil-2.png";

const BottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [animatingButton, setAnimatingButton] = useState<string | null>(null);

  const currentPath = location.pathname;
  const isFeed = currentPath === "/feed";
  const isChat = currentPath === "/chat";
  const isProfile = currentPath === "/profile";

  const handleButtonClick = (path: string, buttonId: string) => {
    setAnimatingButton(buttonId);
    setTimeout(() => setAnimatingButton(null), 600);
    navigate(path);
  };

  return (
    <div
      className="fixed bottom-0 left-0 right-0 gradient-header px-6 pt-3 flex items-center justify-around z-40 border-t border-border"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <button
        onClick={() => handleButtonClick("/chat", "chat")}
        className={`flex flex-col items-center transition-all ${
          animatingButton === "chat" ? "animate-ring-pulse" : ""
        }`}
      >
        <img
          src={isChat ? mensajes2 : mensajes1}
          alt="Chat"
          className="h-7 w-7 object-contain"
        />
        <span className={`text-xs mt-0.5 ${isChat ? "font-bold text-primary-foreground" : "font-semibold text-primary-foreground/80"}`}>
          Chat
        </span>
      </button>

      <button
        onClick={() => handleButtonClick("/feed", "feed")}
        className={`flex flex-col items-center transition-all ${
          animatingButton === "feed" ? "animate-ring-pulse" : ""
        }`}
      >
        <img
          src={isFeed ? logoColor : logoSinColor}
          alt="Feed"
          className="h-8 w-8 object-contain"
        />
        <span className={`text-xs mt-0.5 ${isFeed ? "font-bold text-primary-foreground" : "font-semibold text-primary-foreground/80"}`}>
          Feed
        </span>
      </button>

      <button
        onClick={() => handleButtonClick("/profile", "profile")}
        className={`flex flex-col items-center transition-all ${
          animatingButton === "profile" ? "animate-ring-pulse" : ""
        }`}
      >
        <img
          src={isProfile ? perfil2 : perfil1}
          alt="Perfil"
          className="h-7 w-7 object-contain"
        />
        <span className={`text-xs mt-0.5 ${isProfile ? "font-bold text-primary-foreground" : "font-semibold text-primary-foreground/80"}`}>
          Perfil
        </span>
      </button>
    </div>
  );
};

export default BottomNav;
