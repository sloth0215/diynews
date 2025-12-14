"""
RSS 피드 통합 관리자
플랫폼별 Fetcher를 자동으로 선택하여 실행
"""

# 수정
from fetchers.blog_fetcher import BlogFetcher
from fetchers.youtube_fetcher import YouTubeFetcher
from fetchers.twitter_fetcher import TwitterFetcher
from config import config


class RSSFetcher:
    """RSS 피드 통합 관리 클래스"""
    
    def __init__(self, days_to_fetch=None, max_entries=3):
        """
        Args:
            days_to_fetch (int): 수집할 최근 일수
            max_entries (int): 최대 수집 게시물 수
        """
        self.max_entries = max_entries
        self.days_to_fetch = days_to_fetch or config.DAYS_TO_FETCH
        
        # 플랫폼별 Fetcher 등록
        self.fetchers = [
        BlogFetcher(self.days_to_fetch, self.max_entries),
        YouTubeFetcher(self.days_to_fetch, self.max_entries),
        TwitterFetcher(self.days_to_fetch, self.max_entries),
           
        ]
        
        print(f"✅ {len(self.fetchers)}개 플랫폼 Fetcher 초기화 완료")
    
    def fetch_feed(self, url: str) -> list:
        """
        URL에 맞는 Fetcher를 찾아서 피드 수집
        
        Args:
            url (str): 피드 URL
            
        Returns:
            list: 게시물 리스트
        """
        # 적합한 Fetcher 찾기
        for fetcher in self.fetchers:
            if fetcher.can_handle(url):
                return fetcher.fetch_feed(url)
        
        # 처리할 수 없는 URL
        print(f"❌ 지원하지 않는 플랫폼: {url}")
        return []
    
    def fetch_multiple_feeds(self, subscriptions: list) -> dict:
        """
        여러 구독의 피드를 한 번에 수집
        
        Args:
            subscriptions (list): 구독 정보 리스트
            
        Returns:
            dict: {subscription_id: [posts]} 형태
        """
        all_posts = {}
        
        for sub in subscriptions:
            sub_id = sub.get('id')
            rss_url = sub.get('rssUrl')
            
            if not rss_url:
                print(f"⚠️  RSS URL 없음: {sub.get('name')}")
                continue
            
            print(f"\n📡 [{sub.get('name')}] 수집 시작...")
            posts = self.fetch_feed(rss_url)
            
            # 구독 정보 추가
            for post in posts:
                post['subscription_id'] = sub_id
                post['platform'] = sub.get('platform', 'blog')
                post['author'] = sub.get('name')
                post['accountId'] = sub.get('accountId')
            
            all_posts[sub_id] = posts
        
        # 통계
        total_posts = sum(len(posts) for posts in all_posts.values())
        print(f"\n📊 총 {len(subscriptions)}개 피드에서 {total_posts}개 게시물 수집 완료")
        
        return all_posts
    
   # ✅ 클래스 밖! (들여쓰기 없음)
rss_fetcher = RSSFetcher()