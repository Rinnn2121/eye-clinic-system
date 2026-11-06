// src/pages/customer/ServicesPage.js

import React from 'react';
import Footer from '../../components/Footer';

function ServicesPage() {

  // Services array
  const services = [
    {
      title: 'Free Computerized Eye Examination',
      description: 'A quick, digital screening that uses automated instruments to evaluate your visual acuity and refractive errors.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
        </svg>
      ),
      color: 'text-indigo-600',
      bg: 'bg-indigo-50',
    },
    {
      title: 'Comprehensive Eye Examination',
      description: 'An in-depth evaluation of your vision and overall eye health performed by a licensed optometrist or ophthalmologist.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
      ),
      color: 'text-blue-600',
      bg: 'bg-blue-50',
    },
    {
      title: 'Prescribing/Dispensing of Corrective Lenses and Eyeglasses',
      description: 'Is the two-step clinical and technical process of diagnosing vision errors and fitting eyewear to correct them.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
      color: 'text-cyan-600',
      bg: 'bg-cyan-50',
    },
    {
      title: 'Fitting of Contact Lenses',
      description: 'A specialized clinical process to measure your eyes and select contact lenses that fit safely, comfortably, and provide clear vision.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
        </svg>
      ),
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
    {
      title: 'Color Vision Test',
      description: 'An eye evaluation used to measure a person\'s ability to distinguish between different colors and detect color vision deficiencies.',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      ),
      color: 'text-purple-600',
      bg: 'bg-purple-50',
    },
    {
      title: 'Dry Eye Test',
      description: 'A set of diagnostic evaluations used to assess tear stability, volume, and ocular health to diagnose Dry Eye Disease (DED).',
      icon: (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
        </svg>
      ),
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    }
  ];

  return (
    <div className="min-h-screen bg-white flex flex-col">
      
      {/* Main Content */}
      <div className="flex-1 w-full max-w-[1200px] mx-auto px-6 py-12 md:py-16">
        
        {/* Header with faint line */}
        <div className="mb-8 border-b border-gray-200 pb-4">
          <h1 className="text-3xl font-bold text-gray-900">Our Services</h1>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {services.map((service, index) => (
            <div 
              key={index} 
              // ✅ Removed shadow-sm and hover:shadow-md to make it completely flat
              className="flex flex-col border border-gray-200 rounded-2xl p-6 md:p-8 bg-white"
            >
              
              {/* Icon and Title Row */}
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${service.bg} ${service.color}`}>
                  {service.icon}
                </div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight mt-1">
                  {service.title}
                </h3>
              </div>

              {/* Description */}
              <p className="text-sm text-gray-600 leading-relaxed">
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