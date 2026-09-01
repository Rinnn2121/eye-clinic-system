import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';

function LandingPage() {
  // ✅ STATE - Declared at the top of the component
  const [bestSellerProducts, setBestSellerProducts] = useState([]);
  const [womenProducts, setWomenProducts] = useState([]);
  const [menProducts, setMenProducts] = useState([]);
  const [kidsProducts, setKidsProducts] = useState([]);
  const [accessoriesProducts, setAccessoriesProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ useEffect - Runs when component loads
  useEffect(() => {
    const loadProducts = async () => {
      try {
        // Get all products from Firebase
        const querySnapshot = await getDocs(collection(db, 'inventory'));
        const allProducts = [];
        querySnapshot.forEach(doc => {
          allProducts.push({ id: doc.id, ...doc.data() });
        });

        // Sort by createdAt (newest first)
        const sortedProducts = allProducts.sort((a, b) => 
          new Date(b.createdAt) - new Date(a.createdAt)
        );

        // Get latest 4 for Best Seller
        setBestSellerProducts(sortedProducts.slice(0, 4));

        // Filter by category
        setWomenProducts(sortedProducts.filter(p => p.category === 'Women').slice(0, 4));
        setMenProducts(sortedProducts.filter(p => p.category === 'Men').slice(0, 4));
        setKidsProducts(sortedProducts.filter(p => p.category === 'Kids').slice(0, 4));
        setAccessoriesProducts(sortedProducts.filter(p => p.category === 'Accessories').slice(0, 4));

      } catch (error) {
        console.error('Error loading products:', error);
      }
      setLoading(false);
    };

    loadProducts();  // ✅ Call the function
  }, []);  // ✅ Empty dependency array = runs once when component loads

  // ✅ Helper function for placeholder images
  const getPlaceholderImage = (id) => {
    return `https://picsum.photos/seed/${id}/300/200`;
  };

  // ✅ Return JSX - The UI
  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-[1440px] mx-auto px-8 py-6">
        
        {/* Welcome Section */}
        <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-gray-100 mb-10">
          <img 
            src="/images/aoc.jpg" 
            alt="Welcome to Vitug-Sumaya Optical Clinic"
            className="absolute inset-0 w-full h-full object-contain"
          />
          <div className="absolute inset-0 bg-black/40"></div>
          <div className="absolute bottom-12 left-8 md:left-16 z-10">
            <h1 className="text-white text-2xl md:text-4xl lg:text-5xl font-bold leading-tight max-w-xl">
              Welcome to <br />
              <span className="text-[#4A90E2]">Vitug - Sumaya Optical Clinic</span>
            </h1>
            <Link 
              to="/customer/products" 
              className="inline-block mt-4 bg-[#4A90E2] text-white px-8 py-3 rounded-lg hover:bg-[#4A90E2]/80 transition-colors font-medium text-sm md:text-base"
            >
              Shop Now
            </Link>
          </div>
        </section>

        {/* Loading State */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#4A90E2] mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading products...</p>
          </div>
        ) : (
          <>
            {/* Best Seller Section */}
            <section className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Best Seller</h2>
                <Link to="/customer/products" className="text-[#4A90E2] hover:underline text-sm font-medium">
                  View more »
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {bestSellerProducts.map((product) => (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
                    <img 
                      src={getPlaceholderImage(product.id)}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                    <h3 className="font-medium text-gray-800 text-sm">{product.name}</h3>
                    <p className="text-[#4A90E2] font-bold text-sm">₱ {product.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Category Navigation */}
            <div className="flex justify-center gap-4 mb-10 flex-wrap">
              <Link to="/category/women" className="px-8 py-2 bg-[#4A90E2] text-white rounded-full hover:bg-[#4A90E2]/80 transition-colors text-sm font-medium">
                Women
              </Link>
              <Link to="/category/men" className="px-8 py-2 bg-[#4A90E2] text-white rounded-full hover:bg-[#4A90E2]/80 transition-colors text-sm font-medium">
                Men
              </Link>
              <Link to="/category/kids" className="px-8 py-2 bg-[#4A90E2] text-white rounded-full hover:bg-[#4A90E2]/80 transition-colors text-sm font-medium">
                Kids
              </Link>
              <Link to="/category/accessories" className="px-8 py-2 bg-[#4A90E2] text-white rounded-full hover:bg-[#4A90E2]/80 transition-colors text-sm font-medium">
                Accessories
              </Link>
            </div>

            {/* Women Section */}
            <section className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Women</h2>
                <Link to="/category/women" className="text-[#4A90E2] hover:underline text-sm font-medium">
                  View more »
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {womenProducts.map((product) => (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
                    <img 
                      src={getPlaceholderImage(product.id + 100)}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                    <h3 className="font-medium text-gray-800 text-sm">{product.name}</h3>
                    <p className="text-[#4A90E2] font-bold text-sm">₱ {product.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Men Section */}
            <section className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Men</h2>
                <Link to="/category/men" className="text-[#4A90E2] hover:underline text-sm font-medium">
                  View more »
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {menProducts.map((product) => (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
                    <img 
                      src={getPlaceholderImage(product.id + 200)}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                    <h3 className="font-medium text-gray-800 text-sm">{product.name}</h3>
                    <p className="text-[#4A90E2] font-bold text-sm">₱ {product.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Kids Section */}
            <section className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Kids</h2>
                <Link to="/category/kids" className="text-[#4A90E2] hover:underline text-sm font-medium">
                  View more »
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {kidsProducts.map((product) => (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
                    <img 
                      src={getPlaceholderImage(product.id + 300)}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                    <h3 className="font-medium text-gray-800 text-sm">{product.name}</h3>
                    <p className="text-[#4A90E2] font-bold text-sm">₱ {product.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Accessories Section */}
            <section className="mb-10">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Accessories</h2>
                <Link to="/category/accessories" className="text-[#4A90E2] hover:underline text-sm font-medium">
                  View more »
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {accessoriesProducts.map((product) => (
                  <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
                    <img 
                      src={getPlaceholderImage(product.id + 400)}
                      alt={product.name}
                      className="w-full h-40 object-cover rounded-lg mb-3"
                    />
                    <h3 className="font-medium text-gray-800 text-sm">{product.name}</h3>
                    <p className="text-[#4A90E2] font-bold text-sm">₱ {product.price.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </section>
          </>
        )}

      </div>
    </div>
  );
}

export default LandingPage;