import { useState, useEffect } from "react";
import { signInWithPopup, signOut, User, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "@/lib/firebase";
import { Button } from "@/components/ui/button";
import { LogIn, LogOut } from "lucide-react";

const LoginButton = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);

  // 로그인 상태 감지
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });

    return () => unsubscribe();
  }, []);

  // 구글 로그인
  const handleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      console.log("로그인 성공:", result.user);
    } catch (error) {
      console.error("로그인 실패:", error);
      alert("로그인에 실패했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 로그아웃
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("로그아웃 성공");
    } catch (error) {
      console.error("로그아웃 실패:", error);
    }
  };

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <img 
          src={user.photoURL || ""} 
          alt={user.displayName || "User"} 
          className="w-8 h-8 rounded-full"
        />
        <span className="text-sm font-medium">{user.displayName}</span>
        <Button 
          variant="outline" 
          size="sm"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          로그아웃
        </Button>
      </div>
    );
  }

  return (
    <Button 
      onClick={handleLogin}
      disabled={loading}
    >
      <LogIn className="w-4 h-4 mr-2" />
      {loading ? "로그인 중..." : "구글 로그인"}
    </Button>
  );
};

export default LoginButton;