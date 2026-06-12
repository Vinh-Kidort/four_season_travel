import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from '../api/axios';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

function RevenuePage() {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [filterType, setFilterType] = useState('month'); 

  const [data, setData] = useState({
    totalRevenue: 0,
    totalBookings: 0,
    pendingBookings: 0,
    chartData: [],
    topTours: []
  });
  const [loading, setLoading] = useState(true);
  const [showPendingModal, setShowPendingModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    axios.get(`/revenue/dashboard?year=${selectedYear}&type=${filterType}`)
      .then(res => {
        setData(res.data);
        setLoading(false);
      })
      .catch(err => {
        console.log("Lỗi tải dữ liệu", err);
        setLoading(false);
      });
  }, [selectedYear, filterType]);

  const years = Array.from(new Array(5), (val, index) => currentYear - index);

  if (localStorage.getItem('userRole') !== 'ADMIN') {
    return <div className="text-center py-20 text-red-500 font-bold text-2xl">🚨 Bạn không có quyền truy cập!</div>;
  }

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 shadow-lg rounded-lg">
          <p className="font-bold text-gray-800">{label}</p>
          <p className="text-blue-600 font-bold">
            Doanh thu: {payload[0].value.toLocaleString('vi-VN')} đ
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 min-h-[70vh]">
      {/* HEADER & BỘ LỌC */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-yellow-700">💰 Báo cáo Doanh thu (Tiền Cọc)</h1>
          <p className="text-gray-500 mt-2">Thống kê dữ liệu thanh toán thực tế của hệ thống.</p>
        </div>
        
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border border-gray-200">
          <select 
            value={selectedYear} 
            onChange={e => setSelectedYear(e.target.value)}
            className="border-none font-bold text-gray-700 focus:ring-0 cursor-pointer bg-transparent outline-none"
          >
            {years.map(y => <option key={y} value={y}>Năm {y}</option>)}
          </select>
          
          <div className="h-6 w-px bg-gray-300"></div>
          
          <select 
            value={filterType} 
            onChange={e => setFilterType(e.target.value)}
            className="border-none font-bold text-blue-600 focus:ring-0 cursor-pointer bg-transparent outline-none"
          >
            <option value="month">Theo Tháng</option>
            <option value="quarter">Theo Quý</option>
          </select>
        </div>
      </div>

      {/* TÁCH LOADING RA KHỎI VIỆC ẨN GIAO DIỆN CHÍNH */}
      {/* Bao toàn bộ giao diện bằng div tương đối (relative) và thêm lớp mờ nếu loading */}
      <div className={`transition-opacity duration-300 relative ${loading ? 'opacity-50' : 'opacity-100'}`}>
        
        {/* ICON TẢI DỮ LIỆU CHẠY NỔI LÊN TRÊN KHI LOADING */}
        {loading && (
          <div className="absolute inset-0 z-10 flex items-center justify-center">
             <span className="bg-white/80 p-4 rounded-xl shadow-lg font-bold text-blue-600 flex items-center gap-2 backdrop-blur-sm">
                <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý số liệu...
             </span>
          </div>
        )}

        {/* CÁC THẺ TÓM TẮT THÔNG KÊ */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 border-l-4 border-green-500">
            <div className="bg-green-100 text-green-600 w-14 h-14 rounded-full flex items-center justify-center text-2xl">💵</div>
            <div>
              <p className="text-gray-500 text-sm font-bold uppercase">Tổng Tiền Cọc Nhận Được</p>
              <h3 className="text-2xl font-bold text-green-700">{data.totalRevenue?.toLocaleString('vi-VN')} đ</h3>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 border-l-4 border-blue-500">
            <div className="bg-blue-100 text-blue-600 w-14 h-14 rounded-full flex items-center justify-center text-2xl">🎟️</div>
            <div>
              <p className="text-gray-500 text-sm font-bold uppercase">Tổng Số Booking Đã Cọc</p>
              <h3 className="text-2xl font-bold text-blue-700">{data.totalBookings} Lượt</h3>
            </div>
          </div>

          <div 
            onClick={() => setShowPendingModal(true)}
            className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 flex items-center gap-4 border-l-4 border-yellow-500 cursor-pointer hover:shadow-md hover:bg-yellow-50 transition">
            <div className="bg-yellow-100 text-yellow-600 w-14 h-14 rounded-full flex items-center justify-center text-2xl">⏳</div>
            <div>
              <p className="text-gray-500 text-sm font-bold uppercase">Đơn Hàng Chưa Thanh Toán</p>
              <h3 className="text-2xl font-bold text-yellow-700">
                {data.pendingBookingsList ? data.pendingBookingsList.length : 0} Đơn <span className="text-sm font-normal text-gray-500">(Xem)</span>
              </h3>
            </div>
          </div>
        </div>

        {/* KHUNG BIỂU ĐỒ VÀ BẢNG TOP TOUR */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* CỘT 1: BIỂU ĐỒ */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-800">
                  Biểu đồ Doanh thu {filterType === 'month' ? 'các Tháng' : 'các Quý'} năm {selectedYear}
                </h2>
                <p className="text-gray-400 text-xs mt-1">
                  Tính theo ngày khởi hành của tour
                </p>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} margin={{ top: 10, right: 10, left: 20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                  <XAxis 
                    dataKey="name" 
                    axisLine={false} 
                    tickLine={false} 
                    interval={0} 
                    tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }} 
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: '#6B7280', fontSize: 12 }} 
                    tickFormatter={(value) => value >= 1000000 ? `${value / 1000000}M` : value}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{fill: '#F3F4F6'}} isAnimationActive={false} />
                  <Bar dataKey="revenue" fill="#3B82F6" radius={[4, 4, 0, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CỘT 2: TOP TOUR BÁN CHẠY */}
          <div className="lg:col-span-1 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
            <h2 className="text-xl font-bold text-gray-800 mb-6">🏆 Top 5 Tour Doanh Thu Cao</h2>
            
            {data.topTours.length === 0 ? (
              <p className="text-gray-500 text-center py-10 border border-dashed rounded-lg">Chưa có dữ liệu giao dịch.</p>
            ) : (
              <div className="space-y-5">
                {data.topTours.map((tour, index) => (
                  <div key={index} className="flex items-center gap-4 border-b border-gray-100 pb-4 last:border-0 last:pb-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm text-white flex-shrink-0 ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400'   :
                      index === 2 ? 'bg-orange-400' : 'bg-blue-200 text-blue-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="overflow-hidden flex-grow">
                      <h4 className="font-bold text-gray-800 text-sm truncate">{tour.tourName}</h4>
                      {tour.departureDate && (
                        <p className="text-gray-400 text-xs">📅 Khởi hành: {tour.departureDate}</p>
                      )}
                      <p className="text-green-600 font-bold text-sm mt-0.5">
                        {tour.revenue?.toLocaleString('vi-VN')} đ
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {showPendingModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[80vh] flex flex-col relative">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-yellow-50 rounded-t-xl">
              <h2 className="text-xl font-bold text-yellow-800">⏳ Chi tiết Đơn hàng chưa thanh toán</h2>
              <button onClick={() => setShowPendingModal(false)} className="text-gray-500 hover:text-red-500 text-3xl font-bold leading-none">&times;</button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              {!data.pendingBookingsList || data.pendingBookingsList.length === 0 ? (
                <p className="text-center text-gray-500 py-10">Tuyệt vời! Không có đơn hàng nào bị tồn đọng.</p>
              ) : (
                <div className="space-y-4">
                  {data.pendingBookingsList.map((order, idx) => (
                    <div key={idx} className="flex justify-between items-center p-4 border border-gray-200 rounded-lg hover:border-yellow-400">
                      <div>
                        <h4 className="font-bold text-gray-800 text-lg">{order.tourName}</h4>
                        <p className="text-sm text-gray-500">
                          Khách: <strong>{order.customerName}</strong>
                          {order.departureDate && (
                            <span className="ml-2 text-blue-500"> KH: {order.departureDate}</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500 uppercase font-bold">Tiền cọc cần thu</p>
                        <p className="font-bold text-yellow-600 text-lg">{order.amount?.toLocaleString('vi-VN')} đ</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default RevenuePage;