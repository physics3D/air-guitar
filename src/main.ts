import './index.css';

import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { Keypoint, PoseDetector } from '@tensorflow-models/pose-detection';
import { instrument, Player } from "soundfont-player";

const noteArray = ["C1", "D1", "E1", "F1", "G1", "A1", "H1", "C2", "D2", "E2", "F2", "G2", "A2", "H2", "C3", "D3", "E3", "F3", "G3", "A3", "H3", "C4"];

const minPredictionScore = 0.2;
const minInterval = 500;
const minYDifference = 50;

let detector: PoseDetector;
let leftHanded = false;

enum ChordType {
  Single,
  Fifth,
  Triad,

}

let chordType: ChordType = ChordType.Single;
let handIndex = "right_wrist";
let oppositeHandIndex = "left_wrist";
let hipIndex = "right_hip";
let y = 0;
let played = false;
let playedTime = performance.now();

let currentNote = document.getElementById("currentnote")!;

let debugOverlay = false;

let video: HTMLVideoElement;
let audioContext: AudioContext;
let loaded = false;
let guitar: Player;
let lastFrame = performance.now();

let canvas = document.getElementsByTagName("canvas").item(0)!;
let width = canvas.width;
let height = canvas.height;
let context = canvas.getContext("2d")!;
// flip canvas
context.translate(width, 0);
context.scale(-1, 1);

async function main() {
  detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING });
  document.getElementById("status")!.innerHTML = "Loaded Model";

  document.getElementById("button")!.addEventListener("click", async () => {
    document.getElementById("overlay")!.style.display = "none";
    audioContext = new AudioContext();
    await audioContext.resume();
    guitar = await instrument(audioContext, "distortion_guitar", { soundfont: 'FluidR3_GM' });
    loaded = true;
    guitar.play("C3");
    guitar.play("E3");
    guitar.play("G3");
  });

  let leftHandedButton = document.getElementById("leftHanded")!;
  leftHandedButton.addEventListener("click", () => {
    console.log("hi");
    leftHanded = !leftHanded;

    leftHandedButton.innerHTML = leftHanded ? "Lefthanded is on" : "Lefthanded is off";
    handIndex = leftHanded ? "left_wrist" : "right_wrist";
    oppositeHandIndex = leftHanded ? "right_wrist" : "left_wrist";
    hipIndex = leftHanded ? "left_hip" : "right_hip";
  });

  let fullChordButton = document.getElementById("fullchord")!;
  fullChordButton.addEventListener("click", () => {
    if (chordType == ChordType.Single) {
      chordType = ChordType.Fifth;
      fullChordButton.innerHTML = "Fifth";
    } else if (chordType == ChordType.Fifth) {
      chordType = ChordType.Triad;
      fullChordButton.innerHTML = "Triad";
    } else if (chordType == ChordType.Triad) {
      chordType = ChordType.Single;
      fullChordButton.innerHTML = "Single";
    }
  });

  let debugOverlayButton = document.getElementById("debugoverlaybutton")!;
  debugOverlayButton.addEventListener("click", () => {
    debugOverlay = !debugOverlay;
    debugOverlayButton.innerHTML = debugOverlay ? "Debug Overlay is on" : "Debug Overlay is off";
  });


  if (navigator.mediaDevices.getUserMedia) {
    let stream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => alert("Could not get webcam access"));
    video = document.createElement("video");
    // document.body.appendChild(video);
    video.addEventListener("loadeddata", () => {
      video.play();
      // video.hidden = true;
      requestAnimationFrame(draw);
    });
    video.srcObject = stream!;

    // flip horizontally
    video.style.transform = "scaleX(-1)";
  }
}

main();

async function draw() {
  if (loaded) {
    console.log("FPS:", (1 / ((performance.now() - lastFrame) / 1000)).toFixed(0));
    lastFrame = performance.now();

    const poses = await detector.estimatePoses(video);

    context.clearRect(0, 0, width, height);
    context.drawImage(video, 0, 0, width, height);

    for (let index = 0; index < poses.length; index++) {
      const pose = poses[index];
      // console.log(pose);

      let hand: Keypoint | undefined;
      let oppositeHand: Keypoint | undefined;
      let hip: Keypoint | undefined;

      for (let i = 0; i < pose.keypoints.length; i++) {
        const keypoint = pose.keypoints[i];

        if (keypoint.name == handIndex) {
          hand = keypoint;
        }

        if (keypoint.name == oppositeHandIndex) {
          oppositeHand = keypoint;
        }

        if (keypoint.name == hipIndex) {
          hip = keypoint;
        }
      }

      if (hand == undefined || oppositeHand == undefined || hip == undefined) {
        console.log("error");
        continue;
      }

      if (hand!.score! < minPredictionScore || oppositeHand!.score! < minPredictionScore || hip!.score! < minPredictionScore) {
        console.log("error");
        continue;
      }

      let distance = Math.abs(hip!.x - oppositeHand!.x);

      // draw
      if (debugOverlay) {
        context.fillStyle = "rgb(255, 0, 0)";
        context.beginPath();
        context.arc(hand.x * width / video.videoWidth, hand.y * height / video.videoHeight, 10, 0, 2 * Math.PI);
        context.fill();

        context.beginPath();
        context.arc(oppositeHand.x * width / video.videoWidth, oppositeHand.y * height / video.videoHeight, 10, 0, 2 * Math.PI);
        context.fill();

        context.beginPath();
        context.arc(hip.x * width / video.videoWidth, hip.y * height / video.videoHeight, 10, 0, 2 * Math.PI);
        context.fill();

        context.beginPath();
        context.moveTo(oppositeHand.x * width / video.videoWidth, hip.y * height / video.videoHeight);
        context.lineTo(hip.x * width / video.videoWidth, hip.y * height / video.videoHeight);
        context.closePath();
        context.stroke();

        context.textAlign = "center";
        context.font = "100px Arial";
        // to undo flipping horizontally
        context.save();
        context.translate(((oppositeHand.x + hip.x) / 2) * width / video.videoWidth, (hip.y - 20) * height / video.videoHeight);
        context.scale(-1, 1);
        context.fillText(distance.toFixed(0), 0, 0);
        context.restore();
        // context.fillRect(keypoint.x, keypoint.y, 10, 10);
      }

      if (Math.abs(hand!.y - y) < minYDifference) {
        continue;
      }

      // console.log(hand, oppositeHand, hip);


      if (hand!.y > y && performance.now() - playedTime > minInterval && !played) {
        let noteIndex = distance / video.videoWidth * (noteArray.length - 5);
        noteIndex = Math.floor(noteIndex);
        noteIndex = noteArray.length - 5 - noteIndex;
        noteIndex = Math.max(noteIndex, 0);
        noteIndex = Math.min(noteIndex, noteArray.length - 5);

        console.log(distance);
        console.log(noteIndex);
        console.log(noteArray[noteIndex], noteArray[noteIndex + 4]);

        currentNote.innerHTML = noteArray[noteIndex] + ", (" + noteArray[noteIndex + 2] + "), " + noteArray[noteIndex + 4];

        playedTime = performance.now();

        guitar.stop();

        guitar.play(noteArray[noteIndex]);
        if (chordType == ChordType.Triad) {
          guitar.play(noteArray[noteIndex + 2]);
        }
        if (chordType !== ChordType.Single) {
          guitar.play(noteArray[noteIndex + 4]);
        }
      }
      else {
        played = false;
      }

      y = hand!.y;
    }


    // We can call both functions to draw all keypoints and the skeletons
    // drawKeypoints();
    // drawSkeleton();
  }

  requestAnimationFrame(draw);
}

// A function to draw ellipses over the detected keypoints
// function drawKeypoints() {
//     // Loop through all the poses detected
//     for (let i = 0; i < poses.length; i += 1) {
//         // For each pose detected, loop through all the keypoints
//         const pose = poses[i].pose;
//         for (let j = 0; j < pose.keypoints.length; j += 1) {
//             // A keypoint is an object describing a body part (like rightArm or leftShoulder)
//             const keypoint = pose.keypoints[j];
//             // Only draw an ellipse is the pose probability is bigger than minScore
//             if (keypoint.score > minScore) {
//                 fill(255, 0, 0);
//                 noStroke();
//                 ellipse(keypoint.position.x, keypoint.position.y, 10, 10);
//             }
//         }
//     }
// }

// A function to draw the skeletons
// function drawSkeleton() {
//     // Loop through all the skeletons detected
//     for (let i = 0; i < poses.length; i += 1) {
//         const skeleton = poses[i].skeleton;
//         // For every skeleton, loop through all body connections
//         for (let j = 0; j < skeleton.length; j += 1) {
//             const partA = skeleton[j][0];
//             const partB = skeleton[j][1];
//             stroke(255, 0, 0);
//             line(partA.position.x, partA.position.y, partB.position.x, partB.position.y);
//         }
//     }
// }
