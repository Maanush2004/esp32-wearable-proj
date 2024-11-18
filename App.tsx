import { useState, useEffect } from 'react';
import { SafeAreaView, TouchableOpacity, View, Text } from 'react-native';
import DeviceModal from './DeviceConnectionModal';
import useBLE from './useBLE';
import { styles } from './styles';

import * as tf from "@tensorflow/tfjs";
import { bundleResourceIO } from '@tensorflow/tfjs-react-native';

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
  const [values,setValues] = useState<Array<Array<number>>>([]);

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

  useEffect(()=>{
     if (byteStream) {
       setValues((prevValues) => [...prevValues, Object.values(byteStream)])
     }
   },[byteStream]);

  const labels = ['Back-Hand Netlift','Back-hand Drop','Back-hand Lift','Back-hand Push','Back-hand Service','Back-hand Tap','Back-hand Toss','Front Jump Smash','Front-Hand Netlift','Front-hand Drop','Front-hand Lift','Front-hand Push','Front-hand Service','Front-hand Smash','Front-hand Tap','Front-hand Toss']

  const modelJson = require('./assets/model.json');
  const weights = require('./assets/group1-shard1of1.bin')

  const loadModel = async()=>{
        const model = await tf.loadGraphModel(
            bundleResourceIO(modelJson, weights)
        ).catch((e)=>{
          console.log("[LOADING ERROR] info:",e)
        })
        return model
    }

  const transformArrayToTensor = () => {
    let arr = values;
    setValues([]);
    console.log(arr.length)
    if (arr.length > 180) arr.splice(0,181);
    while (arr.length < 180) arr.push([0,0,0,0,0,0]);
    const tensor = tf.tensor([arr]);
    return tensor;
  }

  const makePredictions = async (model: tf.GraphModel, tensor: tf.Tensor)=> {
    let output: tf.Tensor;
    try {
      output = await model.executeAsync(tensor) as tf.Tensor;
      alert(labels[output.argMax(-1).dataSync()[0]]);
    } catch (error) {
      console.log(error)
    }
  }

  const getPredictions = async() => {
    await tf.ready()
    console.log("Loading Model")
    const model = await loadModel() as tf.GraphModel;
    console.log("Preprocessing data")
    const tensor = transformArrayToTensor();
    console.log("Predicting")
    await makePredictions(model,tensor);
    console.log("Done")
  }

  return (
    <SafeAreaView style={styles.container}>
      {connectedDevice && byteStream &&
      <View>
        <Text>Acceleration:</Text>
        <Text>  x: {byteStream.ax}</Text>
        <Text>  y: {byteStream.ay}</Text>
        <Text>  z: {byteStream.az}</Text>
        <Text>Gyroscope:</Text>
        <Text>  x: {byteStream.gx}</Text>
        <Text>  y: {byteStream.gy}</Text>
        <Text>  z: {byteStream.gz}</Text>
      </View>
      }
      <TouchableOpacity
        onPress={connectedDevice ? async () => {disconnectFromDevice(); await getPredictions();} : openModal}
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
