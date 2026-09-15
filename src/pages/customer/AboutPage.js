import React from 'react';

function AboutPage() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-4xl">
        
        

        {/* Main Content Card - Centered */}
        <div className="bg-indigo-200 rounded-[32px] p-8 md:p-12 lg:p-16 shadow-sm mb-8">
          
          {/* Title - Centered */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[#4A90E2] text-center mb-8">
            Vitug - Sumaya Optical Clinic
          </h1>

          {/* Clinic Description - Centered */}
          <div className="text-center text-gray-700 text-sm md:text-base leading-relaxed max-w-3xl mx-auto mb-16">
            <p>
              Clinic description here Clinic description here Clinic description here Clinic description here 
              Clinic description here Clinic description here Clinic description here Clinic description here 
              Clinic description here Clinic description here Clinic description here Clinic description here 
              Clinic description here Clinic description here
            </p>
          </div>
          </div>

          {/* Three Column Section - Centered Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 text-center">
            
            {/* Visit Our Branches */}
            <div className="bg-indigo-200 rounded-[32px] p-4">
            <div className="flex flex-col items-center">
              <h2 className="text-xl md:text-2xl font-medium text-black mb-12 md:mb-16">
                Visit Our Branches
              </h2>
              <div className="text-gray-600 text-sm leading-relaxed">
                <p>Branches Information here</p>
              </div>
            </div>
        </div>
            {/* Opening Hours */}
                        <div className="bg-indigo-200 rounded-[32px] p-4">
            <div className="flex flex-col items-center">
              <h2 className="text-xl md:text-2xl font-medium text-black mb-12 md:mb-16">
                Opening Hours
              </h2>
              <div className="text-gray-600 text-sm leading-relaxed">
                <p>Schedule Information here</p>
              </div>
            </div>
        </div>
            {/* Contact Us */}
                        <div className="bg-indigo-200 rounded-[32px] p-4">
            <div className="flex flex-col items-center">
              <h2 className="text-xl md:text-2xl font-medium text-black mb-12 md:mb-16">
                Contact Us
              </h2>
              <div className="text-gray-600 text-sm leading-relaxed">
                <p>Contact Information here</p>
              </div>
            </div>
        </div>
        
          </div>

        </div>
      </div>
  );
}

export default AboutPage;