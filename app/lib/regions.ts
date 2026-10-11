// The eight fire-prone regions shown in the app.
// `photoTitle` is the exact file name of a real photo on Wikimedia Commons.
// The photo itself (and its author + licence) is loaded live from Wikimedia, see commons.ts.

export type Region = {
  country: string
  continent: string
  lat: number
  lng: number
  zoom: number
  season: string
  why: string
  photoTitle: string
}

export const REGIONS: Region[] = [
  {
    country: 'Brazil',
    continent: 'S. America',
    lat: -10.5,
    lng: -55.5,
    zoom: 5,
    season: 'Peaks August to October (dry season)',
    why: 'Farmers and ranchers burn land to clear it, and in dry years the fires spread into the Amazon rainforest and the Cerrado savanna.',
    photoTitle:
      'File:Queimada em Canutama, AM, ás margens da Rodovia Transamazônica Activelly burning fire yesterday at Canutama, along Transamazônica "highway" (48551456541).jpg',
  },
  {
    country: 'Australia',
    continent: 'Oceania',
    lat: -25.2,
    lng: 133.8,
    zoom: 4,
    season: 'North: April to October. South-east: October to March',
    why: 'Dry grass and eucalyptus forests burn easily. The northern savanna burns every year, and the southern bushfires get worse in hot, dry summers.',
    photoTitle: 'File:2019 Black Summer Bushfires from Blue Mountains, New South Wales 03.jpg',
  },
  {
    country: 'Indonesia',
    continent: 'Asia',
    lat: -2.5,
    lng: 113.7,
    zoom: 5,
    season: 'Peaks August to October',
    why: 'Peat swamps are drained and burned for farming. Peat can smoulder underground for weeks and makes thick smoke called haze.',
    photoTitle: 'File:Peatland Forest fires.jpg',
  },
  {
    country: 'DRC',
    continent: 'Africa',
    lat: -4.5,
    lng: 21.8,
    zoom: 5,
    season: 'South of the equator: June to September',
    why: 'Savanna grass is burned every dry season to farm and hunt. Central Africa has more fires than any other region on Earth.',
    photoTitle: 'File:Fires in Central and Southern Africa (9516).jpg',
  },
  {
    country: 'Madagascar',
    continent: 'Africa',
    lat: -19.9,
    lng: 46.9,
    zoom: 6,
    season: 'Peaks August to November',
    why: 'Farmers use slash-and-burn ("tavy") to clear land, and grassland fires spread across the highlands.',
    photoTitle: 'File:Slash and Burn Agriculture, Morondava, Madagascar.jpg',
  },
  {
    country: 'Canada',
    continent: 'N. America',
    lat: 60.5,
    lng: -96.0,
    zoom: 4,
    season: 'May to September',
    why: 'Huge boreal forests catch fire from lightning and people. Hot, dry summers are making the fire seasons longer.',
    photoTitle: "File:Smoke and fire from Fort McMurray wildfire, from plane's view.jpg",
  },
  {
    country: 'Russia',
    continent: 'Europe',
    lat: 62.0,
    lng: 105.0,
    zoom: 4,
    season: 'April to September',
    why: 'Siberia has the largest forest on Earth. Fires there are often too remote to fight and can burn for months.',
    photoTitle: 'File:Wildefires in Siberia in 2012.JPG',
  },
  {
    country: 'India',
    continent: 'Asia',
    lat: 29.8,
    lng: 75.8,
    zoom: 6,
    season: 'Crop burning: October to November. Forest fires: March to June',
    why: 'After the rice harvest, farmers in Punjab and Haryana burn the leftover straw to clear their fields, and the smoke drifts over Delhi.',
    photoTitle: 'File:NP India burning 48 (6315309342).jpg',
  },
]
