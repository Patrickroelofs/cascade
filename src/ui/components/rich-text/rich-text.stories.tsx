import type { Meta, StoryObj } from '@storybook/tanstack-react';

const meta = {
  title: 'UI/RichText',
  tags: ['autodocs'],
  render: ({ html }: { html: string }) => (
    // biome-ignore lint/security/noDangerouslySetInnerHtml: story fixture
    <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
  ),
  args: { html: '' },
} satisfies Meta<{ html: string }>;

export default meta;
type Story = StoryObj<typeof meta>;

const ARTICLE = `
<h1>The Art of Slow Travel</h1>
<p>
  Slow travel is not about covering fewer miles — it is about choosing depth over breadth.
  Instead of racing through a checklist of landmarks, the slow traveller stays long enough
  to learn a baker's name, to watch a neighbourhood change with the weather, to feel
  <strong>genuinely at home</strong> somewhere that is not home.
</p>
<h2>Why it works</h2>
<p>
  Our brains consolidate memory during <em>idle time</em>. When every hour is packed with
  sights, experiences blur together. A week spent mostly in one city — with long lunches,
  accidental wrong turns, and whole afternoons doing nothing — leaves sharper memories than
  a two-week sprint across six countries.
</p>
<blockquote>
  <p>
    "Not all those who wander are lost." — J.R.R. Tolkien
  </p>
</blockquote>
<h2>Practical rules</h2>
<ol>
  <li>Book accommodation for at least four nights before moving on.</li>
  <li>Leave one full day each week with zero plans.</li>
  <li>Find a local coffee shop and return to it every morning.</li>
  <li>Walk instead of riding whenever the distance is under thirty minutes.</li>
</ol>
<h3>What to pack</h3>
<ul>
  <li>One versatile bag that fits in overhead storage</li>
  <li>A lightweight rain jacket — weather is never perfectly forecast</li>
  <li>A paper notebook (phones die, notebooks do not)</li>
  <li>An <a href="#">offline map</a> downloaded before you land</li>
</ul>
<h2>A note on budget</h2>
<p>
  Slow travel is often <strong>cheaper</strong> than conventional tourism. Weekly apartment
  rentals cost far less per night than hotels. Cooking occasional meals in a shared kitchen,
  buying groceries at the local market, skipping guided tours in favour of wandering freely —
  these habits compound.
</p>
<p>
  The table below compares a typical seven-day "highlight reel" trip against a slow week
  in the same city:
</p>
<table>
  <thead>
    <tr><th>Category</th><th>Fast trip</th><th>Slow trip</th></tr>
  </thead>
  <tbody>
    <tr><td>Accommodation</td><td>€140 / night</td><td>€55 / night</td></tr>
    <tr><td>Meals</td><td>€40 / day</td><td>€20 / day</td></tr>
    <tr><td>Transport</td><td>€180 total</td><td>€60 total</td></tr>
    <tr><td>Attractions</td><td>€95 total</td><td>€25 total</td></tr>
  </tbody>
</table>
<h2>Code is also a kind of travel</h2>
<p>Reading a large codebase slowly — function by function — often beats a rushed overview. The same principle applies: <code>git log --oneline -20</code> before diving in.</p>
<pre><code>// Start where curiosity takes you, not where the README says.
const entryPoints = findExports(src);
for (const ep of entryPoints) {
  explore(ep, { depth: 'slow' });
}</code></pre>
<hr />
<p>
  The destination matters less than the disposition you bring to it. Slow down, and the
  world gets bigger.
</p>
`;

const MINIMAL = `
<p>A single paragraph with <strong>bold</strong>, <em>italic</em>, and an <a href="#">inline link</a>.</p>
`;

const HEADINGS = `
<h1>Heading 1</h1>
<h2>Heading 2</h2>
<h3>Heading 3</h3>
<h4>Heading 4</h4>
<h5>Heading 5</h5>
<h6>Heading 6</h6>
<p>Body paragraph following the heading scale.</p>
`;

const LISTS = `
<h2>Unordered</h2>
<ul>
  <li>Apples</li>
  <li>Oranges
    <ul>
      <li>Blood oranges</li>
      <li>Navels</li>
    </ul>
  </li>
  <li>Bananas</li>
</ul>
<h2>Ordered</h2>
<ol>
  <li>Preheat the oven to 180 °C.</li>
  <li>Mix dry ingredients in a large bowl.</li>
  <li>Fold in wet ingredients until just combined.</li>
  <li>Bake for 25 minutes.</li>
</ol>
`;

const CODE = `
<p>Inline: use <code>Array.prototype.flat()</code> instead of manual flattening.</p>
<pre><code>function debounce(fn, ms) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  };
}</code></pre>
`;

export const Article: Story = { args: { html: ARTICLE } };
export const Minimal: Story = { args: { html: MINIMAL } };
export const Headings: Story = { args: { html: HEADINGS } };
export const Lists: Story = { args: { html: LISTS } };
export const Code: Story = { args: { html: CODE } };
