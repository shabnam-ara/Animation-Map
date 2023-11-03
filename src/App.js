import React, { useState, useRef } from 'react';
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  IconButton,
  Input,
  SkeletonText,
  Text,
} from '@chakra-ui/react';
import { FaLocationArrow, FaTimes } from 'react-icons/fa';
import {
  useJsApiLoader,
  GoogleMap,
  Marker,
  Autocomplete,
  DirectionsRenderer,
} from '@react-google-maps/api';

const center = { lat: 20.5937, lng: 78.9629 };

function App() {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    libraries: ['places'],
  });

  const [map, setMap] = useState(null);
  const [directionsResponse, setDirectionsResponse] = useState(null);
  const [distance, setDistance] = useState('');
  const [duration, setDuration] = useState('');
  const [markerPosition, setMarkerPosition] = useState(null);

  const originRef = useRef();
  const destinationRef = useRef();

  if (!isLoaded) {
    return <SkeletonText />;
  }

  async function calculateRoute() {
    if (originRef.current.value === '' || destinationRef.current.value === '') {
      return;
    }
    // eslint-disable-next-line no-undef
    const directionsService = new google.maps.DirectionsService();
    const results = await directionsService.route({
      origin: originRef.current.value,
      destination: destinationRef.current.value,
      // eslint-disable-next-line no-undef
      travelMode: google.maps.TravelMode.DRIVING,
    });
    setDirectionsResponse(results);
    setDistance(results.routes[0].legs[0].distance.text);
    setDuration(results.routes[0].legs[0].duration.text);
  }

  function clearRoute() {
    setDirectionsResponse(null);
    setDistance('');
    setDuration('');
    originRef.current.value = '';
    destinationRef.current.value = '';
  }

  const handleMapClick = (e) => {
    setMarkerPosition({
      lat: e.latLng.lat(),
      lng: e.latLng.lng(),
    });
  };

  const callAPI = async () => {
    const url =
      'https://trueway-directions2.p.rapidapi.com/FindDrivingRoute?stops=40.629041%2C-74.025606%3B40.630099%2C-73.993521%3B40.644895%2C-74.013818%3B40.627177%2C-73.980853';

    const options = {
      method: 'GET',
      headers: {
        'X-RapidAPI-Key': '9c947e4bbamsh38952ce0e994af6p143cd2jsn26a113abfff3',
        'X-RapidAPI-Host': 'trueway-directions2.p.rapidapi.com',
      },
    };

    try {
      const response = await fetch(url, options);
      const result = await response.json();

      if (result.routes && result.routes.length > 0) {
        setDirectionsResponse(result.routes[0].legs);
        let totalDistance = 0;
        let totalDuration = 0;
        for (const leg of result.routes[0].legs) {
          totalDistance += leg.distance.value;
          totalDuration += leg.duration.value;
        }
        setDistance((totalDistance / 1000).toFixed(2) + ' km');
        setDuration((totalDuration / 60).toFixed(2) + ' min');
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Flex
      position='relative'
      flexDirection='column'
      alignItems='center'
      h='100vh'
      w='100vw'
    >
      <Box position='absolute' left={0} top={0} h='100%' w='100%'>
        <GoogleMap
          center={center}
          zoom={15}
          mapContainerStyle={{ width: '100%', height: '100%' }}
          options={{
            zoomControl: false,
            streetViewControl: false,
            mapTypeControl: false,
            fullscreenControl: false,
          }}
          onLoad={map => setMap(map)}
          onClick={handleMapClick}
        >
          {directionsResponse && (
            <DirectionsRenderer
              directions={directionsResponse}
              panel={document.getElementById('directions-panel')}
            />
          )}
          {markerPosition && (
            <Marker position={markerPosition} />
          )}
        </GoogleMap>
      </Box>
      <Box
        p={4}
        borderRadius='lg'
        m={4}
        bgColor='white'
        shadow='base'
        minW='container.md'
        zIndex='1'
      >
        <HStack spacing={2} justifyContent='space-between'>
          <Box flexGrow={1}>
            <Autocomplete>
              <Input type='text' placeholder='Origin' ref={originRef} />
            </Autocomplete>
          </Box>
          <Box flexGrow={1}>
            <Autocomplete>
              <Input
                type='text'
                placeholder='Destination'
                ref={destinationRef}
              />
            </Autocomplete>
          </Box>

          <ButtonGroup>
            <Button colorScheme='pink' type='submit' onClick={calculateRoute}>
              Calculate Route
            </Button>
            <Button
              colorScheme='teal'
              type='submit'
              onClick={callAPI}
            >
              Call API
            </Button>
            <IconButton
              aria-label='center back'
              icon={<FaTimes />}
              onClick={clearRoute}
            />
          </ButtonGroup>
        </HStack>
        <HStack spacing={4} mt={4} justifyContent='space-between'>
          <Text>Distance: {distance} </Text>
          <Text>Duration: {duration} </Text>
          <IconButton
            aria-label='center back'
            icon={<FaLocationArrow />}
            isRound
            onClick={() => {
              map.panTo(center);
              map.setZoom(15);
            }}
          />
        </HStack>
        <div id='directions-panel' style={{ marginTop: '16px' }}></div>
      </Box>
    </Flex>
  );
}

export default App;