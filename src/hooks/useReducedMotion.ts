import { useState, useEffect } from 'react'

export function useReducedMotion(): boolean {
  const query = '(prefers-reduced-motion: reduce)'
  const [matches, setMatches] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia(query).matches
      : false
  )

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [])

  return matches
}
