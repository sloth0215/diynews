"""
Firebase 클라이언트 모듈
Firestore 데이터베이스와 상호작용합니다.
"""

import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime
from pathlib import Path
from config import config


class FirebaseClient:
    """Firebase Firestore 클라이언트 클래스"""
    
    def __init__(self):
        """Firebase 초기화"""
        if not firebase_admin._apps:
            # 서비스 계정 키 파일 경로
            cred_path = Path(__file__).parent / config.FIREBASE_CREDENTIALS_PATH
            cred = credentials.Certificate(str(cred_path))
            
            # Firebase 앱 초기화
            firebase_admin.initialize_app(cred)
        
        # Firestore 클라이언트
        self.db = firestore.client()
        print("✅ Firebase 초기화 완료!")
    
    def get_subscriptions(self, user_id=None):
        """
        구독 목록 가져오기
        
        Args:
            user_id (str, optional): 특정 사용자 ID. None이면 모든 구독 가져오기
            
        Returns:
            list: 구독 정보 리스트
        """
        try:
            subscriptions_ref = self.db.collection('subscriptions')
            
            # 특정 사용자 필터링 (선택사항)
            if user_id:
                query = subscriptions_ref.where('userId', '==', user_id)
            else:
                query = subscriptions_ref
            
            # 구독 목록 가져오기
            docs = query.stream()
            
            subscriptions = []
            for doc in docs:
                data = doc.to_dict()
                data['id'] = doc.id
                subscriptions.append(data)
            
            print(f"📋 {len(subscriptions)}개 구독 계정 발견")
            return subscriptions
            
        except Exception as e:
            print(f"❌ 구독 목록 가져오기 실패: {e}")
            return []
    
    def get_existing_post_urls(self):
        """
        이미 저장된 게시물 URL 목록 가져오기 (중복 체크용)
        
        Returns:
            set: 게시물 URL 집합
        """
        try:
            posts_ref = self.db.collection('posts')
            docs = posts_ref.stream()
            
            # URL만 추출하여 set으로 저장
            existing_urls = {doc.to_dict().get('url') for doc in docs if doc.to_dict().get('url')}
            
            print(f"🔍 기존 게시물 {len(existing_urls)}개 확인")
            return existing_urls
            
        except Exception as e:
            print(f"❌ 기존 게시물 확인 실패: {e}")
            return set()
    
    def save_post(self, post_data):
        """
        게시물을 Firestore에 저장
        
        Args:
            post_data (dict): 저장할 게시물 데이터
            
        Returns:
            bool: 저장 성공 여부
        """
        try:
            # 필수 필드 확인
            required_fields = ['title', 'url', 'platform', 'author']
            for field in required_fields:
                if field not in post_data:
                    print(f"❌ 필수 필드 누락: {field}")
                    return False
            
            # createdAt 타임스탬프 추가
            post_data['createdAt'] = datetime.now().isoformat()
            
            # 일정 정보 디버깅
            if post_data.get('hasSchedule'):
                print(f"  📅 일정 있음: {post_data.get('scheduleDate')} - {post_data['title'][:30]}...")
            
            # Firestore에 저장
            posts_ref = self.db.collection('posts')
            posts_ref.add(post_data)
            
            print(f"✅ 저장 완료: {post_data['title'][:30]}...")
            return True
            
        except Exception as e:
            print(f"❌ 게시물 저장 실패: {e}")
            return False
    
    def save_posts_batch(self, posts_list):
        """
        여러 게시물을 한 번에 저장
        
        Args:
            posts_list (list): 저장할 게시물 리스트
            
        Returns:
            int: 저장 성공한 게시물 개수
        """
        success_count = 0
        
        for post in posts_list:
            if self.save_post(post):
                success_count += 1
        
        print(f"📊 총 {len(posts_list)}개 중 {success_count}개 저장 성공")
        return success_count
    
    def update_subscription_sync_time(self, subscription_id):
        """
        구독 계정의 마지막 동기화 시간 업데이트
        
        Args:
            subscription_id (str): 구독 ID
        """
        try:
            sub_ref = self.db.collection('subscriptions').document(subscription_id)
            sub_ref.update({
                'lastSyncedAt': datetime.now().isoformat()
            })
            print(f"🔄 동기화 시간 업데이트: {subscription_id}")
            
        except Exception as e:
            print(f"❌ 동기화 시간 업데이트 실패: {e}")


# 싱글톤 인스턴스
firebase_client = FirebaseClient()