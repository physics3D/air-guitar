import { PoseDetector, Keypoint, createDetector, movenet, SupportedModels } from "@tensorflow-models/pose-detection";
import { initAudio } from "./audio";
import { minPredictionScore, noteIndexFromDistance } from "./consts";
import { draw } from "./main";
import { handIndex, oppositeHandIndex, hipIndex, setLoaded } from "./ui";

export let video: HTMLVideoElement;
let detector: PoseDetector;

export let hand: Keypoint;
export let oppositeHand: Keypoint;
export let hip: Keypoint;
export let distance: number;
export let noteIndex: number;

export let detectorLoaded = false;

export async function initDetector() {
    detector = await createDetector(SupportedModels.MoveNet, { modelType: movenet.modelType.SINGLEPOSE_LIGHTNING });

    if (navigator.mediaDevices.getUserMedia) {
        let stream = await navigator.mediaDevices.getUserMedia({ video: true }).catch(() => alert("Could not get webcam access"));
        video = document.createElement("video");
        // document.body.appendChild(video);
        video.addEventListener("loadeddata", () => {
            video.play();
            // video.hidden = true;
            initAudio();

            detectorLoaded = true;
            setLoaded();

            requestAnimationFrame(draw);
        });
        video.srcObject = stream!;

        // flip horizontally
        video.style.transform = "scaleX(-1)";
    }
}

export async function updateDetection(): Promise<boolean> {
    const poses = await detector.estimatePoses(video);

    if (poses.length < 1) {
        return false;
    }

    const pose = poses[0];
    // console.log(pose);

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
        // console.log("error");
        return false;
    }

    if (hand!.score! < minPredictionScore || oppositeHand!.score! < minPredictionScore || hip!.score! < minPredictionScore) {
        // console.log("error");
        return false;
    }

    distance = Math.abs(hip!.x - oppositeHand!.x);
    noteIndex = noteIndexFromDistance(distance);

    // console.log(hand, oppositeHand, hip);
    // console.log(distance);
    // console.log(noteIndex);
    // console.log(noteArray[noteIndex], noteArray[noteIndex + 4]);

    return true;
}