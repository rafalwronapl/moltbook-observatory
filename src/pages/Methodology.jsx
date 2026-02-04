export default function Methodology() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-2">Methodology</h1>
      <p className="text-observatory-muted mb-8">
        How we detect automation patterns using timing analysis, graph metrics, and behavioral signals.
      </p>

      {/* Fundamental Limitation - MOST PROMINENT */}
      <section className="mb-12">
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-red-400 mb-3">
            What We Cannot Do
          </h2>
          <ul className="space-y-2 text-observatory-text">
            <li><strong>Distinguish "AI agent" from "human using AI tools"</strong> - identical output</li>
            <li><strong>Detect sophisticated actors</strong> - <code>sleep(random())</code> defeats our methods</li>
            <li><strong>Provide calibrated probabilities</strong> - no ground truth data</li>
            <li><strong>Account for timezones</strong> - we assume UTC</li>
          </ul>
        </div>
      </section>

      {/* Detection Methods */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Detection Methods</h2>

        <p className="text-observatory-muted mb-4">
          We use <strong>four independent detection methods</strong> that produce component scores:
        </p>

        <div className="grid md:grid-cols-2 gap-4 mb-6">
          <div className="bg-observatory-card border border-observatory-border rounded-lg p-4">
            <h3 className="font-semibold text-blue-400 mb-2">Graph Centrality</h3>
            <p className="text-sm text-observatory-muted">
              PageRank, betweenness, clustering coefficient. Identifies network hubs and bridge accounts.
            </p>
            <code className="text-xs text-blue-400">network_score: 0.00-1.00</code>
          </div>

          <div className="bg-observatory-card border border-observatory-border rounded-lg p-4">
            <h3 className="font-semibold text-red-400 mb-2">Isolation Forest</h3>
            <p className="text-sm text-observatory-muted">
              Unsupervised anomaly detection. Finds accounts with unusual behavioral patterns.
            </p>
            <code className="text-xs text-red-400">anomaly_score: 0.00-1.00</code>
          </div>

          <div className="bg-observatory-card border border-observatory-border rounded-lg p-4">
            <h3 className="font-semibold text-purple-400 mb-2">Lexical Entropy</h3>
            <p className="text-sm text-observatory-muted">
              Vocabulary richness, hapax ratio. Low entropy suggests templated/scripted content.
            </p>
            <code className="text-xs text-purple-400">lexical_score: 0.00-1.00</code>
          </div>

          <div className="bg-observatory-card border border-observatory-border rounded-lg p-4">
            <h3 className="font-semibold text-orange-400 mb-2">Burst Detection</h3>
            <p className="text-sm text-observatory-muted">
              Identifies coordinated activity spikes. High burst score suggests automation.
            </p>
            <code className="text-xs text-orange-400">burst_score: 0.00-1.00</code>
          </div>
        </div>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <h3 className="font-semibold text-green-400 mb-2">Example Output (eudaemon_0)</h3>
          <pre className="text-sm text-observatory-text whitespace-pre-wrap">{`network_score:  0.60  (high influence - central hub)
anomaly_score:  0.75  (unusual pattern detected)
lexical_score:  0.38  (moderate vocabulary diversity)
burst_score:    1.00  (19 burst events detected)

Category: HUMAN_PACED
Avg Response: 7.5 hours
Samples: 139`}</pre>
        </div>

        <p className="text-observatory-muted text-sm mt-4">
          Categories are derived from scores, but <strong>raw scores are more informative</strong> than labels.
        </p>
      </section>

      {/* NEW: Phrase Repetition Operationalization */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Phrase Repetition: How We Measure</h2>

        <div className="space-y-4">
          <div className="bg-observatory-card border border-observatory-border rounded-lg p-6">
            <h3 className="font-semibold mb-3">Method</h3>
            <ol className="list-decimal list-inside space-y-2 text-sm text-observatory-muted">
              <li>Extract all comments from an account</li>
              <li>Tokenize into <strong>3-grams</strong> (sequences of 3 words)</li>
              <li>Count unique 3-grams vs total 3-grams</li>
              <li>Repetition rate = 1 - (unique / total)</li>
            </ol>
          </div>

          <div className="bg-observatory-card border border-observatory-border rounded-lg p-6">
            <h3 className="font-semibold mb-3">Thresholds (arbitrary but explicit)</h3>
            <table className="data-table text-sm">
              <thead>
                <tr>
                  <th>Repetition Rate</th>
                  <th>Interpretation</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>&lt; 30%</td>
                  <td>Normal variation (human or LLM)</td>
                </tr>
                <tr>
                  <td>30-70%</td>
                  <td>Elevated (possible templates)</td>
                </tr>
                <tr>
                  <td>70-90%</td>
                  <td>High (likely scripted elements)</td>
                </tr>
                <tr>
                  <td>&gt; 90%</td>
                  <td>Very high (SCRIPTED_BOT pattern)</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
            <p className="text-yellow-400 font-semibold mb-2">Limitations</p>
            <ul className="text-sm text-observatory-muted space-y-1">
              <li>- Short comments produce fewer 3-grams (less reliable)</li>
              <li>- Some topics naturally reuse phrases</li>
              <li>- Catchphrases and memes inflate repetition</li>
              <li>- Minimum 5 comments needed for meaningful rate</li>
            </ul>
          </div>
        </div>
      </section>

      {/* NEW: Sample Size Gradation */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Sample Size Confidence</h2>

        <table className="data-table mb-4">
          <thead>
            <tr>
              <th>Samples</th>
              <th>Confidence Level</th>
              <th>What We Can Say</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>1-4</td>
              <td className="text-red-400">Insufficient</td>
              <td>Cannot identify pattern</td>
            </tr>
            <tr>
              <td>5-10</td>
              <td className="text-orange-400">Preliminary</td>
              <td>Pattern detected, very uncertain</td>
            </tr>
            <tr>
              <td>11-20</td>
              <td className="text-yellow-400">Moderate</td>
              <td>Pattern more stable, still uncertain</td>
            </tr>
            <tr>
              <td>21-50</td>
              <td className="text-green-400">Good</td>
              <td>Pattern likely reliable</td>
            </tr>
            <tr>
              <td>50+</td>
              <td className="text-green-500">Strong</td>
              <td>Pattern statistically stable</td>
            </tr>
          </tbody>
        </table>

        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <p className="text-red-400 text-sm">
            <strong>Reality check:</strong> Most of our classifications are based on 5-20 samples.
            This is <strong>preliminary</strong> level only.
          </p>
        </div>
      </section>

      {/* Categories */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Classification Categories</h2>

        <div className="space-y-4">
          <CategoryCard
            name="LIKELY_AUTONOMOUS"
            color="red"
            reliability="High"
            thresholds="score >= 4.0, fast responses + 24/7 activity + high volume"
            meaning="Very fast responses combined with 24/7 activity pattern. Strong automation signals."
            limitations="Cannot distinguish autonomous AI from human-with-webhook."
            samplesNeeded="10+"
          />

          <CategoryCard
            name="POSSIBLY_AUTOMATED"
            color="orange"
            reliability="Medium"
            thresholds="score >= 2.5, fast OR consistent timing"
            meaning="Fast responses or low timing variance. May be AI-assisted or automated."
            limitations="Many explanations possible."
            samplesNeeded="10+"
          />

          <CategoryCard
            name="SCRIPTED_BOT"
            color="purple"
            reliability="High"
            thresholds="RepetitionScore > 0.90"
            meaning="Template-based responses. NOT AI/LLM - humans and LLMs vary language."
            limitations="Humans with catchphrases might trigger false positives."
            samplesNeeded="5+"
          />

          <CategoryCard
            name="EMOJI_BOT"
            color="pink"
            reliability="Very High"
            thresholds="Response < 5s + emoji-only + coordinated"
            meaning="Physically impossible for humans. 136 accounts responding in 0.4-2s."
            limitations="Only detected in Jan 31 attack."
            samplesNeeded="1+"
          />

          <CategoryCard
            name="MINTING_BOT"
            color="cyan"
            reliability="Very High"
            thresholds="100% JSON minting commands"
            meaning="Automated token farming. Humans don't type JSON."
            limitations="Only detects accounts posting ONLY minting."
            samplesNeeded="1+"
          />

          <CategoryCard
            name="HUMAN_PACED"
            color="green"
            reliability="Medium"
            thresholds="avg response > 5 min, timing samples >= 5"
            meaning="Slow response times consistent with manual interaction. Most accounts (85%) fall here."
            limitations="AI with deliberate delays would look identical."
            samplesNeeded="5+"
          />

          <CategoryCard
            name="INSUFFICIENT_DATA"
            color="gray"
            reliability="N/A"
            thresholds="timing samples < 2"
            meaning="Not enough data to identify any pattern."
            limitations="~10% of accounts fall here."
            samplesNeeded="N/A"
          />
        </div>
      </section>

      {/* Honest Assessment */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Honest Assessment</h2>

        <table className="data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Reliability</th>
              <th>Why</th>
              <th>Samples</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="text-purple-400">SCRIPTED_BOT</td>
              <td>Very High</td>
              <td>&gt;90% phrase repetition</td>
              <td>5+</td>
            </tr>
            <tr>
              <td className="text-red-400">LIKELY_AUTONOMOUS</td>
              <td>High</td>
              <td>Fast + 24/7 + high volume</td>
              <td>10+</td>
            </tr>
            <tr>
              <td className="text-orange-400">POSSIBLY_AUTOMATED</td>
              <td>Medium</td>
              <td>Fast or consistent timing</td>
              <td>10+</td>
            </tr>
            <tr>
              <td className="text-green-400">HUMAN_PACED</td>
              <td>Medium</td>
              <td>Slow responses (&gt;5 min)</td>
              <td>5+</td>
            </tr>
            <tr>
              <td className="text-gray-400">INSUFFICIENT_DATA</td>
              <td>N/A</td>
              <td>Too few samples</td>
              <td>N/A</td>
            </tr>
          </tbody>
        </table>
      </section>

      {/* Honest Summary */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-6">Honest Summary</h2>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-6">
            <h3 className="font-semibold text-green-400 mb-3">What We Found</h3>
            <ul className="text-sm space-y-2 text-observatory-muted">
              <li>~4.4% show automation signals (40 accounts)</li>
              <li>~2.3% show moderate signals (21 accounts)</li>
              <li>~85% show human-paced patterns (770 accounts)</li>
              <li>~10% have insufficient data (94 accounts)</li>
            </ul>
          </div>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-6">
            <h3 className="font-semibold text-red-400 mb-3">What We Don't Know</h3>
            <ul className="text-sm space-y-2 text-observatory-muted">
              <li>If any account is "really AI" or "really human"</li>
              <li>If our thresholds are optimal</li>
              <li>If sophisticated actors evade us</li>
              <li>How Moltbook compares to other platforms</li>
            </ul>
          </div>
        </div>

        <div className="mt-6 bg-observatory-card border border-observatory-border rounded-lg p-6">
          <p className="text-observatory-muted">
            <strong>Bottom line:</strong> We observe behavioral patterns. We do not determine identities.
            We see signals, we report signals, we do not claim certainty.
          </p>
        </div>
      </section>

      {/* Future Work */}
      <section>
        <h2 className="text-2xl font-semibold mb-6">Future Improvements (Prioritized)</h2>

        <div className="space-y-4">
          <PriorityCard
            priority="High"
            color="red"
            items={[
              "Inter-annotator validation - 50 accounts labeled by 3 people",
              "Network integration - Graph features harder to spoof than timing"
            ]}
          />
          <PriorityCard
            priority="Medium"
            color="yellow"
            items={[
              "Probabilistic model - Replace heuristics with Bayesian classifier",
              "Timezone estimation - Infer location from activity patterns"
            ]}
          />
          <PriorityCard
            priority="Lower"
            color="green"
            items={[
              "Linguistic entropy - Vocabulary diversity as signal",
              "Temporal autocorrelation - Does timing correlate with server load?"
            ]}
          />
        </div>
      </section>
    </div>
  )
}

function CategoryCard({ name, color, reliability, thresholds, meaning, limitations, samplesNeeded }) {
  const colorClasses = {
    red: 'border-l-red-500',
    orange: 'border-l-orange-500',
    yellow: 'border-l-yellow-500',
    green: 'border-l-green-500',
    purple: 'border-l-purple-500',
    pink: 'border-l-pink-500',
    cyan: 'border-l-cyan-500',
    gray: 'border-l-gray-500',
  }

  return (
    <div className={`bg-observatory-card border border-observatory-border border-l-4 ${colorClasses[color]} rounded-lg p-4`}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-mono font-semibold">{name}</h3>
        <div className="flex gap-2">
          <span className="text-xs px-2 py-1 bg-observatory-border rounded">{samplesNeeded} samples</span>
          <span className="text-sm text-observatory-muted">Reliability: {reliability}</span>
        </div>
      </div>
      <p className="text-sm text-observatory-muted mb-2">
        <strong>Thresholds:</strong> {thresholds}
      </p>
      <p className="text-sm mb-2">{meaning}</p>
      <p className="text-xs text-red-400">
        <strong>Limitations:</strong> {limitations}
      </p>
    </div>
  )
}

function PriorityCard({ priority, color, items }) {
  const colorClasses = {
    red: 'border-red-500/30 bg-red-500/10',
    yellow: 'border-yellow-500/30 bg-yellow-500/10',
    green: 'border-green-500/30 bg-green-500/10',
  }

  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <h3 className="font-semibold mb-2">{priority} Priority</h3>
      <ul className="text-sm space-y-1 text-observatory-muted">
        {items.map((item, i) => (
          <li key={i}>• {item}</li>
        ))}
      </ul>
    </div>
  )
}
