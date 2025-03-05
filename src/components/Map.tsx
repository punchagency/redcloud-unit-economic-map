import { Autocomplete, Button, Container, Grid2, Paper, TextField, Typography } from '@mui/material';
import { Country, ICountry, IState, State } from "country-state-city";
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import React, { useMemo, useState } from 'react';
import { useForm } from "react-hook-form";
import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import nigeriaStatesAndLgas from '../utils/nigeria-state-and-lgas.json';

interface FormData {
  userSelectedCountry: string;
  userSelectedState: string;
  userSelectedLga: string;
  proprietorCity: string;
}

const Map: React.FC = () => {
  const navigate = useNavigate();
  const countries = useMemo(() => Country.getAllCountries(), []);
  const [selectedCountry, setSelectedCountry] = useState<ICountry | null>(null);
  const [selectedState, setSelectedState] = useState<IState | null>(null);
  const [selectedLga, setSelectedLga] = useState<string | null>(null);

  const states = useMemo(
    () => (selectedCountry ? State.getStatesOfCountry(selectedCountry.isoCode) : []),
    [selectedCountry]
  );

  const lgas = useMemo(() => {
    if (!selectedState || selectedCountry?.isoCode !== "NG") return [];
    const stateData = nigeriaStatesAndLgas.find((state) => state.state === selectedState.name);
    return stateData ? stateData.lgas : [];
  }, [selectedState, selectedCountry]);

  const { handleSubmit, register, setValue } = useForm<FormData>({
    defaultValues: {
      userSelectedCountry: "",
      userSelectedState: "",
      userSelectedLga: ""
    },
  });

  const handleCountryChange = (_event: any, value: ICountry | null) => {
    setSelectedCountry(value);
    setSelectedState(null);
    setValue("userSelectedState", "");
    setValue("userSelectedLga", "");
  };

  const handleStateChange = (_event: any, value: IState | null) => {
    setSelectedState(value);
    setValue("userSelectedLga", "");
  };

  const handleRegionClick = (region: string) => {
    navigate('/insights', { state: { region } });
  };

  const onSubmit = (data: FormData) => {
    console.log(data);
  }

  const center: LatLngExpression = [9.0820, 8.6753];
  const zoom: number = 6;

  return (
    <Container>
      <Grid2 container spacing={2}>
        <Grid2 size={4}>
          <Paper style={{ padding: 16 }}>
            <Grid2 container spacing={2}>
              <Grid2 size={12}>
                <Typography variant="h4" gutterBottom>
                  Unit Economic Map
                </Typography>
              </Grid2>
              <Grid2 size={12}>
                <Autocomplete
                  options={countries}
                  getOptionLabel={(option) => option.name}
                  value={selectedCountry}
                  onChange={handleCountryChange}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Country"
                      fullWidth
                      required
                      {...register("userSelectedCountry", { required: true })}
                    />
                  )}
                />
              </Grid2>
              <Grid2 size={12}>
                <Autocomplete
                  options={states}
                  getOptionLabel={(option) => option.name}
                  value={selectedState}
                  onChange={handleStateChange}
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
                  getOptionLabel={(option) => option}
                  value={selectedLga}
                  onChange={(_event, value) => setSelectedLga(value)}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="LGA"
                      fullWidth
                      required
                      {...register("userSelectedLga", { required: true })}
                    />
                  )}
                />
              </Grid2>
              <Grid2 size={12}>
                <Button variant="contained" color="primary" fullWidth onClick={handleSubmit(onSubmit)}>
                  Get Insights
                </Button>
              </Grid2>
            </Grid2>
          </Paper>
        </Grid2>
        <Grid2 size={8}>
          <MapContainer center={center} zoom={zoom} style={{ height: '60vh', width: '100%' }}>
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution="&copy; <a href='https://www.openstreetmap.org/copyright'>OpenStreetMap</a> contributors"
            />
            <Marker position={center}>
              <Popup>
                <Button variant="contained" onClick={() => handleRegionClick('Region 1')}>
                  Region 1
                </Button>
              </Popup>
            </Marker>
          </MapContainer>
        </Grid2>
      </Grid2>
    </Container>
  );
};

export default Map;