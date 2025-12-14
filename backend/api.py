"""
Flask API 서버
프론트엔드에서 동기화 요청을 받아 처리합니다.
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import threading

# 동기화 모듈 import
from config import config
from firebase_client import firebase_client
from rss_fetcher import rss_fetcher
from ai_summarizer import ai_summarizer

app = Flask(__name__)
CORS(app)  # CORS 허용 (프론트엔드에서 호출 가능하게)

# 동기화 상태 저장
sync_status = {
    'is_running': False,
    'last_run': None,
    'last_result': None,
    'error': None
}


def run_sync():
    """동기화 실행 (백그라운드)"""
    global sync_status
    
    try:
        sync_status['is_running'] = True
        sync_status['error'] = None
        
        print("\n" + "=" * 60)
        print("🚀 DIY News 동기화 시작 (API)")
        print(f"⏰ 시작 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        # 1️⃣ 설정 검증
        print("\n[1/5] 설정 검증 중...")
        config.validate()
        
        # 2️⃣ Firebase에서 구독 목록 가져오기
        print("\n[2/5] 구독 목록 가져오는 중...")
        subscriptions = firebase_client.get_subscriptions()
        
        if not subscriptions:
            result = {
                'success': False,
                'message': '구독 계정이 없습니다.',
                'stats': {}
            }
            sync_status['last_result'] = result
            sync_status['is_running'] = False
            return result
        
        # 3️⃣ RSS 피드 수집
        print("\n[3/5] RSS 피드 수집 중...")
        all_posts = rss_fetcher.fetch_multiple_feeds(subscriptions)
        
        posts_to_process = []
        for sub_id, posts in all_posts.items():
            posts_to_process.extend(posts)
        
        if not posts_to_process:
            result = {
                'success': True,
                'message': '새로운 게시물이 없습니다.',
                'stats': {
                    'collected': 0,
                    'new': 0,
                    'saved': 0,
                    'schedules': 0
                }
            }
            sync_status['last_result'] = result
            sync_status['is_running'] = False
            return result
        
        print(f"\n📊 총 {len(posts_to_process)}개 게시물 수집됨")
        
        # 4️⃣ 중복 체크
        print("\n[4/5] 중복 게시물 확인 중...")
        existing_urls = firebase_client.get_existing_post_urls()
        
        new_posts = [
            post for post in posts_to_process 
            if post.get('url') not in existing_urls
        ]
        
        print(f"🆕 새 게시물: {len(new_posts)}개")
        
        if not new_posts:
            result = {
                'success': True,
                'message': '저장할 새 게시물이 없습니다.',
                'stats': {
                    'collected': len(posts_to_process),
                    'new': 0,
                    'saved': 0,
                    'schedules': 0
                }
            }
            sync_status['last_result'] = result
            sync_status['is_running'] = False
            return result
        
        # 5️⃣ AI 분석
        print("\n[5/5] AI 분석 중...")
        analyzed_posts = ai_summarizer.analyze_batch(new_posts, show_progress=False)
        
        # 6️⃣ Firebase에 저장
        print("\n[6/6] Firebase에 저장 중...")
        
        for post in analyzed_posts:
            # publishedAt 형식 변환
            if 'published' in post:
                published = post['published']
                if isinstance(published, datetime):
                    post['publishedAt'] = published.isoformat()
                else:
                    post['publishedAt'] = str(published)
            
            # userId 추가
            for sub in subscriptions:
                if sub.get('accountId') == post.get('accountId'):
                    post['userId'] = sub.get('userId')
                    break
            
            # 필요없는 필드 제거
            post.pop('published', None)
        
        saved_count = firebase_client.save_posts_batch(analyzed_posts)
        
        # 구독 동기화 시간 업데이트
        for sub_id in all_posts.keys():
            firebase_client.update_subscription_sync_time(sub_id)
        
        # 결과 저장
        result = {
            'success': True,
            'message': '동기화 완료!',
            'stats': {
                'collected': len(posts_to_process),
                'new': len(new_posts),
                'saved': saved_count,
                'schedules': sum(1 for p in analyzed_posts if p.get('hasSchedule'))
            }
        }
        
        print("\n" + "=" * 60)
        print("✅ 동기화 완료!")
        print(f"📥 수집: {result['stats']['collected']}개")
        print(f"🆕 새 게시물: {result['stats']['new']}개")
        print(f"💾 저장: {result['stats']['saved']}개")
        print(f"📅 일정 감지: {result['stats']['schedules']}개")
        print(f"⏰ 종료 시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 60)
        
        sync_status['last_result'] = result
        sync_status['last_run'] = datetime.now().isoformat()
        
    except Exception as e:
        print(f"\n\n❌ 오류 발생: {e}")
        import traceback
        traceback.print_exc()
        
        result = {
            'success': False,
            'message': f'오류 발생: {str(e)}',
            'stats': {}
        }
        sync_status['last_result'] = result
        sync_status['error'] = str(e)
    
    finally:
        sync_status['is_running'] = False
    
    return result


@app.route('/api/sync', methods=['POST'])
def sync():
    """동기화 API 엔드포인트"""
    
    # 이미 실행 중이면 거부
    if sync_status['is_running']:
        return jsonify({
            'success': False,
            'message': '이미 동기화가 진행 중입니다.',
            'status': sync_status
        }), 409
    
    # 백그라운드 스레드로 실행
    thread = threading.Thread(target=run_sync)
    thread.start()
    
    return jsonify({
        'success': True,
        'message': '동기화를 시작했습니다.',
        'status': sync_status
    }), 202


@app.route('/api/status', methods=['GET'])
def status():
    """동기화 상태 확인"""
    return jsonify({
        'success': True,
        'status': sync_status
    })


@app.route('/api/health', methods=['GET'])
def health():
    """서버 상태 확인"""
    return jsonify({
        'success': True,
        'message': 'API 서버가 정상 작동 중입니다.',
        'timestamp': datetime.now().isoformat()
    })


if __name__ == '__main__':
    print("=" * 60)
    print("🚀 Flask API 서버 시작")
    print("📡 주소: http://localhost:5000")
    print("=" * 60)
    print("\n사용 가능한 엔드포인트:")
    print("  POST   /api/sync     - 동기화 시작")
    print("  GET    /api/status   - 동기화 상태 확인")
    print("  GET    /api/health   - 서버 상태 확인")
    print("\n종료하려면 Ctrl+C를 누르세요.\n")
    
    app.run(debug=False, host='0.0.0.0', port=5000)