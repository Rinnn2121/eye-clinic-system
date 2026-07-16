import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/config';
import { Link } from 'react-router-dom';

function InventoryPage() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', quantity: '', price: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProducts();
  }, []);

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
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await addDoc(collection(db, 'inventory'), {
        name: newProduct.name,
        quantity: parseInt(newProduct.quantity),
        price: parseFloat(newProduct.price)
      });
      setNewProduct({ name: '', quantity: '', price: '' });
      await loadProducts();
      alert('✅ Product added successfully!');
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this item?')) {
      try {
        await deleteDoc(doc(db, 'inventory', id));
        await loadProducts();
        alert('✅ Item deleted!');
      } catch (error) {
        alert('❌ Error deleting item');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📦 Inventory</h1>
          <Link to="/admin/dashboard" className="text-blue-600 hover:underline">
            ← Back to Dashboard
          </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Add Product Form */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Add Product</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-gray-700 font-medium mb-2">Product Name</label>
                <input
                  type="text"
                  className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Quantity</label>
                  <input
                    type="number"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={newProduct.quantity}
                    onChange={(e) => setNewProduct({...newProduct, quantity: e.target.value})}
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-medium mb-2">Price (₱)</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                    value={newProduct.price}
                    onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 font-semibold"
              >
                {loading ? 'Adding...' : 'Add Product'}
              </button>
            </form>
          </div>

          {/* Product List */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Products ({products.length})</h2>
            <div className="max-h-96 overflow-y-auto space-y-3">
              {products.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No products in inventory</p>
              ) : (
                products.map((item) => (
                  <div key={item.id} className="flex justify-between items-center border-b pb-3">
                    <div>
                      <p className="font-semibold">{item.name}</p>
                      <p className="text-sm text-gray-500">
                        Qty: {item.quantity} | ₱{item.price}
                      </p>
                    </div>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition-colors text-sm"
                    >
                      Delete
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default InventoryPage;