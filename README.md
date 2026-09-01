# مهامي - Mahami

تطبيق Android عربي RTL لإدارة المهام وتايمر التركيز.

## المزايا
- شاشة ترحيب ديناميكية حسب الوقت.
- الساعة والتاريخ.
- إضافة/إكمال/حذف المهام.
- إحصائيات إجمالي/مكتملة/متبقية.
- حفظ محلي Offline.
- Focus Timer: 15/25/45/60 دقيقة.
- إشعارات محلية.
- صوت اختياري.
- الوضع الفاتح والداكن.
- Bottom Navigation.
- جاهز للبناء السحابي كـ APK.

## البناء بدون Android SDK محلياً

هذا المشروع يستخدم Expo/EAS. لا تحتاج Android Studio أو Android SDK على جهاز Windows إذا استخدمت EAS Build السحابي.

1. ارفع المشروع إلى GitHub.
2. ثبّت Node.js LTS إذا احتجت تشغيل المشروع أو EAS CLI محلياً.
3. سجّل في Expo.
4. نفّذ:
   `npm install`
   `npx eas login`
   `npx eas build:configure`
   `npx eas build -p android --profile preview`
5. بعد اكتمال البناء سيظهر رابط APK من EAS.

يمكن أيضاً إعداد GitHub Actions للبناء السحابي.
