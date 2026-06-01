import React, { useState, useEffect } from 'react';

export default function CustomerApp() {
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  
  // Filters
  const [searchTitle, setSearchTitle] = useState('');
  const [selectedGenreId, setSelectedGenreId] = useState('');
  const [selectedShowDate, setSelectedShowDate] = useState('');

  // Booking state
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [movieShowtimes, setMovieShowtimes] = useState([]);
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedShowtime, setSelectedShowtime] = useState(null);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [occupiedSeats, setOccupiedSeats] = useState([]);
  const [bookingStep, setBookingStep] = useState(0); // 0: Catalog, 1: Select Showtime, 2: Select Seats & Checkout

  // Form state
  const [customerName, setCustomerName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successBooking, setSuccessBooking] = useState(null);

  // Load data
  useEffect(() => {
    fetchMoviesAndGenres();
    fetchAllShowtimes();
  }, []);

  const fetchMoviesAndGenres = async () => {
    try {
      setLoading(true);
      const [resMovies, resGenres] = await Promise.all([
        fetch('/api/movies'),
        fetch('/api/genres')
      ]);
      const moviesData = await resMovies.json();
      const genresData = await resGenres.json();
      setMovies(moviesData);
      setGenres(genresData);
    } catch (err) {
      console.error(err);
      setError('Không thể tải danh sách phim và thể loại.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllShowtimes = async () => {
    try {
      const res = await fetch('/api/showtimes');
      const data = await res.json();
      setShowtimes(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Lấy các suất chiếu cho bộ phim được chọn
  const handleSelectMovie = async (movie) => {
    setSelectedMovie(movie);
    setBookingStep(1);
    setSuccessBooking(null);
    setError(null);
    setSelectedShowtime(null);
    setSelectedSeats([]);

    try {
      setLoading(true);
      const res = await fetch(`/api/showtimes?movie_id=${movie.id}`);
      const data = await res.json();
      setMovieShowtimes(data);

      // Tự động chọn ngày đầu tiên có suất chiếu (nếu có)
      if (data.length > 0) {
        const uniqueDates = [...new Set(data.map(item => item.show_date))];
        setSelectedDate(uniqueDates[0]);
      } else {
        setSelectedDate('');
      }
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải lịch chiếu của phim này.');
    } finally {
      setLoading(false);
    }
  };

  // Khi chọn suất chiếu cụ thể
  const handleSelectShowtime = async (showtime) => {
    setSelectedShowtime(showtime);
    setSelectedSeats([]);
    setError(null);
    setBookingStep(2);

    try {
      const res = await fetch(`/api/showtimes/${showtime.id}/seats`);
      const occupied = await res.json();
      setOccupiedSeats(occupied);
    } catch (err) {
      console.error(err);
      setError('Lỗi khi tải sơ đồ ghế ngồi.');
    }
  };

  // Xử lý click chọn/bỏ chọn ghế
  const handleSeatClick = (seatNumber) => {
    if (occupiedSeats.includes(seatNumber)) return; // Ghế đã có người đặt, bị khóa

    if (selectedSeats.includes(seatNumber)) {
      setSelectedSeats(selectedSeats.filter(s => s !== seatNumber));
    } else {
      setSelectedSeats([...selectedSeats, seatNumber]);
    }
  };

  // Xác nhận đặt vé
  const handleSubmitBooking = async (e) => {
    e.preventDefault();
    if (selectedSeats.length === 0) {
      setError('Vui lòng chọn ít nhất một ghế ngồi.');
      return;
    }
    setError(null);

    const bookingPayload = {
      customer_name: customerName,
      phone,
      email,
      showtime_id: selectedShowtime.id,
      seats: selectedSeats,
      total_price: selectedShowtime.ticket_price * selectedSeats.length
    };

    try {
      setLoading(true);
      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(bookingPayload)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Có lỗi xảy ra khi đặt vé.');
      }

      setSuccessBooking(data);
      setBookingStep(3); // Bước thành công
      // Reset form
      setCustomerName('');
      setPhone('');
      setEmail('');
      setSelectedSeats([]);
      fetchAllShowtimes(); // Cập nhật lại số liệu suất chiếu toàn cục
    } catch (err) {
      setError(err.message);
      // Refresh danh sách ghế ngồi đã đặt nếu gặp lỗi (ví dụ có người khác nhanh tay đặt trước)
      if (selectedShowtime) {
        const res = await fetch(`/api/showtimes/${selectedShowtime.id}/seats`);
        const occupied = await res.json();
        setOccupiedSeats(occupied);
      }
    } finally {
      setLoading(false);
    }
  };

  // Quay lại bước trước
  const handleBack = () => {
    if (bookingStep === 2) {
      setBookingStep(1);
      setSelectedShowtime(null);
      setSelectedSeats([]);
      setError(null);
    } else if (bookingStep === 1 || bookingStep === 3) {
      setBookingStep(0);
      setSelectedMovie(null);
      setMovieShowtimes([]);
      setSelectedShowtime(null);
      setError(null);
    }
  };

  // Định dạng tiền tệ VND
  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  // Định dạng ngày sang DD/MM/YYYY
  const formatDateVN = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // ==========================================
  // LỌC DANH SÁCH PHIM
  // ==========================================
  const filteredMovies = movies.filter(movie => {
    // 1. Lọc theo tên
    const matchTitle = movie.title.toLowerCase().includes(searchTitle.toLowerCase());
    
    // 2. Lọc theo thể loại
    const matchGenre = selectedGenreId === '' || movie.genre_id === Number(selectedGenreId);

    // 3. Lọc theo ngày chiếu (Xem phim đó có lịch chiếu vào ngày được chọn hay không)
    let matchDate = true;
    if (selectedShowDate !== '') {
      // Tìm xem có suất chiếu nào của phim này vào ngày lọc hay không
      const hasShowtimeOnDate = showtimes.some(st => 
        st.movie_id === movie.id && st.show_date === selectedShowDate
      );
      matchDate = hasShowtimeOnDate;
    }

    return matchTitle && matchGenre && matchDate;
  });

  // Tạo sơ đồ ghế 6 hàng (A-F), 10 cột (1-10)
  const rows = ['A', 'B', 'C', 'D', 'E', 'F'];
  const columns = Array.from({ length: 10 }, (_, i) => i + 1);

  return (
    <div className="customer-app">
      {/* 1. MÀN HÌNH DANH SÁCH PHIM */}
      {bookingStep === 0 && (
        <>
          <div className="glass-panel search-filter-bar">
            <div className="form-group-filter">
              <label>Tìm kiếm phim</label>
              <input
                type="text"
                placeholder="Nhập tên phim cần tìm..."
                value={searchTitle}
                onChange={(e) => setSearchTitle(e.target.value)}
                className="input-field"
              />
            </div>
            
            <div className="form-group-filter">
              <label>Thể loại</label>
              <select
                value={selectedGenreId}
                onChange={(e) => setSelectedGenreId(e.target.value)}
                className="input-field"
              >
                <option value="">Tất cả thể loại</option>
                {genres.map(g => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group-filter">
              <label>Ngày chiếu phim</label>
              <input
                type="date"
                value={selectedShowDate}
                onChange={(e) => setSelectedShowDate(e.target.value)}
                className="input-field"
              />
            </div>

            {(searchTitle || selectedGenreId || selectedShowDate) && (
              <button 
                onClick={() => {
                  setSearchTitle('');
                  setSelectedGenreId('');
                  setSelectedShowDate('');
                }}
                className="btn-admin-action"
                style={{ alignSelf: 'flex-end', marginTop: '12px' }}
              >
                Xóa bộ lọc
              </button>
            )}
          </div>

          <h2 className="section-title">
            <span style={{ color: 'var(--accent-gold)' }}>🎬</span> Phim Đang & Sắp Chiếu
          </h2>

          {loading ? (
            <div className="loading-spinner">Đang tải danh sách phim...</div>
          ) : filteredMovies.length === 0 ? (
            <div className="empty-state">
              <i>🔍</i>
              <p>Không tìm thấy bộ phim nào phù hợp với bộ lọc.</p>
            </div>
          ) : (
            <div className="movie-grid">
              {filteredMovies.map(movie => (
                <div key={movie.id} className="glass-panel movie-card">
                  <div className="movie-poster-wrapper">
                    <img 
                      src={movie.image_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80'} 
                      alt={movie.title} 
                      className="movie-poster"
                      onError={(e) => {
                        e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=400&q=80';
                      }}
                    />
                    <span className={`movie-status-badge ${movie.status === 'Đang chiếu' ? 'now-playing' : 'coming-soon'}`}>
                      {movie.status}
                    </span>
                  </div>
                  
                  <div className="movie-info">
                    <span className="movie-genre">{movie.genre_name || 'Thể loại khác'}</span>
                    <h3 className="movie-title">{movie.title}</h3>
                    <div className="movie-duration">
                      <span>⏱️ {movie.duration} phút</span>
                    </div>
                    
                    {movie.status === 'Đang chiếu' ? (
                      <button 
                        onClick={() => handleSelectMovie(movie)}
                        className="btn-book-now"
                      >
                        Đặt vé ngay
                      </button>
                    ) : (
                      <button 
                        disabled
                        className="btn-book-now"
                        style={{ background: 'var(--seat-occupied)', color: 'var(--text-muted)', cursor: 'not-allowed' }}
                      >
                        Chưa mở bán
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* 2. MÀN HÌNH CHỌN SUẤT CHIẾU & SƠ ĐỒ GHẾ NGỒI */}
      {bookingStep > 0 && bookingStep <= 2 && (
        <div>
          <button onClick={handleBack} className="back-btn">
            ⬅️ Quay lại trang phim
          </button>

          <div className="steps-indicator">
            <div className={`step-item ${bookingStep >= 1 ? 'active' : ''} ${bookingStep > 1 ? 'completed' : ''}`} onClick={() => bookingStep > 1 && handleBack()}>
              <span className="step-num">1</span>
              <span>Chọn Suất Chiếu</span>
            </div>
            <div className={`step-item ${bookingStep >= 2 ? 'active' : ''}`}>
              <span className="step-num">2</span>
              <span>Chọn Ghế & Thanh Toán</span>
            </div>
          </div>

          {error && (
            <div className="alert-banner error">
              <span>⚠️</span>
              <div>{error}</div>
            </div>
          )}

          <div className="booking-layout">
            {/* Cột trái: Nội dung động theo bước */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              
              {/* Bước 1: Chọn ngày và suất chiếu */}
              {bookingStep === 1 && (
                <div>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--accent-gold)' }}>Chọn Ngày & Giờ Chiếu</h3>
                  
                  {movieShowtimes.length === 0 ? (
                    <div className="empty-state" style={{ padding: '2rem' }}>
                      <p>Hiện tại phim này chưa được xếp lịch chiếu. Vui lòng quay lại sau!</p>
                    </div>
                  ) : (
                    <>
                      {/* Danh sách ngày chiếu của phim */}
                      <div className="showtime-day-grid">
                        {[...new Set(movieShowtimes.map(st => st.show_date))].map(dateStr => {
                          const dateObj = new Date(dateStr);
                          const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy'];
                          const dayName = weekdays[dateObj.getDay()];
                          const displayDate = dateStr.split('-').reverse().slice(0,2).join('/'); // DD/MM

                          return (
                            <div 
                              key={dateStr} 
                              className={`day-tab ${selectedDate === dateStr ? 'active' : ''}`}
                              onClick={() => setSelectedDate(dateStr)}
                            >
                              <div className="day-name">{dayName}</div>
                              <div className="day-date">{displayDate}</div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Các phòng chiếu & suất chiếu thuộc ngày được chọn */}
                      {selectedDate && (
                        <div>
                          {/* Gom nhóm suất chiếu theo phòng */}
                          {Object.entries(
                            movieShowtimes
                              .filter(st => st.show_date === selectedDate)
                              .reduce((groups, item) => {
                                const val = item.room_name;
                                groups[val] = groups[val] || [];
                                groups[val].push(item);
                                return groups;
                              }, {})
                          ).map(([roomName, roomShowtimes]) => (
                            <div key={roomName} className="showtime-room-group">
                              <div className="room-title">📍 {roomName}</div>
                              <div className="showtimes-grid">
                                {roomShowtimes.map(st => (
                                  <button
                                    key={st.id}
                                    className={`showtime-btn ${selectedShowtime?.id === st.id ? 'active' : ''}`}
                                    onClick={() => handleSelectShowtime(st)}
                                  >
                                    {st.start_time}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* Bước 2: Chọn ghế ngồi */}
              {bookingStep === 2 && selectedShowtime && (
                <div>
                  <h3 style={{ marginBottom: '0.25rem', color: 'var(--accent-gold)' }}>Chọn Ghế Ngồi</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '2rem' }}>
                    Suất chiếu: <strong>{selectedShowtime.start_time}</strong> ngày <strong>{formatDateVN(selectedShowtime.show_date)}</strong> - Phòng: <strong>{selectedShowtime.room_name}</strong>
                  </p>

                  {/* Sơ đồ màn hình */}
                  <div className="screen-container">
                    <div className="screen-line"></div>
                    <div className="screen-text">MÀN HÌNH CHÍNH</div>
                  </div>

                  {/* Sơ đồ ghế */}
                  <div className="seat-map-wrapper">
                    <div className="seat-grid">
                      {rows.map(row => (
                        <div key={row} className="seat-row">
                          <div className="row-label">{row}</div>
                          {columns.map(col => {
                            const seatNumber = `${row}${col}`;
                            const isOccupied = occupiedSeats.includes(seatNumber);
                            const isSelected = selectedSeats.includes(seatNumber);

                            let seatClass = 'available';
                            if (isOccupied) seatClass = 'occupied';
                            else if (isSelected) seatClass = 'selected';

                            const isVip = row === 'C' || row === 'D';
                            return (
                              <button
                                key={seatNumber}
                                className={`seat-item ${seatClass} ${isVip ? 'vip-seat' : ''}`}
                                disabled={isOccupied}
                                onClick={() => handleSeatClick(seatNumber)}
                                title={isOccupied ? `Ghế ${seatNumber} đã được đặt` : `${isVip ? 'Ghế VIP' : 'Ghế'} ${seatNumber}`}
                              >
                                {col}
                              </button>
                            );
                          })}
                          <div className="row-label">{row}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chú thích ghế */}
                  <div className="legend-container">
                    <div className="legend-item">
                      <div className="legend-color" style={{ background: 'var(--seat-empty)', border: '1px solid rgba(255,255,255,0.1)' }}></div>
                      <span>Còn trống</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ border: '1px solid var(--accent-yellow)', background: 'transparent' }}></div>
                      <span>Ghế VIP</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ background: 'var(--seat-selected)' }}></div>
                      <span>Đang chọn</span>
                    </div>
                    <div className="legend-item">
                      <div className="legend-color" style={{ background: 'var(--seat-occupied)' }}></div>
                      <span>Đã có người đặt</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Cột phải: Tóm tắt đơn hàng & Checkout */}
            <div className="glass-panel checkout-card" style={{ padding: '1.5rem' }}>
              <h3 className="checkout-title">🧾 Tóm tắt đơn vé</h3>
              
              <div className="checkout-details-list">
                <div className="checkout-detail-item">
                  <span>Phim:</span>
                  <span>{selectedMovie?.title}</span>
                </div>
                <div className="checkout-detail-item">
                  <span>Thời lượng:</span>
                  <span>{selectedMovie?.duration} phút</span>
                </div>

                {selectedShowtime && (
                  <>
                    <div className="checkout-detail-item">
                      <span>Phòng chiếu:</span>
                      <span>{selectedShowtime.room_name}</span>
                    </div>
                    <div className="checkout-detail-item">
                      <span>Ngày chiếu:</span>
                      <span>{formatDateVN(selectedShowtime.show_date)}</span>
                    </div>
                    <div className="checkout-detail-item">
                      <span>Suất chiếu:</span>
                      <span>{selectedShowtime.start_time}</span>
                    </div>
                    <div className="checkout-detail-item">
                      <span>Đơn giá vé:</span>
                      <span>{formatVND(selectedShowtime.ticket_price)}</span>
                    </div>
                  </>
                )}

                {bookingStep === 2 && (
                  <div className="checkout-detail-item">
                    <span>Ghế đã chọn:</span>
                    <span style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>
                      {selectedSeats.length > 0 ? selectedSeats.join(', ') : 'Chưa chọn ghế'}
                    </span>
                  </div>
                )}
              </div>

              {selectedShowtime && (
                <div className="total-price-row">
                  <span>TỔNG TIỀN:</span>
                  <span className="price-val">
                    {formatVND(selectedShowtime.ticket_price * selectedSeats.length)}
                  </span>
                </div>
              )}

              {/* Form khách hàng (chỉ hiển thị ở Bước 2 khi đã chọn ghế) */}
              {bookingStep === 2 && selectedSeats.length > 0 && (
                <form onSubmit={handleSubmitBooking} className="booking-form">
                  <div className="form-group">
                    <label>Họ và Tên khách hàng *</label>
                    <input
                      type="text"
                      required
                      placeholder="Nguyễn Văn A"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="form-group">
                    <label>Số điện thoại *</label>
                    <input
                      type="tel"
                      required
                      placeholder="09xx xxx xxx"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div className="form-group">
                    <label>Địa chỉ Email *</label>
                    <input
                      type="email"
                      required
                      placeholder="customer@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="input-field"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || selectedSeats.length === 0}
                    className="btn-confirm-checkout"
                  >
                    {loading ? 'Đang xử lý đặt vé...' : 'Confirm & Đặt Vé 🎟️'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 3. MÀN HÌNH BÁO ĐẶT VÉ THÀNH CÔNG */}
      {bookingStep === 3 && successBooking && (
        <div className="glass-panel booking-success-container">
          <div className="success-icon-check">✅</div>
          <h2 className="booking-success-title">Đặt Vé Thành Công!</h2>
          <p className="booking-success-desc">
            Cảm ơn quý khách <strong>{successBooking.customer_name}</strong> đã đặt vé xem phim tại Cine Cinema.
          </p>

          <div style={{ maxWidth: '400px', margin: '0 auto 2rem auto', textAlign: 'left' }} className="modal-detail-list">
            <div className="modal-detail-item">
              <span>Mã hóa đơn:</span>
              <strong>#{successBooking.id}</strong>
            </div>
            <div className="modal-detail-item">
              <span>Phim chiếu:</span>
              <strong>{selectedMovie?.title}</strong>
            </div>
            <div className="modal-detail-item">
              <span>Suất chiếu:</span>
              <strong>{selectedShowtime?.start_time} | {formatDateVN(selectedShowtime?.show_date)}</strong>
            </div>
            <div className="modal-detail-item">
              <span>Phòng chiếu:</span>
              <strong>{selectedShowtime?.room_name}</strong>
            </div>
            <div className="modal-detail-item">
              <span>Số ghế đặt:</span>
              <strong style={{ color: 'var(--accent-gold)' }}>{successBooking.seat_list}</strong>
            </div>
            <div className="modal-detail-item">
              <span>Trạng thái vé:</span>
              <span className="status-badge pending">{successBooking.status}</span>
            </div>
            <div className="modal-detail-item" style={{ borderTop: '1px dashed rgba(255,255,255,0.1)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
              <span>Tổng thanh toán:</span>
              <strong style={{ color: 'var(--accent-gold)', fontSize: '1.2rem' }}>{formatVND(successBooking.total_price)}</strong>
            </div>
          </div>

          <button onClick={handleBack} className="btn-admin-action primary" style={{ margin: '0 auto' }}>
            Quay lại trang chủ mua vé
          </button>
        </div>
      )}
    </div>
  );
}
