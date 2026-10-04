import { useState, useEffect } from 'react';
import { LogIn, ArrowRight, Shield, CheckCircle, TrendingUp, Activity, HeartPulse, Pill, ArrowLeft, Store, User, Lock, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import OtpVerificationAnimation from '../components/auth/OtpVerificationAnimation';

const hostname = window.location.hostname || 'localhost';
const API_BASE = `http://${hostname}:3000/api`;

export default function Login() {
  const navigate = useNavigate();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
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
  const [timer, setTimer] = useState(60);
  const [otpVerificationStatus, setOtpVerificationStatus] = useState<'idle' | 'verifying' | 'success'>('idle');
  const [businessType, setBusinessType] = useState<'RETAIL' | 'WHOLESALE'>('RETAIL');

  useEffect(() => {
    let interval: any;
    if (step === 3 && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  const transitionToStep = (newStep: 1 | 2 | 3 | 4) => {
    setIsAnimating(true);
    setTimeout(() => {
      setStep(newStep);
      setError('');
      setIsAnimating(false);
    }, 300);
  };

  const handleCheckMobile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) {
      setError('Please enter a valid 10-digit mobile number');
      return;
    }
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch(`${API_BASE}/auth/check-mobile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, email: email || 'davasetu.otp@gmail.com' })
      });
      const data = await response.json();
      
      if (data.exists) {
        setPharmacyName(data.pharmacyName);
        transitionToStep(2); // Go to login
      } else {
        setTimer(60); // Reset timer
        setOtp(['', '', '', '', '', '']); // Clear old OTP on new request or resend
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
        body: JSON.stringify({ phone, password, businessType })
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
          navigate(businessType === 'WHOLESALE' ? '/wholesale-dashboard' : '/dashboard');
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

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otpVerificationStatus !== 'idle') return;

    const otpCode = otp.join('');
    if (otpCode.length < 6) {
      setError('Please enter full OTP');
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
      const minDelay = new Promise(resolve => setTimeout(resolve, 1500));
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
          transitionToStep(4);
        }, 2000);
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

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_BASE}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, password, ownerName, pharmacyName, address, businessType })
      });
      const data = await response.json();

      if (data.success) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('pharmacy_profile_data', JSON.stringify(data.pharmacy));
        localStorage.setItem('business_type', businessType);
        
        setIsRedirecting(true);
        setTimeout(() => {
          navigate(businessType === 'WHOLESALE' ? '/wholesale-dashboard' : '/dashboard');
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
            {businessType === 'RETAIL' ? (
              <>Empower Your <br /><span className="text-emerald-300">Pharmacy Business</span></>
            ) : (
              <>Scale Your <br /><span className="text-indigo-300">B2B Wholesale</span></>
            )}
          </h1>
          <p className="mt-5 text-lg text-white/90 max-w-md leading-relaxed">
            {businessType === 'RETAIL' 
              ? 'Join the fastest growing network of digital pharmacies. Streamline orders, manage billing, and grow your customer base seamlessly.'
              : 'The ultimate distribution platform. Manage bulk orders, B2B clients, smart trade schemes, and wholesale ledgers effortlessly.'}
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
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  {businessType === 'RETAIL' ? 'Sign in or Join' : 'B2B Wholesale Portal'}
                </h2>
                <p className="mt-2 text-slate-500 font-medium text-sm">
                  {businessType === 'RETAIL' ? 'Enter your mobile number to get started' : 'Login or Create Wholesale Account'}
                </p>
              </>
            )}
            {step === 2 && (
              <>
                <div className="w-16 h-16 bg-pharmacy-100 rounded-full flex items-center justify-center mx-auto mb-3 shadow-sm border border-pharmacy-200">
                  <Store className="w-8 h-8 text-pharmacy-600" />
                </div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">{pharmacyName}</h2>
                <p className="mt-1 text-slate-500 font-medium text-sm">
                  {businessType === 'WHOLESALE' ? 'Wholesale Account • ' : 'Retail Account • '}{phone}
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
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">Complete Profile</h2>
                <p className="mt-2 text-slate-500 font-medium text-sm">
                  Just a few more details to create your {businessType === 'WHOLESALE' ? 'wholesale business' : 'pharmacy'}
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

            {/* STEP 1: MOBILE */}
            {step === 1 && (
              <form className="space-y-4" onSubmit={handleCheckMobile}>
                
                <div className="flex bg-slate-100 p-1 rounded-xl mb-6 shadow-inner">
                  <button
                    type="button"
                    onClick={() => setBusinessType('RETAIL')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                      businessType === 'RETAIL' 
                        ? 'bg-white text-pharmacy-700 shadow-sm border border-slate-200' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Retail Pharmacy
                  </button>
                  <button
                    type="button"
                    onClick={() => setBusinessType('WHOLESALE')}
                    className={`flex-1 py-2.5 text-sm font-bold rounded-lg transition-all ${
                      businessType === 'WHOLESALE' 
                        ? 'bg-white text-pharmacy-700 shadow-sm border border-slate-200' 
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    Wholesale (B2B)
                  </button>
                </div>

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
                    required 
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    maxLength={10}
                    className="block w-full pl-3 pr-4 py-3.5 bg-transparent text-lg font-bold text-slate-800 placeholder-slate-400 focus:outline-none" 
                    placeholder="Mobile Number" 
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
                    placeholder="Email (for new registration OTP)" 
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="group w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-pharmacy-500/30 text-base font-bold text-white bg-pharmacy-600 hover:bg-pharmacy-700 focus:outline-none transition-all transform hover:-translate-y-0.5 disabled:opacity-70"
                >
                  {loading ? 'Checking...' : 'Continue'}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </button>
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
                  <button type="button" className="text-sm font-semibold text-pharmacy-600 hover:text-pharmacy-800">
                    Forgot password?
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: VERIFY OTP */}
            {step === 3 && (
              <form className="space-y-6" onSubmit={handleVerifyOTP}>
                {otpVerificationStatus === 'idle' ? (
                  <>
                    <div className="flex justify-center gap-3">
                      {otp.map((digit, index) => (
                        <input
                          key={index}
                          type="text"
                          maxLength={1}
                          required
                          value={digit}
                          onChange={(e) => {
                            const newOtp = [...otp];
                            newOtp[index] = e.target.value.replace(/\D/g, '');
                            setOtp(newOtp);
                            if (e.target.value && index < 5) {
                              document.getElementById(`otp-${index + 1}`)?.focus();
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Backspace' && !digit && index > 0) {
                              document.getElementById(`otp-${index - 1}`)?.focus();
                            }
                          }}
                          id={`otp-${index}`}
                          className="w-14 h-14 text-center text-2xl font-bold bg-white border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-pharmacy-500 focus:border-pharmacy-500 shadow-sm"
                        />
                      ))}
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-pharmacy-500/30 text-base font-bold text-white bg-pharmacy-600 hover:bg-pharmacy-700 focus:outline-none transition-all transform hover:-translate-y-0.5 disabled:opacity-70"
                    >
                      Verify
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
                      <button type="button" onClick={() => transitionToStep(1)} className="text-sm font-semibold text-slate-500 hover:text-slate-800 flex items-center justify-center w-full">
                        <ArrowLeft className="w-4 h-4 mr-1" /> Change Details
                      </button>
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
                  <input type="text" required value={pharmacyName} onChange={e => setPharmacyName(e.target.value)} placeholder={businessType === 'WHOLESALE' ? "Wholesale Business Name" : "Pharmacy Name"} className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pharmacy-500" />
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <User className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="text" required value={ownerName} onChange={e => setOwnerName(e.target.value)} placeholder="Owner Name" className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pharmacy-500" />
                </div>
                <div className="relative">
                  <div className="absolute top-2.5 left-0 pl-3.5 flex pointer-events-none">
                    <Store className="h-5 w-5 text-slate-400" />
                  </div>
                  <textarea required value={address} onChange={e => setAddress(e.target.value)} placeholder="Full Address" rows={2} className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pharmacy-500 resize-none"></textarea>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-400" />
                  </div>
                  <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="Create a strong password" className="block w-full pl-11 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-pharmacy-500" />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-4 w-full flex justify-center items-center py-3.5 px-4 rounded-xl shadow-lg shadow-pharmacy-500/30 text-base font-bold text-white bg-pharmacy-600 hover:bg-pharmacy-700 focus:outline-none transition-all transform hover:-translate-y-0.5 disabled:opacity-70"
                >
                  {loading ? 'Creating Account...' : 'Complete Registration'}
                </button>
              </form>
            )}

          </div>
        </div>
      </div>
    
      {/* Success Overlay */}
      {isRedirecting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-opacity duration-300">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 flex flex-col items-center transform scale-100 animate-in zoom-in duration-300">
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
