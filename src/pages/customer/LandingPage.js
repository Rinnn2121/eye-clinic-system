// src/pages/customer/LandingPage.js

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { useAuth } from '../../contexts/AuthContext';
import Footer from '../../components/Footer';
import BookingWizardModal from '../../components/BookingWizardModal';
import ConfirmModal from '../../components/ConfirmModal';

// ✅ Reusable Swipeable Carousel
function SwipeableCarousel({ id, title, products, viewMoreLink = "/customer/products", maxItems }) {
  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef(null);

  const displayProducts = maxItems ? products.slice(0, maxItems) : products;

  const pages = [];
  for (let i = 0; i < displayProducts.length; i += 2) {
    pages.push(displayProducts.slice(i, i + 2));
  }

  const handleScroll = (e) => {
    const container = e.target;
    const pageIndex = Math.round(container.scrollLeft / container.offsetWidth);
    setCurrentPage(pageIndex);
  };

  const scrollToPage = (index) => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        left: index * scrollRef.current.offsetWidth,
        behavior: 'smooth'
      });
      setCurrentPage(index);
    }
  };

  const scrollByAmount = (direction) => {
    if (scrollRef.current) {
      const { current } = scrollRef;
      const scrollAmount = direction === 'left' ? -current.offsetWidth : current.offsetWidth;
      current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  if (displayProducts.length === 0) return null;

  return (
    <section id={id} className="relative scroll-mt-24 group">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-900">{title}</h2>
        <Link to={viewMoreLink} className="text-sm font-medium text-gray-900 hover:text-[#4A90E2]">View more &gt;</Link>
      </div>

      <div className="relative">
        {/* ✅ Left Arrow (Desktop only) */}
        <button 
          onClick={() => scrollByAmount('left')} 
          className="hidden md:flex absolute left-0 top-[40%] -translate-y-1/2 -ml-5 z-10 w-10 h-10 bg-white shadow-md border border-gray-200 rounded-full items-center justify-center text-gray-600 hover:text-[#4A90E2] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
        </button>

        {/* ✅ Right Arrow (Desktop only) */}
        <button 
          onClick={() => scrollByAmount('right')} 
          className="hidden md:flex absolute right-0 top-[40%] -translate-y-1/2 -mr-5 z-10 w-10 h-10 bg-white shadow-md border border-gray-200 rounded-full items-center justify-center text-gray-600 hover:text-[#4A90E2] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" /></svg>
        </button>

        {/* ✅ Re-applied hide-scrollbar class to hide the gray bar everywhere */}
        <div 
          ref={scrollRef}
          onScroll={handleScroll}
          className="flex overflow-x-auto snap-x snap-mandatory pb-4 hide-scrollbar"
        >
          {pages.map((pageProducts, pageIndex) => (
            <div 
              key={pageIndex} 
              className="w-full flex-shrink-0 snap-start flex gap-4 md:gap-6 pr-4 md:pr-0"
            >
              {pageProducts.map((product) => (
                <Link 
                  to={`/customer/products/${product.id}`} 
                  key={product.id} 
                  className="group/card cursor-pointer block w-1/2"
                >
                  <div className="w-full aspect-square bg-gray-50 rounded-xl overflow-hidden mb-4 flex items-center justify-center border border-gray-100 relative">
                    {product.imageUrl ? (
                      <img 
                        src={product.imageUrl} 
                        alt={product.name} 
                        className="w-full h-full object-contain p-4 group-hover/card:scale-105 transition-transform duration-500" 
                      />
                    ) : (
                      <div className="text-gray-300">
                        <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <h3 className="font-bold text-gray-900 text-base md:text-lg leading-tight truncate">{product.name}</h3>
                    <p className="font-bold text-gray-900 mt-1">₱ {Number(product.price).toLocaleString()}</p>
                  </div>
                </Link>
              ))}
              {pageProducts.length === 1 && <div className="w-1/2"></div>}
            </div>
          ))}
        </div>
      </div>

      {pages.length > 1 && (
        <div className="flex justify-center gap-1.5 mt-4">
          {pages.map((_, i) => (
            <button 
              key={i} 
              onClick={() => scrollToPage(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                currentPage === i ? 'w-6 bg-[#4A90E2]' : 'w-2 bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

function LandingPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [bestSellers, setBestSellers] = useState([]);
  const [metalFrames, setMetalFrames] = useState([]);
  const [plasticFrames, setPlasticFrames] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [activePill, setActivePill] = useState('all');

  const [searchQuery, setSearchQuery] = useState('');
  const [allProducts, setAllProducts] = useState([]); 
  const [searchResults, setSearchResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const [showBookingModal, setShowBookingModal] = useState(false);
  const [alertConfig, setAlertConfig] = useState(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'inventory'));
        const loadedProducts = [];
        querySnapshot.forEach(doc => {
          const data = doc.data();
          if (data.isActive !== false) {
            loadedProducts.push({ id: doc.id, ...data });
          }
        });

        const searchableProducts = loadedProducts.filter(p => 
          p.category === 'Metal Frame' || p.category === 'Plastic Frame'
        );
        setAllProducts(searchableProducts); 

        const sorted = loadedProducts.sort((a, b) => {
          if (a.isFeatured && !b.isFeatured) return -1;
          if (!a.isFeatured && b.isFeatured) return 1;
          return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        const frames = sorted.filter(p => p.category === 'Metal Frame' || p.category === 'Plastic Frame');
        
        const featuredFrames = frames.filter(p => p.isFeatured === true);
        setBestSellers(featuredFrames);
        
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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length === 0) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = allProducts.filter(p => 
      p.name?.toLowerCase().includes(query) || 
      p.category?.toLowerCase().includes(query)
    );

    setSearchResults(filtered.slice(0, 5)); 
    setShowDropdown(true);
  }, [searchQuery, allProducts]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/customer/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowDropdown(false);
    } else {
      navigate('/customer/products');
    }
  };

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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2]"></div>
      </div>
    );
  }

  const pillClass = (pillName) => 
    `px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
      activePill === pillName
        ? 'bg-[#4A90E2] text-white'
        : 'bg-white border border-gray-300 text-gray-600 hover:border-[#4A90E2] hover:text-[#4A90E2]'
    }`;

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* SEARCH & HERO */}
      <div className="bg-gray-100 w-full pb-12 pt-6">
        
        <div className="max-w-4xl mx-auto px-4 mb-8 relative" ref={dropdownRef}>
          <form onSubmit={handleSearch} className="relative flex items-center bg-white border border-gray-300 shadow-sm rounded-full overflow-hidden z-20 relative">
            <input 
              type="text" 
              placeholder="Search for frames..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => { if (searchQuery.trim()) setShowDropdown(true); }}
              className="flex-1 px-6 py-3 text-sm outline-none bg-transparent placeholder-gray-400"
            />
            <div className="h-6 w-px bg-gray-300"></div>
            <button type="submit" className="px-5 py-3 text-gray-600 hover:text-[#4A90E2] transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </button>
          </form>

          {showDropdown && (
            <div className="absolute top-full left-4 right-4 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 overflow-hidden z-50">
              {searchResults.length > 0 ? (
                <div className="py-2">
                  <p className="px-4 py-2 text-xs font-bold text-gray-400 uppercase tracking-wider">Products</p>
                  {searchResults.map(product => (
                    <Link 
                      key={product.id} 
                      to={`/customer/products/${product.id}`}
                      onClick={() => setShowDropdown(false)}
                      className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <div className="w-12 h-12 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0 flex items-center justify-center border border-gray-200">
                        {product.imageUrl ? (
                          <img src={product.imageUrl} alt={product.name} className="w-full h-full object-contain p-1" />
                        ) : (
                          <svg className="w-6 h-6 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">{product.name}</p>
                        <p className="text-xs text-gray-500">{product.category} • ₱{Number(product.price).toLocaleString()}</p>
                      </div>
                    </Link>
                  ))}
                  <div className="border-t border-gray-100 mt-2 pt-2">
                    <button 
                      onClick={handleSearch}
                      className="w-full text-left px-4 py-2 text-sm text-[#4A90E2] font-bold hover:bg-blue-50 transition-colors"
                    >
                      View all results for "{searchQuery}" →
                    </button>
                  </div>
                </div>
              ) : (
                <div className="p-6 text-center text-gray-500 text-sm">
                  No results found for "{searchQuery}"
                </div>
              )}
            </div>
          )}
        </div>

        <div className="w-full max-w-[1440px] mx-auto px-4">
          <section className="relative flex flex-col md:flex-row items-stretch rounded-2xl overflow-hidden bg-white shadow-sm border border-gray-200">            
            <div className="relative z-10 w-full md:w-1/2 p-8 md:p-12 lg:p-16 flex flex-col justify-center bg-white">
              
              <p className="text-[10px] font-bold text-[#4A90E2] uppercase tracking-widest mb-3">
                Welcome to Vitug-Sumaya Optical Clinic
              </p>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                Find the right frames <br />
                <span className="text-[#4A90E2]">for you</span>
              </h1>
              <p className="text-gray-600 text-sm md:text-base mt-4 max-w-md">
                Explore our eyewear collection and prepare for your next clinic visit.
              </p>
              
              <div className="flex gap-3 pt-6 flex-wrap">
                <button 
                  onClick={handleBookClick} 
                  className="bg-[#4A90E2] text-white px-6 py-3 rounded-md font-medium text-sm hover:bg-[#4A90E2]/90 transition-colors flex items-center gap-2 shadow-sm"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Book an Appointment
                </button>

                <Link 
                  to="/customer/products" 
                  className="bg-white border border-gray-300 text-gray-700 px-6 py-3 rounded-md font-medium text-sm hover:bg-gray-50 transition-colors shadow-sm flex items-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                  </svg>
                  Browse Products
                </Link>
              </div>
            </div>
            <div className="w-full md:w-1/2 relative bg-white">
              <img src="/images/aoc.jpg" alt="Eyewear Collection" className="w-full h-full object-contain" />
              <div className="absolute inset-0 bg-gradient-to-r from-white via-white/40 to-transparent pointer-events-none"></div>
            </div>
          </section>
        </div>
      </div>

      <div className="flex-1 w-full max-w-[1440px] mx-auto px-4 py-8 space-y-12">
        
        <SwipeableCarousel id="recommendation" title="Optometrist's Recommendation" products={bestSellers} />
        
        <div className="flex justify-center gap-2 flex-wrap py-4 border-y border-gray-100">
          <Link 
            to="/customer/products" 
            className={pillClass('all')}
            onClick={() => setActivePill('all')}
          >
            All Frames
          </Link>
          <a 
            href="#metal-frames" 
            className={pillClass('metal')}
            onClick={() => setActivePill('metal')}
          >
            Metal Frame
          </a>
          <a 
            href="#plastic-frames" 
            className={pillClass('plastic')}
            onClick={() => setActivePill('plastic')}
          >
            Plastic Frame
          </a>
          <a 
            href="#packages" 
            className={pillClass('package')}
            onClick={() => setActivePill('package')}
          >
            By Package
          </a>
        </div>

        <SwipeableCarousel id="metal-frames" title="Metal Frames" products={metalFrames} maxItems={6} />
        <SwipeableCarousel id="plastic-frames" title="Plastic Frames" products={plasticFrames} maxItems={6} />
        <SwipeableCarousel id="packages" title="Packages" products={packages} maxItems={6} />

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
          confirmText={alertConfig.type === 'success' ? 'OK' : 'Go to Login'}
          confirmColor={alertConfig.type === 'success' ? 'green' : 'blue'}
          isAlert
          onConfirm={() => {
            setAlertConfig(null);
            if (alertConfig.type !== 'success') navigate('/login');
          }}
        />
      )}
    </div>
  );
}

export default LandingPage;