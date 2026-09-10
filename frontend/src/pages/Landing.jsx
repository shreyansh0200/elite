import { Link } from 'react-router-dom';
import { ArrowRight, BarChart3, ShieldCheck, Truck, Mic2 } from 'lucide-react';

export default function Landing() {
  return (
    <main>
      <section className="hero">
        <div>
          <span className="badge">Sell to the Hub. Buy Direct.</span>
          <h1>
            Sell smarter. Buy directly. <span>Know the mandi rate.</span>
          </h1>
          <p>
            AgriSync connects farmers, hubs and customers directly — with fair mandi
            prices and a voice assistant that speaks your language.
          </p>
          <div className="flex gap-3 flex-wrap">
            <Link to="/register" className="btn-primary">
              Get Started <ArrowRight className="inline w-4" />
            </Link>
            <Link to="/mandi" className="btn-secondary">
              Check Mandi Rates
            </Link>
          </div>
        </div>

        <div className="hero-card">
          <BarChart3 />
          <h3>How it works</h3>
          <p>List your crop → book an open pickup slot → get your ticket → sell at the hub.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <b>Simple steps</b>
              <small>Farmer · Hub · Customer</small>
            </div>
            <div>
              <b>Voice Help</b>
              <small>Hindi & English</small>
            </div>
          </div>
        </div>
      </section>

      <section className="grid md:grid-cols-3 gap-5 max-w-6xl mx-auto px-4 pb-14">
        <Feature
          icon={<ShieldCheck />}
          title="Safe & Secure"
          text="Your account is protected, whether you're a farmer, hub manager, or customer."
        />
        <Feature
          icon={<Truck />}
          title="Easy Selling"
          text="List your crop, pick a time slot, and track your sale — all in a few taps."
        />
        <Feature
          icon={<Mic2 />}
          title="Voice Help"
          text="Just ask for today's crop price by voice, in Hindi or English, and hear the answer."
        />
      </section>
    </main>
  );
}

function Feature({ icon, title, text }) {
  return (
    <div className="card">
      <div className="iconbox">{icon}</div>
      <h3 className="font-bold text-lg mt-3">{title}</h3>
      <p className="text-gray-500 mt-1">{text}</p>
    </div>
  );
}
