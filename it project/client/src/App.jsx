import { Outlet, useLocation } from 'react-router-dom'
import './App.css'
import toast, { Toaster } from 'react-hot-toast';
import { useEffect } from 'react';
import { setUserDetails } from './store/userSlice';
import { useDispatch } from 'react-redux';
import Axios from './utils/Axios';
import SummaryApi from './common/SummaryApi';

import fetchUserDetails from './utils/fetchUserDetails';
function App() {
  const dispatch = useDispatch();

  const fetchUser = async () => {
    try {
      const userData = await fetchUserDetails();
      if (userData && userData.data) {
        dispatch(setUserDetails(userData.data));
      }
    } catch (error) {
      console.error("Error in fetchUser:", error);
    }
  };

  useEffect(() => {
    fetchUser();
  }, []);

  const location = useLocation()
  

  

  

  useEffect(()=>{
    fetchUser()
  },[])

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
