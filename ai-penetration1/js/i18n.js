/**
 * i18n.js — Localization module for AI Penetration home page
 * Supports: Arabic (ar) | English (en)
 * Features:
 *   - Full AR/EN translation dictionary
 *   - RTL ↔ LTR document direction switching
 *   - Font swap: Cairo (AR) ↔ Inter (EN)
 *   - localStorage persistence
 *   - Smooth fade-out/in transition on toggle
 *   - Smart hero title <br> visibility
 */

'use strict';

/* ─────────────────────────────────────────
   Translation Dictionary
───────────────────────────────────────── */
const translations = {
    ar: {
        // Page meta
        "page.title": "AI Penetration - الصفحة الرئيسية",

        // Navbar
        "nav.login": "تسجيل الدخول",
        "nav.signup": "حساب جديد",

        // Hero
        "hero.title.part1": "اكتشف ثغراتك قبل أن",
        "hero.title.part2": "يكتشفها",
        "hero.title.highlight": "المخترقون",
        "hero.subtitle": "منظومة ذكية مدعومة بالذكاء الاصطناعي لفحص تطبيقات الويب والشبكات. نقدم لك تقارير فورية، تحليلات دقيقة، وخطوات واضحة لسد الثغرات الأمنية بضغطة زر.",
        "hero.btn.start": "ابدأ التقييم مجاناً",
        "hero.btn.dashboard": "الدخول للوحة التحكم",
        "hero.stat.automated": "مؤتمت بالكامل",
        "hero.stat.ai": "تحليل ذكي (AI)",

        // Floating badges
        "badge.scan.success": "تم الفحص بنجاح",
        "badge.ai.ready": "تقرير الذكاء الاصطناعي جاهز",

        // Features
        "features.section.title.prefix": "لماذا تختار",
        "features.section.title.brand": "AI Penetration",
        "features.section.title.suffix": "؟",
        "features.section.subtitle": "نجمع بين قوة الذكاء الاصطناعي وأحدث أدوات فحص الحماية لتقديم نتائج احترافية ودقيقة.",
        "feature.1.title": "تحليل ذكي متطور",
        "feature.1.desc": "خوارزميات ذكاء اصطناعي تحلل بنية تطبيقك وتتوقع الثغرات حتى قبل أن تصبح معروفة في قواعد البيانات القياسية.",
        "feature.2.title": "فحص شامل وسريع",
        "feature.2.desc": "تنفيذ هجمات برمجية لمحاكاة الاختراق (OWASP ZAP, Nmap وغيرها) بسرعة فائقة ودون التأثير على أداء موقعك.",
        "feature.3.title": "تقارير وحلول فورية",
        "feature.3.desc": "تقارير مفصلة لا تعرض لك الثغرة فحسب، بل تقدم لك حلولاً برمجية وخطوات دقيقة لإغلاقها فوراً.",

        // Footer
        "footer.about": "منصتك الأولى لفحص وحماية التطبيقات والشبكات. نستخدم أحدث تقنيات الذكاء الاصطناعي لاكتشاف الثغرات وتأمين الأنظمة.",
        "footer.links.title": "روابط سريعة",
        "footer.links.home": "الرئيسية",
        "footer.links.signup": "انشاء حساب",
        "footer.links.dashboard": "لوحة التحكم",
        "footer.services.title": "الخدمات",
        "footer.services.web": "فحص تطبيقات الويب",
        "footer.services.network": "فحص الشبكات",
        "footer.services.ai": "تقارير الذكاء الاصطناعي",
        "footer.contact.title": "تواصل معنا",
        "footer.contact.support": "الدعم الفني",
        "footer.copyright": "© 2026 AI Penetration. جميع الحقوق محفوظة.",

        // Switcher label (shows the OTHER language the user can switch to)
        "lang.switch": "English",

        // ── Login page ──────────────────────────────────────────────
        "login.page.title": "AI Penetration - تسجيل الدخول",
        "login.brand.sub": "مساحة عمل آمنة للمشغلين",
        "login.badge": "طبقة وصول آمنة",
        "login.hero.title": "العودة إلى مساحة العمل.",
        "login.hero.desc": "افتح لوحة التحكم المحمية، تتبع سجل الفحوصات، واستعرض نتائج الذكاء الاصطناعي من مساحة عمل واحدة.",
        "login.pill.monitor": "مراقبة الفحص المباشر",
        "login.pill.ai": "توصيات الذكاء الاصطناعي",
        "login.pill.api": "وصول API محمي",
        "login.card.session.label": "حالة الجلسة",
        "login.card.session.value": "مقفل",
        "login.card.session.note": "تظل بيانات لوحة التحكم مخفية حتى اكتمال تسجيل الدخول.",
        "login.card.access.label": "نوع الوصول",
        "login.card.access.value": "دخول واحد",
        "login.card.access.note": "يستخدم تسجيل الدخول البريد الإلكتروني وكلمة المرور فقط.",
        "login.list.1": "يتم تحميل النتائج المحمية فقط بعد التحقق من الجلسة.",
        "login.list.2": "تحمي نفس الجلسة تنفيذ الفحص واسترداد التقارير.",
        "login.list.3": "الاشتراك يتم بشكل منفصل، لذا يمكن للمستخدمين الدخول بتدفق عادي.",
        "login.form.eyebrow": "تسجيل دخول الأعضاء",
        "login.form.title": "مرحباً بعودتك",
        "login.form.subtitle": "استخدم بريدك الإلكتروني وكلمة المرور للمتابعة إلى لوحة التحكم.",
        "login.link.signup": "إنشاء حساب",
        "login.label.email": "البريد الإلكتروني",
        "login.label.password": "كلمة المرور",
        "login.placeholder.email": "you@example.com",
        "login.placeholder.password": "أدخل كلمة مرورك",
        "login.password.hint": "يستخدم تسجيل الدخول البريد الإلكتروني وكلمة المرور فقط. رموز الوصول تُفحص فقط أثناء التسجيل.",
        "login.btn.submit": "تسجيل الدخول",
        "login.trust.session": "وصول محمي بالجلسة",
        "login.trust.redirect": "إعادة توجيه لصفحتك الأصلية",
        "login.links.prompt": "تحتاج حساباً جديداً؟",
        "login.links.create": "أنشئ حساباً",
        "login.footer.copy": "تدفق وصول آمن للمشغلين المعتمدين.",
        "login.footer.whatsapp": "دعم واتساب",
        "login.footer.call": "الاتصال بالدعم",

        // ── Signup page ─────────────────────────────────────────────
        "signup.page.title": "AI Penetration - إنشاء حساب",
        "signup.form.eyebrow": "تسجيل مقيّد",
        "signup.form.title": "إنشاء حساب معتمد",
        "signup.link.login": "تسجيل الدخول",
        "signup.form.subtitle": "سجّل مرة واحدة برمز الوصول الصحيح. بعد الموافقة، يستخدم الوصول البريد الإلكتروني وكلمة المرور فقط.",
        "signup.label.fullname": "الاسم الكامل",
        "signup.label.email": "البريد الإلكتروني",
        "signup.label.password": "كلمة المرور",
        "signup.label.confirm": "تأكيد كلمة المرور",
        "signup.label.access": "رمز الوصول",
        "signup.placeholder.fullname": "اسمك الكامل",
        "signup.placeholder.email": "you@example.com",
        "signup.placeholder.password": "أنشئ كلمة مرور",
        "signup.placeholder.confirm": "أعد إدخال كلمة المرور",
        "signup.placeholder.access": "أدخل رمز الوصول",
        "signup.password.hint": "استخدم 8+ أحرف، تشمل أحرفاً وأرقاماً ورمزاً.",
        "signup.confirm.hint": "أعد إدخال نفس كلمة المرور للتأكيد.",
        "signup.access.hint": "إذا كنت تحتاج رمز وصول، استخدم تفاصيل الاتصال في هذه الصفحة قبل التسجيل.",
        "signup.btn.submit": "إنشاء الحساب",
        "signup.trust.code": "التحقق من رمز الوصول مرة واحدة",
        "signup.trust.login": "تسجيل دخول عادي بعد التسجيل",
        "signup.links.prompt": "مسجّل مسبقاً؟",
        "signup.links.login": "تسجيل الدخول",
        "signup.brand.sub": "تسجيل مقيّد",
        "signup.badge": "رمز الوصول مطلوب",
        "signup.hero.title": "تسجيل يعتمد الموافقة أولاً.",
        "signup.hero.desc": "تدفق التسجيل مقيّد بالتصميم. رمز وصول صالح يفتح إنشاء الحساب، ثم تنتقل المنصة إلى تجربة تسجيل دخول عادية.",
        "signup.pill.controlled": "تسجيل مُتحكّم",
        "signup.pill.fast": "تسجيل دخول سريع بعده",
        "signup.step1.label": "الخطوة 1",
        "signup.step1.value": "طلب",
        "signup.step1.note": "احصل على رمز الوصول من تفاصيل الاتصال الموضحة أدناه.",
        "signup.step2.label": "الخطوة 2",
        "signup.step2.value": "تسجيل",
        "signup.step2.note": "أنشئ الحساب مرة واحدة، ثم انتقل إلى تسجيل الدخول العادي.",
        "signup.contact.eyebrow": "تحتاج الرمز؟",
        "signup.contact.title": "تواصل معنا",
        "signup.contact.copy": "إذا كنت تريد رمز وصول، تواصل معنا قبل محاولة التسجيل.",
        "signup.contact.label.contact": "اسم التواصل",
        "signup.contact.label.whatsapp": "واتساب",
        "signup.contact.label.phone": "الهاتف",
        "signup.footer.copy": "دعم التسجيل المقيّد متاح قبل الموافقة على الحساب.",
        "signup.footer.whatsapp": "دعم واتساب",
        "signup.footer.call": "الاتصال بالدعم",
    },

    en: {
        // Page meta
        "page.title": "AI Penetration - Home",

        // Navbar
        "nav.login": "Login",
        "nav.signup": "Sign Up",

        // Hero
        "hero.title.part1": "Discover Your Vulnerabilities Before",
        "hero.title.part2": "", // intentionally empty — <br> is hidden via JS
        "hero.title.highlight": "Hackers ",
        "hero.subtitle": "An intelligent AI-powered platform for scanning web applications and networks. Get instant reports, precise analysis, and clear remediation steps to close security gaps — with a single click.",
        "hero.btn.start": "Start Free Assessment",
        "hero.btn.dashboard": "Go to Dashboard",
        "hero.stat.automated": "Fully Automated",
        "hero.stat.ai": "AI-Powered Analysis",

        // Floating badges
        "badge.scan.success": "Scan Completed",
        "badge.ai.ready": "AI Report Ready",

        // Features
        "features.section.title.prefix": "Why Choose",
        "features.section.title.brand": "AI Penetration",
        "features.section.title.suffix": "?",
        "features.section.subtitle": "We combine the power of AI with the latest security scanning tools to deliver professional and accurate results.",
        "feature.1.title": "Advanced AI Analysis",
        "feature.1.desc": "AI algorithms analyze your application's structure and predict vulnerabilities even before they appear in standard databases.",
        "feature.2.title": "Comprehensive & Fast Scanning",
        "feature.2.desc": "Execute simulated penetration attacks (OWASP ZAP, Nmap, and more) at top speed without affecting your site's performance.",
        "feature.3.title": "Instant Reports & Solutions",
        "feature.3.desc": "Detailed reports that don't just expose vulnerabilities — they provide code-level fixes and precise steps to close them immediately.",

        // Footer
        "footer.about": "Your premier platform for scanning and protecting applications and networks. We leverage cutting-edge AI to detect vulnerabilities and secure your systems.",
        "footer.links.title": "Quick Links",
        "footer.links.home": "Home",
        "footer.links.signup": "Create Account",
        "footer.links.dashboard": "Dashboard",
        "footer.services.title": "Services",
        "footer.services.web": "Web App Scanning",
        "footer.services.network": "Network Scanning",
        "footer.services.ai": "AI Reports",
        "footer.contact.title": "Contact Us",
        "footer.contact.support": "Technical Support",
        "footer.copyright": "© 2026 AI Penetration. All rights reserved.",

        // Switcher label
        "lang.switch": "العربية",

        // ── Login page ──────────────────────────────────────────────
        "login.page.title": "AI Penetration - Login",
        "login.brand.sub": "Secure operator workspace",
        "login.badge": "Secure access layer",
        "login.hero.title": "Return to the scanning workspace.",
        "login.hero.desc": "Open the protected dashboard, track scan history, and review AI-driven findings from one session-aware workspace.",
        "login.pill.monitor": "Live scan monitoring",
        "login.pill.ai": "AI recommendations",
        "login.pill.api": "Protected API access",
        "login.card.session.label": "Session Status",
        "login.card.session.value": "Locked",
        "login.card.session.note": "Dashboard data stays hidden until login is complete.",
        "login.card.access.label": "Access Model",
        "login.card.access.value": "Single sign-in",
        "login.card.access.note": "Login uses email and password only. No access code is required here.",
        "login.list.1": "Protected scan history and results are loaded only after session validation.",
        "login.list.2": "The same session also protects status checks, scan execution, and report retrieval.",
        "login.list.3": "Signup approval is separate, so existing users can come back with a normal login flow.",
        "login.form.eyebrow": "Member sign in",
        "login.form.title": "Welcome back",
        "login.form.subtitle": "Use your registered email and password to continue to the dashboard.",
        "login.link.signup": "Create account",
        "login.label.email": "Email",
        "login.label.password": "Password",
        "login.placeholder.email": "you@example.com",
        "login.placeholder.password": "Enter your password",
        "login.password.hint": "Login uses email and password only. Access codes are checked only during signup.",
        "login.btn.submit": "Login",
        "login.trust.session": "Session-protected access",
        "login.trust.redirect": "Redirects to your original page",
        "login.links.prompt": "Need a new account?",
        "login.links.create": "Create one",
        "login.footer.copy": "Protected access flow for approved operators.",
        "login.footer.whatsapp": "WhatsApp support",
        "login.footer.call": "Call support",

        // ── Signup page ─────────────────────────────────────────────
        "signup.page.title": "AI Penetration - Sign Up",
        "signup.form.eyebrow": "Restricted registration",
        "signup.form.title": "Create an approved account",
        "signup.link.login": "Login",
        "signup.form.subtitle": "Register once with the correct access code. After approval, future access uses only email and password.",
        "signup.label.fullname": "Full Name",
        "signup.label.email": "Email",
        "signup.label.password": "Password",
        "signup.label.confirm": "Confirm Password",
        "signup.label.access": "Access Code",
        "signup.placeholder.fullname": "Your Name",
        "signup.placeholder.email": "you@example.com",
        "signup.placeholder.password": "Create a password",
        "signup.placeholder.confirm": "Repeat the password",
        "signup.placeholder.access": "Enter the access code",
        "signup.password.hint": "Use 8+ characters, including letters, numbers, and a symbol.",
        "signup.confirm.hint": "Repeat the same password to confirm it.",
        "signup.access.hint": "If you need an access code, use the contact details on this page before signing up.",
        "signup.btn.submit": "Create account",
        "signup.trust.code": "Access code checked once",
        "signup.trust.login": "Normal login after signup",
        "signup.links.prompt": "Already registered?",
        "signup.links.login": "Login here",
        "signup.brand.sub": "Restricted onboarding",
        "signup.badge": "Access code required",
        "signup.hero.title": "Approval-first signup with a cleaner path.",
        "signup.hero.desc": "The registration flow is restricted by design. A valid access code unlocks account creation, then the platform switches to a normal login experience.",
        "signup.pill.controlled": "Controlled signup",
        "signup.pill.fast": "Fast return login",
        "signup.step1.label": "Step 1",
        "signup.step1.value": "Request",
        "signup.step1.note": "Get the access code from the contact details shown below.",
        "signup.step2.label": "Step 2",
        "signup.step2.value": "Register",
        "signup.step2.note": "Create the account once, then move to standard login.",
        "signup.contact.eyebrow": "Need the code?",
        "signup.contact.title": "Contact us",
        "signup.contact.copy": "If you want an access code, contact us before trying to sign up.",
        "signup.contact.label.contact": "Contact",
        "signup.contact.label.whatsapp": "WhatsApp",
        "signup.contact.label.phone": "Phone",
        "signup.footer.copy": "Restricted onboarding support is available before account approval.",
        "signup.footer.whatsapp": "WhatsApp support",
        "signup.footer.call": "Call support",
    }
};

/* ─────────────────────────────────────────
   Core Helpers
───────────────────────────────────────── */

/** Get the stored locale, defaulting to Arabic. */
function getLocale() {
    return localStorage.getItem('ai_pen_locale') || 'ar';
}

/** Persist a new locale and apply it immediately. */
function setLocale(lang) {
    localStorage.setItem('ai_pen_locale', lang);
    applyLocale(lang);
}

/** Look up a translation key for the given (or current) locale. */
function t(key, lang) {
    const locale = lang || getLocale();
    const val = translations[locale] && translations[locale][key];
    return (val !== undefined && val !== null) ? val : key;
}

/* ─────────────────────────────────────────
   Core Locale Application
───────────────────────────────────────── */

/**
 * Apply all translations and direction/font changes to the DOM.
 * Called on page load and on every toggle.
 */
function applyLocale(lang) {
    const isAr = lang === 'ar';

    /* 1 — Document direction & language attribute */
    document.documentElement.setAttribute('lang', lang);
    document.documentElement.setAttribute('dir', isAr ? 'rtl' : 'ltr');

    /* 2 — Font swap */
    const font = isAr ? "'Cairo', sans-serif" : "'Inter', sans-serif";
    document.body.style.fontFamily = font;

    /* 3 — Page <title> — supports per-page meta[name="i18n-page-title"] */
    const titleMeta = document.querySelector('meta[name="i18n-page-title"]');
    const titleKey = titleMeta ? titleMeta.getAttribute('content') : 'page.title';
    document.title = t(titleKey, lang);

    /* 4 — Translate all [data-i18n] text nodes */
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const translated = t(key, lang);
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
            el.placeholder = translated;
        } else {
            el.textContent = translated;
        }
    });

    /* 5 — Hero title <br>: hide it in English (part2 is empty) */
    const heroBr = document.getElementById('hero-title-br');
    if (heroBr) {
        heroBr.style.display = isAr ? '' : 'none';
    }

    /* 6 — Sync data-default-message for auth feedback divs */
    document.querySelectorAll('[data-i18n-default-message]').forEach(el => {
        const key = el.getAttribute('data-i18n-default-message');
        el.setAttribute('data-default-message', t(key, lang));
    });

    /* 7 — Language switcher button label */
    const langBtn = document.getElementById('lang-switcher-btn');
    if (langBtn) {
        const label = langBtn.querySelector('.lang-label');
        if (label) label.textContent = t('lang.switch', lang);
        // Briefly animate the button on update
        langBtn.classList.add('lang-switching');
        setTimeout(() => langBtn.classList.remove('lang-switching'), 300);
    }
}

/* ─────────────────────────────────────────
   Page-Fade Transition
───────────────────────────────────────── */

/**
 * Fades the page out, switches locale, then fades back in.
 * Called from the toggle button's onclick.
 */
function toggleLocale() {
    const next = getLocale() === 'ar' ? 'en' : 'ar';

    // Inject transition style if not already present
    if (!document.getElementById('i18n-transition-style')) {
        const style = document.createElement('style');
        style.id = 'i18n-transition-style';
        style.textContent = `
            body.i18n-fade { opacity: 0; transition: opacity 0.22s ease; }
            body.i18n-visible { opacity: 1; transition: opacity 0.28s ease; }
            #lang-switcher-btn.lang-switching { transform: scale(0.93); }
        `;
        document.head.appendChild(style);
    }

    document.body.classList.add('i18n-fade');
    document.body.classList.remove('i18n-visible');

    setTimeout(() => {
        setLocale(next);
        document.body.classList.remove('i18n-fade');
        document.body.classList.add('i18n-visible');
    }, 220);
}

/* ─────────────────────────────────────────
   Initialisation
───────────────────────────────────────── */

function initI18n() {
    // Apply the stored (or default) locale immediately — no flash of wrong language
    applyLocale(getLocale());
    // Mark body as visible after first render
    document.body.classList.add('i18n-visible');
}

// Boot on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initI18n);
} else {
    // Already loaded (script is deferred or placed at end of body)
    initI18n();
}