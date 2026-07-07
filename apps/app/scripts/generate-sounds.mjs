import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SAMPLE_RATE = 44100;

/**
 * A warm, soft "cartoon" tone: exponential pitch glide (not linear — that's
 * what makes a sweep sound like a springy hop instead of a synth sweep)
 * under an exponential-decay envelope, with a sub-octave layer for body, a
 * touch of upper-harmonic warmth, and optional vibrato for a gentle "boing"
 * wobble. Soft `tanh` saturation rounds off the peaks for an analog warmth
 * instead of a clean, cold digital sine — this is most of what separates
 * "blob" from "beep".
 */
function blob({
	duration,
	freqStart,
	freqEnd = freqStart,
	amp = 0.5,
	attack = 0.008,
	decay = 20,
	sub = 0.4,
	bright = 0.1,
	brightRatio = 2,
	vibratoRate = 0,
	vibratoDepth = 0,
	drive = 1.6,
}) {
	const n = Math.max(1, Math.floor(duration * SAMPLE_RATE));
	const samples = new Float32Array(n);
	const attackSamples = Math.max(1, attack * SAMPLE_RATE);
	const freqRatio = freqEnd / freqStart;
	const driveNorm = Math.tanh(drive);
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
		const raw = Math.sin(phase) + sub * Math.sin(subPhase) + bright * Math.sin(brightPhase);
		samples[i] = (Math.tanh(raw * drive) / driveNorm) * amp * env;
	}
	return samples;
}

/** A soft, filtered noise burst — a tactile "thud" of contact, not a hiss. */
function thud({ duration, amp = 0.22, decay = 60, cutoff = 0.2 }) {
	const n = Math.max(1, Math.floor(duration * SAMPLE_RATE));
	const samples = new Float32Array(n);
	let filtered = 0;
	for (let i = 0; i < n; i++) {
		const t = i / SAMPLE_RATE;
		const white = Math.random() * 2 - 1;
		filtered += cutoff * (white - filtered);
		samples[i] = filtered * amp * Math.exp(-decay * t);
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

/**
 * A physical bounce sequence: each hop is quieter, quicker, and settles
 * toward `settleFreq` than the last, the way a dropped object loses energy
 * bounce by bounce. `freqRatio > 1` makes it hop upward (pickup); `< 1`
 * makes it settle downward (drop landing).
 */
function bounceTrain({
	hops,
	freqStart,
	freqRatio = 0.82,
	ampStart = 0.55,
	ampDecay = 0.55,
	gapStart = 0.1,
	gapDecay = 0.6,
	decay = 15,
	sub = 0.42,
	bright = 0.1,
	withThud = true,
}) {
	const layers = [];
	let t = 0;
	let amp = ampStart;
	let gap = gapStart;
	let freq = freqStart;
	for (let i = 0; i < hops; i++) {
		const hopDuration = Math.max(0.03, gap * 0.9);
		layers.push({
			samples: blob({
				duration: hopDuration,
				freqStart: freq,
				freqEnd: freq * freqRatio,
				amp,
				decay: decay / Math.max(0.3, gap / gapStart),
				sub,
				bright,
			}),
			offset: t,
		});
		if (withThud && i === 0) {
			layers.push({ samples: thud({ duration: 0.035, amp: 0.2, decay: 75 }), offset: t });
		}
		t += gap;
		amp *= ampDecay;
		gap *= gapDecay;
	}
	return mixAt(t + 0.05, layers);
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
	// A soft single tap, with a whisper of a thud underneath for tactile warmth.
	click: mixAt(0.08, [
		{ samples: blob({ duration: 0.07, freqStart: 440, freqEnd: 370, decay: 26 }), offset: 0 },
		{ samples: thud({ duration: 0.02, amp: 0.12, decay: 90 }), offset: 0 },
	]),

	// A light upward hop-hop — like plucking something up and it settling in your hand.
	pickup: bounceTrain({
		hops: 2,
		freqStart: 240,
		freqRatio: 1.35,
		ampStart: 0.5,
		ampDecay: 0.5,
		gapStart: 0.07,
		gapDecay: 0.65,
		decay: 16,
		withThud: false,
	}),

	// The star: a dropped object landing and bouncing softly to rest.
	drop: bounceTrain({
		hops: 4,
		freqStart: 340,
		freqRatio: 0.8,
		ampStart: 0.6,
		ampDecay: 0.52,
		gapStart: 0.11,
		gapDecay: 0.58,
		decay: 13,
		sub: 0.45,
	}),

	// Playful low descending "womp womp" that plops to a soft stop.
	error: mixAt(0.34, [
		{
			samples: blob({ duration: 0.14, freqStart: 300, freqEnd: 240, decay: 12, sub: 0.42, vibratoRate: 16, vibratoDepth: 0.06 }),
			offset: 0,
		},
		{
			samples: blob({ duration: 0.19, freqStart: 230, freqEnd: 170, decay: 9, sub: 0.46, vibratoRate: 14, vibratoDepth: 0.06 }),
			offset: 0.13,
		},
	]),

	// Gentle staccato 3-note ascending run — bouncy, warm, and low.
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
			samples: blob({ duration: 0.18, freqStart: 450, freqEnd: 470, decay: 11, bright: 0.16, vibratoRate: 16, vibratoDepth: 0.03 }),
			offset: 0.21,
		},
	]),
};

for (const [name, samples] of Object.entries(sounds)) {
	writeWav(path.join(outDir, `${name}.wav`), normalize(samples));
}

console.log("Wrote", Object.keys(sounds).join(", "), "to", outDir);
