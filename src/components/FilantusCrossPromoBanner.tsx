'use client'

import { useEffect, useState } from 'react'

const ADS_URL = 'https://filantus.com/cross-promo/ads.json'
const CURRENT_SITE = 'foci' as const
const REF = 'foci-header'

interface FilantusAdRaw {
  id: string
  name: string
  url: string
  color: string
  iconBg?: string
  iconText?: string
  taglines: Record<string, { headline: string; sub: string }>
}

interface FilantusAd {
  id: string
  name: string
  url: string
  color: string
  headline: string
  sub: string
}

/** Offline fallback — mirrors filantus.com/cross-promo/ads.json. */
const FALLBACK_CATALOG: FilantusAdRaw[] = [
  {
    "id": "foci",
    "name": "Foci",
    "url": "https://usefoci.com",
    "color": "#0F6E56",
    "iconBg": "#E1F5EE",
    "iconText": "F",
    "taglines": {
      "certstud": {
        "headline": "Studying for your cert? Stay focused with Foci",
        "sub": "Block distractions while you prep \u2014 free to start"
      },
      "collegedecider": {
        "headline": "Deep research sessions need deep focus",
        "sub": "Foci keeps you in the zone while you compare schools"
      },
      "wanderinghermit": {
        "headline": "Planning a big trip? Focus helps",
        "sub": "Use Foci to power through your research sessions"
      },
      "brakto": {
        "headline": "Running a tournament? Stay on top of it",
        "sub": "Foci helps organizers manage tasks without the chaos"
      },
      "boostlogik": {
        "headline": "Audit faster with fewer distractions",
        "sub": "Pair BoostLogik insights with Foci focus sessions"
      }
    }
  },
  {
    "id": "brakto",
    "name": "Brakto",
    "url": "https://brakto.com",
    "color": "#185FA5",
    "iconBg": "#E6F1FB",
    "iconText": "B",
    "taglines": {
      "foci": {
        "headline": "Run study group tournaments? Try Brakto",
        "sub": "Bracket any competition \u2014 free to start"
      },
      "certstud": {
        "headline": "Study groups & competitions? Try Brakto",
        "sub": "Organize cert study brackets with your team"
      },
      "collegedecider": {
        "headline": "College esports programs? Track them in Brakto",
        "sub": "Manage student tournaments effortlessly"
      },
      "wanderinghermit": {
        "headline": "Travel quiz nights? Bracket them with Brakto",
        "sub": "The easiest way to run any competition"
      },
      "boostlogik": {
        "headline": "Gaming clients? Help them with Brakto",
        "sub": "Tournament management, zero setup headaches"
      }
    }
  },
  {
    "id": "certstud",
    "name": "CertStud",
    "url": "https://certstud.com",
    "color": "#854F0B",
    "iconBg": "#FAEEDA",
    "iconText": "C",
    "taglines": {
      "foci": {
        "headline": "Level up your skills while staying focused",
        "sub": "Prep for 100+ certifications on CertStud"
      },
      "brakto": {
        "headline": "Esports pros need certs too \u2014 try CertStud",
        "sub": "95% pass rate on 100+ IT & business certs"
      },
      "collegedecider": {
        "headline": "Boost your college app with certifications",
        "sub": "CertStud helps students stand out \u2014 free access"
      },
      "wanderinghermit": {
        "headline": "Travel downtime? Study for your next cert",
        "sub": "100+ certifications, adaptive learning, 95% pass rate"
      },
      "boostlogik": {
        "headline": "Add a marketing cert to your SEO skills",
        "sub": "CertStud \u2014 adaptive prep for 100+ certifications"
      }
    }
  },
  {
    "id": "collegedecider",
    "name": "CollegeDecider",
    "url": "https://collegedecider.com",
    "color": "#993556",
    "iconBg": "#FBEAF0",
    "iconText": "CD",
    "taglines": {
      "foci": {
        "headline": "Helping a student with college apps?",
        "sub": "CollegeDecider \u2014 AI-matched to 5,000+ schools, free"
      },
      "brakto": {
        "headline": "Student athletes need the right college",
        "sub": "CollegeDecider finds your best match \u2014 free to use"
      },
      "certstud": {
        "headline": "Choosing between college and certs?",
        "sub": "Compare ROI with CollegeDecider's free calculator"
      },
      "wanderinghermit": {
        "headline": "Studying abroad? Start with CollegeDecider",
        "sub": "AI-matched to 5,000+ programs worldwide"
      },
      "boostlogik": {
        "headline": "Education clients? Send them to CollegeDecider",
        "sub": "Free AI college matching for 5,000+ schools"
      }
    }
  },
  {
    "id": "wanderinghermit",
    "name": "WanderingHermit",
    "url": "https://wanderinghermit.com",
    "color": "#3B6D11",
    "iconBg": "#EAF3DE",
    "iconText": "W",
    "taglines": {
      "foci": {
        "headline": "You earned that focus session \u2014 plan a trip",
        "sub": "WanderingHermit builds your perfect itinerary, free"
      },
      "brakto": {
        "headline": "Host international tournaments? Plan the trip too",
        "sub": "WanderingHermit \u2014 AI travel planning, free to use"
      },
      "certstud": {
        "headline": "Pass your cert? Celebrate with a trip",
        "sub": "WanderingHermit plans it \u2014 100+ destinations"
      },
      "collegedecider": {
        "headline": "Campus visits made easy with WanderingHermit",
        "sub": "AI-powered travel planning for your college tour"
      },
      "boostlogik": {
        "headline": "Travel clients? WanderingHermit has you covered",
        "sub": "AI itineraries for 100+ destinations, free"
      }
    }
  },
  {
    "id": "boostlogik",
    "name": "BoostLogik",
    "url": "https://boostlogik.com",
    "color": "#534AB7",
    "iconBg": "#EEEDFE",
    "iconText": "BL",
    "taglines": {
      "foci": {
        "headline": "Is your app visible to AI search?",
        "sub": "BoostLogik audits 50+ SEO factors in 30 seconds"
      },
      "brakto": {
        "headline": "Get your tournament found on Google & AI",
        "sub": "BoostLogik \u2014 full SEO audit in 30 seconds, free"
      },
      "certstud": {
        "headline": "Rank higher in AI-powered search results",
        "sub": "BoostLogik audits for ChatGPT & Claude visibility"
      },
      "collegedecider": {
        "headline": "Help schools find you \u2014 optimize with BoostLogik",
        "sub": "50+ SEO checks, AI visibility, 30-second audit"
      },
      "wanderinghermit": {
        "headline": "Make your travel content AI-discoverable",
        "sub": "BoostLogik \u2014 SEO + AI visibility audit, free to start"
      }
    }
  },
  {
    "id": "foci-blog-pomodoro",
    "name": "Foci Guide",
    "url": "https://usefoci.com/blog/best-free-pomodoro-apps-2026",
    "color": "#0F6E56",
    "iconBg": "#E1F5EE",
    "iconText": "F",
    "taglines": {
      "certstud": {
        "headline": "Best free Pomodoro apps ranked (2026)",
        "sub": "Timer + tasks + brown noise \u2014 no signup"
      },
      "collegedecider": {
        "headline": "Best free Pomodoro apps for deep research",
        "sub": "Stay on task while comparing schools"
      },
      "wanderinghermit": {
        "headline": "Best free Pomodoro apps for trip planning",
        "sub": "Focused sessions while you research destinations"
      },
      "brakto": {
        "headline": "Best free Pomodoro apps for organizers",
        "sub": "Knock out tournament tasks in timed sprints"
      },
      "boostlogik": {
        "headline": "Best free Pomodoro apps for SEO work",
        "sub": "Protect deep work while you audit sites"
      }
    }
  },
  {
    "id": "foci-blog-study",
    "name": "Foci Guide",
    "url": "https://usefoci.com/blog/how-to-stay-focused-while-studying",
    "color": "#0F6E56",
    "iconBg": "#E1F5EE",
    "iconText": "F",
    "taglines": {
      "certstud": {
        "headline": "How to stay focused while studying",
        "sub": "7 strategies that work with cert prep"
      },
      "collegedecider": {
        "headline": "How to stay focused while studying",
        "sub": "Evidence-based tips for application season"
      },
      "wanderinghermit": {
        "headline": "How to stay focused while studying",
        "sub": "Use travel downtime for deep study blocks"
      },
      "brakto": {
        "headline": "How to stay focused while studying",
        "sub": "Study sprints between bracket rounds"
      },
      "boostlogik": {
        "headline": "How to stay focused while studying",
        "sub": "Protect attention when learning SEO"
      }
    }
  },
  {
    "id": "foci-blog-adhd",
    "name": "Foci Guide",
    "url": "https://usefoci.com/blog/adhd-focus-strategies",
    "color": "#0F6E56",
    "iconBg": "#E1F5EE",
    "iconText": "F",
    "taglines": {
      "certstud": {
        "headline": "ADHD focus strategies that actually work",
        "sub": "Timers, brown noise, and task chunking"
      },
      "collegedecider": {
        "headline": "ADHD focus strategies for college apps",
        "sub": "Systems that work with your brain"
      },
      "wanderinghermit": {
        "headline": "ADHD focus strategies that actually work",
        "sub": "External structure for planning and deep work"
      },
      "brakto": {
        "headline": "ADHD focus strategies that actually work",
        "sub": "External timers and task systems for organizers"
      },
      "boostlogik": {
        "headline": "ADHD focus strategies that actually work",
        "sub": "Build momentum on complex SEO tasks"
      }
    }
  },
  {
    "id": "foci-blog-music",
    "name": "Foci Guide",
    "url": "https://usefoci.com/blog/best-music-for-studying-and-focus",
    "color": "#0F6E56",
    "iconBg": "#E1F5EE",
    "iconText": "F",
    "taglines": {
      "certstud": {
        "headline": "What music actually helps you focus?",
        "sub": "Brown noise, lo-fi, rain \u2014 ranked for studying"
      },
      "collegedecider": {
        "headline": "What music actually helps you focus?",
        "sub": "Best study sounds for long research sessions"
      },
      "wanderinghermit": {
        "headline": "What music actually helps you focus?",
        "sub": "Focus sounds for planning and booking work"
      },
      "brakto": {
        "headline": "What music actually helps you focus?",
        "sub": "Ambient sounds for deep admin work"
      },
      "boostlogik": {
        "headline": "What music actually helps you focus?",
        "sub": "Brown noise & lo-fi for long audits"
      }
    }
  },
  {
    "id": "foci-blog-students",
    "name": "Foci Guide",
    "url": "https://usefoci.com/blog/best-focus-apps-for-students-2026",
    "color": "#0F6E56",
    "iconBg": "#E1F5EE",
    "iconText": "F",
    "taglines": {
      "certstud": {
        "headline": "Best focus apps for students (2026)",
        "sub": "Free timers ranked for cert prep & exams"
      },
      "collegedecider": {
        "headline": "Best focus apps for students (2026)",
        "sub": "Timer + tasks for application season"
      },
      "wanderinghermit": {
        "headline": "Best focus apps for students (2026)",
        "sub": "Study sprints while you plan campus visits"
      },
      "brakto": {
        "headline": "Best focus apps for students (2026)",
        "sub": "Free study timers ranked for organizers"
      },
      "boostlogik": {
        "headline": "Best focus apps for students (2026)",
        "sub": "Free deep-work tools ranked for learners"
      }
    }
  },
  {
    "id": "foci-blog-noise",
    "name": "Foci Guide",
    "url": "https://usefoci.com/blog/white-noise-vs-brown-noise-for-focus",
    "color": "#0F6E56",
    "iconBg": "#E1F5EE",
    "iconText": "F",
    "taglines": {
      "certstud": {
        "headline": "White noise vs brown noise for focus",
        "sub": "Which study sound wins \u2014 free offline in Foci"
      },
      "collegedecider": {
        "headline": "White noise vs brown noise for focus",
        "sub": "Pick the right sound for long research"
      },
      "wanderinghermit": {
        "headline": "White noise vs brown noise for focus",
        "sub": "Mask distractions while you plan trips"
      },
      "brakto": {
        "headline": "White noise vs brown noise for focus",
        "sub": "Best ambient noise for deep admin work"
      },
      "boostlogik": {
        "headline": "White noise vs brown noise for focus",
        "sub": "Protect long SEO sessions with the right noise"
      }
    }
  }
]

const FALLBACK_ADS: FilantusAd[] = FALLBACK_CATALOG
  .filter((a) => a.id !== CURRENT_SITE)
  .map((a) => ({
    id: a.id,
    name: a.name,
    url: a.url,
    color: a.color,
    headline: a.taglines?.[CURRENT_SITE]?.headline || '',
    sub: a.taglines?.[CURRENT_SITE]?.sub || '',
  }))
  .filter((a) => a.headline)

function bannerHref(_adId: string, fallbackUrl: string): string {
  const sep = fallbackUrl.includes('?') ? '&' : '?'
  return `${fallbackUrl}${sep}ref=${REF}`
}

export function FilantusCrossPromoBanner({
  className = '',
  hidden = false,
}: {
  className?: string
  /** Force-hide (e.g. event pages on Brakto) */
  hidden?: boolean
}) {
  const [ads, setAds] = useState<FilantusAd[]>(FALLBACK_ADS)
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (FALLBACK_ADS.length === 0) return
    setIndex(Math.floor(Math.random() * FALLBACK_ADS.length))

    fetch(ADS_URL)
      .then((r) => r.json())
      .then((data: FilantusAdRaw[]) => {
        const pool = data
          .filter((a) => a.id !== CURRENT_SITE)
          .map((a) => ({
            id: a.id,
            name: a.name,
            url: a.url,
            color: a.color,
            headline: a.taglines?.[CURRENT_SITE]?.headline || '',
            sub: a.taglines?.[CURRENT_SITE]?.sub || '',
          }))
          .filter((a) => a.headline)
        if (pool.length > 0) {
          setAds(pool)
          setIndex(Math.floor(Math.random() * pool.length))
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (ads.length <= 1) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % ads.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [ads.length])

  const ad = ads[index] || ads[0]
  if (!ad || hidden || ads.length === 0) return null

  const href = bannerHref(ad.id, ad.url)

  return (
    <div id="filantus-banner" className={`hidden lg:block shrink-0 w-[380px] ${className}`.trim()}>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => {
          if (typeof window !== 'undefined') {
            const gtag = (window as { gtag?: (...args: unknown[]) => void }).gtag
            gtag?.('event', 'filantus_product_click', {
              event_category: 'cross_promotion',
              event_label: `${ad.id}_${REF}`,
              product: ad.id,
              source: REF,
            })
          }
        }}
        className="flex items-center gap-2 w-[380px] h-9 box-border px-3 rounded-xl border border-slate-200/60 dark:border-slate-700/60 hover:border-slate-300 dark:hover:border-slate-600 transition-[border-color] overflow-hidden bg-white/80 dark:bg-slate-900/40"
        style={{ textDecoration: 'none' }}
        title={`${ad.headline} — ${ad.sub}`}
      >
        <span
          className="shrink-0 w-[7.25rem] text-[13px] font-bold tracking-tight truncate"
          style={{
            color: ad.color,
            fontFamily:
              "system-ui, -apple-system, BlinkMacSystemFont, 'SF Pro', sans-serif",
          }}
        >
          {ad.name}
        </span>
        <span className="flex-1 min-w-0 text-[12px] text-slate-500 dark:text-slate-400 truncate">
          {ad.headline}
        </span>
        <span
          className="shrink-0 text-[11px] px-2 py-0.5 rounded-full whitespace-nowrap"
          style={{ color: ad.color, border: `0.5px solid ${ad.color}44` }}
        >
          {ad.id.startsWith('foci-blog-') ? 'Read →' : 'Try free →'}
        </span>
      </a>
    </div>
  )
}
