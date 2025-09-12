// testApi.js
// This file is a utility to test your API without going through the Vite server

async function testApiConnection() {
  try {
    const response = await fetch('http://localhost:8080/api/v1/auth/login', {
      method: 'POST',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:5174'
      },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    console.log('Response status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Success response:', data);
    } else {
      const errorData = await response.text();
      console.error('Error response:', errorData);
    }
  } catch (error) {
    console.error('API connection error:', error);
  }
}

testApiConnection();