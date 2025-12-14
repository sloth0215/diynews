"""
YouTube Fetcher
유튜브 채널 RSS 지원
"""

import re
import feedparser
from datetime import datetime
from dateutil import parser as date_parser
from fetchers.base_fetcher import BaseFetcher


class YouTubeFetcher(BaseFetcher):
    """YouTube RSS Fetcher"""
    
    def can_handle(self, url: str) -> bool:
        """유튜브 URL인지 확인"""
        return 'youtube.com' in url or 'youtu.be' in url
    
    def convert_to_rss_url(self, url: str) -> str:
        """
        유튜브 URL을 RSS 피드 URL로 변환
        
        Args:
            url (str): 유튜브 URL
            
        Returns:
            str: RSS 피드 URL
        """
        # 채널 ID 형식
        if '/channel/' in url:
            match = re.search(r'/channel/([^/\?]+)', url)
            if match:
                channel_id = match.group(1)
                rss_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
                print(f"🔄 유튜브 RSS: {rss_url}")
                return rss_url
        
        # @사용자명 형식 → 채널 ID 자동 추출
        elif '/@' in url:
            match = re.search(r'/@([^/\?]+)', url)
            if match:
                username = match.group(1)
                print(f"🔍 @{username} 채널 ID 찾는 중...")
                
                # 채널 ID 추출 시도
                channel_id = self._get_channel_id_from_username(username)
                
                if channel_id:
                    rss_url = f"https://www.youtube.com/feeds/videos.xml?channel_id={channel_id}"
                    print(f"✅ 채널 ID 찾음: {channel_id}")
                    print(f"🔄 유튜브 RSS: {rss_url}")
                    return rss_url
                else:
                    print(f"❌ 채널 ID를 찾을 수 없습니다: @{username}")
                    return None
        
        print(f"ℹ️  유튜브 RSS 변환 불가: {url}")
        return url
    
    def _get_channel_id_from_username(self, username: str) -> str:
        """
        @사용자명에서 채널 ID 추출
        
        Args:
            username (str): 유튜브 사용자명
            
        Returns:
            str: 채널 ID (찾지 못하면 None)
        """
        from config import config
        
        # 방법 1: YouTube Data API (우선)
        if config.YOUTUBE_API_KEY:
            try:
                print(f"  🔑 YouTube API 사용")
                from googleapiclient.discovery import build
                
                youtube = build('youtube', 'v3', developerKey=config.YOUTUBE_API_KEY)
                
                # @사용자명으로 검색
                request = youtube.search().list(
                    part='snippet',
                    q=f'@{username}',
                    type='channel',
                    maxResults=1
                )
                response = request.execute()
                
                if response.get('items'):
                    channel_id = response['items'][0]['snippet']['channelId']
                    return channel_id
                
                print(f"  ⚠️  API 검색 결과 없음")
                
            except Exception as e:
                print(f"  ⚠️  YouTube API 오류: {e}")
                print(f"  → 웹 스크래핑 방식으로 재시도...")
        
        # 방법 2: 웹 스크래핑 (폴백)
        try:
            print(f"  🌐 웹 스크래핑 사용")
            import requests
            
            # 유튜브 채널 페이지 요청
            url = f"https://www.youtube.com/@{username}"
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            
            response = requests.get(url, headers=headers, timeout=10)
            
            if response.status_code != 200:
                print(f"  ⚠️  페이지 로드 실패: {response.status_code}")
                return None
            
            # 채널 ID 추출 (여러 패턴 시도)
            patterns = [
                r'"channelId":"([^"]+)"',
                r'"externalId":"([^"]+)"',
                r'/channel/([A-Za-z0-9_-]+)',
            ]
            
            for pattern in patterns:
                match = re.search(pattern, response.text)
                if match:
                    return match.group(1)
            
            print(f"  ⚠️  채널 ID 패턴을 찾을 수 없음")
            return None
            
        except Exception as e:
            print(f"  ⚠️  채널 ID 추출 실패: {e}")
            return None
    
    def fetch_feed(self, url: str) -> list:
        """
        유튜브 RSS 피드 수집
        
        Args:
            url (str): 유튜브 URL
            
        Returns:
            list: 비디오 리스트
        """
        try:
            # RSS URL 변환
            rss_url = self.convert_to_rss_url(url)
            
            if not rss_url:
                return []
            
            print(f"🔍 피드 수집 중: {rss_url}")
            
            # RSS 파싱
            feed = feedparser.parse(rss_url)
            
            if feed.bozo:
                print(f"⚠️  피드 파싱 경고: {feed.bozo_exception}")
            
            if not feed.entries:
                print(f"❌ 비디오 없음: {rss_url}")
                return []
            
            # 비디오 필터링 (최근 N개만 처리)
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
                    # 날짜가 7일 이전이면 중단
                    print(f"ℹ️  7일 이전 비디오 발견, 수집 중단")
                    break
            
            print(f"✅ {len(posts)}개 비디오 수집 완료")
            return posts
            
        except Exception as e:
            print(f"❌ 피드 수집 실패 ({url}): {e}")
            return []
    
    def _parse_entry(self, entry) -> dict:
        """
        RSS 엔트리를 비디오 데이터로 변환
        
        Args:
            entry: feedparser entry 객체
            
        Returns:
            dict: 비디오 데이터
        """
        try:
            # 유튜브 특화 필드 추출
            video_id = None
            if hasattr(entry, 'yt_videoid'):
                video_id = entry.yt_videoid
            elif hasattr(entry, 'id'):
                # yt:video:VIDEO_ID 형식
                video_id = entry.id.split(':')[-1]
            
            # 썸네일 (유튜브 기본 썸네일)
            thumbnail = None
            if video_id:
                thumbnail = f"https://i.ytimg.com/vi/{video_id}/mqdefault.jpg"
            
            post = {
                'title': entry.get('title', '제목 없음'),
                'url': entry.get('link', ''),
                'content': self._extract_description(entry),
                'published': self._extract_date(entry),
                'thumbnail': thumbnail,
                'video_id': video_id
            }
            return post
        except Exception as e:
            print(f"⚠️  엔트리 파싱 실패: {e}")
            return None
    
    def _extract_description(self, entry) -> str:
        """비디오 설명 추출"""
        if hasattr(entry, 'media_description'):
            return entry.media_description
        elif hasattr(entry, 'summary'):
            return entry.summary
        elif hasattr(entry, 'description'):
            return entry.description
        else:
            return entry.get('title', '')
    
    def _extract_date(self, entry) -> datetime:
        """비디오 업로드 날짜 추출"""
        date_fields = ['published', 'updated']
        
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
        
        return None