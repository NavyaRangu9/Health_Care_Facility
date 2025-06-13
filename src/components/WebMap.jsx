import React, { useEffect, useRef } from "react";
import MapView from "@arcgis/core/views/MapView";
import WebMap from "@arcgis/core/WebMap";
import { useMapContext } from "../context/MapContext";
import config from "../config.json";
import BasemapGallery from "@arcgis/core/widgets/BasemapGallery.js";


const WebMapComponent = () => {
  const mapDiv = useRef(null);
  const { setView } = useMapContext();
  // const { setView, setFacilityLayer, setBoundaryLayer } = useMapContext();

  useEffect(() => {
    if (mapDiv.current) {
      const webMap = new WebMap({
        portalItem: {
          id: config.webMapItemId,
        },
      });

      const view = new MapView({
        container: mapDiv.current,
        map: webMap,
      });
      setView(view);

      // webMap.when(() => {
      // const bg = new BasemapGallery({
      //   view: view
      // })
      // view.ui.add(bg,{
      //   position:"bottom-right"
      // })
      // });

      return () => {
        if(view)
        view.destroy();
      };
    }
  }, [setView]);

  return <div className="mapComponent" ref={mapDiv}></div>;
};

export default WebMapComponent;