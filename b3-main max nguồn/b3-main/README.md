# ⚡ CINE-MATRIX: ONLINE MOVIE TICKET BOOKING SYSTEM

Hệ thống quản lý và đặt vé phim trực tuyến **CINE-MATRIX** là bài tập thành phần môn học **Công nghệ Phần mềm**. Dự án được xây dựng dựa trên mô hình quản lý phim và suất chiếu nâng cao, kết hợp xử lý các bài toán logic nghiệp vụ rạp chiếu thực tế và giao diện **Cyberpunk Neon Futuristic** sắc sảo.

---

## 🎨 Giao diện đặc trưng
* **Theme Cyberpunk Neon**: Sử dụng tông màu đen vũ trụ kết hợp ánh sáng phát xạ Neon Cyan, Neon Pink và Yellow chanh. Giao diện thiết kế vát góc (`clip-path`) công nghệ tương lai.
* **Sơ đồ rạp IMAX 3D**: Sơ đồ 60 ghế ngồi với hiệu ứng máy chiếu phim chớp nháy quét nhẹ (`screenPulse`), hiển thị chi tiết ghế thường và **Ghế VIP viền vàng phát sáng**.

---

## 🚀 Các Tính Năng Cốt Lõi

### 1. Phân hệ Khách hàng (Movie Showcase & Booking Flow)
* **Bộ lọc tìm kiếm nâng cao**: Lọc phim đang chiếu theo Thể loại, tìm kiếm theo Tên phim, hoặc lọc nhanh các phim có lịch chiếu theo Ngày cụ thể.
* **Luồng chọn Suất chiếu & Sơ đồ ghế động**:
  * Nhấn vào phim -> Chọn ngày chiếu -> Hệ thống hiển thị các Suất chiếu (Phòng chiếu & Khung giờ).
  * Chọn Suất chiếu -> Hiển thị sơ đồ ghế ngồi thực tế của suất chiếu đó (Khóa/bôi xám các ghế đã được người khác đặt thành công).
* **Checkout & Tính tiền tự động**: Tự động tính toán tổng tiền dựa trên số lượng ghế và đơn giá suất chiếu. Lưu thông tin hóa đơn khách hàng vào CSDL với trạng thái mặc định `"Chờ thanh toán"`.

### 2. Phân hệ Quản trị (Admin Dashboard)
* **Bảng điều khiển Thống kê Analytics**: Tự động tính toán tổng doanh thu thực tế (đã thanh toán), doanh thu chờ xử lý, số vé đã bán và số suất chiếu hoạt động trên hệ thống.
* **CRUD Phim & Thể loại (Nâng cao)**: Thao tác Xem, Thêm, Sửa, Xóa thông tin Phim và Thể loại phim. Xử lý khóa ngoại an toàn (không cho xóa thể loại nếu đang chứa phim liên kết).
* **Xếp lịch Suất chiếu & Tránh trùng lịch**:
  * Giao diện xếp lịch chiếu trực quan: Chọn Phim -> Chọn Phòng chiếu -> Chọn Ngày & Giờ chiếu -> Đặt giá vé.
  * **Ràng buộc đè lịch phòng**: Backend tự động đối chiếu thời lượng phim của suất chiếu mới + **15 phút dọn phòng** để chặn việc xếp lịch trùng phòng/giờ chiếu, thông báo lỗi trùng lịch chi tiết tới Admin.
* **Quản lý hóa đơn đặt vé**: Hiển thị danh sách vé đặt dạng bảng, cho phép chuyển đổi trạng thái hóa đơn (`Chờ thanh toán` -> `Đã thanh toán` hoặc `Đã hủy`), xem popup chi tiết các mã ghế chính xác khách đã mua.

---

## 💻 Công Nghệ Sử Dụng

* **Frontend**: React.js (Vite), CSS Custom Properties (Vanilla CSS cho tối đa kiểm soát hiệu ứng và hoạt ảnh).
* **Backend**: Node.js, Express.js.
* **Cơ sở dữ liệu**: SQLite (Relational Database) - Một hệ quản trị CSDL quan hệ nhúng vô cùng gọn nhẹ, không yêu cầu cài đặt máy chủ SQL Server hay MySQL cục bộ trên máy tính của giáo viên/sinh viên chấm bài.

---

## 📂 Cấu Trúc Mã Nguồn

```text
dd/
├── backend/
│   ├── db.js          # Khởi tạo CSDL SQLite, sơ đồ bảng & dữ liệu mẫu seed
│   ├── server.js      # Hệ thống API Endpoints & xử lý logic đè lịch/trùng ghế
│   └── package.json   # Thư viện phụ thuộc backend (express, sqlite3, cors)
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── CustomerApp.jsx     # Phân hệ đặt vé của Khách hàng
│   │   │   └── AdminDashboard.jsx  # Phân hệ quản lý Admin & Analytics
│   │   ├── App.jsx                 # Tệp React chính liên kết giao diện Cyberpunk
│   │   ├── main.jsx                # Tập tin khởi chạy ứng dụng
│   │   └── index.css               # Tệp CSS phong cách Cyberpunk độc quyền
│   ├── vite.config.js              # Cấu hình proxy trỏ về Backend (Cổng 5000)
│   └── package.json                # Thư viện frontend (react, vite)
├── scratch/
│   └── test_api.js    # Kịch bản kiểm thử API tích hợp tự động
├── package.json       # Tập tin cấu hình chạy đồng thời client/server ở thư mục gốc
└── README.md          # Tài liệu hướng dẫn dự án
```

---

## 🛠️ Hướng Dẫn Cài Đặt & Chạy Dự Án

### Yêu cầu hệ thống:
* Máy tính đã cài đặt **Node.js** (Khuyên dùng phiên bản >= 18).

### Các bước khởi chạy:

**Bước 1**: Tải mã nguồn về và mở cửa sổ Terminal/Command Prompt tại thư mục gốc của dự án (`dd/`).

**Bước 2**: Cài đặt toàn bộ thư viện cho cả thư mục gốc, thư mục `backend` và thư mục `frontend` bằng một lệnh duy nhất:
```bash
npm run install-all
```

**Bước 3**: Khởi chạy dự án ở chế độ phát triển (Development Mode):
```bash
npm run dev
```
Lệnh này sẽ tự động khởi động đồng thời:
* **Backend API**: Chạy tại [http://localhost:5000](http://localhost:5000)
* **Frontend Web App**: Chạy tại [http://localhost:3000](http://localhost:3000)

Bây giờ bạn chỉ cần mở trình duyệt và truy cập [http://localhost:3000](http://localhost:3000) để trải nghiệm ứng dụng.

---

## 🧪 Kịch Bản Kiểm Thử Tự Động (Integration Test)

Hệ thống đi kèm một tệp script tự động kiểm chứng các nghiệp vụ quan trọng như: kiểm tra đè giờ chiếu rạp, kiểm tra đặt trùng ghế và cơ chế giải phóng ghế sau khi hủy vé.

Để chạy kiểm thử tự động, hãy mở một cửa sổ Terminal mới tại thư mục gốc và gõ:
```bash
node scratch/test_api.js
```

---

## 🔑 Giải Thích Thuật Toán Nghiệp Vụ Đặc Biệt

### 1. Thuật toán kiểm tra đè lịch chiếu (Showtime Overlap Check)
Khi Admin xếp lịch chiếu mới có thời điểm bắt đầu là $S_{new}$ và thời điểm kết thúc là $E_{new}$ (với $E_{new} = S_{new} + \text{Thời lượng phim} + 15\text{ phút dọn dẹp}$):
* Máy chủ truy vấn các suất chiếu hiện tại của cùng phòng chiếu đó trong khoảng cách $\pm 1$ ngày.
* Đối với mỗi suất chiếu hiện có bắt đầu từ $S_{exist}$ và kết thúc ở $E_{exist}$, hai suất chiếu sẽ bị **giao nhau (trùng lịch)** nếu điều kiện sau thỏa mãn:
  $$S_{new} < E_{exist} \quad \text{AND} \quad S_{exist} < E_{new}$$
* Nếu điều kiện trên đúng, yêu cầu sẽ bị chặn và trả về lỗi `400 Bad Request`.

### 2. Thuật toán khóa ghế động
* Để đảm bảo không có hai người đặt trùng một ghế cho cùng một suất chiếu, trước khi thực hiện viết dữ liệu, hệ thống thực hiện kiểm tra:
  ```sql
  SELECT bi.seat_number FROM booking_items bi 
  JOIN bookings b ON bi.booking_id = b.id 
  WHERE bi.showtime_id = ? AND bi.seat_number IN (...) AND b.status != 'Đã hủy'
  ```
* Bằng cách loại trừ các hóa đơn có trạng thái `'Đã hủy'`, hệ thống vừa đảm bảo tính duy nhất của ghế trên những hóa đơn hoạt động (`Chờ thanh toán`/`Đã thanh toán`), vừa linh hoạt giải phóng ghế trống lập tức khi đơn hàng bị hủy bỏ mà không làm mất lịch sử lưu vết hóa đơn.
# b3
