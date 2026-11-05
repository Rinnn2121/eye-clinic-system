// src/pages/customer/ServicesPage.js

import React from 'react';
import Footer from '../../components/Footer';

function ServicesPage() {
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
      <div className="flex-1 w-full max-w-[1440px] mx-auto px-6 py-12">
        
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
                  <svg className="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <h2 className="font-bold text-gray-900 leading-snug text-sm md:text-base">
                  {service.title}
                </h2>
              </div>

              {/* Description */}
              <p className="text-xs text-gray-600 leading-relaxed flex-1">
                {service.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      <Footer />

    </div>
  );
}

export default ServicesPage;