import logoColor from "@/assets/pawtalk-logo.png";

const LoadingScreen = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-background">
      <img
        src={logoColor}
        alt="PawTalk"
        className="w-24 h-24 mb-6 animate-pulse"
      />
      <div className="flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:0ms]" />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:150ms]" />
        <div className="w-2 h-2 rounded-full bg-primary animate-bounce [animation-delay:300ms]" />
      </div>
      <p className="mt-4 text-sm text-muted-foreground">Cargando tu experiencia...</p>
    </div>
  );
};

export default LoadingScreen;
