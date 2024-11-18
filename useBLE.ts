import { useMemo, useState } from "react";
import { PermissionsAndroid, Platform } from "react-native";
import { BleError, BleManager, Characteristic, Device } from "react-native-ble-plx";
import { toByteArray } from "base64-js";

import * as ExpoDevice from "expo-device";

const SENSORS_UUID = "12345678-1234-5678-1234-56789abcdef0";
const SENSOR_CHARACTERISTIC = "abcdef12-3456-789a-bcde-f0123456789a";

interface BluetoothLowEnergyApi {
    requestPermissions(): Promise<boolean>;
    scanForPeripherals(): void;
    allDevices: Device[];
    connectToDevice: (deviceId:Device) => Promise<void>;
    connectedDevice: Device | null;
    byteStream: DataStream | null;
    disconnectFromDevice: () => void;
}

interface DataStream {
  ax: number;
  ay: number;
  az: number;
  gx: number;
  gy: number;
  gz: number;
}

function useBLE(): BluetoothLowEnergyApi {
    const bleManager = useMemo(() => new BleManager(), []);

    const [allDevices, setAllDevices] = useState<Device[]>([]);
    const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
    const [byteStream, setByteStream] = useState<DataStream>({ax:0,ay:0,az:0,gx:0,gy:0,gz:0});

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
            const deviceConnection = await bleManager.connectToDevice(device.id,{requestMTU:27})
            setConnectedDevice(deviceConnection);
            await deviceConnection.discoverAllServicesAndCharacteristics();
            bleManager.stopDeviceScan();
            startStreamingData(deviceConnection);
        } catch (e) {
            console.log("ERROR IN CONNECTION",e)
        }
    }        

    const onByteStreamUpdate = (
        error: BleError | null,
        characteristic: Characteristic | null
    ) => {
        if (error) {
            console.log(error);
            return
        } else if (!characteristic?.value) {
            console.log("No Data Received")
            return
        }

        const rawData = toByteArray(characteristic.value);
        const dv = new DataView(rawData.buffer);
        setByteStream({ax:dv.getFloat32(0,true)*9.81,
                       ay:dv.getFloat32(4,true)*9.81,
                       az:dv.getFloat32(8,true)*9.81,
                       gx:dv.getFloat32(12,true)*Math.PI/180,
                       gy:dv.getFloat32(16,true)*Math.PI/180,
                       gz:dv.getFloat32(20,true)*Math.PI/180
        });
    }

    const startStreamingData = async (device: Device) => {
        if (device) {
            device.monitorCharacteristicForService(
                SENSORS_UUID,
                SENSOR_CHARACTERISTIC,
                onByteStreamUpdate
            )
        }
    }

    const disconnectFromDevice = () => {
        if (connectedDevice) {
            bleManager.cancelDeviceConnection(connectedDevice.id);
            setConnectedDevice(null);
            setByteStream({ax:0,ay:0,az:0,gx:0,gy:0,gz:0})

        }
    }

    return {
        scanForPeripherals,
        requestPermissions,
        allDevices,
        connectToDevice,
        connectedDevice,
        byteStream,
        disconnectFromDevice
    };

}

export default useBLE;