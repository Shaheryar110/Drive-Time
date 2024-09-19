import {
  Button,
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { useEffect, useRef, useState } from 'react';
import MapView, { Callout, LatLng, Marker, Polyline } from 'react-native-maps';
import getDistance from 'geolib/es/getPreciseDistance';
import { requestCameraPermission } from '../../utils/camera-permission';
import { colors } from '../../constant';
import { requestLocationPermission } from '../../utils/camera-permission';
import Geolocation from '@react-native-community/geolocation';
import database from '@react-native-firebase/database';
import {
  getRides,
  updateAndPushData,
  updateDriverLocation,
} from '../../services/firebase-realtime/rides-services';
import { Timestamp } from '@react-native-firebase/firestore';
import OfferCard from '../../components/common/offer-card';
import { MyObjectType } from '../../types/types';
import { useSelector } from 'react-redux';
import { StoreState } from '../../redux/reduxStore';
import axios from 'axios';
import { LatLangProps } from '../user/search-rides';
import { decodePolyline } from '../../utils/map-functions';
import RideComplete from '../../components/common/ride-complete';
import { useUser } from '../../hooks/useUser';

const GOOGLE_MAPS_APIKEY = 'AIzaSyCMj4kAhPPoWAT32gMersFx7FkvMEW3560';
const FindRides = () => {
  const { updateRide } = useUser();
  const [currentLong, setCurrentLong] = useState(0);
  const [currentLat, setCurrentLat] = useState(0);
  const [offers, setOffers] = useState<MyObjectType[]>();
  const [isArrived, setIsArrived] = useState<Boolean>(false);
  const [isRideComplete, setIsRideComplete] = useState<Boolean>(false);
  const mapRef = useRef<MapView | null>(null);
  const userData = useSelector((state: StoreState) => state.user);
  const prevPositionRef = useRef<{ latitude: number; longitude: number } | null>(
    null,
  );
  const [selectedOffer, setselectedOffer] = useState<MyObjectType | null>(null);
  const [routeCoords, setRouteCoords] = useState<any[]>([]);
  const handleSubmitOk = () => {
    if (selectedOffer) {
      updateRide({ ...selectedOffer, driverInfo: userData });

      database()
        .ref(`/drive-time/rides/${selectedOffer.uid}`)
        .remove()
        .then(() => {
          console.log('Ride successfully removed from database.');
        })
        .catch(error => {
          console.error('Error removing ride:', error);
        });

      // Reset state
      setselectedOffer(null);
      setIsRideComplete(false);
    }
  };
  const calculateDistance = (
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number,
  ) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const R = 6371000; // Radius of the Earth in meters

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c; // Distance in meters
  };

  const getCurrentLocation = () => {
    Geolocation.getCurrentPosition(
      position => {
        const { latitude, longitude } = position.coords;

        setCurrentLat(latitude);
        setCurrentLong(longitude);

        if (selectedOffer && prevPositionRef.current) {
          const prevLat = prevPositionRef.current.latitude;
          const prevLong = prevPositionRef.current.longitude;

          if (calculateDistance(prevLat, prevLong, latitude, longitude) > 5) {
            updateDriverLocation(selectedOffer.uid, latitude, longitude);
          }
          // pickup_Location Status Check
          const pickUpDistance = calculateDistance(
            latitude,
            longitude,
            selectedOffer.pickupLocation.latitude,
            selectedOffer.pickupLocation.longitude,
          );
          if (pickUpDistance <= 50) {
            updateAndPushData(
              selectedOffer.uid,
              'Driver_Arrived',
              selectedOffer,
              userData,
              latitude,
              longitude,
            );
            console.log('Driver has arrived at the pickup location');
            setIsArrived(true);
            calculateRoute(
              selectedOffer.pickupLocation,
              selectedOffer.dropoffLocation,
            );
          }

          // dropOff_Location Status Check
          const dropOffDistance = calculateDistance(
            latitude,
            longitude,
            selectedOffer?.dropoffLocation?.latitude,
            selectedOffer?.dropoffLocation?.longitude,
          );
          if (dropOffDistance <= 50) {
            updateAndPushData(
              selectedOffer.uid,
              'Ride_Completed',
              selectedOffer,
              userData,
              latitude,
              longitude,
            );
            setIsRideComplete(true);
            console.log('Ride Completed');
          }
        }

        // Update the map view
        mapRef.current?.animateToRegion(
          {
            latitude,
            longitude,
            longitudeDelta: 0.05,
            latitudeDelta: 0.05,
          },
          500,
        );

        // Update the previous position ref
        prevPositionRef.current = { latitude, longitude };
      },
      error => {
        console.log(error);
      },
      {
        enableHighAccuracy: true,
        timeout: 30000,
        maximumAge: 20000,
      },
    );
  };

  const handleOfferAccept = (doc: MyObjectType) => {
    setselectedOffer(doc);
    updateAndPushData(
      doc?.uid,
      'Offer_accepted',
      doc,
      userData,
      currentLat,
      currentLong,
    ).then(data => {
      calculateRoute(
        { latitude: currentLat, longitude: currentLong },
        doc.pickupLocation,
      );
      setOffers([]);
    });
  };

  const calculateRoute = async (
    pickup: LatLangProps,
    dropoff: LatLangProps,
  ) => {
    const directionsUrl = `https://maps.googleapis.com/maps/api/directions/json?origin=${pickup.latitude},${pickup.longitude}&destination=${dropoff.latitude},${dropoff.longitude}&mode=driving&key=${GOOGLE_MAPS_APIKEY}`;
    try {
      const response = await axios.get(directionsUrl);
      const points = decodePolyline(
        response?.data.routes[0]?.overview_polyline.points,
      );
      setRouteCoords(points);
      mapRef?.current?.fitToCoordinates([pickup, dropoff], {
        edgePadding: {
          top: 50,
          right: 50,
          bottom: 50,
          left: 50,
        },
        animated: true,
      });
    } catch (error) {
      console.error('Error fetching directions: ', error);
    }
  };

  useEffect(() => {
    const intervalId = setInterval(() => {
      getCurrentLocation();
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (!selectedOffer) {
      database()
        .ref('/drive-time/rides')
        .on(
          'value',
          snapshot => {
            const allRides = snapshot.val();

            if (allRides) {
              const filteredRides = Object.keys(allRides)
                .map(key => allRides[key])
                .filter(ride => ride.status === 'Offer');
              setOffers(filteredRides);
            } else {
              console.log('No rides found.');
            }
          },
          error => { },
        );
    } else {
      const rideRef = database().ref(`/drive-time/rides/${selectedOffer.uid}`);

      const handleDataChange = (snapshot: { val: () => any }) => {
        const rideData = snapshot.val();

        if (rideData) {
          // Directly check the status of this single ride document
          if (rideData.status === 'Driver_Arrived') {
            setCurrentLat(rideData.pickupLocation.latitude);
            setCurrentLong(rideData.pickupLocation.longitude);
            setIsArrived(true);
            calculateRoute(
              selectedOffer?.pickupLocation,
              selectedOffer?.dropoffLocation,
            );
            console.log('Driver has arrived at the pickup location');
          }

          if (rideData.status === 'Ride_Completed') {
            setIsRideComplete(true);
            console.log('Ride Completed');
          }
        } else {
          console.log('Ride not found.');
        }
      };

      rideRef.on('value', handleDataChange, error => {
        console.log(error);
      });
      return () => {
        rideRef.off('value', handleDataChange);
      };
    }
  }, [selectedOffer]); // Added selectedOffer to dependencies to re-run the effect when it changes

  return (
    <View style={{ position: 'relative' }}>
      <MapView
        ref={mapRef}
        showsUserLocation
        userLocationPriority="high"
        showsMyLocationButton
        style={{ height: '100%', width: '100%' }}
        initialRegion={{
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.0522,
          longitudeDelta: 0.0421,
        }}
        zoomControlEnabled>
        {selectedOffer?.pickupLocation?.latitude &&
          selectedOffer?.pickupLocation?.longitude && (
            <>
              <Marker
                coordinate={{
                  latitude: currentLat,

                  longitude: currentLong,
                }}
              />
              <Marker
                coordinate={{
                  latitude: isArrived
                    ? selectedOffer?.dropoffLocation?.latitude
                    : selectedOffer?.pickupLocation?.latitude,
                  longitude: isArrived
                    ? selectedOffer?.dropoffLocation?.longitude
                    : selectedOffer?.pickupLocation?.longitude,
                }}
              />
            </>
          )}
        {routeCoords?.length > 0 && (
          <Polyline
            coordinates={routeCoords}
            strokeWidth={6}
            strokeColor="black"
            lineCap={'round'}
            lineJoin={'round'}
          />
        )}
      </MapView>

      {offers &&
        offers?.length > 0 &&
        offers?.map((data, index) => {
          return (
            <OfferCard
              key={index}
              data={data}
              handleOfferAccept={() => {
                handleOfferAccept(data);
              }}
            />
          );
        })}
      {isRideComplete && (
        <RideComplete
          fare={selectedOffer?.price}
          handleSubmitOk={handleSubmitOk}
        />
      )}
    </View>
  );
};

export default FindRides;
