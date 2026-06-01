import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'cinema.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Không thể kết nối tới cơ sở dữ liệu SQLite:', err.message);
  } else {
    console.log('Đã kết nối thành công tới SQLite (cinema.db).');
  }
});

// Chuyển các hàm của sqlite3 sang dạng Promise để dùng async/await dễ dàng hơn
export const dbRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

export const dbAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const dbGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

// Khởi tạo các bảng và dữ liệu mẫu nếu chưa có
export const initDatabase = async () => {
  // Kích hoạt ràng buộc khóa ngoại (foreign key)
  await dbRun('PRAGMA foreign_keys = ON;');

  // 1. Bảng Genres
  await dbRun(`
    CREATE TABLE IF NOT EXISTS genres (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    );
  `);

  // 2. Bảng Movies
  await dbRun(`
    CREATE TABLE IF NOT EXISTS movies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      duration INTEGER,
      description TEXT,
      image_url TEXT,
      genre_id INTEGER REFERENCES genres(id) ON DELETE RESTRICT,
      status TEXT CHECK(status IN ('Đang chiếu', 'Sắp chiếu')) DEFAULT 'Sắp chiếu',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 3. Bảng Showtimes
  await dbRun(`
    CREATE TABLE IF NOT EXISTS showtimes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      movie_id INTEGER REFERENCES movies(id) ON DELETE CASCADE,
      room_name TEXT NOT NULL,
      show_date DATE NOT NULL,
      start_time TEXT NOT NULL,
      ticket_price REAL NOT NULL
    );
  `);

  // 4. Bảng Bookings
  await dbRun(`
    CREATE TABLE IF NOT EXISTS bookings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_name TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL,
      total_price REAL NOT NULL,
      status TEXT CHECK(status IN ('Chờ thanh toán', 'Đã thanh toán', 'Đã hủy')) DEFAULT 'Chờ thanh toán',
      booking_date DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 5. Bảng Booking_Items
  await dbRun(`
    CREATE TABLE IF NOT EXISTS booking_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      booking_id INTEGER REFERENCES bookings(id) ON DELETE CASCADE,
      showtime_id INTEGER REFERENCES showtimes(id) ON DELETE CASCADE,
      seat_number TEXT NOT NULL,
      price REAL NOT NULL
    );
  `);

  // Kiểm tra xem đã có dữ liệu chưa để chèn dữ liệu mẫu (Seed Data)
  const genreCount = await dbGet('SELECT COUNT(*) as count FROM genres');
  if (genreCount.count === 0) {
    console.log('Chèn dữ liệu mẫu cho các bảng...');
    
    // Thêm Thể loại
    const genres = ['Hành động', 'Kinh dị', 'Tình cảm / Gia đình', 'Hoạt hình', 'Viễn tưởng'];
    for (const g of genres) {
      await dbRun('INSERT INTO genres (name) VALUES (?)', [g]);
    }

    // Lấy id thể loại vừa thêm
    const rowsGenres = await dbAll('SELECT id, name FROM genres');
    const genreMap = {};
    rowsGenres.forEach(r => { genreMap[r.name] = r.id; });

    // Thêm Phim
    const movies = [
      {
        title: 'Avengers: Endgame',
        duration: 181,
        description: 'Trận chiến cuối cùng chống lại tên ác nhân Thanos để bảo vệ sự sống của vũ trụ.',
        image_url: 'https://images.unsplash.com/photo-1594909122845-11baa439b7bf?auto=format&fit=crop&w=600&q=80',
        genre_id: genreMap['Viễn tưởng'],
        status: 'Đang chiếu'
      },
      {
        title: 'Lật Mặt 7: Một Điều Ước',
        duration: 138,
        description: 'Phim tâm lý tình cảm gia đình kể về câu chuyện đầy xúc động của bà Hai và 5 người con.',
        image_url: 'https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&w=600&q=80',
        genre_id: genreMap['Tình cảm / Gia đình'],
        status: 'Đang chiếu'
      },
      {
        title: 'Doraemon: Nobita và Bản Giao Hưởng Địa Cầu',
        duration: 115,
        description: 'Nobita gặp gỡ cô bé bí ẩn và cùng những người bạn tham gia chuyến phiêu lưu âm nhạc kỳ diệu.',
        image_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?auto=format&fit=crop&w=600&q=80',
        genre_id: genreMap['Hoạt hình'],
        status: 'Đang chiếu'
      },
      {
        title: 'Vùng Đất Câm Lặng: Ngày Một',
        duration: 99,
        description: 'Phần tiền truyện đầy kịch tính mô tả ngày đầu tiên thế giới chìm vào im lặng bởi cuộc tấn công của sinh vật ngoài hành tinh.',
        image_url: 'https://images.unsplash.com/photo-1509281373149-e957c6296406?auto=format&fit=crop&w=600&q=80',
        genre_id: genreMap['Kinh dị'],
        status: 'Sắp chiếu'
      }
    ];

    for (const m of movies) {
      await dbRun(`
        INSERT INTO movies (title, duration, description, image_url, genre_id, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `, [m.title, m.duration, m.description, m.image_url, m.genre_id, m.status]);
    }

    // Lấy id phim vừa thêm
    const rowsMovies = await dbAll('SELECT id, title FROM movies');
    const movieMap = {};
    rowsMovies.forEach(r => { movieMap[r.title] = r.id; });

    // Thêm một số Suất chiếu mẫu cho hôm nay và vài ngày tới
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

    const showtimes = [
      {
        movie_id: movieMap['Avengers: Endgame'],
        room_name: 'Phòng 01',
        show_date: today,
        start_time: '10:00',
        ticket_price: 90000
      },
      {
        movie_id: movieMap['Avengers: Endgame'],
        room_name: 'Phòng 01',
        show_date: today,
        start_time: '14:00',
        ticket_price: 90000
      },
      {
        movie_id: movieMap['Lật Mặt 7: Một Điều Ước'],
        room_name: 'Phòng 02',
        show_date: today,
        start_time: '11:00',
        ticket_price: 85000
      },
      {
        movie_id: movieMap['Lật Mặt 7: Một Điều Ước'],
        room_name: 'Phòng 02',
        show_date: today,
        start_time: '14:30',
        ticket_price: 85000
      },
      {
        movie_id: movieMap['Doraemon: Nobita và Bản Giao Hưởng Địa Cầu'],
        room_name: 'Phòng 03',
        show_date: today,
        start_time: '09:00',
        ticket_price: 75000
      },
      {
        movie_id: movieMap['Doraemon: Nobita và Bản Giao Hưởng Địa Cầu'],
        room_name: 'Phòng 03',
        show_date: tomorrow,
        start_time: '13:00',
        ticket_price: 75000
      }
    ];

    for (const s of showtimes) {
      await dbRun(`
        INSERT INTO showtimes (movie_id, room_name, show_date, start_time, ticket_price)
        VALUES (?, ?, ?, ?, ?)
      `, [s.movie_id, s.room_name, s.show_date, s.start_time, s.ticket_price]);
    }

    // Lấy id suất chiếu đầu tiên để làm booking mẫu
    const showtimeList = await dbAll('SELECT id FROM showtimes');
    if (showtimeList.length > 0) {
      const showtimeId = showtimeList[0].id;
      // Tạo một booking mẫu
      const bookingResult = await dbRun(`
        INSERT INTO bookings (customer_name, phone, email, total_price, status)
        VALUES (?, ?, ?, ?, ?)
      `, ['Nguyễn Văn A', '0912345678', 'vana@example.com', 180000, 'Đã thanh toán']);

      // Thêm chi tiết vé (ghế A5, A6)
      await dbRun(`
        INSERT INTO booking_items (booking_id, showtime_id, seat_number, price)
        VALUES (?, ?, ?, ?), (?, ?, ?, ?)
      `, [bookingResult.id, showtimeId, 'A5', 90000, bookingResult.id, showtimeId, 'A6', 90000]);
    }

    console.log('Đã chèn dữ liệu mẫu thành công.');
  }
};
