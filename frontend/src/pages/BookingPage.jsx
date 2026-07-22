import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import axios from '../api/axios';
import { useTranslation } from 'react-i18next';
import { tokenManager } from '../api/tokenManager';

const STEP = { FORM: 1, METHOD: 2, QR: 3, CARD: 4, EWALLET: 5, SUCCESS: 6 };
const AUTO_CONFIRM_SECONDS = 120;

// ── Payment Method Step ───────────────────────────────────────
function PaymentMethodStep({ onSelect, onBack, isEng }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);

  const methods = [
    {
      id: 'QR', icon: '📱',
      label: 'QR VietQR',
      desc: t('bookingPage.methods.qrDesc'),
      color: 'blue',
    },
    {
      id: 'CARD', icon: '💳',
      label: t('bookingPage.methods.cardLabel'),
      desc: 'Visa, Mastercard, JCB',
      color: 'indigo',
    },
    {
      id: 'EWALLET', icon: '🌐',
      label: 'Google Pay / PayPal',
      desc: t('bookingPage.methods.ewalletDesc'),
      color: 'green',
    },
  ];

  const colorMap = {
    blue:   { ring: 'ring-blue-400',   bg: 'bg-blue-50',   icon: 'bg-blue-100 text-blue-600',    check: 'bg-blue-600' },
    indigo: { ring: 'ring-indigo-400', bg: 'bg-indigo-50', icon: 'bg-indigo-100 text-indigo-600', check: 'bg-indigo-600' },
    green:  { ring: 'ring-green-400',  bg: 'bg-green-50',  icon: 'bg-green-100 text-green-600',   check: 'bg-green-600' },
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 p-2 rounded-lg flex-shrink-0">
            <span className="text-blue-600 text-lg">💳</span>
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-bold text-gray-800">
              {t('bookingPage.paymentMethod')}
            </h2>
            <p className="text-xs text-gray-400 flex items-center gap-1">
              <span>🔒</span> {t('bookingPage.secureDesc')}
            </p>
          </div>
        </div>
      </div>

      <div className="p-3 sm:p-4 space-y-2 sm:space-y-3">
        {methods.map(m => {
          const c = colorMap[m.color];
          const isSelected = selected === m.id;
          return (
            <button key={m.id} onClick={() => setSelected(m.id)}
              className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4
                rounded-xl border-2 transition-all duration-200 ${
                isSelected
                  ? `border-transparent ring-2 ${c.ring} ${c.bg}`
                  : 'border-gray-100 hover:border-gray-200 bg-white'
              }`}>
              <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center
                justify-center text-base sm:text-lg flex-shrink-0 ${c.icon}`}>
                {m.icon}
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm">{m.label}</p>
                <p className="text-xs text-gray-400 mt-0.5 truncate">{m.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0
                flex items-center justify-center transition-all ${
                isSelected ? `${c.check} border-transparent` : 'border-gray-300'
              }`}>
                {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>

      <div className="px-3 sm:px-4 pb-4 sm:pb-5 flex gap-2 sm:gap-3">
        <button type="button" onClick={onBack}
          className="flex-1 bg-gray-100 text-gray-600 font-bold
            py-3 sm:py-4 rounded-xl hover:bg-gray-200 transition text-sm">
          {t('bookingPage.back')}
        </button>
        <button onClick={() => selected && onSelect(selected)}
          disabled={!selected}
          className={`flex-[2] py-3 sm:py-4 rounded-xl font-bold text-white
            text-sm sm:text-base transition-all duration-200 ${
            selected
              ? 'bg-blue-600 hover:bg-blue-700 shadow-md'
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}>
          {selected
            ? t('bookingPage.payNow')
            : t('bookingPage.selectMethod')}
        </button>
      </div>
    </div>
  );
}

// ── Card Payment Step ─────────────────────────────────────────
function CardPaymentStep({ depositAmount, bookingCode, onSuccess, onBack, isEng }) {
  const { t } = useTranslation();
  const [form,    setForm]    = useState({ number: '', name: '', expiry: '', cvv: '' });
  const [loading, setLoading] = useState(false);
  const [errors,  setErrors]  = useState({});

  const formatCardNumber = val =>
    val.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
  const formatExpiry = val =>
    val.replace(/\D/g, '').slice(0, 4).replace(/^(\d{2})(\d)/, '$1/$2');

  const handleChange = e => {
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
    if (form.number.replace(/\s/g,'').length < 16)
      e.number = t('bookingPage.errors.cardNumber');
    if (!form.name.trim())
      e.name = t('bookingPage.errors.cardholderName');
    if (form.expiry.length < 5)
      e.expiry = t('bookingPage.errors.expiry');
    if (form.cvv.length < 3)
      e.cvv = t('bookingPage.errors.cvv');
    return e;
  };

  const handleSubmit = async e => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 2000));
    setLoading(false);
    onSuccess();
  };

  const raw = form.number.replace(/\s/g, '');
  const cardType = raw.startsWith('4') ? 'VISA'
    : raw.startsWith('5') ? 'MC'
    : raw.startsWith('3') ? 'AMEX' : null;
  const cardTypeLabel = { VISA: '💙 Visa', MC: '🔴 Mastercard', AMEX: '🟦 Amex' };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-400
        px-4 sm:px-6 py-4 sm:py-5 text-white">
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base sm:text-lg font-bold">
            💳 {t('bookingPage.cardPayment')}
          </h2>
          {cardType && (
            <span className="text-xs sm:text-sm bg-white/20 px-2 py-0.5 rounded">
              {cardTypeLabel[cardType]}
            </span>
          )}
        </div>
        <p className="text-indigo-100 text-xs sm:text-sm">
          {t('bookingPage.depositAmount')}:{' '}
          <strong>{depositAmount?.toLocaleString('vi-VN')}đ</strong>
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('bookingPage.cardNumber')}
          </label>
          <div className="relative">
            <input name="number" value={form.number} onChange={handleChange}
              placeholder="0000 0000 0000 0000"
              className={`w-full border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3
                text-sm sm:text-base font-mono tracking-widest
                focus:ring-2 focus:ring-indigo-400 outline-none transition
                ${errors.number ? 'border-red-400' : 'border-gray-200'}`} />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-300">💳</span>
          </div>
          {errors.number && <p className="text-red-500 text-xs mt-1">{errors.number}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('bookingPage.cardholderName')}
          </label>
          <input name="name" value={form.name} onChange={handleChange}
            placeholder={t('bookingPage.cardholderPlaceholder')}
            className={`w-full border rounded-xl px-3 sm:px-4 py-2.5 sm:py-3
              uppercase tracking-wide text-sm focus:ring-2 focus:ring-indigo-400
              outline-none transition ${errors.name ? 'border-red-400' : 'border-gray-200'}`} />
          {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('bookingPage.expiryDate')}
            </label>
            <input name="expiry" value={form.expiry} onChange={handleChange}
              placeholder="MM/YY"
              className={`w-full border rounded-xl px-3 py-2.5 text-center font-mono text-sm
                focus:ring-2 focus:ring-indigo-400 outline-none transition
                ${errors.expiry ? 'border-red-400' : 'border-gray-200'}`} />
            {errors.expiry && <p className="text-red-500 text-xs mt-1">{errors.expiry}</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CVV</label>
            <input name="cvv" value={form.cvv} onChange={handleChange}
              placeholder="•••" type="password"
              className={`w-full border rounded-xl px-3 py-2.5 text-center font-mono text-sm
                focus:ring-2 focus:ring-indigo-400 outline-none transition
                ${errors.cvv ? 'border-red-400' : 'border-gray-200'}`} />
            {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
          </div>
        </div>

        <div className="bg-indigo-50 rounded-xl px-4 py-3 flex justify-between
          items-center text-xs sm:text-sm">
          <span className="text-gray-500">
            {t('bookingPage.bookingCode')}
          </span>
          <span className="font-bold text-indigo-700 tracking-widest">{bookingCode}</span>
        </div>

        <p className="text-xs text-gray-400 text-center flex items-center justify-center gap-1">
          🔒 {t('bookingPage.sslInfo')}
        </p>

        <div className="flex gap-2 sm:gap-3 pt-1">
          <button type="button" onClick={onBack}
            className="flex-1 bg-gray-100 text-gray-600 font-bold py-2.5 sm:py-3
              rounded-xl hover:bg-gray-200 transition text-sm">
            {t('bookingPage.back')}
          </button>
          <button type="submit" disabled={loading}
            className="flex-[2] bg-indigo-600 text-white font-bold py-2.5 sm:py-3
              rounded-xl hover:bg-indigo-700 disabled:opacity-60 transition
              flex items-center justify-center gap-2 text-sm">
            {loading
              ? <><span className="animate-spin">⏳</span>
                  {t('bookingPage.processing')}</>
              : t('bookingPage.payNowAction')}
          </button>
        </div>
      </form>
    </div>
  );
}

// ── EWallet Step ──────────────────────────────────────────────
function EWalletStep({ depositAmount, bookingCode, onSuccess, onBack, isEng }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(false);

  const wallets = [
    {
      id: 'GPAY', label: 'Google Pay', icon: '🔵',
      desc: t('bookingPage.wallets.gpayDesc')
    },
    {
      id: 'PAYPAL', label: 'PayPal', icon: '🟡',
      desc: t('bookingPage.wallets.paypalDesc')
    },
  ];

  const handlePay = async () => {
    if (!selected) return;
    setLoading(true);
    await new Promise(r => setTimeout(r, 2500));
    setLoading(false);
    onSuccess();
  };

  return (
    <div className="bg-white rounded-2xl shadow-md overflow-hidden">
      <div className="bg-gradient-to-r from-green-600 to-teal-500
        px-4 sm:px-6 py-4 sm:py-5 text-white">
        <h2 className="text-base sm:text-lg font-bold">
          🌐 {t('bookingPage.internationalEWallet')}
        </h2>
        <p className="text-green-100 text-xs sm:text-sm mt-0.5">
          {t('bookingPage.deposit')}:{' '}
          <strong>{depositAmount?.toLocaleString('vi-VN')}đ</strong>
        </p>
      </div>

      <div className="p-4 sm:p-6 space-y-3 sm:space-y-4">
        <div className="space-y-2 sm:space-y-3">
          {wallets.map(w => (
            <button key={w.id} onClick={() => setSelected(w.id)}
              className={`w-full flex items-center gap-3 sm:gap-4 p-3 sm:p-4
                rounded-xl border-2 transition-all ${
                selected === w.id
                  ? 'border-green-400 bg-green-50 ring-2 ring-green-300'
                  : 'border-gray-100 hover:border-gray-200'
              }`}>
              <span className="text-2xl sm:text-3xl">{w.icon}</span>
              <div className="text-left flex-1 min-w-0">
                <p className="font-bold text-gray-800 text-sm sm:text-base">{w.label}</p>
                <p className="text-xs text-gray-400 truncate">{w.desc}</p>
              </div>
              <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0
                flex items-center justify-center ${
                selected === w.id
                  ? 'bg-green-500 border-transparent'
                  : 'border-gray-300'
              }`}>
                {selected === w.id && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </button>
          ))}
        </div>

        <div className="bg-gray-50 rounded-xl px-4 py-3 flex justify-between
          items-center text-xs sm:text-sm">
          <span className="text-gray-500">
            {t('bookingPage.bookingCode')}
          </span>
          <span className="font-bold text-green-700 tracking-widest">{bookingCode}</span>
        </div>

        {selected && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl
            px-4 py-3 text-xs text-amber-700 flex gap-2">
            <span>ℹ️</span>
            <span>
              {t('bookingPage.redirectInfo', { wallet: wallets.find(w => w.id === selected)?.label })}
            </span>
          </div>
        )}

        <div className="flex gap-2 sm:gap-3 pt-1">
          <button onClick={onBack}
            className="flex-1 bg-gray-100 text-gray-600 font-bold py-2.5 sm:py-3
              rounded-xl hover:bg-gray-200 transition text-sm">
            {t('bookingPage.back')}
          </button>
          <button onClick={handlePay} disabled={!selected || loading}
            className="flex-[2] bg-green-600 text-white font-bold py-2.5 sm:py-3
              rounded-xl hover:bg-green-700 disabled:opacity-50 transition
              flex items-center justify-center gap-2 text-sm">
            {loading
              ? <><span className="animate-spin">⏳</span>
                  {t('bookingPage.connecting')}</>
              : t('bookingPage.payVia', { wallet: selected ? wallets.find(w => w.id === selected)?.label : '...' })}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main BookingPage ──────────────────────────────────────────
function BookingPage() {
  const { tourId }  = useParams();
  const navigate    = useNavigate();
  const { t, i18n } = useTranslation();
  const isEng       = i18n.language === 'en';

  const loggedInEmail = localStorage.getItem('userEmail') || '';
  const loggedInName  = localStorage.getItem('userName')  || '';

  const [phoneWarning, setPhoneWarning] = useState(false);
  const [tour,         setTour]         = useState(null);
  const [step,         setStep]         = useState(STEP.FORM);
  const [qrInfo,       setQrInfo]       = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [qrError,      setQrError]      = useState(false);
  const [payMethod,    setPayMethod]    = useState(null);
  const [countdown,    setCountdown]    = useState(AUTO_CONFIRM_SECONDS);
  const [autoConfirm,  setAutoConfirm]  = useState(false);
  const [departures,   setDepartures]   = useState([]);
  const [departure,    setDeparture]    = useState(null);
  const timerRef = useRef(null);

  const [form, setForm] = useState({
    customerName:   loggedInName,
    customerEmail:  loggedInEmail,
    customerPhone:  '',
    numberOfPeople: 1,
  });

  const [searchParams] = useSearchParams();
  const depId = searchParams.get('depId');

  useEffect(() => {
    if (!tokenManager.getToken()) {
      alert(t('bookingPage.loginRequiredAlert'));
      navigate('/login');
      return;
    }

    axios.get('/users/me').then(res => {
      const phone = res.data?.phone || '';
      if (!phone) setPhoneWarning(true);
      setForm(prev => ({ ...prev, customerPhone: phone }));
    }).catch(() => {});

    axios.get(`/tours/${tourId}`).then(res => {
      setTour(res.data);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const activeDeps = (res.data.departures || []).filter(d => {
        if (d.status !== 'active') return false;
        const s = new Date(d.startDate);
        s.setHours(0, 0, 0, 0);
        return s >= today;
      });
      setDepartures(activeDeps);
      if (depId) {
        const dep = activeDeps.find(d => d.id === depId);
        if (dep) setDeparture(dep);
      } else if (activeDeps.length === 1) {
        setDeparture(activeDeps[0]);
      }
    });
  }, [tourId, depId]);

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

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleGetQR = async e => {
    e.preventDefault();
    if (departures.length > 1 && !departure) {
      alert(t('bookingPage.alertSelectDate'));
      return;
    }
    setLoading(true);
    try {
      const res = await axios.get('/bookings/qr-info', {
        params: { tourId, numberOfPeople: parseInt(form.numberOfPeople), departureId: departure?.id || null }
      });
      setQrInfo(res.data);
      setStep(STEP.METHOD);
    } catch (err) {
      const errMsg = err.response?.data?.error
      || err.response?.data
      alert('❌ ' + (errMsg || t('bookingPage.tryAgain')));
    }
    setLoading(false);
  };

  const handleSelectMethod = method => {
    setPayMethod(method);
    if (method === 'QR')      setStep(STEP.QR);
    if (method === 'CARD')    setStep(STEP.CARD);
    if (method === 'EWALLET') setStep(STEP.EWALLET);
  };

  const handleConfirmPayment = async () => {
    if (loading) return;
    clearInterval(timerRef.current);
    setLoading(true);
    try {
      await axios.post('/bookings', {
        ...form, tourId,
        numberOfPeople: parseInt(form.numberOfPeople),
        bookingCode:    qrInfo.bookingCode,
        departureId:    departure?.id || null,
        departureInfo:  departure
          ? `${departure.startDate} → ${departure.endDate} (${departure.totalDays} ${t('bookingPage.days')})`
          : null,
      });
      setStep(STEP.SUCCESS);
    } catch (err) {
      const errMsg = err.response?.data?.error
        || err.response?.data;
      alert('❌ ' + (errMsg || t('bookingPage.tryAgain')));
    }
    setLoading(false);
  };

  const handlePaymentSuccess = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await axios.post('/bookings', {
        ...form, tourId,
        numberOfPeople: parseInt(form.numberOfPeople),
        bookingCode:    qrInfo.bookingCode,
        departureId:    departure?.id || null,
        departureInfo:  departure
          ? `${departure.startDate} → ${departure.endDate} (${departure.totalDays} ${t('bookingPage.days')})`
          : null,
      });
      setStep(STEP.SUCCESS);
    } catch (err) {
      const errMsg = err.response?.data?.error
        || err.response?.data;
      alert('❌ ' + (errMsg || t('bookingPage.tryAgain')));
    }
    setLoading(false);
  };

  const formatCountdown  = s => `${Math.floor(s/60)}:${(s%60).toString().padStart(2,'0')}`;
  const countdownPercent = (countdown / AUTO_CONFIRM_SECONDS) * 100;
  const unitPrice        = departure?.price || tour?.price || 0;

  const stepLabels = [
    { n: STEP.FORM,    label: t('bookingPage.steps.info') },
    { n: STEP.METHOD,  label: t('bookingPage.steps.payment') },
    { n: STEP.SUCCESS, label: t('bookingPage.steps.done') },
  ];
  const progressStep = step <= STEP.METHOD ? step
    : step === STEP.SUCCESS ? STEP.SUCCESS : STEP.METHOD;

  if (!tour) return (
    <div className="flex items-center justify-center min-h-[40vh]">
      <div className="animate-spin rounded-full h-10 w-10
        border-4 border-blue-500 border-t-transparent" />
    </div>
  );

  return (
    <div className="max-w-xl mx-auto px-4 py-6 sm:py-10">

      {/* Progress bar */}
      <div className="flex items-center mb-8 sm:mb-10">
        {stepLabels.map((s, idx) => (
          <React.Fragment key={s.n}>
            <div className="flex flex-col items-center z-10 relative">
              <div className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center
                justify-center font-bold text-xs sm:text-sm transition-all ${
                progressStep >= s.n
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                {progressStep > s.n ? '✓' : idx + 1}
              </div>
              <span className={`text-xs mt-1 absolute top-9 sm:top-10 w-20 sm:w-24
                text-center font-medium ${
                progressStep >= s.n ? 'text-blue-600' : 'text-gray-400'
              }`}>{s.label}</span>
            </div>
            {idx < stepLabels.length - 1 && (
              <div className={`flex-1 h-1 mx-1 sm:mx-2 rounded transition-all ${
                progressStep > s.n ? 'bg-blue-600' : 'bg-gray-200'
              }`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="mt-10 sm:mt-12 space-y-4">

        {/* ══ FORM ══ */}
        {step === STEP.FORM && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            {/* Header */}
            <div className="bg-blue-600 text-white px-4 sm:px-6 py-4">
              <p className="text-blue-200 text-xs sm:text-sm">
                {t('bookingPage.bookTourHeader')}
              </p>
              <h2 className="text-base sm:text-xl font-bold line-clamp-1">{tour.name}</h2>
              <div className="flex flex-wrap gap-2 sm:gap-4 mt-2 text-xs sm:text-sm text-blue-100">
                <span>⏱️ {tour.duration}</span>
                <span>👥 {t('bookingPage.spotsLeft', { count: tour.availableSlots })}</span>
              </div>
            </div>

            <form onSubmit={handleGetQR} className="p-4 sm:p-6 space-y-3 sm:space-y-4">

              {/* Đã đăng nhập */}
              {loggedInEmail && (
                <div className="flex items-center gap-2 bg-blue-50 border
                  border-blue-200 rounded-lg px-3 sm:px-4 py-2 text-xs sm:text-sm text-blue-700">
                  <span>✅</span>
                  <span className="truncate">
                    {t('bookingPage.filledFromAccount')}{' '}
                    <strong>{loggedInEmail}</strong>
                  </span>
                </div>
              )}

              {/* Phone warning */}
              {phoneWarning && (
                <div className="flex items-start gap-2 sm:gap-3 bg-amber-50
                  border border-amber-300 rounded-xl px-3 sm:px-4 py-3 text-xs sm:text-sm">
                  <span className="text-lg flex-shrink-0">⚠️</span>
                  <div>
                    <p className="font-bold text-amber-700">
                      {t('bookingPage.noPhoneTitle')}
                    </p>
                    <p className="text-amber-600 mt-0.5">
                      {t('bookingPage.noPhoneDescPre')}
                      <a href="/settings" target="_blank"
                        className="font-bold underline hover:text-amber-800">
                        {t('bookingPage.noPhoneDescLink')}
                      </a>.
                    </p>
                  </div>
                </div>
              )}

              {/* Tên */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  {t('bookingPage.fullNameLabel')}
                </label>
                <input name="customerName" value={form.customerName}
                  onChange={handleChange} required disabled
                  className="w-full border rounded-lg px-3 py-2 text-sm
                    bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>

              {/* Email */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Email
                  <span className="text-gray-400 font-normal ml-1 text-xs">
                    ({t('bookingPage.emailConfirmNote')})
                  </span>
                </label>
                <input name="customerEmail" type="email" value={form.customerEmail}
                  onChange={handleChange} required disabled
                  className="w-full border rounded-lg px-3 py-2 text-sm
                    bg-gray-50 text-gray-500 cursor-not-allowed" />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  {t('bookingPage.phoneLabel')}
                </label>
                <input name="customerPhone" type="tel" value={form.customerPhone}
                  required disabled
                  placeholder={t('bookingPage.noPhonePlaceholder')}
                  className="w-full border rounded-lg px-3 py-2 text-sm
                    bg-gray-50 text-gray-500 cursor-not-allowed outline-none" />
                {form.customerPhone ? (
                  <p className="text-xs text-gray-400 mt-1">
                    📱 {t('bookingPage.phoneFromProfile')}
                  </p>
                ) : (
                  <p className="text-xs text-red-400 mt-1">
                    ⚠️ {t('bookingPage.updatePhoneRequired')}
                  </p>
                )}
              </div>

              {/* Chọn ngày — nhiều departure */}
              {departures.length > 1 && (
                <div>
                  <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-2">
                    {t('bookingPage.selectDepartureDate')}{' '}
                    <span className="text-red-500">*</span>
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
                                <p className="font-bold text-gray-800 text-xs sm:text-sm">
                                  {new Date(dep.startDate).toLocaleDateString(isEng ? 'en-US' : 'vi-VN')}
                                  {' → '}
                                  {new Date(dep.endDate).toLocaleDateString(isEng ? 'en-US' : 'vi-VN')}
                                  <span className="ml-1 font-normal text-gray-500 text-xs">
                                    ({dep.totalDays} {t('bookingPage.days')})
                                  </span>
                                </p>
                                <p className={`text-xs mt-0.5 ${
                                  isFull ? 'text-red-500'
                                  : dep.availableSlots <= 5 ? 'text-orange-500'
                                  : 'text-green-600'
                                }`}>
                                  {isFull
                                    ? t('bookingPage.full')
                                    : t('bookingPage.spotsAvailable', { count: dep.availableSlots })}
                                </p>
                              </div>
                              <p className="font-bold text-blue-600 text-xs sm:text-sm flex-shrink-0 ml-2">
                                {dep.price?.toLocaleString('vi-VN')}đ
                              </p>
                            </div>
                          </button>
                        );
                      })}
                  </div>
                </div>
              )}

              {/* Departure đã chọn — 1 departure */}
              {departure && departures.length === 1 && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-4 py-3 text-xs sm:text-sm">
                  <p className="font-bold text-green-700">
                    📅 {t('bookingPage.departureDate')}
                  </p>
                  <p className="text-green-600 mt-0.5">
                    {new Date(departure.startDate).toLocaleDateString(isEng ? 'en-US' : 'vi-VN')}
                    {' → '}
                    {new Date(departure.endDate).toLocaleDateString(isEng ? 'en-US' : 'vi-VN')}
                    {' · '}{departure.totalDays} {t('bookingPage.days')}
                  </p>
                  <p className="text-green-600 font-bold">
                    {departure.price?.toLocaleString('vi-VN')}đ / {t('bookingPage.perPerson')}
                  </p>
                </div>
              )}

              {/* Số người */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  {t('bookingPage.numberOfPeople')}
                  <span className="text-gray-400 font-normal ml-1">
                    ({t('bookingPage.maxSlots', { count: tour.availableSlots })})
                  </span>
                </label>
                <input name="numberOfPeople" type="number"
                  min="1" max={tour.availableSlots}
                  value={form.numberOfPeople} onChange={handleChange} required
                  className="w-full border rounded-lg px-3 py-2 text-sm
                    focus:ring-2 focus:ring-blue-400 outline-none" />
              </div>

              {/* Tổng tiền */}
              <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>{t('bookingPage.pricePerPerson')}</span>
                  <span>{unitPrice?.toLocaleString('vi-VN')}đ</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>{t('bookingPage.peopleCount')}</span>
                  <span>× {form.numberOfPeople}</span>
                </div>
                <div className="flex justify-between font-bold text-gray-800 border-t pt-2">
                  <span>{t('bookingPage.totalPriceLabel')}</span>
                  <span className="text-blue-600 text-base sm:text-lg">
                    {(unitPrice * form.numberOfPeople).toLocaleString('vi-VN')}đ
                  </span>
                </div>
                <div className="flex justify-between text-orange-600 font-medium text-xs sm:text-sm">
                  <span>{t('bookingPage.depositLabel')}</span>
                  <span>
                    {Math.round(unitPrice * form.numberOfPeople * 0.2).toLocaleString('vi-VN')}đ
                  </span>
                </div>
              </div>

              <button type="submit" disabled={loading || phoneWarning}
                className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl
                  hover:bg-blue-700 disabled:opacity-50 transition text-sm sm:text-base">
                {loading
                  ? t('bookingPage.processingWithIcon')
                  : t('bookingPage.continueToPayment')}
              </button>
            </form>
          </div>
        )}

        {/* ══ METHOD ══ */}
        {step === STEP.METHOD && (
          <PaymentMethodStep
            onSelect={handleSelectMethod}
            onBack={() => setStep(STEP.FORM)}
            isEng={isEng}
          />
        )}

        {/* ══ QR ══ */}
        {step === STEP.QR && qrInfo && (
          <div className="bg-white rounded-2xl shadow-md overflow-hidden">
            <div className="bg-orange-500 text-white px-4 sm:px-6 py-4 text-center">
              <h2 className="text-base sm:text-xl font-bold">
                📱 {t('bookingPage.qr.scanTitle')}
              </h2>
              <p className="text-orange-100 text-xs sm:text-sm mt-1">
                {t('bookingPage.qr.autoConfirmed', { time: formatCountdown(countdown) })}
              </p>
            </div>
            <div className="relative h-2 bg-gray-200">
              <div className="absolute left-0 top-0 h-2 bg-orange-400 transition-all duration-1000"
                style={{ width: `${countdownPercent}%` }} />
            </div>
            <div className="p-4 sm:p-6">
              <div className={`text-center mb-4 ${countdown <= 30 ? 'text-red-500' : 'text-orange-500'}`}>
                <span className="text-2xl sm:text-3xl font-bold tabular-nums">
                  {formatCountdown(countdown)}
                </span>
                <p className="text-xs mt-1 text-gray-400">
                  {countdown > 0
                    ? t('bookingPage.qr.autoConfirmedNote')
                    : '⏳ ' + t('bookingPage.qr.confirming')}
                </p>
              </div>

              <div className="bg-blue-50 border-2 border-dashed border-blue-300
                rounded-xl p-4 text-center mb-4">
                <p className="text-gray-500 text-xs sm:text-sm mb-1">
                  {t('bookingPage.qr.codeNote')}
                </p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600 tracking-widest">
                  {qrInfo.bookingCode}
                </p>
              </div>

              <div className="flex justify-center mb-4">
                <div className="bg-white p-3 rounded-2xl shadow-lg border-2 border-gray-100">
                  {!qrError ? (
                    <img src={qrInfo.qrUrl} alt="QR Code"
                      className="w-44 h-44 sm:w-56 sm:h-56 object-contain"
                      onError={() => setQrError(true)} />
                  ) : (
                    <div className="w-44 h-44 sm:w-56 sm:h-56 flex flex-col items-center
                      justify-center bg-gray-50 rounded-xl text-center px-4">
                      <p className="text-4xl mb-2">📱</p>
                      <p className="text-gray-500 text-sm font-medium">
                        {t('bookingPage.qr.error')}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 space-y-2 mb-4 text-xs sm:text-sm">
                <h3 className="font-bold text-gray-700 mb-2">
                  🏦 {t('bookingPage.qr.transferInfo')}
                </h3>
                {[
                  { label: t('bookingPage.qr.bank'),         value: qrInfo.bankName },
                  { label: t('bookingPage.qr.accountNo'),  value: qrInfo.bankAccount },
                  { label: t('bookingPage.qr.accountName'), value: qrInfo.bankOwner },
                  { label: t('bookingPage.qr.amount'),       value: `${qrInfo.depositAmount?.toLocaleString('vi-VN')}đ` },
                  { label: t('bookingPage.qr.transferNote'),  value: qrInfo.bookingCode },
                ].map(row => (
                  <div key={row.label} className="flex justify-between items-center">
                    <span className="text-gray-500">{row.label}</span>
                    <span className="font-bold text-gray-800 text-right ml-2 break-all">
                      {row.value}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 sm:gap-3">
                <button onClick={() => { clearInterval(timerRef.current); setStep(STEP.METHOD); }}
                  disabled={loading}
                  className="flex-1 bg-gray-100 text-gray-600 font-bold py-2.5 sm:py-3
                    rounded-xl hover:bg-gray-200 disabled:opacity-50 transition text-sm">
                  {t('bookingPage.back')}
                </button>
                <button onClick={handleConfirmPayment} disabled={loading}
                  className="flex-[2] bg-green-600 text-white font-bold py-2.5 sm:py-3
                    rounded-xl hover:bg-green-700 disabled:opacity-50 transition text-sm">
                  {loading
                    ? t('bookingPage.processingWithIcon')
                    : t('bookingPage.qr.doneButton')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ══ CARD ══ */}
        {step === STEP.CARD && (
          <CardPaymentStep
            depositAmount={qrInfo?.depositAmount}
            bookingCode={qrInfo?.bookingCode}
            onSuccess={handlePaymentSuccess}
            onBack={() => setStep(STEP.METHOD)}
            isEng={isEng}
          />
        )}

        {/* ══ EWALLET ══ */}
        {step === STEP.EWALLET && (
          <EWalletStep
            depositAmount={qrInfo?.depositAmount}
            bookingCode={qrInfo?.bookingCode}
            onSuccess={handlePaymentSuccess}
            onBack={() => setStep(STEP.METHOD)}
            isEng={isEng}
          />
        )}

        {/* ══ SUCCESS ══ */}
        {step === STEP.SUCCESS && (
          <div className="bg-white rounded-2xl shadow-md p-6 sm:p-8 text-center">
            <div className="text-5xl sm:text-6xl mb-4 animate-bounce">🎉</div>
            <h2 className="text-xl sm:text-2xl font-bold text-green-600 mb-2">
              {t('bookingPage.success.title')}
            </h2>
            <p className="text-gray-500 text-sm mb-4">
              {t('bookingPage.success.emailSent')}{' '}
              <strong>{form.customerEmail}</strong>
            </p>

            <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
              <p className="text-green-400 text-xs sm:text-sm mb-1">
                {t('bookingPage.success.codeLabel')}
              </p>
              <p className="text-green-700 font-bold text-xl sm:text-2xl tracking-widest">
                {qrInfo?.bookingCode}
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-3 mb-4 text-xs sm:text-sm
              text-gray-500 flex items-center justify-center gap-2">
              <span>{t('bookingPage.success.paidVia')}:</span>
              <span className="font-semibold text-gray-700">
                {payMethod === 'QR'      ? '📱 QR VietQR'
                 : payMethod === 'CARD'  ? t('bookingPage.success.creditCard')
                 : t('bookingPage.success.ewallet')}
              </span>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 text-xs sm:text-sm
              text-left mb-6 space-y-2">
              {[
                { label: t('bookingPage.success.tour'),        value: tour.name },
                { label: t('bookingPage.success.customer'),    value: form.customerName },
                { label: t('bookingPage.success.people'),      value: `${form.numberOfPeople} ${t('bookingPage.success.peopleUnit')}` },
              ].map(row => (
                <div key={row.label} className="flex justify-between gap-2">
                  <span className="text-gray-500 flex-shrink-0">{row.label}</span>
                  <span className="font-medium text-right">{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between border-t pt-2 gap-2">
                <span className="text-gray-500">{t('bookingPage.success.total')}</span>
                <span className="font-bold text-blue-600">
                  {(unitPrice * form.numberOfPeople).toLocaleString('vi-VN')}đ
                </span>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <button onClick={() => navigate('/tours')}
                className="bg-blue-600 text-white px-4 sm:px-6 py-2 rounded-xl
                  font-bold hover:bg-blue-700 transition text-sm">
                {t('bookingPage.success.moreTours')}
              </button>
              <button onClick={() => navigate('/')}
                className="bg-gray-100 text-gray-600 px-4 sm:px-6 py-2 rounded-xl
                  font-bold hover:bg-gray-200 transition text-sm">
                {t('bookingPage.success.home')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default BookingPage;