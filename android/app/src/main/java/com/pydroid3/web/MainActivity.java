package com.pydroid3.web;

import android.graphics.Color;
import android.os.Bundle;
import android.view.View;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Chừa chỗ cho thanh trạng thái / thanh điều hướng, còn bàn phím để hệ thống tự xử lý
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);

        View content = findViewById(android.R.id.content);
        content.setBackgroundColor(Color.parseColor("#181822"));

        ViewCompat.setOnApplyWindowInsetsListener(content, (v, insets) -> {
            Insets bars = insets.getInsets(
                WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            boolean keyboardVisible = insets.isVisible(WindowInsetsCompat.Type.ime());

            // Khi bàn phím mở thì KHÔNG cộng thêm phần đệm bên dưới (tránh trừ chiều cao hai lần)
            v.setPadding(bars.left, bars.top, bars.right, keyboardVisible ? 0 : bars.bottom);

            // Giữ nguyên thông tin bàn phím cho hệ thống, chỉ bỏ phần thanh hệ thống đã xử lý
            return new WindowInsetsCompat.Builder(insets)
                .setInsets(WindowInsetsCompat.Type.systemBars(), Insets.NONE)
                .setInsets(WindowInsetsCompat.Type.displayCutout(), Insets.NONE)
                .build();
        });

        // Biểu tượng pin/sóng màu sáng để nhìn rõ trên nền tối
        WindowInsetsControllerCompat controller =
            WindowCompat.getInsetsController(getWindow(), content);
        controller.setAppearanceLightStatusBars(false);
        controller.setAppearanceLightNavigationBars(false);
    }
}
