import React, { useState, useEffect } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as BackgroundFetch from "expo-background-fetch";
import axios from "axios";
const LOCATION_TRACKING = "location-tracking";

export default function App() {
  useEffect(() => {
    async function watchPos(params) {
      let location = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          distanceInterval: 0,
          timeInterval: 1000 * 60,
        },
        async (location) => {
          let status = "";
          console.log("inside watch location");

          let lat1 = location.coords.latitude;
          let lon1 = location.coords.longitude;
          let lat2 = 31.9713089;
          let lon2 = 35.8350942;

          let distance = haversine(lat1, lon1, lat2, lon2);
          console.log(distance * 1000);
          if (distance * 1000 <= 10) {
            console.log("in building");
            status = "in building";
          } else {
            console.log("out building");
            status = "out building";
          }
          console.log(
            `${new Date(Date.now()).toLocaleString()}: ${lat1},${lon1}`
          );
          await axios
            .post(
              "https://20wvd.mocklab.io/thing/8",
              `from watch // ${status} // ${new Date(
                Date.now()
              ).toLocaleString()}: ${lat1},${lon1} `
            )
            .then((res) => console.log(res?.data));
        }
      );
    }

    watchPos();
  }, []);

  const startLocationTracking = async () => {
    const hasStarted = await BackgroundFetch.getStatusAsync();
    console.log("tracking started?", hasStarted);

    if (hasStarted === 3) {
      try {
        await BackgroundFetch.registerTaskAsync(LOCATION_TRACKING, {
          minimumInterval: 60,
          stopOnTerminate: false,
          startOnBoot: true,
        });
        console.log("Task registered");
      } catch (err) {
        console.log("Task Register failed:", err);
      }
    }
  };

  useEffect(() => {
    const config = async () => {
      let res1 = await Location.requestForegroundPermissionsAsync();
      let res2 = await Location.requestBackgroundPermissionsAsync();

      if (res1.status !== "granted" && res2.status !== "granted") {
        console.log("Permission to access location was denied");
      } else {
        console.log("Permission to access location granted");
      }
    };

    config();
  }, []);

  return (
    <View style={styles.container}>
      <Button title="Start tracking" onPress={startLocationTracking} />
      <Text>{result}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
});

TaskManager.defineTask(LOCATION_TRACKING, async () => {
  let status = "";
  console.log("in task now");
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.BestForNavigation,
    timeInterval: 0,
    distanceInterval: 0,
  });

  let lat1 = await location.coords.latitude;
  let lon1 = await location.coords.longitude;
  let lat2 = 31.9713089;
  let lon2 = 35.8350942;

  let distance = await haversine(lat1, lon1, lat2, lon2);
  console.log(distance * 1000);
  if (distance * 1000 <= 10) {
    console.log("in building");
    status = "in building";
  } else {
    console.log("out building");
    status = "in building";
  }
  console.log(`${new Date(Date.now()).toLocaleString()}: ${lat1},${lon1}`);
  await axios
    .post(
      "https://20wvd.mocklab.io/thing/8",
      `from background // ${status} // ${new Date(
        Date.now()
      ).toLocaleString()}: ${lat1},${lon1} `
    )
    .then((res) => console.log(res?.data));
});

function haversine(lat1, lon1, lat2, lon2) {
  // distance between latitudes
  // and longitudes
  let dLat = ((lat2 - lat1) * Math.PI) / 180.0;
  let dLon = ((lon2 - lon1) * Math.PI) / 180.0;

  // convert to radiansa
  lat1 = (lat1 * Math.PI) / 180.0;
  lat2 = (lat2 * Math.PI) / 180.0;

  // apply formulae
  let a =
    Math.pow(Math.sin(dLat / 2), 2) +
    Math.pow(Math.sin(dLon / 2), 2) * Math.cos(lat1) * Math.cos(lat2);
  let rad = 6377.830272;
  let c = 2 * Math.asin(Math.sqrt(a));
  return rad * c;
}
