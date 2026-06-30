function GenericErrorComponent({ error }: { error: Error }) {
	console.error(error);

	return (
		<div>
			<pre>{error.stack}</pre>
		</div>
	);
}

export { GenericErrorComponent };
