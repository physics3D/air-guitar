import { instrument, Player } from "soundfont-player";
import { minYDifference, minInterval, noteArray } from "./consts";
import { hand, noteIndex } from "./detection";
import { chordType, doubleStroke } from "./ui";

export enum ChordType {
    Single,
    Third,
    Fifth,
    Triad,
}

let audioContext: AudioContext;
let guitar: Player;
let y = 0;
let played = false;
let playedTime = performance.now();

export let audioLoaded = false;


export async function initAudio() {
    audioContext = new AudioContext();
    await audioContext.resume();
    guitar = await instrument(audioContext, "distortion_guitar", { soundfont: 'FluidR3_GM' });
    audioLoaded = true;
    guitar.play("C3");
    guitar.play("E3");
    guitar.play("G3");
}

export function updateAudio() {
    if (Math.abs(hand!.y - y) < minYDifference) {
        return;
    }

    if (((hand!.y > y && !played) || doubleStroke) && performance.now() - playedTime > minInterval) {
        playedTime = performance.now();
        played = true;

        guitar.stop();

        guitar.play(noteArray[noteIndex]);
        if (chordType == ChordType.Triad || chordType == ChordType.Third) {
            guitar.play(noteArray[noteIndex + 2]);
        }
        if (chordType == ChordType.Triad || chordType == ChordType.Fifth) {
            guitar.play(noteArray[noteIndex + 4]);
        }
    } else {
        played = false;
    }

    y = hand!.y;
}