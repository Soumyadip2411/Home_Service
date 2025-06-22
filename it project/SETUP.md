# Quick Setup Guide

## Fixing Map and Search Issues

### 1. Google Maps Setup (Required for Map View)

1. **Get a Google Maps API Key:**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select existing one
   - Enable these APIs:
     - Maps JavaScript API
     - Geocoding API
     - Places API
   - Create credentials (API Key)
   - Restrict the key to your domain for security

2. **Add API Key to Environment:**
   Create a `.env` file in the `client` directory:
   ```env
   VITE_GOOGLE_MAPS_API_KEY=your_actual_api_key_here
   VITE_API_URL=http://localhost:5000
   ```

3. **Restart your development server** after adding the API key.

### 2. Tag Search Setup

The tag-based search is now working! Here's what was fixed:

- ✅ Backend search now properly handles search queries
- ✅ AI-powered tag generation for services
- ✅ Frontend sends search queries to backend
- ✅ Debounced search for better performance

### 3. Running the Application

**For Windows PowerShell users:**
```powershell
# Start backend
cd server
npm start

# In a new terminal, start frontend
cd client
npm run dev
```

**For other terminals:**
```bash
# Start backend
cd server && npm start

# In a new terminal, start frontend
cd client && npm run dev
```

### 4. Testing the Fixes

1. **Test Map View:**
   - Go to Services page
   - Click "Map" view toggle
   - Should show interactive map with services

2. **Test Search:**
   - Use the search bar on Services page
   - Try searching by service name, category, or tags
   - Results should update in real-time

3. **Test Location Picker:**
   - Add a new service
   - Use the map to select location
   - Should work without errors

### 5. Troubleshooting

**If maps still don't work:**
- Check browser console for API key errors
- Verify API key is correct and has proper permissions
- Make sure all required APIs are enabled

**If search doesn't work:**
- Check backend console for errors
- Verify services have tags (run batch update if needed)
- Check network tab for failed requests

### 6. Batch Update Tags (Optional)

To update existing services with AI-generated tags:
```bash
# Make a GET request to:
GET /api/service/batch-update-tags
```

This will generate tags for all existing services.

---

**Note:** The application now gracefully handles missing Google Maps API keys by showing a fallback UI instead of breaking completely. 