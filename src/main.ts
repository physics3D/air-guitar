import './style.css'

import * as poseDetection from '@tensorflow-models/pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import { Keypoint } from '@tensorflow-models/pose-detection';
import { instrument, Player } from "soundfont-player";

const noteArray = ["C1", "D1", "E1", "F1", "G1", "A1", "H1", "C2", "D2", "E2", "F2", "G2", "A2", "H2", "C3", "D3", "E3", "F3", "G3", "A3", "H3", "C4"];

const minPredictionScore = 0.2;

let leftHanded = false;
let fullChord = false;
let handIndex = "right_wrist";
let oppositeHandIndex = "left_wrist";
let y = 0;
let played = false;
let playedTime = performance.now();

let video: HTMLVideoElement;
let scaleX = 1;
let scaleY = 1;
let audioContext = new AudioContext();
let loaded = false;
let guitar: Player;
let lastFrame = performance.now();

let canvas = document.getElementsByTagName("canvas").item(0)!;
let width = canvas.width;
let height = canvas.height;
let context = canvas.getContext("2d")!;

let detector = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, { modelType: poseDetection.movenet.modelType.SINGLEPOSE_LIGHTNING });
document.getElementById("status")!.innerHTML = "Loaded Model";

document.getElementById("button")!.addEventListener("click", async () => {
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
  oppositeHandIndex = !leftHanded ? "left_wrist" : "right_wrist";
});

let fullChordButton = document.getElementById("fullchord")!;
fullChordButton.addEventListener("click", () => {
  fullChord = !fullChord;

  fullChordButton.innerHTML = fullChord ? "Full Chord is on" : "Full Chord is off";
});


if (navigator.mediaDevices.getUserMedia) {
  let stream = await navigator.mediaDevices.getUserMedia({ video: true });
  video = document.createElement("video");
  document.body.appendChild(video);
  video.addEventListener("loadedmetadata", () => {
    requestAnimationFrame(draw);
  });
  video.srcObject = stream;

  video.play();
  // video.hidden = true;
}


async function draw() {
  if (loaded) {
    console.log("FPS:", 1 / ((performance.now() - lastFrame) / 1000));
    lastFrame = performance.now();

    const poses = await detector.estimatePoses(video);


    for (let index = 0; index < poses.length; index++) {
      const pose = poses[index];
      // console.log(pose);

      let hand: Keypoint | undefined;
      let oppositeHand: Keypoint | undefined;

      for (let i = 0; i < pose.keypoints.length; i++) {
        const keypoint = pose.keypoints[i];

        if (keypoint.name == handIndex) {
          hand = keypoint;
        }

        if (keypoint.name == oppositeHandIndex) {
          oppositeHand = keypoint;
        }
      }

      if (hand == undefined || oppositeHand == undefined) {
        console.log("error");
        continue;
      }

      if (hand!.score! < minPredictionScore || oppositeHand!.score! < minPredictionScore) {
        continue;
      }

      if (Math.abs(hand!.y - y) < 100) {
        continue;
      }

      // console.log(hand, oppositeHand);

      if (hand!.y > y) {
        if (!played) {
          let distance = Math.abs(hand!.x - oppositeHand!.y);
          let noteIndex = distance / width * (noteArray.length - 5);
          noteIndex = Math.floor(noteIndex);
          noteIndex = noteArray.length - 5 - noteIndex;
          noteIndex = Math.max(noteIndex, 0);
          noteIndex = Math.min(noteIndex, noteArray.length - 5);

          console.log(distance);
          console.log(noteIndex);
          console.log(noteArray[noteIndex], noteArray[noteIndex + 4]);

          playedTime = performance.now();

          guitar.stop();

          guitar.play(noteArray[noteIndex]);
          if (fullChord) {
            guitar.play(noteArray[noteIndex + 2]);
          }
          guitar.play(noteArray[noteIndex + 4]);
        }
      }
      else {
        played = false;
      }

      y = hand!.y;
    }

    context.clearRect(0, 0, width, height);
    context.drawImage(video, 0, 0, width, height);

    // We can call both functions to draw all keypoints and the skeletons
    // drawKeypoints();
    // drawSkeleton();

    for (let i = 0; i < poses.length; i++) {
      const pose = poses[i];

      for (let j = 0; j < pose.keypoints.length; j++) {
        const keypoint = pose.keypoints[j];

        if (keypoint.name != "left_wrist" && keypoint.name != "right_wrist") {
          continue;
        }

        context.fillStyle = "rgb(255, 0, 0)";
        context.beginPath();
        context.arc(keypoint.x * width / video.videoWidth, keypoint.y * height / video.videoHeight, 10, 0, 2 * Math.PI);
        context.fill();
        // context.fillRect(keypoint.x, keypoint.y, 10, 10);
      }
    }
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