# Google Maps Integration Setup

This project now includes comprehensive Google Maps integration for both service providers and customers.

## 🚨 **Current Issue: Invalid API Key**

You're seeing this error because the Google Maps API key is not properly configured. Here's how to fix it:

## 🔧 **Step-by-Step Fix**

### **1. Get a Google Maps API Key**

1. **Go to Google Cloud Console:**
   - Visit: https://console.cloud.google.com/
   - Sign in with your Google account

2. **Create a New Project:**
   - Click on the project dropdown at the top
   - Click "New Project"
   - Name it something like "Service Booking App"
   - Click "Create"

3. **Enable Required APIs:**
   - Go to "APIs & Services" > "Library"
   - Search for and enable these APIs:
     - **Maps JavaScript API**
     - **Geocoding API**
     - **Places API**

4. **Create API Key:**
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy the generated API key

5. **Restrict the API Key (Recommended):**
   - Click on the API key you just created
   - Under "Application restrictions", select "HTTP referrers"
   - Add these referrers:
     ```
     localhost:3000/*
     localhost:5173/*
     yourdomain.com/*
     ```
   - Under "API restrictions", select "Restrict key"
   - Select the three APIs you enabled above
   - Click "Save"

### **2. Update Your Environment File**

1. **Open the .env file:**
   ```bash
   cd client
   notepad .env
   ```

2. **Replace the placeholder with your actual API key:**
   ```env
   VITE_GOOGLE_MAPS_API_KEY=AIzaSyC_your_actual_api_key_here
   ```

3. **Save the file**

### **3. Restart Your Development Server**

```bash
# Stop the current server (Ctrl+C)
# Then restart it
npm run dev
```

## ✅ **What You'll See After Fixing**

### **For Service Providers:**
- Interactive map for selecting service locations
- Search functionality to find addresses
- Visual confirmation of selected coordinates

### **For Customers:**
- Map view showing all services
- Distance calculations from your location
- Interactive service discovery
- Toggle between grid and map views

## 🛡️ **Fallback Features**

If the API key is still invalid, the app will show:
- **Grid view** instead of map view for services
- **Manual coordinate input** for location selection
- **Helpful error messages** with setup instructions

## 🔍 **Troubleshooting**

### **Common Issues:**

1. **"InvalidKeyMapError"**
   - ✅ API key is not valid
   - ✅ API key is not restricted properly
   - ✅ APIs are not enabled

2. **"Quota exceeded"**
   - ✅ You've hit the free tier limits
   - ✅ Consider upgrading to paid plan

3. **"Referrer not allowed"**
   - ✅ Add your domain to API key restrictions
   - ✅ Include `localhost:3000/*` and `localhost:5173/*`

### **Testing Your API Key:**

1. **Check if it's working:**
   ```javascript
   // In browser console
   console.log(import.meta.env.VITE_GOOGLE_MAPS_API_KEY);
   ```

2. **Test the API directly:**
   ```bash
   curl "https://maps.googleapis.com/maps/api/js?key=YOUR_API_KEY&libraries=places"
   ```

## 📱 **Mobile Considerations**

- **HTTPS Required:** Geolocation only works on HTTPS
- **Permissions:** Users must grant location access
- **Responsive Design:** Maps work on all screen sizes

## 💰 **Cost Considerations**

- **Free Tier:** $200/month credit (usually sufficient for development)
- **Paid Plans:** Pay-as-you-go after free tier
- **Monitoring:** Set up billing alerts in Google Cloud Console

## 🚀 **Production Deployment**

When deploying to production:

1. **Update API key restrictions** to include your production domain
2. **Set up billing** in Google Cloud Console
3. **Monitor usage** to avoid unexpected charges
4. **Use environment variables** in your hosting platform

## 📞 **Need Help?**

If you're still having issues:

1. **Check the browser console** for specific error messages
2. **Verify API key** in Google Cloud Console
3. **Test with a simple HTML file** first
4. **Check network tab** for failed requests

## 🎯 **Quick Test**

After setting up your API key, you should see:
- ✅ Interactive map loads without errors
- ✅ Can search for locations
- ✅ Can click on map to select locations
- ✅ Service markers appear on map
- ✅ Distance calculations work

---

**Remember:** Never commit your actual API key to version control. Always use environment variables!

## Features Added

### 1. Service Location Picker (AddService Component)
- Interactive Google Maps for selecting service locations
- Search functionality to find specific addresses
- Automatic geolocation detection
- Visual feedback with markers and coordinates

### 2. Service Map View (ServiceMapView Component)
- Interactive map showing all available services
- User location detection and display
- Service markers with detailed info windows
- Distance calculation from user location
- Search functionality to navigate to different areas

### 3. Enhanced Services Page
- Toggle between Grid and Map view
- Real-time distance calculations
- Location-based filtering
- Interactive service discovery

## Setup Instructions

### 1. Get Google Maps API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Geocoding API
   - Places API
4. Create credentials (API Key)
5. Restrict the API key to your domain for security

### 2. Configure Environment Variables

Create a `.env` file in the `client` directory:

```env
# Google Maps API Key
VITE_GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here

# Backend API URL
VITE_API_URL=http://localhost:5000
```

### 3. API Key Restrictions (Recommended)

For security, restrict your API key to:
- HTTP referrers: `localhost:3000/*`, `localhost:5173/*`, `yourdomain.com/*`
- APIs: Maps JavaScript API, Geocoding API, Places API

## Usage

### For Service Providers
1. Go to Services page
2. Click "Add New Service"
3. Use the interactive map to select your service location
4. Search for specific addresses if needed
5. The coordinates will be automatically saved

### For Customers
1. Go to Services page
2. Toggle between Grid and Map view
3. Use the map to explore services near you
4. Click on service markers for details
5. Use the search bar to find services in specific areas

## Components Created

### GoogleMapLocationPicker
- Reusable component for location selection
- Props:
  - `onLocationSelect`: Callback function for location changes
  - `initialLocation`: Starting location coordinates
  - `showSearchBox`: Toggle search functionality
  - `height`: Map height
  - `markers`: Additional markers to display
  - `readOnly`: Disable location selection

### ServiceMapView
- Component for displaying services on a map
- Features:
  - User location detection
  - Service markers with info windows
  - Distance calculations
  - Search functionality
  - Interactive navigation

## Technical Details

### Dependencies Used
- `@react-google-maps/api`: React wrapper for Google Maps
- `react-icons`: Icons for UI elements
- `framer-motion`: Smooth animations

### Key Functions
- `calculateDistance()`: Haversine formula for distance calculation
- `formatDistance()`: Human-readable distance formatting
- `handleLocationSelect()`: Location selection callback
- `handleSearch()`: Geocoding for address search

### Error Handling
- Graceful fallbacks for missing API keys
- Location permission handling
- Network error recovery
- User-friendly error messages

## Security Considerations

1. **API Key Protection**: Never commit API keys to version control
2. **Domain Restrictions**: Restrict API keys to your domains
3. **Usage Limits**: Monitor API usage to avoid unexpected charges
4. **User Privacy**: Request location permission only when needed

## Troubleshooting

### Common Issues

1. **"Loading Google Maps..." never disappears**
   - Check if API key is correctly set in environment variables
   - Verify API key has necessary permissions

2. **Location not working**
   - Ensure HTTPS is used (required for geolocation)
   - Check browser location permissions
   - Verify user has granted location access

3. **Search not working**
   - Ensure Geocoding API is enabled
   - Check API key restrictions

4. **Map not loading**
   - Verify internet connection
   - Check browser console for errors
   - Ensure Maps JavaScript API is enabled

### Debug Mode

Add this to your environment variables for debugging:
```env
VITE_DEBUG_MAPS=true
```

This will show additional console logs for troubleshooting.

## Performance Optimization

1. **Lazy Loading**: Maps are loaded only when needed
2. **Marker Clustering**: For large numbers of services
3. **Debounced Search**: Prevents excessive API calls
4. **Caching**: Location data is cached in localStorage

## Future Enhancements

- Marker clustering for dense areas
- Route planning to service locations
- Real-time service availability
- Advanced filtering by distance/area
- Offline map support
- Custom map styles 