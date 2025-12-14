import { Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Post } from "@/pages/Index";

interface TodayHighlightsProps {
  posts: Post[];
  currentCategory: string;
  onCategoryChange: (category: string) => void;
}

const naiveSummarize = (text: string) => {
  return text.split(/[.!?]/)[0]?.slice(0, 80) + "...";
};

const TodayHighlights = ({ posts, currentCategory, onCategoryChange }: TodayHighlightsProps) => {
  const topPosts = posts.slice(0, 3);
  
  const categories = [
    { key: "all", label: "전체" },
    { key: "twitter", label: "Twitter" },
    { key: "youtube", label: "YouTube" },
    { key: "blog", label: "Blog" },
  ];

  return (
    <Card className="p-4 md:p-6 shadow-[var(--shadow-elevated)] border-highlight/20 bg-gradient-to-br from-card to-subtle">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-highlight" />
          <h2 className="text-lg md:text-xl font-semibold text-foreground">오늘의 주요 소식</h2>
        </div>
        
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {categories.map((cat) => (
            <Button
              key={cat.key}
              onClick={() => onCategoryChange(cat.key)}
              variant="ghost"
              size="sm"
              className={`h-8 px-2 md:px-3 text-xs font-medium transition-all ${
                currentCategory === cat.key
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted-foreground/10"
              }`}
            >
              {cat.label}
            </Button>
          ))}
        </div>
      </div>
      
      <div className="space-y-3">
        {topPosts.map((post, index) => (
          <div 
            key={index}
            className="group p-3 md:p-4 rounded-lg bg-card hover:bg-subtle transition-[var(--transition-smooth)] cursor-pointer border border-border/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  {index === 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-highlight text-highlight-foreground">
                      중요
                    </span>
                  )}
                  <span className="text-xs text-muted-foreground capitalize">{post.platform}</span>
                </div>
                <h3 className="font-medium text-sm md:text-base text-foreground mb-1 group-hover:text-highlight transition-[var(--transition-smooth)]">
                  {post.title}
                </h3>
                <p className="text-xs md:text-sm text-muted-foreground line-clamp-2">
                  {naiveSummarize(post.content)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};

export default TodayHighlights;
