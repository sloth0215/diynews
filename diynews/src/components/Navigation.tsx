import { Newspaper, Calendar, Users, Bookmark, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";


type View = "feed" | "calendar" | "accounts" | "bookmarks";

interface NavigationProps {
  currentView: View;
  onViewChange: (view: View) => void;
  onRefresh: () => void;
}

const Navigation = ({ currentView, onViewChange, onRefresh }: NavigationProps) => {
  const navItems = [
    { view: "feed" as View, icon: Newspaper, label: "피드" },
    { view: "calendar" as View, icon: Calendar, label: "일정" },
    { view: "bookmarks" as View, icon: Bookmark, label: "북마크" },
    { view: "accounts" as View, icon: Users, label: "설정" },
  ];

  return (
    <>
      {/* Desktop Navigation */}
      <header className="hidden md:block sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <Newspaper className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-semibold text-foreground">NewsRoom</h1>
            </div>
            
            <nav className="flex items-center gap-2">
              {navItems.map(({ view, icon: Icon, label }) => (
                <Button
                  key={view}
                  variant={currentView === view ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onViewChange(view)}
                  className="gap-2"
                >
                  <Icon className="h-4 w-4" />
                  <span>{label}</span>
                </Button>
              ))}
              
              <Button variant="ghost" size="sm" onClick={onRefresh} className="gap-2">
                <RefreshCw className="h-4 w-4" />
                <span>새로고침</span>
              </Button>
            </nav>
          </div>
        </div>
      </header>

      {/* Mobile Top Bar */}
      <header className="md:hidden sticky top-0 z-50 w-full border-b border-border bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
        <div className="flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <h1 className="text-base font-semibold text-foreground">NewsRoom</h1>
          </div>
          <Button variant="ghost" size="sm" onClick={onRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="flex justify-around py-2">
          {navItems.map(({ view, icon: Icon, label }) => (
            <button
              key={view}
              onClick={() => onViewChange(view)}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-lg transition-colors ${
                currentView === view
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span className="text-xs">{label}</span>
            </button>
          ))}
        </div>
      </nav>
    </>
  );
};

export default Navigation;
