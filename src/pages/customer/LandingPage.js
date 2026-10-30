// src/pages/customer/LandingPage.js

import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import Footer from '../../components/Footer';
import BookingWizardModal from '../../components/BookingWizardModal';
import ConfirmModal from '../../components/ConfirmModal';

function LandingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [bestSellers, setBestSellers] = useState([]);
  const [metalFrames, setMetalFrames] = useState([]);
  const [plasticFrames, setPlasticFrames] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal & Alert States
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);

  // Carousel State
  const [bestSellerPage, setBestSellerPage] = useState(0);
  const [metalPage, setMetalPage] = useState(0);
  const [plasticPage, setPlasticPage] = useState(0);

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

        const sorted = allProducts.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

        const frames = sorted.filter(p => p.category === 'Metal Frame' || p.category === 'Plastic Frame');
        setBestSellers(frames.slice(0, 4));
        setMetalFrames(sorted.filter(p => p.category === 'Metal Frame').slice(0, 4));
        setPlasticFrames(sorted.filter(p => p.category === 'Plastic Frame').slice(0, 4));
        setPackages(sorted.filter(p => p.category === 'Package').slice(0, 4));

      } catch (error) {
        console.error('Error loading products:', error);
      }
      setLoading(false);
    };
    loadProducts();
  }, []);

  // ✅ Booking logic with Login Check
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

  const renderDots = (current, total, setCurrent) => {
    if (total <= 1) return null;
    return (
      <div className="flex justify-center gap-1.5 mt-4">
        {[...Array(total)].map((_, i) => (
          <button 
            key={i} 
            onClick={() => setCurrent(i)}
            className={`w-2 h-2 rounded-full transition-colors ${current === i ? 'bg-[#4A90E2]' : 'bg-gray-300'}`}
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

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* ✅ GRAY BACKGROUND SECTION (Search + Hero) */}
      <div className="bg-gray-100 w-full pb-12 pt-6">
        
        {/* TOP SEARCH BAR */}
        <div className="max-w-4xl mx-auto px-4 mb-8">
          <div className="relative flex items-center bg-white border border-gray-300 shadow-sm rounded-full overflow-hidden">
            <input 
              type="text" 
              placeholder="Search" 
              className="flex-1 px-6 py-3 text-sm outline-none bg-transparent placeholder-gray-400"
            />
            
            <div className="h-6 w-px bg-gray-300"></div>

            <select className="px-4 py-3 text-sm bg-transparent outline-none cursor-pointer text-gray-700 font-medium appearance-none pr-8">
              <option>All Categories</option>
              <option>Metal Frame</option>
              <option>Plastic Frame</option>
            </select>

            <div className="h-6 w-px bg-gray-300"></div>

            <Link to="/customer/products" className="px-5 py-3 text-gray-600 hover:text-[#4A90E2] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </Link>
          </div>
        </div>

                 {/* HERO SECTION */}
        <div className="max-w-7xl mx-auto px-4">
          <section className="relative flex flex-col md:flex-row items-stretch rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-200">
            
            {/* Left Side: Text Content */}
            <div className="relative z-10 w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Find the right frames <br />
                <span className="text-[#4A90E2]">for you</span>
              </h1>
              <p className="text-gray-600 text-sm md:text-base mt-4 max-w-md">
                Explore our eyewear collection and prepare for your next clinic visit.
              </p>
              <div className="flex gap-3 pt-6 flex-wrap">
                <Link 
                  to="/customer/products" 
                  className="bg-[#4A90E2] text-white px-6 py-3 rounded-md font-medium text-sm hover:bg-[#4A90E2]/90 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <span>👓</span> Browse Products
                </Link>
                <button 
                  onClick={handleBookClick}
                  className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                >
                  <span>📅</span> Book an Appointment
                </button>
              </div>
            </div>

            {/* Right Side: Image (Full Fit + Fade) */}
            <div className="w-full md:w-1/2 relative bg-white">
              
              {/* ✅ The Image now uses object-contain so it never crops */}
              <img 
                src="/images/aoc.jpg" 
                alt="Eyewear Collection"
                className="w-full h-full object-contain"
              />
              
              {/* ✅ Fade overlay to blend into the text */}
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent pointer-events-none"></div>
              
            </div>

          </section>
        </div>
      </div>

      {/* ✅ REST OF THE PAGE */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-4 py-6 space-y-12">
        
        {/* BEST SELLER CAROUSEL */}
        <section>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Best Seller</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {bestSellers.slice(bestSellerPage * 2, bestSellerPage * 2 + 2).map((product) => (
              <Link to={`/customer/products/${product.id}`} key={product.id} className="group cursor-pointer block">
                <div className="w-full aspect-[4/3] bg-gray-100 rounded-xl overflow-hidden mb-3 relative">
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-6xl text-gray-200">🖼️</div>
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
          {renderDots(bestSellerPage, Math.ceil(bestSellers.length / 2), setBestSellerPage)}
        </section>

        {/* ✅ PILL NAVIGATION */}
        <div className="flex justify-center gap-2 flex-wrap py-4 border-y border-gray-100">
          <Link to="/customer/products" className="px-4 py-1.5 bg-[#4A90E2] text-white rounded-full text-sm font-medium">All Frames</Link>
          <Link to="/customer/products" className="px-4 py-1.5 bg-white border border-gray-300 text-gray-600 rounded-full text-sm font-medium hover:border-[#4A90E2] hover:text-[#4A90E2]">Metal Frame</Link>
          <Link to="/customer/products" className="px-4 py-1.5 bg-white border border-gray-300 text-gray-600 rounded-full text-sm font-medium hover:border-[#4A90E2] hover:text-[#4A90E2]">Plastic Frame</Link>
          <Link to="/customer/products" className="px-4 py-1.5 bg-white border border-gray-300 text-gray-600 rounded-full text-sm font-medium hover:border-[#4A90E2] hover:text-[#4A90E2]">By Package</Link>
        </div>

        {/* METAL FRAMES */}
        {metalFrames.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Metal Frames</h2>
              <Link to="/customer/products" className="text-sm font-medium text-gray-900 hover:text-[#4A90E2]">View more &gt;</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {metalFrames.slice(metalPage * 2, metalPage * 2 + 2).map((product) => (
                <Link to={`/customer/products/${product.id}`} key={product.id} className="group cursor-pointer block">
                  <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200">🖼️</div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{product.name}</h3>
                    <p className="font-bold text-gray-900 text-sm">₱ {Number(product.price).toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
            {renderDots(metalPage, Math.ceil(metalFrames.length / 2), setMetalPage)}
          </section>
        )}

        {/* PLASTIC FRAMES */}
        {plasticFrames.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Plastic Frames</h2>
              <Link to="/customer/products" className="text-sm font-medium text-gray-900 hover:text-[#4A90E2]">View more &gt;</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {plasticFrames.slice(plasticPage * 2, plasticPage * 2 + 2).map((product) => (
                <Link to={`/customer/products/${product.id}`} key={product.id} className="group cursor-pointer block">
                  <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl text-gray-200">🖼️</div>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900 text-sm">{product.name}</h3>
                    <p className="font-bold text-gray-900 text-sm">₱ {Number(product.price).toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
            {renderDots(plasticPage, Math.ceil(plasticFrames.length / 2), setPlasticPage)}
          </section>
        )}

        {/* PACKAGES */}
        {packages.length > 0 && (
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Packages</h2>
              <Link to="/customer/products" className="text-sm font-medium text-gray-900 hover:text-[#4A90E2]">View more &gt;</Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {packages.map((product) => (
                <Link to={`/customer/products/${product.id}`} key={product.id} className="group cursor-pointer block">
                  <div className="w-full aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3 flex items-center justify-center">
                    <span className="text-5xl text-gray-300">🎁</span>
                  </div>
                  <h3 className="font-medium text-gray-900 text-sm">{product.name}</h3>
                  <p className="font-bold text-gray-900 text-sm">₱ {Number(product.price).toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

      </div>

      <Footer />

      {/* ✅ Booking Modal */}
      {showBookingModal && (
        <BookingWizardModal 
          onClose={() => setShowBookingModal(false)} 
          onSuccess={() => {
            setShowBookingModal(false);
          }}
        />
      )}

      {/* ✅ Login Required / Success Alerts */}
      {alertConfig && (
        <ConfirmModal
          isOpen={true}
          title={alertConfig.title}
          message={alertConfig.message}
          icon={alertConfig.type === 'success' ? '✅' : '⚠️'}
          confirmText={alertConfig.type === 'success' ? 'OK' : 'Go to Login'}
          confirmColor={alertConfig.type === 'success' ? 'green' : 'blue'}
          isAlert
          onConfirm={() => {
            setAlertConfig(null);
            if (alertConfig.type !== 'success') {
              navigate('/customer/login');
            }
          }}
        />
      )}
    </div>
  );
}

export default LandingPage;