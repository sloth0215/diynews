"""
Twitter Fetcher
Twitter API.io 전용 - extendedEntities에서 이미지 추출
"""

import re
import requests
from datetime import datetime
from dateutil import parser as date_parser
from fetchers.base_fetcher import BaseFetcher
from config import config


class TwitterFetcher(BaseFetcher):
    """Twitter Fetcher (Twitter API.io 전용)"""
    
    def __init__(self, days_to_fetch=None, max_entries=3):
        """초기화"""
        super().__init__(days_to_fetch, max_entries)
    
    def can_handle(self, url: str) -> bool:
        """트위터 URL인지 확인"""
        return 'twitter.com' in url or 'x.com' in url
    
    def _extract_username(self, url: str) -> str:
        """URL에서 트위터 사용자명 추출"""
        patterns = [
            r'(?:twitter\.com|x\.com)/([^/\?]+)',
        ]
        
        for pattern in patterns:
            match = re.search(pattern, url)
            if match:
                username = match.group(1)
                if username.startswith('@'):
                    username = username[1:]
                if username not in ['intent', 'i', 'home', 'explore', 'notifications']:
                    return username
        
        return None
    
    def fetch_feed(self, url: str) -> list:
        """
        트위터 피드 수집 (Twitter API.io 전용)
        
        Args:
            url (str): 트위터 URL
            
        Returns:
            list: 트윗 리스트
        """
        username = self._extract_username(url)
        
        if not username:
            print(f"ℹ️  트위터 사용자명 추출 실패: {url}")
            return []
        
        print(f"🐦 @{username} 트윗 수집 시작...")
        
        if not config.TWITTER_API_KEY:
            print(f"  ❌ Twitter API 키가 필요합니다")
            return []
        
        return self._fetch_via_api(username)
    

    def _fetch_via_api(self, username: str) -> list:
        """
        Twitter API.io를 사용하여 트윗 수집
        """
        try:
            print(f"  🔑 Twitter API.io 사용")
            
            headers = {
                'X-API-Key': config.TWITTER_API_KEY
            }
            
            api_url = 'https://api.twitterapi.io/twitter/user/last_tweets'
            params = {
                'userName': username,
                'count': 3
            }
            
            response = requests.get(api_url, headers=headers, params=params, timeout=10)
            
            print(f"  🔍 상태 코드: {response.status_code}")
            
            if response.status_code != 200:
                print(f"  ❌ API 오류: {response.status_code}")
                return []
            
            data = response.json()
            response_data = data.get('data', {})
            tweets = response_data.get('tweets', [])
            
            if not tweets:
                print(f"  ℹ️  트윗 없음")
                return []
            
            posts = []
            for tweet in tweets:
                # max_entries 도달하면 중단
                if len(posts) >= self.max_entries:
                    print(f"ℹ️  최대 {self.max_entries}개 수집 완료")
                    break
                
                post = self._parse_api_tweet(tweet, username)
                if post:
                    if self._is_recent(post):
                        posts.append(post)
                    else:
                        print(f"ℹ️  7일 이전 트윗 발견, 수집 중단")
                        break

            print(f"✅ {len(posts)}개 트윗 수집 완료")
            return posts
            
        except Exception as e:
            print(f"  ❌ Twitter API.io 오류: {e}")
            import traceback
            traceback.print_exc()
            return []

    
    def _parse_api_tweet(self, tweet: dict, username: str) -> dict:
        """
        Twitter API.io 트윗을 게시물 데이터로 변환
        """
        try:
            # 날짜 파싱
            created_at = tweet.get('createdAt')
            published = None
            
            if created_at:
                try:
                    published = date_parser.parse(created_at)
                    if published.tzinfo:
                        published = published.replace(tzinfo=None)
                except:
                    published = datetime.now()
            else:
                published = datetime.now()
            
            # URL 생성
            tweet_id = tweet.get('id', '')
            tweet_url = f"https://twitter.com/{username}/status/{tweet_id}" if tweet_id else ""
            
            # 텍스트
            tweet_text = tweet.get('text', '')
            
            # 🎯 이미지 추출: extendedEntities에서 직접 가져오기!
            thumbnail = None
            extended_entities = tweet.get('extendedEntities', {})
            media_list = extended_entities.get('media', [])
            
            if media_list:
                # 첫 번째 미디어의 이미지 URL 가져오기
                first_media = media_list[0]
                media_url_https = first_media.get('media_url_https')
                
                if media_url_https:
                    thumbnail = media_url_https
                    print(f"    ✅ 이미지 추출 (extendedEntities): {thumbnail[:60]}...")
                else:
                    print(f"    ⚠️  media_url_https 없음")
            else:
                print(f"    ℹ️  미디어 없음")
            
            post = {
                'title': f"@{username} 트윗",
                'url': tweet_url,
                'content': tweet_text,
                'published': published,
                'thumbnail': thumbnail
            }
            
            return post
            
        except Exception as e:
            print(f"  ⚠️  트윗 파싱 실패: {e}")
            return None