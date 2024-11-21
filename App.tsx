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
    values,
    resetValues,
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

  const labels = ['Back-Hand Netlift','Back-hand Drop','Back-hand Lift','Back-hand Push','Back-hand Service','Back-hand Tap','Back-hand Toss','Front Jump Smash','Front-Hand Netlift','Front-hand Drop','Front-hand Lift','Front-hand Push','Front-hand Service','Front-hand Smash','Front-hand Tap','Front-hand Toss','No move']

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

    const resampleArray = (array: number[][], targetLength: number) => {
      const originalLength = array.length;
      const result: number[][] = [];
      let frame: number[], ax: number, ay: number, az: number, gx: number, gy: number, gz: number;
      // Calculate the scaling factor
      const scale = (originalLength - 1) / (targetLength - 1);
    
      // Perform linear interpolation
      for (let i = 0; i < targetLength; i++) {
        const pos = i * scale;
        const left = Math.floor(pos);
        const right = Math.min(left + 1, originalLength - 1);
        const weight = pos - left;
    
        // Linear interpolation
        ax = array[left][0] * (1 - weight) + array[right][0] * weight;
        ay = array[left][1] * (1 - weight) + array[right][1] * weight;
        az = array[left][2] * (1 - weight) + array[right][2] * weight;
        gx = array[left][3] * (1 - weight) + array[right][3] * weight;
        gy = array[left][4] * (1 - weight) + array[right][4] * weight;
        gz = array[left][5] * (1 - weight) + array[right][5] * weight;

        let frame = [ax,ay,az,gx,gy,gz]
        result.push(frame)
      }
      return result;
    };

  const transformArrayToTensor = () => {
    let arr: number[][] = [];
    console.log(values.length)
    for (let x of values) {
      arr.push([x.ax,x.ay,x.az,x.gx,x.gy,x.gz])
    }
    console.log(arr.length)
    arr = resampleArray(arr,180);
    console.log(arr[arr.length-1])
    resetValues();
    const tensor = tf.tensor([arr]);
    return tensor;
  }

  const makePredictions = async (model: tf.GraphModel, tensor: tf.Tensor) => {
    let output: tf.Tensor;
    try {
      output = await model.executeAsync(tensor) as tf.Tensor;
  
      // Get the predicted class index and its confidence
      const predictedIndex = output.argMax(-1).dataSync()[0];
      const confidence = output.softmax().dataSync()[predictedIndex];
  
      // Print the label along with the confidence with minimum confidence of 0.08
      if (confidence > 0.08) {
        alert(`Prediction: ${labels[predictedIndex]} with confidence: ${confidence.toFixed(2)}`);
      } else {
        alert(`No move or incorrect shot because confidence: ${confidence.toFixed(2)}`)
      }
    } catch (error) {
      console.log(error);
    }
  };
  

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
