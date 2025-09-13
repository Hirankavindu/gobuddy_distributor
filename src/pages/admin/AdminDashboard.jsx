import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/useAuth';
import { registerDistributor } from '../../services/authService';

function AdminDashboard() {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Check if user is logged in and has admin role
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (!role || role !== 'ADMIN') {
      navigate('/');
    }
  }, [navigate]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    profileImage: '',
    distributorName: '',
    distributorDescription: '',
    deliveryDescription: '',
    registrationNumber: '',
    alternativeContactNumber: '',
    distributorAddress: {
      address1: '',
      address2: '',
      suburb: '',
      city: '',
      postalCode: '',
      district: '',
      province: '',
      latitude: 0,
      longitude: 0
    },
    distributorCategory: '',
    distributorImageUrl: '',
    workingDays: 'Weekdays', // Default value
    deliveryDates: '', // Will store selected weekdays as comma-separated string
    openingTimes: '', // Will store as "startTime-endTime" format
    openingTimeStart: '09:00', // Default start time 9 AM
    openingTimeEnd: '17:00', // Default end time 5 PM
    socialMediaLinks: '',
    planId: 'default' // Using a default plan ID
  });
  
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Reset form state when switching tabs
    setMessage(null);
  };
  
  // Handle image selection and preview
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      
      // Create image preview
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested address fields
    if (name.startsWith('address.')) {
      const addressField = name.split('.')[1];
      setFormData({
        ...formData,
        distributorAddress: {
          ...formData.distributorAddress,
          [addressField]: value
        }
      });
    } 
    // Handle opening times special case
    else if (name === 'openingTimeStart' || name === 'openingTimeEnd') {
      const start = name === 'openingTimeStart' ? value : formData.openingTimeStart;
      const end = name === 'openingTimeEnd' ? value : formData.openingTimeEnd;
      setFormData({
        ...formData,
        [name]: value,
        openingTimes: `${start}-${end}` // Format as "HH:MM-HH:MM"
      });
    }
    // Handle delivery dates checkboxes
    else if (name.startsWith('deliveryDay_')) {
      const day = name.split('_')[1];
      let currentDays = formData.deliveryDates ? formData.deliveryDates.split(',') : [];
      
      if (e.target.checked) {
        // Add the day if it's not already in the list
        if (!currentDays.includes(day)) {
          currentDays.push(day);
        }
      } else {
        // Remove the day if it's in the list
        currentDays = currentDays.filter(d => d !== day);
      }
      
      setFormData({
        ...formData,
        deliveryDates: currentDays.join(',')
      });
    }
    // Handle all other fields
    else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    
    // Password confirmation validation
    if (formData.password !== formData.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      setLoading(false);
      return;
    }
    
    // Validate delivery dates
    if (formData.deliveryDates === '') {
      setMessage({ type: 'error', text: 'Please select at least one delivery day' });
      setLoading(false);
      return;
    }
    
    try {
      // Convert image to Base64 if available
      if (profileImage) {
        const base64Image = await convertToBase64(profileImage);
        formData.profileImage = base64Image;
        formData.distributorImageUrl = base64Image;
      }
      
      // Make sure opening times are properly formatted
      formData.openingTimes = `${formData.openingTimeStart}-${formData.openingTimeEnd}`;
      
      // Create a deep copy of form data for submission
      const distributorData = JSON.parse(JSON.stringify(formData));
      
      // Remove fields not needed for API submission
      delete distributorData.confirmPassword;
      delete distributorData.openingTimeStart;
      delete distributorData.openingTimeEnd;
      
      // Process fields based on backend requirements
      
      // Keep socialMediaLinks as a string
      if (distributorData.socialMediaLinks) {
        distributorData.socialMediaLinks = distributorData.socialMediaLinks.trim();
      } else {
        distributorData.socialMediaLinks = '';
      }
      
      // Keep deliveryDates as a string for now, authService will convert to array
      if (distributorData.deliveryDates) {
        distributorData.deliveryDates = distributorData.deliveryDates.trim();
      } else {
        distributorData.deliveryDates = '';
      }
      
      console.log('Formatted data for API:', JSON.stringify(distributorData));
      
      // Check if we have a valid token before proceeding
      const token = localStorage.getItem('accessToken');
      if (!token) {
        setMessage({ 
          type: 'error', 
          text: 'No authentication token found. Please log out and log back in as an admin.'
        });
        setLoading(false);
        return;
      }
      
      console.log('Submitting registration with token:', token.substring(0, 10) + '...');
      
      // Call API to register distributor
      const response = await registerDistributor(distributorData);
      
      if (response && response.success) {
        setMessage({ 
          type: 'success', 
          text: `Distributor registered successfully! ID: ${response.data.entityCode}` 
        });
        
        // Reset form after successful submission
        setFormData({
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          profileImage: '',
          distributorName: '',
          distributorDescription: '',
          deliveryDescription: '',
          registrationNumber: '',
          alternativeContactNumber: '',
          distributorAddress: {
            address1: '',
            address2: '',
            suburb: '',
            city: '',
            postalCode: '',
            district: '',
            province: '',
            latitude: 0,
            longitude: 0
          },
          distributorCategory: '',
          distributorImageUrl: '',
          workingDays: 'Weekdays',
          deliveryDates: '',
          openingTimes: '',
          openingTimeStart: '09:00',
          openingTimeEnd: '17:00',
          socialMediaLinks: '',
          planId: 'default'
        });
        setProfileImage(null);
        setImagePreview(null);
      }
    } catch (error) {
      console.error('Registration error:', error);
      setMessage({ 
        type: 'error', 
        text: error.message || 'Failed to register distributor. Please try again.' 
      });
    } finally {
      setLoading(false);
    }
  };
  
  // Convert file to Base64
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex">
      {/* Fixed Sidebar */}
      <div className="w-64 bg-white dark:bg-gray-800 shadow-md fixed h-screen overflow-y-auto z-10">
        <div className="p-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Admin Panel</h2>
        </div>
        <nav className="mt-4 pb-20"> {/* Added padding at bottom to ensure space for logout button */}
          <div 
            onClick={() => handleTabChange('dashboard')} 
            className={`flex items-center px-6 py-3 cursor-pointer ${
              activeTab === 'dashboard' 
                ? 'bg-blue-100 border-l-4 border-blue-500 dark:bg-gray-700'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
            </svg>
            <span className="text-gray-800 dark:text-gray-200">Dashboard</span>
          </div>
          <div 
            onClick={() => handleTabChange('new-distributor')} 
            className={`flex items-center px-6 py-3 cursor-pointer ${
              activeTab === 'new-distributor' 
                ? 'bg-blue-100 border-l-4 border-blue-500 dark:bg-gray-700'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zM4 19.235v-.11a6.375 6.375 0 0112.75 0v.109A12.318 12.318 0 0110.374 21c-2.331 0-4.512-.645-6.374-1.766z" />
            </svg>
            <span className="text-gray-800 dark:text-gray-200">Add New Distributor</span>
          </div>
        </nav>
        
        {/* Logout Button in Sidebar */}
        <div className="p-4 absolute bottom-0 left-0 w-64 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => {
              handleLogout();
              navigate('/');
            }}
            className="w-full flex items-center justify-center px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
            </svg>
            Logout
          </button>
        </div>
      </div>
      
      {/* Main Content with left margin to accommodate fixed sidebar */}
      <div className="flex-1 ml-64 min-h-screen">
        <header className="bg-white dark:bg-gray-800 shadow sticky top-0 z-10">
          <div className="py-6 px-6 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {activeTab === 'dashboard' ? 'Admin Dashboard' : 'Add New Distributor'}
            </h1>
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-300 mr-4">
                {user?.email}
              </span>
            </div>
          </div>
        </header>
        
        <main className="py-6 px-6 overflow-y-auto">
          {activeTab === 'dashboard' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Dashboard Cards */}
          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">User Management</h3>
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Manage all users including distributors and drivers.
                </p>
              </div>
              <div className="mt-5">
                <Link to="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  View users →
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Analytics</h3>
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  View system performance and analytics data.
                </p>
              </div>
              <div className="mt-5">
                <Link to="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  View analytics →
                </Link>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">System Settings</h3>
              <div className="mt-4">
                <p className="text-sm text-gray-500 dark:text-gray-300">
                  Configure system-wide settings and parameters.
                </p>
              </div>
              <div className="mt-5">
                <Link to="#" className="text-sm font-medium text-blue-600 hover:text-blue-500">
                  View settings →
                </Link>
              </div>
            </div>
          </div>
            </div>
          )}
          
          {activeTab === 'new-distributor' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 dark:text-white mb-6">Add New Distributor</h2>
              
              {message && (
                <div className={`mb-4 p-4 rounded ${message.type === 'success' ? 'bg-green-100 text-green-700 border border-green-400' : 'bg-red-100 text-red-700 border border-red-400'}`}>
                  {message.text}
                </div>
              )}
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                {/* Basic Information */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Basic Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Email Address*
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Phone Number*
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password*
                      </label>
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm Password*
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="profileImage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Profile Image
                    </label>
                    <input
                      type="file"
                      id="profileImage"
                      name="profileImage"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    {imagePreview && (
                      <div className="mt-2">
                        <img src={imagePreview} alt="Profile Preview" className="w-32 h-32 object-cover rounded-md border border-gray-300" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Distributor Details */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Distributor Details</h3>
                  
                  <div className="mb-4">
                    <label htmlFor="distributorName" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Distributor Name*
                    </label>
                    <input
                      type="text"
                      id="distributorName"
                      name="distributorName"
                      value={formData.distributorName}
                      onChange={handleInputChange}
                      required
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="distributorDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Distributor Description
                    </label>
                    <textarea
                      id="distributorDescription"
                      name="distributorDescription"
                      rows="3"
                      value={formData.distributorDescription}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    ></textarea>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="deliveryDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Delivery Description
                    </label>
                    <textarea
                      id="deliveryDescription"
                      name="deliveryDescription"
                      rows="2"
                      value={formData.deliveryDescription}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    ></textarea>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Registration Number
                      </label>
                      <input
                        type="text"
                        id="registrationNumber"
                        name="registrationNumber"
                        value={formData.registrationNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="alternativeContactNumber" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Alternative Contact Number
                      </label>
                      <input
                        type="tel"
                        id="alternativeContactNumber"
                        name="alternativeContactNumber"
                        value={formData.alternativeContactNumber}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="distributorCategory" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Distributor Category
                    </label>
                    <select
                      id="distributorCategory"
                      name="distributorCategory"
                      value={formData.distributorCategory}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    >
                      <option value="">Select Category</option>
                      <option value="GROCERY">Grocery</option>
                      <option value="PHARMACY">Pharmacy</option>
                      <option value="LIQUOR">Liquor</option>
                      <option value="RESTAURANT">Restaurant</option>
                      <option value="HARDWARE">Hardware</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                </div>
                
                {/* Address Information */}
                <div className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Address Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <label htmlFor="address1" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Address Line 1*
                      </label>
                      <input
                        type="text"
                        id="address1"
                        name="address.address1"
                        value={formData.distributorAddress.address1}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="address2" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Address Line 2
                      </label>
                      <input
                        type="text"
                        id="address2"
                        name="address.address2"
                        value={formData.distributorAddress.address2}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <label htmlFor="suburb" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Suburb
                      </label>
                      <input
                        type="text"
                        id="suburb"
                        name="address.suburb"
                        value={formData.distributorAddress.suburb}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="city" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        City*
                      </label>
                      <input
                        type="text"
                        id="city"
                        name="address.city"
                        value={formData.distributorAddress.city}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="postalCode" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Postal Code
                      </label>
                      <input
                        type="text"
                        id="postalCode"
                        name="address.postalCode"
                        value={formData.distributorAddress.postalCode}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <label htmlFor="district" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        District
                      </label>
                      <input
                        type="text"
                        id="district"
                        name="address.district"
                        value={formData.distributorAddress.district}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    <div>
                      <label htmlFor="province" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Province
                      </label>
                      <input
                        type="text"
                        id="province"
                        name="address.province"
                        value={formData.distributorAddress.province}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Additional Information */}
                <div className="mb-4">
                  <h3 className="text-md font-medium text-gray-900 dark:text-white mb-4">Additional Information</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <label htmlFor="workingDays" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Working Days
                      </label>
                      <select
                        id="workingDays"
                        name="workingDays"
                        value={formData.workingDays}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                      >
                        <option value="Weekdays">Weekdays (Mon-Fri)</option>
                        <option value="Weekend">Weekend (Sat-Sun)</option>
                        <option value="Week and Weekend">All Week (Mon-Sun)</option>
                      </select>
                    </div>
                    <div>
                      <label htmlFor="openingTimes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Opening Times
                      </label>
                      <div className="flex space-x-2 items-center">
                        <input
                          type="time"
                          id="openingTimeStart"
                          name="openingTimeStart"
                          value={formData.openingTimeStart}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                        <span className="text-gray-500 dark:text-gray-400">to</span>
                        <input
                          type="time"
                          id="openingTimeEnd"
                          name="openingTimeEnd"
                          value={formData.openingTimeEnd}
                          onChange={handleInputChange}
                          className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Delivery Days
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="deliveryDay_Monday"
                          name="deliveryDay_Monday"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          onChange={handleInputChange}
                          checked={formData.deliveryDates.includes('Monday')}
                        />
                        <label htmlFor="deliveryDay_Monday" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Monday
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="deliveryDay_Tuesday"
                          name="deliveryDay_Tuesday"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          onChange={handleInputChange}
                          checked={formData.deliveryDates.includes('Tuesday')}
                        />
                        <label htmlFor="deliveryDay_Tuesday" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Tuesday
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="deliveryDay_Wednesday"
                          name="deliveryDay_Wednesday"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          onChange={handleInputChange}
                          checked={formData.deliveryDates.includes('Wednesday')}
                        />
                        <label htmlFor="deliveryDay_Wednesday" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Wednesday
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="deliveryDay_Thursday"
                          name="deliveryDay_Thursday"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          onChange={handleInputChange}
                          checked={formData.deliveryDates.includes('Thursday')}
                        />
                        <label htmlFor="deliveryDay_Thursday" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Thursday
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="deliveryDay_Friday"
                          name="deliveryDay_Friday"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          onChange={handleInputChange}
                          checked={formData.deliveryDates.includes('Friday')}
                        />
                        <label htmlFor="deliveryDay_Friday" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Friday
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="deliveryDay_Saturday"
                          name="deliveryDay_Saturday"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          onChange={handleInputChange}
                          checked={formData.deliveryDates.includes('Saturday')}
                        />
                        <label htmlFor="deliveryDay_Saturday" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Saturday
                        </label>
                      </div>
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          id="deliveryDay_Sunday"
                          name="deliveryDay_Sunday"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          onChange={handleInputChange}
                          checked={formData.deliveryDates.includes('Sunday')}
                        />
                        <label htmlFor="deliveryDay_Sunday" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                          Sunday
                        </label>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <label htmlFor="socialMediaLinks" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Social Media Links
                    </label>
                    <input
                      type="text"
                      id="socialMediaLinks"
                      name="socialMediaLinks"
                      value={formData.socialMediaLinks}
                      onChange={handleInputChange}
                      placeholder="e.g. https://facebook.com/yourbusiness,https://instagram.com/yourbusiness"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end pt-4">
                  <button 
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  >
                    {loading ? 'Registering...' : 'Register Distributor'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default AdminDashboard;