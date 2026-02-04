import json
import os
import sys
import datetime
import uuid

def main():
    # 1. 環境変数 GITHUB_EVENT_PATH から、トリガーとなったGitHub Issueの情報を読み込む
    event_path = os.environ.get('GITHUB_EVENT_PATH')
    if not event_path:
        print("Error: GITHUB_EVENT_PATH is not set.")
        sys.exit(1)

    try:
        with open(event_path, 'r', encoding='utf-8') as f:
            event_data = json.load(f)
    except Exception as e:
        print(f"Error reading event file: {e}")
        sys.exit(1)

    # 2. Issueの本文（body）をパースする
    # GitHub Actionのissueイベントの場合、event_data['issue']['body'] に本文が入っている
    issue_data = event_data.get('issue', {})
    body_str = issue_data.get('body', '{}')

    try:
        payload = json.loads(body_str)
    except json.JSONDecodeError:
        print("Error: Issue body is not valid JSON.")
        sys.exit(1)

    user_id = payload.get('user_id')
    body_content = payload.get('body')

    if not user_id or body_content is None:
        print("Error: Missing required fields (user_id, body) in issue body.")
        sys.exit(1)

    # 3. data/posts.json があれば読み込む（なければ空リスト）
    posts_path = 'data/posts.json'
    posts = []
    
    if os.path.exists(posts_path):
        try:
            with open(posts_path, 'r', encoding='utf-8') as f:
                posts = json.load(f)
        except Exception as e:
            print(f"Warning: Failed to load {posts_path}: {e}. Starting with empty list.")
            posts = []

    # 4. ユーザー認証ロジック (削除: 誰でも任意のIDを使用可能)
    pass

    # 5. 新しい投稿データを作成する
    new_post = {
        'id': str(uuid.uuid4()),
        'timestamp': datetime.datetime.now(datetime.timezone.utc).isoformat(),
        'user_id': user_id,
        'body': body_content
    }

    # 6. 投稿データをリストに追加し、data/posts.json に保存する
    posts.append(new_post)

    try:
        # ディレクトリがない場合は作成（念のため）
        os.makedirs(os.path.dirname(posts_path), exist_ok=True)
        
        with open(posts_path, 'w', encoding='utf-8') as f:
            json.dump(posts, f, indent=2, ensure_ascii=False)
        print("Successfully processed post.")
    except Exception as e:
        print(f"Error saving posts: {e}")
        sys.exit(1)

if __name__ == '__main__':
    main()
