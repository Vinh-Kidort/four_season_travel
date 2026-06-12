import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams  } from 'react-router-dom';
import axios from '../api/axios';


const STEP = { FORM: 1, METHOD: 2, QR: 3, CARD: 4, EWALLET: 5, SUCCESS: 6 };
const AUTO_CONFIRM_SECONDS = 120;


// ── Chọn phương thức thanh toán ──────────────────────────────
function PaymentMethodStep({ onSelect, onBack }) {
  const [selected, setSelected] = useState(null);

  const methods = [
    {
      id: 'QR',
      icon: '📱',
      label: 'QR VietQR',
      desc: 'Quét mã QR — chuyển khoản ngân hàng',
      color: 'blue',
    },
    {
      id: 'CARD',
      icon: '💳',
      label: 'Thẻ tín dụng / ghi nợ',
      desc: 'Visa, Mastercard, JCB',
      color: 'indigo',
    },
    {
      id: 'EWALLET',
      icon: '🌐',
      label: 'Google Pay / PayPal',
      desc: 'Thanh toán qua ví điện tử quốc tế',
      color: 'green',
    },
  ];

  const colorMap = {
    blue:   { ring: 'ring-blue-400',   bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',   check: 'bg-blue-600' },
    indigo: { ring: 'ring-indigo-400', bg: 'bg-indigo-50', icon: 'bg-indigo-100 text-indigo-600', check: 'bg-indigo-600' },
    green:  { ring: 'ring-green-400',  bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',  check: 'bg-green-600' },
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="px-6 py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg">
            <span className="text-blue-600 text-lg">💳</span>
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-800">PAYMENT METHOD</h2>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span>🔒</span> ENCRYPTED & SECURE
            </p>
          </div>
        </div>
      </div>

      {/* Methods list */}
      <div className="p-4 space-y-3">
        {methods.map(m => {
          const c = colorMap[m.color];
          const isSelected = selected === m.id;
          return (
            <button
              key={m.id}
              onClick={() => setSelected(m.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all duration-200
                ${isSelected
                  ? `border-transparent ring-2 ${c.ring} ${c.bg}`
                  : 'border-gray-100 hover:border-gray-200 bg-white'
                }`}
            >
              {/* Icon */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg flex-shrink-0 ${c.icon}`}>
                {m.icon}
              </div>

              {/* Label */}
              <div className="text-left flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{m.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{m.desc}</p>
              </div>

              {/* Radio */}
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all
                ${isSelected ? `${c.check} border-transparent` : 'border-gray-300'}`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>

      {/* CTA — thêm nút quay lại */}
      <div className="px-4 pb-5 flex gap-3">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 bg-gray-100 text-gray-600 font-bold py-4 rounded-xl hover:bg-gray-200 transition">
          Quay lại
        </button>
        <button
          onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className={`flex-[2] py-4 rounded-xl font-bold text-white text-base transition-all duration-200
            ${selected
              ? 'bg-blue-600 hover:bg-blue-700 shadow-md hover:shadow-lg'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}>
          {selected ? 'PAY NOW →' : 'Chọn phương thức thanh toán'}
        </button>
      </div>
    </div>
  );
}

// ── Credit Card form ─────────────────────────────────────────
function CardPaymentStep({ depositAmount, bookingCode, onSuccess, onBack }) {
  const [form, setForm] = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  const formatCardNumber = (val) =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (val) =>
    val.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2');

  const handleChange = (e) => {
    const { name, value } = e.target;
    let v = value;
    if (name === 'number') v = formatCardNumber(value);
    if (name === 'expiry') v = formatExpiry(value);
    if (name === 'cvv')    v = value.replace(/\D/g, '').slice(0, 3);
    setForm(f => ({ ...f, [name]: v }));
    setErrors(er => ({ ...er, [name]: '' }));
  };

  const validate = () => {
    const e = {};
    if (form.number.replace(/\s/g, '').length < 16) e.number = 'Số thẻ phải đủ 16 chữ số';
    if (!form.name.trim()) e.name = 'Nhập tên chủ thẻ';
    if (form.expiry.length < 5) e.expiry = 'Nhập đúng định dạng MM/YY';
    if (form.cvv.length < 3)   e.cvv = 'CVV phải đủ 3 số';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    // Giả lập xử lý thẻ 2s
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    onSuccess();
  };

  // Detect card type
  const raw = form.number.replace(/\s/g, '');
  const cardType = raw.startsWith('4') ? 'VISA'
    : raw.startsWith('5') ? 'MC'
    : raw.startsWith('3') ? 'AMEX' : null;

  const cardTypeLabel = { VISA: '💙 Visa', MC: '🔴 Mastercard', AMEX: '🟦 Amex' };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-400 px-6 py-5 text-white">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-lg font-bold">💳 Thanh toán thẻ</h2>
          {cardType && <span className="text-sm bg-white/20 px-2 py-0.5 rounded">{cardTypeLabel[cardType]}</span>}
        </div>
        <p className="text-indigo-100 text-sm">
          Số tiền cọc: <strong>{depositAmount?.toLocaleString('vi-VN')}đ</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {/* Card number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Số thẻ</label>
          <div className="relative">
            <input
              name="number" value={form.number} onChange={handleChange}
              placeholder="0000 0000 0000 0000"
              className={`w-full border rounded-xl px-4 py-3 text-base font-mono tracking-widest
                focus:ring-2 focus:ring-indigo-400 outline-none transition
                ${errors.number ? 'border-red-400' : 'border-gray-200'}`}
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300 text-xl">💳</span>
          </div>
          {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
        </div>

        {/* Tên chủ thẻ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Tên chủ thẻ</label>
          <input
            name="name" value={form.name} onChange={handleChange}
            placeholder="NGUYEN VAN A"
            className={`w-full border rounded-xl px-4 py-3 uppercase tracking-wide
              focus:ring-2 focus:ring-indigo-400 outline-none transition
              ${errors.name ? 'border-red-400' : 'border-gray-200'}`}
          />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        {/* Expiry + CVV */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Ngày hết hạn</label>
            <input
              name="expiry" value={form.expiry} onChange={handleChange}
              placeholder="MM/YY"
              className={`w-full border rounded-xl px-4 py-3 text-center font-mono
                focus:ring-2 focus:ring-indigo-400 outline-none transition
                ${errors.expiry ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
            <input
              name="cvv" value={form.cvv} onChange={handleChange}
              placeholder="•••" type="password"
              className={`w-full border rounded-xl px-4 py-3 text-center font-mono
                focus:ring-2 focus:ring-indigo-400 outline-none transition
                ${errors.cvv ? 'border-red-400' : 'border-gray-200'}`}
            />
            {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
          </div>
        </div>

        {/* Mã booking */}
        <div className="bg-indigo-50 rounded-xl px-4 py-3 flex justify-between items-center text-sm">
          <span className="text-gray-500">Mã đặt tour</span>
          <span className="font-bold text-indigo-700 tracking-widest">{bookingCode}</span>
        </div>

        {/* Security note */}
        <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
          🔒 Thông tin thẻ được mã hóa SSL — không lưu trữ
        </p>

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onBack}
            className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition">
            Quay lại
          </button>
          <button type="submit" disabled={loading}
            className="flex-[2] bg-indigo-600 text-white font-bold py-3 rounded-xl
              hover:bg-indigo-700 disabled:opacity-60 transition flex items-center justify-center gap-2">
            {loading
              ? <><span className="animate-spin">⏳</span> Đang xử lý...</>
              : '✅ Thanh toán ngay'}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── Google Pay / PayPal ──────────────────────────────────────
function EWalletStep({ depositAmount, bookingCode, onSuccess, onBack }) {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading]   = useState(false);

  const wallets = [
    { id: 'GPAY',   label: 'Google Pay', icon: '🔵', color: 'blue',  desc: 'Thanh toán bằng tài khoản Google' },
    { id: 'PAYPAL', label: 'PayPal',     icon: '🟡', color: 'yellow', desc: 'Thanh toán qua PayPal' },
  ];

  const handlePay = async () => {
    if (!selected) return;
    setLoading(true);
    // Giả lập redirect + xử lý 2.5s
    await new Promise(r => setTimeout(r, 2500));
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-teal-500 px-6 py-5 text-white">
        <h2 className="text-lg font-bold">🌐 Ví điện tử quốc tế</h2>
        <p className="text-green-100 text-sm mt-0.5">
          Thanh toán cọc: <strong>{depositAmount?.toLocaleString('vi-VN')}đ</strong>
        </p>
      </div>

      <div className="p-6 space-y-4">
        {/* Wallet options */}
        <div className="space-y-3">
          {wallets.map(w => (
            <button key={w.id} onClick={() => setSelected(w.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all
                ${selected === w.id
                  ? 'border-green-400 bg-green-50 ring-2 ring-green-300'
                  : 'border-gray-100 hover:border-gray-200'}`}
            >
              <span className="text-3xl">{w.icon}</span>
              <div className="text-left flex-1">
                <p className="font-bold text-gray-800">{w.label}</p>
                <p className="text-xs text-gray-400">{w.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                ${selected === w.id ? 'bg-green-500 border-transparent' : 'border-gray-300'}`}>
                {selected === w.id && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>

        {/* Mã booking */}
        <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between items-center text-sm">
          <span className="text-gray-500">Mã đặt tour</span>
          <span className="font-bold text-green-700 tracking-widest">{bookingCode}</span>
        </div>

        {/* Redirect notice */}
        {selected && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-xs text-amber-700 flex gap-2">
            <span>ℹ️</span>
            <span>Bạn sẽ được chuyển đến trang <strong>{wallets.find(w=>w.id===selected)?.label}</strong> để xác nhận thanh toán, sau đó tự động quay lại.</span>
          </div>
        )}

        {/* Buttons */}
        <div className="flex gap-3 pt-1">
          <button onClick={onBack}
            className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 transition">
            Quay lại
          </button>
          <button onClick={handlePay} disabled={!selected || loading}
            className="flex-[2] bg-green-600 text-white font-bold py-3 rounded-xl
              hover:bg-green-700 disabled:opacity-50 transition flex items-center justify-center gap-2">
            {loading
              ? <><span className="animate-spin">⏳</span> Đang kết nối...</>
              : `Thanh toán qua ${selected ? wallets.find(w=>w.id===selected)?.label : '...'}`}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main BookingPage ─────────────────────────────────────────
function BookingPage() {
  const { tourId } = useParams();
  const navigate = useNavigate();

  const loggedInEmail = localStorage.getItem('userEmail') || '';
  const loggedInName  = localStorage.getItem('userName')  || '';
  
  const [phoneWarning, setPhoneWarning] = useState(false);

  const [tour,      setTour]      = useState(null);
  const [step,      setStep]      = useState(STEP.FORM);
  const [qrInfo,    setQrInfo]    = useState(null);
  const [loading,   setLoading]   = useState(false);
  const [qrError,   setQrError]   = useState(false);
  const [payMethod, setPayMethod] = useState(null); // 'QR' | 'CARD' | 'EWALLET'

  const [countdown,   setCountdown]   = useState(AUTO_CONFIRM_SECONDS);
  const [autoConfirm, setAutoConfirm] = useState(false);
  const timerRef = useRef(null);

  const [form, setForm] = useState({
    customerName:  loggedInName,
    customerEmail: loggedInEmail,
    customerPhone: '',
    numberOfPeople: 1,
  });

  const [searchParams]  = useSearchParams();
  const depId           = searchParams.get('depId');
  const [departure, setDeparture] = useState(null);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      alert('Vui lòng đăng nhập để Đặt Tour!');
      navigate('/login');
      return;
    }
    axios.get(`/tours/${tourId}`).then(res => setTour(res.data));
  }, [tourId, navigate]);

  useEffect(() => {
    if (step === STEP.QR) {
      setCountdown(AUTO_CONFIRM_SECONDS);
      setAutoConfirm(false);
      timerRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) { clearInterval(timerRef.current); setAutoConfirm(true); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerRef.current);
  }, [step]);

  useEffect(() => { if (autoConfirm) handleConfirmPayment(); }, [autoConfirm]);

  const [departures, setDepartures] = useState([]);

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/login'); return;
    }

    // Fetch phone từ profile
    axios.get('/users/me').then(res => {
      const phone = res.data?.phone || '';
      if (!phone) {
        setPhoneWarning(true);
      }
      setForm(prev => ({ ...prev, customerPhone: phone }));
    }).catch(() => {});

    axios.get(`/tours/${tourId}`).then(res => {
      setTour(res.data);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const activeDeps = (res.data.departures || []).filter(d => {
        if (d.status !== 'active') return false;
        const startDate = new Date(d.startDate);
        startDate.setHours(0, 0, 0, 0);
        return startDate >= today;
      });


      setDepartures(activeDeps);

      if (depId) {
        // Có depId từ URL → dùng luôn
        const dep = activeDeps.find(d => d.id === depId);
        if (dep) setDeparture(dep);
      } else if (activeDeps.length === 1) {
        // Chỉ 1 departure → tự chọn
        setDeparture(activeDeps[0]);
      }
      // Nhiều departure mà không có depId → hiện picker
    });
  }, [tourId, depId]);

  useEffect(() => {
    axios.get(`/tours/${tourId}`).then(res => {
      setTour(res.data);
      // Tìm departure được chọn
      if (depId && res.data.departures) {
        const dep = res.data.departures.find(d => d.id === depId);
        if (dep) setDeparture(dep);
      }
    });
  }, [tourId, depId]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  // Bước 1 → 2 (chọn phương thức)
  const handleGetQR = async (e) => {
    e.preventDefault();

    // ── Bắt buộc chọn ngày nếu có nhiều departure ────────────────
    if (departures.length > 1 && !departure) {
      alert('⚠️ Vui lòng chọn ngày khởi hành!');
      return;
    }

    setLoading(true);
    try {
      const res = await axios.get('/bookings/qr-info', {
        params: {
          tourId,
          numberOfPeople: parseInt(form.numberOfPeople),
          departureId: departure?.id || null,
        }
      });
      setQrInfo(res.data);
      setStep(STEP.METHOD);
    } catch (err) {
      alert('❌ ' + (err.response?.data || 'Thử lại nhé!'));
    }
    setLoading(false);
  };

  // Chọn phương thức → đi đến bước tương ứng
  const handleSelectMethod = (method) => {
    setPayMethod(method);
    if (method === 'QR')      setStep(STEP.QR);
    if (method === 'CARD')    setStep(STEP.CARD);
    if (method === 'EWALLET') setStep(STEP.EWALLET);
  };

  // Xác nhận QR (cũ)
  const handleConfirmPayment = async () => {
    if (loading) return; 
    clearInterval(timerRef.current);
    setLoading(true);
    try {
      await axios.post('/bookings', {
        ...form,
        tourId,
        numberOfPeople: parseInt(form.numberOfPeople),
        bookingCode: qrInfo.bookingCode,
        
        // ✅ ĐÃ SỬA: Lấy ID từ State khách vừa chọn, thay vì lấy từ URL
        departureId: departure?.id || null, 
        departureInfo: departure
          ? `${departure.startDate} → ${departure.endDate} (${departure.totalDays} ngày)`
          : null,
      });
      setStep(STEP.SUCCESS);
    } catch (err) {
      alert('❌ Lỗi: ' + (err.response?.data || 'Thử lại nhé!'));
    }
    setLoading(false);
  };

  // Card/eWallet thanh toán thành công → gọi API rồi chuyển SUCCESS
  const handlePaymentSuccess = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await axios.post('/bookings', {
        ...form,
        tourId,
        numberOfPeople: parseInt(form.numberOfPeople),
        bookingCode: qrInfo.bookingCode,
        
        // ✅ ĐÃ SỬA: Lấy ID từ State khách vừa chọn, thay vì lấy từ URL
        departureId: departure?.id || null, 
        departureInfo: departure
          ? `${departure.startDate} → ${departure.endDate} (${departure.totalDays} ngày)`
          : null,
      });
      setStep(STEP.SUCCESS);
    } catch (err) {
      alert('❌ Lỗi: ' + (err.response?.data || 'Thử lại nhé!'));
    }
    setLoading(false);
  };

  const formatCountdown  = (s) => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  const countdownPercent = (countdown / AUTO_CONFIRM_SECONDS) * 100;
  const unitPrice = departure?.price || tour?.price || 0;
  // Label thanh bước — thêm "Phương thức"
  const stepLabels = [
    { n: STEP.FORM,    label: 'Thông tin' },
    { n: STEP.METHOD,  label: 'Thanh toán' },
    { n: STEP.SUCCESS, label: 'Hoàn tất' },
  ];
  // Map step hiển thị trên progress bar
  const progressStep = step <= STEP.METHOD ? step
    : step === STEP.SUCCESS ? STEP.SUCCESS
    : STEP.METHOD; // QR/CARD/EWALLET đều vẫn hiện là bước 2

  if (!tour) return <div className="text-center py-20 text-gray-400">Đang tải thông tin tour...</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">

      {/* ── Thanh tiến trình ── */}
      <div className="flex items-center mb-8">
        {stepLabels.map((s, idx) => (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center z-10 relative">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                progressStep >= s.n ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200 text-gray-400'
              }`}>
                {progressStep > s.n ? '✓' : idx + 1}
              </div>
              <span className={`text-xs mt-1 absolute top-10 w-24 text-center font-medium ${
                progressStep >= s.n ? 'text-blue-600' : 'text-gray-400'
              }`}>{s.label}</span>
            </div>
            {idx < stepLabels.length - 1 && (
              <div className={`flex-1 h-1 mx-2 rounded transition-all ${progressStep > s.n ? 'bg-blue-600' : 'bg-gray-200'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-12">

        {/* ══ BƯỚC 1: FORM ══ */}
        {step === STEP.FORM && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-blue-600 text-white px-6 py-4">
              <p className="text-blue-200 text-sm">Đặt tour</p>
              <h2 className="text-xl font-bold">{tour.name}</h2>
              <div className="flex flex-wrap gap-4 mt-2 text-sm text-blue-100">
                <span>⏱️ {tour.duration}</span>
                <span>📅 {tour.departureDate}</span>
                <span>👥 Còn {tour.availableSlots} chỗ</span>
              </div>
            </div>
            <form onSubmit={handleGetQR} className="p-6 space-y-4">
              {loggedInEmail && (
                <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-lg px-4 py-2 text-sm text-blue-700">
                  <span>✅</span>
                  <span>Đã điền thông tin từ tài khoản <strong>{loggedInEmail}</strong></span>
                </div>
              )}

              {/* Cảnh báo chưa có số điện thoại */}
              {phoneWarning && (
                <div className="flex items-start gap-3 bg-amber-50 border border-amber-300
                  rounded-xl px-4 py-3 text-sm">
                  <span className="text-xl flex-shrink-0">⚠️</span>
                  <div>
                    <p className="font-bold text-amber-700">Bạn chưa có số điện thoại</p>
                    <p className="text-amber-600 mt-0.5">
                      Vui lòng cập nhật số điện thoại trong{' '}
                      <a href="/settings" target="_blank"
                        className="font-bold underline hover:text-amber-800">
                        hồ sơ cá nhân
                      </a>
                      {' '}trước khi đặt tour.
                    </p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Họ và tên</label>
                <input name="customerName" value={form.customerName} onChange={handleChange} required disabled
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-gray-400 font-normal ml-1 text-xs">(email xác nhận gửi về đây)</span>
                </label>
                <input name="customerEmail" type="email" value={form.customerEmail} onChange={handleChange} required disabled
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số điện thoại
                </label>
                <input
                  name="customerPhone"
                  type="tel"
                  value={form.customerPhone}
                  required
                  disabled
                  placeholder="Chưa có số điện thoại"
                  className="w-full border rounded-lg px-3 py-2 bg-gray-50
                    text-gray-500 cursor-not-allowed outline-none"
                />
                {form.customerPhone ? (
                  <p className="text-xs text-gray-400 mt-1">
                    📱 Số điện thoại từ hồ sơ cá nhân
                  </p>
                ) : (
                  <p className="text-xs text-red-400 mt-1">
                    ⚠️ Vui lòng cập nhật số điện thoại trong hồ sơ cá nhân
                  </p>
                )}
</div>

              {departures.length > 1 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Chọn ngày khởi hành <span className="text-red-500">*</span>
                </label>
                <div className="space-y-2">
                  {departures
                    .sort((a, b) => new Date(a.startDate) - new Date(b.startDate))
                    .map(dep => {
                      const isFull     = dep.availableSlots <= 0;
                      const isSelected = departure?.id === dep.id;
                      return (
                        <button key={dep.id} type="button"
                          onClick={() => !isFull && setDeparture(dep)}
                          disabled={isFull}
                          className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
                            isFull
                              ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                              : isSelected
                              ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                              : 'border-gray-200 hover:border-blue-300'
                          }`}>
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-bold text-gray-800 text-sm">
                                {new Date(dep.startDate).toLocaleDateString('vi-VN')}
                                {' → '}
                                {new Date(dep.endDate).toLocaleDateString('vi-VN')}
                                <span className="ml-2 font-normal text-gray-500 text-xs">
                                  ({dep.totalDays} ngày)
                                </span>
                              </p>
                              <p className={`text-xs mt-0.5 ${
                                isFull ? 'text-red-500'
                                : dep.availableSlots <= 5 ? 'text-orange-500'
                                : 'text-green-600'
                              }`}>
                                {isFull ? 'Hết chỗ' : `Còn ${dep.availableSlots} chỗ`}
                              </p>
                            </div>
                            <p className="font-bold text-blue-600 text-sm">
                              {dep.price?.toLocaleString('vi-VN')}đ
                            </p>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
              )}

            {/* Hiển thị departure đã chọn nếu chỉ có 1 */}
            {departure && departures.length === 1 && (
              <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-sm">
                <p className="font-bold text-green-700">📅 Ngày khởi hành</p>
                <p className="text-green-600 mt-0.5">
                  {new Date(departure.startDate).toLocaleDateString('vi-VN')}
                  {' → '}
                  {new Date(departure.endDate).toLocaleDateString('vi-VN')}
                  {' · '}{departure.totalDays} ngày
                </p>
                <p className="text-green-600 font-bold">
                  {departure.price?.toLocaleString('vi-VN')}đ / khách
                </p>
              </div>
            )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Số người <span className="text-gray-400 font-normal ml-1">(tối đa {tour.availableSlots})</span>
                </label>
                <input name="numberOfPeople" type="number" min="1" max={tour.availableSlots}
                  value={form.numberOfPeople} onChange={handleChange} required
                  className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-400 outline-none" />
              </div>

              
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Giá/người</span>
                <span>{unitPrice?.toLocaleString('vi-VN')}đ</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-gray-800">
                <span>Tổng tiền</span>
                <span className="text-blue-600 text-lg">
                  {(unitPrice * form.numberOfPeople).toLocaleString('vi-VN')}đ
                </span>
              </div>
              <div className="flex justify-between text-sm text-orange-600 mt-1 font-medium">
                <span>Tiền cọc 20%</span>
                <span>{Math.round(unitPrice * form.numberOfPeople * 0.2).toLocaleString('vi-VN')}đ</span>
              </div>

              <button type="submit" disabled={loading || phoneWarning}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl
                  hover:bg-blue-700 disabled:opacity-50 transition text-lg">
                {loading ? '⏳ Đang xử lý...' : 'Tiếp tục → Chọn thanh toán'}
              </button>
            </form>
          </div>
        )}

        {/* ══ BƯỚC 2: CHỌN PHƯƠNG THỨC ══ */}
        {step === STEP.METHOD && (
          <PaymentMethodStep
            onSelect={handleSelectMethod}
            onBack={() => setStep(STEP.FORM)}  // ← thêm dòng này
          />
        )}

        {/* ══ BƯỚC QR (giữ nguyên code cũ) ══ */}
        {step === STEP.QR && qrInfo && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-orange-500 text-white px-6 py-4 text-center">
              <h2 className="text-xl font-bold">📱 Quét QR để đặt cọc</h2>
              <p className="text-orange-100 text-sm mt-1">Quét mã bên dưới — hệ thống tự xác nhận sau {formatCountdown(countdown)}</p>
            </div>
            <div className="relative h-2 bg-gray-200">
              <div className="absolute left-0 top-0 h-2 bg-orange-400 transition-all duration-1000" style={{ width: `${countdownPercent}%` }} />
            </div>
            <div className="p-6">
              <div className={`text-center mb-4 ${countdown <= 30 ? 'text-red-500' : 'text-orange-500'}`}>
                <span className="text-3xl font-bold tabular-nums">{formatCountdown(countdown)}</span>
                <p className="text-xs mt-1 text-gray-400">{countdown > 0 ? 'Hệ thống tự động xác nhận sau khi hết giờ' : '⏳ Đang xác nhận...'}</p>
              </div>
              <div className="bg-blue-50 border-2 border-dashed border-blue-300 rounded-xl p-4 text-center mb-5">
                <p className="text-gray-500 text-sm mb-1">Mã đặt tour — ghi vào nội dung CK</p>
                <p className="text-2xl font-bold text-blue-600 tracking-widest">{qrInfo.bookingCode}</p>
              </div>
              <div className="flex flex-col items-center mb-5">
                <div className="bg-white p-3 rounded-2xl shadow-lg border-2 border-gray-100">
                  {!qrError ? (
                    <img src={qrInfo.qrUrl} alt="QR Code" className="w-56 h-56 object-contain" onError={() => setQrError(true)} />
                  ) : (
                    <div className="w-56 h-56 flex flex-col items-center justify-center bg-gray-50 rounded-xl text-center px-4">
                      <p className="text-4xl mb-2">📱</p>
                      <p className="text-gray-500 text-sm font-medium">Không tải được QR</p>
                    </div>
                  )}
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-5 text-sm">
                <h3 className="font-bold text-gray-700 mb-3">🏦 Thông tin chuyển khoản</h3>
                {[
                  { label: 'Ngân hàng',    value: qrInfo.bankName },
                  { label: 'Số tài khoản', value: qrInfo.bankAccount },
                  { label: 'Tên TK',       value: qrInfo.bankOwner },
                  { label: 'Số tiền',      value: `${qrInfo.depositAmount?.toLocaleString('vi-VN')}đ` },
                  { label: 'Nội dung CK',  value: qrInfo.bookingCode },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="font-bold text-gray-800">{row.value}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-3">
                <button onClick={() => { clearInterval(timerRef.current); setStep(STEP.METHOD); }} disabled={loading}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold py-3 rounded-xl hover:bg-gray-200 disabled:opacity-50 transition">
                  Quay lại
                </button>
                <button onClick={handleConfirmPayment} disabled={loading}
                  className="flex-[2] bg-green-600 text-white font-bold py-3 rounded-xl hover:bg-green-700 disabled:opacity-50 transition">
                  {loading ? '⏳ Đang xử lý...' : '✅ Tôi đã chuyển khoản'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ BƯỚC CARD ══ */}
        {step === STEP.CARD && (
          <CardPaymentStep
            depositAmount={qrInfo?.depositAmount}
            bookingCode={qrInfo?.bookingCode}
            onSuccess={handlePaymentSuccess}
            onBack={() => setStep(STEP.METHOD)}
          />
        )}

        {/* ══ BƯỚC EWALLET ══ */}
        {step === STEP.EWALLET && (
          <EWalletStep
            depositAmount={qrInfo?.depositAmount}
            bookingCode={qrInfo?.bookingCode}
            onSuccess={handlePaymentSuccess}
            onBack={() => setStep(STEP.METHOD)}
          />
        )}

        {/* ══ BƯỚC SUCCESS ══ */}
        {step === STEP.SUCCESS && (
          <div className="bg-white rounded-2xl shadow-md p-8 text-center">
            <div className="text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-2xl font-bold text-green-600 mb-2">Đặt tour thành công!</h2>
            <p className="text-gray-500 mb-4">Email xác nhận đã được gửi tới <strong>{form.customerEmail}</strong></p>
            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-green-400 text-sm mb-1">Mã đặt tour của bạn</p>
              <p className="text-green-700 font-bold text-2xl tracking-widest">{qrInfo?.bookingCode}</p>
            </div>

            {/* Phương thức đã dùng */}
            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-sm text-gray-500 flex items-center justify-center gap-2">
              <span>Thanh toán qua:</span>
              <span className="font-semibold text-gray-700">
                {payMethod === 'QR' ? '📱 QR VietQR'
                  : payMethod === 'CARD' ? '💳 Thẻ tín dụng'
                  : '🌐 Ví điện tử'}
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-sm text-left mb-6 space-y-2">
              <div className="flex justify-between"><span className="text-gray-500">Tour</span><span className="font-medium">{tour.name}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Khách hàng</span><span className="font-medium">{form.customerName}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Số người</span><span className="font-medium">{form.numberOfPeople} người</span></div>
              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-500">Tổng tiền</span>
                {/* ✅ ĐÃ SỬA: Dùng unitPrice để tính đúng giá và tránh lỗi null */}
                <span className="font-bold text-blue-600">{(unitPrice * form.numberOfPeople).toLocaleString('vi-VN')}đ</span>
              </div>
            </div>
            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/tours')}
                className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-blue-700 transition">
                Xem thêm tour
              </button>
              <button onClick={() => navigate('/')}
                className="bg-gray-100 text-gray-600 px-6 py-2 rounded-xl font-bold hover:bg-gray-200 transition">
                Về trang chủ
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

export default BookingPage;