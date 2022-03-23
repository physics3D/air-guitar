import { video } from "./detection";

export const noteArray = ["C1", "D1", "E1", "F1", "G1", "A1", "B1", "C2", "D2", "E2", "F2", "G2", "A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"];

export const minPredictionScore = 0.2;
export const minInterval = 500;
export const minYDifference = 100;

export function noteIndexFromDistance(distance: number) {
    let noteIndex = distance / video.videoWidth * (noteArray.length - 5);
    noteIndex = Math.floor(noteIndex);
    noteIndex = noteArray.length - 5 - noteIndex;
    noteIndex = Math.max(noteIndex, 0);
    noteIndex = Math.min(noteIndex, noteArray.length - 5);
    return noteIndex;
}