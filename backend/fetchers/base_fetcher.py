"""
기본 Fetcher 클래스
모든 플랫폼 Fetcher의 부모 클래스
"""

from datetime import datetime, timedelta
from dateutil import parser as date_parser
from abc import ABC, abstractmethod


class BaseFetcher(ABC):
    """모든 Fetcher의 기본 클래스"""
    
    def __init__(self, days_to_fetch=7, max_entries=10):
        """
        Args:
            days_to_fetch (int): 수집할 최근 일수
            max_entries (int): 최대 수집 게시물 수
        """
        self.days_to_fetch = days_to_fetch
        self.max_entries = max_entries
        now = datetime.now()
        if now.tzinfo:
            now = now.replace(tzinfo=None)
        self.cutoff_date = now - timedelta(days=self.days_to_fetch)
        print(f"📅 {self.days_to_fetch}일 이내 게시물 최대 {self.max_entries}개 수집")
    
    @abstractmethod
    def can_handle(self, url: str) -> bool:
        """
        이 Fetcher가 해당 URL을 처리할 수 있는지 확인
        
        Args:
            url (str): 확인할 URL
            
        Returns:
            bool: 처리 가능 여부
        """
        pass
    
    @abstractmethod
    def fetch_feed(self, url: str) -> list:
        """
        피드를 수집하여 게시물 리스트 반환
        
        Args:
            url (str): 피드 URL
            
        Returns:
            list: 게시물 리스트
        """
        pass
    
    def _is_recent(self, post: dict) -> bool:
        """
        게시물이 최근 N일 이내인지 확인
        
        Args:
            post (dict): 게시물 데이터
            
        Returns:
            bool: 최근 게시물 여부
        """
        try:
            published = post.get('published')
            
            if not published:
                print(f"  ⚠️  날짜 없음 → 제외: {post.get('title', '')[:40]}...")
                return False
            
            if isinstance(published, str):
                published = date_parser.parse(published)
                if published.tzinfo:
                    published = published.replace(tzinfo=None)
            
            # 날짜만 비교
            published_date = published.date()
            cutoff_date = self.cutoff_date.date()
            
            is_recent = published_date >= cutoff_date
            
            if not is_recent:
                print(f"  🚫 오래됨 ({published_date} < {cutoff_date}): {post.get('title', '')[:40]}...")
            else:
                print(f"  ✅ 최근 ({published_date} >= {cutoff_date}): {post.get('title', '')[:40]}...")
            
            return is_recent
            
        except Exception as e:
            print(f"  ⚠️  에러 → 제외: {e}")
            return False
    
    def _extract_thumbnail(self, entry) -> str:
        """
        썸네일 이미지 URL 추출 (RSS 공통)
        
        Args:
            entry: feedparser entry 객체
            
        Returns:
            str: 이미지 URL (없으면 None)
        """
        # media:thumbnail 태그
        if hasattr(entry, 'media_thumbnail') and entry.media_thumbnail:
            return entry.media_thumbnail[0].get('url')
        
        # enclosure
        if hasattr(entry, 'enclosures') and entry.enclosures:
            for enc in entry.enclosures:
                if 'image' in enc.get('type', ''):
                    return enc.get('href')
        
        return None