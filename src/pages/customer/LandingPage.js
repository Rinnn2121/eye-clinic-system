import React from 'react';
import { Link } from 'react-router-dom';

function LandingPage() {
  // Sample products data
  const bestSellerProducts = [
    { id: 1, name: 'Product 1', price: 3000 },
    { id: 2, name: 'Product 2', price: 3000 },
    { id: 11, name: 'Product 3', price: 3000 },
    { id: 12, name: 'Product 24', price: 3000 },
  ];

  const womenProducts = [
    { id: 3, name: 'Product 1', price: 3000 },
    { id: 4, name: 'Product 2', price: 3000 },
  ];

  const menProducts = [
    { id: 5, name: 'Product 1', price: 3000 },
    { id: 6, name: 'Product 2', price: 3000 },
  ];

  const kidsProducts = [
    { id: 5, name: 'Product 1', price: 3000 },
    { id: 6, name: 'Product 2', price: 3000 },
  ];

  const accessoriesProducts = [
    { id: 7, name: 'Product 1', price: 3000 },
    { id: 8, name: 'Product 2', price: 3000 },
    { id: 9, name: 'Product 3', price: 6000 },
    { id: 10, name: 'Product 4', price: 6000 },
  ];

  return (
    <div className="min-h-screen bg-white">
      <div className="w-full max-w-[1440px] mx-auto">
        
                {/* Welcome Section with Background Image - object-contain */}
        <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden bg-gray-100">
          {/* Image with object-contain */}
          <img 
            src="/images/aoc.jpg" 
            alt="Welcome to Vitug-Sumaya Optical Clinic"
            className="absolute inset-0 w-full h-full object-contain"
          />
          
          {/* Dark overlay for better text readability */}
          <div className="absolute inset-0 bg-black/40"></div>
          
          {/* Content - Bottom Left */}
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

        {/* Best Seller Section */}
        <div className="px-8 py-6">
          <section className="mb-10">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">Best Seller</h2>
              <Link to="/customer/products" className="text-[#4A90E2] hover:underline text-sm font-medium">
                View more »
              </Link>
            </div>
            <div className="grid grid-cols-4 md:grid-cols-4 gap-4">
              {bestSellerProducts.map((product) => (
                <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg transition-shadow">
                  <div className="w-full h-40 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400">
                    🖼️
                  </div>
                  <h3 className="font-medium text-gray-800 text-sm">{product.name}</h3>
                  <p className="text-[#4A90E2] font-bold text-sm">₱ {product.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </section>

                    {/* Category Navigation - Big Circles with Images */}
          <div className="flex justify-center gap-8 md:gap-12 mb-10 flex-wrap">
            {/* Women Category */}
            <Link to="/category/women" className="flex flex-col items-center group">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-[#4A90E2] shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
                <img 
                  src="/images/women-cat.png" 
                  alt="Women"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-700 group-hover:text-[#4A90E2] transition-colors">
                Women
              </span>
            </Link>

            {/* Men Category */}
            <Link to="/category/men" className="flex flex-col items-center group">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-[#4A90E2] shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
                <img 
                  src="/images/men-cat.png" 
                  alt="Men"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-700 group-hover:text-[#4A90E2] transition-colors">
                Men
              </span>
            </Link>

            {/* Kids Category */}
            <Link to="/category/kids" className="flex flex-col items-center group">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-[#4A90E2] shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
                <img 
                  src="/images/kids-cat.png" 
                  alt="Kids"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-700 group-hover:text-[#4A90E2] transition-colors">
                Kids
              </span>
            </Link>

            {/* Accessories Category */}
            <Link to="/category/accessories" className="flex flex-col items-center group">
              <div className="w-40 h-40 md:w-48 md:h-48 rounded-full overflow-hidden border-4 border-[#4A90E2] shadow-lg group-hover:shadow-xl transition-all group-hover:scale-105">
                <img 
                  src="/images/acc-cat.png" 
                  alt="Accessories"
                  className="w-full h-full object-cover"
                />
              </div>
              <span className="mt-2 text-sm font-medium text-gray-700 group-hover:text-[#4A90E2] transition-colors">
                Accessories
              </span>
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ">
              
              {womenProducts.map((product) => (
                <div key={product.id} className="bg-white border border-gray-200 rounded-lg p-4 text-center hover:shadow-lg transition-shadow ">
                  <div className="w-full h-40 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400">
                    🖼️
                  </div>
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
                  <div className="w-full h-40 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400">
                    🖼️
                  </div>
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
                  <div className="w-full h-40 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400">
                    🖼️
                  </div>
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
                  <div className="w-full h-40 bg-gray-100 rounded-lg mb-3 flex items-center justify-center text-gray-400">
                    🖼️
                  </div>
                  <h3 className="font-medium text-gray-800 text-sm">{product.name}</h3>
                  <p className="text-[#4A90E2] font-bold text-sm">₱ {product.price.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

      </div>
    </div>
  );
}

export default LandingPage;