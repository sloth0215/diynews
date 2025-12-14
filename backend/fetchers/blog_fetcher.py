"""
블로그 Fetcher (네이버, 티스토리, Medium 등)
RSS 기반 블로그 플랫폼 지원
"""

import re
import feedparser
from datetime import datetime
from dateutil import parser as date_parser
from fetchers.base_fetcher import BaseFetcher


class BlogFetcher(BaseFetcher):
    """블로그 RSS Fetcher"""
    
    def can_handle(self, url: str) -> bool:
        """블로그 URL인지 확인"""
        blog_domains = [
            'blog.naver.com',
            'tistory.com',
            'medium.com',
            'brunch.co.kr',
            'velog.io'
        ]
        return any(domain in url for domain in blog_domains)
    
    def convert_to_rss_url(self, url: str) -> str:
        """
        블로그 URL을 RSS 피드 URL로 변환
        
        Args:
            url (str): 원본 URL
            
        Returns:
            str: RSS 피드 URL
        """
        # 이미 RSS URL이면 그대로
        if '/rss' in url.lower() or url.endswith('.xml'):
            return url
        
        # 네이버 블로그
        if 'blog.naver.com' in url:
            match = re.search(r'blog\.naver\.com/([^/\?]+)', url)
            if match:
                blog_id = match.group(1)
                rss_url = f"https://rss.blog.naver.com/{blog_id}.xml"
                print(f"🔄 네이버 블로그 RSS: {rss_url}")
                return rss_url
        
        # 티스토리
        elif 'tistory.com' in url:
            base_url = url.rstrip('/')
            if not base_url.endswith('/rss'):
                rss_url = f"{base_url}/rss"
                print(f"🔄 티스토리 RSS: {rss_url}")
                return rss_url
        
        # Medium
        elif 'medium.com' in url:
            if '/@' in url:
                rss_url = url.replace('medium.com/', 'medium.com/feed/')
                print(f"🔄 Medium RSS: {rss_url}")
                return rss_url
        
        # Velog
        elif 'velog.io' in url:
            match = re.search(r'velog\.io/@([^/\?]+)', url)
            if match:
                username = match.group(1)
                rss_url = f"https://v2.velog.io/rss/@{username}"
                print(f"🔄 Velog RSS: {rss_url}")
                return rss_url
        
        print(f"ℹ️  RSS 자동 변환 불가: {url}")
        return url
    
    def fetch_feed(self, url: str) -> list:
        """
        블로그 RSS 피드 수집
        
        Args:
            url (str): 블로그 URL
            
        Returns:
            list: 게시물 리스트
        """
        try:
            # RSS URL 변환
            rss_url = self.convert_to_rss_url(url)
            print(f"🔍 피드 수집 중: {rss_url}")
            
            # RSS 파싱
            feed = feedparser.parse(rss_url)
            
            if feed.bozo:
                print(f"⚠️  피드 파싱 경고: {feed.bozo_exception}")
            
            if not feed.entries:
                print(f"❌ 게시물 없음: {rss_url}")
                return []
            
            # 게시물 필터링 (최근 N개만 처리)
            posts = []
            count = 0
            for entry in feed.entries:
                if count >= self.max_entries:
                    print(f"ℹ️  최대 {self.max_entries}개 도달, 나머지 생략")
                    break
                    
                post = self._parse_entry(entry)
                if post and self._is_recent(post):
                    posts.append(post)
                    count += 1
                elif post:
                    # 날짜가 7일 이전이면 중단 (RSS는 최신순이므로)
                    print(f"ℹ️  7일 이전 게시물 발견, 수집 중단")
                    break
            
            print(f"✅ {len(posts)}개 게시물 수집 완료")
            return posts
            
        except Exception as e:
            print(f"❌ 피드 수집 실패 ({url}): {e}")
            return []
    
    def _parse_entry(self, entry) -> dict:
        """
        RSS 엔트리를 게시물 데이터로 변환
        
        Args:
            entry: feedparser entry 객체
            
        Returns:
            dict: 게시물 데이터
        """
        try:
            post = {
                'title': entry.get('title', '제목 없음'),
                'url': entry.get('link', ''),
                'content': self._extract_content(entry),
                'published': self._extract_date(entry),
                'thumbnail': self._extract_thumbnail(entry)
            }
            return post
        except Exception as e:
            print(f"⚠️  엔트리 파싱 실패: {e}")
            return None
    
    def _extract_content(self, entry) -> str:
        """게시물 내용 추출"""
        if hasattr(entry, 'content') and entry.content:
            return entry.content[0].value
        elif hasattr(entry, 'summary'):
            return entry.summary
        elif hasattr(entry, 'description'):
            return entry.description
        else:
            return entry.get('title', '')
    
    def _extract_date(self, entry) -> datetime:
        """게시물 날짜 추출"""
        date_fields = ['published', 'updated', 'created']
        
        for field in date_fields:
            if hasattr(entry, field):
                try:
                    date_str = getattr(entry, field)
                    parsed_date = date_parser.parse(date_str)
                    
                    # timezone 제거
                    if parsed_date.tzinfo:
                        parsed_date = parsed_date.replace(tzinfo=None)
                    
                    return parsed_date
                except Exception as e:
                    continue
        
        # 날짜 없으면 None
        return None