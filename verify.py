import urllib.request, json, sys, os

sys.stdout.reconfigure(encoding='utf-8')

BASE = 'http://localhost:8080/api'
PASS = 'Demo1234!'

def req(method, path, token=None, body=None):
    url = BASE + path
    data = None
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    if body is not None:
        data = json.dumps(body).encode()
    try:
        r = urllib.request.Request(url, data=data, headers=headers, method=method)
        with urllib.request.urlopen(r, timeout=12) as resp:
            return json.loads(resp.read())
    except urllib.error.HTTPError as e:
        try:
            return json.loads(e.read())
        except:
            return {'error': f'HTTP {e.code}', 'success': False}
    except Exception as e:
        return {'error': str(e), 'success': False}

def login(email):
    d = req('POST', '/auth/login', body={'email': email, 'password': PASS})
    return d.get('data', {}).get('token', '')

def ok(cond):
    return '[PASS]' if cond else '[FAIL]'

print('=== LOGIN ===')
ATOKEN = login('admin@eduai.tn')
TTOKEN = login('trainer@eduai.tn')
STOKEN = login('student@eduai.tn')
print(ok(bool(ATOKEN)), 'admin@eduai.tn')
print(ok(bool(TTOKEN)), 'trainer@eduai.tn')
print(ok(bool(STOKEN)), 'student@eduai.tn')

# ============================================================
print('\n=== ESPACE ADMIN ===')
# ============================================================

d = req('GET', '/actuator/health')
print(ok(d.get('status') == 'UP'), '1.1 Actuator health | status:', d.get('status'))

d = req('GET', '/admin/stats', token=ATOKEN)
stats = d.get('data', {}) or {}
print(ok(d.get('success')), '1.2 Admin stats | users:', stats.get('totalUsers'),
      '| courses:', stats.get('totalCourses'), '| enrollments:', stats.get('totalEnrollments'))

d = req('GET', '/admin/users?size=5', token=ATOKEN)
page = d.get('data', {}) or {}
users = page.get('content', []) if isinstance(page, dict) else []
print(ok(d.get('success') and len(users) > 0), '1.3 Admin users list |', len(users), 'users')

if users:
    students = [u for u in users if u.get('role') == 'STUDENT']
    if students:
        uid = students[0]['id']
        d2 = req('PUT', f'/admin/users/{uid}/toggle-active', token=ATOKEN)
        print(ok(d2.get('success')), '1.4 Toggle active | active =>', d2.get('data', {}).get('active', '?') if isinstance(d2.get('data'), dict) else '?')
        req('PUT', f'/admin/users/{uid}/toggle-active', token=ATOKEN)  # restore
    else:
        print('[SKIP] 1.4 No STUDENT in first 5 users')

# ============================================================
print('\n=== ESPACE FORMATEUR ===')
# ============================================================

d = req('GET', '/courses/my', token=TTOKEN)
my_courses = d.get('data', []) or []
print(ok(d.get('success')), '2.1 List my courses |', len(my_courses), 'courses')

# Create course
payload = {'title': 'TEST_Verify_Course', 'description': 'Auto verification', 'category': 'DevOps', 'level': 'BEGINNER', 'price': 0}
d = req('POST', '/courses', token=TTOKEN, body=payload)
new_course = d.get('data', {}) or {}
cid = new_course.get('id', '')
print(ok(d.get('success') and bool(cid)), '2.2 Create course | id:', (cid[:8] + '...') if cid else 'NONE')

mid = ''
lid = ''
if cid:
    # Update
    d = req('PUT', f'/courses/{cid}', token=TTOKEN, body={**payload, 'title': 'TEST_Updated', 'published': False})
    print(ok(d.get('success')), '2.3 Update course')

    # Create module
    d = req('POST', f'/courses/{cid}/modules', token=TTOKEN, body={'title': 'Module Test', 'orderIndex': 1})
    mod_data = d.get('data', {}) or {}
    mid = mod_data.get('id', '')
    print(ok(d.get('success') and bool(mid)), '2.4 Create module | id:', (mid[:8] + '...') if mid else 'NONE')

    if mid:
        # Create lesson
        d = req('POST', f'/modules/{mid}/lessons', token=TTOKEN, body={'title': 'Lesson Test', 'type': 'TEXT', 'content': 'Hello world', 'orderIndex': 1})
        les_data = d.get('data', {}) or {}
        lid = les_data.get('id', '')
        print(ok(d.get('success') and bool(lid)), '2.5 Create lesson | id:', (lid[:8] + '...') if lid else 'NONE')

        # Get modules with embedded lessons
        d = req('GET', f'/courses/{cid}/modules', token=TTOKEN)
        mods = d.get('data', []) or []
        all_lessons = [l for m in mods for l in (m.get('lessons') or [])]
        print(ok(d.get('success') and len(mods) > 0), '2.6 Get modules+lessons |', len(mods), 'modules,', len(all_lessons), 'lessons')

        # Update lesson
        if lid:
            d = req('PUT', f'/lessons/{lid}', token=TTOKEN, body={'title': 'Lesson Updated', 'type': 'TEXT', 'content': 'Updated content', 'orderIndex': 1})
            print(ok(d.get('success')), '2.7 Update lesson')

        # Delete lesson
        if lid:
            d = req('DELETE', f'/lessons/{lid}', token=TTOKEN)
            print(ok(d.get('success')), '2.8 Delete lesson')

        # Delete module
        d = req('DELETE', f'/modules/{mid}', token=TTOKEN)
        print(ok(d.get('success')), '2.9 Delete module')

    # AI generate quiz
    d = req('POST', '/ai/generate-quiz', token=TTOKEN, body={'topic': 'Python basics', 'numberOfQuestions': 3})
    ai_data = d.get('data', {})
    q_count = len(ai_data.get('questions', [])) if isinstance(ai_data, dict) else 0
    print(ok(d.get('success') or q_count > 0), '2.10 AI generate-quiz | questions:', q_count, '| error:', d.get('error', ''))

    # AI generate summary (description gen for course form)
    d = req('POST', '/ai/generate-summary', token=TTOKEN, body={'topic': 'Machine Learning', 'level': 'BEGINNER'})
    ai_data = d.get('data', {})
    summ_len = len(ai_data.get('summary', '')) if isinstance(ai_data, dict) else 0
    print(ok(d.get('success') or summ_len > 0), '2.11 AI generate-summary | length:', summ_len, '| error:', d.get('error', ''))

    # Trainer analytics
    d = req('GET', '/trainer/analytics', token=TTOKEN)
    an_data = d.get('data', {}) or {}
    print(ok(d.get('success')), '2.12 Trainer analytics | keys:', list(an_data.keys()) if isinstance(an_data, dict) else type(an_data).__name__)

    # Trainer students
    d = req('GET', '/trainer/students', token=TTOKEN)
    st_data = d.get('data', []) or []
    print(ok(d.get('success')), '2.13 Trainer students |', len(st_data) if isinstance(st_data, list) else type(st_data).__name__, 'entries')

    # Delete test course
    d = req('DELETE', f'/courses/{cid}', token=TTOKEN)
    print(ok(d.get('success')), '2.14 Delete test course (cleanup)')

# ============================================================
print('\n=== ESPACE STAGIAIRE ===')
# ============================================================

# Browse published courses
d = req('GET', '/courses', token=STOKEN)
raw = d.get('data', []) or []
if isinstance(raw, dict):
    all_courses = raw.get('content', [])
else:
    all_courses = raw
print(ok(d.get('success') and len(all_courses) > 0), '3.1 Browse courses |', len(all_courses), 'courses available')

# My enrollments
d = req('GET', '/enrollments/me', token=STOKEN)
enroll_list = d.get('data', []) or []
print(ok(d.get('success')), '3.2 My enrollments |', len(enroll_list), 'enrolled')

target_cid = None
enroll_id = None

if all_courses:
    target_cid = all_courses[0]['id']
    already = [e for e in enroll_list if e.get('course', {}).get('id') == target_cid]
    if already:
        enroll_id = already[0]['id']
        print('[SKIP] 3.3 Already enrolled, enrollment id:', enroll_id[:8])
    else:
        d = req('POST', '/enrollments', token=STOKEN, body={'courseId': target_cid})
        e_data = d.get('data', {}) or {}
        enroll_id = e_data.get('id', '') if isinstance(e_data, dict) else ''
        print(ok(d.get('success') and bool(enroll_id)), '3.3 Enroll in course |', enroll_id[:8] if enroll_id else 'NONE', '| error:', d.get('error', ''))

# Get modules (lesson access)
if target_cid:
    d = req('GET', f'/courses/{target_cid}/modules', token=STOKEN)
    mods = d.get('data', []) or []
    lessons = [l for m in mods for l in (m.get('lessons') or [])]
    print(ok(d.get('success')), '3.4 Course modules |', len(mods), 'modules,', len(lessons), 'lessons')

# Update progress
if enroll_id:
    d = req('PUT', f'/enrollments/{enroll_id}/progress', token=STOKEN, body={'progress': 50})
    prog = None
    if isinstance(d.get('data'), dict):
        prog = d['data'].get('progress')
    elif isinstance(d.get('data'), (int, float)):
        prog = d['data']
    print(ok(d.get('success')), '3.5 Update progress | progress:', prog)

# Quiz list for enrolled courses (correct endpoint: /quizzes/my-courses)
d = req('GET', '/quizzes/my-courses', token=STOKEN)
q_data = d.get('data', []) or []
print(ok(d.get('success')), '3.6 List quizzes (my-courses) |', len(q_data), 'quizzes | error:', d.get('error', ''))

# AI recommendations — response is {recommendations: [...]}
d = req('GET', '/ai/recommend', token=STOKEN)
recs_data = d.get('data', {}) or {}
recs = recs_data.get('recommendations', []) if isinstance(recs_data, dict) else recs_data
print(ok(d.get('success')), '3.7 AI recommendations |', len(recs), 'recs | error:', d.get('error', ''))

# AI analyze — field is overallLevel not level
d = req('GET', '/ai/analyze', token=STOKEN)
an = d.get('data', {}) or {}
print(ok(d.get('success') and bool(an.get('overallLevel')) if isinstance(an, dict) else False), '3.8 AI analyze | overallLevel:', an.get('overallLevel', '?') if isinstance(an, dict) else type(an).__name__, '| error:', d.get('error', ''))

# Chatbot
d = req('POST', '/chat', token=STOKEN, body={'message': 'Explique Python en 1 phrase'})
chat = d.get('data', {}) or {}
rlen = len(str(chat.get('response', chat))) if isinstance(chat, dict) else len(str(chat))
print(ok(d.get('success') or rlen > 0), '3.9 Chatbot | response len:', rlen, '| error:', d.get('error', ''))

# ============================================================
print('\n=== UPLOAD ENDPOINT ===')
# ============================================================
import urllib.error
import io

# Test /lessons/upload with a small PDF-like blob
boundary = b'----verify42'
body = (
    b'------verify42\r\nContent-Disposition: form-data; name="file"; filename="test.pdf"\r\n'
    b'Content-Type: application/pdf\r\n\r\n%PDF-1.4 test content\r\n------verify42--\r\n'
)
headers_up = {
    'Content-Type': 'multipart/form-data; boundary=----verify42',
    'Authorization': 'Bearer ' + TTOKEN,
}
try:
    r = urllib.request.Request(BASE + '/lessons/upload', data=body, headers=headers_up, method='POST')
    with urllib.request.urlopen(r, timeout=10) as resp:
        d = json.loads(resp.read())
    url_returned = d.get('data', '')
    print(ok(d.get('success') and bool(url_returned)), '4.1 File upload | url:', url_returned)
except urllib.error.HTTPError as e:
    body_err = e.read().decode('utf-8', errors='replace')
    print('[FAIL]', '4.1 File upload | HTTP', e.code, '|', body_err[:120])
except Exception as e:
    print('[FAIL]', '4.1 File upload |', str(e)[:120])

# ============================================================
print('\n=== INFRASTRUCTURE ===')
# ============================================================
infra = {
    'docker-compose.yml':        'c:/Users/Rezgui/Desktop/pdl2/docker-compose.yml',
    'docker-compose.dev.yml':    'c:/Users/Rezgui/Desktop/pdl2/docker-compose.dev.yml',
    'Dockerfile backend':        'c:/Users/Rezgui/Desktop/pdl2/backend/Dockerfile',
    'Dockerfile ai_service':     'c:/Users/Rezgui/Desktop/pdl2/ai_service/Dockerfile',
    '.gitlab-ci.yml':            'c:/Users/Rezgui/Desktop/pdl2/.gitlab-ci.yml',
    'Jenkinsfile':               'c:/Users/Rezgui/Desktop/pdl2/Jenkinsfile',
}
for name, path in infra.items():
    exists = os.path.exists(path)
    size = os.path.getsize(path) if exists else 0
    print(ok(exists), f'5.x {name}', f'({size} bytes)' if exists else '(missing)')

print('\n=== VERIFICATION COMPLETE ===')
