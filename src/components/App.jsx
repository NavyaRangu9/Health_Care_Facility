import React from 'react';
import { MapProvider } from '../context/MapContext';
import Header from './Header';
import WebMapComponent from './WebMap';
import Buffer from './BufferAnalysis';
import "../styles/App.css"; 
import "@arcgis/core/assets/esri/themes/light/main.css";

const App = () => {
  return (
    <MapProvider>
      <div className="HealthCareApp">
        <div className="Header">
          <Header />
        </div>
        <div className="mapContainer">
          <WebMapComponent />
          <Buffer />
        </div>
      </div>
    </MapProvider>
  );
};

export default App;