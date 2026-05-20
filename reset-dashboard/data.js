// Re-Set project data — extracted from project plan (April 2026)
// Project starts April 1, 2026. ~34 weeks total. Today (sim) = May 8, 2026 → week ~6.

window.RESET_DATA = (() => {
  const PROJECT_START = new Date('2026-04-01');
  const TODAY = new Date('2026-05-08');

  const PHASES = [
    {
      id: 1, name: 'מחקר וגילוי', en: 'Research & Discovery',
      startWeek: 1, endWeek: 3, color: 'sky',
      summary: 'הגדרת הצורך האמיתי בשוק, מיפוי מתחרים, ואלידציה של פתרון Re-Set',
      tasks: [
        { t: 'הגדרת Value Proposition — נקודת כניסה יחידה לנפגעי טראומה', p: 'must', d: '3 ימים', s: 'done' },
        { t: 'מחקר מתחרים — מיפוי פלטפורמות (Natal, ער"ן, נט"ל, אפליקציות PTSD בינ"ל)', p: 'must', d: '4 ימים', s: 'done' },
        { t: 'ואלידציה של 4 User Personas — מתמודד, בן משפחה, מטפל, מנהל', p: 'must', d: '3 ימים', s: 'done' },
        { t: 'ראיונות עם נפגעי טראומה, מטפלים ובני משפחה (8-10 ראיונות)', p: 'must', d: 'שבוע', s: 'done' },
        { t: 'הגדרת KPIs — 500 משתמשים ב-3 חודשים, DAU/MAU 5%+, Time to Treatment', p: 'must', d: '2 ימים', s: 'done' },
        { t: 'ייעוץ קליני ל-Trauma-Informed Design ופרוטוקול תוכן אובדני', p: 'must', d: '3 ימים', s: 'done' },
      ]
    },
    {
      id: 2, name: 'אפיון מוצר', en: 'Product Spec',
      startWeek: 3, endWeek: 6, color: 'sky',
      summary: 'השלמת Feature Map, תעדוף MoSCoW, ואפיון 3 המודולים המרכזיים',
      tasks: [
        { t: 'השלמת Feature Map ל-3 מודולים + מודול ניהול', p: 'must', d: '3 ימים', s: 'done' },
        { t: 'תעדוף MoSCoW — מה נכנס ל-MVP', p: 'must', d: '2 ימים', s: 'done' },
        { t: '5 תרחישי שימוש מפורטים (הרשמה, רישום מטפל, איתור, זכויות, קהילה)', p: 'must', d: '4 ימים', s: 'done' },
        { t: 'אפיון מודול קהילה — פורומים, פוסטים, מודרציה, DM, לחצן מצוקה', p: 'must', d: 'שבוע', s: 'done' },
        { t: 'אפיון מודול טיפול — אינדקס, סינון, התאמה, אימות רישיון', p: 'must', d: 'שבוע', s: 'progress' },
        { t: 'אפיון מודול זכויות — מחשבון Wizard, מאגר מסמכים, כתבות', p: 'must', d: 'שבוע', s: 'progress' },
        { t: 'דרישות לא-פונקציונליות — 1,000 משתמשים, TLS 1.3, AES-256, WCAG 2.1 AA', p: 'must', d: '3 ימים', s: 'todo' },
      ]
    },
    {
      id: 3, name: 'עיצוב UX/UI', en: 'UX/UI Design',
      startWeek: 6, endWeek: 10, color: 'indigo',
      summary: 'Trauma-Informed Design — גוונים רגועים, ניווט פשוט, מקסימום 5 אלמנטים פעילים למסך',
      tasks: [
        { t: 'Information Architecture — ניווט בין 3 המודולים + פרופיל + ניהול', p: 'must', d: '3 ימים', s: 'progress' },
        { t: 'Wireframes לכל המסכים', p: 'must', d: 'שבוע', s: 'todo' },
        { t: 'Design System — פלטה רגועה (כחולים ואפורים), טיפוגרפיה, ריווחים', p: 'must', d: '3 ימים', s: 'todo' },
        { t: 'עיצוב UI מלא ב-Figma — RTL, מצב כהה, נגישות, שימוש חד-ידני', p: 'must', d: '10 ימים', s: 'todo' },
        { t: 'אב-טיפוס אינטראקטיבי + בדיקות שמישות (5 משתמשים)', p: 'should', d: '5 ימים', s: 'todo' },
      ]
    },
    {
      id: 4, name: 'ארכיטקטורה טכנית', en: 'Technical Architecture',
      startWeek: 10, endWeek: 12, color: 'indigo',
      summary: 'Mobile-First, בסיס קוד אחד ל-iOS/אנדרואיד, API Gateway מרכזי',
      tasks: [
        { t: 'בחירת Tech Stack — React Native/Flutter + Backend + DB', p: 'must', d: '2 ימים', s: 'todo' },
        { t: 'תרשים ארכיטקטורה — לקוח ↔ API Gateway ↔ DB', p: 'must', d: '2 ימים', s: 'todo' },
        { t: 'Database Schema — 8 טבלאות', p: 'must', d: '3 ימים', s: 'todo' },
        { t: 'הקמת Repo, CI/CD, סביבות (Dev/Staging/Production)', p: 'must', d: '2 ימים', s: 'todo' },
        { t: 'תכנון API לכל מודול + תיעוד', p: 'must', d: '3 ימים', s: 'todo' },
        { t: 'תכנון אינטגרציות — אתרים ממשלתיים, Firebase/Supabase Auth', p: 'should', d: '2 ימים', s: 'todo' },
      ]
    },
    {
      id: 5, name: 'אימות ו-Onboarding', en: 'Auth & Onboarding',
      startWeek: 12, endWeek: 16, color: 'violet',
      summary: 'מימוש מודול ההתחברות — מתמודד / בן משפחה / מטפל',
      tasks: [
        { t: 'הרשמה/התחברות — מייל+סיסמה, OAuth (Google, Apple ID)', p: 'must', d: '5 ימים', s: 'todo' },
        { t: 'בחירת סוג חשבון: מתמודד / בן משפחה / מטפל', p: 'must', d: '3 ימים', s: 'todo' },
        { t: 'אימות מייל + שחזור סיסמה', p: 'must', d: '3 ימים', s: 'todo' },
        { t: 'רישום מטפלים — טופס רב-שלבי + אימות רישיון', p: 'must', d: '4 ימים', s: 'todo' },
        { t: 'פרופיל — Alias, אווטאר, Bio, פרטיות והתראות', p: 'must', d: '3 ימים', s: 'todo' },
        { t: 'Onboarding — מסכי היכרות ראשוניים', p: 'should', d: '2 ימים', s: 'todo' },
      ]
    },
    {
      id: 6, name: 'מודול קהילה', en: 'Community Module',
      startWeek: 16, endWeek: 20, color: 'violet',
      summary: 'פורומים, פוסטים, DM, מודרציה, לחצן מצוקה ופרוטוקול אובדני',
      tasks: [
        { t: 'פורומים נושאיים + יצירת פורום ע"י משתמשים', p: 'must', d: '4 ימים', s: 'todo' },
        { t: 'פוסטים — כותרת, טקסט (עד 2,000 תווים), תגיות, אנונימיות, Like, שמירה', p: 'must', d: '5 ימים', s: 'todo' },
        { t: 'תגובות + תגובות לתגובות + דיווח פוגעני', p: 'must', d: '3 ימים', s: 'todo' },
        { t: 'חיפוש — מילות מפתח + טקסט חופשי + נעיצת פורומים', p: 'must', d: '2 ימים', s: 'todo' },
        { t: 'הודעות פרטיות (DM) בין משתמשים', p: 'must', d: '4 ימים', s: 'todo' },
        { t: 'לחצן מצוקה קבוע + פרוטוקול אובדני (ער"ן 1201, נט"ל)', p: 'must', d: '3 ימים', s: 'todo' },
        { t: 'מודרציה — מחיקה, השעיה, נעילה, ניהול Admin', p: 'must', d: '3 ימים', s: 'todo' },
      ]
    },
    {
      id: 7, name: 'מודול טיפול', en: 'Therapy Module',
      startWeek: 19, endWeek: 22, color: 'violet',
      summary: 'אינדקס מטפלים חכם, מנוע המלצה, פניות והשוואה',
      tasks: [
        { t: 'אינדקס מטפלים + פילטרים (התמחות, מיקום, שפה, תשלום, זמינות, מרחוק)', p: 'must', d: '5 ימים', s: 'todo' },
        { t: 'פרופיל מטפל מלא — תמונה, תארים, ניסיון, שיטות, מחיר', p: 'must', d: '4 ימים', s: 'todo' },
        { t: 'מנוע המלצה — מטפלים מומלצים לפי פרופיל משתמש', p: 'must', d: '3 ימים', s: 'todo' },
        { t: 'שליחת פניות למטפל + מועדפים + השוואה', p: 'must', d: '3 ימים', s: 'todo' },
      ]
    },
    {
      id: 8, name: 'מודול זכויות ומידע', en: 'Rights & Info Module',
      startWeek: 20, endWeek: 23, color: 'violet',
      summary: 'מחשבון Wizard, מאגר מסמכים, מיצוי זכויות',
      tasks: [
        { t: 'מחשבון זכויות — Wizard: חייל/אזרח, סוג אירוע, מצב, אחוזי נכות', p: 'must', d: '5 ימים', s: 'todo' },
        { t: 'הצגת זכויות מותאמות + קישורים לאתרים ממשלתיים + מדד מורכבות', p: 'must', d: '4 ימים', s: 'todo' },
        { t: 'מאגר מסמכים, כתבות מקצועיות, מדריכים + חיפוש', p: 'must', d: '4 ימים', s: 'todo' },
        { t: 'תיק אישי — שמירת רשימת זכויות + המשך מהיכן שעצרת', p: 'should', d: '2 ימים', s: 'todo' },
      ]
    },
    {
      id: 9, name: 'ניהול והתראות', en: 'Admin & Notifications',
      startWeek: 22, endWeek: 24, color: 'amber',
      summary: 'פאנל Admin, מערכת התראות, היסטוריית פעילות',
      tasks: [
        { t: 'פאנל Admin — ניהול משתמשים, אישור מטפלים, מודרציה', p: 'must', d: '4 ימים', s: 'todo' },
        { t: 'מערכת התראות + Push Notifications', p: 'must', d: '3 ימים', s: 'todo' },
        { t: 'היסטוריית פעילות משתמש', p: 'should', d: '2 ימים', s: 'todo' },
      ]
    },
    {
      id: 10, name: 'בדיקות ו-QA', en: 'Testing & QA',
      startWeek: 24, endWeek: 27, color: 'amber',
      summary: 'בחפיפה עם פיתוח — אבטחה, ביצועים, נגישות, בטא',
      tasks: [
        { t: 'בדיקות יחידה + אינטגרציה E2E', p: 'must', d: '4 ימים', s: 'todo' },
        { t: 'בדיקות אבטחה — OWASP Top 10, AES-256, bcrypt, MFA', p: 'must', d: '3 ימים', s: 'todo' },
        { t: 'בדיקות ביצועים — 1,000 משתמשים בו-זמנית, 50 קהילות, 100 מטפלים', p: 'must', d: '2 ימים', s: 'todo' },
        { t: 'Cross-Platform — iOS 15+, Android 10+, Chrome/Firefox/Edge/Safari', p: 'must', d: '3 ימים', s: 'todo' },
        { t: 'פרוטוקול תוכן אובדני + לחצן מצוקה', p: 'must', d: '2 ימים', s: 'todo' },
        { t: 'בדיקת WCAG 2.1 AA + נגישות + קוראי מסך', p: 'must', d: '2 ימים', s: 'todo' },
        { t: 'בטא טסטינג (30-50 משתמשים — נפגעי טראומה ומטפלים)', p: 'should', d: 'שבוע', s: 'todo' },
      ]
    },
    {
      id: 11, name: 'הכנה להשקה', en: 'Launch Prep',
      startWeek: 27, endWeek: 29, color: 'rose',
      summary: 'ASO, מדיניות פרטיות (GDPR + ישראלי), הגשה לחנויות',
      tasks: [
        { t: 'ASO + Store Listings — Apple App Store + Google Play', p: 'must', d: '3 ימים', s: 'todo' },
        { t: 'מדיניות פרטיות + תנאי שימוש — GDPR + חוק הגנת הפרטיות', p: 'must', d: '3 ימים', s: 'todo' },
        { t: 'הגשה לבדיקת Apple ו-Google', p: 'must', d: '3 ימים', s: 'todo' },
        { t: 'Analytics + Crash Reporting', p: 'must', d: 'יום', s: 'todo' },
        { t: 'דף נחיתה + תוכנית שיווק — 500 משתמשים ראשונים', p: 'should', d: '3 ימים', s: 'todo' },
      ]
    },
    {
      id: 12, name: 'השקה ומה שאחרי', en: 'Launch & Beyond',
      startWeek: 29, endWeek: 34, color: 'rose',
      summary: 'Soft Launch → השקה פומבית → איטרציה ראשונה',
      tasks: [
        { t: 'Soft Launch — קבוצה מצומצמת (נפגעי טראומה, מטפלים שותפים)', p: 'must', d: 'שבוע', s: 'todo' },
        { t: 'השקה פומבית', p: 'must', d: 'יום', s: 'todo' },
        { t: 'ניטור + תיקון באגים בימים ראשונים', p: 'must', d: 'שוטף', s: 'todo' },
        { t: 'איטרציה ראשונה על סמך פידבק משתמשים', p: 'must', d: '2 שבועות', s: 'todo' },
        { t: 'מדידת אימפקט חברתי לגורמים מממנים', p: 'should', d: 'שוטף', s: 'todo' },
      ]
    },
  ];

  const MODULES = [
    {
      id: 'community', name: 'קהילה', en: 'Community',
      icon: 'users',
      desc: 'פורומים, פוסטים אנונימיים, DM, מודרציה, לחצן מצוקה',
      progress: 18, // %
      phases: [2, 6],
      features: [
        { name: 'פורומים נושאיים', status: 'spec' },
        { name: 'פוסטים אנונימיים + תגיות', status: 'spec' },
        { name: 'תגובות מקוננות + דיווח', status: 'todo' },
        { name: 'הודעות פרטיות (DM)', status: 'todo' },
        { name: 'לחצן מצוקה (ער״ן 1201, נט״ל)', status: 'spec' },
        { name: 'מודרציה ופאנל Admin', status: 'todo' },
      ]
    },
    {
      id: 'therapy', name: 'טיפול', en: 'Therapy',
      icon: 'heart',
      desc: 'אינדקס מטפלים, מנוע המלצה, פניות והשוואה',
      progress: 12,
      phases: [2, 7],
      features: [
        { name: 'אינדקס מטפלים + 6 פילטרים', status: 'progress' },
        { name: 'פרופיל מטפל מלא', status: 'spec' },
        { name: 'מנוע המלצה אישי', status: 'todo' },
        { name: 'שליחת פניות + השוואה', status: 'todo' },
        { name: 'אימות רישיון מקצועי', status: 'spec' },
      ]
    },
    {
      id: 'rights', name: 'זכויות ומידע', en: 'Rights & Info',
      icon: 'scale',
      desc: 'מחשבון Wizard, מאגר מסמכים, מיצוי זכויות',
      progress: 10,
      phases: [2, 8],
      features: [
        { name: 'מחשבון זכויות (Wizard)', status: 'progress' },
        { name: 'זכויות מותאמות אישית', status: 'todo' },
        { name: 'מאגר מסמכים וכתבות', status: 'todo' },
        { name: 'תיק אישי + המשך', status: 'todo' },
      ]
    },
    {
      id: 'admin', name: 'ניהול', en: 'Admin',
      icon: 'shield',
      desc: 'משתמשים, אישור מטפלים, מודרציה, התראות',
      progress: 5,
      phases: [9],
      features: [
        { name: 'ניהול משתמשים', status: 'todo' },
        { name: 'אישור מטפלים', status: 'todo' },
        { name: 'התראות + Push', status: 'todo' },
        { name: 'היסטוריית פעילות', status: 'todo' },
      ]
    },
  ];

  // Budget: ~750,000 ש"ח MVP
  const BUDGET = {
    total: 750000,
    spent: 92000,
    committed: 145000,
    categories: [
      { name: 'פיתוח (Front + Back)', planned: 380000, spent: 28000, color: 'indigo' },
      { name: 'עיצוב UX/UI + Trauma-Informed', planned: 95000, spent: 22000, color: 'sky' },
      { name: 'ייעוץ קליני + מומחים', planned: 60000, spent: 18000, color: 'violet' },
      { name: 'תשתיות, אבטחה ו-DevOps', planned: 75000, spent: 9500, color: 'amber' },
      { name: 'משפטי — GDPR + פרטיות', planned: 35000, spent: 8500, color: 'rose' },
      { name: 'שיווק והשקה', planned: 65000, spent: 4000, color: 'emerald' },
      { name: 'רזרבה (10%)', planned: 40000, spent: 2000, color: 'slate' },
    ]
  };

  const KPIS = [
    { id: 'users', label: 'משתמשים רשומים', target: 500, current: 0, unit: '', note: 'יעד: 3 חודשים מהשקה', icon: 'user-plus' },
    { id: 'dau', label: 'DAU/MAU', target: 5, current: 0, unit: '%', note: 'מדד מעורבות יומית', icon: 'activity' },
    { id: 'ttt', label: 'Time to Treatment', target: 14, current: 0, unit: 'ימים', note: 'מהרשמה לפנייה ראשונה', icon: 'clock' },
    { id: 'therapists', label: 'מטפלים פעילים', target: 100, current: 0, unit: '', note: 'מאומתים במערכת', icon: 'stethoscope' },
  ];

  const RISKS = [
    { level: 'high', title: 'אי-מציאת ייעוץ קליני מתאים', impact: 'עיכוב Trauma-Informed Design', mitigation: 'נקבעו 2 פגישות עם מומחי PTSD בשבוע הבא', owner: 'הדר' },
    { level: 'med', title: 'אישור Apple לתוכן בריאות נפשית', impact: 'עיכוב 1-2 שבועות בהשקה', mitigation: 'הכנת תיעוד מוקדם, ייעוץ עם מפתחים אחרים', owner: 'הרי' },
    { level: 'med', title: 'גיוס 100 מטפלים מאומתים', impact: 'מודול הטיפול ריק בהשקה', mitigation: 'שותפויות עם נט״ל ואיגודי מטפלים', owner: 'הרי' },
    { level: 'low', title: 'WCAG 2.1 AA + RTL + מצב כהה', impact: 'דחיפה של QA', mitigation: 'בדיקות נגישות מתמשכות במהלך עיצוב', owner: 'הדר' },
  ];

  // Recent activity (sprint feed)
  const ACTIVITY = [
    { time: 'לפני שעה', type: 'task', text: 'הושלם: אפיון מודול קהילה — פורומים, מודרציה, לחצן מצוקה', who: 'הדר' },
    { time: 'אתמול', type: 'task', text: 'התחיל: אפיון מודול טיפול — אימות רישיון מקצועי', who: 'הרי' },
    { time: 'אתמול', type: 'meeting', text: 'פגישה עם ד״ר רונית כהן (PTSD) — Trauma-Informed Design', who: 'שניהם' },
    { time: 'לפני יומיים', type: 'decision', text: 'החלטה: Tech Stack — React Native + Supabase (לאישור)', who: 'הרי' },
    { time: 'לפני 3 ימים', type: 'task', text: 'הושלם: 5 תרחישי שימוש מפורטים', who: 'הדר' },
    { time: 'לפני 4 ימים', type: 'risk', text: 'נפתח סיכון חדש: אישור Apple לתוכן בריאות נפש', who: 'הרי' },
    { time: 'לפני שבוע', type: 'task', text: 'הושלם: תעדוף MoSCoW ל-MVP', who: 'שניהם' },
  ];

  const TEAM = [
    { name: 'הרי בנישו', role: 'Product + Backend', initial: 'הב', tasks: 3 },
    { name: 'הדר סיידו', role: 'UX/UI + Frontend', initial: 'הס', tasks: 2 },
  ];

  // helpers — dynamic so they reflect PROJECT.startDate even after edits
  function getStart() {
    if (window.RESET_DATA && window.RESET_DATA.PROJECT && window.RESET_DATA.PROJECT.startDate) {
      return new Date(window.RESET_DATA.PROJECT.startDate);
    }
    return PROJECT_START;
  }
  function weekFromDate(d) {
    const ms = d - getStart();
    return Math.max(1, Math.floor(ms / (7*24*60*60*1000)) + 1);
  }
  function dateFromWeek(w) {
    return new Date(getStart().getTime() + (w-1)*7*24*60*60*1000);
  }
  function phaseStartDate(phase) { return dateFromWeek(phase.startWeek); }
  function phaseEndDate(phase)   { return new Date(dateFromWeek(phase.endWeek).getTime() + 6*24*60*60*1000); }
  function fmtDate(d, full)  {
    if (!d) return '';
    return d.toLocaleDateString('he-IL', full
      ? { day: 'numeric', month: 'long', year: 'numeric' }
      : { day: 'numeric', month: 'short' });
  }
  function fmtDateRange(d1, d2) {
    const sameYear = d1.getFullYear() === d2.getFullYear();
    const sameMonth = sameYear && d1.getMonth() === d2.getMonth();
    if (sameMonth) return d1.getDate() + '–' + d2.getDate() + ' ב' + d1.toLocaleDateString('he-IL', { month: 'long' }) + ' ' + d1.getFullYear();
    return fmtDate(d1) + ' – ' + fmtDate(d2, true);
  }

  return {
    PROJECT: {
      name: 'Re-Set',
      tagline: 'פלטפורמה דיגיטלית לתמיכה ושיקום נפגעי טראומה',
      methodology: 'Lean Startup + Agile Solo',
      type: 'Mobile-First + Web',
      budget: 750000,
      durationWeeks: 34,
      startDate: PROJECT_START,
      today: TODAY,
      currentWeek: weekFromDate(TODAY),
      submitters: ['הרי בנישו', 'הדר סיידו'],
    },
    PHASES, MODULES, BUDGET, KPIS, RISKS, ACTIVITY, TEAM,
    weekFromDate, dateFromWeek, phaseStartDate, phaseEndDate, fmtDate, fmtDateRange
  };
})();
