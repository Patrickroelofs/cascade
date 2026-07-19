import {
	BoldFeature,
	HeadingFeature,
	ItalicFeature,
	LinkFeature,
	lexicalEditor,
	ParagraphFeature,
	UnderlineFeature,
} from "@payloadcms/richtext-lexical";

export const defaultLexical = lexicalEditor({
	features: [
		ParagraphFeature(),
		HeadingFeature({ enabledHeadingSizes: ["h2", "h3", "h4"] }),
		UnderlineFeature(),
		BoldFeature(),
		ItalicFeature(),
		LinkFeature({
			enabledCollections: ["pages"],
		}),
	],
});
