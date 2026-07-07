import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 44100;

/**
 * A warm, bouncy "cartoon" tone: exponential pitch glide (not linear — that's
 * what makes a sweep sound like a springy hop instead of a synth sweep)
 * under an exponential-decay envelope, with a sub-octave layer for body, a
 * touch of upper-harmonic warmth (kept low so it stays mellow, not bright),
 * and optional vibrato for a gentle "boing" wobble.
 */
function blob({
	duration,
	freqStart,
	freqEnd = freqStart,
	amp = 0.5,
	attack = 0.007,
	decay = 20,
	sub = 0.38,
	bright = 0.16,
	brightRatio = 2,
	vibratoRate = 0,
	vibratoDepth = 0,
}) {
	const n = Math.max(1, Math.floor(duration * SAMPLE_RATE));
	const samples = new Float32Array(n);
	const attackSamples = Math.max(1, attack * SAMPLE_RATE);
	const freqRatio = freqEnd / freqStart;
	let phase = 0;
	let subPhase = 0;
	let brightPhase = 0;
	for (let i = 0; i < n; i++) {
		const t = i / SAMPLE_RATE;
		const frac = i / n;
		const baseFreq = freqStart * freqRatio ** frac;
		const vibrato =
			vibratoRate > 0
				? 1 + vibratoDepth * Math.sin(2 * Math.PI * vibratoRate * t)
				: 1;
		const freq = baseFreq * vibrato;
		phase += (2 * Math.PI * freq) / SAMPLE_RATE;
		subPhase += (2 * Math.PI * freq * 0.5) / SAMPLE_RATE;
		brightPhase += (2 * Math.PI * freq * brightRatio) / SAMPLE_RATE;
		const attackEnv = i < attackSamples ? i / attackSamples : 1;
		const env = attackEnv * Math.exp(-decay * t);
		samples[i] =
			(Math.sin(phase) + sub * Math.sin(subPhase) + bright * Math.sin(brightPhase)) *
			amp *
			env;
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

/** Scales a buffer so its peak sample hits `target`, for consistent loudness. */
function normalize(samples, target = 0.92) {
	let peak = 0;
	for (const s of samples) peak = Math.max(peak, Math.abs(s));
	if (peak === 0) return samples;
	const gain = target / peak;
	for (let i = 0; i < samples.length; i++) samples[i] *= gain;
	return samples;
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
	// Gentle downward tap — gentle and rounded, not a bright chirp.
	click: blob({ duration: 0.07, freqStart: 460, freqEnd: 380, decay: 26 }),

	// Warm rising boing — "picking something up".
	pickup: blob({
		duration: 0.13,
		freqStart: 220,
		freqEnd: 340,
		decay: 14,
		vibratoRate: 20,
		vibratoDepth: 0.05,
	}),

	// Warm falling boing — a soft, unhurried landing.
	drop: blob({
		duration: 0.16,
		freqStart: 340,
		freqEnd: 210,
		decay: 11,
		sub: 0.42,
		vibratoRate: 18,
		vibratoDepth: 0.05,
	}),

	// Playful low descending "womp womp" with a gentle wobble.
	error: mixAt(0.32, [
		{
			samples: blob({
				duration: 0.14,
				freqStart: 300,
				freqEnd: 240,
				decay: 12,
				sub: 0.42,
				vibratoRate: 16,
				vibratoDepth: 0.06,
			}),
			offset: 0,
		},
		{
			samples: blob({
				duration: 0.19,
				freqStart: 230,
				freqEnd: 170,
				decay: 9,
				sub: 0.46,
				vibratoRate: 14,
				vibratoDepth: 0.06,
			}),
			offset: 0.13,
		},
	]),

	// Gentle staccato 3-note ascending run — bouncy, but mellow and low.
	success: mixAt(0.28, [
		{ samples: blob({ duration: 0.09, freqStart: 300, freqEnd: 310, decay: 20 }), offset: 0 },
		{ samples: blob({ duration: 0.09, freqStart: 360, freqEnd: 370, decay: 19 }), offset: 0.07 },
		{ samples: blob({ duration: 0.13, freqStart: 430, freqEnd: 440, decay: 15 }), offset: 0.14 },
	]),

	// Fuller staccato 4-note ascending run with a soft flourish on the last note.
	complete: mixAt(0.38, [
		{ samples: blob({ duration: 0.08, freqStart: 270, freqEnd: 280, decay: 22 }), offset: 0 },
		{ samples: blob({ duration: 0.08, freqStart: 320, freqEnd: 330, decay: 21 }), offset: 0.07 },
		{ samples: blob({ duration: 0.08, freqStart: 380, freqEnd: 390, decay: 19 }), offset: 0.14 },
		{
			samples: blob({
				duration: 0.18,
				freqStart: 450,
				freqEnd: 470,
				decay: 11,
				bright: 0.2,
				vibratoRate: 16,
				vibratoDepth: 0.03,
			}),
			offset: 0.21,
		},
	]),
};

for (const [name, samples] of Object.entries(sounds)) {
	writeWav(path.join(outDir, `${name}.wav`), normalize(samples));
}

console.log("Wrote", Object.keys(sounds).join(", "), "to", outDir);
