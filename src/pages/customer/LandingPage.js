// src/pages/customer/LandingPage.js

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import Footer from '../../components/Footer';
import BookingWizardModal from '../../components/BookingWizardModal';
import ConfirmModal from '../../components/ConfirmModal';

export default function LandingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [featured, setFeatured] = useState([]);
  const [metalFrames, setMetalFrames] = useState([]);
  const [plasticFrames, setPlasticFrames] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);

  // Carousel States & Refs
  const [featuredPage, setFeaturedPage] = useState(0);
  const [metalPage, setMetalPage] = useState(0);
  const [plasticPage, setPlasticPage] = useState(0);
  const [packagePage, setPackagePage] = useState(0);

  const featuredRef = useRef(null);
  const metalRef = useRef(null);
  const plasticRef = useRef(null);
  const packageRef = useRef(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'inventory'));
        const allProducts = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.isActive !== false) {
            allProducts.push({ id: doc.id, ...data });
          }
        });

        const sorted = allProducts.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        const frames = sorted.filter(p => p.category === 'Metal Frame' || p.category === 'Plastic Frame');
        
        setFeatured(frames.slice(0, 6));
        setMetalFrames(sorted.filter(p => p.category === 'Metal Frame').slice(0, 6));
        setPlasticFrames(sorted.filter(p => p.category === 'Plastic Frame').slice(0, 6));
        setPackages(sorted.filter(p => p.category === 'Package').slice(0, 6));

      } catch (error) {
        console.error('Error loading products:', error);
      }
      setLoading(false);
    };
    loadProducts();
  }, []);

  const handleBookClick = () => {
    if (!currentUser) {
      setAlertConfig({ 
        type: 'error', 
        title: 'Login Required', 
        message: 'Please login or create an account to book an appointment.' 
      });
      return;
    }
    setShowBookingModal(true);
  };

  // ✅ Scroll handler for dots
  const scrollToPage = (ref, page, setPage) => {
    setPage(page);
    if (ref.current) {
      // On mobile, scroll horizontally. On desktop, it just changes the slice.
      const cardWidth = ref.current.firstChild?.clientWidth || 0;
      ref.current.scrollTo({ left: page * (cardWidth + 16), behavior: 'smooth' }); // 16 is the gap-4
    }
  };

  const renderDots = (current, total, setCurrent, ref) => {
    if (total <= 1) return null;
    return (
      <div className="flex justify-center gap-1.5 mt-4">
        {[...Array(total)].map((_, i) => (
          <button 
            key={i} 
            onClick={() => scrollToPage(ref, i, setCurrent)}
            className={`w-2 h-2 rounded-full transition-colors ${current === i ? 'bg-[#4A90E2] w-4' : 'bg-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  // ✅ Reusable Product Card class
  const cardClass = "min-w-[85vw] sm:min-w-[45vw] md:min-w-0 snap-center shrink-0";

  return (
    <div className="min-h-screen bg-white flex flex-col scroll-smooth">
      
      {/* ✅ GRAY BACKGROUND SECTION (Search + Hero) */}
      <div className="bg-gray-100 w-full pb-12 pt-6">
        
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <div className="relative flex items-center bg-white border border-gray-300 shadow-sm rounded-full overflow-hidden">
            <input type="text" placeholder="Search" className="flex-1 px-6 py-3 text-sm outline-none bg-transparent placeholder-gray-400" />
            <div className="h-6 w-px bg-gray-300"></div>
            <select className="px-4 py-3 text-sm bg-transparent outline-none cursor-pointer text-gray-700 font-medium appearance-none pr-8">
              <option>All Categories</option>
              <option>Metal Frame</option>
              <option>Plastic Frame</option>
            </select>
            <div className="h-6 w-px bg-gray-300"></div>
            <Link to="/customer/products" className="px-5 py-3 text-gray-600 hover:text-[#4A90E2] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </Link>
          </div>
        </div>

        <div className="w-full max-w-[1440px] mx-auto px-4">
          <section className="relative flex flex-col md:flex-row items-stretch rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-200">
            <div className="relative z-10 w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Find the right frames <br /><span className="text-[#4A90E2]">for you</span>
              </h1>
              <p className="text-gray-600 text-sm md:text-base mt-4 max-w-md">Explore our eyewear collection and prepare for your next clinic visit.</p>
              <div className="flex gap-3 pt-6 flex-wrap">
                <Link to="/customer/products" className="bg-[#4A90E2] text-white px-6 py-3 rounded-md font-medium text-sm hover:bg-[#4A90E2]/90 transition-colors flex items-center gap-2 shadow-sm">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                  Browse Products
                </Link>
                <button onClick={handleBookClick} className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  Book an Appointment
                </button>
              </div>
            </div>
            <div className="w-full md:w-1/2 relative bg-white">
              <img src="/images/aoc.jpg" alt="Eyewear Collection" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent pointer-events-none"></div>
            </div>
          </section>
        </div>
      </div>

      {/* ✅ REST OF THE PAGE */}
      <div className="flex-1 w-full max-w-[1440px] mx-auto px-4 py-6 space-y-16">
        
        {/* FEATURED / OPTOMETRIST RECOMMENDATION */}
        {featured.length > 0 && (
          <section id="featured">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Optometrist's Recommendation</h2>
            
            {/* ✅ Horizontal Scroll on Mobile, Grid on Desktop */}
            <div ref={featuredRef} className="flex md:grid md:grid-cols-2 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 scrollbar-hide">
              {featured.slice(featuredPage * 2, featuredPage * 2 + 2).map((product) => (
                <Link to={`/customer/products/${product.id}`} key={product.id} className={`group cursor-pointer block ${cardClass}`}>
                  <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-3 relative">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                    )}
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 text-lg">{product.name}</h3>
                      <p className="font-bold text-gray-900">₱ {Number(product.price).toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="hidden md:block">{renderDots(featuredPage, Math.ceil(featured.length / 2), setFeaturedPage, featuredRef)}</div>
          </section>
        )}

        {/* PILL NAVIGATION */}
        <div className="flex justify-center gap-2 flex-wrap py-4 border-y border-gray-100">
          <Link to="/customer/products" className="px-4 py-1.5 bg-white border border-gray-300 text-gray-600 rounded-full text-sm font-medium hover:border-[#4A90E2] hover:text-[#4A90E2]">All Frames</Link>
          <a href="#metal-frames" className="px-4 py-1.5 bg-white border border-gray-300 text-gray-600 rounded-full text-sm font-medium hover:border-[#4A90E2] hover:text-[#4A90E2]">Metal Frame</a>
          <a href="#plastic-frames" className="px-4 py-1.5 bg-white border border-gray-300 text-gray-600 rounded-full text-sm font-medium hover:border-[#4A90E2] hover:text-[#4A90E2]">Plastic Frame</a>
          <a href="#packages" className="px-4 py-1.5 bg-white border border-gray-300 text-gray-600 rounded-full text-sm font-medium hover:border-[#4A90E2] hover:text-[#4A90E2]">By Package</a>
        </div>

        {/* METAL FRAMES */}
        {metalFrames.length > 0 && (
          <section id="metal-frames">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Metal Frames</h2>
              <Link to="/customer/products" className="text-sm font-medium text-gray-900 hover:text-[#4A90E2]">View more &gt;</Link>
            </div>
            <div ref={metalRef} className="flex md:grid md:grid-cols-2 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 scrollbar-hide">
              {metalFrames.slice(metalPage * 2, metalPage * 2 + 2).map((product) => (
                <Link to={`/customer/products/${product.id}`} key={product.id} className={`group cursor-pointer block ${cardClass}`}>
                  <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-3 relative">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                    )}
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 text-lg">{product.name}</h3>
                      <p className="font-bold text-gray-900">₱ {Number(product.price).toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="hidden md:block">{renderDots(metalPage, Math.ceil(metalFrames.length / 2), setMetalPage, metalRef)}</div>
          </section>
        )}

        {/* PLASTIC FRAMES */}
        {plasticFrames.length > 0 && (
          <section id="plastic-frames">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Plastic Frames</h2>
              <Link to="/customer/products" className="text-sm font-medium text-gray-900 hover:text-[#4A90E2]">View more &gt;</Link>
            </div>
            <div ref={plasticRef} className="flex md:grid md:grid-cols-2 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 scrollbar-hide">
              {plasticFrames.slice(plasticPage * 2, plasticPage * 2 + 2).map((product) => (
                <Link to={`/customer/products/${product.id}`} key={product.id} className={`group cursor-pointer block ${cardClass}`}>
                  <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-3 relative">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300"><svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg></div>
                    )}
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 text-lg">{product.name}</h3>
                      <p className="font-bold text-gray-900">₱ {Number(product.price).toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="hidden md:block">{renderDots(plasticPage, Math.ceil(plasticFrames.length / 2), setPlasticPage, plasticRef)}</div>
          </section>
        )}

        {/* PACKAGES */}
        {packages.length > 0 && (
          <section id="packages">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Packages</h2>
              <Link to="/customer/products" className="text-sm font-medium text-gray-900 hover:text-[#4A90E2]">View more &gt;</Link>
            </div>
            <div ref={packageRef} className="flex md:grid md:grid-cols-2 gap-4 overflow-x-auto md:overflow-visible snap-x snap-mandatory pb-4 md:pb-0 scrollbar-hide">
              {packages.slice(packagePage * 2, packagePage * 2 + 2).map((product) => (
                <Link to={`/customer/products/${product.id}`} key={product.id} className={`group cursor-pointer block ${cardClass}`}>
                  <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-3 relative flex items-center justify-center">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>
                    )}
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium text-gray-900 text-lg">{product.name}</h3>
                      <p className="font-bold text-gray-900">₱ {Number(product.price).toLocaleString()}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
            <div className="hidden md:block">{renderDots(packagePage, Math.ceil(packages.length / 2), setPackagePage, packageRef)}</div>
          </section>
        )}

      </div>

      <Footer />

      {showBookingModal && (
        <BookingWizardModal 
          onClose={() => setShowBookingModal(false)} 
          onSuccess={() => setShowBookingModal(false)}
        />
      )}

      {alertConfig && (
        <ConfirmModal
          isOpen={true}
          title={alertConfig.title}
          message={alertConfig.message}
          iconType={alertConfig.type === 'success' ? 'success' : 'warning'}
          cancelText="Close"
          confirmText={alertConfig.type === 'success' ? 'OK' : 'Go to Login'}
          confirmColor={alertConfig.type === 'success' ? 'green' : 'blue'}
          isAlert={false} 
          onCancel={() => setAlertConfig(null)}
          onConfirm={() => {
            setAlertConfig(null);
            if (alertConfig.type !== 'success') navigate('/login');
          }}
        />
      )}

      {/* ✅ Utility class to hide scrollbar visually (Add to index.css if not supported inline) */}
      <style dangerouslySetInnerHTML={{__html: `
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />
    </div>
  );
}