# Replaces the Capacitor launch theme so the system splash is a plain #F9F7F7
# screen with NO icon; the app's own logo animation is then the only logo shown.
import re, sys
p = "android/app/src/main/res/values/styles.xml"
s = open(p, encoding="utf-8").read()
new = '''<style name="AppTheme.NoActionBarLaunch" parent="Theme.SplashScreen">
        <item name="windowSplashScreenBackground">#F9F7F7</item>
        <item name="windowSplashScreenAnimatedIcon">@drawable/splash_empty</item>
        <item name="windowSplashScreenAnimationDuration">0</item>
        <item name="postSplashScreenTheme">@style/AppTheme.NoActionBar</item>
        <item name="android:background">@drawable/splash</item>
    </style>'''
out, n = re.subn(r'<style name="AppTheme\.NoActionBarLaunch"[^>]*>.*?</style>', new, s, flags=re.S)
if n == 0:
    print("launch theme not found - left unchanged"); sys.exit(0)
open(p, "w", encoding="utf-8").write(out)
print("launch theme updated")
