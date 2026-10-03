[app]

# Tên ứng dụng
title = Random 00-99

# Tên package
package.name = random0099
# Tên miền package
package.domain = org.example

# Thư mục chứa main.py
source.dir = .

# Các file được đưa vào APK
source.include_exts = py,png,jpg,jpeg,kv,wav,mp3

# Phiên bản ứng dụng
version = 1.0

# Thư viện Python cần thiết

requirements = python3==3.11.9,hostpython3==3.11.9,kivy
# Hướng màn hình
orientation = portrait

# Không tự động thoát khi nhấn nút Back
fullscreen = 0


[buildozer]

# Log build
log_level = 2
