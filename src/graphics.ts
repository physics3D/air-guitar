import { hand, oppositeHand, hip, distance, video } from "./detection";
import { debugOverlay } from "./ui";

let context: CanvasRenderingContext2D;
let width: number;
let height: number;

let lastFrame = performance.now();

export function initGraphics() {
    let canvas = document.getElementsByTagName("canvas").item(0)!;
    width = canvas.width;
    height = canvas.height;
    context = canvas.getContext("2d")!;
    // flip canvas
    context.translate(width, 0);
    context.scale(-1, 1);
}

export function updateVideo() {
    context.clearRect(0, 0, width, height);
    context.drawImage(video, 0, 0, width, height);
}

export function updateGraphics() {
    let fps = (1 / ((performance.now() - lastFrame) / 1000)).toFixed(0);
    lastFrame = performance.now();

    context.textAlign = "left";
    context.font = "50px Arial";
    context.fillStyle = "rgb(0, 0, 0)";
    // to undo flipping horizontally
    context.save();
    context.translate(width - 20, 70);
    context.scale(-1, 1);
    context.fillText("FPS: " + fps, 0, 0);
    context.restore();



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


    // We can call both functions to draw all keypoints and the skeletons
    // drawKeypoints();
    // drawSkeleton();
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