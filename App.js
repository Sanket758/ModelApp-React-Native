import React, {Component, Suspense} from 'react';
import {StyleSheet, Text, View, Image} from 'react-native';
import {Button} from 'react-native-elements';
import Icon from 'react-native-vector-icons/FontAwesome';
import LinearGradient from 'react-native-linear-gradient';
import Tflite from 'tflite-react-native';
import ImagePicker from 'react-native-image-picker';
import color from 'color';

let tflite = new Tflite(); 
const imgheight= 300;
const imgwidth = 300;

export default class App extends Component{
  constructor(props){
    super(props);
    this.state = {
      model: null,
      source: null,
      output: [],
    };
  }

  onSelectImage (){
    const options = {};
    ImagePicker.launchImageLibrary(options, (response) => {
      if (response.didCancel){
        console.log('User clicked Cancel');
      } else if (response.customButton){
        console.log('Use clicked custom button');
      } else if (response.error){
        console.log('Error occured' + response.error);
      } else{
        console.log('Launched Library!');
        var path = response.path;
        this.setState({
          source: {uri:response.uri}
        });

        switch (this.state.model){
          
          // SSD
          case ('SSD MobileNet'):
            tflite.detectObjectOnImage({
              path: path,
              threshold: 0.6,
              numResultsPerClass: 1,
              
            },
            (err, res) =>{
              if (err) console.log('error');
              else {
                console.log(res);
                this.setState({output: res});
              }
            });
            break;

          // Yolo
          case ('Tiny YOLOv2'):
            tflite.detectObjectOnImage({
              path: path,
              model: 'YOLO',
              imageMean: 0.0,
              imageStd: 255,
              threshold: 0.6,
              numResultsPerClass: 1,
              
            },
            (err, res) =>{
              if (err) console.log('error');
              else {
                console.log(res);
                this.setState({output: res});
              }
            });
            break;

          // DeepLab
          case ('DeepLab'):
            tflite.runSegmentationOnImage({
              path: path,
            },
            (err, res) =>{
              if (err) console.log('error');
              else {
                console.log(res);
                this.setState({output: res});
              }
            });
            break;

          // PoseNet
          case ('PoseNet'):
            tflite.runPoseNetOnImage({
              path: path,
              threshold: 0.6,
            },
            (err, res) =>{
              if (err) console.log('error');
              else {
                console.log(res);
                this.setState({output: res});
              }
            });
            break;

          // MobileNet
          default:
            tflite.runModelOnImage({
              path: path,
              imageMean: 128.0,
              imageStd: 128.0,
              numResults: 3,
              threshold: 0.08,
            },
            (err, res) =>{
              if (err) console.log('error');
              else {
                console.log(res);
                this.setState({output: res});
              }
            });
            break;
        }
      }
    })
  }
  
  onSelectModel(model){
    this.setState({model});

    switch(model){
      
      case 'SSD MobileNet':
        console.log(model)
        var modelFile = 'models/ssd_mobilenet.tflite';
        var labelsFile = 'models/ssd_mobilenet.txt';
        break;
      case 'Tiny YOLOv2':
        console.log(model)
        var modelFile = 'models/yolov2_tiny.tflite';
        var labelsFile = 'models/yolov2_tiny.txt';
        break;
      case 'DeepLab':
        console.log(model)
        var modelFile = 'models/deeplabv3_257_mv_gpu.tflite';
        var labelsFile = 'models/deeplabv3_257_mv_gpu.txt';
        break;
      case 'PoseNet':
        console.log(model)
        var modelFile = 'models/posenet_mv1_075_float_from_checkpoints.tflite';
        var labelsFile = '';
        break;
      default:
        console.log('MobileNet')
        var modelFile = 'models/mobilenet_v1_1.0_224.tflite';
        var labelsFile = 'models/mobilenet_v1_1.0_224.txt';
        break;                 
    }

    tflite.loadModel({
      model: modelFile,
      labels: labelsFile,
    },
    (err, res) =>{
      if (err) console.log(err);
      else console.log(res);
    });

  }

  goBack(){
    this.setState({
      model:null,
      source: null,
      output: [],
    })
  }

  renderOutput(){
    const {model, output} = this.state;

    switch (model){
      case 'SSD MobileNet':
      case 'Tiny YOLOv2':
        // console.log(output);
        return output.map((res, id) => {
          var left = res['rect']['x'] * imgwidth;
          var top = res['rect']['y'] * imgheight;
          var width = res['rect']['w'] * imgwidth;
          var height = res['rect']['h'] * imgheight;
          return(
            <View key={id} style={[styles.box, {top, left, width, height}]}>
              <Text style={{color: 'white'}}>
                { res['detectedClass'] + ' ' + (res['confidenceInClass'] * 100).toFixed() + '%' }
              </Text>
            </View>
          )          
        })
        break;

      case 'DeepLab':
        var base64img = `data:image/png;base64,${output}`;
        return output.length > 0 ? (
          <View>
            <Image source={{uri: base64img}} style={styles.imageOutput}></Image>
          </View>
        ) : undefined;
        break;
      
      case 'PoseNet':
        // console.log(output);
        return output.map((res, id) =>{
          console.log(res);
          return Object.values(res['keypoints']).map((kp, idx) =>{
            var left = kp['x'] * imgwidth;
            var top = kp['y'] * imgheight;
            var width = imgwidth;
            var height = imgheight;
            return (
              <View
                key={idx}
                style={{position:'absolute', top, left, width, height}}>
                  <Text style={{color: 'blue', fontSize: 30}}>
                    {'•'}
                  </Text>
              </View>
            );
          });
        });
        break;
      
      default:
        // console.log(output);
        return output.map((res, id) => {
          return (
            <View style={{alignItems:'center'}}>
              <Text style={{color:'black', fontSize:14}}>{res['label'] + '-' + (res['confidence'] * 100).toFixed() + '%'}</Text>
            </View>
          );
        });
    }

  }

  render(){
    const {model, source} = this.state;
    var renderButton = (m) => {
      return <Button title={m} buttonStyle={styles.button} onPress={this.onSelectModel.bind(this, m)}></Button>;
    };

    return(
      <LinearGradient colors={['#ffff00', '#ffaf70']}
      style={styles.linearGradient}>
        {model ? (
            <View style={styles.outputContainer}>
              {source ?
                <View>
                  <Image source={source} style={styles.imageOutput} />
                  {this.renderOutput()} 
                </View> :
                <Button buttonStyle={styles.button} title='Pick from gallery' onPress={this.onSelectImage.bind(this)}></Button>                
              }
              <Button buttonStyle={styles.button} title='Go Back' onPress={this.goBack.bind(this)}></Button>
            </View>
          ) : (
          <View>
            {renderButton('MobileNet')}
            {renderButton('SSD MobileNet')}
            {renderButton('Tiny YOLOv2')}
            {renderButton('DeepLab')}
            {renderButton('PoseNet')}
          </View>)
        }
      </LinearGradient>
    );
  }
}

const styles = StyleSheet.create({
  linearGradient:{
    flex:1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outputContainer:{
    flex:1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  button:{
    backgroundColor: 'black',
    fontSize: 14,
    width: 200,
    height:50,
    marginTop:5,
    borderRadius: 10,
  },
  imageOutput:{
    height: imgheight,
    width: imgwidth,
    marginTop: 10,
    marginBottom: 5,
  },
  box:{
    position: 'absolute',
    borderColor: 'blue',
    borderWidth: 2,
  },
})