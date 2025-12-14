import { useState, useEffect, useMemo } from "react";
import { collection, query, where, orderBy, limit, getDocs, deleteDoc, doc } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import Navigation from "@/components/Navigation";
import TodayHighlights from "@/components/TodayHighlights";
import FeedGrid from "@/components/FeedGrid";
import CalendarView from "@/components/CalendarView";
import AccountManagement from "@/components/AccountManagement";
import BookmarkView from "@/components/BookmarkView";


type View = "feed" | "calendar" | "accounts" | "bookmarks";
type Category = "all" | "twitter" | "youtube" | "blog";

export interface Post {
  id: string;
  platform: "twitter" | "youtube" | "blog";
  author: string;
  authorAvatar: string;
  title: string;
  content: string;
  timestamp: string;
  publishedAt: string;
  hasSchedule?: boolean;
  scheduleDate?: string;
  imageUrl?: string;
  url: string;
}

const Index = () => {
  const [currentView, setCurrentView] = useState<View>("feed");
  const [currentCategory, setCurrentCategory] = useState<Category>("all");
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // 🔥 사용자 인증 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);
  
  // 🔥 Firestore에서 posts 가져오기
  useEffect(() => {
    const fetchPosts = async () => {
      try {
        setLoading(true);
        
        const postsRef = collection(db, 'posts');

        // 로그인한 사용자의 게시물만 가져오기
        if (!user) {
          setPosts([]);
          setLoading(false);
          return;
        }

        const q = query(
          postsRef,
          where('userId', '==', user.uid),  // 활성화!
          orderBy('createdAt', 'desc'),
         limit(50)
        );
        
        const querySnapshot = await getDocs(q);
        
        const fetchedPosts = querySnapshot.docs.map(doc => {
          const data = doc.data();
          
          return {
            id: doc.id,
            platform: data.platform as "twitter" | "youtube" | "blog",
            author: data.author,
            authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.author}`,
            title: data.title,
            content: data.summary,
            timestamp: getRelativeTime(data.createdAt),
            publishedAt: data.publishedAt,
            hasSchedule: data.hasSchedule,
            scheduleDate: data.scheduleDate,
            imageUrl: data.thumbnail,
            url: data.url
          };
        });
        
        setPosts(fetchedPosts);
      } catch (error) {
        console.error('Error fetching posts:', error);
      } finally {
        setLoading(false);
      }
    };
    
   fetchPosts();
}, [user]);

  // 🗑️ 게시물 개별 삭제 함수
  const handleDeletePost = async (postId: string) => {
    try {
      // Firebase의 'posts' 컬렉션에서 해당 게시물 삭제
      await deleteDoc(doc(db, 'posts', postId));
      
      // UI에서 즉시 제거 (새로고침 없이 바로 사라짐)
      setPosts(posts.filter(p => p.id !== postId));
      
      console.log('게시물 삭제 완료:', postId);
    } catch (error) {
      console.error('게시물 삭제 실패:', error);
      alert('게시물을 삭제할 수 없습니다.');
    }
  };
  // 상대 시간 계산
  const getRelativeTime = (timestamp: string): string => {
    const now = new Date();
    const past = new Date(timestamp);
    const diffInSeconds = Math.floor((now.getTime() - past.getTime()) / 1000);
    
    if (diffInSeconds < 60) return '방금 전';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}분 전`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}시간 전`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}일 전`;
    return `${Math.floor(diffInSeconds / 2592000)}개월 전`;
  };

  const handleCategoryChange = (category: string) => {
    setCurrentCategory(category as Category);
  };

  const filteredPosts = useMemo(() => {
    if (currentCategory === "all") return posts;
    return posts.filter(p => p.platform === currentCategory);
  }, [posts, currentCategory]);

  const toggleBookmark = (id: string) => {
    setBookmarks(prev => 
      prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]
    );
  };

  const refreshPosts = async () => {
  // 이미 동기화 중이면 무시
  if (isSyncing) {
    console.log('이미 동기화 중...');
    return;
  }

  try {
    setIsSyncing(true);
    setLoading(true);
    
    console.log('동기화 요청 시작...');
    const response = await fetch('http://localhost:5000/api/sync', {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`동기화 실패: ${response.status}`);
    }

    const data = await response.json();
    console.log('동기화 성공:', data);

    // 3초 후 데이터 새로고침
    setTimeout(() => {
      window.location.reload();
    }, 3000);

  } catch (error) {
    console.error('동기화 오류:', error);
    alert('동기화 중 오류가 발생했습니다.');
    setLoading(false);
    setIsSyncing(false);
  }
};

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">로딩 중...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-6">
      <Navigation 
        currentView={currentView} 
        onViewChange={setCurrentView}
        onRefresh={refreshPosts}
      />
      
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        {currentView === "feed" && (
          <div className="space-y-6">
            <TodayHighlights 
              posts={posts}
              currentCategory={currentCategory}
              onCategoryChange={handleCategoryChange}
            />
            <FeedGrid 
              posts={filteredPosts}
              bookmarks={bookmarks}
              onToggleBookmark={toggleBookmark}
               onDelete={handleDeletePost}  
              currentCategory={currentCategory}
              onCategoryChange={handleCategoryChange}
            />
          </div>
        )}
        
        {currentView === "calendar" && (
          <CalendarView 
            posts={posts}
            bookmarks={bookmarks}
          />
        )}
        
        {currentView === "bookmarks" && (
          <BookmarkView 
            posts={posts}
            bookmarks={bookmarks}
            onToggleBookmark={toggleBookmark}
          />
        )}
        
        {currentView === "accounts" && (
          <AccountManagement />
        )}
      </main>
    </div>
  );
};

export default Index;