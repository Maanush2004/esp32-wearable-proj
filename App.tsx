import { useState } from 'react';
import { SafeAreaView, TouchableOpacity, StyleSheet, Text } from 'react-native';
import DeviceModal from './DeviceConnectionModal';
import useBLE from './useBLE';
import { styles } from './styles';

export default function App() {
  const {
    requestPermissions,
    scanForPeripherals,
    allDevices,
    connectToDevice,
    connectedDevice
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
      <Text>Hello Guys</Text>
      <TouchableOpacity
        onPress={openModal}
        style={styles.ctaButton}
      >
        <Text style={styles.ctaButtonText}>
          {"Connect"}
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
