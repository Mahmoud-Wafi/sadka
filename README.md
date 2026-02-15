# صدقة جارية - عبدالسلام عيسى

منصة رمضانية متكاملة لإدارة ختمات القرآن (حجز الأجزاء 1-30) مع عداد تسبيح جماعي مباشر.

## المزايا

- إنشاء الختمة الأولى تلقائيًا مع 30 جزء عند أول استخدام.
- منع الحجز المكرر لنفس الجزء.
- إظهار الجزء المحجوز فورًا للمستخدم بعد نجاح الحجز.
- تحديث مباشر فوري لكل المستخدمين عبر WebSocket عند الحجز أو التسبيح.
- polling كل 10 ثوانٍ كحل احتياطي في حال انقطاع WebSocket.
- عند اكتمال 30/30:
  - تعليم الختمة كمكتملة.
  - إنشاء ختمة جديدة تلقائيًا مع 30 جزء جديد.
- عدادات تسبيح عامة مشتركة بين جميع المستخدمين.
- قارئ جزء كامل داخل المنصة: عند اختيار أي جزء يظهر كامل آيات الجزء المختار.
- واجهة عربية RTL فاخرة (أخضر داكن + ذهبي) ومتجاوبة بالكامل.
- دعم PWA مع زر تثبيت التطبيق على الهاتف.

## التقنيات

- Backend: Django + Django REST Framework + Channels + SQLite
- Frontend: React + Axios + Tailwind + Vite + vite-plugin-pwa

## هيكل المشروع

```text
.
├── backend
│   ├── charity
│   │   ├── migrations
│   │   │   └── 0001_initial.py
│   │   ├── admin.py
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── services.py
│   │   ├── tests.py
│   │   ├── urls.py
│   │   └── views.py
│   ├── config
│   │   ├── settings.py
│   │   └── urls.py
│   ├── .env.example
│   ├── manage.py
│   ├── Procfile
│   ├── requirements.txt
│   └── runtime.txt
├── frontend
│   ├── public
│   │   └── icons
│   ├── src
│   │   ├── components
│   │   ├── services
│   │   ├── App.jsx
│   │   ├── index.css
│   │   └── main.jsx
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
└── README.md
```

## تشغيل backend محليًا

1. إنشاء بيئة افتراضية وتثبيت الحزم:
```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

2. إعداد المتغيرات:
```bash
cp .env.example .env
```

3. تنفيذ الهجرات:
```bash
python manage.py migrate
```

4. تشغيل الخادم:
```bash
python manage.py runserver
```
أو مباشرة عبر ASGI:
```bash
daphne -b 127.0.0.1 -p 8000 config.asgi:application
```

5. اختبار backend:
```bash
python manage.py test
```

## تشغيل frontend محليًا

1. تثبيت الحزم:
```bash
cd frontend
npm install
```

2. إعداد المتغيرات:
```bash
cp .env.example .env
```

3. تشغيل الواجهة:
```bash
npm run dev
```

## صورة البطل في Hero

- لإظهار صورة عبدالسلام في أعلى الواجهة:
  - ضع الصورة باسم `abdelsalam.jpg` داخل المسار:
  - `frontend/public/images/abdelsalam.jpg`

## واجهات API

- `GET /api/current-khatma/`
  - يرجع رقم الختمة الحالية + جميع الأجزاء الثلاثين.
- `POST /api/reserve/`
  - المدخلات: `{ "juz_number": 5, "name": "محمد" }`
  - يرجع بيانات الجزء المحجوز فورًا.
- `GET /api/stats/`
  - يرجع: عدد الختمات المكتملة، رقم الختمة الحالية، عدد الأجزاء المحجوزة، إجمالي المشاركين.
- `GET /api/tasbeeh/`
  - يرجع عدادات التسبيح.
- `POST /api/tasbeeh/`
  - المدخلات: `{ "phrase": "سُبْحَانَ اللَّهِ" }`
  - يزيد العداد العالمي لعبارة التسبيح.
- `GET /api/juz/<juz_number>/`
  - يرجع كامل نص الجزء المختار (1-30) لعرضه داخل الواجهة.

## WebSocket

- `WS /ws/live/`
  - يبث تحديثات فورية عند:
    - حجز جزء جديد.
    - زيادة عداد تسبيح.

## النشر على Render (backend)

1. أنشئ خدمة Web جديدة من نفس المستودع.
2. اجعل المسار الجذر للخدمة: `backend`.
3. Build Command:
```bash
pip install -r requirements.txt && python manage.py migrate && python manage.py collectstatic --noinput
```
4. Start Command:
```bash
daphne -b 0.0.0.0 -p $PORT config.asgi:application
```
5. أضف متغيرات البيئة:
- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG=False`
- `DJANGO_ALLOWED_HOSTS=<backend-domain>`
- `CORS_ALLOW_ALL=False`
- `CORS_ALLOWED_ORIGINS=<vercel-frontend-domain>`
- `CSRF_TRUSTED_ORIGINS=<backend-domain>,<vercel-frontend-domain>`
- `DATABASE_URL` (اختياري: PostgreSQL في الإنتاج، أو اترك SQLite)

## النشر على Railway (backend)

1. أنشئ مشروع Railway مرتبطًا بالمستودع.
2. اختر جذر الخدمة `backend`.
3. استخدم نفس أوامر البناء والتشغيل الخاصة بـ Render.
4. أضف نفس متغيرات البيئة.

## النشر على Vercel (frontend)

1. أنشئ مشروع Vercel من نفس المستودع.
2. Root Directory: `frontend`.
3. Build Command:
```bash
npm run build
```
4. Output Directory:
```bash
dist
```
5. Environment Variables:
- `VITE_API_BASE_URL=https://<backend-domain>/api`
- `VITE_WS_BASE_URL=wss://<backend-domain>/ws/live/`

## ملاحظات إنتاجية

- يفضّل استخدام PostgreSQL في الإنتاج بدل SQLite عبر `DATABASE_URL`.
- التحديث اللحظي يعتمد WebSocket عبر Channels.
- polling كل 10 ثوانٍ موجود كـ fallback عند ضعف الشبكة.
- كود الحجز مبني بمعاملة `transaction` مع قفل صفوف لمنع التضارب.
