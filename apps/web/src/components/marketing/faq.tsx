const faqs = [
	{
		question: "Is it really free?",
		answer:
			"Yes. Cascade is free to use while we develop the application, in the future we may introduce paid features, but the core experience will remain free.",
	},
	{
		question: "How is it different from other outliners?",
		answer:
			"Cascade keeps the idea simple: one infinitely nested list, fast keyboard control, and nothing else in your way.",
	},
	{
		question: "Does it work on my phone?",
		answer:
			"Cascade runs in the browser, so it works anywhere a browser does including your phone.",
	},
];

export function Faq() {
	return (
		<section className="mx-auto max-w-3xl px-8 py-26">
			<h2 className="mb-12 text-center font-serif text-6xl font-light">
				Questions
			</h2>
			<div className="flex flex-col">
				{faqs.map((faq, i) => (
					<details
						key={faq.question}
						className={`border-t border-dark-grey/10 py-1 ${
							i === faqs.length - 1 ? "border-b" : ""
						}`}
					>
						<summary className="cursor-pointer list-none px-1 py-6 text-base font-bold [&::-webkit-details-marker]:hidden">
							{faq.question}
						</summary>
						<p className="m-0 text-pretty px-1 pb-6 text-base">{faq.answer}</p>
					</details>
				))}
			</div>
		</section>
	);
}
