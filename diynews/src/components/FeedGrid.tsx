import FeedCard from "./FeedCard";
import type { Post } from "@/pages/Index";

interface FeedGridProps {
  posts: Post[];
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
  onDelete: (id: string) => void;  
  currentCategory: string;
  onCategoryChange: (category: string) => void;
}

const extractDates = (text: string): Date[] => {
  const year = new Date().getFullYear();
  const matches = [...text.matchAll(/(\d{1,2})[\/-](\d{1,2})/g)];
  return matches.map((m) => new Date(year, Number(m[1]) - 1, Number(m[2])));
};

const FeedGrid = ({ posts, bookmarks, onToggleBookmark, onDelete, currentCategory, onCategoryChange }: FeedGridProps) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base md:text-lg font-semibold text-foreground">최신 피드</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
        {posts.map((post) => {
          const dates = extractDates(post.title + " " + post.content);
          const hasSchedule = dates.length > 0;
          const scheduleDate = hasSchedule ? dates[0].toLocaleDateString('ko-KR') : undefined;
          
          return (
            <FeedCard 
              key={post.id} 
              post={{
                ...post,
                hasSchedule,
                scheduleDate
              }}
              bookmarked={bookmarks.includes(post.id)}
              onToggleBookmark={onToggleBookmark}
              onDelete={onDelete}  // ✨ 새로 추가
            />
          );
        })}
      </div>
    </div>
  );
};

export default FeedGrid;
