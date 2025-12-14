import { Calendar, Bookmark, ExternalLink } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface FeedCardProps {
  post: {
    id: string;
    platform: "twitter" | "youtube" | "blog";
    author: string;
    authorAvatar: string;
    title: string;
    content: string;
    timestamp: string;
    hasSchedule?: boolean;
    scheduleDate?: string;
    imageUrl?: string;
    url: string;  
  };
  bookmarked?: boolean;
  onToggleBookmark?: (id: string) => void;
  onDelete?: (id: string) => void;  // ✨ 이 줄 추가
}

const FeedCard = ({ post, bookmarked = false, onToggleBookmark,onDelete}: FeedCardProps) => {
  const platformColors = {
    twitter: "bg-blue-500",
    youtube: "bg-red-500",
    blog: "bg-green-500"
  };

  const platformLabels = {
    twitter: "Twitter",
    youtube: "YouTube",
    blog: "Blog"
  };

  return (
    <Card className="group relative overflow-hidden  shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-[var(--transition-smooth)] cursor-pointer border-border">
      {post.imageUrl && (
        <div className="relative h-48 overflow-hidden bg-muted">
          <img 
            src={post.imageUrl} 
            alt="" 
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* ✨ X 버튼 - Card 바로 아래 (p-4 밖) */}
    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
      <Button
        variant="destructive"
        size="sm"
        className="h-6 w-6 p-0 rounded-full shadow-md"
        onClick={(e) => {
          e.stopPropagation();
          onDelete?.(post.id);
        }}
        title="삭제"
      >
        ✕
      </Button>
    </div>

      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Avatar className="h-8 w-8">
              <AvatarImage src={post.authorAvatar} alt={post.author} />
              <AvatarFallback>{post.author[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{post.author}</p>
              <p className="text-xs text-muted-foreground">{post.timestamp}</p>
            </div>
          </div>
          <span className={`${platformColors[post.platform]} px-2 py-0.5 rounded text-xs font-medium text-white shrink-0`}>
            {platformLabels[post.platform]}
          </span>
        </div>

        <h3 className="text-sm font-medium text-foreground mb-1 line-clamp-1">
          {post.title}
        </h3>
        
        <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
          {post.content}
        </p>

        {post.hasSchedule && post.scheduleDate && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-highlight/10 border border-highlight/20">
            <Calendar className="h-4 w-4 text-highlight shrink-0" />
            <span className="text-xs font-medium text-highlight">
              일정: {post.scheduleDate}
            </span>
          </div>
        )}

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-8 gap-1"
            onClick={() => onToggleBookmark?.(post.id)}
          >
            <Bookmark className={`h-3.5 w-3.5 ${bookmarked ? "fill-highlight text-highlight" : ""}`} />
            <span className="text-xs hidden sm:inline">저장</span>
          </Button>
          <Button 
      variant="ghost" 
     size="sm" 
     className="h-8 gap-1"
     onClick={() => window.open(post.url, '_blank')}>
      <ExternalLink className="h-3.5 w-3.5" />
      <span className="text-xs hidden sm:inline">원본 보기</span>
            </Button>
        </div>
        
        
    </div>
    </Card>
  );
};

export default FeedCard;
