"""
메인 동기화 스크립트
RSS 피드 수집 → AI 분석 → Firebase 저장 전체 프로세스 실행
"""

from datetime import datetime
from config import config
from firebase_client import firebase_client
from rss_fetcher import rss_fetcher
from ai_summarizer import ai_summarizer


def main():
    """메인 동기화 프로세스"""
    
    print("=" * 60)
    print("🚀 DIY News 동기화 시작")
    print(f"⏰ 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)
    
    try:
        # 1️⃣ 설정 검증
        print("\n[1/5] 설정 검증 중...")
        config.validate()
        
        # 2️⃣ Firebase에서 구독 목록 가져오기
        print("\n[2/5] 구독 목록 가져오는 중...")
        subscriptions = firebase_client.get_subscriptions()
        
        if not subscriptions:
            print("⚠️  구독 계정이 없습니다. 먼저 계정을 추가하세요.")
            return
        
        # 3️⃣ RSS 피드 수집
        print("\n[3/5] RSS 피드 수집 중...")
        all_posts = rss_fetcher.fetch_multiple_feeds(subscriptions)
        
        # 수집된 게시물을 하나의 리스트로 합치기
        posts_to_process = []
        for sub_id, posts in all_posts.items():
            posts_to_process.extend(posts)
        
        if not posts_to_process:
            print("ℹ️  새로운 게시물이 없습니다.")
            return
        
        print(f"\n📊 총 {len(posts_to_process)}개 게시물 수집됨")
        
        # 4️⃣ 중복 체크 (이미 저장된 게시물 제외)
        print("\n[4/5] 중복 게시물 확인 중...")
        existing_urls = firebase_client.get_existing_post_urls()
        
        new_posts = [
            post for post in posts_to_process 
            if post.get('url') not in existing_urls
        ]
        
        print(f"🆕 새 게시물: {len(new_posts)}개 (중복 제외: {len(posts_to_process) - len(new_posts)}개)")
        
        if not new_posts:
            print("ℹ️  저장할 새 게시물이 없습니다.")
            return
        
        # 5️⃣ AI 분석 (요약 + 일정 추출)
        print("\n[5/5] AI 분석 중...")
        analyzed_posts = ai_summarizer.analyze_batch(new_posts)
        
        # 6️⃣ Firebase에 저장
        print("\n[6/6] Firebase에 저장 중...")
        
        # 게시물 데이터 정리
        for post in analyzed_posts:
            # publishedAt 형식 변환
            if 'published' in post:
                published = post['published']
                if isinstance(published, datetime):
                    post['publishedAt'] = published.isoformat()
                else:
                    post['publishedAt'] = str(published)
            
            # userId 추가 (subscription에서 가져오기)
            # accountId로 subscription 찾기
            for sub in subscriptions:
                if sub.get('accountId') == post.get('accountId'):
                    post['userId'] = sub.get('userId')
                    break
            
            # 필요없는 필드 제거
            post.pop('published', None)
            # subscription_id는 유지하지 않음 (accountId로 충분)
        
        # 배치 저장
        saved_count = firebase_client.save_posts_batch(analyzed_posts)
        
        # 7️⃣ 구독 동기화 시간 업데이트
        for sub_id in all_posts.keys():
            firebase_client.update_subscription_sync_time(sub_id)
        
        # 완료 메시지
        print("\n" + "=" * 60)
        print("✅ 동기화 완료!")
        print(f"📥 수집: {len(posts_to_process)}개")
        print(f"🆕 새 게시물: {len(new_posts)}개")
        print(f"💾 저장: {saved_count}개")
        print(f"📅 일정 감지: {sum(1 for p in analyzed_posts if p.get('hasSchedule'))}개")
        print(f"⏰ 종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
    except KeyboardInterrupt:
        print("\n\n⚠️  사용자에 의해 중단되었습니다.")
    except Exception as e:
        print(f"\n\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()