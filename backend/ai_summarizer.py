"""
AI 요약 및 일정 추출 모듈
OpenAI API를 사용하여 게시물을 분석합니다.
"""

import json
from datetime import datetime
from openai import OpenAI
from config import config


class AISummarizer:
    """AI 요약 및 일정 추출 클래스"""
    
    def __init__(self):
        """OpenAI 클라이언트 초기화"""
        if not config.OPENAI_API_KEY:
            raise ValueError("OPENAI_API_KEY가 설정되지 않았습니다!")
        
        # API 키를 환경변수로 설정
        import os
        os.environ['OPENAI_API_KEY'] = config.OPENAI_API_KEY
        
        # 클라이언트 초기화 (api_key 파라미터 없이)
        self.client = OpenAI()
        self.model = "gpt-4o-mini"  # 저렴하고 빠른 모델
        print("✅ OpenAI 클라이언트 초기화 완료!")
    
    def analyze_post(self, post_data):
        """
        게시물 분석:
        1. 요약 생성
        2. 일정 날짜 추출
        
        Args:
            post_data (dict): 게시물 데이터 (title, content, url 등)
            
        Returns:
            dict: 분석 결과 {summary, hasSchedule, scheduleDate}
        """
        try:
            # 게시물 내용 준비
            title = post_data.get('title', '')
            content = post_data.get('content', '')
            url = post_data.get('url', '')
            
            # HTML 태그 제거 (간단 버전)
            content = self._clean_html(content)
            
            # 너무 긴 내용은 잘라내기 (비용 절감)
            max_length = 2000
            if len(content) > max_length:
                content = content[:max_length] + "..."
            
            # 프롬프트 생성
            prompt = self._create_prompt(title, content)
            
            # OpenAI API 호출
            print(f"🤖 AI 분석 중: {title[:30]}...")
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {
                        "role": "system",
                        "content": "당신은 소셜 미디어 게시물을 분석하는 전문가입니다. 간결하고 정확하게 요약하고, 이벤트 날짜를 추출합니다."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format={"type": "json_object"},  # JSON 형식 강제
                temperature=0.3,  # 일관된 결과를 위해 낮은 온도
            )
            
            # 응답 파싱
            result = json.loads(response.choices[0].message.content)
            
            print(f"✅ 분석 완료: 일정 {'있음' if result.get('hasSchedule') else '없음'}")
            
            return result
            
        except Exception as e:
            print(f"❌ AI 분석 실패: {e}")
            # 실패시 기본값 반환
            return {
                "summary": post_data.get('title', '요약 실패')[:100],
                "hasSchedule": False,
                "scheduleDate": None
            }
    
    def _create_prompt(self, title, content):
        """
        OpenAI용 프롬프트 생성
        
        Args:
            title (str): 게시물 제목
            content (str): 게시물 내용
            
        Returns:
            str: 프롬프트
        """
        today = datetime.now().strftime('%Y-%m-%d')
        
        prompt = f"""다음 게시물을 분석하세요:

제목: {title}
내용: {content}

다음 형식의 JSON으로 반환하세요:
{{
  "summary": "게시물 요약 (한글 100자 이내, 핵심만)",
  "hasSchedule": true 또는 false,
  "scheduleDate": "YYYY-MM-DD" 또는 null
}}

일정 감지 규칙:
- 콘서트, 팬미팅, 공연, 컴백, 앨범 발매, 방송, 라이브, 이벤트 등
- 구체적인 날짜가 명시된 경우만 true
- 오늘 날짜: {today}
- "다음주", "이번주" 등의 상대적 표현은 계산해서 날짜로 변환
- "3월 15일" → "2025-03-15"
- "12/25" → "2025-12-25"
- 날짜가 모호하거나 없으면 hasSchedule: false

예시:
- "3월 15일 콘서트 개최" → hasSchedule: true, scheduleDate: "2025-03-15"
- "곧 컴백합니다" → hasSchedule: false, scheduleDate: null
- "12월 25일 크리스마스 앨범 발매" → hasSchedule: true, scheduleDate: "2025-12-25"
"""
        return prompt
    
    def _clean_html(self, text):
        """
        HTML 태그 제거 (간단 버전)
        
        Args:
            text (str): HTML 포함 텍스트
            
        Returns:
            str: 태그 제거된 텍스트
        """
        import re
        
        # HTML 태그 제거
        text = re.sub(r'<[^>]+>', '', text)
        
        # 연속된 공백/줄바꿈 정리
        text = re.sub(r'\s+', ' ', text)
        
        return text.strip()
    
    def analyze_batch(self, posts_list, show_progress=True):
        """
        여러 게시물을 배치로 분석
        
        Args:
            posts_list (list): 게시물 리스트
            show_progress (bool): 진행상황 표시 여부
            
        Returns:
            list: 분석 결과가 추가된 게시물 리스트
        """
        analyzed_posts = []
        total = len(posts_list)
        
        for idx, post in enumerate(posts_list, 1):
            if show_progress:
                print(f"\n[{idx}/{total}] 분석 중...")
            
            # AI 분석 실행
            analysis = self.analyze_post(post)
            
            # 분석 결과를 게시물 데이터에 추가
            post['summary'] = analysis.get('summary', post.get('title', '')[:100])
            post['hasSchedule'] = analysis.get('hasSchedule', False)
            post['scheduleDate'] = analysis.get('scheduleDate')
            
            analyzed_posts.append(post)
        
        print(f"\n📊 총 {total}개 게시물 분석 완료")
        print(f"📅 일정 있는 게시물: {sum(1 for p in analyzed_posts if p.get('hasSchedule'))}개")
        
        return analyzed_posts


# 싱글톤 인스턴스
ai_summarizer = AISummarizer()