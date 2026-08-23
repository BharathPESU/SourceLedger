import React, { useState, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Building2, 
  Briefcase, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  Globe, 
  Key, 
  Layers, 
  RefreshCw,
  Palette,
  FileText,
  Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { fetchUserProfile, updateUserProfile } from '../lib/api';
import { UserProfile } from '../types';

export const ProfileView: React.FC = () => {
  const { user, isEmailVerified } = useAuth();
  const email = user?.email || 'authenticated_user@sourceledger.io';

  const [fullName, setFullName] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [title, setTitle] = useState('Supply Chain & Catalog Specialist');
  const [company, setCompany] = useState('SourceLedger Enterprise');
  const [phone, setPhone] = useState('');
  const [addressLine1, setAddressLine1] = useState('');
  const [addressLine2, setAddressLine2] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [country, setCountry] = useState('United States');
  const [bio, setBio] = useState('Managing product intelligence, datasheets, and canonical catalog standards.');
  const [preferredLanguage, setPreferredLanguage] = useState('English');
  const [avatarColor, setAvatarColor] = useState('#E8622C');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Load Profile Data from Backend & LocalStorage
  useEffect(() => {
    loadProfile();
  }, [user]);

  const loadProfile = async () => {
    setIsLoading(true);
    try {
      // 1. Check backend SQLite user profile
      const data = await fetchUserProfile();
      if (data && data.profile) {
        const p = data.profile;
        setFullName(p.full_name || user?.user_metadata?.full_name || '');
        setDisplayName(p.display_name || user?.user_metadata?.name || email.split('@')[0]);
        setTitle(p.title || 'Supply Chain & Catalog Specialist');
        setCompany(p.company || 'SourceLedger Enterprise');
        setPhone(p.phone || '');
        setAddressLine1(p.address_line1 || '');
        setAddressLine2(p.address_line2 || '');
        setCity(p.city || '');
        setState(p.state || '');
        setZipCode(p.zip_code || '');
        setCountry(p.country || 'United States');
        setBio(p.bio || 'Managing product intelligence, datasheets, and canonical catalog standards.');
        setPreferredLanguage(p.preferred_language || 'English');
        setAvatarColor(p.avatar_color || '#E8622C');
      } else {
        // Fallback to local storage or user metadata
        const local = localStorage.getItem(`sourceledger_profile_${user?.id}`);
        if (local) {
          const p = JSON.parse(local);
          setFullName(p.full_name || '');
          setDisplayName(p.display_name || email.split('@')[0]);
          setTitle(p.title || 'Catalog Engineer');
          setCompany(p.company || '');
          setPhone(p.phone || '');
          setAddressLine1(p.address_line1 || '');
          setAddressLine2(p.address_line2 || '');
          setCity(p.city || '');
          setState(p.state || '');
          setZipCode(p.zip_code || '');
          setCountry(p.country || 'United States');
          setBio(p.bio || '');
        } else {
          setDisplayName(email.split('@')[0]);
          setFullName(user?.user_metadata?.full_name || '');
        }
      }
    } catch (err) {
      console.warn('Profile fetch notice:', err);
      setDisplayName(email.split('@')[0]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsSaving(true);

    const profileData: UserProfile = {
      full_name: fullName,
      display_name: displayName || email.split('@')[0],
      title: title,
      company: company,
      phone: phone,
      address_line1: addressLine1,
      address_line2: addressLine2,
      city: city,
      state: state,
      zip_code: zipCode,
      country: country,
      bio: bio,
      preferred_language: preferredLanguage,
      avatar_color: avatarColor,
    };

    localStorage.setItem(`sourceledger_profile_${user?.id}`, JSON.stringify(profileData));

    try {
      await updateUserProfile(profileData);
    } catch (err) {
      console.warn('Profile backend save notice:', err);
    } finally {
      setIsSaving(false);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  const initial = (displayName || fullName || email).charAt(0).toUpperCase();

  const colorOptions = [
    { label: 'Source Ledger Orange', value: '#E8622C' },
    { label: 'Charcoal Dark', value: '#191715' },
    { label: 'Emerald Forest', value: '#10B981' },
    { label: 'Royal Sapphire', value: '#3B82F6' },
    { label: 'Deep Purple', value: '#8B5CF6' },
    { label: 'Rose Crimson', value: '#F43F5E' },
  ];

  return (
    <div className="space-y-6 pb-20 max-w-6xl mx-auto">
      {/* Top Header Card with Glassmorphism */}
      <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 ring-1 ring-white/50 shadow-[0_8px_32px_rgba(26,23,21,0.05)] flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          {/* Avatar Badge with Custom Accent Color */}
          <div 
            style={{ backgroundColor: avatarColor }}
            className="w-16 h-16 rounded-2xl text-white flex items-center justify-center text-2xl font-bold shadow-lg shadow-black/10 shrink-0 ring-4 ring-white/80 transition-transform hover:scale-105"
          >
            {initial}
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="font-didone font-bold text-2xl sm:text-3xl text-[#191715] tracking-tight">
                {displayName || fullName || 'User Profile'}
              </h1>
              {isEmailVerified && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[11px] font-bold border border-emerald-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Verified
                </span>
              )}
            </div>

            <p className="text-xs text-[#5C554D] font-medium flex items-center gap-2">
              <span>{title}</span>
              {company && <span>• {company}</span>}
            </p>
            
            <p className="text-xs text-[#8C8276] mt-0.5 font-mono">
              {email}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={loadProfile}
            className="p-2.5 rounded-full bg-white/60 hover:bg-white text-[#191715] border border-white/80 shadow-2xs transition-all cursor-pointer"
            title="Reload Profile Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => handleSave()}
            disabled={isSaving}
            className="px-6 py-2.5 rounded-full bg-gradient-to-r from-[#E8622C] to-[#D45320] hover:scale-[1.02] active:scale-[0.98] text-white text-xs font-bold shadow-md shadow-[#E8622C]/25 border border-white/20 flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {savedSuccess ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Save className="w-4 h-4" />}
            <span>{savedSuccess ? 'Profile Saved!' : isSaving ? 'Saving...' : 'Save Profile Changes'}</span>
          </button>
        </div>
      </div>

      {/* Main Profile Edit Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* Left Column (8 cols): Personal Details, Address, Bio */}
        <div className="lg:col-span-8 space-y-6">

          {/* Section 1: Personal & Professional Identity */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 ring-1 ring-white/50 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-white/60">
              <div className="w-8 h-8 rounded-xl bg-white/70 text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
                <User className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#191715]">Personal & Professional Identity</h3>
                <p className="text-xs text-[#8C8276]">Basic user name, job title, and organization info</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191715] flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#8C8276]" />
                  Full Legal Name
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Alex Morgan"
                  className="w-full text-xs font-medium bg-white/80 border border-white/90 rounded-2xl px-4 py-3 text-[#191715] focus:outline-none focus:ring-2 focus:ring-[#E8622C]/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191715] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#E8622C]" />
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="e.g. Alex M."
                  className="w-full text-xs font-medium bg-white/80 border border-white/90 rounded-2xl px-4 py-3 text-[#191715] focus:outline-none focus:ring-2 focus:ring-[#E8622C]/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191715] flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#8C8276]" />
                  Job Title / Role
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Supply Chain Engineer"
                  className="w-full text-xs font-medium bg-white/80 border border-white/90 rounded-2xl px-4 py-3 text-[#191715] focus:outline-none focus:ring-2 focus:ring-[#E8622C]/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191715] flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-[#8C8276]" />
                  Company / Organization
                </label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="e.g. Acme Industrial Dynamics"
                  className="w-full text-xs font-medium bg-white/80 border border-white/90 rounded-2xl px-4 py-3 text-[#191715] focus:outline-none focus:ring-2 focus:ring-[#E8622C]/40"
                />
              </div>
            </div>

            {/* Bio / Description */}
            <div className="space-y-1.5 pt-2">
              <label className="text-xs font-bold text-[#191715] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#8C8276]" />
                Professional Summary & Bio
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Brief summary of your responsibilities or catalog focus..."
                className="w-full text-xs font-medium bg-white/80 border border-white/90 rounded-2xl p-4 text-[#191715] focus:outline-none focus:ring-2 focus:ring-[#E8622C]/40 resize-none"
              />
            </div>
          </div>

          {/* Section 2: Contact & Location Address */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 sm:p-8 border border-white/80 ring-1 ring-white/50 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-4 border-b border-white/60">
              <div className="w-8 h-8 rounded-xl bg-white/70 text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#191715]">Contact Details & Physical Address</h3>
                <p className="text-xs text-[#8C8276]">Phone number, billing and organization address</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191715] flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#8C8276]" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 019-2834"
                  className="w-full text-xs font-medium bg-white/80 border border-white/90 rounded-2xl px-4 py-3 text-[#191715] focus:outline-none focus:ring-2 focus:ring-[#E8622C]/40"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191715] flex items-center gap-1.5">
                  <Globe className="w-3.5 h-3.5 text-[#8C8276]" />
                  Country / Region
                </label>
                <select
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  className="w-full text-xs font-semibold bg-white/80 border border-white/90 rounded-2xl px-4 py-3 text-[#191715] focus:outline-none"
                >
                  <option value="United States">United States</option>
                  <option value="Canada">Canada</option>
                  <option value="United Kingdom">United Kingdom</option>
                  <option value="Germany">Germany</option>
                  <option value="India">India</option>
                  <option value="Japan">Japan</option>
                  <option value="Australia">Australia</option>
                  <option value="Singapore">Singapore</option>
                  <option value="Other">Other Country</option>
                </select>
              </div>
            </div>

            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#191715]">Street Address Line 1</label>
                <input
                  type="text"
                  value={addressLine1}
                  onChange={(e) => setAddressLine1(e.target.value)}
                  placeholder="100 Technology Parkway, Suite 400"
                  className="w-full text-xs font-medium bg-white/80 border border-white/90 rounded-2xl px-4 py-3 text-[#191715] focus:outline-none focus:ring-2 focus:ring-[#E8622C]/40"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#191715]">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    placeholder="San Francisco"
                    className="w-full text-xs font-medium bg-white/80 border border-white/90 rounded-2xl px-4 py-3 text-[#191715] focus:outline-none focus:ring-2 focus:ring-[#E8622C]/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#191715]">State / Province</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    placeholder="California"
                    className="w-full text-xs font-medium bg-white/80 border border-white/90 rounded-2xl px-4 py-3 text-[#191715] focus:outline-none focus:ring-2 focus:ring-[#E8622C]/40"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-[#191715]">Postal / ZIP Code</label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="94105"
                    className="w-full text-xs font-medium bg-white/80 border border-white/90 rounded-2xl px-4 py-3 text-[#191715] focus:outline-none focus:ring-2 focus:ring-[#E8622C]/40"
                  />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column (4 cols): Account Security, Avatar Accent, Telemetry */}
        <div className="lg:col-span-4 space-y-6">

          {/* Avatar Customization & Preferences */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 border border-white/80 ring-1 ring-white/50 shadow-sm space-y-5">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/60">
              <div className="w-8 h-8 rounded-xl bg-white/70 text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
                <Palette className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#191715]">Avatar Style & Color</h3>
                <p className="text-xs text-[#8C8276]">Personalize your badge theme</p>
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-xs font-bold text-[#191715] block">Badge Theme Accent</label>
              <div className="grid grid-cols-3 gap-2">
                {colorOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setAvatarColor(opt.value)}
                    className={`p-2.5 rounded-2xl border text-left flex items-center gap-2 transition-all cursor-pointer ${
                      avatarColor === opt.value
                        ? 'border-[#E8622C] bg-white shadow-xs ring-1 ring-[#E8622C]/30'
                        : 'border-white/80 bg-white/50 hover:bg-white'
                    }`}
                  >
                    <div 
                      style={{ backgroundColor: opt.value }}
                      className="w-4 h-4 rounded-full shrink-0 shadow-2xs"
                    />
                    <span className="text-[11px] font-bold text-[#191715] truncate">
                      {opt.label.split(' ')[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-white/60">
              <label className="text-xs font-bold text-[#191715]">Interface Language</label>
              <select
                value={preferredLanguage}
                onChange={(e) => setPreferredLanguage(e.target.value)}
                className="w-full text-xs font-semibold bg-white/80 border border-white/90 rounded-2xl px-4 py-2.5 text-[#191715] focus:outline-none"
              >
                <option value="English">English (United States)</option>
                <option value="Spanish">Spanish (Español)</option>
                <option value="German">German (Deutsch)</option>
                <option value="Japanese">Japanese (日本語)</option>
              </select>
            </div>
          </div>

          {/* Account Security & Supabase Info */}
          <div className="bg-white/70 backdrop-blur-2xl rounded-3xl p-6 border border-white/80 ring-1 ring-white/50 shadow-sm space-y-4 text-xs">
            <div className="flex items-center gap-2.5 pb-3 border-b border-white/60">
              <div className="w-8 h-8 rounded-xl bg-white/70 text-[#E8622C] flex items-center justify-center border border-white/80 shadow-2xs">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#191715]">Account Security</h3>
                <p className="text-xs text-[#8C8276]">Authentication details & session status</p>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white/60 border border-white/80 space-y-2.5">
              <div className="flex justify-between items-center">
                <span className="text-[#8C8276]">Primary Email:</span>
                <span className="font-mono font-bold text-[#191715] truncate max-w-[150px]" title={email}>
                  {email}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8C8276]">Auth Provider:</span>
                <span className="font-bold text-emerald-600 uppercase">
                  {user?.app_metadata?.provider || 'Supabase Auth'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[#8C8276]">Account Status:</span>
                <span className="font-bold text-emerald-600">Active & Verified</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-[#FAF4EB] border border-[#E8622C]/20 text-[11px] text-[#5C554D] leading-relaxed">
              Your profile information is securely linked to your authenticated session ID (<code className="font-mono text-[10px] text-[#E8622C]">{user?.id ? `${user.id.substring(0, 12)}...` : 'active_user'}</code>) and isolated in the database.
            </div>
          </div>

        </div>
      </form>
    </div>
  );
};
