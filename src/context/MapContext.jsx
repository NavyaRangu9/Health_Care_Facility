import React, { createContext, useContext, useState } from 'react';
import MapView from "@arcgis/core/views/MapView";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";

export const MapContext = createContext({
  view: null,
  setView: () => {},
  // facilityLayer: null,
  // boundaryLayer: null,
  // setFacilityLayer: () => {},
  // setBoundaryLayer: () => {},
});

export const MapProvider = ({ children }) => {
  const [view, setView] = useState(null);
  // const [facilityLayer, setFacilityLayer] = useState(null);
  // const [boundaryLayer, setBoundaryLayer] = useState(null);

  return (
    <MapContext.Provider value={{ 
      view, 
      setView, 
      // facilityLayer, 
      // boundaryLayer,
      // setFacilityLayer,
      // setBoundaryLayer
    }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMapContext = () => {
  const context = useContext(MapContext);
  if (!context) {
    throw new Error('useMapContext must be used within a MapProvider');
  }
  return context;
};