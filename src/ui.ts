import { ChordType, initAudio } from "./audio";
import { noteArray } from "./consts";
import { noteIndex } from "./detection";

let currentNote = document.getElementById("currentnote")!;
let leftHanded = false;

export let handIndex = "right_wrist";
export let oppositeHandIndex = "left_wrist";
export let hipIndex = "right_hip";

export let doubleStroke = false;
export let chordType: ChordType = ChordType.Single;
export let debugOverlay = false;


export function initUi() {
    document.getElementById("button")!.addEventListener("click", async () => {
        document.getElementById("overlay")!.style.display = "none";
        initAudio();
    });

    let leftHandedButton = document.getElementById("leftHanded")!;
    leftHandedButton.addEventListener("click", () => {
        // console.log("hi");
        leftHanded = !leftHanded;

        leftHandedButton.innerHTML = leftHanded ? "Lefthanded is on" : "Lefthanded is off";
        handIndex = leftHanded ? "left_wrist" : "right_wrist";
        oppositeHandIndex = leftHanded ? "right_wrist" : "left_wrist";
        hipIndex = leftHanded ? "left_hip" : "right_hip";
    });

    let fullChordButton = document.getElementById("fullchord")!;
    fullChordButton.addEventListener("click", () => {
        if (chordType == ChordType.Single) {
            chordType = ChordType.Third;
            fullChordButton.innerHTML = "Third";
        } else if (chordType == ChordType.Third) {
            chordType = ChordType.Fifth;
            fullChordButton.innerHTML = "Fifth";
        } else if (chordType == ChordType.Fifth) {
            chordType = ChordType.Triad;
            fullChordButton.innerHTML = "Triad";
        } else if (chordType == ChordType.Triad) {
            chordType = ChordType.PowerChord;
            fullChordButton.innerHTML = "PowerChord";
        } else if (chordType == ChordType.PowerChord) {
            chordType = ChordType.PowerChordTriad;
            fullChordButton.innerHTML = "PowerChordTriad";
        } else if (chordType == ChordType.PowerChordTriad) {
            chordType = ChordType.Single;
            fullChordButton.innerHTML = "Single";
        }
    });

    let doubleStrokeButton = document.getElementById("doublestroke")!;
    doubleStrokeButton.addEventListener("click", () => {
        doubleStroke = !doubleStroke;
        doubleStrokeButton.innerHTML = doubleStroke ? "Double Stroke" : "Single Stroke";
    });

    let debugOverlayButton = document.getElementById("debugoverlaybutton")!;
    debugOverlayButton.addEventListener("click", () => {
        debugOverlay = !debugOverlay;
        debugOverlayButton.innerHTML = debugOverlay ? "Debug Overlay is on" : "Debug Overlay is off";
    });
}

export function setLoaded() {
    document.getElementById("status")!.innerHTML = "Loaded Model";
}

export function updateUi() {
    currentNote.innerHTML = noteArray[noteIndex];
}