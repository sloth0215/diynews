import { useState, useEffect } from "react";
import { Plus, Twitter, Rss, Youtube, Trash2, Settings, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider, db } from "@/lib/firebase";
import { collection, addDoc, query, where, onSnapshot, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

// 🔥 Firestore용 Subscription 타입
interface Subscription {
  id?: string;
  userId: string;
  platform: string;
  accountId: string;
  name: string;
  rssUrl: string;
  lastSyncedAt: any;
  createdAt: any;
}

interface AccountManagementProps {}

const AccountManagement = ({}: AccountManagementProps) => {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [user, setUser] = useState<any>(null);
  const [accounts, setAccounts] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // 🔥 로그인 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // 🔥 Firestore에서 계정 목록 실시간 불러오기
  useEffect(() => {
    if (!user) {
      setAccounts([]);
      return;
    }

    const q = query(
      collection(db, "subscriptions"),
      where("userId", "==", user.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedAccounts: Subscription[] = [];
      snapshot.forEach((doc) => {
        loadedAccounts.push({ id: doc.id, ...doc.data() } as Subscription);
      });
      setAccounts(loadedAccounts);
    });

    return () => unsubscribe();
  }, [user]);

  // 🔥 계정 추가 → Firestore에 저장
  const handleAddAccount = async () => {
    if (!user) {
      toast({
        title: "로그인 필요",
        description: "먼저 Google 계정으로 로그인해주세요.",
        variant: "destructive"
      });
      return;
    }

    if (!name || !url) {
      toast({
        title: "입력 오류",
        description: "계정 이름과 URL을 모두 입력해주세요.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);

    try {
      let platform = "blog";
      let accountId = url;
      
      if (url.includes("twitter.com") || url.includes("x.com")) {
        platform = "twitter";
        // Twitter ID 추출 (간단 버전)
        const match = url.match(/twitter\.com\/([^\/\?]+)/) || url.match(/x\.com\/([^\/\?]+)/);
        accountId = match ? match[1] : url;
      } else if (url.includes("youtube.com")) {
        platform = "youtube";
        // YouTube 채널 ID 추출 (간단 버전)
        const match = url.match(/youtube\.com\/(channel|c|user)\/([^\/\?]+)/);
        accountId = match ? match[2] : url;
      }

      // Firestore에 저장
      await addDoc(collection(db, "subscriptions"), {
        userId: user.uid,
        platform,
        accountId,
        name,
        rssUrl: url,
        lastSyncedAt: null,
        createdAt: serverTimestamp()
      });

      setName("");
      setUrl("");
      
      toast({
        title: "계정 추가 완료",
        description: `${name} 계정이 추가되었습니다.`
      });
    } catch (error) {
      console.error("계정 추가 실패:", error);
      toast({
        title: "추가 실패",
        description: "계정 추가에 실패했습니다.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  // 🔥 계정 삭제
  const handleDeleteAccount = async (accountId: string, accountName: string) => {
    if (!window.confirm(`"${accountName}" 계정을 삭제하시겠습니까?`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, "subscriptions", accountId));
      toast({
        title: "삭제 완료",
        description: `${accountName} 계정이 삭제되었습니다.`
      });
    } catch (error) {
      console.error("삭제 실패:", error);
      toast({
        title: "삭제 실패",
        description: "계정 삭제에 실패했습니다.",
        variant: "destructive"
      });
    }
  };

  // 🔥 Google 로그인/로그아웃 처리
  const handleGoogleLogin = async () => {
    if (user) {
      // 로그아웃
      try {
        await signOut(auth);
        toast({
          title: "로그아웃 완료",
          description: "안전하게 로그아웃되었습니다."
        });
      } catch (error) {
        console.error("로그아웃 실패:", error);
        toast({
          title: "오류",
          description: "로그아웃에 실패했습니다.",
          variant: "destructive"
        });
      }
    } else {
      // 로그인
      try {
        await signInWithPopup(auth, googleProvider);
        toast({
          title: "로그인 성공",
          description: "환영합니다!"
        });
      } catch (error) {
        console.error("로그인 실패:", error);
        toast({
          title: "로그인 실패",
          description: "다시 시도해주세요.",
          variant: "destructive"
        });
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Settings className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-foreground">설정 및 계정 관리</h2>
          <p className="text-sm text-muted-foreground">팔로우할 계정을 추가하고 관리하세요</p>
        </div>
      </div>

      {/* Google Login */}
      <Card className="p-4 md:p-6 shadow-[var(--shadow-card)] bg-gradient-to-br from-rose-50 to-rose-100 dark:from-rose-950/20 dark:to-rose-900/20 border-rose-200 dark:border-rose-800">
        <h3 className="text-base font-semibold text-foreground mb-3">Google 계정 연동</h3>
        {user ? (
          <div className="mb-4 flex items-center gap-3">
            <Avatar>
              <AvatarImage src={user.photoURL || ""} />
              <AvatarFallback>{user.displayName?.[0] || "U"}</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">{user.displayName}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
            </div>
          </div>
        ) : (
          <p className="text-xs md:text-sm text-muted-foreground mb-4">
            Google 계정을 연동하여 더 많은 기능을 이용하세요
          </p>
        )}
        <Button 
          onClick={handleGoogleLogin}
          className="w-full bg-rose-500 hover:bg-rose-600 text-white"
        >
          {user ? "로그아웃" : "Google 로그인 / 연동"}
        </Button>
      </Card>

      {/* Add Account Section */}
      {user && (
        <Card className="p-4 md:p-6 shadow-[var(--shadow-card)]">
          <h3 className="text-base font-semibold text-foreground mb-4">새 계정 추가</h3>
          <div className="space-y-3">
            <Input
              type="text"
              placeholder="계정 이름 (예: 아티스트_공식)"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full"
              disabled={loading}
            />
            <Input
              type="url"
              placeholder="계정 URL (Twitter, YouTube, Blog 등)"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full"
              disabled={loading}
            />
            <Button 
              onClick={handleAddAccount} 
              className="w-full gap-2"
              disabled={loading}
            >
              <Plus className="h-4 w-4" />
              {loading ? "추가 중..." : "추가하기"}
            </Button>
          </div>
        </Card>
      )}

      {/* Followed Accounts */}
      {user && (
        <div>
          <h3 className="text-base md:text-lg font-semibold text-foreground mb-4">
            팔로우 중인 계정 ({accounts.length})
          </h3>
          {accounts.length === 0 ? (
            <Card className="p-8 md:p-12 text-center">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/30" />
              <h4 className="text-lg font-medium text-foreground mb-2">등록된 계정이 없습니다</h4>
              <p className="text-sm text-muted-foreground">
                위에서 계정을 추가하여 피드를 구성하세요
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
              {accounts.map((account) => {
                const Icon = account.platform === "twitter" ? Twitter : account.platform === "youtube" ? Youtube : Rss;
                const iconColor = account.platform === "twitter" ? "text-blue-500" : account.platform === "youtube" ? "text-red-500" : "text-green-500";
                
                return (
                  <Card key={account.id} className="p-4 shadow-[var(--shadow-card)] hover:shadow-[var(--shadow-elevated)] transition-[var(--transition-smooth)]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-full bg-muted ${iconColor}`}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm md:text-base text-foreground truncate">
                            {account.name}
                          </h4>
                          <a 
                            href={account.rssUrl} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-xs text-blue-500 hover:underline truncate block"
                          >
                            바로가기
                          </a>
                        </div>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 shrink-0"
                        onClick={() => handleDeleteAccount(account.id!, account.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AccountManagement;