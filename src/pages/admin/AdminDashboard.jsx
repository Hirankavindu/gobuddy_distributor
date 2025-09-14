import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../providers/useAuth';
import { registerDistributor, fetchDistributors } from '../../services/authService';
import Swal from 'sweetalert2';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from '../../services/firebase';

function AdminDashboard() {
  const { user, handleLogout } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [distributors, setDistributors] = useState([]);
  const [distributorsLoading, setDistributorsLoading] = useState(false);
  
  // Check if user is logged in and has admin role
  useEffect(() => {
    const role = localStorage.getItem('role');
    if (!role || role !== 'SUPER_ADMIN') {
      navigate('/');
    }
  }, [navigate]);
  
  // Load distributors when the view-distributors tab is active
  useEffect(() => {
    if (activeTab === 'view-distributors') {
      loadDistributors();
    }
  }, [activeTab]);

  // Function to fetch distributors
  const loadDistributors = async () => {
    setDistributorsLoading(true);
    try {
      const data = await fetchDistributors();
      setDistributors(data || []);
    } catch (error) {
      Swal.fire({
        title: 'Error',
        text: `Failed to load distributors: ${error.message}`,
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
      setDistributors([]);
    } finally {
      setDistributorsLoading(false);
    }
  };
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [validationErrors, setValidationErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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
  
  // Handle image selection and upload to Firebase
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size limit (10MB)
      if (file.size > 10 * 1024 * 1024) {
        Swal.fire({
          icon: 'error',
          title: 'File Too Large',
          text: 'Please select an image smaller than 10MB.',
        });
        return;
      }

      setUploadingImage(true);
      setUploadProgress(0);

      // Create preview immediately
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target.result);
      };
      reader.readAsDataURL(file);

      try {
        // Check file size - only compress if > 1MB
        let fileToUpload = file;
        if (file.size > 1024 * 1024) { // 1MB
          fileToUpload = await compressImage(file);
        }

        // Create a unique filename
        const timestamp = Date.now();
        const filename = `distributors/${timestamp}_${file.name}`;
        const storageRef = ref(storage, filename);

        // Upload the file with progress tracking
        const uploadTask = uploadBytesResumable(storageRef, fileToUpload);

        // Monitor upload progress
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            throw error;
          }
        );

        // Wait for upload to complete
        await uploadTask;

        // Get the download URL
        const downloadURL = await getDownloadURL(storageRef);
        setImageUrl(downloadURL);
      } catch (error) {
        console.error('Error uploading image:', error);
        Swal.fire({
          icon: 'error',
          title: 'Upload Failed',
          text: 'Failed to upload image. Please try again.',
        });
      } finally {
        setUploadingImage(false);
        setUploadProgress(0);
      }
    }
  };

  // Compress image function - optimized for speed
  const compressImage = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Faster compression settings
          const maxSize = 400; // Reduced from 500
          let { width, height } = img;

          // Maintain aspect ratio
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Use better image smoothing for quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'medium';

          ctx.drawImage(img, 0, 0, width, height);

          // Convert to blob with lower quality for faster processing
          canvas.toBlob(resolve, 'image/jpeg', 0.5); // Reduced from 0.6
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
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
  
  // Validate email format
  const validateEmail = (email) => {
    const re = /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  };
  
  // Validate password strength
  const validatePassword = (password) => {
    // At least 8 chars, one letter, one number, and one symbol
    const re = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    return re.test(password);
  };
  
  // Validate phone number (basic validation)
  const validatePhone = (phone) => {
    // Remove all non-digit characters and check length
    const digits = phone.replace(/\D/g, '');
    return digits.length >= 10;
  };
  
  // Form validation
  const validateForm = () => {
    const errors = {};
    
    // Email validation
    if (!formData.email) {
      errors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    // Phone validation
    if (!formData.phone) {
      errors.phone = 'Phone number is required';
    } else if (!validatePhone(formData.phone)) {
      errors.phone = 'Please enter a valid phone number (min 10 digits)';
    }
    
    // Password validation
    if (!formData.password) {
      errors.password = 'Password is required';
    } else if (!validatePassword(formData.password)) {
      errors.password = 'Password must be at least 8 characters with at least one letter, one number, and one special character';
    }
    
    // Confirm password
    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    // Required fields
    if (!formData.distributorName) {
      errors.distributorName = 'Distributor name is required';
    }
    
    if (!formData.distributorAddress.address1) {
      errors.address1 = 'Address is required';
    }
    
    if (!formData.distributorAddress.city) {
      errors.city = 'City is required';
    }
    
    // Delivery dates validation
    if (formData.deliveryDates === '') {
      errors.deliveryDates = 'Please select at least one delivery day';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };
  
  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    
    // Validate form
    if (!validateForm()) {
      // Show error message using SweetAlert
      Swal.fire({
        title: 'Validation Error',
        text: 'Please fix the highlighted errors in the form',
        icon: 'error',
        confirmButtonColor: '#3085d6',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      // Use Firebase URL if available
      if (imageUrl) {
        formData.profileImage = imageUrl;
        formData.distributorImageUrl = imageUrl;
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
        // Show success message with SweetAlert
        Swal.fire({
          title: 'Success!',
          text: `Distributor registered successfully! ID: ${response.data.entityCode}`,
          icon: 'success',
          confirmButtonColor: '#3085d6'
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
        setImagePreview(null);
        setImageUrl('');
        setUploadProgress(0);
      }
    } catch (error) {
      console.error('Registration error:', error);
      
      // Show error with SweetAlert
      Swal.fire({
        title: 'Registration Failed',
        text: error.message || 'Failed to register distributor. Please try again.',
        icon: 'error',
        confirmButtonColor: '#3085d6'
      });
    } finally {
      setLoading(false);
    }
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
            onClick={() => handleTabChange('view-distributors')} 
            className={`flex items-center px-6 py-3 cursor-pointer ${
              activeTab === 'view-distributors' 
                ? 'bg-blue-100 border-l-4 border-blue-500 dark:bg-gray-700'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3 text-gray-600 dark:text-gray-300">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
            <span className="text-gray-800 dark:text-gray-200">View Distributors</span>
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
              {activeTab === 'dashboard' 
                ? 'Admin Dashboard' 
                : activeTab === 'view-distributors' 
                  ? 'Registered Distributors' 
                  : 'Add New Distributor'}
            </h1>
            <div className="flex items-center">
              <span className="text-gray-600 dark:text-gray-300 mr-4">
                {user?.email}
              </span>
            </div>
          </div>
        </header>
        
        <main className="py-6 px-6 overflow-y-auto">
          {activeTab === 'view-distributors' && (
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-medium text-gray-900 dark:text-white">All Registered Distributors</h2>
                <button 
                  onClick={loadDistributors}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <span className="flex items-center">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4 mr-2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                    </svg>
                    Refresh
                  </span>
                </button>
              </div>
              
              <div className="overflow-x-auto overflow-y-auto max-h-[600px] rounded-md shadow">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 table-fixed">
                  <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Distributor Name
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Email
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Phone
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Registration Number
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Registered On
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 dark:bg-gray-800 dark:divide-gray-700">
                    {distributorsLoading ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center">
                            <svg className="animate-spin h-5 w-5 mr-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Loading distributors...
                          </div>
                        </td>
                      </tr>
                    ) : distributors.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="px-6 py-4 text-center text-sm text-gray-500 dark:text-gray-400">
                          No distributors found. Add new distributors or refresh the list.
                        </td>
                      </tr>
                    ) : (
                      distributors.map((distributor, index) => (
                        <tr key={distributor.id || index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white h-14">
                            {distributor.distributorName || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 h-14">
                            {distributor.email}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 h-14">
                            {distributor.phone}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 h-14">
                            {distributor.registrationNumber || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {distributor.active ? (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100">
                                Inactive
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {distributor.registeredDate ? new Date(distributor.registeredDate).toLocaleDateString() : 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300 mr-3">
                              View
                            </button>
                            <button className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300">
                              Edit
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

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
                        className={`w-full px-3 py-2 border ${validationErrors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                      />
                      {validationErrors.email && <p className="mt-1 text-sm text-red-500">{validationErrors.email}</p>}
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
                        placeholder="e.g., 1234567890"
                        className={`w-full px-3 py-2 border ${validationErrors.phone ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                      />
                      {validationErrors.phone && <p className="mt-1 text-sm text-red-500">{validationErrors.phone}</p>}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Password*
                      </label>
                      <div className="relative">
                        <input
                          type={showPassword ? "text" : "password"}
                          id="password"
                          name="password"
                          value={formData.password}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-3 py-2 pr-10 border ${validationErrors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                          onClick={() => setShowPassword(!showPassword)}
                        >
                          {showPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {validationErrors.password && <p className="mt-1 text-sm text-red-500">{validationErrors.password}</p>}
                    </div>
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Confirm Password*
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleInputChange}
                          required
                          className={`w-full px-3 py-2 pr-10 border ${validationErrors.confirmPassword ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                        />
                        <button
                          type="button"
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        >
                          {showConfirmPassword ? (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                            </svg>
                          ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          )}
                        </button>
                      </div>
                      {validationErrors.confirmPassword && <p className="mt-1 text-sm text-red-500">{validationErrors.confirmPassword}</p>}
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
                      disabled={uploadingImage}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white"
                    />
                    {uploadingImage && (
                      <div className="mt-2">
                        <div className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span className="text-sm text-blue-600">
                            {uploadProgress > 0 ? `Uploading... ${Math.round(uploadProgress)}%` : 'Processing image...'}
                          </span>
                        </div>
                        {uploadProgress > 0 && (
                          <div className="mt-2 bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${uploadProgress}%` }}
                            ></div>
                          </div>
                        )}
                      </div>
                    )}
                    {imagePreview && !uploadingImage && (
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
                      className={`w-full px-3 py-2 border ${validationErrors.distributorName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                    />
                    {validationErrors.distributorName && <p className="mt-1 text-sm text-red-500">{validationErrors.distributorName}</p>}
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
                        className={`w-full px-3 py-2 border ${validationErrors.address1 ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                      />
                      {validationErrors.address1 && <p className="mt-1 text-sm text-red-500">{validationErrors.address1}</p>}
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
                        className={`w-full px-3 py-2 border ${validationErrors.city ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'} rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-white`}
                      />
                      {validationErrors.city && <p className="mt-1 text-sm text-red-500">{validationErrors.city}</p>}
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
                    disabled={loading || uploadingImage || (imagePreview && !imageUrl)}
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