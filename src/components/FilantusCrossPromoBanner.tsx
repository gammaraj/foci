'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { isCrossPromoExcludedPath } from '@/lib/ad-excluded-paths'

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
    "url": "https://usefoci.com/app",
    "color": "#0F6E56",
    "iconBg": "#E1F5EE",
    "iconText": "F",
    "taglines": {
      "certstud": {
        "headline": "Focus while you study",
        "sub": "Block distractions while you prep — free to start"
      },
      "collegedecider": {
        "headline": "Deep focus for research",
        "sub": "Foci keeps you in the zone while you compare schools"
      },
      "wanderinghermit": {
        "headline": "Focus while you plan",
        "sub": "Use Foci to power through your research sessions"
      },
      "brakto": {
        "headline": "Stay on top of tasks",
        "sub": "Foci helps organizers manage tasks without the chaos"
      },
      "boostlogik": {
        "headline": "Fewer distractions",
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
        "headline": "Study group brackets",
        "sub": "Bracket any competition — free to start"
      },
      "certstud": {
        "headline": "Study group brackets",
        "sub": "Organize cert study brackets with your team"
      },
      "collegedecider": {
        "headline": "College esports brackets",
        "sub": "Manage student tournaments effortlessly"
      },
      "wanderinghermit": {
        "headline": "Bracket quiz nights",
        "sub": "The easiest way to run any competition"
      },
      "boostlogik": {
        "headline": "Tournament brackets",
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
        "headline": "Prep 100+ certs",
        "sub": "Prep for 100+ certifications on CertStud"
      },
      "brakto": {
        "headline": "IT & business certs",
        "sub": "95% pass rate on 100+ IT & business certs"
      },
      "collegedecider": {
        "headline": "Certs for college apps",
        "sub": "CertStud helps students stand out — free access"
      },
      "wanderinghermit": {
        "headline": "Study on the go",
        "sub": "100+ certifications, adaptive learning, 95% pass rate"
      },
      "boostlogik": {
        "headline": "Add a marketing cert",
        "sub": "CertStud — adaptive prep for 100+ certifications"
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
        "headline": "AI college matching",
        "sub": "CollegeDecider — AI-matched to 5,000+ schools, free"
      },
      "brakto": {
        "headline": "Find the right college",
        "sub": "CollegeDecider finds your best match — free to use"
      },
      "certstud": {
        "headline": "College vs certs ROI",
        "sub": "Compare ROI with CollegeDecider's free calculator"
      },
      "wanderinghermit": {
        "headline": "Study abroad matching",
        "sub": "AI-matched to 5,000+ programs worldwide"
      },
      "boostlogik": {
        "headline": "AI college matching",
        "sub": "Free AI college matching for 5,000+ schools"
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
        "headline": "AI search visibility",
        "sub": "BoostLogik audits 50+ SEO factors in 30 seconds"
      },
      "brakto": {
        "headline": "Get found on Google",
        "sub": "BoostLogik — full SEO audit in 30 seconds, free"
      },
      "certstud": {
        "headline": "Rank in AI search",
        "sub": "BoostLogik audits for ChatGPT & Claude visibility"
      },
      "collegedecider": {
        "headline": "Get found by schools",
        "sub": "50+ SEO checks, AI visibility, 30-second audit"
      },
      "wanderinghermit": {
        "headline": "AI-discoverable content",
        "sub": "BoostLogik — SEO + AI visibility audit, free to start"
      }
    }
  },
  {
    "id": "foci-hook-pomodoro",
    "name": "Foci",
    "url": "https://usefoci.com/app",
    "color": "#0F6E56",
    "iconBg": "#E1F5EE",
    "iconText": "F",
    "taglines": {
      "certstud": {
        "headline": "Free Pomodoro timer",
        "sub": "Timer + tasks + brown noise — free to start"
      },
      "collegedecider": {
        "headline": "Pomodoro for research",
        "sub": "Stay on task while comparing schools"
      },
      "wanderinghermit": {
        "headline": "Pomodoro for trips",
        "sub": "Focused sessions while you research destinations"
      },
      "brakto": {
        "headline": "Pomodoro for organizers",
        "sub": "Knock out tournament tasks in timed sprints"
      },
      "boostlogik": {
        "headline": "Pomodoro for SEO",
        "sub": "Protect deep work while you audit sites"
      }
    }
  },
  {
    "id": "foci-hook-students",
    "name": "Foci",
    "url": "https://usefoci.com/app",
    "color": "#0F6E56",
    "iconBg": "#E1F5EE",
    "iconText": "F",
    "taglines": {
      "certstud": {
        "headline": "Focus apps for students",
        "sub": "Free timers ranked for cert prep & exams"
      },
      "collegedecider": {
        "headline": "Focus apps for students",
        "sub": "Timer + tasks for application season"
      },
      "wanderinghermit": {
        "headline": "Focus apps for students",
        "sub": "Study sprints while you plan campus visits"
      },
      "brakto": {
        "headline": "Focus apps for students",
        "sub": "Free study timers ranked for organizers"
      },
      "boostlogik": {
        "headline": "Focus apps for students",
        "sub": "Free deep-work tools ranked for learners"
      }
    }
  },
  {
    "id": "foci-hook-adhd",
    "name": "Foci",
    "url": "https://usefoci.com/app",
    "color": "#0F6E56",
    "iconBg": "#E1F5EE",
    "iconText": "F",
    "taglines": {
      "certstud": {
        "headline": "ADHD focus strategies",
        "sub": "Timers, brown noise, and task chunking"
      },
      "collegedecider": {
        "headline": "ADHD focus for apps",
        "sub": "Systems that work with your brain"
      },
      "wanderinghermit": {
        "headline": "ADHD focus strategies",
        "sub": "External structure for planning and deep work"
      },
      "brakto": {
        "headline": "ADHD focus strategies",
        "sub": "External timers and task systems for organizers"
      },
      "boostlogik": {
        "headline": "ADHD focus strategies",
        "sub": "Build momentum on complex SEO tasks"
      }
    }
  }
]

/** Group Foci hook variants into one product slot; BoostLogik always last. */
function productKey(id: string): string {
  if (id === 'foci' || id.startsWith('foci-')) return 'foci'
  return id
}

function collapseToUniqueProducts(ads: FilantusAd[], randomize = false): FilantusAd[] {
  const byKey = new Map<string, FilantusAd[]>()
  for (const ad of ads) {
    const key = productKey(ad.id)
    const list = byKey.get(key) ?? []
    list.push(ad)
    byKey.set(key, list)
  }
  const keys = [...byKey.keys()].filter((k) => k !== 'boostlogik')
  if (byKey.has('boostlogik')) keys.push('boostlogik')
  return keys.map((key) => {
    const variants = byKey.get(key)!
    if (randomize && variants.length > 1) {
      return variants[Math.floor(Math.random() * variants.length)]!
    }
    return variants.find((a) => a.id === key) ?? variants[0]!
  })
}

const FALLBACK_ADS: FilantusAd[] = collapseToUniqueProducts(
  FALLBACK_CATALOG
    .filter((a) => productKey(a.id) !== CURRENT_SITE)
    .map((a) => ({
      id: a.id,
      name: a.name,
      url: a.url,
      color: a.color,
      headline: a.taglines?.[CURRENT_SITE]?.headline || '',
      sub: a.taglines?.[CURRENT_SITE]?.sub || '',
    }))
    .filter((a) => a.headline)
)

function bannerHref(adId: string, fallbackUrl: string): string {
  try {
    const url = new URL(fallbackUrl)
    url.searchParams.set('ref', REF)
    url.searchParams.set('utm_source', CURRENT_SITE)
    url.searchParams.set('utm_medium', 'cross_promo')
    url.searchParams.set('utm_content', adId)
    return url.toString()
  } catch {
    const sep = fallbackUrl.includes('?') ? '&' : '?'
    return `${fallbackUrl}${sep}ref=${REF}&utm_source=${CURRENT_SITE}&utm_medium=cross_promo&utm_content=${encodeURIComponent(adId)}`
  }
}

export function FilantusCrossPromoBanner({
  className = '',
  hidden = false,
}: {
  className?: string
  /** Force-hide from a parent when path helper is not enough */
  hidden?: boolean
}) {
  const pathname = usePathname() || ''
  const [ads, setAds] = useState<FilantusAd[]>(FALLBACK_ADS)
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  // Hide on pricing / checkout / login so cross-promo cannot compete with conversion
  const adFreeRoute = isCrossPromoExcludedPath(pathname)

  useEffect(() => {
    if (FALLBACK_ADS.length === 0) return
    const initial = collapseToUniqueProducts(FALLBACK_ADS, true)
    setAds(initial)
    setIndex(0)

    fetch(ADS_URL)
      .then((r) => r.json())
      .then((data: FilantusAdRaw[]) => {
        const pool = collapseToUniqueProducts(
          data
            .filter((a) => productKey(a.id) !== CURRENT_SITE)
            .map((a) => ({
              id: a.id,
              name: a.name,
              url: a.url,
              color: a.color,
              headline: a.taglines?.[CURRENT_SITE]?.headline || '',
              sub: a.taglines?.[CURRENT_SITE]?.sub || '',
            }))
            .filter((a) => a.headline),
          true
        )
        if (pool.length > 0) {
          setAds(pool)
          setIndex(0) // keep BoostLogik last in the Next cycle
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (ads.length <= 1) return
    if (paused) return
    const timer = setInterval(() => {
      setIndex((i) => (i + 1) % ads.length)
    }, 12000)
    return () => clearInterval(timer)
  }, [ads.length, paused])

  const ad = ads[index] || ads[0]
  if (!ad || hidden || adFreeRoute || ads.length === 0) return null

  const href = bannerHref(ad.id, ad.url)
  const showNext = ads.length > 1

  return (
    <div
      id="filantus-banner"
      className={`hidden lg:block shrink-0 ${showNext ? 'w-[224px]' : 'w-[208px]'} ${className}`.trim()}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      role="complementary"
      aria-label="Partner promo"
    >
      <div className="nav-chrome-promo flex items-stretch h-10 box-border rounded-lg overflow-hidden">
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer sponsored"
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
          className="group flex flex-1 min-w-0 items-center gap-1.5 h-full pl-2 pr-1.5"
          style={{ textDecoration: 'none' }}
          title={`${ad.headline} — ${ad.sub}`}
        >
          <span className="flex-1 min-w-0">
            <span className="block text-[12px] font-semibold tracking-tight truncate leading-tight text-slate-700 dark:text-slate-200">
              {ad.name}
            </span>
            <span className="block text-[10px] font-medium truncate leading-tight text-slate-500 dark:text-slate-400">
              {ad.headline}
            </span>
          </span>
          <span className="shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md whitespace-nowrap text-slate-600 dark:text-slate-300 border border-slate-300/80 dark:border-slate-600/70 group-hover:border-blue-400 group-hover:text-blue-700 dark:group-hover:text-blue-300 transition-colors">
            Try
          </span>
        </a>
        {showNext ? (
          <button
            type="button"
            aria-label="Next promo"
            className="shrink-0 w-7 flex items-center justify-center border-l border-dashed border-slate-300/90 dark:border-slate-600/70 text-slate-400 hover:text-slate-700 hover:bg-slate-100/80 dark:hover:text-slate-200 dark:hover:bg-slate-800/60 transition-colors"
            onClick={() => setIndex((i) => (i + 1) % ads.length)}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                stroke="currentColor"
                strokeWidth="2.25"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        ) : null}
      </div>
    </div>
  )
}
