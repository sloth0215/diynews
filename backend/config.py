"""
설정 관리 모듈
환경변수를 로드하고 애플리케이션 설정을 관리합니다.
"""

import os
from dotenv import load_dotenv
from pathlib import Path

# .env 파일 로드
env_path = Path(__file__).parent / '.env'
load_dotenv(dotenv_path=env_path)


class Config:
    """애플리케이션 설정 클래스"""
    
    # OpenAI 설정
    OPENAI_API_KEY = os.getenv('OPENAI_API_KEY')
    
    # YouTube 설정
    YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', '')
    
    # Twitter 설정
    TWITTER_API_KEY = os.getenv('TWITTER_API_KEY', '')
    
    # Firebase 설정
    FIREBASE_CREDENTIALS_PATH = os.getenv('FIREBASE_CREDENTIALS_PATH', 'serviceAccountKey.json')
    FIREBASE_PROJECT_ID = os.getenv('FIREBASE_PROJECT_ID', 'diynews-4ab48')
    
    # RSS 수집 설정
    DAYS_TO_FETCH = int(os.getenv('DAYS_TO_FETCH', 7))  # 최근 7일
    
    @classmethod
    def validate(cls):
        """
        필수 설정값이 있는지 검증
        """
        if not cls.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다. .env 파일을 확인하세요.")
        
        credentials_path = Path(__file__).parent / cls.FIREBASE_CREDENTIALS_PATH
        if not credentials_path.exists():
            raise ValueError(f"Firebase 서비스 계정 키 파일을 찾을 수 없습니다: {credentials_path}")
        
        print("✅ 설정 검증 완료!")
        return True


# 설정 인스턴스 생성
config = Config()