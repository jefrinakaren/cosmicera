// Real photographs from Wikimedia Commons. Each photo comes with its author and licence,
// which we always show next to it.

export type CommonsPhoto = {
  url: string
  page: string
  artist: string
  license: string
  description: string
}

function plainText(html: string): string {
  if (!html) return ''
  // DOMParser does not run scripts or load images, so it is safe for text extraction
  return new DOMParser().parseFromString(html, 'text/html').body.textContent?.trim() ?? ''
}

export async function fetchCommonsPhotos(titles: string[]): Promise<Record<string, CommonsPhoto>> {
  const api =
    'https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=900&format=json&origin=*&titles=' +
    encodeURIComponent(titles.join('|'))
  const res = await fetch(api)
  if (!res.ok) throw new Error('Wikimedia request failed')
  const json = await res.json()
  const result: Record<string, CommonsPhoto> = {}
  for (const page of Object.values<any>(json?.query?.pages ?? {})) {
    const info = page?.imageinfo?.[0]
    if (!info) continue
    const meta = info.extmetadata ?? {}
    result[page.title] = {
      url: info.thumburl || info.url,
      page: info.descriptionurl,
      artist: plainText(meta.Artist?.value) || 'Unknown author',
      license: meta.LicenseShortName?.value || 'See source',
      description: plainText(meta.ImageDescription?.value).slice(0, 160),
    }
  }
  return result
}
