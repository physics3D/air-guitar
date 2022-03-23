import './index.css';

import '@tensorflow/tfjs-backend-webgl';
import { initUi, updateUi } from './ui';
import { detectorLoaded, initDetector, updateDetection } from './detection';
import { initGraphics, updateGraphics } from './graphics';
import { audioLoaded, updateAudio } from './audio';


async function main() {
  initGraphics();
  initUi();
  initDetector();
}

main();

let detectionSuccededOnce = false;

export async function draw() {
  if (audioLoaded && detectorLoaded) {
    detectionSuccededOnce = await updateDetection() || detectionSuccededOnce;

    if (detectionSuccededOnce) {
      updateGraphics();
      updateUi();
      updateAudio();
    }
  }

  requestAnimationFrame(draw);
}
