import assert from 'assert';

async function runTests() {
  console.log('🏁 Bắt đầu kiểm thử API hệ thống...');
  const baseUrl = 'http://localhost:5000/api';

  try {
    // 1. Kiểm tra API Genres
    console.log('\n--- 1. Kiểm tra API Genres ---');
    const resGenres = await fetch(`${baseUrl}/genres`);
    const genres = await resGenres.json();
    assert.ok(Array.isArray(genres), 'Dữ liệu thể loại phải là danh sách');
    assert.ok(genres.length > 0, 'Danh sách thể loại mẫu không được rỗng');
    console.log(`✅ Lấy thể loại thành công: ${genres.length} thể loại.`);
    console.log('Các thể loại hiện tại:', genres.map(g => g.name).join(', '));

    // 2. Kiểm tra API Movies
    console.log('\n--- 2. Kiểm tra API Movies ---');
    const resMovies = await fetch(`${baseUrl}/movies`);
    const movies = await resMovies.json();
    assert.ok(Array.isArray(movies), 'Dữ liệu phim phải là danh sách');
    assert.ok(movies.length > 0, 'Danh sách phim mẫu không được rỗng');
    console.log(`✅ Lấy danh sách phim thành công: ${movies.length} phim.`);
    movies.forEach(m => {
      console.log(` - Phim: ${m.title} (${m.duration} phút) - Thể loại: ${m.genre_name} - Trạng thái: ${m.status}`);
    });

    // 3. Kiểm tra trùng lịch suất chiếu (Overlap Check)
    console.log('\n--- 3. Kiểm tra trùng lịch suất chiếu (Overlap Showtime Check) ---');
    // Avengers Endgame có duration là 181 phút, showtime hiện tại bắt đầu lúc 10:00 (kết thúc + dọn phòng lúc 13:16)
    // Thử thêm 1 showtime mới cho phòng 01 lúc 11:30 của ngày hôm nay
    const today = new Date().toISOString().split('T')[0];
    const newShowtimePayload = {
      movie_id: movies[0].id,
      room_name: 'Phòng 01',
      show_date: today,
      start_time: '11:30',
      ticket_price: 90000
    };

    console.log(`Thử xếp lịch trùng vào Phòng 01 lúc 11:30 ngày hôm nay...`);
    const resOverlap = await fetch(`${baseUrl}/showtimes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newShowtimePayload)
    });
    
    const overlapData = await resOverlap.json();
    console.log('HTTP Status code:', resOverlap.status);
    console.log('Phản hồi lỗi từ máy chủ:', overlapData.message);
    
    assert.strictEqual(resOverlap.status, 400, 'Server phải trả về lỗi 400 khi trùng lịch chiếu');
    assert.ok(overlapData.message.includes('Trùng lịch'), 'Thông báo lỗi phải hiển thị nguyên nhân trùng lịch');
    console.log('✅ Ràng buộc đè lịch suất chiếu hoạt động cực tốt!');

    // 4. Kiểm tra đặt trùng ghế (Double Booking Check)
    console.log('\n--- 4. Kiểm tra trùng ghế ngồi (Seat Booking Conflict Check) ---');
    // Tìm các suất chiếu đang có sẵn
    const resShowtimes = await fetch(`${baseUrl}/showtimes`);
    const showtimes = await resShowtimes.json();
    assert.ok(showtimes.length > 0, 'Phải có suất chiếu mẫu');
    const targetShowtimeId = showtimes[0].id;

    // Đặt ghế ngẫu nhiên cho mỗi lượt chạy để tránh trùng lặp dữ liệu cũ
    const randomRow = ['E', 'F'][Math.floor(Math.random() * 2)];
    const seat1 = `${randomRow}7`;
    const seat2 = `${randomRow}8`;
    const seat3 = `${randomRow}9`;

    const bookingPayload1 = {
      customer_name: 'Khách Kiểm Thử 1',
      phone: '0901234567',
      email: 'test1@example.com',
      showtime_id: targetShowtimeId,
      seats: [seat1, seat2],
      total_price: showtimes[0].ticket_price * 2
    };

    console.log(`Thực hiện đặt ghế ${seat1}, ${seat2} cho suất chiếu #${targetShowtimeId}...`);
    const resBooking1 = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload1)
    });
    const booking1 = await resBooking1.json();
    assert.strictEqual(resBooking1.status, 201, 'Đặt vé lần đầu phải thành công');
    console.log(`✅ Đặt vé lần đầu thành công! Mã đơn: #${booking1.id}, Ghế đặt: ${booking1.seat_list}`);

    // Bây giờ, thử đặt lại ghế seat2 (đã đặt ở trên) bởi một khách hàng khác
    const bookingPayload2 = {
      customer_name: 'Khách Kiểm Thử 2',
      phone: '0907654321',
      email: 'test2@example.com',
      showtime_id: targetShowtimeId,
      seats: [seat2, seat3], // Ghế seat2 trùng lặp
      total_price: showtimes[0].ticket_price * 2
    };

    console.log(`Thử đặt lại ghế ${seat2} (đã bị đặt) và ${seat3} cho suất chiếu #${targetShowtimeId}...`);

    const resBooking2 = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload2)
    });
    const booking2Data = await resBooking2.json();
    console.log('HTTP Status code:', resBooking2.status);
    console.log('Phản hồi lỗi trùng ghế từ máy chủ:', booking2Data.message);
    assert.strictEqual(resBooking2.status, 400, 'Đặt ghế trùng phải bị từ chối với lỗi 400');
    assert.ok(booking2Data.message.includes('người khác đặt') || booking2Data.message.includes('chọn ghế khác'), 'Thông báo lỗi phải nhắc nhở chọn ghế khác');
    console.log('✅ Ràng buộc trùng ghế hoạt động chính xác tuyệt đối!');

    // 5. Cập nhật trạng thái và Giải phóng ghế khi Hủy
    console.log('\n--- 5. Kiểm tra Hủy vé và Giải phóng ghế trống ---');
    console.log(`Hủy hóa đơn vừa đặt #${booking1.id}...`);
    const resCancel = await fetch(`${baseUrl}/bookings/${booking1.id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'Đã hủy' })
    });
    const cancelledBooking = await resCancel.json();
    assert.strictEqual(cancelledBooking.status, 'Đã hủy', 'Trạng thái hóa đơn phải chuyển sang Đã hủy');

    // Sau khi hủy, ghế đã đặt cũ phải được giải phóng và có thể đặt lại được
    console.log(`Đặt lại ghế ${seat2} và ${seat3} sau khi đơn cũ đã bị hủy...`);
    const resBooking3 = await fetch(`${baseUrl}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingPayload2)
    });
    const booking3 = await resBooking3.json();
    assert.strictEqual(resBooking3.status, 201, 'Ghế B4 đã được giải phóng nên đặt lại phải thành công');
    console.log(`✅ Đặt lại thành công! Mã đơn mới: #${booking3.id}, Ghế đặt: ${booking3.seat_list}`);

    console.log('\n🎉 TẤT CẢ CÁC BÀI KIỂM THỬ ĐÃ THÀNH CÔNG RỰC RỠ! 🎉');

  } catch (err) {
    console.error('❌ Kiểm thử thất bại do lỗi:', err);
    process.exit(1);
  }
}

runTests();
