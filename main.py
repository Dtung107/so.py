import random

from kivy.app import App
from kivy.uix.boxlayout import BoxLayout
from kivy.uix.label import Label
from kivy.uix.textinput import TextInput
from kivy.uix.button import Button


class SoXoGame(App):

    def build(self):
        # Danh sách các số người chơi đã mua
        self.danh_sach_mua = []

        # Giao diện chính
        layout = BoxLayout(
            orientation='vertical',
            padding=20,
            spacing=10
        )

        # Tiêu đề
        self.tieu_de = Label(
            text='QUAY SỐ 2 CHỮ SỐ',
            font_size=26
        )
        layout.add_widget(self.tieu_de)

        # Ô nhập số
        self.o_nhap = TextInput(
            hint_text='Nhập số 2 chữ số',
            multiline=False,
            input_filter='int',
            font_size=22,
            halign='center'
        )
        layout.add_widget(self.o_nhap)

        # Nút mua số
        nut_mua = Button(
            text='MUA SỐ',
            font_size=20
        )
        nut_mua.bind(on_press=self.mua_so)
        layout.add_widget(nut_mua)

        # Hiển thị danh sách số đã mua
        self.hien_thi = Label(
            text='Chưa có số nào',
            font_size=18
        )
        layout.add_widget(self.hien_thi)

        # Nút quay số
        nut_quay = Button(
            text='QUAY SỐ',
            font_size=20
        )
        nut_quay.bind(on_press=self.quay_so)
        layout.add_widget(nut_quay)

        # Kết quả
        self.ket_qua_label = Label(
            text='Kết quả: ---',
            font_size=24
        )
        layout.add_widget(self.ket_qua_label)

        return layout

    # ==========================
    # XỬ LÝ MUA SỐ
    # ==========================

    def mua_so(self, instance):

        mua_so = self.o_nhap.text.strip()

        # Kiểm tra đúng 2 chữ số
        if len(mua_so) == 2 and mua_so.isdigit():

            self.danh_sach_mua.append(mua_so)

            self.hien_thi.text = (
                'Các số đã mua:\n'
                + ', '.join(self.danh_sach_mua)
            )

            self.o_nhap.text = ''

        else:

            self.hien_thi.text = (
                'LỖI: Số phải gồm đúng 2 chữ số!'
            )

    # ==========================
    # XỬ LÝ QUAY SỐ
    # ==========================

    def quay_so(self, instance):

        # Không cho quay nếu chưa mua số
        if not self.danh_sach_mua:

            self.ket_qua_label.text = (
                'Bạn chưa mua số!'
            )
            return

        # Tạo số ngẫu nhiên từ 00 đến 99
        ket_qua = str(
            random.randint(0, 99)
        ).zfill(2)

        # Hiển thị kết quả
        self.ket_qua_label.text = (
            f'Kết quả: {ket_qua[0]} {ket_qua[1]}'
        )

        # Kiểm tra trúng
        if ket_qua in self.danh_sach_mua:

            self.hien_thi.text = (
                f'🎉 CHÚC MỪNG!\n'
                f'Bạn đã trúng số {ket_qua}'
            )

        else:

            self.hien_thi.text = (
                'Rất tiếc, không có số nào trúng.'
            )


# Chạy ứng dụng
if __name__ == '__main__':
    SoXoGame().run()
