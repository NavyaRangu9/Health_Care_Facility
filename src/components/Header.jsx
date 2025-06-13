
import React, { useEffect, useState } from "react";
import FeatureLayer from "@arcgis/core/layers/FeatureLayer";
import config from "../config.json";
import { useMapContext } from '../context/MapContext';
import Graphic from "@arcgis/core/Graphic";
import { SimpleFillSymbol } from "@arcgis/core/symbols";

const DEFAULT_FILTERS = {
    state: "State",
    district: "District",
    facilityType: "FacilityType",
};

var facilityLayer = null;
var stateLayer = null;
var districtLayer = null;

const Header = () => {
    const { view } = useMapContext();
    const [filters, setFilters] = useState({
        state: "State",
        district: "District",
        facilityType: "FacilityType",
    });

    const [stateOptions, setStateOptions] = useState([]);
    const [districtOptions, setDistrictOptions] = useState([]);
    const [facilityTypeOptions, setFacilityTypeOptions] = useState([]);

    const readLayerFromMap = (layerTitle) => {
        if (!view?.map) return null;
        return view.map.allLayers.find(layer => layer.title === layerTitle);
    };

    // Query unique states on mount
    useEffect(() => {
        fetchStates();
    }, []);

    const fetchStates = async () => {
        const result = await queryFeatures(config.HealthCareFacilitiesLayreUrl, "1=1", ["State"]);
        setStateOptions(
            Array.from(new Set(result.features.map((f) => f.attributes.State))).filter(Boolean)
        );
    };
    const queryFeatures =  (seviceUrl, whereClause, outFields) => {
         const layer = new FeatureLayer({ url: seviceUrl });
         return layer.queryFeatures({
            where: whereClause,
            outFields: outFields,
            returnDistinctValues: true,
            returnGeometry: false,
        });
    }
    // Query districts when state changes
    useEffect(() => {
        var whereClause = "1=1";
        if (filters.state !== "State") {
            whereClause = `State='${filters.state}'`;
        }
        const fetchDistricts = async () => {
            const result = await queryFeatures(config.HealthCareFacilitiesLayreUrl,whereClause,["District"])
            setDistrictOptions(
                Array.from(new Set(result.features.map((f) => f.attributes.District))).filter(Boolean)
            );
        };
        fetchDistricts();
    }, [filters.state]);

    // Query facility types when state or district changes
    useEffect(() => {
        var whereClause = [];
        if (filters.state !== "State") {
            whereClause.push(`State='${filters.state}'`);
        }
        if (filters.district !== "District") {
            whereClause.push(`District='${filters.district}'`);
        }
        whereClause = whereClause.length > 0 ? whereClause.join(" AND ") : "1=1";

        const fetchFacilityTypes = async () => {
            const layer = new FeatureLayer({ url: config.HealthCareFacilitiesLayreUrl });
            const result = await layer.queryFeatures({
                where: whereClause,
                outFields: ["FacilityType"],
                returnDistinctValues: true,
                returnGeometry: false,
            });
            setFacilityTypeOptions(
                Array.from(new Set(result.features.map((f) => f.attributes.FacilityType))).filter(Boolean)
            );
        };
        fetchFacilityTypes();
    }, [filters.state, filters.district]);

    const handleApply = () => {
        const activeFilters = Object.entries(filters).reduce((acc, [key, value]) => {
            if (value !== DEFAULT_FILTERS[key]) {
                acc.push(`${key}='${value}'`);
            }
            return acc;
        }, []);


        const definitionExpression = activeFilters.length ? activeFilters.join(" AND ") : "1=1";
        facilityLayer = facilityLayer ? facilityLayer : readLayerFromMap(config.healthCareFacilitiesLayerTitle);
        if (!facilityLayer) return;
        facilityLayer.definitionExpression = definitionExpression;

        var boundaryExpression = null;
        var boundaryLayer = null;
        if (filters.state !== "State") {
            // readLayerFromMap(config.StateLayerTitle)
            boundaryLayer = stateLayer = stateLayer ? stateLayer : readLayerFromMap(config.StateLayerTitle);
            boundaryExpression = `Name='${filters.state}'`;
            if (stateLayer) {
                stateLayer.definitionExpression = boundaryExpression
            }
        }

        if (filters.district !== "District") {
            boundaryLayer = districtLayer = districtLayer ? districtLayer : readLayerFromMap(config.DistrictLayerTitle)
            boundaryExpression = `Name='${filters.district}'`;
            if (districtLayer) {
                districtLayer.definitionExpression = boundaryExpression;
            }
        }

        if (boundaryExpression) highlightBoundary(boundaryExpression, boundaryLayer)
    };

    const handleReset = () => {
        if (view)
            view.graphics.removeAll();
        if (districtLayer)
            districtLayer.definitionExpression = "1=1";
        if (stateLayer)
            stateLayer.definitionExpression = "1=1";
        if (facilityLayer)
            facilityLayer.definitionExpression = "1=1";
        setFilters(DEFAULT_FILTERS);
        setDistrictOptions([]);
        setFacilityTypeOptions([]);
    };

    const highlightBoundary = async (definitionExpression, layer) => {
        if (!view) return;
        // Clear any existing graphics
        view.graphics.removeAll();

        try {
            // Query the boundary features based on filters
            const query = {};
            query.where = definitionExpression;
            query.returnGeometry = true;
            query.outFields = ["Name"];



            if (!layer) return;

            const results = await layer.queryFeatures(query);

            if (results.features.length > 0) {
                // Create highlight symbol
                const highlightSymbol = new SimpleFillSymbol({
                    color: [255, 255, 0, 0.3],
                    outline: {
                        color: [255, 255, 0],
                        width: 2
                    }
                });

                // Add highlight graphics
                results.features.forEach((feature) => {
                    const graphic = new Graphic({
                        geometry: feature.geometry,
                        symbol: highlightSymbol
                    });
                    view.graphics.add(graphic);
                });

                // Zoom to the features
                view.goTo(results.features);
            }
        } catch (error) {
            console.error("Error highlighting boundary:", error);
        }
    };

    return (
        <div className="headerContainer">
            <div className="headerTitle">HealthCare Facility</div>
            <div className="filterSection">
                <label>
                    State
                    <select
                        className="filterDropDown"
                        value={filters.state}
                        onChange={(e) => setFilters({ ...filters, state: e.target.value, district: "District", facilityType: "FacilityType" })}
                    >
                        <option value="State">State</option>
                        {stateOptions.map((state) => (
                            <option key={state} value={state}>
                                {state}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    District
                    <select
                        className="filterDropDown"
                        value={filters.district}
                        onChange={(e) => setFilters({ ...filters, district: e.target.value, facilityType: "FacilityType" })}
                    // disabled={filters.state === "State"}
                    >
                        <option value="District">District</option>
                        {districtOptions.map((district) => (
                            <option key={district} value={district}>
                                {district}
                            </option>
                        ))}
                    </select>
                </label>
                <label>
                    Facility Type
                    <select
                        className="filterDropDown ftDropDown"
                        value={filters.facilityType}
                        onChange={(e) => setFilters({ ...filters, facilityType: e.target.value })}
                    >
                        <option value="FacilityType">Facility Type</option>
                        {facilityTypeOptions.map((facilityType) => (
                            <option key={facilityType} value={facilityType}>
                                {facilityType}
                            </option>
                        ))}
                    </select>
                </label>
            </div>
            <div className="buttonSection">
                <button className="filterButtons" onClick={handleApply}>Apply</button>
                <button className="filterButtons" onClick={handleReset}>Reset</button>
            </div>
        </div>
    );
};

export default Header;
