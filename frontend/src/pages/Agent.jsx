import AgentWidget from '../components/AgentWidget';

export default function Agent() {
  return (
    <div className="page max-w-5xl">
      <div className="pagehead">
        <div>
          <span className="badge">Voice & Chat Helper</span>
          <h1>Ask AgriSync</h1>
          <p>Ask in Hindi or English: "Kanpur mein wheat ka mandi rate kya hai?"</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-5">
        <div className="card">
          <h3 className="font-bold text-lg">What you can ask</h3>
          <ul className="list-disc ml-5 mt-3 text-gray-600 space-y-2">
            <li>Today's crop price at any market.</li>
            <li>How to book a hub pickup slot and get your ticket.</li>
            <li>How to buy crops as a customer.</li>
            <li>Speak your question and hear the answer back.</li>
          </ul>
        </div>
        <AgentWidget embedded />
      </div>
    </div>
  );
}
