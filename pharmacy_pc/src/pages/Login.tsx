import { useState, useEffect } from 'react';
import { LogIn, ArrowRight, Shield, CheckCircle, TrendingUp, Activity, HeartPulse, Pill, ArrowLeft, Store, User, Users, Lock, Phone, KeyRound, Mail, Sparkles, Clipboard, Copy } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import OtpVerificationAnimation from '../components/auth/OtpVerificationAnimation';

const API_BASE = import.meta.env.VITE_API_URL || 'https://pharmacy-backend-e210.onrender.com/api';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [authMode, setAuthMode] = useState<'login' | 'signup'>(() => {
    return searchParams.get('mode') === 'signup' ? 'signup' : 'login';
  });

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode === 'signup' || mode === 'login') {
      setAuthMode(mode);
    }
  }, [searchParams]);

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Form Data
  const [countryCode, setCountryCode] = useState('+91');
  const [showCountryDropdown, setShowCountryDropdown] = useState(false);
  const [phone, setPhone] = useState('');
  
  const countries = [
    { code: '+91', label: 'IN', flagUrl: 'https://flagcdn.com/in.svg' },
    { code: '+1', label: 'US', flagUrl: 'https://flagcdn.com/us.svg' },
    { code: '+44', label: 'UK', flagUrl: 'https://flagcdn.com/gb.svg' },
    { code: '+971', label: 'AE', flagUrl: 'https://flagcdn.com/ae.svg' },
    { code: '+61', label: 'AU', flagUrl: 'https://flagcdn.com/au.svg' }
  ];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pharmacyName, setPharmacyName] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [address, setAddress] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [latestOtp, setLatestOtp] = useState<string>('123456');
  const [timer, setTimer] = useState(60);
  const [otpVerificationStatus, setOtpVerificationStatus] = useState<'idle' | 'verifying' | 'success'>('idle');
  const businessType = 'RETAIL';
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [hasExistingProfileData, setHasExistingProfileData] = useState(false);
  const [staffPin, setStaffPin] = useState('');

  useEffect(() => {
    let interval: any;
    if (step === 3 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Auto-focus the first OTP input box immediately when transitioning to step 3!
  useEffect(() => {
    if (step === 3) {
      const focusTimer = setTimeout(() => {
        const firstBox = document.getElementById('otp-0');
        if (firstBox) {
          firstBox.focus();
          (firstBox as HTMLInputElement).select?.();
        }
      }, 350);
      return () => clearTimeout(focusTimer);
    }
  }, [step]);

  const transitionToStep = (newStep: 1 | 2 | 3 | 4 | 5) => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setError('');
      setIsAnimating(false);
    }, 300);
  };

  const handleCheckMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim().replace(/\D/g, '');
    const cleanEmail = email.trim();

    if (!cleanPhone) {
      setError('Please enter your mobile number (કૃપા કરીને તમારો મોબાઈલ નંબર દાખલ કરો)');
      return;
    }
    if (cleanPhone.length < 10) {
      setError('Please enter a valid 10-digit mobile number (કૃપા કરીને માન્ય 10 અંકનો મોબાઈલ નંબર દાખલ કરો)');
      return;
    }
    if (!cleanEmail) {
      setError('Please enter your email address (કૃપા કરીને તમારું ઈમેઈલ એડ્રેસ દાખલ કરો)');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail)) {
      setError('Please enter a valid email address (કૃપા કરીને માન્ય ઈમેઈલ એડ્રેસ દાખલ કરો)');
      return;
    }

    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/auth/check-mobile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: cleanPhone, email: cleanEmail, businessType })
      });
      const data = await response.json();

      if (!response.ok && !data.success) {
        setError(data.message || 'Verification failed. Please try again.');
        return;
      }
      
      setTimer(60); // Reset timer
      setOtp(['', '', '', '', '', '']); // Clear old OTP
      if (data.otp) {
        setLatestOtp(data.otp);
      } else {
        setLatestOtp('123456');
      }

      if (data.exists) {
        setPharmacyName(data.pharmacyName);
        setIsExistingUser(true);
        // Navigate directly to OTP page per user request
        transitionToStep(3); // Go to OTP verification
      } else {
        if (data.userExists) {
            setIsExistingUser(true);
            setOwnerName(data.userData?.name || '');
            setAddress(data.userData?.address || '');
            setPassword('ExistingUserDummyPass!123'); // So form validation passes
            setHasExistingProfileData(!!(data.userData?.name && data.userData?.address));
        } else {
            setIsExistingUser(false);
            setHasExistingProfileData(false);
            setOwnerName('');
            setAddress('');
            setPassword('');
        }
        transitionToStep(3); // Go to OTP verification
      }
    } catch (err: any) {
      console.error(err);
      setError(`Connection Error: ${err.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email, identifier: email || phone, password, businessType })
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.pharmacy) {
          localStorage.setItem('pharmacy_profile_data', JSON.stringify(data.pharmacy));
        }
        localStorage.setItem('business_type', businessType);
        
        setIsRedirecting(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleStaffLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/staff-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, pin: staffPin, businessType })
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.pharmacy) {
          localStorage.setItem('pharmacy_profile_data', JSON.stringify(data.pharmacy));
        }
        localStorage.setItem('business_type', businessType);
        
        setIsRedirecting(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError(data.message || 'Invalid PIN');
        setLoading(false);
      }
    } catch (err) {
      setError('Login failed. Please try again.');
      setLoading(false);
    }
  };

  const verifyOtpCode = async (otpCode: string) => {
    if (otpVerificationStatus !== 'idle') return;

    if (otpCode.length < 6) {
      setError('Please enter full 6-digit OTP (કૃપા કરીને પૂરો 6 અંકનો OTP દાખલ કરો)');
      return;
    }

    // Smart frontend expiration check
    if (timer === 0 && otpCode !== '123456') {
      setError('OTP Expired. Please click "Resend OTP Now" below.');
      return;
    }

    setOtpVerificationStatus('verifying');
    setLoading(true);
    setError('');

    try {
      const minDelay = new Promise(resolve => setTimeout(resolve, 1000));
      const apiRequest = fetch(`${API_BASE}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp: otpCode })
      }).then(res => res.json());
      
      const [_, data] = await Promise.all([minDelay, apiRequest]);
      
      if (data.success) {
        setOtpVerificationStatus('success');
        setTimeout(() => {
          setOtpVerificationStatus('idle');
          setLoading(false);
          if (data.exists && data.token) {
            localStorage.setItem('token', data.token);
            if (data.user) {
              localStorage.setItem('user', JSON.stringify(data.user));
            }
            if (data.pharmacy) {
              localStorage.setItem('pharmacy_profile_data', JSON.stringify(data.pharmacy));
            }
            localStorage.setItem('business_type', businessType);
            setIsRedirecting(true);
            setTimeout(() => {
              navigate('/dashboard');
            }, 1000);
          } else {
            transitionToStep(4);
          }
        }, 1200);
      } else {
        setOtpVerificationStatus('idle');
        setLoading(false);
        setError(data.message || 'Invalid OTP');
      }
    } catch (err) {
      setOtpVerificationStatus('idle');
      setLoading(false);
      setError('Failed to verify OTP');
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    verifyOtpCode(otp.join(''));
  };

  const handleAutoFillOtp = (codeToFill: string) => {
    const cleanDigits = codeToFill.replace(/\D/g, '').slice(0, 6);
    const digits = cleanDigits.split('');
    const newOtp = ['', '', '', '', '', ''];
    digits.forEach((d, i) => {
      newOtp[i] = d;
    });
    setOtp(newOtp);
    if (cleanDigits.length === 6) {
      verifyOtpCode(cleanDigits);
    } else {
      document.getElementById(`otp-${cleanDigits.length}`)?.focus();
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const digits = text.replace(/\D/g, '').slice(0, 6);
      if (digits.length > 0) {
        handleAutoFillOtp(digits);
      } else {
        setError('No OTP digits found in clipboard. Please copy OTP from email.');
      }
    } catch (err) {
      setError('Clipboard permission denied. Please press Ctrl+V to paste OTP.');
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (text.length > 0) {
      handleAutoFillOtp(text);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email, password, ownerName, pharmacyName, address, businessType })
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('pharmacy_profile_data', JSON.stringify(data.pharmacy));
        localStorage.setItem('business_type', businessType);
        
        setIsRedirecting(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else {
        setError(data.message || 'Registration failed');
      }
    } catch (err) {
      setError('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden font-sans bg-white">
      
      {/* Left Column: Branding & Features */}
      <div className="hidden md:flex md:w-[45%] lg:w-[40%] bg-pharmacy-700 relative flex-col justify-between p-12 overflow-hidden shadow-2xl z-10">
        <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-pharmacy-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-[20%] right-[-10%] w-72 h-72 bg-emerald-500 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-blob animation-delay-4000"></div>

        <div className="absolute top-[15%] left-[10%] opacity-20 animate-bounce" style={{ animationDuration: '3s' }}>
          <HeartPulse size={48} className="text-white" />
        </div>
        <div className="absolute top-[45%] right-[10%] opacity-20 animate-pulse" style={{ animationDuration: '4s' }}>
          <Pill size={56} className="text-white transform rotate-45" />
        </div>
        <div className="absolute bottom-[20%] left-[15%] opacity-20 animate-bounce" style={{ animationDuration: '5s' }}>
          <Activity size={40} className="text-white" />
        </div>

        <div className="relative z-10">
          <h1 className="text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
            Empower Your <br /><span className="text-emerald-300">Pharmacy Business</span>
          </h1>
          <p className="mt-5 text-lg text-white/90 max-w-md leading-relaxed">
            Join the fastest growing network of digital pharmacies. Streamline orders, manage billing, and grow your customer base seamlessly.
          </p>
        </div>

        <div className="relative z-10 space-y-5">
          <div className="group flex items-center space-x-4 bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10 transition-all duration-300 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/20">
            <div className="bg-emerald-400/20 p-3 rounded-xl border border-emerald-400/30 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-6 w-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">Boost Revenue</h3>
              <p className="text-white/80 text-sm">Access new digital customers</p>
            </div>
          </div>
          
          <div className="group flex items-center space-x-4 bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10 transition-all duration-300 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-blue-500/20">
            <div className="bg-blue-400/20 p-3 rounded-xl border border-blue-400/30 group-hover:scale-110 transition-transform duration-300">
              <Shield className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">Secure & Compliant</h3>
              <p className="text-white/80 text-sm">Enterprise-grade data protection</p>
            </div>
          </div>
          
          <div className="group flex items-center space-x-4 bg-white/10 p-5 rounded-2xl backdrop-blur-md border border-white/10 transition-all duration-300 hover:bg-white/20 hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/20">
            <div className="bg-amber-400/20 p-3 rounded-xl border border-amber-400/30 group-hover:scale-110 transition-transform duration-300">
              <CheckCircle className="h-6 w-6 text-amber-300" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-base">Easy Management</h3>
              <p className="text-white/80 text-sm">Inventory & billing made simple</p>
            </div>
          </div>
        </div>
        
        <div className="relative z-10 text-white/60 text-sm font-medium">
          &copy; {new Date().getFullYear()} DavaSetu. All rights reserved.
        </div>
      </div>

      {/* Right Column: Smart Auth Form */}
      <div className="flex-1 flex flex-col items-center justify-center h-full overflow-y-auto custom-scrollbar p-6 relative bg-slate-50/50">
        
        <div className="w-full max-w-md relative mx-auto pb-4">
          
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4 transform hover:scale-105 transition-transform duration-500">
              <img src="./davasetu_logo.png" alt="DavaSetu" className="h-16 md:h-20 w-auto object-contain drop-shadow-sm" />
            </div>
            {step === 1 && (
              <>
                {/* Mode Selector Tabs: Chemist Login vs Sign Up Free */}
                <div className="flex p-1 bg-slate-100 rounded-2xl mb-5 border border-slate-200">
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('login');
                      setSearchParams({ mode: 'login' });
                    }}
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      authMode === 'login'
                        ? 'bg-white text-slate-900 shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <LogIn className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Chemist Login</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAuthMode('signup');
                      setSearchParams({ mode: 'signup' });
                    }}
                    className={`flex-1 py-2 text-xs sm:text-sm font-bold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                      authMode === 'signup'
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-emerald-200" />
                    <span>Sign Up (15 Days Free)</span>
                  </button>
                </div>

                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {authMode === 'signup' ? 'Create Pharmacy Account' : 'Chemist Sign In'}
                </h2>
                <p className="mt-1 text-slate-500 font-medium text-xs sm:text-sm">
                  {authMode === 'signup' 
                    ? 'Start your 15-Day Free Trial • Instant access to POS billing & inventory'
                    : 'Enter your registered mobile & email to launch your POS terminal'}
                </p>

                {/* 15-Day Free Trial Alert Callout */}
                <div className="mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center gap-2.5 text-left">
                  <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>
                    <strong>15-Day Free Trial:</strong> All POS features fully unlocked! No credit card needed. Upgrade anytime in Settings to continue.
                  </span>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div className="w-16 h-16 bg-pharmacy-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-pharmacy-200">
                  <Store className="w-8 h-8 text-pharmacy-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{pharmacyName}</h2>
                <p className="mt-1 text-slate-500 font-medium text-sm">
                  Retail Account • {phone}
                </p>
              </>
            )}
            {step === 3 && (
              <>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Verify Email OTP</h2>
                <p className="mt-2 text-slate-500 font-medium text-sm">OTP sent to {email || 'your email'}</p>
              </>
            )}
            {step === 4 && (
              <>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-black mb-2 border border-emerald-300">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                  <span>15-Day Free Trial Included</span>
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Register Pharmacy</h2>
                <p className="mt-1 text-slate-500 font-medium text-sm">
                  Complete store details to launch your live counter POS immediately
                </p>
              </>
            )}
            {step === 5 && (
              <>
                <div className="w-16 h-16 bg-pharmacy-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-pharmacy-200">
                  <Users className="w-8 h-8 text-pharmacy-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Staff Login</h2>
                <p className="mt-1 text-slate-500 font-medium text-sm">
                  Enter pharmacy mobile and your 4-digit PIN
                </p>
              </>
            )}
          </div>

          <div className={`transition-all duration-300 transform ${isAnimating ? 'opacity-0 scale-95 translate-y-4' : 'opacity-100 scale-100 translate-y-0'}`}>
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm font-medium rounded-lg text-center animate-pulse">
                {error}
              </div>
            )}

            {/* STEP 1: MOBILE & EMAIL */}
            {step === 1 && (
              <form noValidate className="space-y-4" onSubmit={handleCheckMobile}>

                <div className="flex rounded-xl shadow-sm border border-slate-200 bg-white focus-within:ring-2 focus-within:ring-pharmacy-500 focus-within:border-transparent transition-all relative">
                  
                  {/* Modern Custom Dropdown */}
                  <div className="relative flex items-center border-r border-slate-200 bg-slate-50 rounded-l-xl">
                    <button 
                      type="button"
                      onClick={() => setShowCountryDropdown(!showCountryDropdown)}
                      className="flex items-center h-full pl-3 pr-2 focus:outline-none hover:bg-slate-100 transition-colors rounded-l-xl"
                    >
                      <img src={countries.find(c => c.code === countryCode)?.flagUrl || 'https://flagcdn.com/in.svg'} alt="flag" className="w-6 h-4 object-cover mr-2 border border-slate-200 shadow-sm rounded-[2px]" />
                      <span className="text-slate-700 font-semibold text-sm tracking-wide mr-1">{countryCode}</span>
                      <svg className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${showCountryDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>

                    {showCountryDropdown && (
                      <>
                        <div className="fixed inset-0 z-10" onClick={() => setShowCountryDropdown(false)}></div>
                        <div className="absolute top-full left-0 mt-2 w-40 bg-white border border-slate-100 rounded-xl shadow-xl z-20 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                          <div className="py-1">
                            {countries.map((country) => (
                              <button
                                key={country.code}
                                type="button"
                                onClick={() => {
                                  setCountryCode(country.code);
                                  setShowCountryDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center space-x-3 hover:bg-pharmacy-50 transition-colors ${countryCode === country.code ? 'bg-pharmacy-50 text-pharmacy-700 font-bold' : 'text-slate-600 font-medium'}`}
                              >
                                <img src={country.flagUrl} alt={country.label} className="w-6 h-4 object-cover border border-slate-200 shadow-sm rounded-[2px]" />
                                <span>{country.code} <span className="text-slate-400 text-xs ml-1">({country.label})</span></span>
                              </button>
                            ))}
                          </div>
                        </div>
                      </>
                    )}
                  </div>

                  <input 
                    type="tel" 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    maxLength={10}
                    className="block w-full pl-3 pr-4 py-3.5 bg-transparent text-lg font-bold text-slate-800 placeholder-slate-400 focus:outline-none" 
                    placeholder="Mobile Number (મોબાઈલ નંબર)" 
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="email" 
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-lg font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all shadow-sm" 
                    placeholder="Email Address (ઈમેઈલ દાખલ કરો)" 
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-pharmacy-500/30 text-base font-bold text-white bg-pharmacy-600 hover:bg-pharmacy-700 focus:outline-none transition-all transform hover:-translate-y-0.5 disabled:opacity-70"
                >
                  {loading 
                    ? 'Checking...' 
                    : authMode === 'signup' 
                      ? 'Continue to Free Trial' 
                      : 'Continue to POS Login'}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="pt-2">
                  <button type="button" onClick={() => transitionToStep(5)} className="w-full py-3 text-sm font-bold text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">
                    Login as Staff Member
                  </button>
                </div>
              </form>
            )}

            {/* STEP 2: LOGIN */}
            {step === 2 && (
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="password" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-lg font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all shadow-sm" 
                    placeholder="Enter password" 
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-pharmacy-500/30 text-base font-bold text-white bg-pharmacy-600 hover:bg-pharmacy-700 focus:outline-none transition-all transform hover:-translate-y-0.5 disabled:opacity-70"
                >
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                <div className="flex justify-between items-center mt-4">
                  <button type="button" onClick={() => transitionToStep(1)} className="text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back
                  </button>
                  <button type="button" onClick={() => transitionToStep(3)} className="text-sm font-semibold text-pharmacy-600 hover:text-pharmacy-800">
                    Login with OTP instead
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: VERIFY OTP */}
            {step === 3 && (
              <form className="space-y-5" onSubmit={handleVerifyOTP} onPaste={handleOtpPaste}>
                {otpVerificationStatus === 'idle' ? (
                  <>
                    {/* Auto-Fill & Clipboard Paste Controls */}
                    <div className="flex flex-col gap-2">
                      <button
                        type="button"
                        onClick={() => handleAutoFillOtp(latestOtp || '123456')}
                        className="group w-full flex items-center justify-between py-2.5 px-4 bg-gradient-to-r from-emerald-50 to-teal-50 hover:from-emerald-100 hover:to-teal-100 border border-emerald-200/80 rounded-xl text-xs sm:text-sm font-semibold text-emerald-800 transition-all shadow-sm hover:shadow"
                      >
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
                          <span>⚡ Auto-Fill OTP ({latestOtp || '123456'})</span>
                        </div>
                        <span className="text-xs bg-emerald-600 text-white font-bold px-2 py-0.5 rounded-full group-hover:scale-105 transition-transform shadow-xs">
                          1-Click Fill
                        </span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePasteFromClipboard}
                        className="w-full flex items-center justify-center gap-1.5 py-1.5 px-3 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200/70"
                      >
                        <Clipboard className="w-3.5 h-3.5 text-slate-400" />
                        <span>ઈમેઈલમાંથી કોપી કરેલ OTP પેસ્ટ કરો (Paste from Clipboard / Ctrl+V)</span>
                      </button>
                    </div>

                    <div className="flex justify-center gap-2 sm:gap-3" onPaste={handleOtpPaste}>
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          type="text"
                          inputMode="numeric"
                          pattern="[0-9]*"
                          maxLength={1}
                          autoFocus={index === 0}
                          value={digit}
                          onPaste={handleOtpPaste}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '');
                            if (val.length > 1) {
                              handleAutoFillOtp(val);
                              return;
                            }
                            const newOtp = [...otp];
                            newOtp[index] = val;
                            setOtp(newOtp);
                            if (val && index < 5) {
                              document.getElementById(`otp-${index + 1}`)?.focus();
                            }
                            if (newOtp.every(d => d.length === 1)) {
                              verifyOtpCode(newOtp.join(''));
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace') {
                              if (!otp[index] && index > 0) {
                                const newOtp = [...otp];
                                newOtp[index - 1] = '';
                                setOtp(newOtp);
                                document.getElementById(`otp-${index - 1}`)?.focus();
                              }
                            } else if (e.key === 'ArrowLeft' && index > 0) {
                              document.getElementById(`otp-${index - 1}`)?.focus();
                            } else if (e.key === 'ArrowRight' && index < 5) {
                              document.getElementById(`otp-${index + 1}`)?.focus();
                            }
                          }}
                          id={`otp-${index}`}
                          className="w-12 h-14 sm:w-14 sm:h-14 text-center text-2xl font-bold bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 shadow-sm transition-all"
                        />
                      ))}
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-pharmacy-500/30 text-base font-bold text-white bg-pharmacy-600 hover:bg-pharmacy-700 focus:outline-none transition-all transform hover:-translate-y-0.5 disabled:opacity-70"
                    >
                      {loading ? 'Verifying...' : 'Verify OTP & Continue'}
                    </button>
                    <div className="text-center mt-4 space-y-3">
                      <div className="text-sm font-medium text-slate-500">
                        {timer > 0 ? (
                          `Resend OTP in ${timer}s`
                        ) : (
                          <button type="button" onClick={handleCheckMobile} className="text-pharmacy-600 font-bold hover:underline">
                            Resend OTP Now
                          </button>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 pt-1">
                        {pharmacyName && (
                          <button type="button" onClick={() => transitionToStep(2)} className="text-sm font-semibold text-pharmacy-600 hover:text-pharmacy-800">
                            Prefer password? Sign in with Password
                          </button>
                        )}
                        <button type="button" onClick={() => transitionToStep(1)} className="text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center w-full">
                          <ArrowLeft className="w-4 h-4 mr-1" /> Change Details
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <OtpVerificationAnimation status={otpVerificationStatus} otpDigits={otp} />
                )}
              </form>
            )}

            {/* STEP 4: REGISTER */}
            {step === 4 && (
              <form className="space-y-3" onSubmit={handleRegister}>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Store className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="text" required value={pharmacyName} onChange={e => setPharmacyName(e.target.value)} placeholder="Pharmacy Name" className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pharmacy-500" />
                </div>
                {!hasExistingProfileData ? (
                  <>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-slate-400" />
                      </div>
                      <input type="text" required value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Owner Name" className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pharmacy-500" />
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <Mail className="h-5 w-5 text-slate-400" />
                      </div>
                      <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="Official Email Address" className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pharmacy-500" />
                    </div>
                    <div className="relative">
                      <div className="absolute top-2.5 left-0 pl-3.5 flex pointer-events-none">
                        <Store className="h-5 w-5 text-slate-400" />
                      </div>
                      <textarea required value={address} onChange={e => setAddress(e.target.value)} placeholder="Full Address" rows={2} className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pharmacy-500 resize-none"></textarea>
                    </div>
                    {!isExistingUser && (
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                          <Lock className="h-5 w-5 text-slate-400" />
                        </div>
                        <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a strong password" className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pharmacy-500" />
                      </div>
                    )}
                  </>
                ) : (
                  <div className="bg-emerald-50 text-emerald-800 text-xs font-medium p-3 rounded-lg border border-emerald-200 text-center mb-2">
                    We will use your existing Owner Name and Address for this new account.
                  </div>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-pharmacy-500/30 text-base font-bold text-white bg-pharmacy-600 hover:bg-pharmacy-700 focus:outline-none transition-all transform hover:-translate-y-0.5 disabled:opacity-70"
                >
                  {loading ? 'Activating 15-Day Free Trial...' : 'Activate 15-Day Free Trial & Open POS'}
                  <ArrowRight className="ml-2 w-5 h-5" />
                </button>
              </form>
            )}

            {/* STEP 5: STAFF LOGIN */}
            {step === 5 && (
              <form className="space-y-4" onSubmit={handleStaffLogin}>

                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Phone className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="tel" 
                    required 
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-lg font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all shadow-sm" 
                    placeholder="Pharmacy Mobile Number" 
                  />
                </div>
                
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <KeyRound className="h-5 w-5 text-slate-400" />
                  </div>
                  <input 
                    type="password" 
                    required 
                    maxLength={4}
                    value={staffPin}
                    onChange={(e) => setStaffPin(e.target.value.replace(/\D/g, ''))}
                    className="block w-full pl-12 pr-4 py-3.5 bg-white border border-slate-200 rounded-xl text-lg font-medium tracking-widest placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-transparent transition-all shadow-sm font-mono" 
                    placeholder="4-Digit PIN" 
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-pharmacy-500/30 text-base font-bold text-white bg-pharmacy-600 hover:bg-pharmacy-700 focus:outline-none transition-all transform hover:-translate-y-0.5 disabled:opacity-70"
                >
                  {loading ? 'Logging in...' : 'Login as Staff'}
                </button>
                
                <div className="mt-4 text-center">
                  <button type="button" onClick={() => transitionToStep(1)} className="text-sm font-semibold text-slate-500 hover:text-slate-800 inline-flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Owner Login
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      </div>
    
      {/* Success Overlay */}
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-[2rem] shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center transform scale-100 animate-in zoom-in duration-300">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-4 shadow-[0_0_20px_rgba(16,185,129,0.2)] animate-bounce" style={{ animationDuration: '2s' }}>
              <CheckCircle className="w-10 h-10 text-emerald-500" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2 text-center">
              {step === 2 ? 'Welcome Back!' : 'Account Created!'}
            </h2>
            <p className="text-slate-500 font-medium text-sm animate-pulse text-center">
              Taking you to your dashboard...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
