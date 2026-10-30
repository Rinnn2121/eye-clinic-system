// src/pages/customer/ServicesPage.js

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../../components/Footer';
import BookingWizardModal from '../../components/BookingWizardModal';
import ConfirmModal from '../../components/ConfirmModal';
import { useAuth } from '../../contexts/AuthContext';

function ServicesPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Modal states
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [selectedService, setSelectedService] = useState('');
  const [alertConfig, setAlertConfig] = useState(null);

  // Handle clicking "Book a Visit"
  const handleBookVisit = (serviceTitle) => {
    if (!currentUser) {
      // If not logged in, show the custom alert
      setAlertConfig({ 
        type: 'error', 
        title: 'Login Required', 
        message: 'Please login or create an account to book an appointment.' 
      });
      return;
    }
    // If logged in, open the wizard
    setSelectedService(serviceTitle);
    setShowBookingModal(true);
  };

  // The 6 services from the design
  const services = [
    {
      title: 'Free Computerized Eye Examination',
      description: 'A quick, digital screening that uses automated instruments to evaluate your visual acuity and refractive errors.',
    },
    {
      title: 'Comprehensive Eye Examination',
      description: 'An in-depth evaluation of your vision and overall eye health performed by a licensed optometrist or ophthalmologist.',
    },
    {
      title: 'Prescribing/Dispensing of Corrective Lenses and Eyeglasses',
      description: 'Is the two-step clinical and technical process of diagnosing vision errors and fitting eyewear to correct them.',
    },
    {
      title: 'Fitting of Contact Lenses',
      description: 'A specialized clinical process to measure your eyes and select contact lenses that fit safely, comfortably, and provide clear vision.',
    },
    {
      title: 'Color Vision Test',
      description: 'An eye evaluation used to measure a person\'s ability to distinguish between different colors and detect color vision deficiencies.',
    },
    {
      title: 'Dry Eye Test',
      description: 'A set of diagnostic evaluations used to assess tear stability, volume, and ocular health to diagnose Dry Eye Disease (DED).',
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Main Content */}
      <div className="flex-1 max-w-7xl mx-auto w-full px-6 py-12">
        
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-8">Our Services</h1>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="bg-white border border-gray-200 rounded-lg p-6 flex flex-col hover:shadow-md transition-shadow"
            >
              {/* Header Row: Image + Title */}
              <div className="flex items-center gap-4 mb-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full flex-shrink-0 flex items-center justify-center">
                  <span className="text-3xl text-gray-300">🖼️</span>
                </div>
                <h2 className="font-bold text-gray-900 leading-snug text-sm md:text-base">
                  {service.title}
                </h2>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-600 leading-relaxed flex-1 mb-6">
                {service.description}
              </p>

              {/* Book a Visit Button */}
              <button 
                onClick={() => handleBookVisit(service.title)}
                className="text-[#4A90E2] text-sm font-medium hover:underline flex items-center gap-1 text-left w-fit"
              >
                Book a Visit <span>→</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      <Footer />

      {/* Booking Wizard Modal */}
      {showBookingModal && (
        <BookingWizardModal 
          initialService={selectedService}
          onClose={() => setShowBookingModal(false)} 
          onSuccess={() => {
            setShowBookingModal(false);
          }}
        />
      )}

      {/* Login Required Alert Modal */}
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

export default ServicesPage;