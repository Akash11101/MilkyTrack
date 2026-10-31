package com.milktracker.app;

import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.print.PrintAttributes;
import android.print.PrintDocumentAdapter;
import android.print.PrintManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.getcapacitor.BridgeActivity;

/**
 * Capacitor host activity. Adds one thing the web view cannot do on its own:
 * window.AndroidPrint.print(html, title) opens Android's print dialog, whose
 * "Save as PDF" target produces the monthly milk bill PDF.
 */
public class MainActivity extends BridgeActivity {
    private WebView printView; // keep a reference until printing has started

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // light status/navigation bars that match the app background
        getWindow().setStatusBarColor(0xFFF9F7F7);
        getWindow().setNavigationBarColor(0xFFF9F7F7);
        // the system keeps the app out of the notch / camera cut-out; paint that strip in the app colour (not black)
        getWindow().setBackgroundDrawable(new android.graphics.drawable.ColorDrawable(0xFFF9F7F7));
        View decor = getWindow().getDecorView();
        decor.setBackgroundColor(0xFFF9F7F7);
        int flags = decor.getSystemUiVisibility() | View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
        if (Build.VERSION.SDK_INT >= 26) flags |= View.SYSTEM_UI_FLAG_LIGHT_NAVIGATION_BAR;
        decor.setSystemUiVisibility(flags);
        getBridge().getWebView().addJavascriptInterface(new PrintBridge(), "AndroidPrint");
    }

    private class PrintBridge {
        @JavascriptInterface
        public void print(final String html, final String title) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    final WebView w = new WebView(MainActivity.this);
                    printView = w;
                    w.setWebViewClient(new WebViewClient() {
                        private boolean started = false;

                        @Override
                        public void onPageFinished(WebView view, String url) {
                            if (started) return;
                            started = true;
                            PrintManager pm = (PrintManager) getSystemService(Context.PRINT_SERVICE);
                            PrintDocumentAdapter adapter = view.createPrintDocumentAdapter(title);
                            pm.print(title, adapter, new PrintAttributes.Builder().build());
                        }
                    });
                    w.loadDataWithBaseURL("https://localhost/", html, "text/html", "UTF-8", null);
                }
            });
        }
    }
}
