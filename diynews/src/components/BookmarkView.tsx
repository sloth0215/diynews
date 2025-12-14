import { Bookmark } from "lucide-react";
import { Card } from "@/components/ui/card";
import FeedCard from "./FeedCard";
import type { Post } from "@/pages/Index";

interface BookmarkViewProps {
  posts: Post[];
  bookmarks: string[];
  onToggleBookmark: (id: string) => void;
}

const BookmarkView = ({ posts, bookmarks, onToggleBookmark }: BookmarkViewProps) => {
  const bookmarkedPosts = posts.filter(p => bookmarks.includes(p.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Bookmark className="h-6 w-6 text-highlight fill-highlight" />
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">북마크</h2>
          <p className="text-sm text-muted-foreground">저장한 게시물을 모아볼 수 있습니다</p>
        </div>
      </div>

      {bookmarkedPosts.length === 0 ? (
        <Card className="p-8 md:p-12 text-center">
          <Bookmark className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="text-lg font-medium text-foreground mb-2">북마크한 게시물이 없습니다</h3>
          <p className="text-sm text-muted-foreground">
            관심 있는 게시물에서 ★ 버튼을 눌러 저장하세요
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {bookmarkedPosts.map((post) => (
            <FeedCard
              key={post.id}
              post={post}
              bookmarked={true}
              onToggleBookmark={onToggleBookmark}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default BookmarkView;
