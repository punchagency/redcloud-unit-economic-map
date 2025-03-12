import { Autocomplete, Button, Container, FormControl, Grid2, MenuItem, Paper, Select, Stack, TextField, Typography } from '@mui/material';
import axios from 'axios';
import L, { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useEffect, useState } from 'react';
import { useForm } from "react-hook-form";
import { GeoJSON, MapContainer, TileLayer, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';

// Define the state interface based on the API response
interface StateData {
  _id: {
    $oid: string;
  };
  state_name: string;
  state_code: string;
  country_name: string;
  geometry?: any; // Optional geometry data
}

// Add LGA interface
interface LgaData {
  _id: {
    $oid: string;
  };
  lga_name: string;
  lga_code: string;
  state_code: string;
  state_name: string;
}

interface FormData {
  userSelectedState: string;
  userSelectedLga: string;
  proprietorCity: string;
  startDate: string;
  endDate: string;
}

// Update the MapDataItem interface to match the API response
interface MapDataItem {
  type: string;
  id: string;
  properties: {
    name: string;
    count: number;
    avgRetailerDensity: number;
    avgRevenue: number;
    avgTTV: number;
    avgTransactionFrequency: number;
    [key: string]: any;
  };
  geometry: {
    type: string;
    coordinates: number[][][][];
  };
}

// Add this component to handle map view updates
const MapUpdater: React.FC<{ 
  selectedState: StateData | null, 
  mapData: MapDataItem[] 
}> = ({ selectedState, mapData }) => {
  const map = useMap();
  
  useEffect(() => {
    if (selectedState && mapData.length > 0) {
      // Try to find bounds from the map data
      try {
        // Create a GeoJSON layer with the map data to get its bounds
        const geoJsonLayer = L.geoJSON(mapData as any);
        
        const bounds = geoJsonLayer.getBounds();
        
        // Check if bounds are valid
        if (bounds.isValid()) {
          map.fitBounds(bounds);
          return;
        }
      } catch (error) {
        console.error("Error fitting to bounds:", error);
      }
      
      // Fallback: Use center coordinates for Nigeria states
      const stateCoordinates: Record<string, [number, number]> = {
        'Lagos': [6.5244, 3.3792],
        'Abuja': [9.0765, 7.3986],
        'Kano': [12.0022, 8.5920],
        'Rivers': [4.8156, 7.0498],
        // Add more states as needed
      };
      
      const coordinates = stateCoordinates[selectedState.state_name];
      if (coordinates) {
        map.setView(coordinates, 8);
      }
    } else {
      // Reset to default view of Nigeria
      map.setView([9.0820, 8.6753], 6);
    }
  }, [map, selectedState, mapData]);
  
  return null;
};

const Map: React.FC = () => {
  const navigate = useNavigate();
  const [selectedState, setSelectedState] = useState<StateData | null>(null);
  const [selectedLga, setSelectedLga] = useState<LgaData | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'density' | 'revenue' | 'ttv' | 'transaction_frequency'>('ttv');
  const [mapData, setMapData] = useState<MapDataItem[]>([]);
  const [states, setStates] = useState<StateData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [lgas, setLgas] = useState<LgaData[]>([]);
  const [lgasLoading, setLgasLoading] = useState<boolean>(false);
  const [mapDataLoading, setMapDataLoading] = useState<boolean>(false);

  const { handleSubmit, register, setValue } = useForm<FormData>({
    defaultValues: {
      userSelectedState: "",
      userSelectedLga: ""
    },
  });

  // Fetch states from API
  useEffect(() => {
    const fetchStates = async () => {
      setLoading(true);
      try {
        const response = await axios.get('https://unit-economic.punchapps.cool/api/v1/states?page=1&page_size=100');
        setStates(response.data.data);
      } catch (error) {
        console.error('Error fetching states:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStates();
  }, []);

  // Add useEffect to fetch LGAs when state is selected
  useEffect(() => {
    const fetchLgas = async () => {
      if (!selectedState) return;
      
      setLgasLoading(true);
      try {
        const response = await axios.get(
          `https://unit-economic.punchapps.cool/api/v1/lgas?page=1&page_size=100&state_code=${selectedState.state_code}`
        );
        setLgas(response.data.data);
      } catch (error) {
        console.error('Error fetching LGAs:', error);
        setLgas([]);
      } finally {
        setLgasLoading(false);
      }
    };
    
    fetchLgas();
  }, [selectedState]);

  const handleStateChange = (_event: any, value: StateData | null) => {
    setSelectedState(value);
    setSelectedLga(null);
    setValue("userSelectedLga", "");
    
    // Clear map data when state changes
    if (mapData.length > 0) {
      setMapData([]);
    }
  };

  const handleRegionClick = (region: string) => {
    navigate('/insights', { state: { region } });
  };

  const onSubmit = (data: FormData) => {
    fetchMapData();
  }

  const center: LatLngExpression = [9.0820, 8.6753];
  const zoom: number = 6;

  // Add this function to get formatted date strings
  const getFormattedDate = (date: Date): string => {
    return date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
  };

  // Set default dates in the component
  const today = new Date();
  const lastMonth = new Date();
  lastMonth.setMonth(today.getMonth() - 1);

  const [startDate, setStartDate] = useState<string>(getFormattedDate(lastMonth));
  const [endDate, setEndDate] = useState<string>(getFormattedDate(today));

  // Update the fetchMapData function
  const fetchMapData = async () => {
    if (!selectedState) {
      alert("Please select a state");
      return;
    }
    
    if (!startDate || !endDate) {
      alert("Please select start and end dates");
      return;
    }

    setMapDataLoading(true);
    try {
      const url = new URL('https://unit-economic.punchapps.cool/api/v1/sales');
      url.searchParams.append('page', '1');
      url.searchParams.append('page_size', '100');
      url.searchParams.append('start_date', startDate);
      url.searchParams.append('end_date', endDate);
      url.searchParams.append('state_id', selectedState._id.$oid);
      
      // Only add LGA parameter if an LGA is selected
      if (selectedLga) {
        url.searchParams.append('lga_id', selectedLga._id.$oid);
      }

      const response = await fetch(url.toString());
      const result = await response.json();
      
      // Check if data exists and is an array
      if (result && result.data && Array.isArray(result.data)) {
        setMapData(result.data);
        console.log("Map data loaded:", result.data);
      } else {
        // Handle empty data
        setMapData([]);
        console.log("No data returned from API");
      }
    } catch (error) {
      console.error('Error fetching map data:', error);
      setMapData([]);
    } finally {
      setMapDataLoading(false);
    }
  };

  // Add helper function to get color based on metrics
  const getColorByMetric = (value: number, metric: 'density' | 'revenue' | 'ttv' | 'transaction_frequency') => {
    // Customize these color scales based on your data ranges
    const colorScales = {
      density: ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'],
      revenue: ['#edf8e9', '#bae4b3', '#74c476', '#31a354', '#006d2c'],
      ttv: ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'],
      transaction_frequency: ['#f2f0f7', '#cbc9e2', '#9e9ac8', '#756bb1', '#54278f']
    };

    // Adjust these thresholds based on your data
    const thresholds = [10, 100, 1000, 10000];
    
    const scale = colorScales[metric];
    for (let i = 0; i < thresholds.length; i++) {
      if (value <= thresholds[i]) return scale[i];
    }
    return scale[scale.length - 1];
  };

  // Style function for map data
  const mapDataStyle = (feature: any) => {
    if (!feature.properties) {
      return {
        fillColor: '#cccccc',
        weight: 1,
        opacity: 1,
        color: 'white',
        fillOpacity: 0.5
      };
    }

    // Map the metric names to the API response property names
    const metricMapping = {
      'density': 'avgRetailerDensity',
      'revenue': 'avgRevenue',
      'ttv': 'avgTTV',
      'transaction_frequency': 'avgTransactionFrequency'
    };
    
    const apiMetricName = metricMapping[selectedMetric];
    
    return {
      fillColor: getColorByMetric(feature.properties[apiMetricName], selectedMetric),
      weight: 1,
      opacity: 1,
      color: 'white',
      fillOpacity: 0.7
    };
  };

  // Event handler for map features
  const onEachFeature = (feature: any, layer: any) => {
    if (feature.properties) {
      const { name, count, avgRetailerDensity, avgRevenue, avgTTV, avgTransactionFrequency } = feature.properties;
      layer.bindPopup(`
        <strong>${name}</strong><br>
        Count: ${count}<br>
        Avg Retailer Density: ${avgRetailerDensity.toFixed(2)}<br>
        Avg Revenue: ${avgRevenue.toFixed(2)}<br>
        Avg TTV: ${avgTTV.toFixed(2)}<br>
        Avg Transaction Frequency: ${avgTransactionFrequency.toFixed(2)}
      `);
    }
  };

  // Add this function to handle metric change
  const handleMetricChange = (event: React.ChangeEvent<{ value: unknown }>) => {
    setSelectedMetric(event.target.value as 'density' | 'revenue' | 'ttv' | 'transaction_frequency');
  };

  // Add a reset function
  const handleReset = () => {
    // Reset state selections
    setSelectedState(null);
    setSelectedLga(null);
    
    // Reset form values
    setValue("userSelectedState", "");
    setValue("userSelectedLga", "");
    
    // Reset dates to default (last month to today)
    setStartDate(getFormattedDate(lastMonth));
    setEndDate(getFormattedDate(today));
    
    // Clear map data
    setMapData([]);
    
    // Reset metric to default
    setSelectedMetric('ttv');
  };

  return (
    <Container sx={{ mt: 4 }}>
      <Grid2 container spacing={3} justifyContent="center">
        <Grid2 size={4}>
          <Paper style={{ padding: 16 }}>
            <Grid2 container spacing={2}>
              <Grid2 size={12}>
                <Typography variant="h6" gutterBottom>
                  Unit Economic Map
                </Typography>
              </Grid2>
              <Grid2 size={12}>
                <Autocomplete
                  options={states}
                  getOptionLabel={(option) => option.state_name}
                  value={selectedState}
                  onChange={handleStateChange}
                  loading={loading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="State"
                      fullWidth
                      required
                      {...register("userSelectedState", { required: true })}
                    />
                  )}
                />
              </Grid2>
              <Grid2 size={12}>
                <Autocomplete
                  options={lgas}
                  getOptionLabel={(option) => option.lga_name}
                  value={selectedLga}
                  onChange={(_event, value) => {
                    setSelectedLga(value);
                    setValue("userSelectedLga", value ? value.lga_name : "");
                    
                    // Clear map data when LGA changes
                    if (mapData.length > 0) {
                      setMapData([]);
                    }
                  }}
                  loading={lgasLoading}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="LGA (Optional - Leave empty for all LGAs)"
                      fullWidth
                      {...register("userSelectedLga", { required: false })}
                    />
                  )}
                />
              </Grid2>
              <Grid2 size={12}>
                <TextField
                  type="date"
                  label="Start Date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={startDate}
                  {...register("startDate", { 
                    required: true,
                    onChange: (e) => setStartDate(e.target.value) 
                  })}
                  sx={{ mt: 2 }}
                />
              </Grid2>
              <Grid2 size={12}>
                <TextField
                  type="date"
                  label="End Date"
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  value={endDate}
                  {...register("endDate", { 
                    required: true,
                    onChange: (e) => setEndDate(e.target.value) 
                  })}
                  sx={{ mt: 2 }}
                />
              </Grid2>
              <Grid2 size={12}>
                <Stack direction='column' spacing={2}>
                <Button 
                    variant="contained" 
                    color="primary" 
                    fullWidth 
                    onClick={handleSubmit(onSubmit)}
                    disabled={mapDataLoading}
                  >
                    {mapDataLoading ? "Loading..." : "Get Insights"}
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    fullWidth 
                    onClick={handleReset}
                  >
                    Reset
                  </Button>
                </Stack>
              </Grid2>
            </Grid2>
          </Paper>
        </Grid2>
        <Grid2 size={8}>
          <Paper style={{ padding: 10, marginBottom: 10 }}>
            <Grid2 container spacing={2} alignItems="center">
              <Grid2 size={4}>
                <Typography variant="subtitle1">Select Metric:</Typography>
              </Grid2>
              <Grid2 size={8}>
                <FormControl fullWidth>
                  <Select
                    value={selectedMetric}
                    onChange={(e) => setSelectedMetric(e.target.value as typeof selectedMetric)}
                    displayEmpty
                  >
                    <MenuItem value="density">Retailer Density</MenuItem>
                    <MenuItem value="revenue">Revenue</MenuItem>
                    <MenuItem value="ttv">TTV</MenuItem>
                    <MenuItem value="transaction_frequency">Transaction Frequency</MenuItem>
                  </Select>
                </FormControl>
              </Grid2>
            </Grid2>
          </Paper>
          
          <MapContainer center={center} zoom={zoom} style={{ height: '60vh', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            />
            
            {/* Add the MapUpdater component */}
            <MapUpdater selectedState={selectedState} mapData={mapData} />
            
            {/* Render Map Data GeoJSON */}
            {mapData.length > 0 && (
              <GeoJSON 
                key={JSON.stringify(mapData)}
                data={mapData as any}
                style={mapDataStyle}
                onEachFeature={onEachFeature}
              />
            )}
          </MapContainer>
          
          {/* Legend */}
          {selectedState && (
            <Paper style={{ padding: 10, marginTop: 10 }}>
              <Typography variant="subtitle1" gutterBottom>
                {selectedState.state_name} {selectedLga ? `- ${selectedLga.lga_name}` : '- All LGAs'}
              </Typography>
              <Typography variant="body2">
                {mapData.length > 0 ? (
                  <>
                    Showing data for {selectedMetric === 'density' ? 'Retailer Density' : 
                      selectedMetric === 'revenue' ? 'Revenue' : 
                      selectedMetric === 'ttv' ? 'TTV' : 
                      'Transaction Frequency'}
                  </>
                ) : (
                  'No data available for the selected filters'
                )}
              </Typography>
              
              {/* Color scale legend */}
              {mapData.length > 0 && (
                <div>
                  <div style={{ display: 'flex', marginTop: 10 }}>
                    {(selectedMetric === 'density' ? 
                      ['#fee5d9', '#fcae91', '#fb6a4a', '#de2d26', '#a50f15'] : 
                      selectedMetric === 'revenue' ? 
                      ['#edf8e9', '#bae4b3', '#74c476', '#31a354', '#006d2c'] :
                      selectedMetric === 'ttv' ?
                      ['#eff3ff', '#bdd7e7', '#6baed6', '#3182bd', '#08519c'] :
                      ['#f2f0f7', '#cbc9e2', '#9e9ac8', '#756bb1', '#54278f']
                    ).map((color, i) => (
                      <div key={i} style={{ 
                        backgroundColor: color, 
                        width: '20%', 
                        height: 20 
                      }} />
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginTop: 2 }}>
                    <span>Low</span>
                    <span>High</span>
                  </div>
                </div>
              )}
            </Paper>
          )}
          
          {/* Results summary */}
          {mapData.length > 0 && (
            <Paper style={{ padding: 10, marginTop: 10 }}>
              <Typography variant="subtitle1">
                Results: {mapData.length} {mapData.length === 1 ? 'area' : 'areas'} found
              </Typography>
            </Paper>
          )}
        </Grid2>
      </Grid2>
      
      {/* Loading indicator */}
      {mapDataLoading && (
        <Paper style={{ padding: 10, marginTop: 10, textAlign: 'center' }}>
          <Typography>Loading map data...</Typography>
        </Paper>
      )}
    </Container>
  );
};

export default Map;