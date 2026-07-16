import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Link } from 'react-router-dom';

function ProductPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'inventory'));
        const items = [];
        querySnapshot.forEach(doc => {
          items.push({ id: doc.id, ...doc.data() });
        });
        setProducts(items);
      } catch (error) {
        console.error('Error loading products:', error);
      }
      setLoading(false);
    };
    loadProducts();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">👓 Our Products</h1>
          <Link to="/customer/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>
        
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-500">Loading products...</p>
          </div>
        ) : products.length === 0 ? (
          <div className="bg-white rounded-2xl shadow p-12 text-center">
            <p className="text-gray-500 text-lg">No products available</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {products.map((product) => (
              <div key={product.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all hover:-translate-y-1">
                <div className="p-6">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl mb-4">
                    👓
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">{product.name}</h3>
                  <p className="text-gray-500 text-sm mt-1">{product.category || 'Eyewear'}</p>
                  <div className="mt-4 flex justify-between items-center">
                    <span className="text-2xl font-bold text-blue-600">₱{product.price}</span>
                    <span className={`text-sm px-2 py-1 rounded-full ${product.quantity > 10 ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      Stock: {product.quantity}
                    </span>
                  </div>
                  <button className="w-full mt-4 bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition-colors">
                    Inquire
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default ProductPage;