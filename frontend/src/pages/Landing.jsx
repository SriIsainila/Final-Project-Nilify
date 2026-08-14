import { Link } from 'react-router-dom'
import { BellRing, CheckCircle2, Link2, MailCheck, ScanEye } from 'lucide-react'

const steps = [
  {
    icon: Link2,
    title: 'Paste the product link',
    desc: 'Copy any product URL from Daraz, Amazon, or your favourite store and drop it in.',
  },
  {
    icon: ScanEye,
    title: 'We watch it for you',
    desc: 'Nilify checks the price and stock status on a schedule, quietly, in the background.',
  },
  {
    icon: MailCheck,
    title: 'Get notified when it changes',
    desc: 'An e-mail or system alert arrives when your selected product information changes.',
  },
]

const stars = [
  { x: '4%', y: '18%', size: 5, delay: '0s', duration: '7s' },
  { x: '12%', y: '72%', size: 3, delay: '-2s', duration: '8s' },
  { x: '25%', y: '9%', size: 4, delay: '-4s', duration: '9s' },
  { x: '43%', y: '82%', size: 5, delay: '-1s', duration: '10s' },
  { x: '58%', y: '14%', size: 3, delay: '-5s', duration: '7s' },
  { x: '72%', y: '75%', size: 4, delay: '-3s', duration: '9s' },
  { x: '86%', y: '12%', size: 5, delay: '-6s', duration: '11s' },
  { x: '95%', y: '60%', size: 3, delay: '-2s', duration: '8s' },
]

export default function Landing() {
  return (
    <div>
      {/* Hero */}
      <section className="landing-hero max-w-6xl mx-auto px-6 pt-20 pb-24 grid md:grid-cols-2 gap-12 items-center">
        <div className="star-field" aria-hidden="true">
          {stars.map((star, index) => (
            <span
              key={index}
              className="moving-star"
              style={{
                '--star-x': star.x,
                '--star-y': star.y,
                '--star-size': `${star.size}px`,
                '--star-delay': star.delay,
                '--star-duration': star.duration,
              }}
            />
          ))}
        </div>

        <div className="relative z-10">
          <p className="inline-block text-xs font-semibold tracking-widest uppercase text-gold bg-gold/10 px-3 py-1 rounded-full mb-6">
            Never overpay again
          </p>
          <h1 className="font-display text-5xl md:text-6xl font-extrabold leading-[1.05] mb-6">
            Watch prices.
            <br />
            <span className="text-gold">Not screens.</span>
          </h1>
          <p className="text-muted text-lg mb-8 max-w-md">
            Paste any product link and Nilify tells you the moment the price drops
            or it's back in stock — so you never have to check manually again.
          </p>
          <div className="flex gap-3">
            <Link
              to="/register"
              className="bg-gold text-night font-semibold px-6 py-3 rounded-full hover:bg-gold-soft transition-colors focus-ring"
            >
              Start tracking, free
            </Link>
            <a
              href="#how-it-works"
              className="border border-ink/20 px-6 py-3 rounded-full hover:border-gold transition-colors focus-ring"
            >
              See how it works
            </a>
          </div>
        </div>

        <div className="hero-visual relative z-10">
          <div className="hero-image-frame">
            <img
              src="/smart-shopping-hero.png"
              alt="A shopper ordering a product using a smart price tracking system"
              className="hero-shopping-image"
            />
          </div>

          <div className="hero-alert hero-alert-top" aria-hidden="true">
            <span className="hero-alert-icon"><BellRing size={16} /></span>
            <span>
              <strong>Price drop detected</strong>
              <small>Your tracked item just changed</small>
            </span>
          </div>

          <div className="hero-alert hero-alert-bottom" aria-hidden="true">
            <span className="hero-alert-icon hero-alert-icon-check"><CheckCircle2 size={16} /></span>
            <span>
              <strong>Smart tracking active</strong>
              <small>We keep watching for you</small>
            </span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="max-w-6xl mx-auto px-6 py-20 border-t border-ink/10">
        <h2 className="font-display text-3xl font-bold mb-2">How it works</h2>
        <p className="text-muted mb-12">Three steps, then Nilify does the watching.</p>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map(({ icon: Icon, title, desc }) => (
            <div key={title}>
              <div className="w-11 h-11 rounded-xl bg-night-surface border border-ink/10 shadow-sm flex items-center justify-center mb-4">
                <Icon size={20} className="text-gold" />
              </div>
              <h3 className="font-display font-semibold text-lg mb-2">{title}</h3>
              <p className="text-muted text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-6 py-20 border-t border-ink/10 text-center">
        <h2 className="font-display text-3xl font-bold mb-4">Ready to stop checking prices by hand?</h2>
        <Link
          to="/register"
          className="inline-block bg-gold text-night font-semibold px-8 py-3 rounded-full hover:bg-gold-soft transition-colors focus-ring"
        >
          Create your free account
        </Link>
      </section>
    </div>
  )
}
