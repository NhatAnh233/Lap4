import React, { useState, useEffect } from 'react';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('movies'); // 'movies', 'genres', 'showtimes', 'bookings'

  // Data states
  const [movies, setMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [showtimes, setShowtimes] = useState([]);
  const [bookings, setBookings] = useState([]);

  // Loading and alerts
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState(null); // { type: 'success'|'error', message: '' }

  // Modals state
  const [showMovieModal, setShowMovieModal] = useState(false);
  const [editingMovie, setEditingMovie] = useState(null); // null if adding, movie object if editing

  const [showGenreModal, setShowGenreModal] = useState(false);
  const [editingGenre, setEditingGenre] = useState(null);

  const [showShowtimeModal, setShowShowtimeModal] = useState(false);

  const [selectedBookingDetails, setSelectedBookingDetails] = useState(null); // for showing seats detail modal

  // Forms state
  const [movieForm, setMovieForm] = useState({
    title: '', duration: '', description: '', image_url: '', genre_id: '', status: 'Đang chiếu'
  });
  const [genreForm, setGenreForm] = useState({ name: '' });
  const [showtimeForm, setShowtimeForm] = useState({
    movie_id: '', room_name: 'Phòng 01', show_date: '', start_time: '', ticket_price: '80000'
  });

  // Fetch initial data
  useEffect(() => {
    fetchMovies();
    fetchGenres();
    fetchShowtimes();
    fetchBookings();
  }, []);

  const triggerAlert = (type, message) => {
    setAlert({ type, message });
    setTimeout(() => {
      setAlert(null);
    }, 5000);
  };

  // ==========================================
  // API FETCH CALLS
  // ==========================================
  const fetchMovies = async () => {
    try {
      const res = await fetch('/api/movies');
      const data = await res.json();
      setMovies(data);
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Không thể tải danh sách phim.');
    }
  };

  const fetchGenres = async () => {
    try {
      const res = await fetch('/api/genres');
      const data = await res.json();
      setGenres(data);
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Không thể tải danh sách thể loại.');
    }
  };

  const fetchShowtimes = async () => {
    try {
      const res = await fetch('/api/showtimes');
      const data = await res.json();
      setShowtimes(data);
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Không thể tải danh sách suất chiếu.');
    }
  };

  const fetchBookings = async () => {
    try {
      const res = await fetch('/api/bookings');
      const data = await res.json();
      setBookings(data);
    } catch (err) {
      console.error(err);
      triggerAlert('error', 'Không thể tải danh sách hóa đơn.');
    }
  };

  // ==========================================
  // MOVIE CRUD ACTIONS
  // ==========================================
  const handleOpenAddMovie = () => {
    setEditingMovie(null);
    setMovieForm({
      title: '', duration: '', description: '', image_url: '', 
      genre_id: genres.length > 0 ? genres[0].id : '', status: 'Đang chiếu'
    });
    setShowMovieModal(true);
  };

  const handleOpenEditMovie = (movie) => {
    setEditingMovie(movie);
    setMovieForm({
      title: movie.title,
      duration: movie.duration,
      description: movie.description || '',
      image_url: movie.image_url || '',
      genre_id: movie.genre_id,
      status: movie.status
    });
    setShowMovieModal(true);
  };

  const handleSaveMovie = async (e) => {
    e.preventDefault();
    const url = editingMovie ? `/api/movies/${editingMovie.id}` : '/api/movies';
    const method = editingMovie ? 'PUT' : 'POST';

    try {
      setLoading(true);
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(movieForm)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Lỗi khi lưu thông tin phim.');

      triggerAlert('success', editingMovie ? 'Đã sửa thông tin phim thành công!' : 'Đã thêm phim mới thành công!');
      setShowMovieModal(false);
      fetchMovies();
      fetchShowtimes(); // phim sửa/tải lại làm mới lịch chiếu
    } catch (err) {
      triggerAlert('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMovie = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa phim này không?')) return;
    try {
      const res = await fetch(`/api/movies/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Lỗi khi xóa phim.');

      triggerAlert('success', 'Đã xóa phim thành công.');
      fetchMovies();
    } catch (err) {
      triggerAlert('error', err.message);
    }
  };

  // ==========================================
  // GENRE CRUD ACTIONS
  // ==========================================
  const handleOpenAddGenre = () => {
    setEditingGenre(null);
    setGenreForm({ name: '' });
    setShowGenreModal(true);
  };

  const handleOpenEditGenre = (genre) => {
    setEditingGenre(genre);
    setGenreForm({ name: genre.name });
    setShowGenreModal(true);
  };

  const handleSaveGenre = async (e) => {
    e.preventDefault();
    const url = editingGenre ? `/api/genres/${editingGenre.id}` : '/api/genres';
    const method = editingGenre ? 'PUT' : 'POST';

    try {
      setLoading(true);
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(genreForm)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Lỗi khi lưu thể loại.');

      triggerAlert('success', editingGenre ? 'Đã sửa thể loại thành công!' : 'Đã thêm thể loại mới thành công!');
      setShowGenreModal(false);
      fetchGenres();
      fetchMovies(); // reload movies to show updated genre name
    } catch (err) {
      triggerAlert('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGenre = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa thể loại này không?')) return;
    try {
      const res = await fetch(`/api/genres/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Lỗi khi xóa thể loại.');

      triggerAlert('success', 'Đã xóa thể loại thành công.');
      fetchGenres();
    } catch (err) {
      triggerAlert('error', err.message);
    }
  };

  // ==========================================
  // SHOWTIME ACTIONS & CONFLICT UI
  // ==========================================
  const handleOpenAddShowtime = () => {
    setShowtimeForm({
      movie_id: movies.length > 0 ? movies[0].id : '',
      room_name: 'Phòng 01',
      show_date: new Date().toISOString().split('T')[0],
      start_time: '09:00',
      ticket_price: '85000'
    });
    setShowShowtimeModal(true);
  };

  const handleSaveShowtime = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await fetch('/api/showtimes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(showtimeForm)
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Lỗi khi xếp lịch chiếu.');

      triggerAlert('success', 'Đã xếp lịch chiếu thành công!');
      setShowShowtimeModal(false);
      fetchShowtimes();
    } catch (err) {
      // Hiển thị lỗi đè lịch trực quan từ server trả về
      triggerAlert('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteShowtime = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa suất chiếu này không?')) return;
    try {
      const res = await fetch(`/api/showtimes/${id}`, { method: 'DELETE' });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Lỗi khi xóa suất chiếu.');

      triggerAlert('success', 'Đã xóa suất chiếu thành công.');
      fetchShowtimes();
    } catch (err) {
      triggerAlert('error', err.message);
    }
  };

  // ==========================================
  // BOOKINGS (TICKET MANAGEMENT)
  // ==========================================
  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'Lỗi cập nhật trạng thái đơn vé.');

      triggerAlert('success', `Đã cập nhật trạng thái hóa đơn #${bookingId} thành "${newStatus}".`);
      fetchBookings();
    } catch (err) {
      triggerAlert('error', err.message);
    }
  };

  // Helper functions
  const formatVND = (price) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price);
  };

  const formatDateVN = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const totalRevenue = bookings
    .filter(b => b.status === 'Đã thanh toán')
    .reduce((sum, b) => sum + b.total_price, 0);

  const pendingRevenue = bookings
    .filter(b => b.status === 'Chờ thanh toán')
    .reduce((sum, b) => sum + b.total_price, 0);

  const totalTickets = bookings
    .filter(b => b.status !== 'Đã hủy')
    .reduce((sum, b) => {
      const count = b.seat_list ? b.seat_list.split(',').length : 0;
      return sum + count;
    }, 0);

  const activeShowtimesCount = showtimes.length;

  return (
    <div className="admin-dashboard">
      <div className="admin-layout">
        
        {/* SIDEBAR TABS MENU */}
        <div className="glass-panel admin-sidebar-menu" style={{ padding: '1rem' }}>
          <div 
            className={`admin-menu-item ${activeTab === 'movies' ? 'active' : ''}`}
            onClick={() => setActiveTab('movies')}
          >
            <span>🎬</span> Phim
          </div>
          <div 
            className={`admin-menu-item ${activeTab === 'genres' ? 'active' : ''}`}
            onClick={() => setActiveTab('genres')}
          >
            <span>🏷️</span> Thể Loại
          </div>
          <div 
            className={`admin-menu-item ${activeTab === 'showtimes' ? 'active' : ''}`}
            onClick={() => setActiveTab('showtimes')}
          >
            <span>📅</span> Suất Chiếu
          </div>
          <div 
            className={`admin-menu-item ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
          >
            <span>🧾</span> Đơn Đặt Vé
          </div>
        </div>

        {/* CONTENT PANEL */}
        <div className="glass-panel admin-card">
          {alert && (
            <div className={`alert-banner ${alert.type}`}>
              <span>{alert.type === 'success' ? '✅' : '⚠️'}</span>
              <div>{alert.message}</div>
            </div>
          )}

          {/* STATS WIDGET ROW */}
          <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
            <div className="glass-panel stat-card" style={{ padding: '1rem', borderLeft: '4px solid var(--accent-cyan)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>TỔNG DOANH THU</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--accent-cyan)', textShadow: '0 0 5px var(--accent-cyan-glow)' }}>{formatVND(totalRevenue)}</div>
            </div>
            <div className="glass-panel stat-card" style={{ padding: '1rem', borderLeft: '4px solid var(--accent-yellow)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>DOANH THU CHỜ</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--accent-yellow)', textShadow: '0 0 5px var(--accent-yellow-glow)' }}>{formatVND(pendingRevenue)}</div>
            </div>
            <div className="glass-panel stat-card" style={{ padding: '1rem', borderLeft: '4px solid var(--accent-pink)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>VÉ ĐÃ BÁN (GHẾ)</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: 'var(--accent-pink)', textShadow: '0 0 5px var(--accent-pink-glow)' }}>{totalTickets} ghế</div>
            </div>
            <div className="glass-panel stat-card" style={{ padding: '1rem', borderLeft: '4px solid #fff' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>SUẤT CHIẾU HOẠT ĐỘNG</div>
              <div style={{ fontSize: '1.3rem', fontWeight: 'bold', color: '#fff' }}>{activeShowtimesCount} suất</div>
            </div>
          </div>

          {/* TAB 1: PHIM */}
          {activeTab === 'movies' && (
            <div>
              <div className="admin-section-header">
                <h2>Quản lý danh sách Phim</h2>
                <button onClick={handleOpenAddMovie} className="btn-admin-action primary">
                  ➕ Thêm Phim Mới
                </button>
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Ảnh bìa</th>
                      <th>Tên phim</th>
                      <th>Thể loại</th>
                      <th>Thời lượng</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {movies.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có bộ phim nào trên hệ thống.</td>
                      </tr>
                    ) : (
                      movies.map(m => (
                        <tr key={m.id}>
                          <td>
                            <img 
                              src={m.image_url || 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=100&q=80'} 
                              className="thumbnail-col"
                              alt={m.title}
                              onError={(e) => {
                                e.target.src = 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?auto=format&fit=crop&w=100&q=80';
                              }}
                            />
                          </td>
                          <td style={{ fontWeight: 'bold' }}>{m.title}</td>
                          <td>{m.genre_name || 'Khác'}</td>
                          <td>⏱️ {m.duration} phút</td>
                          <td>
                            <span className={`status-badge ${m.status === 'Đang chiếu' ? 'paid' : 'pending'}`}>
                              {m.status}
                            </span>
                          </td>
                          <td className="actions-cell">
                            <button onClick={() => handleOpenEditMovie(m)} className="btn-icon edit" title="Sửa">✏️</button>
                            <button onClick={() => handleDeleteMovie(m.id)} className="btn-icon delete" title="Xóa">🗑️</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: THỂ LOẠI */}
          {activeTab === 'genres' && (
            <div>
              <div className="admin-section-header">
                <h2>Danh mục Thể loại</h2>
                <button onClick={handleOpenAddGenre} className="btn-admin-action primary">
                  ➕ Thêm Thể Loại
                </button>
              </div>

              <div className="table-container" style={{ maxWidth: '600px' }}>
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th style={{ width: '100px' }}>Mã loại</th>
                      <th>Tên thể loại</th>
                      <th style={{ width: '150px' }}>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {genres.length === 0 ? (
                      <tr>
                        <td colSpan="3" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có thể loại nào được tạo.</td>
                      </tr>
                    ) : (
                      genres.map(g => (
                        <tr key={g.id}>
                          <td>#{g.id}</td>
                          <td style={{ fontWeight: '600' }}>{g.name}</td>
                          <td className="actions-cell">
                            <button onClick={() => handleOpenEditGenre(g)} className="btn-icon edit" title="Sửa">✏️</button>
                            <button onClick={() => handleDeleteGenre(g.id)} className="btn-icon delete" title="Xóa">🗑️</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: SUẤT CHIẾU */}
          {activeTab === 'showtimes' && (
            <div>
              <div className="admin-section-header">
                <h2>Quản lý Lịch chiếu phim</h2>
                <button onClick={handleOpenAddShowtime} className="btn-admin-action primary" disabled={movies.length === 0}>
                  ➕ Lên lịch suất chiếu
                </button>
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Phim</th>
                      <th>Phòng chiếu</th>
                      <th>Ngày chiếu</th>
                      <th>Giờ chiếu</th>
                      <th>Đơn giá vé</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {showtimes.length === 0 ? (
                      <tr>
                        <td colSpan="6" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có suất chiếu nào được lên lịch.</td>
                      </tr>
                    ) : (
                      showtimes.map(s => (
                        <tr key={s.id}>
                          <td style={{ fontWeight: 'bold' }}>{s.movie_title}</td>
                          <td>📍 {s.room_name}</td>
                          <td>📅 {formatDateVN(s.show_date)}</td>
                          <td>⏱️ {s.start_time}</td>
                          <td style={{ color: 'var(--accent-gold)', fontWeight: '600' }}>{formatVND(s.ticket_price)}</td>
                          <td className="actions-cell">
                            <button onClick={() => handleDeleteShowtime(s.id)} className="btn-icon delete" title="Hủy suất chiếu">🗑️</button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: ĐƠN ĐẶT VÉ (HÓA ĐƠN TICKET) */}
          {activeTab === 'bookings' && (
            <div>
              <div className="admin-section-header">
                <h2>Quản lý đặt vé & Hóa đơn</h2>
              </div>

              <div className="table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Mã đơn</th>
                      <th>Khách hàng</th>
                      <th>Phim</th>
                      <th>Suất chiếu</th>
                      <th>Số ghế</th>
                      <th>Tổng tiền</th>
                      <th>Trạng thái</th>
                      <th>Hành động</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Chưa có lịch sử đặt vé nào.</td>
                      </tr>
                    ) : (
                      bookings.map(b => (
                        <tr key={b.id}>
                          <td><strong>#{b.id}</strong></td>
                          <td>
                            <div>{b.customer_name}</div>
                            <small style={{ color: 'var(--text-secondary)' }}>📱 {b.phone}</small>
                          </td>
                          <td>{b.movie_title}</td>
                          <td>
                            <div>📍 {b.room_name}</div>
                            <small style={{ color: 'var(--text-secondary)' }}>{formatDateVN(b.show_date)} | {b.start_time}</small>
                          </td>
                          <td style={{ color: 'var(--accent-gold)', fontWeight: 'bold' }}>{b.seat_list}</td>
                          <td style={{ fontWeight: '600' }}>{formatVND(b.total_price)}</td>
                          <td>
                            <select
                              value={b.status}
                              onChange={(e) => handleUpdateBookingStatus(b.id, e.target.value)}
                              className={`status-select ${
                                b.status === 'Chờ thanh toán' ? 'status-badge pending' :
                                b.status === 'Đã thanh toán' ? 'status-badge paid' : 'status-badge cancelled'
                              }`}
                              style={{ border: 'none', padding: '6px 10px' }}
                            >
                              <option value="Chờ thanh toán">Chờ thanh toán</option>
                              <option value="Đã thanh toán">Đã thanh toán</option>
                              <option value="Đã hủy">Đã hủy</option>
                            </select>
                          </td>
                          <td>
                            <button 
                              onClick={() => setSelectedBookingDetails(b)} 
                              className="btn-admin-action"
                              style={{ padding: '4px 8px', fontSize: '0.85rem' }}
                            >
                              Chi tiết
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ==========================================
      MODALS DIALOG
      ========================================== */}
      
      {/* 1. MOVIE DIALOG */}
      {showMovieModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <button className="modal-close-btn" onClick={() => setShowMovieModal(false)}>✖</button>
            <h3 className="modal-title">{editingMovie ? '✏️ Cập nhật thông tin Phim' : '🎬 Thêm phim mới'}</h3>
            
            <form onSubmit={handleSaveMovie} className="modal-form">
              <div className="form-group">
                <label>Tên phim *</label>
                <input
                  type="text"
                  required
                  placeholder="Nhập tên phim..."
                  value={movieForm.title}
                  onChange={(e) => setMovieForm({ ...movieForm, title: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Thời lượng (phút) *</label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="Ví dụ: 120"
                    value={movieForm.duration}
                    onChange={(e) => setMovieForm({ ...movieForm, duration: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label>Thể loại *</label>
                  <select
                    value={movieForm.genre_id}
                    required
                    onChange={(e) => setMovieForm({ ...movieForm, genre_id: e.target.value })}
                    className="input-field"
                  >
                    {genres.map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Trạng thái phát hành</label>
                <select
                  value={movieForm.status}
                  onChange={(e) => setMovieForm({ ...movieForm, status: e.target.value })}
                  className="input-field"
                >
                  <option value="Đang chiếu">Đang chiếu</option>
                  <option value="Sắp chiếu">Sắp chiếu</option>
                </select>
              </div>

              <div className="form-group">
                <label>URL Hình ảnh (Bìa Poster)</label>
                <input
                  type="url"
                  placeholder="https://example.com/poster.jpg"
                  value={movieForm.image_url}
                  onChange={(e) => setMovieForm({ ...movieForm, image_url: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Mô tả nội dung</label>
                <textarea
                  placeholder="Mô tả tóm tắt nội dung phim..."
                  value={movieForm.description}
                  onChange={(e) => setMovieForm({ ...movieForm, description: e.target.value })}
                  className="input-field"
                  rows="3"
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowMovieModal(false)} className="btn-admin-action">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={loading} className="btn-admin-action primary">
                  {loading ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. GENRE DIALOG */}
      {showGenreModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content" style={{ maxWidth: '400px' }}>
            <button className="modal-close-btn" onClick={() => setShowGenreModal(false)}>✖</button>
            <h3 className="modal-title">{editingGenre ? '✏️ Đổi tên Thể loại' : '🏷️ Thêm Thể loại mới'}</h3>
            
            <form onSubmit={handleSaveGenre} className="modal-form">
              <div className="form-group">
                <label>Tên thể loại *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Khoa học viễn tưởng"
                  value={genreForm.name}
                  onChange={(e) => setGenreForm({ name: e.target.value })}
                  className="input-field"
                />
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowGenreModal(false)} className="btn-admin-action">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={loading} className="btn-admin-action primary">
                  {loading ? 'Đang lưu...' : 'Lưu lại'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. SHOWTIME DIALOG */}
      {showShowtimeModal && (
        <div className="modal-overlay">
          <div className="glass-panel modal-content">
            <button className="modal-close-btn" onClick={() => setShowShowtimeModal(false)}>✖</button>
            <h3 className="modal-title">📅 Xếp lịch chiếu mới</h3>
            
            <form onSubmit={handleSaveShowtime} className="modal-form">
              <div className="form-group">
                <label>Chọn phim chiếu *</label>
                <select
                  value={showtimeForm.movie_id}
                  required
                  onChange={(e) => setShowtimeForm({ ...showtimeForm, movie_id: e.target.value })}
                  className="input-field"
                >
                  {movies.map(m => (
                    <option key={m.id} value={m.id}>{m.title} ({m.duration} phút)</option>
                  ))}
                </select>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Chọn phòng chiếu *</label>
                  <select
                    value={showtimeForm.room_name}
                    required
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, room_name: e.target.value })}
                    className="input-field"
                  >
                    <option value="Phòng 01">Phòng 01</option>
                    <option value="Phòng 02">Phòng 02</option>
                    <option value="Phòng 03">Phòng 03</option>
                    <option value="Phòng 04">Phòng 04</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Giá vé (VND) *</label>
                  <input
                    type="number"
                    required
                    min="1000"
                    step="5000"
                    placeholder="Ví dụ: 80000"
                    value={showtimeForm.ticket_price}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, ticket_price: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label>Ngày chiếu *</label>
                  <input
                    type="date"
                    required
                    value={showtimeForm.show_date}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, show_date: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div className="form-group">
                  <label>Giờ bắt đầu *</label>
                  <input
                    type="time"
                    required
                    value={showtimeForm.start_time}
                    onChange={(e) => setShowtimeForm({ ...showtimeForm, start_time: e.target.value })}
                    className="input-field"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={() => setShowShowtimeModal(false)} className="btn-admin-action">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={loading} className="btn-admin-action primary">
                  {loading ? 'Đang tạo lịch...' : 'Thành lập lịch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. DETAIL TICKET BOOKING MODAL */}
      {selectedBookingDetails && (
        <div className="modal-overlay" onClick={() => setSelectedBookingDetails(null)}>
          <div className="glass-panel modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <button className="modal-close-btn" onClick={() => setSelectedBookingDetails(null)}>✖</button>
            <h3 className="modal-title">🎟️ Chi tiết hóa đơn vé #{selectedBookingDetails.id}</h3>
            
            <div className="modal-detail-list">
              <div className="modal-detail-item">
                <span>Tên khách hàng:</span>
                <strong>{selectedBookingDetails.customer_name}</strong>
              </div>
              <div className="modal-detail-item">
                <span>Số điện thoại:</span>
                <strong>{selectedBookingDetails.phone}</strong>
              </div>
              <div className="modal-detail-item">
                <span>Địa chỉ Email:</span>
                <strong>{selectedBookingDetails.email}</strong>
              </div>
              <div className="modal-detail-item" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span>Phim đặt vé:</span>
                <strong>{selectedBookingDetails.movie_title}</strong>
              </div>
              <div className="modal-detail-item">
                <span>Khung giờ:</span>
                <strong>{selectedBookingDetails.start_time} ngày {formatDateVN(selectedBookingDetails.show_date)}</strong>
              </div>
              <div className="modal-detail-item">
                <span>Phòng chiếu:</span>
                <strong>{selectedBookingDetails.room_name}</strong>
              </div>
              <div className="modal-detail-item">
                <span>Danh sách ghế đặt:</span>
                <strong style={{ color: 'var(--accent-gold)', fontSize: '1.1rem' }}>{selectedBookingDetails.seat_list}</strong>
              </div>
              <div className="modal-detail-item" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '0.5rem', marginTop: '0.5rem' }}>
                <span>Trạng thái:</span>
                <span className={`status-badge ${
                  selectedBookingDetails.status === 'Chờ thanh toán' ? 'pending' :
                  selectedBookingDetails.status === 'Đã thanh toán' ? 'paid' : 'cancelled'
                }`}>
                  {selectedBookingDetails.status}
                </span>
              </div>
              <div className="modal-detail-item">
                <span>Tổng giá trị đơn:</span>
                <strong style={{ color: 'var(--accent-gold)', fontSize: '1.25rem' }}>{formatVND(selectedBookingDetails.total_price)}</strong>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
              <button onClick={() => setSelectedBookingDetails(null)} className="btn-admin-action primary" style={{ width: '100%' }}>
                Đóng lại
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
