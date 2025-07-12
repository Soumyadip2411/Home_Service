import { Outlet, useLocation } from 'react-router-dom'
import './App.css'
import toast, { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { setUserDetails } from './store/userSlice';
import { useDispatch } from 'react-redux';

import fetchUserDetails from './utils/fetchUserDetails';

function App() {
  const dispatch = useDispatch();

  const fetchUser = async () => {
    try {
      // Check if user is logged in (has access token)
      const accessToken = localStorage.getItem("accesstoken");
      if (!accessToken) {
        return;
      }
      
      const userData = await fetchUserDetails();
      if (userData && userData.data) {
        dispatch(setUserDetails(userData.data));
      }
    } catch (error) {
      console.error("Error in fetchUser:", error);
      // If there's an authentication error, clear the token
      if (error.response?.status === 401) {
        localStorage.removeItem("accesstoken");
        localStorage.removeItem("refreshToken");
      }
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const location = useLocation();

  return (
    <>
      <main className='min-h-[78vh]'>
          <Outlet/>
      </main>
      
      <Toaster/>
    </>
  )
}

export default App
