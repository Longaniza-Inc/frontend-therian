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

  const currentPath = location.pathname;
  const isFeed = currentPath === "/feed";
  const isChat = currentPath === "/chat";
  const isProfile = currentPath === "/profile";

  return (
    <div className="gradient-header px-6 py-3 flex items-center justify-around">
      <button
        onClick={() => navigate("/chat")}
        className="flex flex-col items-center transition-colors"
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
        onClick={() => navigate("/feed")}
        className="flex flex-col items-center transition-colors"
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
        onClick={() => navigate("/profile")}
        className="flex flex-col items-center transition-colors"
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
