import React, { useState, useEffect } from 'react';
import { useMapContext } from '../context/MapContext';
import Point from "@arcgis/core/geometry/Point";
import Graphic from "@arcgis/core/Graphic";
import config from "../config.json";
import * as geometryEngine from "@arcgis/core/geometry/geometryEngine";
import { SimpleMarkerSymbol, SimpleFillSymbol } from "@arcgis/core/symbols";
import { FaMapMarkerAlt, FaCircle, FaTimes } from 'react-icons/fa'; // Change the icons import

const Buffer = () => {
  const { view } = useMapContext();
  const [isActive, setIsActive] = useState(false);
  const [clickPoint, setClickPoint] = useState(null);
  const [isPanelOpen, setIsPanelOpen] = useState(false);
  const [bufferSettings, setBufferSettings] = useState({
    distance: 1000,
    unit: 'meters'
  });

  const units = ['meters', 'kilometers', 'miles'];
  const distances = [100, 500, 1000, 2000, 5000];

  // Point and Buffer Symbols
  const pointSymbol = new SimpleMarkerSymbol({
    color: [226, 119, 40],
    outline: { color: [255, 255, 255], width: 2 },
    size: 8
  });

  const bufferSymbol = new SimpleFillSymbol({
    color: [226, 119, 40, 0.2],
    outline: {
      color: [226, 119, 40],
      width: 2
    }
  });

  const togglePanel = () => {
    setIsPanelOpen(!isPanelOpen);
    if (!isPanelOpen) {
      handleReset(); // Reset when closing panel
    }
  };

  useEffect(() => {
    if (!view) return
     view.graphics.removeAll();
    let clickHandler;
    let hitTestHandler;

    if (isActive) {

      view.popupEnabled = false; // Disable popup completely

      view.container.style.cursor = "crosshair";

      clickHandler = view.on("click", (event) => {
        const point = new Point({
          longitude: event.mapPoint.longitude,
          latitude: event.mapPoint.latitude,
          spatialReference: view.spatialReference
        });

        // Add point graphic
        const pointGraphic = new Graphic({
          geometry: point,
          symbol: pointSymbol
        });

        view.graphics.removeAll();
        view.graphics.add(pointGraphic);
        setClickPoint(point);
        setIsActive(false);
        view.container.style.cursor = "default";
      });
    }

    return () => {
      if(!view) return
      if (clickHandler) {
        clickHandler.remove();
      }
      if (hitTestHandler) {
        hitTestHandler.remove();
      }
      view.popupEnabled = true; // Re-enable popup
      view.container.style.cursor = "default";
    };
  }, [isActive, view]);

  const createBuffer = () => {
    if (!clickPoint) return;

    // Convert distance to meters if necessary
    let bufferDistance = bufferSettings.distance;
    if (bufferSettings.unit === 'kilometers') {
      bufferDistance *= 1000;
    } else if (bufferSettings.unit === 'miles') {
      bufferDistance *= 1609.34;
    }

    const buffer = geometryEngine.geodesicBuffer(clickPoint, bufferDistance, "meters");

    // Create buffer graphic
    const bufferGraphic = new Graphic({
      geometry: buffer,
      symbol: bufferSymbol
    });

    // Add buffer graphic
    view.graphics.add(bufferGraphic);

    applyDefExp(buffer)
    // Zoom to buffer extent
  view.goTo({
    target: buffer.extent.expand(1.5)
  }, {
    duration: 1000,
    easing: "ease-out"
  });
  };

  const applyDefExp = async (geom) => {
    // Query facilities within buffer
    const facilityLayer = readLayerFromMap(config.healthCareFacilitiesLayerTitle);
    if (facilityLayer) {
      // Create query parameters
      const query = {
        geometry: geom,
        outFields: ["OBJECTID"],
      };

      // Execute query
      const results = await facilityLayer.queryFeatures(query);

      if (results.features.length > 0) {
        // Get ObjectIDs of features within buffer
        const objectIds = results.features.map(feature => feature.attributes.OBJECTID);

        // Apply definition expression using ObjectIDs
        facilityLayer.definitionExpression = `OBJECTID IN (${objectIds.join(',')})`;
      } else {
        // No features found - reset definition expression
        facilityLayer.definitionExpression = "1=1";
      }
    }
  };


  const handleReset = () => {
    view.graphics.removeAll();
    setClickPoint(null);
    const facilityLayer = view.map.findLayerById("yourFacilityLayerId");
    if (facilityLayer) {
      facilityLayer.definitionExpression = "1=1";
    }
  };
  const readLayerFromMap = (layerTitle) => {
    if (!view?.map) return null;
    return view.map.allLayers.find(layer => layer.title === layerTitle);
  };

  return (
    <div className="bufferWidgetContainer">
      <button
        className="bufferToggleButton"
        onClick={togglePanel}
        title="Buffer Analysis"
      >
        <div className="iconStack">
          <FaMapMarkerAlt className="locationIcon" />
        </div>
      </button>

      {isPanelOpen && (
        <div className="bufferPanel">
          <div className="bufferPanelHeader">
            <h3>Buffer Analysis</h3>
            <button className="closeButton" onClick={togglePanel}>
              <FaTimes />
            </button>
          </div>
          <div className="bufferControls">
            <button
              className={`bufferButton ${isActive ? 'active' : ''}`}
              onClick={() => setIsActive(true)}
            >
              Select Location
            </button>

            <div className="bufferInputs">
              <select
                value={bufferSettings.distance}
                onChange={(e) => setBufferSettings({ ...bufferSettings, distance: Number(e.target.value) })}
              >
                {distances.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>

              <select
                value={bufferSettings.unit}
                onChange={(e) => setBufferSettings({ ...bufferSettings, unit: e.target.value })}
              >
                {units.map(unit => (
                  <option key={unit} value={unit}>{unit}</option>
                ))}
              </select>
            </div>

            <div className="bufferActions">
              <button
                className="bufferButton"
                onClick={createBuffer}
                disabled={!clickPoint}
              >
                Apply Buffer
              </button>

              <button
                className="bufferButton"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Buffer;