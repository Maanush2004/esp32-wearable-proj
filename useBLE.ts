import { useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleManager, Device } from "react-native-ble-plx";

import * as ExpoDevice from "expo-device"

interface BluetoothLowEnergyApi {
    requestPermissions(): Promise<boolean>;
    scanForPeripherals(): void;
    allDevices: Device[],
    connectToDevice: (deviceId:Device) => Promise<void>;
    connectedDevice: Device | null
}

function useBLE(): BluetoothLowEnergyApi {
    const bleManager = useMemo(() => new BleManager(), []);

    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);

    const requestAndroid31Permissions = async () => {
        const bluetoothScanPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        const bluetoothConnectPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );
        const fineLocationPermission = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: "Location Permission",
            message: "Bluetooth Low Energy requires Location",
            buttonPositive: "OK",
          }
        );

        return (
          bluetoothScanPermission === "granted" &&
          bluetoothConnectPermission === "granted" &&
          fineLocationPermission === "granted"
        );
      };

      const requestPermissions = async () => {
        if (Platform.OS === "android") {
          if ((ExpoDevice.platformApiLevel ?? -1) < 31) {
            const granted = await PermissionsAndroid.request(
              PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
              {
                title: "Location Permission",
                message: "Bluetooth Low Energy requires Location",
                buttonPositive: "OK",
              }
            );
            return granted === PermissionsAndroid.RESULTS.GRANTED;
          } else {
            const isAndroid31PermissionsGranted =
              await requestAndroid31Permissions();

            return isAndroid31PermissionsGranted;
          }
        } else {
          return true;
        }
      };

      const isDuplicateDevice = (devices: Device[], nextDevice: Device) =>
        devices.findIndex((device) => nextDevice.id === device.id) > -1;

      const scanForPeripherals = () =>
        bleManager.startDeviceScan(null, null, (error, device) => {
          if (error) {
            console.log(error);
          }
          if (device && device.name?.includes("ESP32_MPU6050")) {
            setAllDevices((prevState: Device[]) => {
              if (!isDuplicateDevice(prevState, device)) {
                return [...prevState, device];
              }
              return prevState;
            });
          }
        });

    const connectToDevice = async (device: Device) => {
        try {
            const deviceConnection = await bleManager.connectToDevice(device.id)
            setConnectedDevice(deviceConnection);
            await deviceConnection.discoverAllServicesAndCharacteristics();
            bleManager.stopDeviceScan()
        } catch (e) {
            console.log("ERROR IN CONNECTION",e)
        }
    }        

    return {
        scanForPeripherals,
        requestPermissions,
        allDevices,
        connectToDevice,
        connectedDevice
    };

}

export default useBLE;