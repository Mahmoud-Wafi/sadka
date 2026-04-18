// ===== ملف JavaScript الرئيسي - النسخة الكاملة =====

// تكوين API
const API_PORT = '5000';
const API_BASE_URL_STORAGE_KEY = 'ai_penetration_api_base_url';
const FRONTEND_LOGIN_FILE = 'login.html';
const FRONTEND_HOME_FILE = 'dashboard.html';

// متغيرات عامة
let currentTaskId = null;
let scanInterval = null;
let isScanning = false;
let systemUptime = 0;
let scanResults = {};
let historyData = [];
let currentPage = 1;
const itemsPerPage = 10;
const LANGUAGE_STORAGE_KEY = 'ai_penetration_language';
const TRANSLATABLE_ATTRIBUTES = ['placeholder', 'aria-label', 'title'];
const PAGE_TITLE_AR = document.title;
const HISTORY_DATE_FORMATTER = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
});

let currentLanguage = 'ar';
let languageObserver = null;
let API_BASE_URL = '';
const textNodeSource = new WeakMap();
const attributeSource = new WeakMap();
const ALLOWED_TEST_HOSTS = new Set([
    'testphp.vulnweb.com',
    'demo.testfire.net',
    'localhost'
]);

const AR_TO_EN_MAP = {
    'نظام الفحص الأمني الذكي': 'Smart Security Scanning System',
    'نظام الفحص الأمني المتكامل': 'Integrated Security Scanning System',
    'نظام ذكي يجمع بين أدوات الاختراق التقليدية والذكاء الاصطناعي لتقديم تحليل شامل وتوصيات ذكية لأمن الشبكات والتطبيقات.': 'An intelligent system that combines traditional penetration tools with AI for complete security analysis and actionable recommendations.',
    'الرئيسية': 'Home',
    'الفحص': 'Scan',
    'السجل': 'History',
    'الأدوات': 'Tools',
    'حول': 'About',
    'تواصل معنا': 'Contact Us',
    'تسجيل الخروج': 'Logout',
    'متصل': 'Connected',
    'غير متصل': 'Disconnected',
    'نشط': 'Active',
    'غير نشط': 'Inactive',
    'فحص مكتمل': 'Completed Scans',
    'أداة فعالة': 'Active Tools',
    'دقة تحليل': 'Analysis Accuracy',
    'فحص ذكي في خطوات بسيطة': 'Smart Scan in Simple Steps',
    'أدخل عنوان الهدف': 'Enter target address',
    'اختر أدوات الفحص': 'Choose scan tools',
    'احصل على تحليل مفصل': 'Get detailed analysis',
    'طبق التوصيات الأمنية': 'Apply security recommendations',
    'بدء فحص جديد': 'Start a New Scan',
    'إدخال الهدف': 'Target Input',
    'عنوان الهدف (URL أو IP)': 'Target Address (URL or IP)',
    'مثال: testphp.vulnweb.com أو 192.168.1.1': 'Example: testphp.vulnweb.com or 192.168.1.1',
    'اقتراحات': 'Suggestions',
    'فتح الموقع': 'Open Website',
    'للمواقع التجريبية فقط. مثال: testphp.vulnweb.com, demo.testfire.net': 'For test sites only. Example: testphp.vulnweb.com, demo.testfire.net',
    'قواعد فتح الموقع:': 'Website Opening Rules:',
    'نطاقات تجريبية معتمدة: testphp.vulnweb.com و demo.testfire.net': 'Approved test domains: testphp.vulnweb.com and demo.testfire.net',
    'مسموح localhost و 127.0.0.1': 'Allowed localhost and 127.0.0.1',
    'عناوين الشبكات الخاصة فقط: 10.x.x.x و 192.168.x.x و 172.16-31.x.x': 'Private network IPs only: 10.x.x.x, 192.168.x.x, and 172.16-31.x.x',
    'أهداف سريعة للتجربة:': 'Quick Test Targets:',
    'أدوات الفحص': 'Scanning Tools',
    'جاهز': 'Ready',
    'غير مثبت': 'Not Installed',
    'فحص المنافذ المفتوحة والخدمات النشطة': 'Scan open ports and active services',
    'اكتشاف ثغرات تطبيقات الويب': 'Detect web application vulnerabilities',
    'فحص أساسي': 'Basic Scan',
    'فحص متقدم': 'Advanced Scan',
    'فحص شامل': 'Comprehensive Scan',
    'كشف ثغرات حقن SQL': 'Detect SQL injection vulnerabilities',
    'للمواقع التجريبية فقط': 'For test sites only',
    'إطار اختبار الاختراق المتقدم': 'Advanced penetration testing framework',
    'للاستخدام المتقدم فقط': 'For advanced use only',
    'إعدادات الفحص': 'Scan Settings',
    'سرعة الفحص': 'Scan Speed',
    'سريع (مستوى أساسي)': 'Fast (Basic level)',
    'عادي (مستوى متوازن)': 'Normal (Balanced level)',
    'شامل (مستوى مفصل)': 'Comprehensive (Detailed level)',
    'تحليل الذكاء الاصطناعي': 'AI Analysis',
    'تفعيل التحليل الذكي': 'Enable smart analysis',
    'سيتم تحليل النتائج وتقديم توصيات ذكية': 'Results will be analyzed with smart recommendations',
    'حفظ النتائج': 'Save Results',
    'حفظ التقرير في السجل': 'Save report to history',
    'الوقت المتوقع': 'Estimated Time',
    'بدء الفحص': 'Start Scan',
    'مسح النموذج': 'Clear Form',
    'حالة النظام': 'System Status',
    'API الخادم': 'Server API',
    'قاعدة البيانات': 'Database',
    'الذاكرة': 'Memory',
    'المهام النشطة': 'Active Tasks',
    'جاري تنفيذ الفحص': 'Running Scan',
    'نتائج أولية': 'Preliminary Results',
    'إلغاء الفحص': 'Cancel Scan',
    'إيقاف مؤقت': 'Pause',
    'استئناف': 'Resume',
    'جارٍ البدء...': 'Starting...',
    'نتائج الفحص': 'Scan Results',
    'منذ 2 دقيقة': '2 minutes ago',
    'تصدير التقرير': 'Export Report',
    'إغلاق': 'Close',
    'الملخص': 'Summary',
    'التفاصيل': 'Details',
    'التوصيات': 'Recommendations',
    'النتائج الخام': 'Raw Results',
    'مستوى الخطورة': 'Risk Level',
    'عالية': 'High',
    'متوسطة': 'Medium',
    'منخفضة': 'Low',
    'غير معروفة': 'Unknown',
    'إحصائيات': 'Statistics',
    'منفذ مفتوح': 'Open Port',
    'ثغرة': 'Vulnerability',
    'خدمة': 'Service',
    'مخاطرة': 'Risk',
    'مؤشرات الأمن': 'Security Metrics',
    'النتائج الرئيسية': 'Key Findings',
    'تم التحليل باستخدام نموذج GPT-4': 'Analyzed using GPT-4 model',
    'التحليل التفصيلي': 'Detailed Analysis',
    'العلاقات المكتشفة': 'Detected Relationships',
    'التنبؤات والتوقعات': 'Predictions and Forecasts',
    'اختر الأداة لعرض نتائجها:': 'Choose a tool to view its results:',
    'اختر أداة لعرض نتائجها...': 'Select a tool to view its results...',
    'سجل الفحوصات': 'Scan History',
    'بحث في السجل...': 'Search history...',
    'جميع الفحوصات': 'All Scans',
    'اليوم': 'Today',
    'الأسبوع': 'Week',
    'الشهر': 'Month',
    'الفاشلة': 'Failed',
    'المكتملة': 'Completed',
    'تحديث السجل': 'Refresh History',
    'التاريخ': 'Date',
    'الهدف': 'Target',
    'الحالة': 'Status',
    'المدة': 'Duration',
    'الإجراءات': 'Actions',
    'الأدوات المتاحة': 'Available Tools',
    'الإصدار:': 'Version:',
    'سريع وفعال': 'Fast and efficient',
    'فحص دقيق': 'Precise scanning',
    'نصوص مخصصة': 'Custom scripts',
    'تعمل عن طريق تقليد الهجمات على تطبيقات الويب لاكتشاف الثغرات الأمنية.': 'Simulates web attacks to detect security vulnerabilities.',
    'فحص تلقائي': 'Automated scanning',
    'تقارير متعددة': 'Multiple reports',
    'قواعد متعددة': 'Multiple databases',
    'ذكاء اصطناعي': 'Artificial intelligence',
    'وضع آمن': 'Safe mode',
    'للاستخدام الأخلاقي فقط': 'For ethical use only',
    'وحدات متعددة': 'Multiple modules',
    'قابل للتخصيص': 'Customizable',
    'إدارة متقدمة': 'Advanced management',
    'يتطلب خبرة متقدمة': 'Requires advanced experience',
    'حول المشروع': 'About the Project',
    'رقم واتساب': 'WhatsApp Number',
    'فتح واتساب': 'Open WhatsApp',
    'رقم الهاتف': 'Phone Number',
    'اتصل الآن': 'Call Now',
    'للتواصل المباشر بخصوص النظام أو الدعم أو الاستفسارات الفنية.': 'For direct contact regarding the system, support, or technical inquiries.',
    'نظام ذكي متكامل لفحص الثغرات الأمنية يجمع بين أدوات الاختراق التقليدية وقوة الذكاء الاصطناعي لتقديم تحليل شامل وتوصيات ذكية.': 'A complete intelligent vulnerability scanning system that combines traditional penetration tools with AI power for comprehensive analysis and smart recommendations.',
    'المميزات:': 'Features:',
    'واجهة مستخدم عربية بديهية': 'Intuitive Arabic user interface',
    'دمج 4 أدوات أمنية متقدمة': 'Integration of 4 advanced security tools',
    'تحليل ذكي باستخدام الذكاء الاصطناعي': 'Smart AI-powered analysis',
    'تقارير تفصيلية وتوصيات عملية': 'Detailed reports and practical recommendations',
    'سجل كامل لجميع الفحوصات': 'Full history of all scans',
    'التقنيات المستخدمة:': 'Technologies Used:',
    'خلفية النظام وAPI': 'Backend and API',
    'واجهة تفاعلية': 'Interactive frontend',
    'تصميم متجاوب': 'Responsive design',
    'تحليل ذكي': 'Smart analysis',
    'تنبيه هام': 'Important Notice',
    'هذا النظام مخصص للاستخدام الأخلاقي والأكاديمي فقط. يمنع استخدامه على أنظمة أو شبكات لا تملك تصريحاً بفحصها.': 'This system is for ethical and academic use only. Do not use it on systems or networks you are not authorized to test.',
    'نظام ذكي لفحص الثغرات الأمنية باستخدام الذكاء الاصطناعي': 'Intelligent security vulnerability scanning with AI',
    'روابط سريعة': 'Quick Links',
    'بدء فحص': 'Start Scan',
    'خادم:': 'Server:',
    'فحوصات:': 'Scans:',
    'وقت التشغيل:': 'Uptime:',
    'تحذير': 'Warning',
    'نجاح': 'Success',
    'خطأ': 'Error',
    'اقتراح': 'Suggestion',
    'إلغاء': 'Cancelled',
    'تحميل': 'Download',
    'تحديث': 'Updated',
    'اكتمال': 'Completed',
    'يرجى إدخال هدف للفحص': 'Please enter a scan target',
    'لا يمكن الاتصال بالخادم': 'Cannot connect to server',
    'يرجى اختيار أداة واحدة على الأقل': 'Please select at least one tool',
    'الهدف غير مسموح به. استخدم أحد المواقع التجريبية.': 'Target is not allowed. Use one of the test sites.',
    'تحذير SQLMap': 'SQLMap Warning',
    'SQLMap مخصص للأغراض التعليمية والمواقع التجريبية فقط. هل تريد المتابعة؟': 'SQLMap is for educational and test-site use only. Do you want to continue?',
    'تحذير WhatWeb': 'WhatWeb Warning',
    'WhatWeb يكشف تقنيات الويب والإعدادات الظاهرة للخدمة. استخدمه على أهداف مفوضة فقط. هل تريد المتابعة؟': 'WhatWeb fingerprints visible web technologies and service metadata. Use it only on authorized targets. Do you want to continue?',
    'نعم، تابع': 'Yes, continue',
    'نعم، احذف': 'Yes, delete',
    'الخادم غير متصل. تأكد من تشغيل API.': 'Server is disconnected. Make sure the API is running.',
    'تم بدء الفحص بنجاح': 'Scan started successfully',
    'فشل بدء الفحص:': 'Failed to start scan:',
    'فشل الفحص. يرجى المحاولة مرة أخرى.': 'Scan failed. Please try again.',
    'انتهت مهلة الفحص': 'Scan timed out',
    'انتهت مهلة الاتصال بالخادم': 'Server connection timed out',
    'مكتمل': 'Completed',
    'جاري...': 'Running...',
    'في الانتظار': 'Pending',
    'لا توجد منافذ مفتوحة': 'No open ports',
    'لا توجد ثغرات ويب': 'No web vulnerabilities',
    'تم اكتشاف ثغرة SQL Injection': 'SQL injection vulnerability detected',
    'لم يتم اكتشاف ثغرات SQL': 'No SQL vulnerabilities detected',
    'تم تنفيذ فحص WhatWeb': 'WhatWeb scan executed',
    'لا توجد ثغرات حرجة': 'No critical vulnerabilities',
    'فشل': 'Failed',
    'عرض النتائج الخام': 'View raw results',
    'لا توجد بيانات لعرضها': 'No data to display',
    'بيانات غير معروفة': 'Unknown data',
    'المنافذ المفتوحة:': 'Open Ports:',
    'غير معروف': 'Unknown',
    'عدد الثغرات:': 'Vulnerability Count:',
    'تم اكتشاف ثغرة SQL Injection!': 'SQL Injection vulnerability detected!',
    'يوجد ضعف في معالجة استعلامات SQL في التطبيق.': 'The application has weak SQL query handling.',
    'لم يتم اكتشاف ثغرات SQL Injection': 'No SQL Injection vulnerabilities detected',
    'التطبيق محمي ضد هجمات حقن SQL.': 'Application is protected against SQL injection attacks.',
    'تم استخدام وحدات المسح الأساسية للتحقق من نقاط الضعف الشائعة.': 'Basic scanning modules were used to check common weaknesses.',
    'التحليل الشامل': 'Comprehensive Analysis',
    'الأنماط المكتشفة': 'Detected Patterns',
    'التنبؤات المستقبلية': 'Future Predictions',
    'خطوات التنفيذ:': 'Implementation Steps:',
    'عالي': 'High',
    'متوسط': 'Medium',
    'راجع تقرير OWASPZap للحصول على تفاصيل الثغرات': 'Review the OWASPZap report for vulnerability details',
    'تفعيل جدار الحماية': 'Enable Firewall',
    'النسخ الاحتياطي الدوري': 'Regular Backups',
    'لا توجد بيانات خام متاحة': 'No raw data available',
    'لا توجد بيانات لهذه الأداة': 'No data for this tool',
    'لا توجد فحوصات سابقة': 'No previous scans',
    'لا توجد نتائج مطابقة للبحث': 'No matching search results',
    'فشل تحميل تفاصيل الفحص': 'Failed to load scan details',
    'حذف الفحص': 'Delete Scan',
    'هل أنت متأكد من حذف هذا الفحص؟': 'Are you sure you want to delete this scan?',
    'تم حذف الفحص بنجاح': 'Scan deleted successfully',
    'فشل حذف الفحص': 'Failed to delete scan',
    'جاري': 'Running',
    'اقتراحات': 'Suggestions',
    'جرب فحص:': 'Try scanning:',
    'تم إلغاء الفحص': 'Scan cancelled',
    'تم إيقاف الفحص مؤقتاً': 'Scan paused',
    'تم استئناف الفحص': 'Scan resumed',
    'تم مسح النموذج': 'Form cleared',
    'تم إغلاق النتائج': 'Results closed',
    'لا توجد نتائج لتحميلها': 'No results to download',
    'تم بدء تحميل التقرير': 'Report download started',
    'فشل إنشاء التقرير': 'Failed to generate report',
    'تم تحديث سجل الفحوصات': 'Scan history refreshed',
    'حسناً': 'OK',
    'تبديل اللغة': 'Toggle language',
    // New strings for Phase 5 consistency
    'حدود الفحص (Guardrails)': 'Scan Guardrails',
    'نسبة الاكتمال': 'Completion Score',
    'المرحلة الحالية': 'Current Phase',
    'الوقت المتبقي المتوقع': 'Estimated Time Left',
    'درجة المخاطرة': 'Risk Score',
    'الثقة بالنتائج': 'Confidence',
    'الاكتمال': 'Completion',
    'النتائج المكتشفة': 'Findings',
    'الخطوات التالية المقترحة': 'What Should Happen Next',
    'ملخص تحليل الذكاء الاصطناعي': 'AI Risk Briefing',
    'تحليل هيكلي بناءً على تقرير AI وأدلة الفحص': 'Structured from the backend AI report and scan evidence',
    'الملخص التنفيذي': 'Executive Summary',
    'القضايا ذات الأولوية': 'Priority Issues',
    'خطة العمل': 'Action Plan',
    'الفحوصات': 'Scans',
    'متوسط المخاطر': 'Average Risk',
    'معدل الاكتمال': 'Completion Rate',
    'الفحوصات الحرجة': 'Critical Scans',
    'بانتظار سجل الفحص لحساب أحدث الاتجاهات.': 'Awaiting scan history to calculate the latest trend.',
    'الأهداف المصرح بها فقط': 'Authorized targets only',
    'يفضل استخدام بيئات تجريبية أو خاصة': 'Prefer demo, staging, or owned environments',
    'راجع التوصيات قبل المعالجة': 'Review recommendations before remediation'
};

const EN_TO_AR_MAP = Object.fromEntries(
    Object.entries(AR_TO_EN_MAP).map(([ar, en]) => [en, ar])
);

// Specific fallback headings from backend AI report
EN_TO_AR_MAP['Top Issues:'] = 'أهم المشاكل:';
EN_TO_AR_MAP['Recommendations:'] = 'التوصيات:';
EN_TO_AR_MAP['Next Actions:'] = 'الخطوات التالية:';
EN_TO_AR_MAP['Note: This report was generated in fallback mode (no OpenAI key configured).'] = 'ملاحظة: تم إنشاء هذا التقرير في وضع الاحتياطي (لم يتم تكوين مفتاح OpenAI).';


function normalizeText(text) {
    return (text || '').replace(/\s+/g, ' ').trim();
}

function withOriginalSpacing(sourceText, translatedText) {
    const leading = (sourceText.match(/^\s*/) || [''])[0];
    const trailing = (sourceText.match(/\s*$/) || [''])[0];
    return `${leading}${translatedText}${trailing}`;
}

function applyPatternTranslation(normalizedText) {
    const minuteMatch = normalizedText.match(/^~\s*(\d+)\s*(دقيقة|دقائق)$/);
    if (minuteMatch) {
        const count = Number(minuteMatch[1]);
        return `~ ${count} minute${count === 1 ? '' : 's'}`;
    }

    const openPortsMatch = normalizedText.match(/^(\d+)\s+منفذ مفتوح$/);
    if (openPortsMatch) {
        const count = Number(openPortsMatch[1]);
        return `${count} open port${count === 1 ? '' : 's'}`;
    }

    const webVulnMatch = normalizedText.match(/^(\d+)\s+ثغرة ويب مكتشفة$/);
    if (webVulnMatch) {
        const count = Number(webVulnMatch[1]);
        return `${count} web vulnerabilit${count === 1 ? 'y' : 'ies'} found`;
    }

    const vulnCountMatch = normalizedText.match(/^عدد الثغرات:\s*(\d+)$/);
    if (vulnCountMatch) {
        return `Vulnerability Count: ${vulnCountMatch[1]}`;
    }

    const moreMatch = normalizedText.match(/^و\s*(\d+)\s+أكثر\.\.\.$/);
    if (moreMatch) {
        return `and ${moreMatch[1]} more...`;
    }

    const agoMatch = normalizedText.match(/^منذ\s*(\d+)\s*دقيقة$/);
    if (agoMatch) {
        const count = Number(agoMatch[1]);
        return `${count} minute${count === 1 ? '' : 's'} ago`;
    }

    const findingsMatch = normalizedText.match(/^منافذ مفتوحة:\s*(.+)$/);
    if (findingsMatch) {
        return `Open ports: ${findingsMatch[1]}`;
    }

    const tryScanMatch = normalizedText.match(/^جرب فحص:\s*(.+)$/);
    if (tryScanMatch) {
        return `Try scanning: ${tryScanMatch[1]}`;
    }

    const scanStartErrorMatch = normalizedText.match(/^فشل بدء الفحص:\s*(.+)$/);
    if (scanStartErrorMatch) {
        return `Failed to start scan: ${scanStartErrorMatch[1]}`;
    }

    return null;
}

function translateArabicToEnglish(text) {
    const normalized = normalizeText(text);
    if (!normalized) return text;

    if (Object.prototype.hasOwnProperty.call(AR_TO_EN_MAP, normalized)) {
        return withOriginalSpacing(text, AR_TO_EN_MAP[normalized]);
    }

    const patternTranslation = applyPatternTranslation(normalized);
    if (patternTranslation) {
        return withOriginalSpacing(text, patternTranslation);
    }

    return text;
}

function translateEnglishToArabic(text) {
    const normalized = normalizeText(text);
    if (!normalized) return text;

    if (Object.prototype.hasOwnProperty.call(EN_TO_AR_MAP, normalized)) {
        return withOriginalSpacing(text, EN_TO_AR_MAP[normalized]);
    }

    return text;
}

function localizeTextNode(node) {
    if (!textNodeSource.has(node)) {
        textNodeSource.set(node, node.nodeValue);
    }

    const sourceText = textNodeSource.get(node);
    node.nodeValue = currentLanguage === 'en'
        ? translateArabicToEnglish(sourceText)
        : translateEnglishToArabic(sourceText);
}

function localizeAttributes(rootElement) {
    const selector = TRANSLATABLE_ATTRIBUTES.map(attr => `[${attr}]`).join(',');
    const elements = [];

    if (rootElement.nodeType === Node.ELEMENT_NODE) {
        if (rootElement.matches(selector)) {
            elements.push(rootElement);
        }
        elements.push(...rootElement.querySelectorAll(selector));
    }

    elements.forEach(element => {
        let elementSource = attributeSource.get(element);
        if (!elementSource) {
            elementSource = {};
            attributeSource.set(element, elementSource);
        }

        TRANSLATABLE_ATTRIBUTES.forEach(attr => {
            if (!element.hasAttribute(attr)) return;

            if (!Object.prototype.hasOwnProperty.call(elementSource, attr)) {
                elementSource[attr] = element.getAttribute(attr);
            }

            const sourceValue = elementSource[attr];
            element.setAttribute(
                attr,
                currentLanguage === 'en' ? translateArabicToEnglish(sourceValue) : sourceValue
            );
        });
    });
}

function localizeContent(rootElement) {
    if (!rootElement) return;

    if (rootElement.nodeType === Node.TEXT_NODE) {
        if (normalizeText(rootElement.nodeValue)) {
            localizeTextNode(rootElement);
        }
        return;
    }

    const blockedTags = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE', 'PRE']);
    const walker = document.createTreeWalker(
        rootElement,
        NodeFilter.SHOW_TEXT,
        {
            acceptNode(node) {
                if (!normalizeText(node.nodeValue)) {
                    return NodeFilter.FILTER_REJECT;
                }

                const parent = node.parentElement;
                if (!parent || blockedTags.has(parent.tagName)) {
                    return NodeFilter.FILTER_REJECT;
                }

                return NodeFilter.FILTER_ACCEPT;
            }
        }
    );

    let node;
    while ((node = walker.nextNode())) {
        localizeTextNode(node);
    }

    localizeAttributes(rootElement);
}

function updateLanguageToggleLabel() {
    const desktopToggle = document.getElementById('languageToggle');
    const mobileToggle = document.getElementById('languageToggleMobile');
    const ariaLabel = currentLanguage === 'ar' ? 'Switch to English' : 'التبديل إلى العربية';

    [desktopToggle, mobileToggle].forEach(btn => {
        if (!btn) return;
        btn.setAttribute('data-active', currentLanguage);
        btn.setAttribute('aria-label', ariaLabel);
    });
}


function getLocale() {
    return currentLanguage === 'en' ? 'en-US' : 'ar-SA';
}

function formatHistoryDate(dateValue) {
    const date = new Date(dateValue);
    return Number.isNaN(date.getTime()) ? 'Unknown' : HISTORY_DATE_FORMATTER.format(date);
}

function applyLanguage(lang, persist = true) {
    currentLanguage = lang === 'en' ? 'en' : 'ar';

    document.documentElement.lang = currentLanguage;
    document.documentElement.dir = currentLanguage === 'en' ? 'ltr' : 'rtl';
    document.title = currentLanguage === 'en'
        ? 'AI Penetration - Smart Security Scanning System'
        : PAGE_TITLE_AR;

    localizeContent(document.body);
    updateLanguageToggleLabel();
    updateTimeEstimate();

    if (document.getElementById('historyTableBody')) {
        displayHistoryPage(currentPage);
        setupPagination();
    }

    if (scanResults && scanResults.target) {
        prepareResultsUI(scanResults);
    }

    if (persist) {
        localStorage.setItem(LANGUAGE_STORAGE_KEY, currentLanguage);
    }
}

function startLanguageObserver() {
    if (languageObserver || !document.body) return;

    languageObserver = new MutationObserver((mutations) => {
        if (currentLanguage !== 'en') return;

        mutations.forEach(mutation => {
            mutation.addedNodes.forEach(node => {
                localizeContent(node);
            });
        });
    });

    languageObserver.observe(document.body, {
        childList: true,
        subtree: true
    });
}

function initLanguageSupport() {
    startLanguageObserver();
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY);
    applyLanguage(savedLanguage === 'en' ? 'en' : 'ar', false);
}

function toggleLanguage() {
    applyLanguage(currentLanguage === 'ar' ? 'en' : 'ar');
}

function getCookie(name) {
    const cookieValue = `; ${document.cookie}`;
    const parts = cookieValue.split(`; ${name}=`);
    if (parts.length === 2) {
        return decodeURIComponent(parts.pop().split(';').shift());
    }
    return '';
}

function isBackendServedFrontend() {
    return String(window.location.port || '') === API_PORT;
}

function buildFrontendUrl(pathname, nextPath = '') {
    const normalizedPath = pathname.startsWith('/') ? pathname : `/${pathname}`;
    const url = new URL(normalizedPath, window.location.origin);
    if (nextPath) {
        url.searchParams.set('next', nextPath);
    }
    return url.toString();
}

function redirectToLogin() {
    const nextPath = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    if (isBackendServedFrontend()) {
        window.location.href = buildFrontendUrl('/login/', nextPath || '/');
        return;
    }
    window.location.href = buildFrontendUrl(FRONTEND_LOGIN_FILE, nextPath || '/');
}

function normalizeApiBaseUrl(baseUrl) {
    return String(baseUrl || '').trim().replace(/\/+$/, '');
}

function getApiBaseCandidates() {
    const params = new URLSearchParams(window.location.search);
    const candidates = [];
    const hosts = [];

    const storedBaseUrl = normalizeApiBaseUrl(localStorage.getItem(API_BASE_URL_STORAGE_KEY));
    const queryBaseUrl = normalizeApiBaseUrl(params.get('apiBase'));
    const queryHost = String(params.get('apiHost') || '').trim();
    const currentHost = String(window.location.hostname || '').trim();

    if (storedBaseUrl) candidates.push(storedBaseUrl);
    if (queryBaseUrl) candidates.push(queryBaseUrl);

    if (queryHost) hosts.push(queryHost);
    if (currentHost) hosts.push(currentHost === '0.0.0.0' ? '127.0.0.1' : currentHost);
    hosts.push('localhost', '127.0.0.1');

    Array.from(new Set(hosts.filter(Boolean))).forEach(host => {
        candidates.push(`http://${host}:${API_PORT}`);
    });

    return Array.from(new Set(candidates.map(normalizeApiBaseUrl).filter(Boolean)));
}

function rememberApiBaseUrl(baseUrl) {
    API_BASE_URL = normalizeApiBaseUrl(baseUrl);
    if (!API_BASE_URL) return;

    try {
        localStorage.setItem(API_BASE_URL_STORAGE_KEY, API_BASE_URL);
    } catch (error) {
        console.warn('Could not persist API base URL:', error);
    }
}

async function resolveApiBaseUrl(forceRefresh = false) {
    if (API_BASE_URL && !forceRefresh) {
        return API_BASE_URL;
    }

    let lastError = null;

    for (const baseUrl of getApiBaseCandidates()) {
        try {
            const response = await fetch(`${baseUrl}/health/`, {
                credentials: 'include'
            });
            if (!response.ok) {
                lastError = new Error(`API probe failed with status ${response.status}`);
                continue;
            }

            rememberApiBaseUrl(baseUrl);
            return API_BASE_URL;
        } catch (error) {
            lastError = error;
        }
    }

    if (window.location.protocol === 'https:') {
        throw new Error('Frontend is running over HTTPS while the backend is only available over HTTP on port 5000.');
    }

    throw lastError || new Error('Unable to reach the backend API on port 5000.');
}

async function ensureCsrfCookie(forceRefresh = false) {
    const baseUrl = await resolveApiBaseUrl(forceRefresh);
    await fetch(`${baseUrl}/api/auth/csrf`, {
        credentials: 'include',
        headers: {
            Accept: 'application/json'
        }
    });
}

async function fetchAuthSession(forceRefresh = false) {
    const baseUrl = await resolveApiBaseUrl(forceRefresh);
    const response = await fetch(`${baseUrl}/api/auth/session`, {
        credentials: 'include',
        headers: {
            Accept: 'application/json'
        }
    });

    if (!response.ok) {
        throw new Error(`Session check failed with status ${response.status}`);
    }

    return response.json();
}

async function ensureAuthenticatedPage() {
    try {
        const session = await fetchAuthSession();
        if (!session.authenticated) {
            redirectToLogin();
            return false;
        }
        return true;
    } catch (error) {
        console.error('Authentication check failed:', error);
        document.body.classList.remove('auth-loading');
        showToast('Error', 'Cannot verify login session. Make sure the backend is running on port 5000.', 'error');
        return false;
    }
}

async function logoutUser(event) {
    if (event) {
        event.preventDefault();
    }

    try {
        if (!getCookie('csrftoken')) {
            await ensureCsrfCookie();
        }

        const baseUrl = await resolveApiBaseUrl();
        const headers = new Headers({
            Accept: 'application/json'
        });
        const csrfToken = getCookie('csrftoken');
        if (csrfToken) {
            headers.set('X-CSRFToken', csrfToken);
        }

        await fetch(`${baseUrl}/api/auth/logout`, {
            method: 'POST',
            credentials: 'include',
            headers
        });
    } catch (error) {
        console.error('Logout failed:', error);
    } finally {
        if (isBackendServedFrontend()) {
            window.location.href = buildFrontendUrl('/login/');
            return;
        }
        window.location.href = buildFrontendUrl(FRONTEND_LOGIN_FILE);
    }
}

async function apiFetch(path, options = {}, retry = true) {
    const requestPath = path.startsWith('/') ? path : `/${path}`;
    const baseUrl = await resolveApiBaseUrl();
    const method = String(options.method || 'GET').toUpperCase();
    const headers = new Headers(options.headers || {});

    if (!headers.has('Accept')) {
        headers.set('Accept', 'application/json');
    }
    if (!['GET', 'HEAD', 'OPTIONS', 'TRACE'].includes(method)) {
        let csrfToken = getCookie('csrftoken');
        if (!csrfToken) {
            await ensureCsrfCookie();
            csrfToken = getCookie('csrftoken');
        }
        if (csrfToken && !headers.has('X-CSRFToken')) {
            headers.set('X-CSRFToken', csrfToken);
        }
    }

    try {
        const response = await fetch(`${baseUrl}${requestPath}`, {
            credentials: 'include',
            ...options,
            headers
        });

        if (response.status === 401 || response.status === 403) {
            redirectToLogin();
            throw new Error('Authentication required');
        }

        return response;
    } catch (error) {
        if (!retry) {
            throw error;
        }

        API_BASE_URL = '';
        await resolveApiBaseUrl(true);
        return apiFetch(requestPath, options, false);
    }
}

// ===== تهيئة النظام =====
document.addEventListener('DOMContentLoaded', async function () {
    console.log('🚀 AI Penetration System Initialized');

    if (!await ensureAuthenticatedPage()) {
        return;
    }

    document.body.classList.remove('auth-loading');

    // تهيئة دعم اللغات
    initLanguageSupport();

    // بدء مراقبة النظام
    startSystemMonitoring();

    // التحقق من حالة API
    checkAPIStatus();

    // تحميل السجل
    loadHistory();

    // تحديث التقديرات
    updateTimeEstimate();

    // إعداد المستمعين للأحداث
    setupEventListeners();

    // بدء عداد وقت التشغيل
    startUptimeCounter();

    // تحديث حالة الأدوات
    updateToolsStatus();

    // ───── UI/UX ENHANCEMENTS ─────
    initScrollReveal();
    initBackToTop();
    initAnimatedCounters();
    initTypingEffect();
    initToolCardClicks();
    updateFooterYear();
});

/* ══════════════════════════════════════════════════════════
   UI/UX ENHANCEMENT FUNCTIONS
══════════════════════════════════════════════════════════ */

/* Scroll-reveal using IntersectionObserver */
function initScrollReveal() {
    const elements = document.querySelectorAll('.reveal, .section-dark, .cyber-card');
    elements.forEach(el => { if (!el.classList.contains('reveal')) el.classList.add('reveal'); });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.08 });

    document.querySelectorAll('.reveal').forEach(el => observer.observe(el));
}

/* Back to top */
function initBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => {
        btn.classList.toggle('show', window.scrollY > 400);
    });
}
function scrollToTop() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

/* Animated number counters */
function animateCounter(el, target, duration = 1400) {
    const isPercent = String(target).includes('%');
    const num = parseInt(String(target).replace('%', ''));
    let start = 0;
    const step = (timestamp) => {
        if (!start) start = timestamp;
        const progress = Math.min((timestamp - start) / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.floor(eased * num) + (isPercent ? '%' : '');
        if (progress < 1) requestAnimationFrame(step);
        else el.textContent = target;
    };
    requestAnimationFrame(step);
}

function initAnimatedCounters() {
    const targets = [
        { id: 'totalScans',  val: null, live: true },
        { id: 'toolsCount',  val: '4',  live: false },
    ];

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const el = entry.target;
                const raw = el.dataset.target || el.textContent.trim();
                el.dataset.target = raw;
                if (raw && raw !== '0') animateCounter(el, raw);
                observer.unobserve(el);
            }
        });
    }, { threshold: 0.5 });

    document.querySelectorAll('.stat-number').forEach(el => observer.observe(el));
}

/* Typing effect on hero subtitle */
function initTypingEffect() {
    const el = document.querySelector('.hero-description');
    if (!el) return;
    const text = el.textContent.trim();
    el.textContent = '';
    el.classList.add('typing-cursor');
    let i = 0;
    const interval = setInterval(() => {
        el.textContent += text[i++];
        if (i >= text.length) {
            clearInterval(interval);
            el.classList.remove('typing-cursor');
        }
    }, 18);
}

/* Make entire tool card clickable */
function initToolCardClicks() {
    document.querySelectorAll('.tool-selector').forEach(card => {
        const cb = card.querySelector('input[type="checkbox"]');
        if (!cb) return;

        // Set initial active class
        if (cb.checked) card.classList.add('active-tool');

        card.addEventListener('click', (e) => {
            if (e.target === cb || e.target.tagName === 'SELECT' || e.target.tagName === 'OPTION') return;
            cb.checked = !cb.checked;
            card.classList.toggle('active-tool', cb.checked);
        });

        cb.addEventListener('change', () => {
            card.classList.toggle('active-tool', cb.checked);
        });
    });
}

/* Select all / Deselect all tools */
function selectAllTools(state) {
    document.querySelectorAll('.tool-selector').forEach(card => {
        const cb = card.querySelector('input[type="checkbox"]');
        if (!cb) return;
        cb.checked = state;
        card.classList.toggle('active-tool', state);
    });
}

/* Footer year */
function updateFooterYear() {
    const el = document.getElementById('footerYear');
    if (el) el.textContent = new Date().getFullYear();
}

/* Terminal log helpers */
function showScanTerminal() {
    const term = document.getElementById('scanTerminal');
    if (term) { term.style.display = 'block'; term.querySelector('#scanTerminalLines').innerHTML = ''; }
}
function hideScanTerminal() {
    const term = document.getElementById('scanTerminal');
    if (term) term.style.display = 'none';
}
function appendTerminalLine(msg, type = '') {
    const container = document.getElementById('scanTerminalLines');
    if (!container) return;
    const line = document.createElement('div');
    line.className = 'scan-terminal-line' + (type ? ' ' + type : '');
    const now = new Date().toLocaleTimeString('en-US', { hour12: false });
    line.textContent = `[${now}] ${msg}`;
    container.appendChild(line);
    const term = document.getElementById('scanTerminal');
    if (term) term.scrollTop = term.scrollHeight;
}



// ===== إعداد المستمعين للأحداث =====
function setupEventListeners() {
    // تحديث الوقت المتوقع عند تغيير الأدوات
    document.querySelectorAll('.form-check-input').forEach(checkbox => {
        checkbox.addEventListener('change', updateTimeEstimate);
    });

    // تحديث عند تغيير نوع الفحص
    document.getElementById('scanSpeed').addEventListener('change', updateTimeEstimate);

    // بحث في السجل
    document.getElementById('historySearch').addEventListener('input', filterHistory);
    document.getElementById('historyFilter').addEventListener('change', filterHistory);

    // تحديد أهداف سريعة
    document.querySelectorAll('.quick-targets .btn').forEach(btn => {
        btn.addEventListener('click', function () {
            setTarget(this.textContent.trim());
        });
    });

    // النقر على رابط التنقل
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', smoothScroll);
    });
}

function smoothScroll(e) {
    e.preventDefault();
    const targetId = this.getAttribute('href');
    const targetElement = document.querySelector(targetId);
    if (targetElement) {
        targetElement.scrollIntoView({ behavior: 'smooth' });
    }
}

function normalizeToolKey(tool) {
    if (!tool) return tool;
    const normalized = tool.toLowerCase();
    if (
        normalized === 'owaspzap' ||
        normalized === 'owasp_zap' ||
        normalized === 'zap' ||
        normalized === 'nikto'
    ) {
        return 'owaspzap';
    }
    if (
        normalized === 'whatweb' ||
        normalized === 'burpsuite' ||
        normalized === 'burp_suite' ||
        normalized === 'burp'
    ) {
        return 'whatweb';
    }
    return normalized;
}

function getWhatWebParsed(scanData) {
    const results = scanData?.results || {};
    return results.whatweb?.parsed || results.burpsuite?.parsed || null;
}

function getWhatWebCount(scanData) {
    const parsed = getWhatWebParsed(scanData);
    if (!parsed) return 0;
    return Number(parsed.fingerprint_count || parsed.issue_count || 0);
}

function isCheckboxChecked(id) {
    const checkbox = document.getElementById(id);
    return Boolean(checkbox && checkbox.checked);
}

// ===== مراقبة النظام =====
function startSystemMonitoring() {
    // تحديث حالة النظام كل 10 ثواني
    setInterval(() => {
        updateSystemStatus();
        updateFooterStats();
    }, 10000);

    // تحديث حالة الأدوات كل 30 ثانية
    setInterval(updateToolsStatus, 30000);
}

async function checkAPIStatus() {
    try {
        const response = await apiFetch('/api/status');
        if (response.ok) {
            const data = await response.json();
            updateSystemUI(data);
            return true;
        } else {
            throw new Error('API غير متصل');
        }
    } catch (error) {
        console.error('API Connection Error:', error);
        document.getElementById('apiStatus').className = 'badge bg-danger';
        document.getElementById('apiStatus').textContent = 'غير متصل';
        document.getElementById('systemStatus').className = 'nav-status-badge bg-danger';
        document.getElementById('systemStatus').innerHTML = '<i class="fas fa-circle"></i><span>غير متصل</span>';
        document.getElementById('footerServerStatus').textContent = 'غير نشط';

        const message = error.message.includes('HTTPS')
            ? 'افتح الواجهة عبر http://localhost:8080 لأن الخادم الخلفي يعمل عبر HTTP على المنفذ 5000.'
            : 'الخادم غير متصل. تأكد من تشغيل API أو افتح الواجهة من نفس الجهاز.';
        showToast('تحذير', message, 'warning');
        return false;
    }
}

function updateSystemUI(data) {
    document.getElementById('apiStatus').className = 'badge bg-success';
    document.getElementById('apiStatus').textContent = 'نشط';
    document.getElementById('systemStatus').className = 'nav-status-badge bg-success';
    document.getElementById('systemStatus').innerHTML = '<i class="fas fa-circle"></i><span>متصل</span>';
    document.getElementById('footerServerStatus').textContent = 'نشط';
}

async function updateSystemStatus() {
    try {
        const response = await apiFetch('/api/status');
        const data = await response.json();

        // تحديث حالة النظام
        document.getElementById('activeTasks').textContent = data.active_tasks;
        document.getElementById('totalScans').textContent = data.total_scans;
        document.getElementById('footerScansCount').textContent = data.total_scans;

        // تحديث حالة الذاكرة (محاكاة)
        const memoryUsage = Math.floor(Math.random() * 30) + 50;
        document.getElementById('memoryUsage').textContent = `${memoryUsage}%`;
        document.getElementById('memoryUsage').className = memoryUsage > 75 ?
            'badge bg-danger' : memoryUsage > 60 ? 'badge bg-warning' : 'badge bg-info';

    } catch (error) {
        console.error('Error updating system status:', error);
    }
}

async function updateToolsStatus() {
    try {
        const response = await apiFetch('/api/status');
        const data = await response.json();

        // تحديث حالة كل أداة
        const tools = data.tools || {};
        for (const [tool, isInstalled] of Object.entries(tools)) {
            const normalizedTool = normalizeToolKey(tool);
            const statusElement = document.getElementById(`${normalizedTool}Status`);
            if (statusElement) {
                if (isInstalled) {
                    statusElement.className = 'badge bg-success';
                    statusElement.textContent = 'جاهز';
                } else {
                    statusElement.className = 'badge bg-secondary';
                    statusElement.textContent = 'غير مثبت';
                }
            }
        }

        // تحديث عدد الأدوات الفعالة
        const activeTools = Object.values(tools).filter(Boolean).length;
        document.getElementById('toolsCount').textContent = activeTools;

    } catch (error) {
        console.error('Error updating tools status:', error);
    }
}

function updateFooterStats() {
    const apiStatusElement = document.getElementById('apiStatus');
    const isActive = apiStatusElement.classList.contains('bg-success');
    document.getElementById('footerServerStatus').textContent = isActive ? 'نشط' : 'غير نشط';
}

function startUptimeCounter() {
    setInterval(() => {
        systemUptime++;
        const hours = Math.floor(systemUptime / 3600);
        const minutes = Math.floor((systemUptime % 3600) / 60);
        const seconds = systemUptime % 60;
        document.getElementById('footerUptime').textContent =
            `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
}

// ===== إدارة الفحص =====
async function startScan() {
    const target = document.getElementById('targetInput').value.trim();

    // التحقق من الإدخال
    if (!target) {
        showError('يرجى إدخال هدف للفحص');
        return;
    }

    // التحقق من حالة API
    if (!await checkAPIStatus()) {
        showError('لا يمكن الاتصال بالخادم');
        return;
    }

    // جمع الأدوات المختارة
    const tools = getSelectedTools();

    if (tools.length === 0) {
        showError('يرجى اختيار أداة واحدة على الأقل');
        return;
    }

    // التحقق من أن الهدف مسموح به
    if (!isValidTarget(target)) {
        showError('الهدف غير مسموح به. استخدم أحد المواقع التجريبية.');
        return;
    }

    // تأكيد للأدوات المتقدمة
    if (!await confirmAdvancedTools(tools)) {
        return;
    }

    try {
        // إعداد واجهة المستخدم للفحص
        prepareScanUI(target);

        // إرسال طلب الفحص
        const response = await apiFetch('/api/scan', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                target: target,
                tools: tools,
                scan_type: document.getElementById('scanSpeed').value
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // حفظ معرف المهمة
        currentTaskId = data.task_id;

        // بدء متابعة الفحص
        startMonitoringScan(data.task_id, target);

        showToast('نجاح', 'تم بدء الفحص بنجاح', 'success');

    } catch (error) {
        console.error('Error starting scan:', error);
        showError(`فشل بدء الفحص: ${error.message}`);
        resetScanUI();
    }
}

function getSelectedTools() {
    const tools = [];

    if (isCheckboxChecked('toolNmap')) tools.push('nmap');
    if (
        isCheckboxChecked('toolOWASPZap') ||
        isCheckboxChecked('OWASPZap') ||
        isCheckboxChecked('toolNikto')
    ) {
        tools.push('owaspzap');
    }
    if (isCheckboxChecked('toolSqlmap')) tools.push('sqlmap');
    if (isCheckboxChecked('toolWhatWeb')) tools.push('whatweb');

    return tools;
}

async function confirmAdvancedTools(tools) {
    if (tools.includes('sqlmap')) {
        const confirmed = await showConfirmation(
            'تحذير SQLMap',
            'SQLMap مخصص للأغراض التعليمية والمواقع التجريبية فقط. هل تريد المتابعة؟'
        );
        if (!confirmed) return false;
    }

    if (tools.includes('whatweb')) {
        const confirmed = await showConfirmation(
            'تحذير WhatWeb',
            'WhatWeb يكشف تقنيات الويب والإعدادات الظاهرة للخدمة. استخدمه على أهداف مفوضة فقط. هل تريد المتابعة؟'
        );
        if (!confirmed) return false;
    }

    return true;
}

function showConfirmation(title, message) {
    return Swal.fire({
        title: title,
        text: message,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، تابع',
        cancelButtonText: 'إلغاء',
        customClass: {
            confirmButton: 'btn btn-danger',
            cancelButton: 'btn btn-secondary'
        },
        buttonsStyling: false
    }).then((result) => {
        return result.isConfirmed;
    });
}

function prepareScanUI(target) {
    // إخفاء أقسام النتائج
    document.getElementById('resultsSection').style.display = 'none';

    // تعطيل أزرار البدء
    const scanBtn = document.querySelector('.cyber-btn-primary');
    scanBtn.disabled = true;
    scanBtn.innerHTML = '<i class="fas fa-spinner fa-spin me-2"></i>جارٍ البدء...';

    // تحديث معلومات الفحص
    document.getElementById('currentTarget').textContent = target;
    document.getElementById('elapsedTime').textContent = '00:00';

    // إعادة تعيين شريط التقدم
    document.getElementById('mainProgressBar').style.width = '0%';
    document.getElementById('overallProgress').textContent = '0%';
    document.getElementById('scanCompletionScore').textContent = '0%';
    document.getElementById('scanCurrentPhase').textContent = 'Queued';
    document.getElementById('scanEta').textContent = '--:--';
    document.getElementById('toolsProgressContainer').innerHTML = '';

    // إخفاء النتائج الأولية
    document.getElementById('preliminaryResults').style.display = 'none';

    // إظهار قسم التقدم
    document.getElementById('progressSection').style.display = 'block';
    document.getElementById('progressSection').scrollIntoView({ behavior: 'smooth' });

    // بدء عداد الوقت المنقضي
    startElapsedTimer();
}

function startElapsedTimer() {
    if (window.elapsedTimer) clearInterval(window.elapsedTimer);

    let seconds = 0;
    window.elapsedTimer = setInterval(() => {
        seconds++;
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        document.getElementById('elapsedTime').textContent =
            `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }, 1000);
}

async function startMonitoringScan(taskId, target) {
    let attempts = 0;
    const maxAttempts = 180; // 15 دقيقة
    let lastProgress = 0;

    scanInterval = setInterval(async () => {
        attempts++;

        try {
            const response = await apiFetch(`/api/scan/${taskId}`);

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // تحديث التقدم
            updateScanProgress(data, attempts, maxAttempts);

            // إذا اكتمل الفحص
            if (data.status === 'completed') {
                clearInterval(scanInterval);
                clearInterval(window.elapsedTimer);
                setTimeout(() => completeScan(data), 1000);
            }

            // إذا فشل الفحص
            if (data.status === 'failed') {
                clearInterval(scanInterval);
                clearInterval(window.elapsedTimer);
                showError('فشل الفحص. يرجى المحاولة مرة أخرى.');
                resetScanUI();
            }

            // إذا تجاوز الحد الزمني
            if (attempts >= maxAttempts) {
                clearInterval(scanInterval);
                clearInterval(window.elapsedTimer);
                showError('انتهت مهلة الفحص');
                resetScanUI();
            }

        } catch (error) {
            console.error('Error monitoring scan:', error);

            if (attempts >= maxAttempts) {
                clearInterval(scanInterval);
                clearInterval(window.elapsedTimer);
                showError('انتهت مهلة الاتصال بالخادم');
                resetScanUI();
            }
        }
    }, 5000);
}

function updateScanProgress(scanData, currentAttempt, maxAttempts) {
    const backendProgress = Number(scanData.progress || 0);
    const fallbackProgress = Math.min(95, (currentAttempt / maxAttempts) * 100);
    const progressPercent = scanData.status === 'completed'
        ? 100
        : Math.max(backendProgress, fallbackProgress);
    const progressBar = document.getElementById('mainProgressBar');
    const progressText = document.getElementById('overallProgress');

    progressBar.style.width = `${progressPercent}%`;
    progressText.textContent = `${Math.round(progressPercent)}%`;
    document.getElementById('scanCompletionScore').textContent = `${Math.round(progressPercent)}%`;
    document.getElementById('scanCurrentPhase').textContent = getCurrentPhaseLabel(scanData, progressPercent);
    document.getElementById('scanEta').textContent = getEstimatedRemainingTime(progressPercent);

    // تحديث تقدم الأدوات
    updateToolsProgressUI(scanData, progressPercent);

    // إظهار النتائج الأولية إذا كانت متاحة
    if (scanData.results && Object.keys(scanData.results).length > 0) {
        showPreliminaryResults(scanData.results);
    }
}

function getCurrentPhaseLabel(scanData, progressPercent) {
    if (scanData.status === 'completed') return 'Completed';
    if (scanData.status === 'failed') return 'Failed';

    const selectedTools = getSelectedTools();
    const activeTool = selectedTools.find(tool => !scanData.results?.[tool]);
    if (activeTool) {
        return `Running ${getToolName(activeTool)}`;
    }
    return progressPercent > 0 ? 'Finalizing results' : 'Queued';
}

function getEstimatedRemainingTime(progressPercent) {
    const elapsedValue = document.getElementById('elapsedTime').textContent || '00:00';
    const [minutesText, secondsText] = elapsedValue.split(':');
    const elapsedSeconds = Number(minutesText || 0) * 60 + Number(secondsText || 0);

    if (!progressPercent || progressPercent >= 100 || elapsedSeconds <= 0) {
        return '--:--';
    }

    const estimatedTotalSeconds = elapsedSeconds / (progressPercent / 100);
    const remainingSeconds = Math.max(0, Math.round(estimatedTotalSeconds - elapsedSeconds));
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
}

function updateToolsProgressUI(scanData, progressPercent) {
    const container = document.getElementById('toolsProgressContainer');
    const selectedTools = getSelectedTools();

    let html = '';
    const bucketSize = selectedTools.length ? 100 / selectedTools.length : 100;

    selectedTools.forEach((tool, index) => {
        const toolData = scanData.results?.[tool];
        const bucketStart = index * bucketSize;
        const bucketProgress = Math.min(
            100,
            Math.max(0, ((progressPercent - bucketStart) / bucketSize) * 100)
        );
        const progress = toolData ? 100 : Math.round(bucketProgress);
        const status = toolData ? 'Completed' : progress > 0 ? 'Running' : 'Queued';
        const statusClass = toolData ? 'bg-success' : progress > 0 ? 'bg-warning' : 'bg-secondary';

        html += `
            <div class="tool-progress-item">
                <div class="tool-icon-small ${tool}">
                    <i class="${getToolIcon(tool)}"></i>
                </div>
                <div class="tool-name">${getToolName(tool)}</div>
                <div class="tool-progress-bar">
                    <div class="progress" style="height: 6px;">
                        <div class="progress-bar ${progress === 100 ? 'bg-success' : 'bg-warning'}" 
                             style="width: ${progress}%"></div>
                    </div>
                </div>
                <div class="tool-status">
                    <span class="badge ${statusClass}">${status} ${progress}%</span>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function showPreliminaryResults(results) {
    const container = document.getElementById('quickResults');
    let html = '';

    for (const [tool, data] of Object.entries(results)) {
        if (data.parsed) {
            const normalizedTool = normalizeToolKey(tool);
            const findings = extractQuickFindings(normalizedTool, data.parsed);
            if (findings) {
                html += `
                    <div class="col-md-6 mb-3">
                        <div class="quick-result-card">
                            <h6><i class="${getToolIcon(normalizedTool)} me-2"></i>${getToolName(normalizedTool)}</h6>
                            <div class="quick-findings">${findings}</div>
                        </div>
                    </div>
                `;
            }
        }
    }

    if (html) {
        document.getElementById('preliminaryResults').style.display = 'block';
        container.innerHTML = html;
    }
}

function extractQuickFindings(tool, parsedData) {
    switch (tool) {
        case 'nmap':
            const ports = parsedData.open_ports || [];
            if (ports.length > 0) {
                const portList = ports.slice(0, 3).map(p => p.port).join(', ');
                return `منافذ مفتوحة: ${portList}${ports.length > 3 ? '...' : ''}`;
            }
            return 'لا توجد منافذ مفتوحة';

        case 'owaspzap':
            const vulns = parsedData.count || 0;
            if (vulns > 0) {
                return `${vulns} ثغرة ويب مكتشفة`;
            }
            return 'لا توجد ثغرات ويب';

        case 'sqlmap':
            if (parsedData.vulnerable) {
                return 'تم اكتشاف ثغرة SQL Injection';
            }
            return 'لم يتم اكتشاف ثغرات SQL';

        case 'whatweb':
            return `WhatWeb fingerprints: ${parsedData.fingerprint_count || parsedData.issue_count || 0}`;

        default:
            return null;
    }
}

function completeScan(scanData) {
    // حفظ النتائج
    scanResults = scanData;

    // إعداد واجهة النتائج
    prepareResultsUI(scanData);

    // إعادة تمكين الأزرار
    resetScanUI();

    // إظهار النتائج
    document.getElementById('progressSection').style.display = 'none';
    document.getElementById('resultsSection').style.display = 'block';
    document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });

    // تحديث السجل
    loadHistory();

    showToast('اكتمال', 'تم الانتهاء من الفحص بنسجاح', 'success');
}

function prepareResultsUI(scanData) {
    // تحديث معلومات الفحص
    document.getElementById('resultTarget').textContent = scanData.target;
    document.getElementById('resultTaskId').textContent = scanData.task_id;
    document.getElementById('resultTime').textContent = new Date().toLocaleString(getLocale());

    // تحديث جميع الأقسام
    updateSummary(scanData);
    updateDetails(scanData);
    updateAIAnalysis(scanData);
    updateRecommendations(scanData);
    updateSecurityChart(scanData);
}

function updateSummary(scanData) {
    const stats = calculateStatistics(scanData);

    // تحديث الأرقام
    document.getElementById('statPorts').textContent = stats.openPorts;
    document.getElementById('statVulns').textContent = stats.vulnerabilities;
    document.getElementById('statServices').textContent = stats.services;
    document.getElementById('statRisk').textContent = `${stats.riskPercentage}%`;
    document.getElementById('insightRiskScore').textContent = `${stats.riskPercentage}%`;
    document.getElementById('insightConfidenceScore').textContent = `${stats.confidenceScore}%`;
    document.getElementById('insightCompletionScore').textContent = `${stats.completionScore}%`;
    document.getElementById('insightFindingsCount').textContent = stats.findingsTotal;

    // تحديث مستوى الخطورة
    const riskLevel = document.getElementById('riskLevel');
    riskLevel.innerHTML = `
        <div class="risk-indicator ${stats.riskLevel}">
            <div class="risk-label">${getRiskLabel(stats.riskLevel)}</div>
            <div class="risk-bar">
                <div class="risk-fill" style="width: ${stats.riskPercentage}%"></div>
            </div>
        </div>
    `;

    // تحديث النتائج الرئيسية
    updateKeyFindings(scanData);
    updateNextActions(scanData);
}

function calculateStatistics(scanData) {
    if (scanData.summary) {
        return {
            openPorts: scanData.summary.open_ports || 0,
            vulnerabilities: scanData.summary.web_findings || 0,
            services: scanData.summary.services || 0,
            riskLevel: (scanData.summary.risk_level || 'low').toLowerCase(),
            riskPercentage: scanData.summary.risk_score || 0,
            confidenceScore: scanData.summary.confidence_score || 0,
            completionScore: scanData.summary.completion_score || 0,
            toolCoverage: scanData.summary.tool_coverage || 0,
            findingsTotal: scanData.summary.findings_total || 0,
            topIssues: scanData.summary.top_issues || [],
            nextActions: scanData.summary.next_actions || []
        };
    }

    let openPorts = 0;
    let vulnerabilities = 0;
    let services = new Set();
    let riskScore = 0;

    // Nmap
    if (scanData.results?.nmap?.parsed) {
        const nmapData = scanData.results.nmap.parsed;
        openPorts = nmapData.open_ports?.length || 0;

        nmapData.open_ports?.forEach(port => {
            if (port.service) services.add(port.service);

            // حساب درجة الخطورة
            if (['22', '21', '23', '3389'].includes(port.port)) {
                riskScore += 30;
            } else if (['80', '443', '8080'].includes(port.port)) {
                riskScore += 10;
            } else {
                riskScore += 5;
            }
        });
    }

    // OWASPZap
    if (scanData.results?.owaspzap?.parsed) {
        vulnerabilities += scanData.results.owaspzap.parsed.count || 0;
        riskScore += (scanData.results.owaspzap.parsed.count || 0) * 5;
    }

    const whatwebCount = getWhatWebCount(scanData);
    if (whatwebCount > 0) {
        vulnerabilities += whatwebCount;
        riskScore += whatwebCount * 6;
    }

    // SQLMap
    if (scanData.results?.sqlmap?.parsed?.vulnerable) {
        riskScore += 50;
    }

    // تحديد مستوى الخطورة
    let riskLevel = 'low';
    let riskPercentage = Math.min(100, riskScore);

    if (riskScore >= 70) {
        riskLevel = 'high';
    } else if (riskScore >= 30) {
        riskLevel = 'medium';
    }

    return {
        openPorts,
        vulnerabilities,
        services: services.size,
        riskLevel,
        riskPercentage,
        confidenceScore: Math.min(95, 50 + (vulnerabilities * 5) + (openPorts > 0 ? 10 : 0)),
        completionScore: Number(scanData.progress || 100),
        toolCoverage: 100,
        findingsTotal: vulnerabilities + (scanData.results?.sqlmap?.parsed?.vulnerable ? 1 : 0),
        topIssues: [],
        nextActions: []
    };
}

function getRiskLabel(level) {
    switch (level) {
        case 'high': return 'عالية';
        case 'medium': return 'متوسطة';
        case 'low': return 'منخفضة';
        default: return 'غير معروفة';
    }
}

function updateKeyFindings(scanData) {
    const container = document.getElementById('keyFindings');
    const stats = calculateStatistics(scanData);
    let findings = [];

    if (scanData.results?.nmap?.parsed?.open_ports?.length > 0) {
        findings.push(`${scanData.results.nmap.parsed.open_ports.length} منفذ مفتوح`);
    }

    if (scanData.results?.owaspzap?.parsed?.count > 0) {
        findings.push(`${scanData.results.owaspzap.parsed.count} ثغرة في الويب`);
    }

    if (scanData.results?.sqlmap?.parsed?.vulnerable) {
        findings.push('ثغرة SQL Injection محتملة');
    }

    if (getWhatWebCount(scanData) > 0) {
        findings.push(`${getWhatWebCount(scanData)} WhatWeb fingerprint(s) detected`);
    }

    if (findings.length === 0 && stats.topIssues.length > 0) {
        findings = [...stats.topIssues];
    }

    let html = '<ul class="findings-list">';
    findings.forEach(finding => {
        html += `<li><i class="fas fa-exclamation-circle me-2 text-warning"></i>${finding}</li>`;
    });

    if (findings.length === 0) {
        html += '<li class="text-success"><i class="fas fa-check-circle me-2"></i>لا توجد ثغرات حرجة</li>';
    }

    html += '</ul>';
    container.innerHTML = html;
}

function updateNextActions(scanData) {
    const container = document.getElementById('nextActionsList');
    const stats = calculateStatistics(scanData);
    const actions = stats.nextActions.length > 0
        ? stats.nextActions
        : generateRecommendations(scanData).slice(0, 3).map(rec => rec.title);

    container.innerHTML = `
        <div class="next-actions-list">
            ${actions.map((action, index) => `
                <div class="next-action-item">
                    <div class="next-action-number">${index + 1}</div>
                    <div class="next-action-text">${action}</div>
                </div>
            `).join('')}
        </div>
    `;
}

function updateDetails(scanData) {
    const container = document.getElementById('resultsAccordion');
    let html = '';
    let accordionId = 0;

    for (const [tool, data] of Object.entries(scanData.results || {})) {
        if (data) {
            accordionId++;
            const normalizedTool = normalizeToolKey(tool);
            const toolName = getToolName(normalizedTool);
            const icon = getToolIcon(normalizedTool);
            const status = data.status || 'unknown';
            const statusText = status === 'completed' ? 'مكتمل' : 'فشل';
            const statusClass = status === 'completed' ? 'bg-success' : 'bg-danger';

            html += `
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" 
                                data-bs-target="#collapse${accordionId}">
                            <i class="${icon} me-2"></i>
                            ${toolName}
                            <span class="badge ms-2 ${statusClass}">${statusText}</span>
                        </button>
                    </h2>
                    <div id="collapse${accordionId}" class="accordion-collapse collapse">
                        <div class="accordion-body">
                            ${formatToolResults(normalizedTool, data)}
                        </div>
                    </div>
                </div>
            `;
        }
    }

    container.innerHTML = html;

    // فتح أول قسم تلقائياً
    if (accordionId > 0) {
        const firstAccordion = document.querySelector('#resultsAccordion .accordion-button');
        if (firstAccordion) {
            firstAccordion.classList.remove('collapsed');
            const target = firstAccordion.getAttribute('data-bs-target');
            document.querySelector(target).classList.add('show');
        }
    }
}

function formatToolResults(tool, data) {
    let html = '';

    if (data.error) {
        html += `<div class="alert alert-danger">${data.error}</div>`;
    }

    if (data.parsed) {
        html += formatParsedData(tool, data.parsed);
    }

    if (data.raw && data.raw.length > 0 && data.raw !== 'No data') {
        html += `
            <div class="mt-3">
                <button class="btn btn-sm btn-outline-secondary" onclick="showRawOutput('${tool}')">
                    <i class="fas fa-code me-1"></i>عرض النتائج الخام
                </button>
            </div>
        `;
    }

    return html || '<p>لا توجد بيانات لعرضها</p>';
}

function formatParsedData(tool, parsedData) {
    switch (tool) {
        case 'nmap':
            return formatNmapData(parsedData);
        case 'owaspzap':
            return formatOWASPZapData(parsedData);
        case 'sqlmap':
            return formatSQLMapData(parsedData);
        case 'whatweb':
            return formatWhatWebData(parsedData);
        case 'metasploit':
            return formatMetasploitData(parsedData);
        default:
            return '<p>بيانات غير معروفة</p>';
    }
}

function formatNmapData(data) {
    let html = '<h6>المنافذ المفتوحة:</h6>';

    if (data.open_ports && data.open_ports.length > 0) {
        html += '<div class="row">';
        data.open_ports.forEach(port => {
            const risk = getPortRisk(port.port);
            html += `
                <div class="col-3 mb-2">
                    <div class="port-display ${risk}">
                        <div class="port-number">${port.port}/TCP</div>
                        <div class="port-service">${port.service || 'غير معروف'}</div>
                    </div>
                </div>
            `;
        });
        html += '</div>';
    } else {
        html += '<p class="text-success">لا توجد منافذ مفتوحة</p>';
    }

    return html;
}

function formatOWASPZapData(data) {
    let html = `<h6>عدد الثغرات: ${data.count || 0}</h6>`;

    if (data.vulnerabilities && data.vulnerabilities.length > 0) {
        html += '<div class="vulnerability-list">';
        data.vulnerabilities.slice(0, 10).forEach(vuln => {
            html += `<div class="vuln-item"><i class="fas fa-bug me-2 text-danger"></i>${vuln}</div>`;
        });

        if (data.vulnerabilities.length > 10) {
            html += `<p class="text-muted">و ${data.vulnerabilities.length - 10} أكثر...</p>`;
        }
        html += '</div>';
    }

    return html;
}

function formatSQLMapData(data) {
    if (data.vulnerable) {
        return `
            <div class="alert alert-danger">
                <i class="fas fa-exclamation-triangle me-2"></i>
                <strong>تم اكتشاف ثغرة SQL Injection!</strong>
                <p class="mb-0 mt-2">يوجد ضعف في معالجة استعلامات SQL في التطبيق.</p>
            </div>
        `;
    } else {
        return `
            <div class="alert alert-success">
                <i class="fas fa-check-circle me-2"></i>
                <strong>لم يتم اكتشاف ثغرات SQL Injection</strong>
                <p class="mb-0 mt-2">التطبيق محمي ضد هجمات حقن SQL.</p>
            </div>
        `;
    }
}

function formatMetasploitData(data) {
    return `
        <div class="alert alert-info">
            <i class="fas fa-info-circle me-2"></i>
            <strong>تم تنفيذ فحص Metasploit</strong>
            <p class="mb-0 mt-2">تم استخدام وحدات المسح الأساسية للتحقق من نقاط الضعف الشائعة.</p>
        </div>
    `;
}

function formatWhatWebData(data) {
    const fingerprints = data.fingerprints || [];
    const count = Number(data.fingerprint_count || data.issue_count || fingerprints.length || 0);

    if (!fingerprints.length && !count) {
        return `
            <div class="alert alert-success">
                <i class="fas fa-check-circle me-2"></i>
                <strong>WhatWeb completed without notable technology fingerprints.</strong>
            </div>
        `;
    }

    return `
        <div class="alert alert-info">
            <i class="fas fa-fingerprint me-2"></i>
            <strong>WhatWeb identified ${count} fingerprint(s).</strong>
            <div class="mt-3">
                ${(fingerprints.length ? fingerprints : ['Fingerprint data available in raw output']).map(item => `
                    <div class="vuln-item">
                        <span>${item}</span>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function getPortRisk(port) {
    if (['22', '21', '23', '3389', '445', '139'].includes(port)) {
        return 'high-risk';
    } else if (['80', '443', '8080', '8443'].includes(port)) {
        return 'medium-risk';
    } else {
        return 'low-risk';
    }
}

function parseAIReportSections(reportText) {
    const sections = {
        executive: [],
        issues: [],
        actions: [],
        notes: []
    };
    let currentSection = 'executive';

    String(reportText || '')
        .split(/\r?\n/)
        .map(line => line.trim())
        .filter(Boolean)
        .forEach(line => {
            const normalized = line.toLowerCase();

            if (normalized.startsWith('executive summary:')) {
                currentSection = 'executive';
                const content = line.slice('Executive Summary:'.length).trim();
                if (content) sections.executive.push(content);
                return;
            }
            if (normalized.startsWith('top issues:') || normalized.startsWith('top findings:')) {
                currentSection = 'issues';
                const content = line.split(':').slice(1).join(':').trim();
                if (content) sections.issues.push(content);
                return;
            }
            if (
                normalized.startsWith('recommendations:') ||
                normalized.startsWith('action plan:') ||
                normalized.startsWith('next actions:')
            ) {
                currentSection = 'actions';
                const content = line.split(':').slice(1).join(':').trim();
                if (content) sections.actions.push(content);
                return;
            }
            if (normalized.startsWith('note:')) {
                sections.notes.push(line.replace(/^note:\s*/i, ''));
                return;
            }

            const cleaned = line.replace(/^[-*]\s*/, '');
            sections[currentSection].push(cleaned);
        });

    return sections;
}

function updateAIAnalysis(scanData) {
    const analysisContainer = document.getElementById('aiAnalysis');
    const issuesContainer = document.getElementById('aiRelationships');
    const actionsContainer = document.getElementById('aiPredictions');
    const parsedReport = parseAIReportSections(scanData.ai_report);
    const heuristicAnalysis = generateAIAnalysis(scanData);
    const recommendations = generateRecommendations(scanData);

    const executiveLines = parsedReport.executive.length > 0
        ? parsedReport.executive
        : [heuristicAnalysis.summary];
    const issueLines = parsedReport.issues.length > 0
        ? parsedReport.issues
        : heuristicAnalysis.patterns;
    const actionLines = parsedReport.actions.length > 0
        ? parsedReport.actions
        : recommendations.slice(0, 3).map(rec => rec.title);

    analysisContainer.innerHTML = `
        <div class="ai-section-content">
            ${executiveLines.map(line => `<p class="ai-text mb-2">${line}</p>`).join('')}
            ${parsedReport.notes.length > 0 ? `
                <div class="recommendation-why mt-3">
                    <strong>Analyst Note:</strong> ${parsedReport.notes.join(' ')}
                </div>
            ` : ''}
        </div>
    `;
    issuesContainer.innerHTML = `
        <div class="ai-section-content">
            <ul class="ai-patterns">
                ${issueLines.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `;
    actionsContainer.innerHTML = `
        <div class="ai-section-content">
            <ul class="ai-patterns">
                ${actionLines.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
    `;
}

function generateAIAnalysis(scanData) {
    const stats = calculateStatistics(scanData);

    let summary = '';
    if (stats.riskLevel === 'high') {
        summary = 'The target shows critical weaknesses that need immediate remediation. The current exposure level creates a high likelihood of compromise if these issues remain unresolved.';
    } else if (stats.riskLevel === 'medium') {
        summary = 'The target has several meaningful security issues that should be addressed. The overall posture is manageable, but it needs focused hardening and remediation work.';
    } else {
        summary = 'The target appears relatively stable, with only limited signs of immediate risk. The current posture is acceptable, but routine review and monitoring are still required.';
    }

    const patterns = [];
    if (scanData.results?.nmap?.parsed?.open_ports) {
        const webPorts = scanData.results.nmap.parsed.open_ports.filter(p =>
            ['80', '443', '8080', '8443'].includes(p.port)
        );
        if (webPorts.length > 0) {
            patterns.push('Internet-facing web services are active and should receive deeper application-layer testing.');
        }

        const adminPorts = scanData.results.nmap.parsed.open_ports.filter(p =>
            ['22', '21', '23', '3389'].includes(p.port)
        );
        if (adminPorts.length > 0) {
            patterns.push('Administrative access ports are exposed and should be tightly restricted and hardened.');
        }
    }

    if (scanData.results?.owaspzap?.parsed?.count > 0) {
        patterns.push('Web-layer findings indicate missing defensive controls and patching gaps.');
    }

    if (getWhatWebCount(scanData) > 0) {
        patterns.push('WhatWeb identified exposed technologies that should be reviewed for hardening and patching.');
    }

    return {
        summary,
        patterns: patterns.length > 0 ? patterns : ['No clear recurring patterns were detected in the current scan results.']
    };
}

function updateRecommendations(scanData) {
    const container = document.getElementById('recommendationsList');
    const recommendations = generateRecommendations(scanData);

    let html = '';
    recommendations.forEach((rec, index) => {
        html += `
            <div class="recommendation-item ${rec.priority}">
                <div class="recommendation-header">
                    <div class="recommendation-title">
                        <span class="recommendation-number">${index + 1}</span>
                        ${rec.title}
                    </div>
                    <span class="recommendation-priority ${rec.priority}">
                        ${rec.priority === 'high' ? 'High' : rec.priority === 'medium' ? 'Medium' : 'Low'}
                    </span>
                </div>
                <div class="recommendation-meta">
                    <span class="recommendation-chip">Owner: ${rec.owner}</span>
                    <span class="recommendation-chip">Effort: ${rec.effort}</span>
                    <span class="recommendation-chip">Status: ${rec.status}</span>
                </div>
                <div class="recommendation-description">
                    ${rec.description}
                </div>
                <div class="recommendation-why">
                    <strong>Why it matters:</strong> ${rec.why}
                </div>
                ${rec.steps ? `
                    <div class="recommendation-steps">
                        <div class="recommendation-steps-title">Implementation Steps:</div>
                        ${rec.steps.map((step, i) => `
                            <div class="step-item">
                                <div class="step-number">${i + 1}</div>
                                <div class="step-content">${step}</div>
                            </div>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
        `;
    });

    container.innerHTML = html;
}

function generateRecommendations(scanData) {
    const recommendations = [];
    const stats = calculateStatistics(scanData);

    // General recommendations remain English-only regardless of UI language.
    if (stats.openPorts > 0) {
        recommendations.push({
            title: 'Close Unnecessary Ports',
            description: 'Unused open ports expand the attack surface and should be removed from exposure.',
            priority: stats.riskLevel === 'high' ? 'high' : 'medium',
            why: 'Exposed services are often the first foothold for reconnaissance, brute force attempts, and exploit delivery.',
            effort: 'Medium',
            owner: 'Infrastructure',
            status: 'Open',
            steps: [
                'Identify open ports that are no longer required by the application or host.',
                'Restrict or close them using host and network firewall rules.',
                'Disable the underlying services where they are not operationally necessary.'
            ]
        });
    }

    if (stats.vulnerabilities > 0) {
        recommendations.push({
            title: 'Patch the Identified Vulnerabilities',
            description: 'The detected findings may be exploitable and should be remediated in priority order.',
            priority: 'high',
            why: 'Leaving known web findings unresolved increases the likelihood of direct exploitation and chained attacks.',
            effort: 'Medium',
            owner: 'Application Security',
            status: 'In Review',
            steps: [
                'Review the OWASPZap findings to understand affected paths and risk levels.',
                'Apply available security updates and framework patches.',
                'Tighten server configuration to reduce unnecessary exposure.'
            ]
        });
    }

    const whatwebCount = getWhatWebCount(scanData);
    if (whatwebCount > 0) {
        recommendations.push({
            title: 'Review WhatWeb Fingerprints',
            description: 'WhatWeb detected exposed technologies and headers that should be validated against hardening baselines.',
            priority: whatwebCount > 3 ? 'high' : 'medium',
            why: 'Stack fingerprinting helps attackers choose targeted exploits when outdated or weak components are exposed.',
            effort: 'Medium',
            owner: 'AppSec',
            status: 'Open',
            steps: [
                'Inventory detected technologies and their versions.',
                'Patch outdated components and remove unnecessary technology disclosures.',
                'Harden headers and server configuration to reduce passive fingerprint leakage.'
            ]
        });
    }

    if (scanData.results?.sqlmap?.parsed?.vulnerable) {
        recommendations.push({
            title: 'Remediate the SQL Injection Risk',
            description: 'SQL injection exposure can allow attackers to access, alter, or exfiltrate database content.',
            priority: 'high',
            why: 'SQL injection remains one of the fastest paths to data compromise and privilege escalation.',
            effort: 'High',
            owner: 'Backend Engineering',
            status: 'Open',
            steps: [
                'Use parameterized queries or prepared statements throughout the data access layer.',
                'Enforce strict server-side input validation and output handling.',
                'Reduce database account privileges to the minimum required scope.'
            ]
        });
    }

    recommendations.push({
        title: 'Strengthen Firewall Controls',
        description: 'Firewall policy should limit exposure to only the ports and sources that are operationally required.',
        priority: 'medium',
        why: 'Network filtering reduces unnecessary exposure and limits the blast radius of future vulnerabilities.',
        effort: 'Low',
        owner: 'Infrastructure',
        status: 'Planned',
        steps: [
            'Enable a host-based or network firewall on the target environment.',
            'Allow only required inbound services and trusted source ranges.',
            'Review firewall logs regularly for unexpected connection attempts.'
        ]
    });

    recommendations.push({
        title: 'Maintain Reliable Backups',
        description: 'A tested backup and recovery process reduces the impact of compromise, corruption, and operational failure.',
        priority: 'low',
        why: 'Recovery capability is essential when prevention fails or remediation introduces unintended side effects.',
        effort: 'Medium',
        owner: 'Operations',
        status: 'Planned',
        steps: [
            'Define and automate a backup schedule that matches business requirements.',
            'Test restoration workflows so recovery time is predictable.',
            'Store backup copies in a secure and isolated location.'
        ]
    });

    return recommendations;
}

function updateSecurityChart(scanData) {
    const ctx = document.getElementById('securityChart').getContext('2d');
    const stats = calculateStatistics(scanData);
    const chartLabels = currentLanguage === 'en' ? ['Safe', 'Moderate', 'Critical'] : ['آمن', 'متوسط', 'خطير'];

    // إزالة الرسم البياني القديم إذا كان موجوداً
    if (window.securityChart instanceof Chart) {
        window.securityChart.destroy();
    }

    window.securityChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: chartLabels,
            datasets: [{
                data: [
                    100 - stats.riskPercentage,
                    stats.riskPercentage > 50 ? stats.riskPercentage - 30 : 20,
                    stats.riskPercentage > 30 ? 30 : stats.riskPercentage
                ],
                backgroundColor: [
                    '#10b981',
                    '#f59e0b',
                    '#ef4444'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        color: '#f8fafc',
                        font: {
                            family: 'Cairo',
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function (context) {
                            return `${context.label}: ${context.raw}%`;
                        }
                    }
                }
            }
        }
    });
}

// ===== إدارة النتائج الخام =====
function showRawResults(tool) {
    const normalizedTool = normalizeToolKey(tool);
    const results = scanResults.results || {};

    if (results[normalizedTool] || results[tool]) {
        const data = results[normalizedTool] || results[tool];
        const output = document.getElementById('rawOutput');

        if (data.raw && data.raw.length > 0) {
            output.textContent = data.raw;
        } else if (data.error) {
            output.textContent = `Error: ${data.error}`;
        } else {
            output.textContent = 'لا توجد بيانات خام متاحة';
        }
    } else {
        document.getElementById('rawOutput').textContent = 'لا توجد بيانات لهذه الأداة';
    }
}

// ===== إدارة السجل =====
async function loadHistory() {
    try {
        const response = await apiFetch('/api/history?limit=100');
        if (!response.ok) throw new Error('Failed to load history');

        const data = await response.json();
        historyData = data.history || [];
        updateHistoryOverview(historyData);
        displayHistoryPage(1);
        setupPagination();
    } catch (error) {
        console.error('Error loading history:', error);
        historyData = [];
        updateHistoryOverview([]);
        displayHistoryPage(1);
    }
}

function updateHistoryOverview(dataset = historyData) {
    const records = dataset || [];
    const total = records.length;
    const averageRisk = total
        ? Math.round(records.reduce((sum, scan) => sum + (scan.summary?.risk_score || 0), 0) / total)
        : 0;
    const averageCompletion = total
        ? Math.round(records.reduce((sum, scan) => sum + (scan.summary?.completion_score || scan.progress || 0), 0) / total)
        : 0;
    const criticalCount = records.filter(scan => (scan.summary?.risk_level || '').toLowerCase() === 'high').length;

    document.getElementById('historyTotalMetric').textContent = total;
    document.getElementById('historyRiskMetric').textContent = `${averageRisk}%`;
    document.getElementById('historyCompletionMetric').textContent = `${averageCompletion}%`;
    document.getElementById('historyCriticalMetric').textContent = criticalCount;

    const latest = records[0];
    const previous = records[1];
    let trendText = 'Awaiting scan history to calculate the latest trend.';

    if (latest && previous) {
        const latestRisk = latest.summary?.risk_score || 0;
        const previousRisk = previous.summary?.risk_score || 0;
        const difference = latestRisk - previousRisk;
        const direction = difference > 0 ? 'increased' : difference < 0 ? 'decreased' : 'held steady';
        trendText = `Latest recorded risk ${direction} from ${previousRisk}% to ${latestRisk}%.`;
    } else if (latest) {
        trendText = `Latest scan risk is ${latest.summary?.risk_score || 0}% with ${latest.summary?.findings_total || 0} finding(s).`;
    }

    document.getElementById('historyTrendText').textContent = trendText;
}

function displayHistoryPage(page) {
    currentPage = page;
    const startIndex = (page - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = historyData.slice(startIndex, endIndex);

    const tbody = document.getElementById('historyTableBody');
    let html = '';

    if (pageData.length === 0) {
        html = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-history fa-2x text-muted mb-3"></i>
                    <p>لا توجد فحوصات سابقة</p>
                </td>
            </tr>
        `;
    } else {
        pageData.forEach((scan, index) => {
            const date = formatHistoryDate(scan.created_at);
            const tools = scan.tools || [];
            const status = scan.status || 'unknown';

            html += `
                <tr>
                    <td>${date}</td>
                    <td>${scan.target}</td>
                    <td>
                        <div class="tools-badges">
                            ${tools.map(tool => `
                                <span class="tool-badge-small ${normalizeToolKey(tool)}">
                                    ${getToolName(tool)}
                                </span>
                            `).join('')}
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${status}">
                            ${getStatusText(status)}
                        </span>
                    </td>
                    <td>
                        ${calculateDuration(scan.created_at, scan.completed_at)}
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-info" onclick="viewScanDetails('${scan.task_id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger ms-2" onclick="deleteScan('${scan.task_id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    tbody.innerHTML = html;
    updatePaginationButtons();
}

function setupPagination() {
    const totalPages = Math.ceil(historyData.length / itemsPerPage);
    const pagination = document.getElementById('historyPagination');
    let html = '';

    for (let i = 1; i <= totalPages; i++) {
        html += `
            <li class="page-item ${i === currentPage ? 'active' : ''}">
                <a class="page-link" href="#" onclick="goToPage(${i})">${i}</a>
            </li>
        `;
    }

    pagination.innerHTML = html;
}

function goToPage(page) {
    displayHistoryPage(page);
}

function updatePaginationButtons() {
    const pageItems = document.querySelectorAll('#historyPagination .page-item');
    pageItems.forEach(item => {
        item.classList.remove('active');
        const pageNum = parseInt(item.querySelector('.page-link').textContent);
        if (pageNum === currentPage) {
            item.classList.add('active');
        }
    });
}

function filterHistory() {
    const searchTerm = document.getElementById('historySearch').value.toLowerCase();
    const filterType = document.getElementById('historyFilter').value;

    let filtered = historyData;

    if (searchTerm) {
        filtered = filtered.filter(scan =>
            scan.target.toLowerCase().includes(searchTerm) ||
            scan.task_id.toLowerCase().includes(searchTerm)
        );
    }

    if (filterType !== 'all') {
        filtered = filtered.filter(scan => {
            if (filterType === 'today') {
                const scanDate = new Date(scan.created_at);
                const today = new Date();
                return scanDate.toDateString() === today.toDateString();
            } else if (filterType === 'week') {
                const scanDate = new Date(scan.created_at);
                const weekAgo = new Date();
                weekAgo.setDate(weekAgo.getDate() - 7);
                return scanDate >= weekAgo;
            } else if (filterType === 'month') {
                const scanDate = new Date(scan.created_at);
                const monthAgo = new Date();
                monthAgo.setMonth(monthAgo.getMonth() - 1);
                return scanDate >= monthAgo;
            } else if (filterType === 'completed') {
                return scan.status === 'completed';
            } else if (filterType === 'failed') {
                return scan.status === 'failed';
            }
            return true;
        });
    }

    // عرض البيانات المصفاة
    const startIndex = 0;
    const endIndex = itemsPerPage;
    const pageData = filtered.slice(startIndex, endIndex);

    const tbody = document.getElementById('historyTableBody');
    let html = '';

    if (pageData.length === 0) {
        html = `
            <tr>
                <td colspan="6" class="text-center py-4">
                    <i class="fas fa-search fa-2x text-muted mb-3"></i>
                    <p>لا توجد نتائج مطابقة للبحث</p>
                </td>
            </tr>
        `;
    } else {
        pageData.forEach((scan, index) => {
            const date = formatHistoryDate(scan.created_at);
            const tools = scan.tools || [];
            const status = scan.status || 'unknown';

            html += `
                <tr>
                    <td>${date}</td>
                    <td>${scan.target}</td>
                    <td>
                        <div class="tools-badges">
                            ${tools.map(tool => `
                                <span class="tool-badge-small ${normalizeToolKey(tool)}">
                                    ${getToolName(tool)}
                                </span>
                            `).join('')}
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${status}">
                            ${getStatusText(status)}
                        </span>
                    </td>
                    <td>
                        ${calculateDuration(scan.created_at, scan.completed_at)}
                    </td>
                    <td>
                        <button class="btn btn-sm btn-outline-info" onclick="viewScanDetails('${scan.task_id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
    }

    tbody.innerHTML = html;
    updateHistoryOverview(filtered);

    // إخفاء الترقيم في حالة البحث
    document.getElementById('historyPagination').style.display =
        searchTerm || filterType !== 'all' ? 'none' : 'flex';
}

async function viewScanDetails(taskId) {
    try {
        const response = await apiFetch(`/api/scan/${taskId}`);
        if (!response.ok) throw new Error('Failed to load scan details');

        const scanData = await response.json();
        scanResults = scanData;
        prepareResultsUI(scanData);

        // إظهار قسم النتائج
        document.getElementById('resultsSection').style.display = 'block';
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });

    } catch (error) {
        console.error('Error viewing scan details:', error);
        showError('فشل تحميل تفاصيل الفحص');
    }
}

async function deleteScan(taskId) {
    const confirmed = await Swal.fire({
        title: 'حذف الفحص',
        text: 'هل أنت متأكد من حذف هذا الفحص؟',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'نعم، احذف',
        cancelButtonText: 'إلغاء',
        customClass: {
            confirmButton: 'btn btn-danger',
            cancelButton: 'btn btn-secondary'
        },
        buttonsStyling: false
    });

    if (!confirmed.isConfirmed) return;

    try {
        const response = await apiFetch(`/api/scan/${taskId}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            showToast('نجاح', 'تم حذف الفحص بنجاح', 'success');
            loadHistory(); // إعادة تحميل السجل
        } else {
            throw new Error('Failed to delete scan');
        }
    } catch (error) {
        console.error('Error deleting scan:', error);
        showError('فشل حذف الفحص');
    }
}

// ===== وظائف مساعدة =====
function hasProtocol(value) {
    return /^[a-z][a-z\d+.-]*:\/\//i.test(value);
}

function parseTargetUrl(target, defaultProtocol = 'http') {
    const value = String(target || '').trim();
    if (!value) return null;

    const candidate = hasProtocol(value) ? value : `${defaultProtocol}://${value}`;
    try {
        return new URL(candidate);
    } catch (error) {
        return null;
    }
}

function extractTargetHost(target) {
    const parsedUrl = parseTargetUrl(target, 'http');
    return parsedUrl?.hostname?.toLowerCase() || '';
}

function parseIPv4Address(hostname) {
    const parts = hostname.split('.');
    if (parts.length !== 4) return null;

    const octets = [];
    for (const part of parts) {
        if (!/^\d{1,3}$/.test(part)) {
            return null;
        }

        const value = Number(part);
        if (!Number.isInteger(value) || value < 0 || value > 255) {
            return null;
        }
        octets.push(value);
    }

    return octets;
}

function isPrivateIPv4(hostname) {
    const octets = parseIPv4Address(hostname);
    if (!octets) return false;

    const [first, second] = octets;
    return (
        first === 10 ||
        (first === 192 && second === 168) ||
        (first === 172 && second >= 16 && second <= 31)
    );
}

function isLoopbackIPv4(hostname) {
    const octets = parseIPv4Address(hostname);
    return Boolean(octets && octets[0] === 127);
}

function isAllowedIpHost(hostname) {
    return isPrivateIPv4(hostname) || isLoopbackIPv4(hostname) || hostname === '::1';
}

function buildTargetWebsiteUrl(target) {
    const value = String(target || '').trim();
    if (!value) return null;

    if (hasProtocol(value)) {
        const parsedWithScheme = parseTargetUrl(value);
        return parsedWithScheme ? parsedWithScheme.toString() : null;
    }

    const hostname = extractTargetHost(value);
    if (!hostname) return null;

    const defaultProtocol = isAllowedIpHost(hostname) || hostname === 'localhost'
        ? 'http'
        : 'https';
    const parsedUrl = parseTargetUrl(value, defaultProtocol);
    return parsedUrl ? parsedUrl.toString() : null;
}

function isValidTarget(target) {
    const hostname = extractTargetHost(target);
    if (!hostname) return false;

    if (ALLOWED_TEST_HOSTS.has(hostname)) {
        return true;
    }

    return isAllowedIpHost(hostname);
}

function openTargetWebsite() {
    const target = document.getElementById('targetInput').value.trim();
    if (!target) {
        showError(
            currentLanguage === 'en'
                ? 'Please enter a target address first'
                : 'يرجى إدخال عنوان هدف أولاً'
        );
        return;
    }

    if (!isValidTarget(target)) {
        showError(
            currentLanguage === 'en'
                ? 'Target is not allowed. Use approved test domains or private hosts only.'
                : 'الهدف غير مسموح به. استخدم النطاقات التجريبية المعتمدة أو العناوين الخاصة فقط.'
        );
        return;
    }

    const targetUrl = buildTargetWebsiteUrl(target);
    if (!targetUrl) {
        showError(currentLanguage === 'en' ? 'Invalid website address' : 'عنوان الموقع غير صالح');
        return;
    }

    const openedWindow = window.open(targetUrl, '_blank', 'noopener,noreferrer');
    if (openedWindow) {
        showToast(
            currentLanguage === 'en' ? 'Success' : 'نجاح',
            currentLanguage === 'en' ? `Website opened: ${targetUrl}` : `تم فتح الموقع: ${targetUrl}`,
            'success'
        );
        return;
    }

    showToast(
        currentLanguage === 'en' ? 'Warning' : 'تحذير',
        currentLanguage === 'en'
            ? 'Could not open website. Check popup blocking settings.'
            : 'تعذر فتح الموقع. تحقق من إعدادات المتصفح لحظر النوافذ المنبثقة.',
        'warning'
    );
}

function getToolName(tool) {
    const normalizedTool = normalizeToolKey(tool);
    const names = {
        'nmap': 'Nmap',
        'owaspzap': 'OWASPZap',
        'sqlmap': 'SQLMap',
        'whatweb': 'WhatWeb',
        'metasploit': 'Metasploit'
    };
    return names[normalizedTool] || tool;
}

function getToolIcon(tool) {
    const normalizedTool = normalizeToolKey(tool);
    const icons = {
        'nmap': 'fas fa-network-wired',
        'owaspzap': 'fas fa-search',
        'sqlmap': 'fas fa-database',
        'whatweb': 'fas fa-fingerprint',
        'metasploit': 'fas fa-bomb'
    };
    return icons[normalizedTool] || 'fas fa-cog';
}

function getStatusText(status) {
    const texts = {
        'completed': 'مكتمل',
        'running': 'جاري',
        'failed': 'فشل',
        'pending': 'في الانتظار'
    };
    return texts[status] || status;
}

function calculateDuration(start, end) {
    if (!start || !end) return 'غير معروف';

    const startTime = new Date(start);
    const endTime = new Date(end);
    const diffMs = endTime - startTime;

    const diffSecs = Math.floor(diffMs / 1000);
    const minutes = Math.floor(diffSecs / 60);
    const seconds = diffSecs % 60;

    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

function updateTimeEstimate() {
    const selectedTools = getSelectedTools();
    const scanSpeed = document.getElementById('scanSpeed').value;

    let baseTime = 0;

    // وقت كل أداة
    selectedTools.forEach(tool => {
        switch (tool) {
            case 'nmap':
                baseTime += scanSpeed === 'fast' ? 30 : scanSpeed === 'normal' ? 60 : 120;
                break;
            case 'owaspzap':
                baseTime += 90;
                break;
            case 'sqlmap':
                baseTime += 180;
                break;
            case 'whatweb':
                baseTime += 150;
                break;
            case 'metasploit':
                baseTime += 120;
                break;
        }
    });

    // تحويل إلى دقائق
    const minutes = Math.ceil(baseTime / 60);
    document.getElementById('estimatedTime').textContent =
        currentLanguage === 'en'
            ? (minutes <= 1 ? '~ 1 minute' : `~ ${minutes} minutes`)
            : (minutes <= 1 ? '~ 1 دقيقة' : `~ ${minutes} دقائق`);
}

function setTarget(target) {
    document.getElementById('targetInput').value = target;
}

function suggestTargets() {
    const suggestions = [
        'testphp.vulnweb.com',
        'demo.testfire.net',
        'localhost',
        '127.0.0.1'
    ];

    const randomTarget = suggestions[Math.floor(Math.random() * suggestions.length)];
    setTarget(randomTarget);

    showToast('اقتراح', `جرب فحص: ${randomTarget}`, 'info');
}

function cancelScan() {
    if (scanInterval) {
        clearInterval(scanInterval);
        clearInterval(window.elapsedTimer);
    }

    showToast('إلغاء', 'تم إلغاء الفحص', 'warning');
    resetScanUI();
}

function pauseResumeScan() {
    const btn = document.querySelector('.scan-controls .btn-outline-info');
    const icon = btn.querySelector('i');
    const textNode = document.getElementById('pauseResumeText') || btn.querySelector('span');

    if (icon.classList.contains('fa-pause-circle')) {
        // إيقاف
        if (scanInterval) clearInterval(scanInterval);
        if (window.elapsedTimer) clearInterval(window.elapsedTimer);
        icon.className = 'fas fa-play-circle me-1';
        if (textNode) textNode.textContent = 'استئناف';
        showToast('إيقاف', 'تم إيقاف الفحص مؤقتاً', 'info');
    } else {
        // استئناف
        if (currentTaskId) {
            startMonitoringScan(currentTaskId, document.getElementById('currentTarget').textContent);
            startElapsedTimer();
        }
        icon.className = 'fas fa-pause-circle me-1';
        if (textNode) textNode.textContent = 'إيقاف مؤقت';
        showToast('استئناف', 'تم استئناف الفحص', 'success');
    }
}

function resetScanUI() {
    // إعادة تمكين أزرار البدء
    const scanBtn = document.querySelector('.cyber-btn-primary');
    scanBtn.disabled = false;
    scanBtn.innerHTML = '<i class="fas fa-play-circle me-2"></i>بدء الفحص';

    // إخفاء قسم التقدم
    document.getElementById('progressSection').style.display = 'none';
}

function clearForm() {
    document.getElementById('targetInput').value = '';
    document.querySelectorAll('.form-check-input').forEach(cb => {
        if (cb.id !== 'toolNmap') cb.checked = false;
    });
    document.getElementById('scanSpeed').value = 'normal';
    updateTimeEstimate();

    showToast('مسح', 'تم مسح النموذج', 'info');
}

function clearResults() {
    document.getElementById('resultsSection').style.display = 'none';
    scanResults = {};

    showToast('مسح', 'تم إغلاق النتائج', 'info');
}

async function downloadReport() {
    if (!scanResults || !scanResults.task_id) {
        showError('لا توجد نتائج لتحميلها');
        return;
    }

    try {
        const selectedFormat = document.getElementById('reportFormat')?.value || 'txt';
        const reportContent = generateReportContent(scanResults, selectedFormat);
        const exportConfig = getExportConfig(selectedFormat);

        const blob = new Blob([reportContent], { type: exportConfig.mimeType });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `scan-report-${scanResults.task_id}.${exportConfig.extension}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);

        showToast('تحميل', 'تم بدء تحميل التقرير', 'success');
    } catch (error) {
        console.error('Error downloading report:', error);
        showError('فشل إنشاء التقرير');
    }
}

function getExportConfig(format) {
    switch (format) {
        case 'json':
            return { extension: 'json', mimeType: 'application/json' };
        case 'summary':
            return { extension: 'txt', mimeType: 'text/plain' };
        case 'technical':
            return { extension: 'txt', mimeType: 'text/plain' };
        default:
            return { extension: 'txt', mimeType: 'text/plain' };
    }
}

function generateReportContent(scanData, format = 'txt') {
    if (format === 'json') {
        return JSON.stringify({
            target: scanData.target,
            task_id: scanData.task_id,
            created_at: scanData.created_at,
            completed_at: scanData.completed_at,
            summary: calculateStatistics(scanData),
            ai_report: scanData.ai_report || '',
            recommendations: generateRecommendations(scanData),
            results: scanData.results || {}
        }, null, 2);
    }

    if (format === 'summary') {
        return generateExecutiveSummaryReport(scanData);
    }

    if (format === 'technical') {
        return generateTechnicalReport(scanData, true);
    }

    return generateTechnicalReport(scanData, false);
}

function generateExecutiveSummaryReport(scanData) {
    const stats = calculateStatistics(scanData);
    const actions = generateRecommendations(scanData).slice(0, 3);
    let report = `Executive Security Summary\n`;
    report += `==========================\n\n`;
    report += `Target: ${scanData.target}\n`;
    report += `Scan ID: ${scanData.task_id}\n`;
    report += `Date: ${formatHistoryDate(new Date())}\n`;
    report += `Risk Score: ${stats.riskPercentage}%\n`;
    report += `Confidence Score: ${stats.confidenceScore}%\n`;
    report += `Completion Score: ${stats.completionScore}%\n`;
    report += `Total Findings: ${stats.findingsTotal}\n\n`;
    report += `Priority Actions\n`;
    report += `---------------\n`;
    actions.forEach((rec, index) => {
        report += `${index + 1}. ${rec.title}\n`;
        report += `   Owner: ${rec.owner} | Effort: ${rec.effort} | Status: ${rec.status}\n`;
    });
    if (scanData.ai_report) {
        report += `\nAI Briefing\n`;
        report += `-----------\n`;
        report += `${scanData.ai_report}\n`;
    }
    return report;
}

function generateTechnicalReport(scanData, includeRawResults) {
    let report = `Technical Security Scan Report - AI Penetration System\n`;
    report += `=====================================================\n\n`;
    report += `Target: ${scanData.target}\n`;
    report += `Scan ID: ${scanData.task_id}\n`;
    report += `Date: ${formatHistoryDate(new Date())}\n\n`;

    report += `Results Summary\n`;
    report += `---------------\n`;
    const stats = calculateStatistics(scanData);
    const riskLabel = `${stats.riskLevel.charAt(0).toUpperCase()}${stats.riskLevel.slice(1)}`;
    report += `• Open Ports: ${stats.openPorts}\n`;
    report += `• Web Findings: ${stats.vulnerabilities}\n`;
    report += `• Risk Level: ${riskLabel}\n`;
    report += `• Risk Score: ${stats.riskPercentage}%\n`;
    report += `• Confidence Score: ${stats.confidenceScore}%\n`;
    report += `• Completion Score: ${stats.completionScore}%\n\n`;

    report += `Tool Details\n`;
    report += `------------\n`;
    for (const [tool, data] of Object.entries(scanData.results || {})) {
        report += `\n${getToolName(tool)}\n`;
        if (data.error) {
            report += `  Error: ${data.error}\n`;
        } else if (tool === 'nmap' && data.parsed?.open_ports) {
            data.parsed.open_ports.forEach(port => {
                report += `  • Port ${port.port}/TCP - ${port.service || 'Unknown'}\n`;
            });
        } else if (tool === 'owaspzap') {
            report += `  • Vulnerability Count: ${data.parsed?.count || 0}\n`;
        } else if (tool === 'whatweb') {
            report += `  • Fingerprint Count: ${data.parsed?.fingerprint_count || data.parsed?.issue_count || 0}\n`;
        } else if (tool === 'sqlmap') {
            report += `  • SQL Injection Exposure: ${data.parsed?.vulnerable ? 'Potentially Vulnerable' : 'Not Detected'}\n`;
        }

        if (includeRawResults && data.raw) {
            report += `  Raw Output:\n${data.raw}\n`;
        }
    }

    report += `\nRecommendations\n`;
    report += `---------------\n`;
    const recommendations = generateRecommendations(scanData);
    recommendations.forEach((rec, index) => {
        report += `${index + 1}. ${rec.title}\n`;
        report += `   ${rec.description}\n`;
        report += `   Why: ${rec.why}\n`;
        report += `   Owner: ${rec.owner} | Effort: ${rec.effort} | Status: ${rec.status}\n`;
    });

    if (scanData.ai_report) {
        report += `\nAI Report\n`;
        report += `---------\n`;
        report += `${scanData.ai_report}\n`;
    }

    report += `\n=====================================================\n`;
    report += `This report was generated by AI Penetration System\n`;
    report += `For academic and ethical use only\n`;
    return report;
}

function refreshHistory() {
    loadHistory();
    showToast('تحديث', 'تم تحديث سجل الفحوصات', 'info');
}

// ===== وظائف العرض والإشعارات =====
function showError(message) {
    Swal.fire({
        title: 'خطأ',
        text: message,
        icon: 'error',
        confirmButtonText: 'حسناً',
        customClass: {
            confirmButton: 'btn btn-danger'
        },
        buttonsStyling: false
    });
}

function showToast(title, message, type) {
    const Toast = Swal.mixin({
        toast: true,
        position: 'top-start',
        showConfirmButton: false,
        timer: 3000,
        timerProgressBar: true,
        didOpen: (toast) => {
            toast.addEventListener('mouseenter', Swal.stopTimer);
            toast.addEventListener('mouseleave', Swal.resumeTimer);
        }
    });

    Toast.fire({
        icon: type,
        title: title,
        text: message
    });
}

// ===== CSS الديناميكي =====
function addDynamicStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .tool-progress-item {
            display: flex;
            align-items: center;
            padding: 10px;
            background: rgba(15, 23, 42, 0.5);
            border-radius: 8px;
            margin-bottom: 10px;
            transition: all 0.3s;
        }
        
        .tool-progress-item:hover {
            background: rgba(15, 23, 42, 0.8);
        }
        
        .tool-icon-small {
            width: 30px;
            height: 30px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin-inline-end: 10px;
            font-size: 14px;
        }
        
        .tool-icon-small.nmap { background: rgba(14, 165, 233, 0.2); color: #0ea5e9; }
        .tool-icon-small.owaspzap { background: rgba(16, 185, 129, 0.2); color: #10b981; }
        .tool-icon-small.sqlmap { background: rgba(245, 158, 11, 0.2); color: #f59e0b; }
        .tool-icon-small.whatweb,
        .tool-icon-small.metasploit { background: rgba(239, 68, 68, 0.2); color: #ef4444; }
        
        .tool-name {
            flex: 1;
            font-weight: 500;
        }
        
        .tool-progress-bar {
            flex: 2;
            margin: 0 15px;
        }
        
        .quick-result-card {
            background: rgba(15, 23, 42, 0.5);
            border-radius: 8px;
            padding: 15px;
            border-inline-start: 4px solid #0ea5e9;
        }
        
        .port-display {
            background: rgba(15, 23, 42, 0.5);
            border-radius: 6px;
            padding: 8px;
            text-align: center;
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s;
        }
        
        .port-display:hover {
            transform: translateY(-2px);
            border-color: #0ea5e9;
        }
        
        .port-display.high-risk {
            border-color: #ef4444;
        }
        
        .port-display.medium-risk {
            border-color: #f59e0b;
        }
        
        .port-display.low-risk {
            border-color: #10b981;
        }
        
        .port-number {
            font-weight: bold;
            font-size: 14px;
        }
        
        .port-service {
            font-size: 12px;
            color: #94a3b8;
        }
        
        .vuln-item {
            background: rgba(239, 68, 68, 0.1);
            border-radius: 6px;
            padding: 10px;
            margin-bottom: 5px;
            border-inline-start: 3px solid #ef4444;
            font-size: 13px;
        }
        
        .ai-section-content {
            background: rgba(15, 23, 42, 0.3);
            border-radius: 10px;
            padding: 20px;
        }
        
        .ai-text {
            line-height: 1.8;
            color: #cbd5e1;
        }
        
        .ai-patterns {
            list-style: none;
            padding: 0;
        }
        
        .ai-patterns li {
            padding: 8px 0;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .ai-patterns li:last-child {
            border-bottom: none;
        }
        
        .recommendation-number {
            display: inline-block;
            width: 24px;
            height: 24px;
            background: #0ea5e9;
            color: white;
            border-radius: 50%;
            text-align: center;
            line-height: 24px;
            margin-inline-end: 10px;
        }
        
        .recommendation-item.high {
            border-inline-start: 4px solid #ef4444;
        }
        
        .recommendation-item.medium {
            border-inline-start: 4px solid #f59e0b;
        }
        
        .recommendation-item.low {
            border-inline-start: 4px solid #10b981;
        }
        
        .tools-badges {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
        }
        
        .tool-badge-small {
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 600;
        }
        
        .tool-badge-small.nmap {
            background: rgba(14, 165, 233, 0.2);
            color: #0ea5e9;
            border: 1px solid #0ea5e9;
        }
        
        .tool-badge-small.owaspzap {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
            border: 1px solid #10b981;
        }
        
        .tool-badge-small.sqlmap {
            background: rgba(245, 158, 11, 0.2);
            color: #f59e0b;
            border: 1px solid #f59e0b;
        }
        
        .tool-badge-small.whatweb,
        .tool-badge-small.metasploit {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            border: 1px solid #ef4444;
        }
        
        .status-badge {
            padding: 4px 10px;
            border-radius: 15px;
            font-size: 12px;
            font-weight: 600;
        }
        
        .status-badge.completed {
            background: rgba(16, 185, 129, 0.2);
            color: #10b981;
            border: 1px solid #10b981;
        }
        
        .status-badge.running {
            background: rgba(14, 165, 233, 0.2);
            color: #0ea5e9;
            border: 1px solid #0ea5e9;
        }
        
        .status-badge.failed {
            background: rgba(239, 68, 68, 0.2);
            color: #ef4444;
            border: 1px solid #ef4444;
        }
        
        .status-badge.pending {
            background: rgba(148, 163, 184, 0.2);
            color: #94a3b8;
            border: 1px solid #94a3b8;
        }
        
        /* تحسينات للعرض على الجوال */
        @media (max-width: 768px) {
            .tool-progress-item {
                flex-direction: column;
                align-items: flex-start;
            }
            
            .tool-progress-bar {
                width: 100%;
                margin: 10px 0;
            }
            
            .tools-badges {
                justify-content: center;
            }
        }
    `;
    document.head.appendChild(style);
}

// إضافة الأنماط الديناميكية عند التحميل
document.addEventListener('DOMContentLoaded', addDynamicStyles);

// تصدير الدوال للاستخدام في HTML
window.startScan = startScan;
window.cancelScan = cancelScan;
window.pauseResumeScan = pauseResumeScan;
window.clearForm = clearForm;
window.clearResults = clearResults;
window.downloadReport = downloadReport;
window.viewScanDetails = viewScanDetails;
window.deleteScan = deleteScan;
window.refreshHistory = refreshHistory;
window.showRawResults = showRawResults;
window.setTarget = setTarget;
window.suggestTargets = suggestTargets;
window.openTargetWebsite = openTargetWebsite;
window.goToPage = goToPage;
window.toggleLanguage = toggleLanguage;
