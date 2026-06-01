import express from 'express';
import cors from 'cors';
import { initDatabase, dbRun, dbAll, dbGet } from './db.js';

const app = express();
const port = 5000;

app.use(cors());
app.use(express.json());

// Khởi tạo cơ sở dữ liệu
initDatabase().then(() => {
  console.log('Khởi tạo cấu trúc CSDL và dữ liệu mẫu hoàn tất.');
}).catch((err) => {
  console.error('Lỗi khi khởi tạo CSDL:', err);
});

// Helper định dạng giờ sang chuỗi HH:MM
const formatTime = (date) => {
  const h = String(date.getHours()).padStart(2, '0');
  const m = String(date.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
};

// ==========================================
// 1. GENRES API (QUẢN LÝ THỂ LOẠI)
// ==========================================

// Xem danh sách thể loại
app.get('/api/genres', async (req, res) => {
  try {
    const genres = await dbAll('SELECT * FROM genres ORDER BY id DESC');
    res.json(genres);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi lấy danh sách thể loại.', error: error.message });
  }
});

// Thêm thể loại mới
app.post('/api/genres', async (req, res) => {
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Tên thể loại không được để trống.' });
  }
  try {
    const result = await dbRun('INSERT INTO genres (name) VALUES (?)', [name.trim()]);
    res.status(201).json({ id: result.id, name: name.trim() });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ message: 'Tên thể loại này đã tồn tại.' });
    }
    res.status(500).json({ message: 'Lỗi khi tạo thể loại mới.', error: error.message });
  }
});

// Sửa thể loại
app.put('/api/genres/:id', async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  if (!name || name.trim() === '') {
    return res.status(400).json({ message: 'Tên thể loại không được để trống.' });
  }
  try {
    await dbRun('UPDATE genres SET name = ? WHERE id = ?', [name.trim(), id]);
    res.json({ id: Number(id), name: name.trim() });
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ message: 'Tên thể loại này đã tồn tại.' });
    }
    res.status(500).json({ message: 'Lỗi khi sửa thể loại.', error: error.message });
  }
});

// Xóa thể loại
app.delete('/api/genres/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Kiểm tra xem thể loại có đang được liên kết với phim nào không
    const associatedMovie = await dbGet('SELECT id FROM movies WHERE genre_id = ? LIMIT 1', [id]);
    if (associatedMovie) {
      return res.status(400).json({ message: 'Không thể xóa thể loại này vì đang có phim liên kết với nó.' });
    }
    await dbRun('DELETE FROM genres WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa thể loại thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa thể loại.', error: error.message });
  }
});


// ==========================================
// 2. MOVIES API (QUẢN LÝ PHIM)
// ==========================================

// Xem danh sách phim (kèm theo tên thể loại)
app.get('/api/movies', async (req, res) => {
  try {
    const movies = await dbAll(`
      SELECT m.*, g.name as genre_name 
      FROM movies m 
      LEFT JOIN genres g ON m.genre_id = g.id 
      ORDER BY m.id DESC
    `);
    res.json(movies);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách phim.', error: error.message });
  }
});

// Thêm phim mới
app.post('/api/movies', async (req, res) => {
  const { title, duration, description, image_url, genre_id, status } = req.body;
  if (!title || !duration || !genre_id) {
    return res.status(400).json({ message: 'Các thông tin: Tên phim, thời lượng và thể loại là bắt buộc.' });
  }
  try {
    const result = await dbRun(`
      INSERT INTO movies (title, duration, description, image_url, genre_id, status)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      title.trim(),
      Number(duration),
      description ? description.trim() : '',
      image_url ? image_url.trim() : '',
      Number(genre_id),
      status || 'Sắp chiếu'
    ]);
    const newMovie = await dbGet('SELECT m.*, g.name as genre_name FROM movies m LEFT JOIN genres g ON m.genre_id = g.id WHERE m.id = ?', [result.id]);
    res.status(201).json(newMovie);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi thêm phim mới.', error: error.message });
  }
});

// Sửa phim
app.put('/api/movies/:id', async (req, res) => {
  const { id } = req.params;
  const { title, duration, description, image_url, genre_id, status } = req.body;
  if (!title || !duration || !genre_id) {
    return res.status(400).json({ message: 'Các thông tin: Tên phim, thời lượng và thể loại là bắt buộc.' });
  }
  try {
    await dbRun(`
      UPDATE movies 
      SET title = ?, duration = ?, description = ?, image_url = ?, genre_id = ?, status = ?
      WHERE id = ?
    `, [
      title.trim(),
      Number(duration),
      description ? description.trim() : '',
      image_url ? image_url.trim() : '',
      Number(genre_id),
      status,
      id
    ]);
    const updatedMovie = await dbGet('SELECT m.*, g.name as genre_name FROM movies m LEFT JOIN genres g ON m.genre_id = g.id WHERE m.id = ?', [id]);
    res.json(updatedMovie);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật phim.', error: error.message });
  }
});

// Xóa phim
app.delete('/api/movies/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Kiểm tra xem phim có đang có suất chiếu nào hoạt động không
    const associatedShowtime = await dbGet('SELECT id FROM showtimes WHERE movie_id = ? LIMIT 1', [id]);
    if (associatedShowtime) {
      return res.status(400).json({ message: 'Không thể xóa phim này vì đang có suất chiếu của phim trên hệ thống.' });
    }
    await dbRun('DELETE FROM movies WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa phim thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa phim.', error: error.message });
  }
});


// ==========================================
// 3. SHOWTIMES API (QUẢN LÝ SUẤT CHIẾU & RÀNG BUỘC)
// ==========================================

// Lấy danh sách suất chiếu (kèm thông tin phim và thể loại)
app.get('/api/showtimes', async (req, res) => {
  const { movie_id, date } = req.query;
  let sql = `
    SELECT s.*, m.title as movie_title, m.duration as movie_duration, m.image_url as movie_image_url, g.name as genre_name
    FROM showtimes s
    JOIN movies m ON s.movie_id = m.id
    LEFT JOIN genres g ON m.genre_id = g.id
    WHERE 1=1
  `;
  const params = [];
  if (movie_id) {
    sql += ' AND s.movie_id = ?';
    params.push(movie_id);
  }
  if (date) {
    sql += ' AND s.show_date = ?';
    params.push(date);
  }
  sql += ' ORDER BY s.show_date ASC, s.start_time ASC';

  try {
    const showtimes = await dbAll(sql, params);
    res.json(showtimes);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách suất chiếu.', error: error.message });
  }
});

// Thêm suất chiếu mới kèm validation trùng lịch phòng chiếu nâng cao
app.post('/api/showtimes', async (req, res) => {
  const { movie_id, room_name, show_date, start_time, ticket_price } = req.body;

  if (!movie_id || !room_name || !show_date || !start_time || !ticket_price) {
    return res.status(400).json({ message: 'Vui lòng cung cấp đầy đủ thông tin suất chiếu.' });
  }

  try {
    // 1. Lấy thời lượng phim muốn thêm lịch
    const targetMovie = await dbGet('SELECT title, duration FROM movies WHERE id = ?', [movie_id]);
    if (!targetMovie) {
      return res.status(404).json({ message: 'Không tìm thấy bộ phim được chọn.' });
    }

    const duration = targetMovie.duration;
    const bufferMinutes = 15; // 15 phút dọn dẹp và chuẩn bị phòng chiếu

    // 2. Tính thời điểm bắt đầu và kết thúc của suất chiếu mới
    const newStart = new Date(`${show_date}T${start_time}`);
    if (isNaN(newStart.getTime())) {
      return res.status(400).json({ message: 'Ngày chiếu hoặc Giờ chiếu không hợp lệ.' });
    }
    const newEnd = new Date(newStart.getTime() + (duration + bufferMinutes) * 60 * 1000);

    // 3. Lấy tất cả suất chiếu trong phòng này trong khoảng cách +- 1 ngày
    const existingShowtimes = await dbAll(`
      SELECT s.*, m.title as movie_title, m.duration as movie_duration
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      WHERE s.room_name = ? 
        AND s.show_date BETWEEN DATE(?, '-1 day') AND DATE(?, '+1 day')
    `, [room_name, show_date, show_date]);

    // 4. Kiểm tra xem có suất chiếu nào bị trùng/đè lịch hay không
    for (const s of existingShowtimes) {
      const existStart = new Date(`${s.show_date}T${s.start_time}`);
      const existEnd = new Date(existStart.getTime() + (s.movie_duration + bufferMinutes) * 60 * 1000);

      // Điều kiện đè nhau: Start1 < End2 AND Start2 < End1
      if (newStart < existEnd && existStart < newEnd) {
        const existEndFormatted = formatTime(existEnd);
        return res.status(400).json({
          message: `Trùng lịch! ${room_name} vào khung giờ này đang có phim "${s.movie_title}" chiếu từ ${s.start_time} (dự kiến dọn phòng xong lúc ${existEndFormatted}).`
        });
      }
    }

    // 5. Thêm suất chiếu vào CSDL
    const result = await dbRun(`
      INSERT INTO showtimes (movie_id, room_name, show_date, start_time, ticket_price)
      VALUES (?, ?, ?, ?, ?)
    `, [movie_id, room_name, show_date, start_time, Number(ticket_price)]);

    const newShowtime = await dbGet(`
      SELECT s.*, m.title as movie_title, m.duration as movie_duration
      FROM showtimes s
      JOIN movies m ON s.movie_id = m.id
      WHERE s.id = ?
    `, [result.id]);

    res.status(201).json(newShowtime);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi máy chủ khi thiết lập suất chiếu.', error: error.message });
  }
});

// Xóa suất chiếu
app.delete('/api/showtimes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    // Kiểm tra xem suất chiếu này đã có vé đặt chưa
    const activeBooking = await dbGet(`
      SELECT bi.id 
      FROM booking_items bi
      JOIN bookings b ON bi.booking_id = b.id
      WHERE bi.showtime_id = ? AND b.status != 'Đã hủy'
      LIMIT 1
    `, [id]);
    
    if (activeBooking) {
      return res.status(400).json({ message: 'Không thể xóa suất chiếu này vì đã có khách hàng đặt ghế.' });
    }

    await dbRun('DELETE FROM showtimes WHERE id = ?', [id]);
    res.json({ message: 'Đã xóa suất chiếu thành công.' });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi xóa suất chiếu.', error: error.message });
  }
});


// ==========================================
// 4. SEATS API (TÌM GHẾ TRỐNG/ĐÃ ĐẶT)
// ==========================================

// Lấy danh sách các ghế đã được đặt của một suất chiếu cụ thể
app.get('/api/showtimes/:id/seats', async (req, res) => {
  const { id } = req.params;
  try {
    // Ghế đã đặt là những ghế thuộc các hóa đơn có trạng thái khác 'Đã hủy'
    const bookedSeats = await dbAll(`
      SELECT bi.seat_number 
      FROM booking_items bi
      JOIN bookings b ON bi.booking_id = b.id
      WHERE bi.showtime_id = ? AND b.status != 'Đã hủy'
    `, [id]);

    const seatArray = bookedSeats.map(item => item.seat_number);
    res.json(seatArray);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi truy vấn sơ đồ ghế ngồi.', error: error.message });
  }
});


// ==========================================
// 5. BOOKINGS & CHECKOUT API (QUẢN LÝ ĐẶT VÉ & HÓA ĐƠN)
// ==========================================

// Lấy danh sách hóa đơn (Admin)
app.get('/api/bookings', async (req, res) => {
  try {
    const bookings = await dbAll(`
      SELECT 
        b.id, b.customer_name, b.phone, b.email, b.total_price, b.status, b.booking_date,
        s.room_name, s.show_date, s.start_time,
        m.title as movie_title,
        GROUP_CONCAT(bi.seat_number, ', ') as seat_list
      FROM bookings b
      JOIN booking_items bi ON b.id = bi.booking_id
      JOIN showtimes s ON bi.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      GROUP BY b.id
      ORDER BY b.booking_date DESC
    `);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi lấy danh sách đặt vé.', error: error.message });
  }
});

// Tạo đơn đặt vé mới (Checkout) kèm khóa an toàn chống trùng ghế
app.post('/api/bookings', async (req, res) => {
  const { customer_name, phone, email, showtime_id, seats, total_price } = req.body;

  if (!customer_name || !phone || !email || !showtime_id || !seats || !Array.isArray(seats) || seats.length === 0) {
    return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin khách hàng và chọn ít nhất 1 ghế.' });
  }

  try {
    // 1. Kiểm tra xem các ghế muốn chọn đã có ai đặt trước cho suất chiếu này chưa
    const placeholders = seats.map(() => '?').join(',');
    const query = `
      SELECT bi.seat_number 
      FROM booking_items bi
      JOIN bookings b ON bi.booking_id = b.id
      WHERE bi.showtime_id = ? 
        AND bi.seat_number IN (${placeholders}) 
        AND b.status != 'Đã hủy'
    `;

    const conflictingSeats = await dbAll(query, [showtime_id, ...seats]);
    if (conflictingSeats.length > 0) {
      const conflictList = conflictingSeats.map(item => item.seat_number).join(', ');
      return res.status(400).json({
        message: `Rất tiếc, ghế (${conflictList}) vừa được người khác đặt thành công. Vui lòng chọn ghế khác.`
      });
    }

    // 2. Lấy giá vé của suất chiếu để tự tính toán & xác thực tổng tiền từ Server
    const showtime = await dbGet('SELECT ticket_price FROM showtimes WHERE id = ?', [showtime_id]);
    if (!showtime) {
      return res.status(404).json({ message: 'Suất chiếu không hợp lệ hoặc đã bị xóa.' });
    }

    const calculatedTotal = showtime.ticket_price * seats.length;

    // 3. Thực hiện giao dịch an toàn (Lưu hóa đơn & Chi tiết ghế)
    await dbRun('BEGIN TRANSACTION');

    try {
      // Chèn hóa đơn đặt vé chính
      const bookingResult = await dbRun(`
        INSERT INTO bookings (customer_name, phone, email, total_price, status)
        VALUES (?, ?, ?, ?, 'Chờ thanh toán')
      `, [customer_name.trim(), phone.trim(), email.trim(), calculatedTotal]);

      const bookingId = bookingResult.id;

      // Chèn từng ghế đặt vào chi tiết
      for (const seat of seats) {
        await dbRun(`
          INSERT INTO booking_items (booking_id, showtime_id, seat_number, price)
          VALUES (?, ?, ?, ?)
        `, [bookingId, showtime_id, seat, showtime.ticket_price]);
      }

      await dbRun('COMMIT');

      const savedBooking = await dbGet(`
        SELECT b.*, GROUP_CONCAT(bi.seat_number, ', ') as seat_list
        FROM bookings b
        JOIN booking_items bi ON b.id = bi.booking_id
        WHERE b.id = ?
        GROUP BY b.id
      `, [bookingId]);

      res.status(201).json(savedBooking);

    } catch (dbErr) {
      await dbRun('ROLLBACK');
      throw dbErr;
    }

  } catch (error) {
    res.status(500).json({ message: 'Đã xảy ra lỗi trong quá trình xử lý đặt vé.', error: error.message });
  }
});

// Cập nhật trạng thái đơn đặt vé (Admin)
app.patch('/api/bookings/:id/status', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Chờ thanh toán', 'Đã thanh toán', 'Đã hủy'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: 'Trạng thái cập nhật không hợp lệ.' });
  }

  try {
    const checkBooking = await dbGet('SELECT id FROM bookings WHERE id = ?', [id]);
    if (!checkBooking) {
      return res.status(404).json({ message: 'Không tìm thấy đơn đặt vé này.' });
    }

    await dbRun('UPDATE bookings SET status = ? WHERE id = ?', [status, id]);
    
    // Lấy lại đơn hàng đầy đủ để trả về client
    const updatedBooking = await dbGet(`
      SELECT 
        b.id, b.customer_name, b.phone, b.email, b.total_price, b.status, b.booking_date,
        s.room_name, s.show_date, s.start_time,
        m.title as movie_title,
        GROUP_CONCAT(bi.seat_number, ', ') as seat_list
      FROM bookings b
      JOIN booking_items bi ON b.id = bi.booking_id
      JOIN showtimes s ON bi.showtime_id = s.id
      JOIN movies m ON s.movie_id = m.id
      WHERE b.id = ?
      GROUP BY b.id
    `, [id]);

    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: 'Lỗi khi cập nhật trạng thái đơn hàng.', error: error.message });
  }
});


// Lắng nghe cổng
app.listen(port, () => {
  console.log(`Server Express đang hoạt động tại cổng http://localhost:${port}`);
});
