export default function AboutPage() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12">
      <h1 className="font-serif text-3xl text-ink">Built on the shoulders of</h1>
      <p className="mt-2 text-dim leading-relaxed">
        Swadhyaya is a teaching experiment. It tries to teach the way the best teachers
        actually teach — concrete first, abstraction earned, every concept a story.
      </p>

      <div className="mt-8 space-y-6">
        <Credit
          name="Prof. Sudarshan Iyengar"
          role="IIT Madras NPTEL — Mathematics: Linear Algebra"
          url="https://nptel.ac.in/courses/111106051"
          note="The rigorous sequence. Concrete first (Ax=b), abstraction earned (vector spaces come after), matrix-of-a-transformation gets its own module, dual space is first-class. The deepest, most careful introduction to linear algebra on the web."
        />
        <Credit
          name="Sudarshan — Codershigh Matrix Mystics"
          role="Workshop problem set"
          url="https://sudarshansudarshan.github.io/codershigh/matrixmystics/"
          note="The problem style. Every concept is a story — Ram and Lakshman's pocket money, Atul walking to Bala's house, the Hill cipher, 1000 people migrating between states. 'Do you see why?' 'What has this got to do with the previous five?' Real-world payoffs: Hill cipher (matrix × vector), 1000 people (PageRank), Recommender Systems, Dimensionality Reduction."
        />
        <Credit
          name="3Blue1Brown — Essence of Linear Algebra"
          role="Visual sequencing"
          url="https://www.3blue1brown.com/topics/linear-algebra"
          note="The visual sequencing. The single most important reframe: a matrix is what happens to i-hat and j-hat. Once that lands, everything else flows from it."
        />
        <Credit
          name="Kalid Azad — BetterExplained"
          role="Plain-English voice"
          url="https://betterexplained.com/articles/linear-algebra-guide/"
          note="The voice. 'Linear algebra gives you mini-spreadsheets for your math equations.' A spreadsheet written as an equation. The 'explain it like a friend at coffee' tone that turns formulas into intuitions."
        />
        <Credit
          name="Gilbert Strang"
          role="Introduction to Linear Algebra"
          url="https://math.mit.edu/~gs/"
          note="The formal layer. The four subspaces. The factorization perspective. The book every linear algebra student eventually reads."
        />
      </div>

      <div className="mt-10 pt-8 border-t border-line">
        <h2 className="font-serif text-xl text-ink">The teaching philosophy</h2>
        <ol className="mt-4 space-y-3 text-sm text-dim leading-relaxed list-decimal list-inside">
          <li><span className="text-ink">Story first, always.</span> No abstract definition before the story. The student meets the math as a person first.</li>
          <li><span className="text-ink">No jargon until earned.</span> "Linear combination" only comes after 10 head-to-tail walks. "Eigenvector" only after they find a vector that survives unchanged.</li>
          <li><span className="text-ink">Plot it first.</span> The student always sees the geometry before the formula. Drag points. Watch shapes morph.</li>
          <li><span className="text-ink">Discovery by question.</span> "Where does this line go?" "What happens to the area?" Never by answer.</li>
          <li><span className="text-ink">Connect to the last five.</span> Every new problem references the previous ones. The student builds a mental graph.</li>
          <li><span className="text-ink">Real-world payoff visible.</span> Hill cipher. PageRank. Face recognition. Image compression.</li>
          <li><span className="text-ink">One topic at a time, no skips.</span> The order is non-negotiable. Move forward only when intuition is locked.</li>
        </ol>
      </div>
    </div>
  );
}

function Credit({ name, role, url, note }: { name: string; role: string; url: string; note: string }) {
  return (
    <div className="bg-card border border-line rounded-xl p-5">
      <div className="flex items-baseline justify-between gap-4 flex-wrap">
        <h3 className="font-serif text-lg text-ink">{name}</h3>
        <a href={url} target="_blank" rel="noopener noreferrer" className="text-xs text-accent hover:underline">
          {url.replace(/^https?:\/\//, "").replace(/\/$/, "")}
        </a>
      </div>
      <div className="text-xs text-dim mt-0.5">{role}</div>
      <p className="mt-3 text-sm text-ink/80 leading-relaxed">{note}</p>
    </div>
  );
}
