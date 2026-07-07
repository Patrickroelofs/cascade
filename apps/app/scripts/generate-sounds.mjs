import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 44100;

/**
 * A soft, round "blob/pop" tone: exponential pitch glide (not linear — that's
 * what makes a sweep sound like a physical droplet instead of a synth
 * sweep) under an exponential-decay envelope (fast attack, no sustain, no
 * hard cutoff), with a quiet sub-oscillator one octave down for body.
 */
function blob({
	duration,
	freqStart,
	freqEnd = freqStart,
	amp = 0.3,
	attack = 0.006,
	decay = 20,
	sub = 0.35,
}) {
	const n = Math.max(1, Math.floor(duration * SAMPLE_RATE));
	const samples = new Float32Array(n);
	const attackSamples = Math.max(1, attack * SAMPLE_RATE);
	const freqRatio = freqEnd / freqStart;
	let phase = 0;
	let subPhase = 0;
	for (let i = 0; i < n; i++) {
		const t = i / SAMPLE_RATE;
		const frac = i / n;
		const freq = freqStart * freqRatio ** frac;
		phase += (2 * Math.PI * freq) / SAMPLE_RATE;
		subPhase += (2 * Math.PI * freq * 0.5) / SAMPLE_RATE;
		const attackEnv = i < attackSamples ? i / attackSamples : 1;
		const env = attackEnv * Math.exp(-decay * t);
		samples[i] = (Math.sin(phase) + sub * Math.sin(subPhase)) * amp * env;
	}
	return samples;
}

/** Additively overlays layers at their given start offsets into one buffer. */
function mixAt(totalDuration, layers) {
	const n = Math.max(1, Math.floor(totalDuration * SAMPLE_RATE));
	const out = new Float32Array(n);
	for (const { samples, offset } of layers) {
		const start = Math.floor(offset * SAMPLE_RATE);
		for (let i = 0; i < samples.length && start + i < n; i++) {
			out[start + i] += samples[i];
		}
	}
	return out;
}

function writeWav(filePath, samples) {
	const dataSize = samples.length * 2;
	const buffer = Buffer.alloc(44 + dataSize);
	buffer.write("RIFF", 0);
	buffer.writeUInt32LE(36 + dataSize, 4);
	buffer.write("WAVE", 8);
	buffer.write("fmt ", 12);
	buffer.writeUInt32LE(16, 16);
	buffer.writeUInt16LE(1, 20);
	buffer.writeUInt16LE(1, 22);
	buffer.writeUInt32LE(SAMPLE_RATE, 24);
	buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
	buffer.writeUInt16LE(2, 32);
	buffer.writeUInt16LE(16, 34);
	buffer.write("data", 36);
	buffer.writeUInt32LE(dataSize, 40);
	for (let i = 0; i < samples.length; i++) {
		const s = Math.max(-1, Math.min(1, samples[i]));
		buffer.writeInt16LE(Math.round(s * 32767), 44 + i * 2);
	}
	fs.writeFileSync(filePath, buffer);
}

const defaultOutDir = path.join(
	path.dirname(fileURLToPath(import.meta.url)),
	"../public/sounds",
);
const outDir = process.argv[2] ?? defaultOutDir;
fs.mkdirSync(outDir, { recursive: true });

const sounds = {
	// Quick downward pop — a soft "blip" rather than a flat beep.
	click: blob({ duration: 0.07, freqStart: 520, freqEnd: 260, amp: 0.26, decay: 32, sub: 0.4 }),

	// Rising blob — "picking something up".
	pickup: blob({ duration: 0.09, freqStart: 260, freqEnd: 420, amp: 0.24, decay: 18, sub: 0.4 }),

	// Falling blob — a soft landing.
	drop: blob({ duration: 0.1, freqStart: 420, freqEnd: 220, amp: 0.24, decay: 16, sub: 0.45 }),

	// Two low, slightly overlapping descending blobs — soft "uh-oh", not harsh.
	error: mixAt(0.28, [
		{ samples: blob({ duration: 0.12, freqStart: 300, freqEnd: 190, amp: 0.28, decay: 14, sub: 0.5 }), offset: 0 },
		{ samples: blob({ duration: 0.16, freqStart: 230, freqEnd: 140, amp: 0.26, decay: 11, sub: 0.5 }), offset: 0.1 },
	]),

	// Two overlapping rising blobs, legato — cheerful "bloop-bloop".
	success: mixAt(0.3, [
		{ samples: blob({ duration: 0.14, freqStart: 320, freqEnd: 460, amp: 0.24, decay: 13, sub: 0.35 }), offset: 0 },
		{ samples: blob({ duration: 0.18, freqStart: 460, freqEnd: 640, amp: 0.24, decay: 10, sub: 0.35 }), offset: 0.08 },
	]),

	// Fuller three-blob rising run — a satisfying little "ta-da".
	complete: mixAt(0.38, [
		{ samples: blob({ duration: 0.12, freqStart: 360, freqEnd: 480, amp: 0.22, decay: 15, sub: 0.35 }), offset: 0 },
		{ samples: blob({ duration: 0.14, freqStart: 480, freqEnd: 620, amp: 0.24, decay: 12, sub: 0.35 }), offset: 0.07 },
		{ samples: blob({ duration: 0.2, freqStart: 620, freqEnd: 780, amp: 0.24, decay: 9, sub: 0.35 }), offset: 0.16 },
	]),
};

for (const [name, samples] of Object.entries(sounds)) {
	writeWav(path.join(outDir, `${name}.wav`), samples);
}

console.log("Wrote", Object.keys(sounds).join(", "), "to", outDir);
