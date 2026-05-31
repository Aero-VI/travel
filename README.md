# Travel Timeline

Interactive visual timeline of travels across 35+ countries.

**Live:** [travel.aeroverra.com](https://travel.aeroverra.com)

## Features

- 🗺️ Interactive world map with Leaflet.js (dark theme)
- 📅 Chronological timeline view with year grouping
- 🎛️ Grid/Timeline view toggle
- 🏷️ Filter by trip type (cruise, city, adventure, etc.)
- 🚢 Cruise route visualization on map
- 📱 Fully responsive design
- 🌙 Dark theme throughout
- ✨ Smooth animations and scroll reveal

## Tech Stack

- Vanilla JS (no framework dependencies)
- Leaflet.js for maps
- CartoDB dark basemap tiles
- Google Fonts (Inter + Playfair Display)
- GitHub Pages hosting
- Cloudflare DNS

## Adding Trips

Edit `data/trips.json` and add a new trip object:

```json
{
  "id": "unique-id",
  "title": "Trip Title",
  "location": "City, Country",
  "country": "Country",
  "region": "Region",
  "startDate": "YYYY-MM-DD",
  "endDate": "YYYY-MM-DD",
  "type": "cruise|city|adventure|extended-stay|backpacking|road-trip|island-hopping",
  "coordinates": [lat, lng],
  "description": "Description text",
  "highlights": ["Highlight 1", "Highlight 2"],
  "route": [] // Optional, for cruises
}
```

---

Built with wanderlust.
