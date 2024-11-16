import { useState } from 'react';
import { SafeAreaView, TouchableOpacity, View, Text } from 'react-native';
import DeviceModal from './DeviceConnectionModal';
import useBLE from './useBLE';
import { styles } from './styles';
import { BackHandler } from 'react-native';

export default function App() {
  const {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectToDevice,
    connectedDevice,
    byteStream,
    disconnectFromDevice
  } = useBLE();
  
  const [isModalVisible, setIsModalVisible] = useState<boolean>(false);

  const scanForDevices = async () => {
    const isPermissionsEnabled = await requestPermissions();
    if (isPermissionsEnabled) {
      scanForPeripherals();
    }
  }

  const hideModal = () => {
    setIsModalVisible(false);
  };

  const openModal = async () => {
    scanForDevices();
    setIsModalVisible(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {connectedDevice && byteStream &&
      <View>
        <Text>Acceleration:</Text>
        <Text>  x: {byteStream.getFloat32(0,true)*9.81}</Text>
        <Text>  y: {byteStream.getFloat32(4,true)*9.81}</Text>
        <Text>  z: {byteStream.getFloat32(8,true)*9.81}</Text>
        <Text>Gyroscope:</Text>
        <Text>  x: {byteStream.getFloat32(12,true)*Math.PI/180}</Text>
        <Text>  y: {byteStream.getFloat32(16,true)*Math.PI/180}</Text>
        <Text>  z: {byteStream.getFloat32(20,true)*Math.PI/180}</Text>
      </View>
      }
      <TouchableOpacity
        onPress={connectedDevice ? disconnectFromDevice : openModal}
        style={styles.ctaButton}
      >
        <Text style={styles.ctaButtonText}>
          {connectedDevice ? "Disconnect" : "Connect"}
        </Text>
      </TouchableOpacity>
      <DeviceModal
        closeModal={hideModal}
        visible={isModalVisible}
        connectToPeripheral={connectToDevice}
        devices={allDevices}
      />
    </SafeAreaView>
  );
}
